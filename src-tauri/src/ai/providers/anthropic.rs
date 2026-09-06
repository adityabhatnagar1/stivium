use serde::Deserialize;
use serde_json::{json, Value};

use crate::ai::sse::for_each_sse_data;
use super::StreamRequest;

#[derive(Deserialize)]
struct Delta {
    text: Option<String>,
}
#[derive(Deserialize)]
#[serde(tag = "type")]
enum StreamEvent {
    #[serde(rename = "content_block_delta")]
    ContentBlockDelta { delta: Delta },
    #[serde(rename = "message_stop")]
    MessageStop,
    #[serde(other)]
    Other,
}

const DEFAULT_BASE_URL: &str = "https://api.anthropic.com/v1";
const ANTHROPIC_VERSION: &str = "2023-06-01";

pub async fn stream(
    req: StreamRequest,
    mut on_token: impl FnMut(String),
) -> Result<(), String> {
    let api_key = req
        .api_key
        .ok_or_else(|| "No API key configured for Anthropic".to_string())?;
    let base_url = req.base_url.unwrap_or_else(|| DEFAULT_BASE_URL.to_string());
    let url = format!("{}/messages", base_url.trim_end_matches('/'));

    // Anthropic splits a leading "system" message out of the messages
    // array into a top-level `system` field.
    let mut system: Option<String> = None;
    let mut messages: Vec<Value> = Vec::new();
    for m in req.messages {
        if m.role == "system" && system.is_none() {
            system = Some(m.content);
        } else {
            messages.push(json!({ "role": m.role, "content": m.content }));
        }
    }

    let mut body = json!({
        "model": req.model,
        "stream": true,
        "max_tokens": 4096,
        "messages": messages,
    });
    if let Some(sys) = system {
        body["system"] = json!(sys);
    }

    let client = reqwest::Client::new();
    let response = client
        .post(url)
        .header("x-api-key", api_key)
        .header("anthropic-version", ANTHROPIC_VERSION)
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
        let event: StreamEvent = match serde_json::from_str(data) {
            Ok(e) => e,
            Err(_) => return Ok(true),
        };
        match event {
            StreamEvent::ContentBlockDelta { delta } => {
                if let Some(text) = delta.text {
                    on_token(text);
                }
                Ok(true)
            }
            StreamEvent::MessageStop => Ok(false),
            StreamEvent::Other => Ok(true),
        }
    })
    .await
}