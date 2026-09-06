use futures_util::StreamExt;
use serde::Deserialize;
use serde_json::json;

use super::StreamRequest;

#[derive(Deserialize)]
struct OllamaMessage {
    content: String,
}
#[derive(Deserialize)]
struct OllamaChunk {
    message: Option<OllamaMessage>,
    done: bool,
}

const DEFAULT_BASE_URL: &str = "http://localhost:11434";

pub async fn stream(
    req: StreamRequest,
    mut on_token: impl FnMut(String),
) -> Result<(), String> {
    let base_url = req.base_url.unwrap_or_else(|| DEFAULT_BASE_URL.to_string());
    let url = format!("{}/api/chat", base_url.trim_end_matches('/'));

    let body = json!({
        "model": req.model,
        "stream": true,
        "messages": req.messages,
    });

    let client = reqwest::Client::new();
    let response = client
        .post(url)
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Could not reach Ollama at {base_url}: {e}"))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(format!("Ollama returned {status}: {text}"));
    }

    let mut stream = response.bytes_stream();
    let mut buffer = String::new();

    while let Some(chunk) = stream.next().await {
        let chunk = chunk.map_err(|e| e.to_string())?;
        buffer.push_str(&String::from_utf8_lossy(&chunk));

        while let Some(newline_pos) = buffer.find('\n') {
            let line = buffer[..newline_pos].trim().to_string();
            buffer.drain(..=newline_pos);
            if line.is_empty() {
                continue;
            }

            let parsed: OllamaChunk = match serde_json::from_str(&line) {
                Ok(c) => c,
                Err(_) => continue,
            };
            if let Some(msg) = parsed.message {
                if !msg.content.is_empty() {
                    on_token(msg.content);
                }
            }
            if parsed.done {
                return Ok(());
            }
        }
    }

    Ok(())
}