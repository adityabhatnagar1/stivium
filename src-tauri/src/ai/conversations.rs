use std::fs;
use std::path::PathBuf;

use tauri::{AppHandle, Manager};

use super::types::Conversation;

/// Conversations are intentionally kept in their own file, separate from
/// `preferences.json`. Preferences are small and rewritten wholesale on
/// every change; conversation history can grow much larger over the
/// life of the app, and mixing the two would mean every message sent
/// rewrites unrelated settings data too.
fn conversations_path(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;

    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;

    Ok(dir.join("conversations.json"))
}

fn read_all(app: &AppHandle) -> Vec<Conversation> {
    let Ok(path) = conversations_path(app) else {
        return Vec::new();
    };

    let Ok(content) = fs::read_to_string(path) else {
        return Vec::new();
    };

    serde_json::from_str(&content).unwrap_or_default()
}

fn write_all(app: &AppHandle, conversations: &[Conversation]) -> Result<(), String> {
    let path = conversations_path(app)?;

    let content =
        serde_json::to_string_pretty(conversations).map_err(|e| e.to_string())?;

    fs::write(path, content).map_err(|e| e.to_string())
}

/// Returns every persisted conversation, most-recently-updated first.
/// The frontend keeps this whole list in memory (bounded by however many
/// threads the user has actually created — not by message count within
/// a thread), matching how `fileTree`/`tabs` are already handled.
#[tauri::command]
pub fn list_conversations(app: AppHandle) -> Result<Vec<Conversation>, String> {
    let mut conversations = read_all(&app);
    conversations.sort_by(|a, b| b.updated_at.cmp(&a.updated_at));
    Ok(conversations)
}

/// Upserts one conversation by id. The frontend sends the *entire*
/// conversation (not a diff) on every persist, exactly like
/// `write_file` receives the entire file content — this keeps the
/// persistence boundary simple and avoids any server-side merge logic
/// that could silently diverge from what the UI actually shows.
#[tauri::command]
pub fn save_conversation(app: AppHandle, conversation: Conversation) -> Result<(), String> {
    let mut conversations = read_all(&app);

    match conversations.iter_mut().find(|c| c.id == conversation.id) {
        Some(existing) => *existing = conversation,
        None => conversations.push(conversation),
    }

    write_all(&app, &conversations)
}

#[tauri::command]
pub fn delete_conversation(app: AppHandle, conversation_id: String) -> Result<(), String> {
    let mut conversations = read_all(&app);
    conversations.retain(|c| c.id != conversation_id);
    write_all(&app, &conversations)
}
