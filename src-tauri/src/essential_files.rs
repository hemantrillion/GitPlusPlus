use std::fs;
use std::path::Path;
use serde::{Serialize, Deserialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct StatusRecord {
    pub status: String,
    pub timestamp: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ProgressEntry {
    pub id: usize,
    pub entry_type: String, // "commit" or "manual"
    pub timestamp: String,
    pub message: String,
    pub changed_files: Vec<String>,
    pub optional_description: Option<String>,
}

pub struct EssentialFilesManager;

impl EssentialFilesManager {
    /// Init root essential files for a brand new branch or repo
    pub fn initialize_branch_files(folder_path: &Path, project_name: &str, spark_origin: &str, description: &str) -> Result<(), String> {
        let prd_content = format!("# Project Requirements Document (PRD)\n\n## Project: {}\n\n### Origin Spark\n{}\n\n### Overview\n{}\n", project_name, spark_origin, description);
        let wbs_content = format!("# Work Breakdown Structure (WBS)\n\n## {}\n\n- [ ] Initial Repository Setup\n- [ ] Branch Architecture Setup\n- [ ] Essential Files Verification\n", project_name);
        let readme_content = format!("# {}\n\n{}\n", project_name, description);
        let project_origin_content = format!("# Project Origin\n\n**Spark / Problem Statement:**\n{}\n\n**Created At:** {}\n", spark_origin, chrono::Utc::now().to_rfc3339());
        
        let initial_status = StatusRecord {
            status: "In Development".to_string(),
            timestamp: chrono::Utc::now().to_rfc3339(),
        };

        let initial_progress = format!(
            "# Progress Journal\n\n1. [AUTOMATED] {} | Initialized repository essential files\n",
            chrono::Utc::now().format("%Y-%m-%d %H:%M:%S")
        );

        fs::write(folder_path.join("PRD.md"), prd_content).map_err(|e| e.to_string())?;
        fs::write(folder_path.join("WBS.md"), wbs_content).map_err(|e| e.to_string())?;
        fs::write(folder_path.join("README.md"), readme_content).map_err(|e| e.to_string())?;
        fs::write(folder_path.join("project-origin.md"), project_origin_content).map_err(|e| e.to_string())?;
        fs::write(folder_path.join("STATUS.json"), serde_json::to_string_pretty(&initial_status).unwrap()).map_err(|e| e.to_string())?;
        fs::write(folder_path.join("PROGRESS.md"), initial_progress).map_err(|e| e.to_string())?;

        Ok(())
    }

    /// Append entries on merge into main (Rule 7 & Point 41-42)
    pub fn merge_essential_files(main_folder: &Path, branch_folder: &Path) -> Result<(), String> {
        // Read branch progress and status
        let branch_progress_path = branch_folder.join("PROGRESS.md");
        let main_progress_path = main_folder.join("PROGRESS.md");

        if branch_progress_path.exists() && main_progress_path.exists() {
            let branch_prog = fs::read_to_string(&branch_progress_path).unwrap_or_default();
            let main_prog = fs::read_to_string(&main_progress_path).unwrap_or_default();

            let merged_progress = format!("{}\n\n--- MERGED BRANCH PROGRESS ---\n{}", main_prog, branch_prog);
            fs::write(&main_progress_path, merged_progress).map_err(|e| e.to_string())?;
        }

        // Empty out branch's Status/Progress/Next-Action to merged state
        fs::write(&branch_progress_path, "# Progress Journal\n\n*Already merged — see main*").map_err(|e| e.to_string())?;
        let merged_status = StatusRecord {
            status: "Merged to Main".to_string(),
            timestamp: chrono::Utc::now().to_rfc3339(),
        };
        fs::write(branch_folder.join("STATUS.json"), serde_json::to_string_pretty(&merged_status).unwrap()).map_err(|e| e.to_string())?;

        Ok(())
    }
}
