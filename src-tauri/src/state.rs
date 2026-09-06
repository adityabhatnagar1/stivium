use std::collections::HashMap;
use std::io::Write;
use std::sync::atomic::AtomicBool;
use std::sync::{Arc, Mutex};

use portable_pty::{Child, MasterPty};

pub struct TerminalSession {
    pub master: Box<dyn MasterPty + Send>,
    pub writer: Box<dyn Write + Send>,
    pub child: Box<dyn Child + Send + Sync>,
}

pub struct LspSession {
    pub stdin: std::process::ChildStdin,
    pub child: std::process::Child,
}

#[derive(Default)]
pub struct AppState {
    pub terminals: Mutex<HashMap<String, TerminalSession>>,
    pub lsp_sessions: Mutex<HashMap<String, LspSession>>,
    /// One flag per in-flight AI request, keyed by request id. Set to
    /// `true` by `ai::commands::cancel_ai`; the streaming task polls it
    /// between chunks and stops emitting once it flips.
    pub ai_cancel_flags: Mutex<HashMap<String, Arc<AtomicBool>>>,
}