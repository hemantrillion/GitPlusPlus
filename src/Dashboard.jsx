import React, { useState, useEffect } from 'react';
import { validateRepoName, remoteCheckRepoExists } from './git_client';

export default function Dashboard({ repos, activeRepoId, onSelectRepo, onCreateRepo, onDeleteRepo, onScanAccountRepos, toastMessage, auth }) {
  const [repoName, setRepoName] = useState('');
  const [isPrivate, setIsPrivate] = useState(true);
  const [projectOrigin, setProjectOrigin] = useState('');
  const [description, setDescription] = useState('');
  const [nameError, setNameError] = useState(null);
  const [isScanningAccount, setIsScanningAccount] = useState(false);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [activeBtn, setActiveBtn] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState(null); // { id, name }

  const isCreateEnabled = repoName.trim().length > 0 && !isCheckingAvailability;

  useEffect(() => {
    const handleGlobalClick = () => setContextMenu(null);
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  const handleNameChange = async (val) => {
    setRepoName(val);
    if (!val.trim()) {
      setNameError(null);
      return;
    }

    const res = validateRepoName(val.trim());
    if (!res.valid) {
      setNameError(res.error);
      return;
    }

    setNameError(null);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!isCreateEnabled || nameError) return;

    setIsCheckingAvailability(true);
    const exists = await remoteCheckRepoExists(auth, repoName.trim());
    setIsCheckingAvailability(false);

    if (exists) {
      setNameError(`Repository name '${repoName.trim()}' already exists on your remote account.`);
      return;
    }

    onCreateRepo({
      name: repoName.trim(),
      isPrivate,
      addReadme: true,
      projectOrigin: projectOrigin.trim(),
      description: description.trim()
    });

    setRepoName('');
    setProjectOrigin('');
    setDescription('');
    setNameError(null);
  };

  const handleContextMenu = (e, repo) => {
    e.preventDefault();
    setContextMenu({
      mouseX: e.clientX,
      mouseY: e.clientY,
      repo
    });
  };

  const handleOpenDeleteModal = (repo) => {
    setContextMenu(null);
    setDeleteConfirmation(repo);
  };

  const handleConfirmDelete = () => {
    if (deleteConfirmation) {
      onDeleteRepo(deleteConfirmation.id, deleteConfirmation.name);
      setDeleteConfirmation(null);
    }
  };

  const handleScanAccount = async () => {
    setIsScanningAccount(true);
    await onScanAccountRepos();
    setIsScanningAccount(false);
  };

  const getBtnStyle = (id, baseWidth = 'auto') => {
    const isActive = activeBtn === id;
    return {
      width: baseWidth,
      height: '36px',
      backgroundColor: isActive ? '#FFFFFF' : '#1A1A1A',
      color: isActive ? '#1A1A1A' : '#FFFFFF',
      border: '1px solid #1A1A1A',
      borderRadius: '4px',
      fontWeight: 600,
      fontSize: '13px',
      padding: '0 16px',
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      outline: 'none',
      userSelect: 'none'
    };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100vw', height: '100vh', backgroundColor: '#FFFFFF', overflow: 'hidden', position: 'relative' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'absolute', top: '16px', right: '24px', zIndex: 200,
          backgroundColor: '#1A1A1A', color: '#FFFFFF', padding: '8px 16px',
          borderRadius: '4px', fontSize: '12px', fontWeight: 600, boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}>
          {toastMessage}
        </div>
      )}

      {/* Custom Delete Confirmation Modal Dialog Box */}
      {deleteConfirmation && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 400
        }}>
          <div style={{
            backgroundColor: '#FFFFFF', width: '420px', borderRadius: '8px',
            border: '1px solid #1A1A1A', padding: '24px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            display: 'flex', flexDirection: 'column', gap: '16px'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1A1A1A', margin: 0, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
              Delete Repository
            </h3>
            <p style={{ fontSize: '13px', color: '#1A1A1A', lineHeight: '20px', margin: 0 }}>
              Are you sure you want to permanently delete repository <strong>'{deleteConfirmation.name}'</strong> from both Git++ and your remote account?
            </p>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button
                onClick={() => setDeleteConfirmation(null)}
                style={{
                  height: '34px', padding: '0 18px', backgroundColor: '#FFFFFF', color: '#1A1A1A',
                  border: '1px solid #1A1A1A', borderRadius: '4px', fontSize: '12px', fontWeight: 600, cursor: 'pointer'
                }}
              >
                No
              </button>
              <button
                onClick={handleConfirmDelete}
                style={{
                  height: '34px', padding: '0 18px', backgroundColor: '#DC2626', color: '#FFFFFF',
                  border: 'none', borderRadius: '4px', fontSize: '12px', fontWeight: 600, cursor: 'pointer'
                }}
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Right-Click Context Menu */}
      {contextMenu && (
        <div style={{
          position: 'fixed',
          top: contextMenu.mouseY,
          left: contextMenu.mouseX,
          backgroundColor: '#FFFFFF',
          border: '1px solid #1A1A1A',
          borderRadius: '4px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 300,
          padding: '4px 0',
          minWidth: '140px'
        }}>
          <div
            onClick={() => handleOpenDeleteModal(contextMenu.repo)}
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 600,
              color: '#DC2626',
              cursor: 'pointer',
              userSelect: 'none'
            }}
          >
            Delete Repository
          </div>
        </div>
      )}

      {/* Content Area: Left Panel & Right Form */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left Sidebar — Repository List & Account Scan Button */}
        <div style={{
          width: '320px', minWidth: '280px', backgroundColor: '#FFFFFF', borderRight: '1px solid #E5E5E5',
          display: 'flex', flexDirection: 'column', flexShrink: 0
        }}>
          <div style={{ padding: '16px', borderBottom: '1px solid #E5E5E5' }}>
            <button
              id="scan-btn"
              onMouseDown={() => setActiveBtn('scan')}
              onMouseUp={() => setActiveBtn(null)}
              onMouseLeave={() => setActiveBtn(null)}
              onClick={handleScanAccount}
              disabled={isScanningAccount}
              style={getBtnStyle('scan', '100%')}
            >
              {isScanningAccount ? 'Scanning...' : 'Scan'}
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {repos.length === 0 ? (
              <div style={{ padding: '32px 20px', textAlign: 'center', color: '#888888', fontSize: '13px' }}>
                <p>No repositories available.</p>
              </div>
            ) : (
              repos.map((repo) => (
                <div
                  key={repo.id}
                  onClick={() => onSelectRepo(repo.id)}
                  onContextMenu={(e) => handleContextMenu(e, repo)}
                  style={{
                    minHeight: '48px',
                    height: 'auto',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: repo.id === activeRepoId ? '#F3F4F6' : '#FFFFFF',
                    borderBottom: '1px solid #E5E5E5',
                    cursor: 'pointer',
                    wordBreak: 'break-word'
                  }}
                >
                  <span style={{ fontSize: '13px', fontWeight: repo.id === activeRepoId ? 700 : 400, color: '#1A1A1A', lineHeight: '18px' }}>
                    {repo.name}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Panel — Create Repo Form Container Card */}
        <div style={{ flex: 1, padding: '32px 48px', overflowY: 'auto', backgroundColor: '#FFFFFF' }}>
          <div style={{
            maxWidth: '640px', backgroundColor: '#FFFFFF', border: '1px solid #E5E5E5',
            borderRadius: '8px', padding: '28px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: '16px'
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1A1A1A', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>Create Repository</h2>

            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#1A1A1A', marginBottom: '4px' }}>Repository Name *</label>
                <input
                  type="text"
                  placeholder="repository-name"
                  value={repoName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', fontSize: '13px', border: nameError ? '1px solid #DC2626' : '1px solid #E5E5E5', borderRadius: '4px', background: '#FFFFFF' }}
                />
                {nameError && <span style={{ fontSize: '11px', color: '#DC2626', marginTop: '2px', display: 'block' }}>{nameError}</span>}
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsPrivate(true)}
                  style={{ padding: '6px 16px', fontSize: '12px', fontWeight: 600, backgroundColor: isPrivate ? '#1A1A1A' : '#FFFFFF', color: isPrivate ? '#FFFFFF' : '#1A1A1A', border: '1px solid #1A1A1A', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Private
                </button>
                <button
                  type="button"
                  onClick={() => setIsPrivate(false)}
                  style={{ padding: '6px 16px', fontSize: '12px', fontWeight: 600, backgroundColor: !isPrivate ? '#1A1A1A' : '#FFFFFF', color: !isPrivate ? '#FFFFFF' : '#1A1A1A', border: '1px solid #1A1A1A', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Public
                </button>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#1A1A1A', marginBottom: '4px' }}>
                  Project Origin (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder=""
                  value={projectOrigin}
                  onChange={(e) => setProjectOrigin(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', fontSize: '13px', border: '1px solid #E5E5E5', borderRadius: '4px', background: '#FFFFFF', resize: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#1A1A1A', marginBottom: '4px' }}>
                  Description (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder=""
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', fontSize: '13px', border: '1px solid #E5E5E5', borderRadius: '4px', background: '#FFFFFF', resize: 'none' }}
                />
              </div>

              <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'flex-start' }}>
                <button
                  type="submit"
                  disabled={!isCreateEnabled || !!nameError}
                  onMouseDown={() => setActiveBtn('create')}
                  onMouseUp={() => setActiveBtn(null)}
                  onMouseLeave={() => setActiveBtn(null)}
                  style={getBtnStyle('create', '200px')}
                >
                  {isCheckingAvailability ? 'Checking...' : 'Create Repository'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
