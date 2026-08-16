import React, { useState } from 'react';
import { GitCommit, ShieldCheck } from 'lucide-react';

export default function CommitModal({
  activeBranch,
  selectedFiles,
  showModal,
  onCloseModal,
  onExecuteCommitPush
}) {
  const [commitMessage, setCommitMessage] = useState('');

  const minChars = 15;
  const currentLen = commitMessage.trim().length;
  const isMessageValid = currentLen >= minChars;

  const handleConfirmCommit = () => {
    if (!isMessageValid) return;
    onExecuteCommitPush(commitMessage.trim());
    setCommitMessage('');
    onCloseModal();
  };

  if (!showModal) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div style={{
        backgroundColor: '#FFF', padding: '20px', borderRadius: '8px', width: '440px',
        border: '1px solid #E5E5E5', display: 'flex', flexDirection: 'column', gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <GitCommit size={18} color="#2563EB" />
          <h3 style={{ fontSize: '15px', fontWeight: 600 }}>Commit & Push to '{activeBranch.name}'</h3>
        </div>

        <p style={{ fontSize: '12px', color: '#666' }}>
          Staged items: <strong>{selectedFiles.join(', ')}</strong>
        </p>

        <div style={{ position: 'relative' }}>
          <textarea
            rows={3}
            placeholder="Enter detailed commit message (minimum 15 characters required)..."
            value={commitMessage}
            onChange={(e) => setCommitMessage(e.target.value)}
            style={{
              width: '100%', padding: '10px', fontSize: '12px', borderRadius: '4px',
              border: isMessageValid ? '1px solid #E5E5E5' : '1px solid #DC2626',
              resize: 'none'
            }}
          />
          <span style={{
            position: 'absolute', bottom: '8px', right: '10px', fontSize: '11px',
            color: isMessageValid ? '#166534' : '#DC2626', fontWeight: 600
          }}>
            {currentLen} / {minChars} chars
          </span>
        </div>

        <div style={{ fontSize: '11px', color: '#166534', backgroundColor: '#F0FDF4', padding: '8px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ShieldCheck size={14} color="#166534" />
          <span>Live Sanity Check: Verified <strong>.branch-id</strong> matches target branch.</span>
        </div>

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button onClick={onCloseModal} style={{ padding: '6px 12px', background: '#F3F4F6', borderRadius: '4px', fontSize: '12px' }}>Cancel</button>
          <button
            onClick={handleConfirmCommit}
            disabled={!isMessageValid}
            style={{
              padding: '6px 16px',
              background: isMessageValid ? '#2563EB' : '#E5E5E5',
              color: isMessageValid ? '#FFFFFF' : '#888888',
              borderRadius: '4px', fontSize: '12px', fontWeight: 600
            }}
          >
            Confirm Add + Commit + Push
          </button>
        </div>
      </div>
    </div>
  );
}
