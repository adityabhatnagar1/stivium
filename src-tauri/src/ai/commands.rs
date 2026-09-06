use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;

use tauri::{AppHandle, Emitter, Manager, State};

use crate::state::AppState;
use super::credentials;
use super::providers::{anthropic, ollama, openai_compatible, StreamRequest};
use super::types::{AiEvent, ChatMessage};

fn provider_default_base_url(provider: &str) -> &'static str {
    match provider {
        "openai" => "https://api.openai.com/v1",
        "deepseek" => "https://api.deepseek.com/v1",
        "groq" => "https://api.groq.com/openai/v1",
        "gemini" => "https://generativelanguage.googleapis.com/v1beta/openai",
        _ => "",
    }
}

/// Starts a streaming AI request. Returns immediately (after registering
/// the cancellation flag) — all output arrives asynchronously on
/// `ai-event-{request_id}`, exactly like `terminal-data-{id}` and
/// `lsp-data-{id}` already do for their subsystems.
#[tauri::command]
pub async fn run_ai(
    app: AppHandle,
    state: State<'_, AppState>,
    request_id: String,
    provider: String,
    model: String,
    base_url: Option<String>,
    messages: Vec<ChatMessage>,
) -> Result<(), String> {
    let cancel_flag = Arc::new(AtomicBool::new(false));
    {
        let mut flags = state.ai_cancel_flags.lock().map_err(|e| e.to_string())?;
        flags.insert(request_id.clone(), cancel_flag.clone());
    }

    let api_key = if provider == "ollama" {
        None
    } else {
        Some(credentials::get_key(&provider)?)
    };

    let channel = format!("ai-event-{request_id}");
    let app_handle = app.clone();

    let task_request_id = request_id.clone();
    let task_cancel_flag = cancel_flag.clone();

    tauri::async_runtime::spawn(async move {
        let stream_req = StreamRequest {
            api_key,
            base_url: base_url.clone(),
            model: model.clone(),
            messages,
        };

        let emit_chunk = {
            let app_handle = app_handle.clone();
            let channel = channel.clone();
            let cancel_flag = task_cancel_flag.clone();
            move |token: String| {
                if cancel_flag.load(Ordering::SeqCst) {
                    return;
                }
                let _ = app_handle.emit(&channel, AiEvent::Chunk { token });
            }
        };

        let result = match provider.as_str() {
        "openai" | "deepseek" | "groq" | "gemini" => {
            openai_compatible::stream(
                stream_req,
                provider_default_base_url(&provider),
                emit_chunk,
            )
            .await
        }
            "anthropic" => anthropic::stream(stream_req, emit_chunk).await,
            "ollama" => ollama::stream(stream_req, emit_chunk).await,
            other => Err(format!("Unknown AI provider: {other}")),
        };

        let final_event = if task_cancel_flag.load(Ordering::SeqCst) {
            AiEvent::Cancelled
        } else {
            match result {
                Ok(()) => AiEvent::Done,
                Err(message) => AiEvent::Error { message },
            }
        };
        let _ = app_handle.emit(&channel, final_event);

        {
            let state = app_handle.state::<AppState>();
            if let Ok(mut flags) = state.ai_cancel_flags.lock() {
                flags.remove(&task_request_id);
            };
        }
    });

    Ok(())
}

#[tauri::command]
pub fn cancel_ai(state: State<AppState>, request_id: String) -> Result<(), String> {
    let flags = state.ai_cancel_flags.lock().map_err(|e| e.to_string())?;
    if let Some(flag) = flags.get(&request_id) {
        flag.store(true, Ordering::SeqCst);
    }
    Ok(())
}

#[tauri::command]
pub fn save_provider_key(provider: String, api_key: String) -> Result<(), String> {
    credentials::save_key(&provider, &api_key)
}

#[tauri::command]
pub fn delete_provider_key(provider: String) -> Result<(), String> {
    credentials::delete_key(&provider)
}

#[tauri::command]
pub fn has_provider_key(provider: String) -> bool {
    credentials::has_key(&provider)
}