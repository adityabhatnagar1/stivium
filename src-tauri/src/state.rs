use std::collections::HashMap;
use std::io::Write;
use std::sync::Mutex;

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
}
