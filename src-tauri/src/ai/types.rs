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

/// One persisted turn in a conversation. Unlike `ChatMessage` (which is
/// the ephemeral, provider-agnostic payload sent to `run_ai`), this is
/// the durable record shown in the conversation history — it carries an
/// id (for React keys / targeted updates) and an optional human-readable
/// context label ("Attached: adder.v, selection (12 lines)") instead of
/// embedding the raw file content, so history stays compact even though
/// the actual system-context block is rebuilt fresh on every `run_ai`
/// call from whatever is active in the editor *at send time*.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ConversationMessage {
    pub id: String,
    pub role: String,
    pub content: String,
    pub created_at: i64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub context_label: Option<String>,
    /// True only for a message that was cut short by cancellation or a
    /// mid-stream error, so the UI can label a persisted partial answer
    /// honestly instead of presenting it as a complete response.
    #[serde(default, skip_serializing_if = "std::ops::Not::not")]
    pub incomplete: bool,
}

/// A full conversation thread, persisted whole (see `conversations.rs`).
/// `updated_at` drives sidebar ordering (most-recently-active first).
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Conversation {
    pub id: String,
    pub title: String,
    pub created_at: i64,
    pub updated_at: i64,
    pub messages: Vec<ConversationMessage>,
}