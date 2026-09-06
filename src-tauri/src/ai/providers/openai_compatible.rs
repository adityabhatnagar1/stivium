use serde::Deserialize;
use serde_json::json;

use crate::ai::sse::for_each_sse_data;
use crate::ai::types::AiEvent;
use super::StreamRequest;

#[derive(Deserialize)]
struct ChunkChoiceDelta {
    content: Option<String>,
}
#[derive(Deserialize)]
struct ChunkChoice {
    delta: ChunkChoiceDelta,
}
#[derive(Deserialize)]
struct Chunk {
    choices: Vec<ChunkChoice>,
}

pub async fn stream(
    req: StreamRequest,
    default_base_url: &str,
    mut on_token: impl FnMut(String),
) -> Result<(), String> {
    let api_key = req
        .api_key
        .ok_or_else(|| "No API key configured for this provider".to_string())?;
    let base_url = req.base_url.unwrap_or_else(|| default_base_url.to_string());
    let url = format!("{}/chat/completions", base_url.trim_end_matches('/'));

    let body = json!({
        "model": req.model,
        "stream": true,
        "messages": req.messages,
    });

    let client = reqwest::Client::new();
    let response = client
        .post(url)
        .bearer_auth(api_key)
        .json(&body)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(format!("Provider returned {status}: {text}"));
    }

    for_each_sse_data(response, |data| {
        let chunk: Chunk = match serde_json::from_str(data) {
            Ok(c) => c,
            // Some providers interleave non-chunk keepalive events; skip
            // anything that doesn't parse as a chat chunk instead of
            // failing the whole stream.
            Err(_) => return Ok(true),
        };
        if let Some(choice) = chunk.choices.into_iter().next() {
            if let Some(text) = choice.delta.content {
                on_token(text);
            }
        }
        Ok(true)
    })
    .await
}

pub fn emit_error(message: String) -> AiEvent {
    AiEvent::Error { message }
}