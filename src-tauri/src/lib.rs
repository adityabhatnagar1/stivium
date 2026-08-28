mod fs_commands;
mod lsp;
mod misc;
mod state;
mod terminal;

use state::AppState;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(AppState::default())
        .invoke_handler(tauri::generate_handler![
            fs_commands::open_folder,
            fs_commands::get_last_workspace,
            fs_commands::set_last_workspace,
            fs_commands::read_file,
            fs_commands::write_file,
            fs_commands::read_dir_tree,
            fs_commands::create_file,
            fs_commands::create_folder,
            fs_commands::rename_path,
            fs_commands::delete_path,
            fs_commands::paste_path,
            fs_commands::find_in_files,
            fs_commands::replace_in_files,
            terminal::spawn_terminal,
            terminal::write_terminal,
            terminal::resize_terminal,
            terminal::kill_terminal,
            lsp::lsp_spawn,
            lsp::lsp_write,
            lsp::lsp_stop,
            misc::trigger_build,
            misc::quit_app,
            misc::toggle_devtools,
            misc::show_about_dialog,
            misc::notify_ready
        ])
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::Destroyed = event {
                let state = window.state::<AppState>();
                terminal::kill_all_terminals(&state);
                lsp::stop_all_lsp_sessions(&state);
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running Stivium");
}
