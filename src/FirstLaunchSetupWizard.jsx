import React, { useState } from 'react';
import { validateStoragePath } from './git_client';

export default function FirstLaunchSetupWizard({ onCompleteSetup }) {
  const defaultPath = 'C:\\Users\\Default\\AppData\\Local\\GitPlusPlus';
  const [storagePath, setStoragePath] = useState(defaultPath);
  const [errorMsg, setErrorMsg] = useState(null);
  const [activeBtn, setActiveBtn] = useState(null);

  const handleBrowseFolder = async () => {
    if (window.__TAURI__ && window.__TAURI__.dialog) {
      try {
        const selected = await window.__TAURI__.dialog.open({
          directory: true,
          multiple: false,
          defaultPath: storagePath
        });
        if (selected) {
          setStoragePath(selected);
          setErrorMsg(null);
        }
      } catch (err) {
        console.error('Folder picker error:', err);
      }
    } else {
      alert('Native folder picker is available in the compiled Windows Desktop App.');
    }
  };

  const handleConfirm = async () => {
    setErrorMsg(null);
    if (!storagePath || storagePath.trim().length === 0) {
      setErrorMsg('Storage directory path cannot be empty.');
      return;
    }

    if (window.__TAURI__ && window.__TAURI__.tauri) {
      try {
        const validatedPath = await window.__TAURI__.tauri.invoke('validate_storage_path', {
          userPath: storagePath.trim()
        });
        onCompleteSetup({ dataStoragePath: validatedPath });
      } catch (err) {
        setErrorMsg(typeof err === 'string' ? err : 'Invalid storage path or permission denied.');
      }
    } else {
      onCompleteSetup({ dataStoragePath: storagePath.trim() });
    }
  };

  return (
    <div style={{
      width: '100vw', height: '100vh', backgroundColor: '#FFFFFF',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px'
    }}>
      <div style={{
        width: '440px', backgroundColor: '#FFFFFF', border: '1px solid #E5E5E5',
        borderRadius: '8px', padding: '32px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        display: 'flex', flexDirection: 'column', gap: '20px'
      }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1A1A1A', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
          First Launch Setup
        </h2>

        {errorMsg && (
          <div style={{ fontSize: '12px', color: '#DC2626', backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', padding: '10px', borderRadius: '4px' }}>
            {errorMsg}
          </div>
        )}

        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#1A1A1A', marginBottom: '6px' }}>
            Local Data Storage Location *
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={storagePath}
              onChange={(e) => setStoragePath(e.target.value)}
              style={{ flex: 1, padding: '8px 10px', fontSize: '12px', border: '1px solid #E5E5E5', borderRadius: '4px' }}
            />
            <button
              onClick={handleBrowseFolder}
              style={{ padding: '0 12px', backgroundColor: '#FFFFFF', color: '#1A1A1A', border: '1px solid #1A1A1A', borderRadius: '4px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
            >
              Browse...
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
          <button
            onMouseDown={() => setActiveBtn('confirm')}
            onMouseUp={() => setActiveBtn(null)}
            onMouseLeave={() => setActiveBtn(null)}
            onClick={handleConfirm}
            style={{
              height: '36px',
              backgroundColor: activeBtn === 'confirm' ? '#FFFFFF' : '#1A1A1A',
              color: activeBtn === 'confirm' ? '#1A1A1A' : '#FFFFFF',
              border: '1px solid #1A1A1A',
              borderRadius: '4px',
              fontWeight: 600,
              fontSize: '13px',
              padding: '0 24px',
              cursor: 'pointer'
            }}
          >
            Confirm & Complete Setup
          </button>
        </div>
      </div>
    </div>
  );
}
