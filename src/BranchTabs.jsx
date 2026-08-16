import React, { useState } from 'react';
import { Pencil } from 'lucide-react';
import { STATUS_PIPELINE } from './git_client';

export default function BranchTabs({
  repo,
  branches,
  activeBranch,
  onSelectBranch,
  onCreateBranch,
  onMergeBranch,
  onRenameBranch,
  onUpdateBranchPurpose,
  onToggleRepoVisibility,
  onUpdateStatus,
  isCommitMode,
  selectedFilesCount,
  onStartCommitMode,
  onCancelCommitMode,
  onOpenCommitModal,
  onPerformClone,
  onOpenLinkModal,
  onOpenPlanSequence
}) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchReason, setNewBranchReason] = useState('');
  const [targetMergeBranch, setTargetMergeBranch] = useState(branches[0]?.name || 'main');
  const [isEditingBranchName, setIsEditingBranchName] = useState(false);
  const [branchNameInput, setBranchNameInput] = useState(activeBranch?.name || '');
  const [isEditingPurpose, setIsEditingPurpose] = useState(false);
  const [purposeInput, setPurposeInput] = useState(activeBranch?.reason || '');
  const [activeBtn, setActiveBtn] = useState(null);

  const isBranchSelected = !!activeBranch;
  const isMainBranch = activeBranch && (activeBranch.name === 'main' || activeBranch.name === 'master');
  const isPrivate = repo ? repo.isPrivate : true;
  const currentStatus = activeBranch?.status || STATUS_PIPELINE[0];
  const currentStageIdx = STATUS_PIPELINE.indexOf(currentStatus) >= 0 ? STATUS_PIPELINE.indexOf(currentStatus) : 0;

  // Check if a valid local folder path is linked to active branch
  const hasLinkedFolder = activeBranch && activeBranch.linkedPath && activeBranch.linkedPath.trim().length > 0;

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (newBranchName.trim()) {
      onCreateBranch(newBranchName.trim(), activeBranch ? activeBranch.name : 'main', newBranchReason.trim());
      setNewBranchName('');
      setNewBranchReason('');
      setShowCreateModal(false);
    }
  };

  const handleMergeSubmit = () => {
    if (activeBranch && targetMergeBranch && hasLinkedFolder) {
      onMergeBranch(activeBranch.name, targetMergeBranch);
      setShowMergeModal(false);
    }
  };

  const handleSaveBranchName = () => {
    if (branchNameInput.trim() && activeBranch && !isMainBranch) {
      onRenameBranch(activeBranch.name, branchNameInput.trim());
      setIsEditingBranchName(false);
    }
  };

  const handleSavePurpose = () => {
    if (activeBranch && !isMainBranch) {
      onUpdateBranchPurpose(activeBranch.name, purposeInput.trim());
      setIsEditingPurpose(false);
    }
  };

  const handleSelectNewStatus = (newStage) => {
    onUpdateStatus(newStage);
    setShowStatusModal(false);
  };

  const getBtnStyle = (id, isRedGroup = false, isDisabled = false) => {
    const isActive = activeBtn === id;
    if (isDisabled) {
      return {
        height: '32px',
        backgroundColor: '#E5E5E5',
        color: '#888888',
        border: '1px solid #D1D5DB',
        borderRadius: '4px',
        fontWeight: 600,
        fontSize: '12px',
        padding: '0 14px',
        cursor: 'not-allowed',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none'
      };
    }

    if (isRedGroup) {
      return {
        height: '32px',
        backgroundColor: isActive ? '#FFFFFF' : '#DC2626',
        color: isActive ? '#DC2626' : '#FFFFFF',
        border: '1px solid #DC2626',
        borderRadius: '4px',
        fontWeight: 600,
        fontSize: '12px',
        padding: '0 14px',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        outline: 'none',
        userSelect: 'none'
      };
    }

    return {
      height: '32px',
      backgroundColor: isActive ? '#FFFFFF' : '#1A1A1A',
      color: isActive ? '#1A1A1A' : '#FFFFFF',
      border: '1px solid #1A1A1A',
      borderRadius: '4px',
      fontWeight: 600,
      fontSize: '12px',
      padding: '0 14px',
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      outline: 'none',
      userSelect: 'none'
    };
  };

  return (
    <div style={{ margin: '12px 24px 0 24px', display: 'flex', flexDirection: 'column', gap: '12px', flexShrink: 0 }}>
      {/* Container Card for Actions & Horizontal Branch Bar */}
      <div style={{
        backgroundColor: '#FFFFFF', border: '1px solid #E5E5E5', borderRadius: '8px',
        padding: '12px 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: '12px'
      }}>
        {/* Action Buttons Cluster: Positioned on LEFT side of bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto' }}>
          {/* RED ACTION GROUP: Create Branch, Commit, Clone, Merge Branch, Toggle Visibility */}
          <button onMouseDown={() => setActiveBtn('create')} onMouseUp={() => setActiveBtn(null)} onMouseLeave={() => setActiveBtn(null)} onClick={() => setShowCreateModal(true)} style={getBtnStyle('create', true)}>
            Create Branch
          </button>

          {!isCommitMode ? (
            <button
              onMouseDown={() => setActiveBtn('commit')}
              onMouseUp={() => setActiveBtn(null)}
              onMouseLeave={() => setActiveBtn(null)}
              onClick={onStartCommitMode}
              disabled={!hasLinkedFolder}
              style={getBtnStyle('commit', true, !hasLinkedFolder)}
              title={hasLinkedFolder ? 'Start Commit' : 'Link a local folder first'}
            >
              Commit
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button onClick={onOpenCommitModal} disabled={selectedFilesCount === 0 || !hasLinkedFolder} style={getBtnStyle('commit-push', true, selectedFilesCount === 0 || !hasLinkedFolder)}>
                Push ({selectedFilesCount})
              </button>
              <button onClick={onCancelCommitMode} style={{ padding: '6px 12px', backgroundColor: '#FFFFFF', color: '#DC2626', border: '1px solid #DC2626', borderRadius: '4px', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}>
                Cancel
              </button>
            </div>
          )}

          <button onMouseDown={() => setActiveBtn('clone')} onMouseUp={() => setActiveBtn(null)} onMouseLeave={() => setActiveBtn(null)} onClick={onPerformClone} style={getBtnStyle('clone', true)}>
            Clone
          </button>

          <button
            onMouseDown={() => setActiveBtn('merge')}
            onMouseUp={() => setActiveBtn(null)}
            onMouseLeave={() => setActiveBtn(null)}
            onClick={() => setShowMergeModal(true)}
            disabled={!isBranchSelected || !hasLinkedFolder}
            style={getBtnStyle('merge', true, !isBranchSelected || !hasLinkedFolder)}
            title={hasLinkedFolder ? 'Merge Branch' : 'Link a local folder first'}
          >
            Merge Branch
          </button>

          {/* Toggle Public / Private Repo Visibility Button */}
          <button
            onMouseDown={() => setActiveBtn('visibility')}
            onMouseUp={() => setActiveBtn(null)}
            onMouseLeave={() => setActiveBtn(null)}
            onClick={() => onToggleRepoVisibility(!isPrivate)}
            style={getBtnStyle('visibility', true)}
            title={`Current state: ${isPrivate ? 'Private' : 'Public'}. Click to toggle.`}
          >
            {isPrivate ? 'Make Public' : 'Make Private'}
          </button>

          {/* BLACK ACTION GROUP: Link Path, Plan Sequence, Status Pipeline */}
          <button onMouseDown={() => setActiveBtn('link')} onMouseUp={() => setActiveBtn(null)} onMouseLeave={() => setActiveBtn(null)} onClick={onOpenLinkModal} style={getBtnStyle('link', false)}>
            Link Path
          </button>

          <button onMouseDown={() => setActiveBtn('plan')} onMouseUp={() => setActiveBtn(null)} onMouseLeave={() => setActiveBtn(null)} onClick={onOpenPlanSequence} disabled={!isBranchSelected} style={getBtnStyle('plan', false, !isBranchSelected)}>
            Plan Sequence
          </button>

          {/* Status Pipeline Button in Black Style */}
          <button
            onMouseDown={() => setActiveBtn('status-btn')}
            onMouseUp={() => setActiveBtn(null)}
            onMouseLeave={() => setActiveBtn(null)}
            onClick={() => setShowStatusModal(true)}
            disabled={!isBranchSelected}
            style={getBtnStyle('status-btn', false, !isBranchSelected)}
            title="Click to advance status pipeline (Forward-only)"
          >
            Status: {currentStatus}
          </button>
        </div>

        {/* Horizontal Sideways-Scrollable Branch List Bar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px', overflowX: 'auto', paddingTop: '8px', borderTop: '1px solid #F3F4F6'
        }}>
          {branches.map((b, idx) => {
            const isSelected = activeBranch && b.name === activeBranch.name;
            return (
              <React.Fragment key={b.name}>
                {idx > 0 && <span style={{ color: '#D1D5DB', fontWeight: 300 }}>|</span>}
                <span
                  onClick={() => {
                    onSelectBranch(b.name);
                    setBranchNameInput(b.name);
                    setPurposeInput(b.reason || '');
                  }}
                  style={{
                    fontSize: '13px',
                    fontWeight: isSelected ? 700 : 400,
                    color: isSelected ? '#2563EB' : '#1A1A1A',
                    cursor: 'pointer',
                    userSelect: 'none',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {b.name}
                </span>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Selected Branch Detail Card Container */}
      {isBranchSelected && (
        <div style={{
          backgroundColor: '#FFFFFF', border: '1px solid #E5E5E5', borderRadius: '8px',
          padding: '16px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: '10px'
        }}>
          {/* Branch Name + Pencil Icon */}
          {isEditingBranchName && !isMainBranch ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="text"
                value={branchNameInput}
                onChange={(e) => setBranchNameInput(e.target.value)}
                style={{ padding: '4px 8px', fontSize: '18px', fontWeight: 700, border: '1px solid #1A1A1A', borderRadius: '4px' }}
              />
              <button onClick={handleSaveBranchName} style={{ padding: '4px 12px', backgroundColor: '#1A1A1A', color: '#FFFFFF', border: 'none', borderRadius: '4px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                Save
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1A1A1A', letterSpacing: '-0.02em' }}>
                {activeBranch.name}
              </h2>
              {!isMainBranch ? (
                <button onClick={() => setIsEditingBranchName(true)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '2px' }} title="Rename Branch">
                  <Pencil size={15} color="#1A1A1A" />
                </button>
              ) : (
                <button disabled style={{ background: 'transparent', border: 'none', cursor: 'not-allowed', display: 'flex', alignItems: 'center', padding: '2px', opacity: 0.4 }} title="Main branch cannot be renamed">
                  <Pencil size={15} color="#888888" />
                </button>
              )}
            </div>
          )}

          {/* Purpose Header Row */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#666666' }}>Purpose:</span>
              {!isMainBranch ? (
                <button onClick={() => setIsEditingPurpose(true)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '2px' }} title="Edit Purpose">
                  <Pencil size={12} color="#1A1A1A" />
                </button>
              ) : (
                <button disabled style={{ background: 'transparent', border: 'none', cursor: 'not-allowed', display: 'flex', alignItems: 'center', padding: '2px', opacity: 0.4 }} title="Main branch purpose is fixed">
                  <Pencil size={12} color="#888888" />
                </button>
              )}
            </div>

            {isEditingPurpose && !isMainBranch ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <textarea rows={2} value={purposeInput} onChange={(e) => setPurposeInput(e.target.value)} style={{ width: '100%', padding: '6px', fontSize: '12px', border: '1px solid #1A1A1A', borderRadius: '4px', resize: 'none' }} />
                <button onClick={handleSavePurpose} style={{ width: '80px', padding: '4px 12px', backgroundColor: '#1A1A1A', color: '#FFFFFF', border: 'none', borderRadius: '4px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                  Save
                </button>
              </div>
            ) : (
              <span style={{ fontSize: '13px', color: '#1A1A1A' }}>
                {activeBranch.reason || ''}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Forward-Only Status Pipeline Selection Modal */}
      {showStatusModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: '#FFF', padding: '20px', borderRadius: '8px', width: '380px', border: '1px solid #1A1A1A', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, textTransform: 'uppercase' }}>Status Pipeline</h3>
            <p style={{ fontSize: '12px', color: '#666666', margin: 0 }}>
              Status moves forward only. Previous stages cannot be retracted.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
              {STATUS_PIPELINE.map((stage, idx) => {
                const isRetracted = idx < currentStageIdx;
                const isCurrent = idx === currentStageIdx;
                return (
                  <button
                    key={stage}
                    disabled={isRetracted}
                    onClick={() => handleSelectNewStatus(stage)}
                    style={{
                      padding: '10px 14px',
                      fontSize: '13px',
                      fontWeight: isCurrent ? 700 : 500,
                      textAlign: 'left',
                      backgroundColor: isCurrent ? '#1A1A1A' : isRetracted ? '#F3F4F6' : '#FFFFFF',
                      color: isCurrent ? '#FFFFFF' : isRetracted ? '#9CA3AF' : '#1A1A1A',
                      border: '1px solid #1A1A1A',
                      borderRadius: '4px',
                      cursor: isRetracted ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <span>{stage}</span>
                    {isCurrent && <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>(Current)</span>}
                    {isRetracted && <span style={{ fontSize: '11px' }}>✓ Achieved</span>}
                  </button>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button onClick={() => setShowStatusModal(false)} style={{ padding: '6px 16px', background: '#FFFFFF', color: '#1A1A1A', border: '1px solid #1A1A1A', borderRadius: '4px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Branch Modal */}
      {showCreateModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <form onSubmit={handleCreateSubmit} style={{ backgroundColor: '#FFF', padding: '20px', borderRadius: '8px', width: '380px', border: '1px solid #1A1A1A' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px', textTransform: 'uppercase' }}>Create Branch</h3>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Branch Name *</label>
            <input
              type="text"
              placeholder="feature-branch"
              value={newBranchName}
              onChange={(e) => setNewBranchName(e.target.value)}
              style={{ width: '100%', padding: '8px', border: '1px solid #E5E5E5', borderRadius: '4px', marginBottom: '12px', fontSize: '13px' }}
              required
            />
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Purpose</label>
            <textarea
              rows={2}
              placeholder=""
              value={newBranchReason}
              onChange={(e) => setNewBranchReason(e.target.value)}
              style={{ width: '100%', padding: '8px', border: '1px solid #E5E5E5', borderRadius: '4px', marginBottom: '16px', fontSize: '13px', resize: 'none' }}
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowCreateModal(false)} style={{ padding: '6px 12px', background: '#FFFFFF', color: '#1A1A1A', border: '1px solid #1A1A1A', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
              <button type="submit" style={{ padding: '6px 16px', background: '#DC2626', color: '#FFF', border: 'none', borderRadius: '4px', fontWeight: 600, cursor: 'pointer' }}>Create</button>
            </div>
          </form>
        </div>
      )}

      {/* Merge Modal */}
      {showMergeModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: '#FFF', padding: '20px', borderRadius: '8px', width: '380px', border: '1px solid #1A1A1A' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px', textTransform: 'uppercase' }}>Merge Branch</h3>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Target Branch to Merge Into:</label>
            <select
              value={targetMergeBranch}
              onChange={(e) => setTargetMergeBranch(e.target.value)}
              style={{ width: '100%', padding: '8px', border: '1px solid #E5E5E5', borderRadius: '4px', marginBottom: '16px', fontSize: '13px' }}
            >
              {branches.filter(b => !activeBranch || b.name !== activeBranch.name).map(b => (
                <option key={b.name} value={b.name}>{b.name}</option>
              ))}
            </select>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowMergeModal(false)} style={{ padding: '6px 12px', background: '#FFFFFF', color: '#1A1A1A', border: '1px solid #1A1A1A', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleMergeSubmit} style={{ padding: '6px 16px', background: '#DC2626', color: '#FFF', border: 'none', borderRadius: '4px', fontWeight: 600, cursor: 'pointer' }}>Merge</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
