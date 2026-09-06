use tauri::AppHandle;
use tauri_plugin_dialog::DialogExt;

// #[tauri::command]
// pub fn trigger_build(app: AppHandle) {
//     let _ = app.emit("terminal-output", "\r\n\x1b[33m> Starting Build...\x1b[0m\r\n");

//     std::thread::spawn(move || {
//         for count in 0..5 {
//             std::thread::sleep(std::time::Duration::from_millis(600));
//             let _ = app.emit(
//                 "terminal-output",
//                 format!("[INFO] Compiling module source_{count}...\r\n"),
//             );
//         }
//         std::thread::sleep(std::time::Duration::from_millis(600));
//         let _ = app.emit(
//             "terminal-output",
//             "\x1b[32m> Build completed successfully.\x1b[0m\r\n",
//         );
//     });
// }

// Build command intentionally removed. Stivium's real build/simulation pipeline lives in rtl::run_rtl.


#[tauri::command]
pub fn quit_app(app: AppHandle) {
    app.exit(0);
}

#[tauri::command]
pub fn toggle_devtools(window: tauri::WebviewWindow) {
    #[cfg(debug_assertions)]
    {
        if window.is_devtools_open() {
            window.close_devtools();
        } else {
            window.open_devtools();
        }
    }
    #[cfg(not(debug_assertions))]
    {
        let _ = window;
    }
}

#[tauri::command]
pub fn show_about_dialog(app: AppHandle) {
app.dialog()
    .message(
        "Stivium is a cross-platform desktop application built with Tauri and Rust. Your all in one RTL design and simulation tool. It provides a user-friendly interface for designing, simulating, and analyzing digital circuits, making it an essential tool for engineers, students, and hobbyists alike.",
    )
    .title("Stivium")
    .kind(tauri_plugin_dialog::MessageDialogKind::Info)
    .show(|_| {});
}

#[tauri::command]
pub fn notify_ready(window: tauri::WebviewWindow) {
    let _ = window.show();
}
