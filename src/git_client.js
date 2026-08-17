// Git Client - State & Real Remote REST API Integration Engine

const STORAGE_KEY_AUTH = 'gitpp_auth_credentials';
const STORAGE_KEY_REPOS = 'gitpp_repos_list';
const STORAGE_KEY_CONFIG = 'gitpp_app_config';

export const ESSENTIAL_FILE_NAMES = {
  prd: 'gitpp-essential-prd-spec.md',
  wbs: 'gitpp-essential-wbs-tasks.md',
  readme: 'README.md',
  status: 'gitpp-essential-status-record.json',
  progress: 'gitpp-essential-progress-journal.md',
  origin: 'project-origin.md'
};

export const STATUS_PIPELINE = [
  'idea',
  'PRD',
  'WBS',
  'prototype',
  'MVP',
  'project',
  'done',
  'final report'
];

export function validateStoragePath(pathStr) {
  if (!pathStr || pathStr.trim().length === 0) {
    return { valid: false, error: 'Storage path cannot be empty.' };
  }
  return { valid: true };
}

export function validateRepoName(name) {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'Repository name cannot be empty.' };
  }
  if (name.length > 100) {
    return { valid: false, error: 'Repository name cannot exceed 100 characters.' };
  }
  const repoRegex = /^[a-zA-Z0-9_.-]+$/;
  if (!repoRegex.test(name)) {
    return { valid: false, error: "Invalid repository name. Only alphanumeric, '_', '.', and '-' are allowed." };
  }
  return { valid: true };
}

export function validateBranchName(branchName) {
  if (!branchName || branchName.trim().length === 0) {
    return { valid: false, error: 'Branch name cannot be empty.' };
  }
  if (branchName.startsWith('/') || branchName.endsWith('/') || branchName.includes('//')) {
    return { valid: false, error: "Branch name cannot start/end with '/' or contain consecutive slashes." };
  }
  const branchSegmentRegex = /^[a-zA-Z0-9_.-]+$/;
  const segments = branchName.split('/');
  for (const seg of segments) {
    if (!branchSegmentRegex.test(seg)) {
      return { valid: false, error: `Invalid characters in branch segment '${seg}'.` };
    }
  }
  return { valid: true };
}

export function getAppConfig() {
  const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
  if (saved) {
    try { return JSON.parse(saved); } catch (e) { console.error(e); }
  }
  return {
    dataStoragePath: 'C:\\Users\\Default\\AppData\\Local\\GitPlusPlus',
    firstRunCompleted: false
  };
}

export function saveAppConfig(config) {
  localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
}

export function getAuthCredentials() {
  const saved = localStorage.getItem(STORAGE_KEY_AUTH);
  if (!saved) return { githubConnected: false, gitlabConnected: false, githubToken: '', gitlabToken: '' };
  try {
    return JSON.parse(saved);
  } catch {
    return { githubConnected: false, gitlabConnected: false, githubToken: '', gitlabToken: '' };
  }
}

export function saveAuthCredentials(creds) {
  localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(creds));
}

export function getInitialRepos() {
  const saved = localStorage.getItem(STORAGE_KEY_REPOS);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      return parsed.filter(r => r.name !== 'alpha-system-kernel' && r.name !== 'remote-system-service');
    } catch (e) {
      console.error(e);
    }
  }
  return [];
}

export function saveRepos(repos) {
  const cleaned = repos.filter(r => r.name !== 'alpha-system-kernel' && r.name !== 'remote-system-service');
  localStorage.setItem(STORAGE_KEY_REPOS, JSON.stringify(cleaned));
}

export function buildNestedTreeFromGitItems(gitItems) {
  const root = [];
  const map = {};

  gitItems.forEach(item => {
    const parts = item.path.split('/');
    let currentPath = '';

    parts.forEach((part, idx) => {
      const parentPath = currentPath;
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const isFile = idx === parts.length - 1 && item.type === 'blob';

      if (!map[currentPath]) {
        const newNode = {
          name: part,
          type: isFile ? 'file' : 'dir',
          path: currentPath,
          children: isFile ? undefined : []
        };
        map[currentPath] = newNode;

        if (idx === 0) {
          root.push(newNode);
        } else if (map[parentPath] && map[parentPath].children) {
          map[parentPath].children.push(newNode);
        }
      }
    });
  });

  return root;
}

// Upload file directly to GitHub remote via REST API
export async function remoteUploadFileToGitHub(auth, owner, repoName, branchName, pathInRepo, contentUtf8, sha = null) {
  if (auth.githubConnected && auth.githubToken) {
    try {
      const base64Content = btoa(unescape(encodeURIComponent(contentUtf8)));
      const bodyPayload = {
        message: `Commit ${pathInRepo} via Git++`,
        content: base64Content,
        branch: branchName
      };
      if (sha) bodyPayload.sha = sha;

      const res = await fetch(`https://api.github.com/repos/${owner}/${repoName}/contents/${pathInRepo}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${auth.githubToken.trim()}`,
          'User-Agent': 'GitPlusPlus-App',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bodyPayload)
      });
      return res.ok;
    } catch (e) {
      console.error('Remote upload file error:', e);
    }
  }
  return false;
}

// --- REAL REMOTE REST API FUNCTIONS ---

export async function remoteCheckRepoExists(auth, repoName) {
  if (auth.githubConnected && auth.githubToken) {
    try {
      const userRes = await fetch('https://api.github.com/user', {
        headers: { 'Authorization': `Bearer ${auth.githubToken.trim()}`, 'User-Agent': 'GitPlusPlus-App' }
      });
      if (userRes.ok) {
        const userData = await userRes.json();
        const res = await fetch(`https://api.github.com/repos/${userData.login}/${repoName}`, {
          headers: { 'Authorization': `Bearer ${auth.githubToken.trim()}`, 'User-Agent': 'GitPlusPlus-App' }
        });
        return res.status === 200;
      }
    } catch (e) {
      console.error('Check repo exists error:', e);
    }
  }
  return false;
}

export async function remoteCreateRepo(auth, { name, description, isPrivate }) {
  if (auth.githubConnected && auth.githubToken) {
    try {
      const res = await fetch('https://api.github.com/user/repos', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${auth.githubToken.trim()}`,
          'User-Agent': 'GitPlusPlus-App',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          description: description || '',
          private: isPrivate,
          auto_init: true
        })
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.error('Remote create repo error:', e);
    }
  }
  return null;
}

export async function remoteDeleteRepo(auth, owner, repoName) {
  if (auth.githubConnected && auth.githubToken) {
    try {
      let targetOwner = owner;
      if (!targetOwner) {
        const userRes = await fetch('https://api.github.com/user', {
          headers: { 'Authorization': `Bearer ${auth.githubToken.trim()}`, 'User-Agent': 'GitPlusPlus-App' }
        });
        if (userRes.ok) {
          const userData = await userRes.json();
          targetOwner = userData.login;
        }
      }

      if (targetOwner) {
        const deleteRes = await fetch(`https://api.github.com/repos/${targetOwner}/${repoName}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${auth.githubToken.trim()}`,
            'User-Agent': 'GitPlusPlus-App'
          }
        });
        return deleteRes.ok;
      }
    } catch (e) {
      console.error('Remote delete repo error:', e);
    }
  }
  return false;
}

export async function fetchRemoteBranches(auth, owner, repoName) {
  if (auth.githubConnected && auth.githubToken) {
    try {
      const res = await fetch(`https://api.github.com/repos/${owner}/${repoName}/branches`, {
        headers: { 'Authorization': `Bearer ${auth.githubToken.trim()}`, 'User-Agent': 'GitPlusPlus-App' }
      });
      if (res.ok) {
        const branchesData = await res.json();
        return branchesData.map(b => ({
          name: b.name,
          commitSha: b.commit.sha,
          isMerged: false,
          reason: ''
        }));
      }
    } catch (e) {
      console.error('Fetch branches error:', e);
    }
  }
  return [];
}

export async function fetchRemoteTree(auth, owner, repoName, branchName) {
  if (auth.githubConnected && auth.githubToken) {
    try {
      const res = await fetch(`https://api.github.com/repos/${owner}/${repoName}/git/trees/${branchName}?recursive=1`, {
        headers: { 'Authorization': `Bearer ${auth.githubToken.trim()}`, 'User-Agent': 'GitPlusPlus-App' }
      });
      if (res.ok) {
        const treeData = await res.json();
        if (treeData.tree && Array.isArray(treeData.tree)) {
          return buildNestedTreeFromGitItems(treeData.tree);
        }
      }
    } catch (e) {
      console.error('Fetch tree error:', e);
    }
  }
  return [];
}

export async function remoteRenameRepo(auth, repoName, newName) {
  if (auth.githubConnected && auth.githubToken) {
    try {
      const userRes = await fetch('https://api.github.com/user', {
        headers: { 'Authorization': `Bearer ${auth.githubToken.trim()}`, 'User-Agent': 'GitPlusPlus-App' }
      });
      if (userRes.ok) {
        const userData = await userRes.json();
        const owner = userData.login;
        await fetch(`https://api.github.com/repos/${owner}/${repoName}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${auth.githubToken.trim()}`,
            'User-Agent': 'GitPlusPlus-App',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ name: newName })
        });
      }
    } catch (e) {
      console.error('Remote rename repo error:', e);
    }
  }
}

export async function remoteToggleRepoVisibility(auth, repoName, isPrivate) {
  if (auth.githubConnected && auth.githubToken) {
    try {
      const userRes = await fetch('https://api.github.com/user', {
        headers: { 'Authorization': `Bearer ${auth.githubToken.trim()}`, 'User-Agent': 'GitPlusPlus-App' }
      });
      if (userRes.ok) {
        const userData = await userRes.json();
        const owner = userData.login;
        await fetch(`https://api.github.com/repos/${owner}/${repoName}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${auth.githubToken.trim()}`,
            'User-Agent': 'GitPlusPlus-App',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ private: isPrivate })
        });
      }
    } catch (e) {
      console.error('Remote toggle visibility error:', e);
    }
  }
}

export async function remoteRenameBranch(auth, repoName, oldBranch, newBranch) {
  if (auth.githubConnected && auth.githubToken) {
    try {
      const userRes = await fetch('https://api.github.com/user', {
        headers: { 'Authorization': `Bearer ${auth.githubToken.trim()}`, 'User-Agent': 'GitPlusPlus-App' }
      });
      if (userRes.ok) {
        const userData = await userRes.json();
        const owner = userData.login;
        await fetch(`https://api.github.com/repos/${owner}/${repoName}/branches/${oldBranch}/rename`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${auth.githubToken.trim()}`,
            'User-Agent': 'GitPlusPlus-App',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ new_name: newBranch })
        });
      }
    } catch (e) {
      console.error('Remote rename branch error:', e);
    }
  }
}

export async function remoteCreateBranch(auth, repoName, newBranch, parentBranch = 'main', targetOwner = null) {
  if (auth.githubConnected && auth.githubToken) {
    try {
      let owner = targetOwner;
      if (!owner) {
        const userRes = await fetch('https://api.github.com/user', {
          headers: { 'Authorization': `Bearer ${auth.githubToken.trim()}`, 'User-Agent': 'GitPlusPlus-App' }
        });
        if (userRes.ok) {
          const userData = await userRes.json();
          owner = userData.login;
        }
      }

      if (owner) {
        let refRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/git/ref/heads/${parentBranch}`, {
          headers: { 'Authorization': `Bearer ${auth.githubToken.trim()}`, 'User-Agent': 'GitPlusPlus-App' }
        });

        if (!refRes.ok) {
          refRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/git/ref/heads/main`, {
            headers: { 'Authorization': `Bearer ${auth.githubToken.trim()}`, 'User-Agent': 'GitPlusPlus-App' }
          });
        }
        if (!refRes.ok) {
          refRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/git/ref/heads/master`, {
            headers: { 'Authorization': `Bearer ${auth.githubToken.trim()}`, 'User-Agent': 'GitPlusPlus-App' }
          });
        }

        if (refRes.ok) {
          const refData = await refRes.json();
          const sha = refData.object.sha;
          const createRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/git/refs`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${auth.githubToken.trim()}`,
              'User-Agent': 'GitPlusPlus-App',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ ref: `refs/heads/${newBranch}`, sha })
          });
          return createRes.ok;
        }
      }
    } catch (e) {
      console.error('Remote create branch error:', e);
    }
  }
  return false;
}

export async function remoteMergeBranch(auth, repoName, sourceBranch, targetBranch) {
  if (auth.githubConnected && auth.githubToken) {
    try {
      const userRes = await fetch('https://api.github.com/user', {
        headers: { 'Authorization': `Bearer ${auth.githubToken.trim()}`, 'User-Agent': 'GitPlusPlus-App' }
      });
      if (userRes.ok) {
        const userData = await userRes.json();
        const owner = userData.login;
        await fetch(`https://api.github.com/repos/${owner}/${repoName}/merges`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${auth.githubToken.trim()}`,
            'User-Agent': 'GitPlusPlus-App',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ base: targetBranch, head: sourceBranch, commit_message: `Merged branch ${sourceBranch} into ${targetBranch}` })
        });
      }
    } catch (e) {
      console.error('Remote merge error:', e);
    }
  }
}
