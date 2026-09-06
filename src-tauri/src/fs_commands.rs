use std::fs;
use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};
use tauri_plugin_dialog::DialogExt;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DirTreeNode {
    pub name: String,
    pub path: String,
    pub is_directory: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub children: Option<Vec<DirTreeNode>>,
}

#[derive(Debug, Serialize)]
pub struct FileMatch {
    pub line: usize,
    pub preview: String,
}

#[derive(Debug, Serialize)]
pub struct FindResult {
    pub path: String,
    pub count: usize,
    pub matches: Vec<FileMatch>,
}

#[derive(Debug, Default, Deserialize, Serialize)]
struct Preferences {
    #[serde(
        rename = "lastWorkspacePath",
        skip_serializing_if = "Option::is_none"
    )]
    last_workspace_path: Option<String>,
}

fn should_skip_name(name: &str) -> bool {
    name.starts_with('.')
}

fn validate_component_name(name: &str) -> Result<(), String> {
    if name.is_empty() {
        return Err("Name cannot be empty".to_string());
    }

    if name == "." || name == ".." {
        return Err("Invalid name".to_string());
    }

    if name.contains('/') || name.contains('\\') {
        return Err("Name cannot contain a path separator".to_string());
    }

    if Path::new(name).is_absolute() {
        return Err("Invalid name".to_string());
    }

    if cfg!(windows) {
        const RESERVED_CHARS: [char; 7] = ['<', '>', ':', '"', '|', '?', '*'];

        if name
            .chars()
            .any(|c| RESERVED_CHARS.contains(&c) || (c as u32) < 32)
        {
            return Err(
                "Name contains characters that are invalid on Windows".to_string()
            );
        }

        if name.ends_with('.') || name.ends_with(' ') {
            return Err(
                "Name cannot end with a space or period on Windows".to_string()
            );
        }

        const RESERVED_NAMES: [&str; 22] = [
            "CON", "PRN", "AUX", "NUL", "COM1", "COM2", "COM3", "COM4",
            "COM5", "COM6", "COM7", "COM8", "COM9", "LPT1", "LPT2",
            "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9",
        ];

        let stem = name
            .split('.')
            .next()
            .unwrap_or(name)
            .to_uppercase();

        if RESERVED_NAMES.contains(&stem.as_str()) {
            return Err("Name is reserved on Windows".to_string());
        }
    }

    Ok(())
}

fn normalize_lexical(path: &Path) -> PathBuf {
    use std::path::Component;

    let mut out = PathBuf::new();

    for component in path.components() {
        match component {
            Component::CurDir => {}

            Component::ParentDir => match out.components().next_back() {
                Some(Component::Normal(_)) => {
                    out.pop();
                }
                _ => out.push(component),
            },

            other => out.push(other.as_os_str()),
        }
    }

    out
}

fn is_same_or_descendant(ancestor: &Path, descendant: &Path) -> bool {
    let ancestor = normalize_lexical(ancestor);
    let descendant = normalize_lexical(descendant);

    if cfg!(windows) {
        let a = PathBuf::from(ancestor.to_string_lossy().to_lowercase());
        let d = PathBuf::from(descendant.to_string_lossy().to_lowercase());

        return d.starts_with(&a);
    }

    descendant.starts_with(&ancestor)
}

fn preferences_path(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;

    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;

    Ok(dir.join("preferences.json"))
}

fn read_preferences(app: &AppHandle) -> Preferences {
    let Ok(path) = preferences_path(app) else {
        return Preferences::default();
    };

    let Ok(content) = fs::read_to_string(path) else {
        return Preferences::default();
    };

    serde_json::from_str(&content).unwrap_or_default()
}

fn write_preferences(
    app: &AppHandle,
    prefs: &Preferences,
) -> Result<(), String> {
    let path = preferences_path(app)?;

    let content =
        serde_json::to_string_pretty(prefs).map_err(|e| e.to_string())?;

    fs::write(path, content).map_err(|e| e.to_string())
}

fn build_dir_tree(dir_path: &Path) -> DirTreeNode {
    let name = dir_path
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_else(|| dir_path.to_string_lossy().to_string());

    let mut children: Vec<DirTreeNode> = Vec::new();

    if let Ok(entries) = fs::read_dir(dir_path) {
        for entry in entries.flatten() {
            let entry_name = entry.file_name().to_string_lossy().to_string();

            if should_skip_name(&entry_name) {
                continue;
            }

            let full_path = entry.path();
            let is_dir = full_path.is_dir();

            if is_dir {
                children.push(build_dir_tree(&full_path));
            } else {
                children.push(DirTreeNode {
                    name: entry_name,
                    path: full_path.to_string_lossy().to_string(),
                    is_directory: false,
                    children: None,
                });
            }
        }
    }

    children.sort_by(|a, b| {
        match (a.is_directory, b.is_directory) {
            (true, false) => std::cmp::Ordering::Less,
            (false, true) => std::cmp::Ordering::Greater,
            _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
        }
    });

    DirTreeNode {
        name,
        path: dir_path.to_string_lossy().to_string(),
        is_directory: true,
        children: Some(children),
    }
}

fn walk_files(dir_path: &Path) -> Vec<PathBuf> {
    let mut results = Vec::new();

    let Ok(entries) = fs::read_dir(dir_path) else {
        return results;
    };

    for entry in entries.flatten() {
        let name = entry.file_name().to_string_lossy().to_string();

        if should_skip_name(&name) {
            continue;
        }

        let full_path = entry.path();

        if full_path.is_dir() {
            results.extend(walk_files(&full_path));
        } else {
            results.push(full_path);
        }
    }

    results
}

fn unique_path(target: &Path) -> PathBuf {
    if !target.exists() {
        return target.to_path_buf();
    }

    let ext = target
        .extension()
        .map(|e| e.to_string_lossy().to_string());

    let stem = target
        .file_stem()
        .map(|s| s.to_string_lossy().to_string())
        .unwrap_or_default();

    let dir = target.parent().unwrap_or(Path::new("."));

    let mut index = 1;

    loop {
        let candidate_name = match &ext {
            Some(e) if !e.is_empty() => {
                format!("{stem}-copy-{index}.{e}")
            }
            _ => format!("{stem}-copy-{index}"),
        };

        let candidate = dir.join(candidate_name);

        if !candidate.exists() {
            return candidate;
        }

        index += 1;
    }
}

#[tauri::command]
pub async fn open_folder(app: AppHandle) -> Option<DirTreeNode> {
    let (tx, rx) = tokio::sync::oneshot::channel();

    app.dialog().file().pick_folder(move |folder| {
        let _ = tx.send(folder);
    });

    let picked = rx.await.ok().flatten()?;
    let path = picked.into_path().ok()?;

    Some(build_dir_tree(&path))
}

#[tauri::command]
pub fn get_last_workspace(app: AppHandle) -> Option<String> {
    let prefs = read_preferences(&app);

    match prefs.last_workspace_path {
        Some(path) if Path::new(&path).exists() => Some(path),
        _ => None,
    }
}

#[tauri::command]
pub fn set_last_workspace(
    app: AppHandle,
    workspace_path: Option<String>,
) -> bool {
    match workspace_path {
        None => {
            let mut prefs = read_preferences(&app);
            prefs.last_workspace_path = None;

            write_preferences(&app, &prefs).is_ok()
        }

        Some(path) => {
            if !Path::new(&path).exists() {
                return false;
            }

            let mut prefs = read_preferences(&app);
            prefs.last_workspace_path = Some(path);

            write_preferences(&app, &prefs).is_ok()
        }
    }
}

#[tauri::command]
pub fn read_file(file_path: String) -> Result<String, String> {
    fs::read_to_string(file_path).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn write_file(
    file_path: String,
    content: String,
) -> Result<bool, String> {
    fs::write(file_path, content).map_err(|e| e.to_string())?;

    Ok(true)
}

#[tauri::command]
pub fn read_dir_tree(dir_path: String) -> DirTreeNode {
    build_dir_tree(Path::new(&dir_path))
}

#[tauri::command]
pub fn create_file(
    dir_path: String,
    name: String,
) -> Result<bool, String> {
    validate_component_name(&name)?;

    let target = Path::new(&dir_path).join(&name);

    if target.exists() {
        return Err("File already exists".to_string());
    }

    fs::write(target, "").map_err(|e| e.to_string())?;

    Ok(true)
}

#[tauri::command]
pub fn create_folder(
    dir_path: String,
    name: String,
) -> Result<bool, String> {
    validate_component_name(&name)?;

    let target = Path::new(&dir_path).join(&name);

    if target.exists() {
        return Err("Folder already exists".to_string());
    }

    fs::create_dir(target).map_err(|e| e.to_string())?;

    Ok(true)
}

#[tauri::command]
pub fn rename_path(
    target_path: String,
    new_name: String,
) -> Result<bool, String> {
    validate_component_name(&new_name)?;

    let target = Path::new(&target_path);

    let next_path = target
        .parent()
        .unwrap_or(Path::new("."))
        .join(&new_name);

    if next_path.exists() {
        return Err("Target name already exists".to_string());
    }

    fs::rename(target, next_path).map_err(|e| e.to_string())?;

    Ok(true)
}

#[tauri::command]
pub fn delete_path(target_path: String) -> Result<bool, String> {
    let target = Path::new(&target_path);

    if !target.exists() {
        return Ok(true);
    }

    if target.is_dir() {
        fs::remove_dir_all(target).map_err(|e| e.to_string())?;
    } else {
        fs::remove_file(target).map_err(|e| e.to_string())?;
    }

    Ok(true)
}

fn copy_dir_recursive(src: &Path, dst: &Path) -> std::io::Result<()> {
    fs::create_dir_all(dst)?;

    for entry in fs::read_dir(src)? {
        let entry = entry?;

        let src_path = entry.path();
        let dst_path = dst.join(entry.file_name());

        if src_path.is_dir() {
            copy_dir_recursive(&src_path, &dst_path)?;
        } else {
            fs::copy(&src_path, &dst_path)?;
        }
    }

    Ok(())
}

#[tauri::command]
pub fn paste_path(
    source_path: String,
    destination_dir: String,
    cut: bool,
) -> Result<bool, String> {
    let source = Path::new(&source_path);
    let dest_dir = Path::new(&destination_dir);

    if source.is_dir() && is_same_or_descendant(source, dest_dir) {
        return Err(
            "Cannot paste a folder into itself or one of its own subfolders"
                .to_string(),
        );
    }

    let file_name = source
        .file_name()
        .ok_or_else(|| "Invalid source path".to_string())?;

    let target = unique_path(&dest_dir.join(file_name));

    if cut {
        if fs::rename(source, &target).is_ok() {
            return Ok(true);
        }

        // Cross-device rename can fail; fall back to copy+delete below.
    }

    if source.is_dir() {
        copy_dir_recursive(source, &target)
            .map_err(|e| e.to_string())?;

        if cut {
            fs::remove_dir_all(source)
                .map_err(|e| e.to_string())?;
        }
    } else {
        fs::copy(source, &target)
            .map_err(|e| e.to_string())?;

        if cut {
            fs::remove_file(source)
                .map_err(|e| e.to_string())?;
        }
    }

    Ok(true)
}

#[tauri::command]
pub fn find_in_files(
    root_dir: String,
    query: String,
) -> Vec<FindResult> {
    if query.trim().is_empty() {
        return Vec::new();
    }

    let files = walk_files(Path::new(&root_dir));
    let mut results = Vec::new();

    for file_path in files {
        let Ok(content) = fs::read_to_string(&file_path) else {
            continue;
        };

        let count = content.matches(query.as_str()).count();

        if count == 0 {
            continue;
        }

        let mut matches = Vec::new();

        for (index, line) in content.lines().enumerate() {
            if line.contains(query.as_str()) {
                matches.push(FileMatch {
                    line: index + 1,
                    preview: line.trim().to_string(),
                });

                if matches.len() >= 5 {
                    break;
                }
            }
        }

        results.push(FindResult {
            path: file_path.to_string_lossy().to_string(),
            count,
            matches,
        });
    }

    results
}

#[tauri::command]
pub fn replace_in_files(
    root_dir: String,
    query: String,
    replacement: String,
) -> usize {
    if query.trim().is_empty() {
        return 0;
    }

    let files = walk_files(Path::new(&root_dir));
    let mut files_changed = 0;

    for file_path in files {
        let Ok(content) = fs::read_to_string(&file_path) else {
            continue;
        };

        if !content.contains(query.as_str()) {
            continue;
        }

        let next_content = content.replace(query.as_str(), &replacement);

        if fs::write(&file_path, next_content).is_ok() {
            files_changed += 1;
        }
    }

    files_changed
}


#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use tempfile::TempDir;

    fn setup() -> TempDir {
        tempfile::tempdir().unwrap()
    }

    #[test]
    fn create_file_valid_name() {
        let dir = setup();
        assert!(create_file(
            dir.path().to_string_lossy().into_owned(),
            "test.v".into()
        ).unwrap());
        assert!(dir.path().join("test.v").is_file());
    }

    #[test]
    fn create_folder_valid_name() {
        let dir = setup();
        assert!(create_folder(
            dir.path().to_string_lossy().into_owned(),
            "rtl".into()
        ).unwrap());
        assert!(dir.path().join("rtl").is_dir());
    }

    #[test]
    fn create_rejects_invalid_names() {
        let dir = setup();

        for name in [".", "..", "", "foo/bar", "foo\\bar"] {
            assert!(create_file(
                dir.path().to_string_lossy().into_owned(),
                name.into()
            ).is_err());
        }
    }

    #[test]
    fn create_allows_legitimate_names() {
        let dir = setup();

        for name in ["cpu.v", "my-module", "_private", "foo.bar", "foo bar"] {
            assert!(create_file(
                dir.path().to_string_lossy().into_owned(),
                name.into()
            ).is_ok());
        }
    }

    #[test]
    fn rename_file() {
        let dir = setup();
        fs::write(dir.path().join("a.v"), "module a;").unwrap();

        assert!(rename_path(
            dir.path().join("a.v").to_string_lossy().into_owned(),
            "b.v".into()
        ).unwrap());

        assert!(!dir.path().join("a.v").exists());
        assert!(dir.path().join("b.v").exists());
    }

    #[test]
    fn rename_directory() {
        let dir = setup();
        fs::create_dir(dir.path().join("rtl")).unwrap();

        assert!(rename_path(
            dir.path().join("rtl").to_string_lossy().into_owned(),
            "hardware".into()
        ).unwrap());

        assert!(dir.path().join("hardware").is_dir());
    }

    #[test]
    fn rename_nested_directory() {
        let dir = setup();
        fs::create_dir_all(dir.path().join("rtl/core")).unwrap();

        assert!(rename_path(
            dir.path().join("rtl").to_string_lossy().into_owned(),
            "hardware".into()
        ).unwrap());

        assert!(dir.path().join("hardware/core").is_dir());
    }

    #[test]
    fn rename_rejects_invalid_name() {
        let dir = setup();
        fs::write(dir.path().join("a.v"), "").unwrap();

        assert!(rename_path(
            dir.path().join("a.v").to_string_lossy().into_owned(),
            "../evil".into()
        ).is_err());
    }

    #[test]
    fn delete_file() {
        let dir = setup();
        fs::write(dir.path().join("a.v"), "").unwrap();

        assert!(delete_path(
            dir.path().join("a.v").to_string_lossy().into_owned()
        ).unwrap());

        assert!(!dir.path().join("a.v").exists());
    }

    #[test]
    fn delete_directory_recursive() {
        let dir = setup();
        fs::create_dir_all(dir.path().join("rtl/core")).unwrap();
        fs::write(dir.path().join("rtl/core/cpu.v"), "").unwrap();

        assert!(delete_path(
            dir.path().join("rtl").to_string_lossy().into_owned()
        ).unwrap());

        assert!(!dir.path().join("rtl").exists());
    }

    #[test]
    fn copy_file() {
        let dir = setup();
        let source = dir.path().join("a.v");
        fs::write(&source, "hello").unwrap();

        let dest = dir.path().join("dest");
        fs::create_dir(&dest).unwrap();

        assert!(paste_path(
            source.to_string_lossy().into_owned(),
            dest.to_string_lossy().into_owned(),
            false
        ).unwrap());

        assert_eq!(fs::read(dest.join("a.v")).unwrap(), b"hello");
    }

    #[test]
    fn copy_directory_nested() {
        let dir = setup();
        let source = dir.path().join("rtl");
        fs::create_dir_all(source.join("core")).unwrap();
        fs::write(source.join("core/cpu.v"), "cpu").unwrap();

        let dest = dir.path().join("dest");
        fs::create_dir(&dest).unwrap();

        assert!(paste_path(
            source.to_string_lossy().into_owned(),
            dest.to_string_lossy().into_owned(),
            false
        ).unwrap());

        assert!(dest.join("rtl/core/cpu.v").exists());
    }

    #[test]
    fn copy_uses_duplicate_name() {
        let dir = setup();
        let source = dir.path().join("a.v");
        fs::write(&source, "one").unwrap();

        let dest = dir.path().join("dest");
        fs::create_dir(&dest).unwrap();
        fs::write(dest.join("a.v"), "existing").unwrap();

        assert!(paste_path(
            source.to_string_lossy().into_owned(),
            dest.to_string_lossy().into_owned(),
            false
        ).unwrap());

        assert!(dest.join("a-copy-1.v").exists());
    }

    #[test]
    fn cut_file() {
        let dir = setup();
        let source = dir.path().join("a.v");
        fs::write(&source, "hello").unwrap();

        let dest = dir.path().join("dest");
        fs::create_dir(&dest).unwrap();

        assert!(paste_path(
            source.to_string_lossy().into_owned(),
            dest.to_string_lossy().into_owned(),
            true
        ).unwrap());

        assert!(!source.exists());
        assert!(dest.join("a.v").exists());
    }

    #[test]
    fn cut_directory() {
        let dir = setup();
        let source = dir.path().join("rtl");
        fs::create_dir_all(source.join("core")).unwrap();

        let dest = dir.path().join("dest");
        fs::create_dir(&dest).unwrap();

        assert!(paste_path(
            source.to_string_lossy().into_owned(),
            dest.to_string_lossy().into_owned(),
            true
        ).unwrap());

        assert!(!source.exists());
        assert!(dest.join("rtl/core").exists());
    }

    #[test]
    fn copy_folder_into_itself_rejected() {
        let dir = setup();
        let source = dir.path().join("foo");
        fs::create_dir_all(source.join("bar")).unwrap();

        assert!(paste_path(
            source.to_string_lossy().into_owned(),
            source.to_string_lossy().into_owned(),
            false
        ).is_err());
    }

    #[test]
    fn copy_folder_into_child_rejected() {
        let dir = setup();
        let source = dir.path().join("foo");
        let child = source.join("bar");
        fs::create_dir_all(&child).unwrap();

        assert!(paste_path(
            source.to_string_lossy().into_owned(),
            child.to_string_lossy().into_owned(),
            false
        ).is_err());
    }

    #[test]
    fn copy_folder_into_deep_child_rejected() {
        let dir = setup();
        let source = dir.path().join("foo");
        let child = source.join("bar/baz");
        fs::create_dir_all(&child).unwrap();

        assert!(paste_path(
            source.to_string_lossy().into_owned(),
            child.to_string_lossy().into_owned(),
            false
        ).is_err());
    }

    #[test]
    fn prefix_names_are_not_rejected() {
        let dir = setup();

        let foo = dir.path().join("foo");
        let foobar = dir.path().join("foobar");
        let foo_copy = dir.path().join("foo-copy");

        fs::create_dir_all(&foo).unwrap();
        fs::create_dir_all(&foobar).unwrap();
        fs::create_dir_all(&foo_copy).unwrap();

        assert!(!is_same_or_descendant(&foobar, &foo));
        assert!(!is_same_or_descendant(&foo_copy, &foo));
    }

    #[test]
    fn normalize_lexical_handles_dot_segments() {
        let dir = setup();
        let path = dir.path().join("foo/../bar");

        assert_eq!(
            normalize_lexical(&path),
            dir.path().join("bar")
        );
    }

    #[test]
    fn descendant_detection_handles_nested_paths() {
        let dir = setup();
        let foo = dir.path().join("foo");
        let child = foo.join("bar/baz");

        assert!(is_same_or_descendant(&foo, &child));
        assert!(is_same_or_descendant(&foo, &foo));
    }
}