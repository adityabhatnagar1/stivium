use std::collections::HashMap;
use std::io::{Read, Write};
use std::path::PathBuf;
use std::process::{Command, Stdio};

use base64::engine::general_purpose::STANDARD as BASE64;
use base64::Engine;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter, Manager, State};

use crate::state::{AppState, LspSession};

#[derive(Debug, Deserialize)]
pub struct SpawnOptions {
    pub id: String,
    pub server: String,
    #[serde(rename = "workspaceRoot")]
    pub workspace_root: Option<String>,
    pub command: Option<String>,
    pub args: Option<Vec<String>>,
    pub env: Option<HashMap<String, String>>,
}

#[derive(Debug, Serialize)]
#[serde(untagged)]
pub enum SpawnResult {
    Ok {
        ok: bool,
        id: String,
        pid: u32,
        command: String,
        args: Vec<String>,
    },
    Err {
        ok: bool,
        id: String,
        error: String,
    },
}

fn find_on_path(bin_names: &[&str]) -> Option<PathBuf> {
    let path_env = std::env::var_os("PATH")?;
    for dir in std::env::split_paths(&path_env) {
        for name in bin_names {
            let candidate = dir.join(name);
            if candidate.is_file() {
                return Some(candidate);
            }
        }
    }
    None
}

fn resolve_bundled_ruff(app: &AppHandle) -> Option<PathBuf> {
    let bin_name = if cfg!(target_os = "windows") {
        "ruff.exe"
    } else {
        "ruff"
    };
    if let Ok(resource_dir) = app.path().resource_dir() {
        let candidate = resource_dir.join("ruff").join(bin_name);
        if candidate.is_file() {
            return Some(candidate);
        }
    }
    None
}

fn resolve_ruff(app: &AppHandle) -> Result<(String, Vec<String>), String> {
    let binary = resolve_bundled_ruff(app)
        .or_else(|| find_on_path(&["ruff", "ruff.exe"]))
        .ok_or_else(|| "ruff binary not found (looked in resources/ruff and PATH)".to_string())?;
    Ok((binary.to_string_lossy().to_string(), vec!["server".to_string()]))
}

fn resolve_pyright(workspace_root: &Option<String>) -> Result<(String, Vec<String>), String> {
    // Pyright ships as an npm package. Look for its language server launcher
    // under node_modules, either next to the workspace or the app itself.
    let mut search_roots: Vec<PathBuf> = Vec::new();
    if let Some(root) = workspace_root {
        search_roots.push(PathBuf::from(root));
    }
    if let Ok(cwd) = std::env::current_dir() {
        search_roots.push(cwd);
    }

    for root in search_roots {
        let launcher = root
            .join("node_modules")
            .join("pyright")
            .join("langserver.index.js");
        if launcher.is_file() {
            let node = find_on_path(&["node", "node.exe"])
                .map(|p| p.to_string_lossy().to_string())
                .unwrap_or_else(|| "node".to_string());
            return Ok((node, vec![launcher.to_string_lossy().to_string(), "--stdio".to_string()]));
        }
    }

    // Fall back to a globally installed pyright-langserver / pyright CLI.
    if let Some(bin) = find_on_path(&["pyright-langserver", "pyright-langserver.cmd"]) {
        return Ok((bin.to_string_lossy().to_string(), vec!["--stdio".to_string()]));
    }

    Err("pyright langserver not found (looked in node_modules and PATH)".to_string())
}

fn build_spawn_args(
    app: &AppHandle,
    options: &SpawnOptions,
) -> Result<(String, Vec<String>), String> {
    if let Some(command) = &options.command {
        return Ok((command.clone(), options.args.clone().unwrap_or_default()));
    }

    match options.server.as_str() {
        "pyright" => resolve_pyright(&options.workspace_root),
        "ruff" => resolve_ruff(app),
        other => Err(format!(
            "No resolver registered for LSP server '{other}'. Provide 'command' for custom servers."
        )),
    }
}

#[tauri::command]
pub fn lsp_spawn(app: AppHandle, state: State<AppState>, options: SpawnOptions) -> SpawnResult {
    {
        let sessions = state.lsp_sessions.lock().unwrap();
        if sessions.contains_key(&options.id) {
            return SpawnResult::Err {
                ok: false,
                id: options.id.clone(),
                error: format!("LSP session {} already exists", options.id),
            };
        }
    }

    let (command, args) = match build_spawn_args(&app, &options) {
        Ok(v) => v,
        Err(error) => {
            return SpawnResult::Err {
                ok: false,
                id: options.id.clone(),
                error,
            }
        }
    };

    let cwd = options
        .workspace_root
        .clone()
        .filter(|p| std::path::Path::new(p).exists())
        .unwrap_or_else(|| ".".to_string());

    let mut cmd = Command::new(&command);
    cmd.args(&args)
        .current_dir(&cwd)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());

    if let Some(env) = &options.env {
        for (k, v) in env {
            cmd.env(k, v);
        }
    }

    let mut child = match cmd.spawn() {
        Ok(c) => c,
        Err(e) => {
            return SpawnResult::Err {
                ok: false,
                id: options.id.clone(),
                error: format!("Failed to spawn LSP server: {e}"),
            }
        }
    };

    let pid = child.id();
    let stdin = child.stdin.take().unwrap();
    let mut stdout = child.stdout.take().unwrap();
    let mut stderr = child.stderr.take().unwrap();

    let id = options.id.clone();

    // stdout -> lsp-data-{id} (base64, to preserve binary framing)
    {
        let app_handle = app.clone();
        let id = id.clone();
        std::thread::spawn(move || {
            let channel = format!("lsp-data-{id}");
            let mut buf = [0u8; 8192];
            loop {
                match stdout.read(&mut buf) {
                    Ok(0) => break,
                    Ok(n) => {
                        let encoded = BASE64.encode(&buf[..n]);
                        if app_handle.emit(&channel, encoded).is_err() {
                            break;
                        }
                    }
                    Err(_) => break,
                }
            }
        });
    }

    // stderr -> lsp-stderr-{id}
    {
        let app_handle = app.clone();
        let id = id.clone();
        std::thread::spawn(move || {
            let channel = format!("lsp-stderr-{id}");
            let mut buf = [0u8; 8192];
            loop {
                match stderr.read(&mut buf) {
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
    }

    let session = LspSession { stdin, child };
    state
        .lsp_sessions
        .lock()
        .unwrap()
        .insert(options.id.clone(), session);

    // Watch for exit on a dedicated thread since std::process::Child::wait
    // needs to be polled from somewhere other than the pipe readers.
    {
        let app_handle = app.clone();
        let id = id.clone();
        std::thread::spawn(move || {
            loop {
                std::thread::sleep(std::time::Duration::from_millis(300));
                let app_state = app_handle.state::<AppState>();
                let mut sessions = app_state.lsp_sessions.lock().unwrap();
                let exited = if let Some(session) = sessions.get_mut(&id) {
                    match session.child.try_wait() {
                        Ok(Some(status)) => Some(status.code()),
                        Ok(None) => None,
                        Err(_) => Some(None),
                    }
                } else {
                    break;
                };
                if let Some(code) = exited {
                    sessions.remove(&id);
                    drop(sessions);
                    let channel = format!("lsp-exit-{id}");
                    let _ = app_handle.emit(
                        &channel,
                        serde_json::json!({ "code": code, "signal": serde_json::Value::Null }),
                    );
                    break;
                }
            }
        });
    }

    SpawnResult::Ok {
        ok: true,
        id: options.id,
        pid,
        command,
        args,
    }
}

#[tauri::command]
pub fn lsp_write(state: State<AppState>, id: String, payload_base64: String) -> Result<(), String> {
    let bytes = BASE64.decode(payload_base64).map_err(|e| e.to_string())?;
    let mut sessions = state.lsp_sessions.lock().map_err(|e| e.to_string())?;
    if let Some(session) = sessions.get_mut(&id) {
        session.stdin.write_all(&bytes).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub fn lsp_stop(state: State<AppState>, id: String) -> Result<(), String> {
    let mut sessions = state.lsp_sessions.lock().map_err(|e| e.to_string())?;
    if let Some(mut session) = sessions.remove(&id) {
        let _ = session.child.kill();
    }
    Ok(())
}

pub fn stop_all_lsp_sessions(state: &AppState) {
    if let Ok(mut sessions) = state.lsp_sessions.lock() {
        for (_, mut session) in sessions.drain() {
            let _ = session.child.kill();
        }
    }
}
