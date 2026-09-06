pub mod anthropic;
pub mod ollama;
pub mod openai_compatible;

use crate::ai::types::ChatMessage;

/// Everything a provider adapter needs to run one streaming request.
/// `on_token` is called once per text delta; adapters must not buffer the
/// whole response before calling it, or the "no fake streaming" rule in
/// the report is violated in spirit even without a fake timer.
pub struct StreamRequest {
    pub api_key: Option<String>,
    pub base_url: Option<String>,
    pub model: String,
    pub messages: Vec<ChatMessage>,
}