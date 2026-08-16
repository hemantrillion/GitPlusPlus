import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';

export default function LinkWarningBanner({
  branches,
  activeBranch,
  selectedBranchName,
  selectedFolderNode,
  mismatchWarning,
  showLinkModal,
  onCloseLinkModal,
  onLinkLocalPath
}) {
  const [folderInput, setFolderInput] = useState('');
  const [activeBtn, setActiveBtn] = useState(null);
  const inputRef = useRef(null);

  const targetBranch = selectedBranchName || activeBranch?.name || 'main';
  const targetFolderNode = selectedFolderNode || 'root';

  useEffect(() => {
    if (showLinkModal) {
      setFolderInput('');
    }
  }, [showLinkModal]);

  const handleBrowseFileExplorer = async () => {
    let folderPath = null;
    try {
      // Call native Rust rfd FileDialog command
      if (window.__TAURI__?.core?.invoke) {
        folderPath = await window.__TAURI__.core.invoke('pick_folder');
      } else if (window.__TAURI_INTERNALS__?.invoke) {
        folderPath = await window.__TAURI_INTERNALS__.invoke('pick_folder');
      } else if (window.__TAURI__?.invoke) {
        folderPath = await window.__TAURI__.invoke('pick_folder');
      }
    } catch (err) {
      console.error('Native folder pick error:', err);
    }

    if (folderPath) {
      setFolderInput(folderPath);
    } else if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleSaveLink = () => {
    if (folderInput.trim()) {
      onLinkLocalPath(folderInput.trim(), targetBranch, targetFolderNode);
    }
  };

  return (
    <>
      {/* Red inline warning banner when mismatch is detected */}
      {mismatchWarning && (
        <div style={{
          backgroundColor: '#FEF2F2', borderBottom: '1px solid #FCA5A5',
          padding: '8px 24px', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0
        }}>
          <AlertTriangle size={16} color="#DC2626" />
          <span style={{ fontSize: '12px', color: '#991B1B', fontWeight: 600 }}>
            {mismatchWarning}
          </span>
        </div>
      )}

      {/* Link Local Path Modal Dialog Box */}
      {showLinkModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{
            backgroundColor: '#FFF', padding: '24px', borderRadius: '8px', width: '440px',
            border: '1px solid #1A1A1A', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', gap: '14px'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1A1A1A', textTransform: 'uppercase', margin: 0 }}>
              LINK LOCAL PATH
            </h3>

            {/* Target Branch Display */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#1A1A1A', marginBottom: '4px' }}>
                Target Branch:
              </label>
              <div style={{ padding: '8px 12px', fontSize: '13px', fontWeight: 700, color: '#1A1A1A', backgroundColor: '#F3F4F6', border: '1px solid #E5E5E5', borderRadius: '4px' }}>
                {targetBranch}
              </div>
            </div>

            {/* Target Folder Location Display */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#1A1A1A', marginBottom: '4px' }}>
                Target Folder Location:
              </label>
              <div style={{ padding: '8px 12px', fontSize: '13px', fontWeight: 700, color: '#DC2626', backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '4px' }}>
                {targetFolderNode}
              </div>
            </div>

            {/* Local Folder Selection via Native Windows File Explorer */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#1A1A1A', marginBottom: '4px' }}>
                Local Folder Path:
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Click Browse... or enter local path"
                  value={folderInput}
                  onChange={(e) => setFolderInput(e.target.value)}
                  style={{ flex: 1, padding: '8px 10px', fontSize: '12px', border: '1px solid #E5E5E5', borderRadius: '4px', background: '#FFFFFF' }}
                />
                <button
                  type="button"
                  onClick={handleBrowseFileExplorer}
                  style={{ padding: '0 16px', backgroundColor: '#1A1A1A', color: '#FFFFFF', border: 'none', borderRadius: '4px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Browse...
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '6px' }}>
              <button
                onClick={onCloseLinkModal}
                style={{ padding: '6px 16px', background: '#FFFFFF', color: '#1A1A1A', border: '1px solid #1A1A1A', borderRadius: '4px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onMouseDown={() => setActiveBtn('link')}
                onMouseUp={() => setActiveBtn(null)}
                onMouseLeave={() => setActiveBtn(null)}
                onClick={handleSaveLink}
                disabled={!folderInput.trim()}
                style={{
                  height: '32px',
                  backgroundColor: !folderInput.trim() ? '#E5E5E5' : activeBtn === 'link' ? '#FFFFFF' : '#1A1A1A',
                  color: !folderInput.trim() ? '#888888' : activeBtn === 'link' ? '#1A1A1A' : '#FFFFFF',
                  border: !folderInput.trim() ? '1px solid #D1D5DB' : '1px solid #1A1A1A',
                  borderRadius: '4px',
                  fontWeight: 600,
                  fontSize: '12px',
                  padding: '0 16px',
                  cursor: !folderInput.trim() ? 'not-allowed' : 'pointer'
                }}
              >
                Link Path
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
