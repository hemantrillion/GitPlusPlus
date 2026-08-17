import React, { useState, useEffect } from 'react';
import LoginScreen from './LoginScreen';
import Dashboard from './Dashboard';
import RepoHeader from './RepoHeader';
import BranchTabs from './BranchTabs';
import FileTreeView from './FileTreeView';
import CommitModal from './CommitModal';
import LinkWarningBanner from './LinkWarningBanner';
import EssentialFileEditorModal from './EssentialFileEditorModal';
import FirstLaunchSetupWizard from './FirstLaunchSetupWizard';
import {
  getAuthCredentials, saveAuthCredentials, getInitialRepos, saveRepos, getAppConfig, saveAppConfig,
  fetchRemoteBranches, fetchRemoteTree, remoteRenameRepo, remoteToggleRepoVisibility, remoteRenameBranch, remoteCreateBranch, remoteMergeBranch,
  remoteCreateRepo, remoteDeleteRepo, remoteUploadFileToGitHub,
  ESSENTIAL_FILE_NAMES, STATUS_PIPELINE
} from './git_client';

export default function App() {
  const [config, setConfig] = useState(getAppConfig());
  const [auth, setAuth] = useState(getAuthCredentials());
  const [repos, setRepos] = useState(getInitialRepos());
  const [activeRepoId, setActiveRepoId] = useState(null);

  // Link Path Workflow Mode: 'idle' | 'select_branch' | 'select_folder'
  const [linkPathMode, setLinkPathMode] = useState('idle');
  const [linkPathBranch, setLinkPathBranch] = useState(null);
  const [linkPathFolder, setLinkPathFolder] = useState(null);

  const [isCommitMode, setIsCommitMode] = useState(false);
  const [showCommitModal, setShowCommitModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [mismatchWarning, setMismatchWarning] = useState(null);
  const [editingFile, setEditingFile] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    saveRepos(repos);
  }, [repos]);

  useEffect(() => {
    if (toastMessage && linkPathMode === 'idle') {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage, linkPathMode]);

  const activeRepo = repos.find(r => r.id === activeRepoId) || null;
  const activeBranch = activeRepo?.branches?.find(b => b.name === activeRepo.activeBranch) || null;
  const isAuthValid = auth.githubConnected || auth.gitlabConnected;

  const handleCompleteFirstRun = ({ dataStoragePath }) => {
    const updated = { ...config, dataStoragePath, firstRunCompleted: true };
    setConfig(updated);
    saveAppConfig(updated);
  };

  const handleLoginSuccess = (credentials) => {
    setAuth(credentials);
    saveAuthCredentials(credentials);
  };

  // Helper to append a numbered, timestamped log entry to gitpp-essential-progress-journal.md
  const appendProgressJournal = (existingContent = '', eventType, detailsText) => {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const existingEntries = (existingContent.match(/### Entry #\d+/g) || []).length;
    const entryNumber = existingEntries + 1;

    const newEntryHeader = `\n\n### Entry #${entryNumber} [${timestamp}]\n**Event:** ${eventType}\n${detailsText}`;
    return (existingContent || '# Progress Journal\n').trim() + newEntryHeader;
  };

  const handleScanAccountRepos = async () => {
    setToastMessage('Scanning remote account...');
    let fetchedRepos = [];
    let errors = [];

    if (auth.githubConnected) {
      try {
        const headers = {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'GitPlusPlus-App'
        };
        if (auth.githubToken && auth.githubToken.trim()) {
          headers['Authorization'] = `Bearer ${auth.githubToken.trim()}`;
        }

        const res = await fetch('https://api.github.com/user/repos?per_page=100&sort=updated', { headers });
        if (res.ok) {
          const ghRepos = await res.json();
          const mappedGh = ghRepos.map(repo => ({
            id: `gh-${repo.id}`,
            name: repo.name,
            owner: repo.owner.login,
            description: repo.description || '',
            isPrivate: repo.private,
            hasReadme: true,
            projectOrigin: '',
            isCreatedInApp: false,
            githubSynced: true,
            gitlabSynced: false,
            activeBranch: null,
            branches: [
              {
                name: repo.default_branch || 'main',
                origin: 'Root',
                derivedFrom: null,
                reason: '',
                status: STATUS_PIPELINE[0],
                linkedPath: '',
                isMerged: false,
                filesTree: []
              }
            ]
          }));
          fetchedRepos = [...fetchedRepos, ...mappedGh];
        } else {
          errors.push(`GitHub status ${res.status}`);
        }
      } catch (err) {
        errors.push(`GitHub Fetch Error: ${err.message}`);
      }
    }

    if (fetchedRepos.length > 0) {
      setRepos(prev => {
        const existingNames = new Set(prev.map(r => r.name));
        const newOnes = fetchedRepos.filter(r => !existingNames.has(r.name));
        return [...newOnes, ...prev];
      });
      setToastMessage(`Imported ${fetchedRepos.length} repository(ies) from account.`);
    } else if (errors.length > 0) {
      setToastMessage(`Scan Failed: ${errors.join(' | ')}`);
    } else {
      setToastMessage('No repositories found.');
    }
  };

  const handleSelectRepo = async (repoId) => {
    setActiveRepoId(repoId);
    setLinkPathMode('idle');
    setLinkPathBranch(null);
    setLinkPathFolder(null);

    const targetRepo = repos.find(r => r.id === repoId);
    if (targetRepo && targetRepo.owner) {
      const realBranches = await fetchRemoteBranches(auth, targetRepo.owner, targetRepo.name);
      if (realBranches.length > 0) {
        const updatedBranches = realBranches.map(rb => {
          const existing = targetRepo.branches?.find(b => b.name === rb.name);
          return {
            name: rb.name,
            origin: existing?.origin || 'Root',
            derivedFrom: existing?.derivedFrom || null,
            reason: existing?.reason || '',
            status: existing?.status || STATUS_PIPELINE[0],
            linkedPath: existing?.linkedPath || '',
            isMerged: rb.isMerged,
            essentialFiles: existing?.essentialFiles || {},
            filesTree: existing?.filesTree || []
          };
        });

        setRepos(prev => prev.map(r => r.id === repoId ? { ...r, branches: updatedBranches } : r));
      }
    }
  };

  const mergeEssentialFilesWithTree = (scannedTree, essentialFilesObj = {}) => {
    const existingNames = new Set(scannedTree.map(f => f.name));
    const essentialItems = [];

    const essentialKeys = Object.values(ESSENTIAL_FILE_NAMES);
    essentialKeys.forEach(eName => {
      if (!existingNames.has(eName) && (eName === ESSENTIAL_FILE_NAMES.readme || essentialFilesObj[eName] !== undefined)) {
        essentialItems.push({ name: eName, type: 'file' });
      }
    });

    return [...essentialItems, ...scannedTree];
  };

  const handleSelectBranch = async (branchName) => {
    if (!activeRepo) return;
    setRepos(prev => prev.map(r => r.id === activeRepo.id ? { ...r, activeBranch: branchName } : r));

    if (linkPathMode === 'select_branch') {
      setLinkPathBranch(branchName);
      setLinkPathMode('select_folder');
      setToastMessage('Select a folder');
    }

    if (activeRepo.owner) {
      const realTree = await fetchRemoteTree(auth, activeRepo.owner, activeRepo.name, branchName);
      if (realTree.length > 0) {
        const updatedBranches = activeRepo.branches.map(b => {
          if (b.name === branchName) {
            const isCreatedInApp = activeRepo.isCreatedInApp || (b.essentialFiles && Object.keys(b.essentialFiles).length > 0);
            const finalTree = isCreatedInApp ? mergeEssentialFilesWithTree(realTree, b.essentialFiles) : realTree;
            return { ...b, filesTree: finalTree };
          }
          return b;
        });
        setRepos(prev => prev.map(r => r.id === activeRepo.id ? { ...r, branches: updatedBranches } : r));
      }
    }
  };

  const handleStartLinkPathFlow = () => {
    setLinkPathMode('select_branch');
    setLinkPathBranch(null);
    setLinkPathFolder(null);
    setToastMessage('Select a branch');
  };

  const handleSelectFolderNode = (folderNode) => {
    if (linkPathMode === 'select_folder') {
      setLinkPathFolder(folderNode);
      setToastMessage(null);
      setShowLinkModal(true);
    }
  };

  const handlePerformClone = async () => {
    if (!activeRepo) return;
    setToastMessage(`Cloning '${activeRepo.name}' to Desktop...`);

    let targetPath = `C:\\Users\\Desktop\\${activeRepo.name}`;
    try {
      if (window.__TAURI__?.core?.invoke) {
        targetPath = await window.__TAURI__.core.invoke('clone_repo_to_desktop', {
          repoName: activeRepo.name,
          sourceFolder: activeBranch?.linkedPath || null
        });
      } else if (window.__TAURI_INTERNALS__?.invoke) {
        targetPath = await window.__TAURI_INTERNALS__.invoke('clone_repo_to_desktop', {
          repoName: activeRepo.name,
          sourceFolder: activeBranch?.linkedPath || null
        });
      }
    } catch (e) {
      console.error('Clone error:', e);
    }

    setToastMessage(`Successfully cloned to ${targetPath}`);
  };

  const handleCreateRepo = async ({ name, isPrivate, addReadme, projectOrigin, description }) => {
    setToastMessage(`Creating repository '${name}' on remote...`);
    const remoteData = await remoteCreateRepo(auth, { name, description, isPrivate });

    const newRepoId = remoteData ? `gh-${remoteData.id}` : `repo-${Date.now()}`;
    const ownerName = remoteData?.owner?.login || '';

    const initialJournal = appendProgressJournal(
      '# Progress Journal\n\nRepository initialized in Git++.',
      'REPOSITORY_CREATED',
      `**Name:** ${name}\n**Origin:** ${projectOrigin || 'N/A'}\n**Description:** ${description || 'N/A'}`
    );

    const initialBranch = {
      name: 'main',
      origin: 'Root',
      derivedFrom: null,
      reason: '',
      status: STATUS_PIPELINE[0],
      linkedPath: `C:\\Users\\Desktop\\${name}`,
      isMerged: false,
      essentialFiles: {
        [ESSENTIAL_FILE_NAMES.prd]: `# PRD Spec - ${name}\n\n${description || ''}`,
        [ESSENTIAL_FILE_NAMES.wbs]: `# WBS Tasks - ${name}\n\n- [ ] Initial setup`,
        [ESSENTIAL_FILE_NAMES.readme]: `# ${name}\n\n${description || ''}`,
        [ESSENTIAL_FILE_NAMES.origin]: projectOrigin || '',
        [ESSENTIAL_FILE_NAMES.status]: JSON.stringify({ currentStatus: STATUS_PIPELINE[0], lastUpdated: new Date().toISOString() }, null, 2),
        [ESSENTIAL_FILE_NAMES.progress]: initialJournal
      },
      filesTree: [
        { name: ESSENTIAL_FILE_NAMES.prd, type: 'file' },
        { name: ESSENTIAL_FILE_NAMES.wbs, type: 'file' },
        { name: ESSENTIAL_FILE_NAMES.readme, type: 'file' },
        { name: ESSENTIAL_FILE_NAMES.origin, type: 'file' },
        { name: ESSENTIAL_FILE_NAMES.status, type: 'file' },
        { name: ESSENTIAL_FILE_NAMES.progress, type: 'file' }
      ]
    };

    const newRepo = {
      id: newRepoId,
      name,
      owner: ownerName,
      description: description || '',
      isPrivate,
      hasReadme: true,
      projectOrigin: projectOrigin || '',
      isCreatedInApp: true,
      githubSynced: auth.githubConnected,
      gitlabSynced: auth.gitlabConnected,
      activeBranch: null,
      branches: [initialBranch]
    };

    setRepos([newRepo, ...repos]);
    setActiveRepoId(newRepoId);
    setToastMessage(`Repository '${name}' created on website & app.`);
  };

  const handleDeleteRepo = async (repoId, repoName) => {
    setToastMessage(`Deleting repository '${repoName}' from GitHub & app...`);
    const targetRepo = repos.find(r => r.id === repoId);
    await remoteDeleteRepo(auth, targetRepo?.owner, repoName);
    setRepos(repos.filter(r => r.id !== repoId));
    if (activeRepoId === repoId) {
      setActiveRepoId(null);
    }
    setToastMessage(`Repository '${repoName}' deleted from website & app.`);
  };

  const handleRenameRepo = (newName) => {
    if (!activeRepo) return;
    const oldName = activeRepo.name;
    remoteRenameRepo(auth, oldName, newName);
    setRepos(repos.map(r => r.id === activeRepo.id ? { ...r, name: newName } : r));
    setToastMessage(`Renamed repository to '${newName}'.`);
  };

  const handleToggleRepoVisibility = (newIsPrivate) => {
    if (!activeRepo) return;
    remoteToggleRepoVisibility(auth, activeRepo.name, newIsPrivate);
    setRepos(repos.map(r => r.id === activeRepo.id ? { ...r, isPrivate: newIsPrivate } : r));
    setToastMessage(`Repository visibility updated to ${newIsPrivate ? 'Private' : 'Public'}.`);
  };

  const handleRenameBranch = (oldBranchName, newBranchName) => {
    if (!activeRepo || oldBranchName === 'main' || oldBranchName === 'master') return;
    remoteRenameBranch(auth, activeRepo.name, oldBranchName, newBranchName);
    const updatedBranches = activeRepo.branches.map(b => b.name === oldBranchName ? { ...b, name: newBranchName } : b);
    setRepos(repos.map(r => r.id === activeRepo.id ? { ...r, activeBranch: newBranchName, branches: updatedBranches } : r));
    setToastMessage(`Renamed branch to '${newBranchName}'.`);
  };

  const handleCreateBranch = async (branchName, parentBranchName, reason) => {
    if (!activeRepo) return;
    setToastMessage(`Creating branch '${branchName}' on GitHub...`);
    await remoteCreateBranch(auth, activeRepo.name, branchName, parentBranchName, activeRepo.owner);

    const parentBranch = activeRepo.branches.find(b => b.name === parentBranchName) || activeRepo.branches[0];
    const initialJournal = appendProgressJournal(
      parentBranch.essentialFiles?.[ESSENTIAL_FILE_NAMES.progress] || '',
      'BRANCH_CREATED',
      `**Branch Name:** ${branchName}\n**Derived From:** ${parentBranchName}\n**Purpose:** ${reason || 'N/A'}`
    );

    const newBranch = {
      name: branchName,
      origin: parentBranchName,
      derivedFrom: parentBranchName,
      reason: reason || '',
      status: STATUS_PIPELINE[0],
      linkedPath: parentBranch.linkedPath || '',
      isMerged: false,
      essentialFiles: {
        ...parentBranch.essentialFiles,
        [ESSENTIAL_FILE_NAMES.progress]: initialJournal
      },
      filesTree: JSON.parse(JSON.stringify(parentBranch.filesTree || []))
    };

    // Live Sync to GitHub Remote website
    if (activeRepo.owner && auth.githubToken) {
      for (const [fName, fContent] of Object.entries(newBranch.essentialFiles)) {
        await remoteUploadFileToGitHub(auth, activeRepo.owner, activeRepo.name, branchName, fName, fContent);
      }
    }

    const updatedBranches = [...activeRepo.branches, newBranch];
    setRepos(repos.map(r => r.id === activeRepo.id ? { ...r, activeBranch: branchName, branches: updatedBranches } : r));
    setToastMessage(`Created & synced branch '${branchName}' live to GitHub website.`);
  };

  const handleMergeBranch = async (sourceBranchName, targetBranchName) => {
    if (!activeRepo) return;
    setToastMessage(`Merging '${sourceBranchName}' into '${targetBranchName}' on remote...`);
    await remoteMergeBranch(auth, activeRepo.name, sourceBranchName, targetBranchName);

    const updatedBranches = activeRepo.branches.map(b => {
      if (b.name === targetBranchName) {
        const updatedJournal = appendProgressJournal(
          b.essentialFiles?.[ESSENTIAL_FILE_NAMES.progress] || '',
          'BRANCH_MERGED',
          `Merged branch **${sourceBranchName}** into **${targetBranchName}**.`
        );
        return {
          ...b,
          isMerged: true,
          essentialFiles: { ...(b.essentialFiles || {}), [ESSENTIAL_FILE_NAMES.progress]: updatedJournal }
        };
      }
      return b;
    });
    setRepos(repos.map(r => r.id === activeRepo.id ? { ...r, activeBranch: targetBranchName, branches: updatedBranches } : r));
    setToastMessage(`Merged '${sourceBranchName}' into '${targetBranchName}'.`);
  };

  const handleExecuteCommitPush = async (commitMessage) => {
    if (!activeRepo || !activeBranch) return;

    setToastMessage(`Pushing ${selectedFiles.length} file(s) to GitHub...`);
    const fileListText = selectedFiles.map(f => `- ${f}`).join('\n');
    const journalDetails = `**Commit Message:** ${commitMessage}\n**Changed Files (${selectedFiles.length}):**\n${fileListText}`;

    const updatedJournal = appendProgressJournal(
      activeBranch.essentialFiles?.[ESSENTIAL_FILE_NAMES.progress] || '',
      'COMMIT_PUSH',
      journalDetails
    );

    // Push progress journal and selected files to GitHub remote so website updates
    if (activeRepo.owner && auth.githubToken) {
      await remoteUploadFileToGitHub(auth, activeRepo.owner, activeRepo.name, activeBranch.name, ESSENTIAL_FILE_NAMES.progress, updatedJournal);

      // Upload selected files
      for (const fName of selectedFiles) {
        const content = activeBranch.essentialFiles?.[fName] || `# ${fName}\n\nCommitted via Git++.`;
        await remoteUploadFileToGitHub(auth, activeRepo.owner, activeRepo.name, activeBranch.name, fName, content);
      }
    }

    const updatedEssentialFiles = {
      ...(activeBranch.essentialFiles || {}),
      [ESSENTIAL_FILE_NAMES.progress]: updatedJournal
    };

    const updatedBranches = activeRepo.branches.map(b =>
      b.name === activeBranch.name ? { ...b, essentialFiles: updatedEssentialFiles } : b
    );

    setRepos(repos.map(r => r.id === activeRepo.id ? { ...r, branches: updatedBranches } : r));
    setIsCommitMode(false);
    setSelectedFiles([]);
    setToastMessage(`Pushed ${selectedFiles.length} file(s) & committed live to GitHub website.`);
  };

  const handlePlanSequence = () => {
    if (!activeRepo || !activeBranch) return;
    const planText = prompt("Plan next action sequence for branch '" + activeBranch.name + "':");
    if (planText && planText.trim()) {
      const updatedJournal = appendProgressJournal(
        activeBranch.essentialFiles?.[ESSENTIAL_FILE_NAMES.progress] || '',
        'PLAN_SEQUENCE',
        `**Planned Sequence:** ${planText.trim()}`
      );

      const updatedEssentialFiles = {
        ...(activeBranch.essentialFiles || {}),
        [ESSENTIAL_FILE_NAMES.progress]: updatedJournal
      };

      const updatedBranches = activeRepo.branches.map(b =>
        b.name === activeBranch.name ? { ...b, essentialFiles: updatedEssentialFiles } : b
      );

      setRepos(repos.map(r => r.id === activeRepo.id ? { ...r, branches: updatedBranches } : r));
      setToastMessage('Action sequence logged to progress journal.');
    }
  };

  const handleUpdateStatus = (newStage) => {
    if (!activeRepo || !activeBranch) return;

    const currentStatus = activeBranch.status || STATUS_PIPELINE[0];
    const currentIdx = STATUS_PIPELINE.indexOf(currentStatus);
    const newIdx = STATUS_PIPELINE.indexOf(newStage);

    if (newIdx < currentIdx) {
      setToastMessage('Status cannot be retracted to a previous stage.');
      return;
    }

    const updatedJournal = appendProgressJournal(
      activeBranch.essentialFiles?.[ESSENTIAL_FILE_NAMES.progress] || '',
      'STATUS_CHANGED',
      `Status advanced from **${currentStatus}** to **${newStage}**.`
    );

    const statusRecordObj = {
      currentStatus: newStage,
      previousStatus: currentStatus,
      lastUpdated: new Date().toISOString()
    };

    const updatedEssentialFiles = {
      ...(activeBranch.essentialFiles || {}),
      [ESSENTIAL_FILE_NAMES.status]: JSON.stringify(statusRecordObj, null, 2),
      [ESSENTIAL_FILE_NAMES.progress]: updatedJournal
    };

    const updatedBranches = activeRepo.branches.map(b =>
      b.name === activeBranch.name ? { ...b, status: newStage, essentialFiles: updatedEssentialFiles } : b
    );

    setRepos(repos.map(r => r.id === activeRepo.id ? { ...r, branches: updatedBranches } : r));
    setToastMessage(`Status updated to '${newStage}'.`);
  };

  const handleOpenEssentialFile = async (fileName) => {
    if (!activeBranch) return;
    let content = activeBranch.essentialFiles?.[fileName] || `# ${fileName}`;

    if (activeRepo.owner && auth.githubToken) {
      try {
        const res = await fetch(`https://api.github.com/repos/${activeRepo.owner}/${activeRepo.name}/contents/${fileName}?ref=${activeBranch.name}`, {
          headers: { 'Authorization': `Bearer ${auth.githubToken.trim()}`, 'User-Agent': 'GitPlusPlus-App' }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.content) {
            content = atob(data.content.replace(/\n/g, ''));
          }
        }
      } catch (e) {
        console.error('Fetch file content error:', e);
      }
    }

    setEditingFile({ type: fileName, content });
  };

  const handleSaveEssentialFileContent = (newContent) => {
    if (!activeRepo || !activeBranch || !editingFile) return;
    const updatedEssentialFiles = { ...(activeBranch.essentialFiles || {}), [editingFile.type]: newContent };
    const updatedBranches = activeRepo.branches.map(b => b.name === activeBranch.name ? { ...b, essentialFiles: updatedEssentialFiles } : b);
    setRepos(repos.map(r => r.id === activeRepo.id ? { ...r, branches: updatedBranches } : r));
    setToastMessage(`Saved ${editingFile.type}.`);
  };

  if (!config.firstRunCompleted) {
    return <FirstLaunchSetupWizard onCompleteSetup={handleCompleteFirstRun} />;
  }

  if (!isAuthValid) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  if (!activeRepoId || !activeRepo) {
    return (
      <Dashboard
        repos={repos}
        activeRepoId={activeRepoId}
        onSelectRepo={handleSelectRepo}
        onCreateRepo={handleCreateRepo}
        onDeleteRepo={handleDeleteRepo}
        onScanAccountRepos={handleScanAccountRepos}
        toastMessage={toastMessage}
        auth={auth}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100vw', height: '100vh', backgroundColor: '#FFFFFF', overflow: 'hidden', position: 'relative' }}>
      {/* Toast Message */}
      {toastMessage && (
        <div style={{
          position: 'absolute', top: '16px', right: '24px', zIndex: 200,
          backgroundColor: linkPathMode !== 'idle' ? '#DC2626' : '#1A1A1A',
          color: '#FFFFFF', padding: '10px 20px',
          borderRadius: '4px', fontSize: '13px', fontWeight: 700, boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}>
          {toastMessage}
        </div>
      )}

      {/* Repo Header */}
      <RepoHeader
        repo={activeRepo}
        onRenameRepo={handleRenameRepo}
        onUpdateDescription={(newDesc) => setRepos(repos.map(r => r.id === activeRepo.id ? { ...r, description: newDesc } : r))}
        onUpdateProjectOrigin={(newOrigin) => setRepos(repos.map(r => r.id === activeRepo.id ? { ...r, projectOrigin: newOrigin } : r))}
        onBackToDashboard={() => setActiveRepoId(null)}
      />

      {/* Branch Navigation & Red Action Bar */}
      <BranchTabs
        repo={activeRepo}
        branches={activeRepo.branches}
        activeBranch={activeBranch}
        onSelectBranch={handleSelectBranch}
        onCreateBranch={handleCreateBranch}
        onMergeBranch={handleMergeBranch}
        onRenameBranch={handleRenameBranch}
        onUpdateBranchPurpose={(bName, purpose) => {
          const updated = activeRepo.branches.map(b => b.name === bName ? { ...b, reason: purpose } : b);
          setRepos(repos.map(r => r.id === activeRepo.id ? { ...r, branches: updated } : r));
        }}
        onToggleRepoVisibility={handleToggleRepoVisibility}
        onUpdateStatus={handleUpdateStatus}
        isCommitMode={isCommitMode}
        selectedFilesCount={selectedFiles.length}
        onStartCommitMode={() => setIsCommitMode(true)}
        onCancelCommitMode={() => {
          setIsCommitMode(false);
          setSelectedFiles([]);
        }}
        onOpenCommitModal={() => setShowCommitModal(true)}
        onPerformClone={handlePerformClone}
        onOpenLinkModal={handleStartLinkPathFlow}
        onOpenPlanSequence={handlePlanSequence}
      />

      {/* Link Warning Banner & Link Local Path Dialog */}
      <LinkWarningBanner
        branches={activeRepo.branches}
        activeBranch={activeBranch}
        selectedBranchName={linkPathBranch}
        selectedFolderNode={linkPathFolder}
        mismatchWarning={mismatchWarning}
        showLinkModal={showLinkModal}
        onCloseLinkModal={() => {
          setShowLinkModal(false);
          setLinkPathMode('idle');
          setToastMessage(null);
        }}
        onLinkLocalPath={async (newPath, targetBranchName, targetFolderNode) => {
          setMismatchWarning(null);
          const targetB = targetBranchName || linkPathBranch || activeBranch?.name || 'main';

          // Scan local directory via Rust IPC
          let scannedLocalTree = [];
          try {
            if (window.__TAURI__?.core?.invoke) {
              scannedLocalTree = await window.__TAURI__.core.invoke('scan_local_folder_tree', { folderPath: newPath });
            } else if (window.__TAURI_INTERNALS__?.invoke) {
              scannedLocalTree = await window.__TAURI_INTERNALS__.invoke('scan_local_folder_tree', { folderPath: newPath });
            }
          } catch (e) {
            console.error('Scan local tree error:', e);
          }

          const baseTree = scannedLocalTree.length > 0 ? scannedLocalTree : [];
          const finalTree = mergeEssentialFilesWithTree(baseTree, activeBranch?.essentialFiles);

          const updatedBranches = activeRepo.branches.map(b => {
            if (b.name === targetB) {
              return {
                ...b,
                linkedPath: newPath,
                filesTree: finalTree
              };
            }
            return b;
          });

          // Upload essential files to remote so website displays repo state
          if (activeRepo.owner && auth.githubToken && activeBranch?.essentialFiles) {
            for (const [fName, fContent] of Object.entries(activeBranch.essentialFiles)) {
              await remoteUploadFileToGitHub(auth, activeRepo.owner, activeRepo.name, targetB, fName, fContent);
            }
          }

          setRepos(repos.map(r => r.id === activeRepo.id ? { ...r, branches: updatedBranches, activeBranch: targetB } : r));
          setShowLinkModal(false);
          setLinkPathMode('idle');
          setToastMessage(`Linked path '${newPath}' & scanned local tree onto branch '${targetB}'.`);
        }}
      />

      {/* Integrated ASCII File Tree View */}
      <FileTreeView
        repoName={activeRepo.name}
        filesTree={activeBranch ? activeBranch.filesTree : []}
        isCommitMode={isCommitMode}
        selectedFiles={selectedFiles}
        onToggleSelectFile={(fName) => {
          if (selectedFiles.includes(fName)) {
            setSelectedFiles(selectedFiles.filter(f => f !== fName));
          } else {
            setSelectedFiles([...selectedFiles, fName]);
          }
        }}
        onSelectAllFiles={(allFilesList, shouldSelectAll) => {
          if (shouldSelectAll) {
            setSelectedFiles(allFilesList);
          } else {
            setSelectedFiles([]);
          }
        }}
        onSelectFolderFiles={(folderFilesList, shouldSelect) => {
          if (shouldSelect) {
            const combined = Array.from(new Set([...selectedFiles, ...folderFilesList]));
            setSelectedFiles(combined);
          } else {
            setSelectedFiles(selectedFiles.filter(f => !folderFilesList.includes(f)));
          }
        }}
        linkPathMode={linkPathMode}
        selectedFolderNode={linkPathFolder}
        onSelectFolderNode={handleSelectFolderNode}
        onOpenEssentialFile={handleOpenEssentialFile}
      />

      {/* Commit Modal */}
      {showCommitModal && activeBranch && (
        <CommitModal
          activeBranch={activeBranch}
          selectedFiles={selectedFiles}
          showModal={showCommitModal}
          onCloseModal={() => setShowCommitModal(false)}
          onExecuteCommitPush={handleExecuteCommitPush}
        />
      )}

      {/* Essential File Editor Modal */}
      {editingFile && (
        <EssentialFileEditorModal
          fileName={editingFile.type}
          fileContent={editingFile.content}
          onSaveContent={handleSaveEssentialFileContent}
          onClose={() => setEditingFile(null)}
        />
      )}
    </div>
  );
}
