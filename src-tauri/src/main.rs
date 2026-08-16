// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod git_engine;
mod essential_files;
mod remote_api;

use git_engine::{GitEngine, ScannedCommit};
use essential_files::EssentialFilesManager;
use remote_api::{RemoteApiClient, CreateRepoPayload, RemoteStatus};

#[derive(serde::Serialize, serde::Deserialize, Clone)]
struct LocalNode {
    name: String,
    r#type: String, // "file" or "dir"
    path: String,
    children: Option<Vec<LocalNode>>,
}

fn scan_dir_recursive(dir_path: &std::path::Path) -> Vec<LocalNode> {
    let mut nodes = Vec::new();
    if let Ok(entries) = std::fs::read_dir(dir_path) {
        for entry in entries.flatten() {
            let file_name = entry.file_name().to_string_lossy().to_string();
            if file_name == ".git" || file_name == "node_modules" || file_name == "target" || file_name == ".DS_Store" {
                continue;
            }
            let file_type = entry.file_type();
            let is_dir = file_type.as_ref().map(|t| t.is_dir()).unwrap_or(false);
            let path_str = entry.path().to_string_lossy().to_string();

            if is_dir {
                let children = scan_dir_recursive(&entry.path());
                nodes.push(LocalNode {
                    name: file_name,
                    r#type: "dir".to_string(),
                    path: path_str,
                    children: Some(children),
                });
            } else {
                nodes.push(LocalNode {
                    name: file_name,
                    r#type: "file".to_string(),
                    path: path_str,
                    children: None,
                });
            }
        }
    }
    nodes
}

#[tauri::command]
fn scan_local_folder_tree(folder_path: String) -> Result<Vec<LocalNode>, String> {
    let path = std::path::Path::new(&folder_path);
    if !path.exists() {
        return Err("Local folder path does not exist.".to_string());
    }
    Ok(scan_dir_recursive(path))
}

fn copy_dir_all(src: &std::path::Path, dst: &std::path::Path) -> std::io::Result<()> {
    std::fs::create_dir_all(dst)?;
    for entry in std::fs::read_dir(src)? {
        let entry = entry?;
        let ty = entry.file_type()?;
        if ty.is_dir() {
            copy_dir_all(&entry.path(), &dst.join(entry.file_name()))?;
        } else {
            std::fs::copy(entry.path(), dst.join(entry.file_name()))?;
        }
    }
    Ok(())
}

#[tauri::command]
fn clone_repo_to_desktop(repo_name: String, source_folder: Option<String>) -> Result<String, String> {
    let desktop_dir = std::env::var("USERPROFILE")
        .map(|p| std::path::PathBuf::from(p).join("Desktop"))
        .unwrap_or_else(|_| std::path::PathBuf::from("C:\\Users\\Desktop"));

    let target_path = desktop_dir.join(&repo_name);
    if let Err(e) = std::fs::create_dir_all(&target_path) {
        return Err(format!("Failed to create folder: {}", e));
    }

    if let Some(ref src) = source_folder {
        let src_path = std::path::Path::new(src);
        if src_path.exists() {
            let _ = copy_dir_all(src_path, &target_path);
        }
    }

    let readme_path = target_path.join("README.md");
    if !readme_path.exists() {
        let _ = std::fs::write(&readme_path, format!("# {}\n\nCloned via Git++.", repo_name));
    }

    Ok(target_path.to_string_lossy().to_string())
}

#[tauri::command]
fn save_token(provider: String, token: String) -> Result<(), String> {
    RemoteApiClient::store_token(&provider, &token)
}

#[tauri::command]
fn get_token(provider: String) -> Result<String, String> {
    RemoteApiClient::get_token(&provider)
}

#[tauri::command]
fn validate_storage_path(path: String) -> Result<String, String> {
    let canonical = GitEngine::canonicalize_and_verify_path(&path)?;
    Ok(canonical.to_string_lossy().to_string())
}

#[tauri::command]
fn verify_branch_id(folder_path: String, expected_repo_id: String, expected_branch: String) -> Result<(), String> {
    GitEngine::verify_branch_id(std::path::Path::new(&folder_path), &expected_repo_id, &expected_branch)
}

#[tauri::command]
fn scan_git_history(repo_path: String, last_scanned_hash: Option<String>) -> Result<(Vec<ScannedCommit>, String), String> {
    GitEngine::scan_commit_history(std::path::Path::new(&repo_path), last_scanned_hash.as_deref())
}

#[tauri::command]
async fn create_remote_repo(payload: CreateRepoPayload) -> Result<RemoteStatus, String> {
    RemoteApiClient::create_remote_repositories(&payload).await
}

#[tauri::command]
fn pick_folder() -> Option<String> {
    rfd::FileDialog::new()
        .set_title("Select Folder to Link")
        .pick_folder()
        .map(|path| path.to_string_lossy().to_string())
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            save_token,
            get_token,
            validate_storage_path,
            verify_branch_id,
            scan_git_history,
            create_remote_repo,
            pick_folder,
            scan_local_folder_tree,
            clone_repo_to_desktop
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
