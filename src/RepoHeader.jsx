import React, { useState } from 'react';
import { Pencil, ArrowLeft } from 'lucide-react';

export default function RepoHeader({ repo, onRenameRepo, onUpdateDescription, onUpdateProjectOrigin, onBackToDashboard }) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [isEditingOrigin, setIsEditingOrigin] = useState(false);
  const [nameInput, setNameInput] = useState(repo.name);
  const [descInput, setDescInput] = useState(repo.description || '');
  const [originInput, setOriginInput] = useState(repo.projectOrigin || '');
  const [isHoverBack, setIsHoverBack] = useState(false);

  const isCreatedInApp = repo.isCreatedInApp === true;

  const handleSaveName = () => {
    if (nameInput.trim()) {
      onRenameRepo(nameInput.trim());
      setIsEditingName(false);
    }
  };

  const handleSaveDesc = () => {
    onUpdateDescription(descInput.trim());
    setIsEditingDesc(false);
  };

  const handleSaveOrigin = () => {
    if (isCreatedInApp) {
      onUpdateProjectOrigin(originInput.trim());
      setIsEditingOrigin(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flexShrink: 0 }}>
      {/* Top Header Row — Circular Back Arrow */}
      <div style={{
        height: '48px', backgroundColor: '#FFFFFF', borderBottom: '1px solid #E5E5E5',
        display: 'flex', alignItems: 'center', padding: '0 24px', flexShrink: 0
      }}>
        <button
          onClick={onBackToDashboard}
          onMouseEnter={() => setIsHoverBack(true)}
          onMouseLeave={() => setIsHoverBack(false)}
          title="Back"
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: isHoverBack ? '#F3F4F6' : '#FFFFFF',
            border: '1px solid #1A1A1A',
            color: '#1A1A1A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            outline: 'none'
          }}
        >
          <ArrowLeft size={16} />
        </button>
      </div>

      {/* Repo Details Card Container */}
      <div style={{
        margin: '0 24px', padding: '16px 20px', backgroundColor: '#FFFFFF', border: '1px solid #E5E5E5',
        borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: '10px'
      }}>
        {/* Repo Name + Single Pencil Icon */}
        {isEditingName ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              style={{ padding: '4px 8px', fontSize: '18px', fontWeight: 700, border: '1px solid #1A1A1A', borderRadius: '4px' }}
            />
            <button
              onClick={handleSaveName}
              style={{ padding: '4px 12px', backgroundColor: '#1A1A1A', color: '#FFFFFF', border: 'none', borderRadius: '4px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
            >
              Save
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#1A1A1A', letterSpacing: '-0.01em' }}>{repo.name}</h1>
            <button
              onClick={() => setIsEditingName(true)}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '2px' }}
              title="Rename Repository"
            >
              <Pencil size={15} color="#1A1A1A" />
            </button>
          </div>
        )}

        {/* Description Header Row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#666666' }}>Description:</span>
          {isEditingDesc ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
              <input
                type="text"
                value={descInput}
                onChange={(e) => setDescInput(e.target.value)}
                style={{ flex: 1, padding: '4px 8px', fontSize: '12px', border: '1px solid #1A1A1A', borderRadius: '4px' }}
              />
              <button
                onClick={handleSaveDesc}
                style={{ padding: '4px 12px', backgroundColor: '#1A1A1A', color: '#FFFFFF', border: 'none', borderRadius: '4px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
              >
                Save
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: '#1A1A1A' }}>{repo.description || ''}</span>
              <button
                onClick={() => setIsEditingDesc(true)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '2px' }}
                title="Edit Description"
              >
                <Pencil size={13} color="#1A1A1A" />
              </button>
            </div>
          )}
        </div>

        {/* Project Origin Header Row — Editable for in-app repos, blocked cursor for scanned repos */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderTop: '1px solid #F3F4F6', paddingTop: '6px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#666666' }}>Project Origin:</span>
          {isEditingOrigin && isCreatedInApp ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
              <input
                type="text"
                value={originInput}
                onChange={(e) => setOriginInput(e.target.value)}
                style={{ flex: 1, padding: '4px 8px', fontSize: '12px', border: '1px solid #1A1A1A', borderRadius: '4px' }}
              />
              <button
                onClick={handleSaveOrigin}
                style={{ padding: '4px 12px', backgroundColor: '#1A1A1A', color: '#FFFFFF', border: 'none', borderRadius: '4px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
              >
                Save
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: '#1A1A1A' }}>{repo.projectOrigin || ''}</span>
              {isCreatedInApp ? (
                <button
                  onClick={() => setIsEditingOrigin(true)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '2px' }}
                  title="Edit Project Origin"
                >
                  <Pencil size={13} color="#1A1A1A" />
                </button>
              ) : (
                <button
                  disabled
                  style={{ background: 'transparent', border: 'none', cursor: 'not-allowed', display: 'flex', alignItems: 'center', padding: '2px', opacity: 0.5 }}
                  title="Project origin can only be set for repositories created in app"
                >
                  <Pencil size={13} color="#888888" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
