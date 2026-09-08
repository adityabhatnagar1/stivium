export type ProviderId =
  | "openai"
  | "anthropic"
  | "deepseek"
  | "groq"
  | "gemini"
  | "ollama";

export const PROVIDER_LABELS: Record<ProviderId, string> = {
  openai: "OpenAI",
  anthropic: "Anthropic (Claude)",
  deepseek: "DeepSeek",
  groq: "Groq",
  gemini: "Google Gemini",
  ollama: "Ollama (local)",
};

// Providers that authenticate with an API key stored in the OS credential
// store. Ollama is intentionally excluded — it's a local server.
export const KEYED_PROVIDERS: ProviderId[] = [
  "openai",
  "anthropic",
  "deepseek",
  "groq",
  "gemini",
];

export type ChatRole = "system" | "user" | "assistant";

export type ChatMessage = {
  role: ChatRole;
  content: string;
};

export type AiSettings = {
  provider?: ProviderId;
  model?: string;
  baseUrl?: string;
};

export type PetPosition = {
  x: number;
  y: number;
};

// Mirrors the Rust `AiEvent` enum's `#[serde(tag = "type", rename_all =
// "camelCase")]` representation exactly: { type: "chunk", token } |
// { type: "done" } | { type: "error", message } | { type: "cancelled" }.
export type AiEvent =
  | { type: "chunk"; token: string }
  | { type: "done" }
  | { type: "error"; message: string }
  | { type: "cancelled" };

// Mirrors Rust `ConversationMessage` / `Conversation`
// (src-tauri/src/ai/types.rs) field-for-field, both under
// `#[serde(rename_all = "camelCase")]`. These are the *persisted* record
// types (id, timestamps, optional context label) — distinct from the
// ephemeral `ChatMessage` shape actually sent to a provider on `run_ai`.
export type ConversationMessage = {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: number;
  contextLabel?: string;
  incomplete?: boolean;
};

export type Conversation = {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ConversationMessage[];
};
