use futures_util::StreamExt;
use reqwest::Response;

/// Consumes an SSE HTTP response body, calling `on_data` with each event's
/// raw `data:` payload (already stripped of the `data: ` prefix). Ignores
/// non-`data:` lines (`event:`, `id:`, comments, blank lines). Stops early,
/// without error, on an OpenAI/Anthropic-style `[DONE]` sentinel — callers
/// that don't get one (Anthropic uses `message_stop` instead) simply loop
/// until the stream naturally ends.
pub async fn for_each_sse_data<F>(response: Response, mut on_data: F) -> Result<(), String>
where
    F: FnMut(&str) -> Result<bool, String>,
{
    let mut stream = response.bytes_stream();
    let mut buffer = String::new();

    while let Some(chunk) = stream.next().await {
        let chunk = chunk.map_err(|e| e.to_string())?;
        buffer.push_str(&String::from_utf8_lossy(&chunk));

        while let Some(newline_pos) = buffer.find('\n') {
            let line = buffer[..newline_pos].trim_end_matches('\r').to_string();
            buffer.drain(..=newline_pos);

            let Some(data) = line.strip_prefix("data: ").or_else(|| line.strip_prefix("data:"))
            else {
                continue;
            };
            let data = data.trim();
            if data.is_empty() {
                continue;
            }
            if data == "[DONE]" {
                return Ok(());
            }
            if !on_data(data)? {
                return Ok(());
            }
        }
    }

    Ok(())
}