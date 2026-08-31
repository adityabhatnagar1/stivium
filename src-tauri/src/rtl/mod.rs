//! Stage 2 - "Run It": compile the file currently open in Monaco with
//! `iverilog` and execute it with `vvp`, streaming output into Stivium's
//! existing console instead of opening an external terminal.
//!
//! Only single-file runs are supported for now (see project spec, Stage 2).
//! Multi-file / project builds are intentionally out of scope here.

mod icarus;

use std::fs;
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};

use serde::Serialize;
use tauri::{AppHandle, Emitter};

#[cfg(windows)]
const CREATE_NO_WINDOW: u32 = 0x0800_0000;

/// Applies the flag that stops a console window from flashing up when we
/// spawn iverilog.exe / vvp.exe from this (GUI-subsystem) application.
fn no_window(cmd: &mut Command) {
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        cmd.creation_flags(CREATE_NO_WINDOW);
    }
}

#[cfg(windows)]
mod win_run {
    use std::ffi::OsStr;
    use std::os::windows::ffi::OsStrExt;
    use std::path::Path;
    use std::time::{Duration, Instant};

    use windows::core::{PCWSTR, PWSTR};
    use windows::Win32::Foundation::{CloseHandle, HANDLE};
    use windows::Win32::System::Console::{
        AttachConsole, FreeConsole, GetConsoleScreenBufferInfo, GetStdHandle,
        ReadConsoleOutputCharacterW, CONSOLE_SCREEN_BUFFER_INFO, COORD, STD_OUTPUT_HANDLE,
    };
    use windows::Win32::System::Threading::{
        CreateProcessW, GetExitCodeProcess, TerminateProcess, WaitForSingleObject,
        CREATE_NEW_CONSOLE, CREATE_UNICODE_ENVIRONMENT, PROCESS_INFORMATION, STARTF_USESHOWWINDOW,
        STARTUPINFOW,
    };

    fn wide(s: &OsStr) -> Vec<u16> {
        s.encode_wide().chain(std::iter::once(0)).collect()
    }

    fn env_block(path_override: &OsStr) -> Vec<u16> {
        let mut vars: Vec<(std::ffi::OsString, std::ffi::OsString)> =
            std::env::vars_os().collect();
        vars.retain(|(k, _)| k.to_ascii_uppercase() != "PATH");
        vars.push(("PATH".into(), path_override.to_os_string()));

        let mut block: Vec<u16> = Vec::new();
        for (k, v) in vars {
            block.extend(k.encode_wide());
            block.push('=' as u16);
            block.extend(v.encode_wide());
            block.push(0);
        }
        block.push(0);
        block
    }

    /// Runs `exe arg` in `cwd` in its own new, hidden Win32 console, and
    /// pulls output back by attaching to that console and reading its
    /// screen buffer directly. Confirmed manually: `vvp.exe hello.out >
    /// out.txt` from a plain PowerShell produces an EMPTY out.txt - this
    /// binary writes via WriteConsole, not CRT stdio, so no redirection
    /// scheme (pipe, file, ConPTY) was ever going to capture anything.
    pub fn run_captured(
        exe: &Path,
        arg: &str,
        cwd: &Path,
        path_env: &OsStr,
        timeout: Duration,
        mut on_chunk: impl FnMut(&str),
    ) -> Result<(String, Option<u32>), String> {
        unsafe {
            let mut cmdline = wide(OsStr::new(&format!("\"{}\" {}", exe.display(), arg)));
            let cwd_w = wide(cwd.as_os_str());
            let mut env = env_block(path_env);

            let mut startup = STARTUPINFOW::default();
            startup.cb = std::mem::size_of::<STARTUPINFOW>() as u32;
            startup.dwFlags = STARTF_USESHOWWINDOW;
            startup.wShowWindow = 0; // SW_HIDE

            let mut proc_info = PROCESS_INFORMATION::default();

            CreateProcessW(
                PCWSTR::null(),
                PWSTR(cmdline.as_mut_ptr()),
                None,
                None,
                false,
                CREATE_NEW_CONSOLE | CREATE_UNICODE_ENVIRONMENT,
                Some(env.as_mut_ptr() as *const _),
                PCWSTR(cwd_w.as_ptr()),
                &startup,
                &mut proc_info,
            )
            .map_err(|e| format!("CreateProcessW failed: {e}"))?;
            let _ = CloseHandle(proc_info.hThread);

            // Detach whatever console we (don't) have, then attach to the
            // child's brand-new one so GetStdHandle/ReadConsoleOutput* work
            // against it. The new console can take a moment to become
            // attachable right after CreateProcessW returns, so retry
            // briefly instead of failing on the first attempt.
            let _ = FreeConsole();
            let mut attach_result = AttachConsole(proc_info.dwProcessId);
            let mut attempts = 0;
            while attach_result.is_err() && attempts < 40 {
                std::thread::sleep(Duration::from_millis(25));
                let _ = FreeConsole();
                attach_result = AttachConsole(proc_info.dwProcessId);
                attempts += 1;
            }
            if let Err(e) = attach_result {
                let _ = TerminateProcess(proc_info.hProcess, 1);
                let _ = CloseHandle(proc_info.hProcess);
                return Err(format!(
                    "Failed to attach to child console after {attempts} attempts: {e}"
                ));
            }
            let out_handle = match GetStdHandle(STD_OUTPUT_HANDLE) {
                Ok(h) => h,
                Err(e) => {
                    let _ = FreeConsole();
                    let _ = CloseHandle(proc_info.hProcess);
                    return Err(format!("GetStdHandle failed: {e}"));
                }
            
            };

            let start = Instant::now();
            let mut last_row: i16 = 0;
            let mut text = String::new();
            let exit_code;

            loop {
                scrape_new_rows(out_handle, &mut last_row, &mut text, &mut on_chunk);

                let waited = WaitForSingleObject(proc_info.hProcess, 50);
                if waited.0 == 0 {
                    let mut code = 0u32;
                    let _ = GetExitCodeProcess(proc_info.hProcess, &mut code);
                    exit_code = Some(code);
                    break;
                }
                if start.elapsed() > timeout {
                    let _ = TerminateProcess(proc_info.hProcess, 1);
                    exit_code = None;
                    break;
                }
            }

            // Final pass: grab whatever was written between the last poll
            // and exit.
            scrape_new_rows(out_handle, &mut last_row, &mut text, &mut on_chunk);

            let _ = FreeConsole();
            let _ = CloseHandle(proc_info.hProcess);
            Ok((text, exit_code))
        }
    }

    unsafe fn scrape_new_rows(
        out_handle: HANDLE,
        last_row: &mut i16,
        text: &mut String,
        on_chunk: &mut impl FnMut(&str),
    ) {
        let mut info = CONSOLE_SCREEN_BUFFER_INFO::default();
        if GetConsoleScreenBufferInfo(out_handle, &mut info).is_err() {
            return;
        }
        let width = info.dwSize.X;
        let cursor_row = info.dwCursorPosition.Y;
        if width <= 0 || cursor_row < *last_row {
            return;
        }

        let mut buf = vec![0u16; width as usize];
        for row in *last_row..=cursor_row {
            let mut read = 0u32;
            let coord = COORD { X: 0, Y: row };
            if ReadConsoleOutputCharacterW(out_handle, &mut buf, coord, &mut read).is_err() {
                continue;
            }
            let line: String = String::from_utf16_lossy(&buf[..read as usize])
                .trim_end()
                .to_string();
            text.push_str(&line);
            text.push('\n');
            on_chunk(&format!("{line}\n"));
        }
        *last_row = cursor_row + 1;
    }
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RunResult {
    pub success: bool,
}

/// Emits simulator/compiler text to Stivium's existing "Output" console via
/// the same `terminal-output` channel the (already present) build/output
/// panel listens on, normalizing bare `\n` to `\r\n` for the xterm host.
fn emit_output(app: &AppHandle, text: &str) {
    if text.is_empty() {
        return;
    }
    let _ = app.emit("terminal-output", text.replace('\n', "\r\n"));
}

fn emit_status(app: &AppHandle, text: &str) {
    emit_output(app, &format!("\r\n{text}\r\n"));
}

/// Creates a unique staging directory under the OS temp dir for one run, so
/// concurrent/rapid runs never clobber each other and the user's real file
/// on disk is never touched.
fn create_staging_dir() -> Result<PathBuf, String> {
    let unique = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_nanos())
        .unwrap_or(0);
    let dir = std::env::temp_dir().join(format!("stivium-rtl-{}-{unique}", std::process::id()));
    fs::create_dir_all(&dir).map_err(|e| format!("Failed to create staging directory: {e}"))?;
    Ok(dir)
}

/// Run the current Verilog/SystemVerilog source through Icarus Verilog.
///
/// `file_path` is the on-disk path of the active tab (used only to recover
/// its file name, so compiler diagnostics reference a familiar name).
/// `source` is the *current Monaco buffer contents* - authoritative even if
/// unsaved - which is what actually gets compiled.
#[tauri::command]
pub fn run_rtl(app: AppHandle, file_path: String, source: String) -> Result<RunResult, String> {
    let toolchain = match icarus::resolve_toolchain() {
        Ok(toolchain) => toolchain,
        Err(message) => {
            emit_status(&app, &format!("\x1b[31m{message}\x1b[0m"));
            return Ok(RunResult { success: false });
        }
    };

    let file_name = Path::new(&file_path)
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .filter(|n| !n.is_empty())
        .unwrap_or_else(|| "source.v".to_string());

    let staging_dir = create_staging_dir()?;
    let staged_source = staging_dir.join(&file_name);
    let compiled_output = staging_dir.join("stivium_sim.out");

    let cleanup = |dir: &Path| {
        let _ = fs::remove_dir_all(dir);
    };

    if let Err(e) = fs::write(&staged_source, &source) {
        cleanup(&staging_dir);
        return Err(format!("Failed to stage '{file_name}': {e}"));
    }

    let icarus_bin = match toolchain.vvp.parent() {
        Some(dir) => dir.to_path_buf(),
        None => {
            cleanup(&staging_dir);
            return Err("Invalid Icarus toolchain path".to_string());
        }
    };

    let existing_path = std::env::var_os("PATH").unwrap_or_default();
    let mut path_entries = vec![icarus_bin];
    path_entries.extend(std::env::split_paths(&existing_path));
    let child_path = match std::env::join_paths(path_entries) {
        Ok(path) => path,
        Err(e) => {
            cleanup(&staging_dir);
            return Err(format!("Failed to construct Icarus PATH: {e}"));
        }
    };

    emit_status(&app, &format!("\x1b[36m> Compiling {file_name}...\x1b[0m"));

    let mut compile_cmd = Command::new(&toolchain.iverilog);
    compile_cmd
        .arg("-o")
        .arg(&compiled_output)
        .arg(&staged_source)
        .env("PATH", &child_path)
        .stdin(Stdio::null());
    no_window(&mut compile_cmd);

    let compile_output = match compile_cmd.output() {
        Ok(output) => output,
        Err(e) => {
            cleanup(&staging_dir);
            emit_status(
                &app,
                &format!("\x1b[31mFailed to launch iverilog: {e}\x1b[0m"),
            );
            return Ok(RunResult { success: false });
        }
    };

    emit_output(
        &app,
        &format!(
            "{}{}",
            String::from_utf8_lossy(&compile_output.stdout),
            String::from_utf8_lossy(&compile_output.stderr)
        ),
    );

    if !compile_output.status.success() {
        cleanup(&staging_dir);
        emit_status(&app, "\x1b[31m> Compilation failed.\x1b[0m");
        return Ok(RunResult { success: false });
    }

    emit_status(&app, "\x1b[36m> Running simulation...\x1b[0m");

    // vvp.exe writes via WriteConsole, not CRT stdio - confirmed manually
    // (`vvp.exe hello.out > out.txt` from a plain PowerShell produces an
    // empty out.txt). No redirection scheme captures anything. Give it its
    // own hidden console and scrape the screen buffer instead.
    #[cfg(windows)]
    let run_result = win_run::run_captured(
        &toolchain.vvp,
        "stivium_sim.out",
        &staging_dir,
        &child_path,
        std::time::Duration::from_secs(15),
        |line| emit_output(&app, line),
    );

    #[cfg(not(windows))]
    let run_result: Result<(String, Option<u32>), String> = {
        let mut cmd = Command::new(&toolchain.vvp);
        cmd.arg("stivium_sim.out")
            .current_dir(&staging_dir)
            .env("PATH", &child_path);
        match cmd.output() {
            Ok(out) => {
                let text = format!(
                    "{}{}",
                    String::from_utf8_lossy(&out.stdout),
                    String::from_utf8_lossy(&out.stderr)
                );
                emit_output(&app, &text);
                Ok((text, out.status.code().map(|c| c as u32)))
            }
            Err(e) => Err(format!("Failed to launch vvp: {e}")),
        }
    };

    let (captured, exit_code) = match run_result {
        Ok(r) => r,
        Err(e) => {
            cleanup(&staging_dir);
            emit_status(&app, &format!("\x1b[31m{e}\x1b[0m"));
            return Ok(RunResult { success: false });
        }
    };

    cleanup(&staging_dir);

    // vvp still crashes on process teardown after it has finished and
    // flushed $finish output (0xC0000005) - cosmetic once we've actually
    // scraped the simulation's output from the console buffer.
    const VVP_BENIGN_EXIT_CRASH: u32 = 0xC000_0005;
    let had_sim_output = !captured.is_empty();
    let benign_crash_on_exit = exit_code == Some(VVP_BENIGN_EXIT_CRASH) && had_sim_output;
    let exit_success = exit_code == Some(0);

    if exit_success || benign_crash_on_exit {
        emit_status(&app, "\x1b[32m> Simulation finished.\x1b[0m");
        Ok(RunResult { success: true })
    } else if exit_code.is_none() {
        emit_status(&app, "\x1b[31m> Simulation timed out and was killed.\x1b[0m");
        Ok(RunResult { success: false })
    } else {
        emit_status(
            &app,
            &format!(
                "\x1b[31m> Simulation exited with an error. Exit code: {:?}\x1b[0m",
                exit_code
            ),
        );
        Ok(RunResult { success: false })
    }
}
