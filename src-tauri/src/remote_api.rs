use serde::{Deserialize, Serialize};
use keyring::Entry;

const KEYRING_SERVICE: &str = "GitPlusPlusApp";

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateRepoPayload {
    pub name: String,
    pub description: String,
    pub is_private: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RemoteStatus {
    pub github_status: String, // "synced", "failed", "not_configured"
    pub gitlab_status: String, // "synced", "failed", "not_configured"
    pub github_url: Option<String>,
    pub gitlab_url: Option<String>,
    pub error_message: Option<String>,
}

pub struct RemoteApiClient;

impl RemoteApiClient {
    /// Securely store PAT token inside OS Keyring (Windows Credential Manager / macOS Keychain / Linux Secret Service)
    pub fn store_token(provider: &str, token: &str) -> Result<(), String> {
        let entry = Entry::new(KEYRING_SERVICE, provider)
            .map_err(|e| format!("Failed to initialize OS keyring entry for {}: {}", provider, e))?;
        entry.set_password(token)
            .map_err(|e| format!("Failed to save token to OS Keychain/Credential Manager: {}", e))?;
        Ok(())
    }

    /// Retrieve PAT token securely from OS Keyring
    pub fn get_token(provider: &str) -> Result<String, String> {
        let entry = Entry::new(KEYRING_SERVICE, provider)
            .map_err(|e| format!("Keyring error for {}: {}", provider, e))?;
        entry.get_password()
            .map_err(|e| format!("Token not found in OS Keychain for {}: {}", provider, e))
    }

    /// Create remote repositories with Option (b) Partial Sync Warning handling
    pub async fn create_remote_repositories(payload: &CreateRepoPayload) -> Result<RemoteStatus, String> {
        let mut status = RemoteStatus {
            github_status: "not_configured".to_string(),
            gitlab_status: "not_configured".to_string(),
            github_url: None,
            gitlab_url: None,
            error_message: None,
        };

        // GitHub API Creation
        if let Ok(gh_token) = Self::get_token("github") {
            if !gh_token.is_empty() {
                let client = reqwest::Client::new();
                let body = serde_json::json!({
                    "name": payload.name,
                    "description": payload.description,
                    "private": payload.is_private,
                    "auto_init": false
                });

                let res = client.post("https://api.github.com/user/repos")
                    .header("User-Agent", "GitPlusPlus-Desktop")
                    .header("Authorization", format!("Bearer {}", gh_token))
                    .json(&body)
                    .send()
                    .await;

                match res {
                    Ok(resp) if resp.status().is_success() => {
                        let json: serde_json::Value = resp.json().await.unwrap_or_default();
                        status.github_url = json["clone_url"].as_str().map(|s| s.to_string());
                        status.github_status = "synced".to_string();
                    }
                    Ok(resp) => {
                        status.github_status = "failed".to_string();
                        status.error_message = Some(format!("GitHub API Error HTTP {}", resp.status()));
                    }
                    Err(e) => {
                        status.github_status = "failed".to_string();
                        status.error_message = Some(format!("GitHub Connection Error: {}", e));
                    }
                }
            }
        }

        // GitLab API Creation
        if let Ok(gl_token) = Self::get_token("gitlab") {
            if !gl_token.is_empty() {
                let client = reqwest::Client::new();
                let body = serde_json::json!({
                    "name": payload.name,
                    "description": payload.description,
                    "visibility": if payload.is_private { "private" } else { "public" }
                });

                let res = client.post("https://gitlab.com/api/v4/projects")
                    .header("PRIVATE-TOKEN", gl_token)
                    .json(&body)
                    .send()
                    .await;

                match res {
                    Ok(resp) if resp.status().is_success() => {
                        let json: serde_json::Value = resp.json().await.unwrap_or_default();
                        status.gitlab_url = json["http_url_to_repo"].as_str().map(|s| s.to_string());
                        status.gitlab_status = "synced".to_string();
                    }
                    Ok(resp) => {
                        status.gitlab_status = "failed".to_string();
                        let existing = status.error_message.unwrap_or_default();
                        status.error_message = Some(format!("{} | GitLab API Error HTTP {}", existing, resp.status()));
                    }
                    Err(e) => {
                        status.gitlab_status = "failed".to_string();
                        let existing = status.error_message.unwrap_or_default();
                        status.error_message = Some(format!("{} | GitLab Connection Error: {}", existing, e));
                    }
                }
            }
        }

        Ok(status)
    }
}
