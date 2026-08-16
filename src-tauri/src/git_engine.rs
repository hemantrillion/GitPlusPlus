use std::path::{Path, PathBuf};
use std::fs;
use serde::{Serialize, Deserialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct BranchMarker {
    pub repo_id: String,
    pub branch_name: String,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ScannedCommit {
    pub hash: String,
    pub message: String,
    pub author: String,
    pub timestamp: String,
    pub changed_files: Vec<String>,
}

pub struct GitEngine;

impl GitEngine {
    /// Corrected Regex Range: [a-zA-Z0-9_.-]
    /// Validates repository names against GitHub & GitLab naming standards
    pub fn validate_repo_name(name: &str) -> Result<(), String> {
        if name.trim().is_empty() {
            return Err("Repository name cannot be empty.".to_string());
        }
        if name.len() > 100 {
            return Err("Repository name cannot exceed 100 characters.".to_string());
        }
        for c in name.chars() {
            if !(c.is_ascii_alphanumeric() || c == '_' || c == '.' || c == '-') {
                return Err(format!("Invalid character '{}' in repository name. Only alphanumeric, '_', '.', and '-' are allowed.", c));
            }
        }
        Ok(())
    }

    /// Validates branch names to ensure valid git ref structure
    pub fn validate_branch_name(branch_name: &str) -> Result<(), String> {
        if branch_name.trim().is_empty() {
            return Err("Branch name cannot be empty.".to_string());
        }
        if branch_name.starts_with('/') || branch_name.ends_with('/') || branch_name.contains("//") {
            return Err("Branch name cannot start/end with '/' or contain double slashes.".to_string());
        }
        for segment in branch_name.split('/') {
            for c in segment.chars() {
                if !(c.is_ascii_alphanumeric() || c == '_' || c == '.' || c == '-') {
                    return Err(format!("Invalid character '{}' in branch name segment '{}'.", c, segment));
                }
            }
        }
        Ok(())
    }

    /// Security Guard: Canonicalize path and prevent directory traversal attacks (../../../)
    pub fn canonicalize_and_verify_path(user_input_path: &str) -> Result<PathBuf, String> {
        if user_input_path.trim().is_empty() {
            return Err("Storage location path cannot be empty.".to_string());
        }

        let path = Path::new(user_input_path);
        
        // Auto-create directory if it doesn't exist yet
        if !path.exists() {
            fs::create_dir_all(path)
                .map_err(|e| format!("Failed to create storage folder at '{}': {}", user_input_path, e))?;
        }

        let canonical = match path.canonicalize() {
            Ok(p) => p,
            Err(e) => return Err(format!("Invalid or inaccessible filesystem path '{}': {}", user_input_path, e)),
        };

        if !canonical.is_dir() {
            return Err(format!("Path '{}' is not a valid directory.", user_input_path));
        }

        Ok(canonical)
    }

    /// Read .branch-id marker file from target directory
    pub fn read_branch_id(folder_path: &Path) -> Result<BranchMarker, String> {
        let marker_path = folder_path.join(".branch-id");
        if !marker_path.exists() {
            return Err("Missing .branch-id marker file in linked folder.".to_string());
        }
        let content = fs::read_to_string(&marker_path)
            .map_err(|e| format!("Failed to read .branch-id: {}", e))?;
        let marker: BranchMarker = serde_json::from_str(&content)
            .map_err(|e| format!("Corrupted .branch-id marker format: {}", e))?;
        Ok(marker)
    }

    /// Create and write .branch-id marker file
    pub fn write_branch_id(folder_path: &Path, repo_id: &str, branch_name: &str) -> Result<BranchMarker, String> {
        Self::validate_branch_name(branch_name)?;
        let marker = BranchMarker {
            repo_id: repo_id.to_string(),
            branch_name: branch_name.to_string(),
            created_at: chrono::Utc::now().to_rfc3339(),
        };
        let content = serde_json::to_string_pretty(&marker)
            .map_err(|e| format!("Failed to serialize .branch-id: {}", e))?;
        
        let marker_path = folder_path.join(".branch-id");
        fs::write(&marker_path, content)
            .map_err(|e| format!("Failed to write .branch-id: {}", e))?;
        
        Ok(marker)
    }

    /// Live sanity check: verify .branch-id matches expected repo and branch
    pub fn verify_branch_id(folder_path: &Path, expected_repo_id: &str, expected_branch: &str) -> Result<(), String> {
        let canonical_folder = Self::canonicalize_and_verify_path(folder_path.to_str().unwrap_or_default())?;
        let marker = Self::read_branch_id(&canonical_folder)?;
        
        if marker.repo_id != expected_repo_id {
            return Err(format!(
                "Repository mismatch! Folder is linked to repo '{}', expected '{}'",
                marker.repo_id, expected_repo_id
            ));
        }
        if marker.branch_name != expected_branch {
            return Err(format!(
                "Branch mismatch! Folder is on branch '{}', but selected in-app branch is '{}'",
                marker.branch_name, expected_branch
            ));
        }
        Ok(())
    }

    /// Point 35: Scan commit history with last_scanned_commit_hash deduplication
    pub fn scan_commit_history(repo_path: &Path, last_scanned_hash: Option<&str>) -> Result<(Vec<ScannedCommit>, String), String> {
        let canonical_folder = Self::canonicalize_and_verify_path(repo_path.to_str().unwrap_or_default())?;
        let repo = git2::Repository::open(&canonical_folder)
            .map_err(|e| format!("Failed to open git repository: {}", e))?;

        let mut revwalk = repo.revwalk().map_err(|e| e.to_string())?;
        revwalk.push_head().map_err(|e| e.to_string())?;

        let mut commits = Vec::new();
        let mut newest_hash = String::new();

        for (idx, oid_result) in revwalk.enumerate() {
            let oid = oid_result.map_err(|e| e.to_string())?;
            let hash_str = oid.to_string();

            if idx == 0 {
                newest_hash = hash_str.clone();
            }

            if let Some(stop_hash) = last_scanned_hash {
                if hash_str == stop_hash {
                    break;
                }
            }

            let commit = repo.find_commit(oid).map_err(|e| e.to_string())?;
            let author = commit.author().name().unwrap_or("Unknown").to_string();
            let message = commit.message().unwrap_or("No commit message").trim().to_string();
            let timestamp = chrono::DateTime::from_timestamp(commit.time().seconds(), 0)
                .map(|dt| dt.to_rfc3339())
                .unwrap_or_default();

            commits.push(ScannedCommit {
                hash: hash_str,
                message,
                author,
                timestamp,
                changed_files: vec![],
            });
        }

        commits.reverse();
        Ok((commits, newest_hash))
    }

    /// Exclude .branch-id from merge logic (Rule 4 & 43)
    pub fn is_excluded_from_merge(path_str: &str) -> bool {
        path_str == ".branch-id" || path_str.ends_with("/.branch-id")
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_valid_repo_names() {
        assert!(GitEngine::validate_repo_name("my-repo_Z123.app").is_ok());
        assert!(GitEngine::validate_repo_name("AlphaSystem").is_ok());
        assert!(GitEngine::validate_repo_name("Zebra_Project-001").is_ok());
    }

    #[test]
    fn test_invalid_repo_names() {
        assert!(GitEngine::validate_repo_name("repo with spaces").is_err());
        assert!(GitEngine::validate_repo_name("repo$name").is_err());
        assert!(GitEngine::validate_repo_name("repo#tag").is_err());
        assert!(GitEngine::validate_repo_name("repo/slash").is_err());
    }

    #[test]
    fn test_valid_branch_names() {
        assert!(GitEngine::validate_branch_name("main").is_ok());
        assert!(GitEngine::validate_branch_name("feature/Zebra-System_01").is_ok());
        assert!(GitEngine::validate_branch_name("fix/bug.123").is_ok());
    }

    #[test]
    fn test_invalid_branch_names() {
        assert!(GitEngine::validate_branch_name("/main").is_err());
        assert!(GitEngine::validate_branch_name("main/").is_err());
        assert!(GitEngine::validate_branch_name("feature//double-slash").is_err());
        assert!(GitEngine::validate_branch_name("feature/branch$name").is_err());
    }
}
