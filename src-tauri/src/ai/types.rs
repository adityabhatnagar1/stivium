use serde::{Deserialize, Serialize};

/// One turn in the conversation sent to a provider. `role` is
/// provider-agnostic ("system" | "user" | "assistant"); each provider
/// adapter maps it to that provider's own wire format.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatMessage {
    pub role: String,
    pub content: String,
}

/// Normalized stream event emitted to the frontend on
/// `ai-event-{request_id}`. Every provider adapter, regardless of its wire
/// protocol (OpenAI-style SSE, Anthropic-style SSE, Ollama NDJSON), is
/// funneled down to exactly these four variants.
#[derive(Debug, Clone, Serialize)]
#[serde(tag = "type", rename_all = "camelCase")]
pub enum AiEvent {
    Chunk { token: String },
    Done,
    Error { message: String },
    Cancelled,
}

/// Non-secret AI configuration, persisted in `preferences.json` alongside
/// `lastWorkspacePath`. The API key is never part of this struct — it
/// lives in the OS credential store (see `credentials.rs`).
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct AiSettings {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub provider: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub model: Option<String>,
    #[serde(rename = "baseUrl", skip_serializing_if = "Option::is_none")]
    pub base_url: Option<String>,
}

/// Position persisted for the floating pet, also stored in
/// `preferences.json`.
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub struct PetPosition {
    pub x: f64,
    pub y: f64,
}