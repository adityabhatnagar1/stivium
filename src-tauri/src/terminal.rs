use std::io::Read;
use std::io::Write;

use portable_pty::{native_pty_system, CommandBuilder, PtySize};
use tauri::{AppHandle, Emitter, State};

use crate::state::{AppState, TerminalSession};

fn default_shell() -> String {
    if cfg!(target_os = "windows") {
        "powershell.exe".to_string()
    } else {
        std::env::var("SHELL").unwrap_or_else(|_| "bash".to_string())
    }
}

#[tauri::command]
pub fn spawn_terminal(
    app: AppHandle,
    state: State<AppState>,
    id: String,
    cwd: Option<String>,
) -> Result<String, String> {
    let shell = default_shell();

    let safe_cwd = cwd
        .filter(|p| std::path::Path::new(p).exists())
        .or_else(|| std::env::var("USERPROFILE").ok())
        .or_else(|| std::env::var("HOME").ok())
        .unwrap_or_else(|| ".".to_string());

    let pty_system = native_pty_system();
    let pair = pty_system
        .openpty(PtySize {
            rows: 24,
            cols: 80,
            pixel_width: 0,
            pixel_height: 0,
        })
        .map_err(|e| e.to_string())?;

    let mut cmd = CommandBuilder::new(&shell);
    cmd.cwd(&safe_cwd);

    let child = pair
        .slave
        .spawn_command(cmd)
        .map_err(|e| e.to_string())?;
    drop(pair.slave);

    let mut reader = pair.master.try_clone_reader().map_err(|e| e.to_string())?;
    let writer = pair.master.take_writer().map_err(|e| e.to_string())?;

    let session = TerminalSession {
        master: pair.master,
        writer,
        child,
    };

    {
        let mut terminals = state.terminals.lock().map_err(|e| e.to_string())?;
        terminals.insert(id.clone(), session);
    }

    let event_id = id.clone();
    let app_handle = app.clone();
    std::thread::spawn(move || {
        let channel = format!("terminal-data-{event_id}");
        let mut buf = [0u8; 8192];
        loop {
            match reader.read(&mut buf) {
                Ok(0) => break,
                Ok(n) => {
                    let text = String::from_utf8_lossy(&buf[..n]).to_string();
                    if app_handle.emit(&channel, text).is_err() {
                        break;
                    }
                }
                Err(_) => break,
            }
        }
    });

    Ok(shell)
}

#[tauri::command]
pub fn write_terminal(state: State<AppState>, id: String, data: String) -> Result<(), String> {
    let mut terminals = state.terminals.lock().map_err(|e| e.to_string())?;
    if let Some(session) = terminals.get_mut(&id) {
        session
            .writer
            .write_all(data.as_bytes())
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub fn resize_terminal(
    state: State<AppState>,
    id: String,
    cols: u16,
    rows: u16,
) -> Result<(), String> {
    let terminals = state.terminals.lock().map_err(|e| e.to_string())?;
    if let Some(session) = terminals.get(&id) {
        session
            .master
            .resize(PtySize {
                rows,
                cols,
                pixel_width: 0,
                pixel_height: 0,
            })
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub fn kill_terminal(state: State<AppState>, id: String) -> Result<(), String> {
    let mut terminals = state.terminals.lock().map_err(|e| e.to_string())?;
    if let Some(mut session) = terminals.remove(&id) {
        let _ = session.child.kill();
    }
    Ok(())
}

pub fn kill_all_terminals(state: &AppState) {
    if let Ok(mut terminals) = state.terminals.lock() {
        for (_, mut session) in terminals.drain() {
            let _ = session.child.kill();
        }
    }
}
