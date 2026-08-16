import React, { useState } from 'react';
import { FileText, FileCode, Search, Plus, CheckSquare, Square, Sparkles } from 'lucide-react';

export default function EssentialFilesPanel({
  activeBranch,
  onUpdateStatus,
  onAddManualJournal,
  onScanCommitHistory,
  onUpdateNextAction,
  onMarkNextActionDone,
  onOpenEssentialFile
}) {
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusValue, setStatusValue] = useState(activeBranch.status || 'In Development');
  const [showAddJournal, setShowAddJournal] = useState(false);
  const [manualJournalText, setManualJournalText] = useState('');
  const [nextActionInput, setNextActionInput] = useState(activeBranch.nextAction || '');
  const [isScanning, setIsScanning] = useState(false);

  const statusOptions = ['In Development', 'In Review', 'Testing Phase', 'Blocked', 'Ready for Merge', 'Already Merged'];

  const handleStatusSave = () => {
    onUpdateStatus(statusValue);
    setShowStatusModal(false);
  };

  const handleJournalSubmit = (e) => {
    e.preventDefault();
    if (manualJournalText.trim()) {
      onAddManualJournal(manualJournalText.trim());
      setManualJournalText('');
      setShowAddJournal(false);
    }
  };

  const handleScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      onScanCommitHistory();
      setIsScanning(false);
    }, 600);
  };

  const isMergedState = activeBranch.isMerged;
  const isPulseActive = !activeBranch.nextActionDone && activeBranch.nextAction && activeBranch.nextAction.trim().length > 0;

  return (
    <div style={{ padding: '12px 24px', backgroundColor: '#FFFFFF', borderBottom: '1px solid #E5E5E5', display: 'flex', flexDirection: 'column', gap: '12px', flexShrink: 0 }}>
      {/* Header & Essential Files Quick Launch Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h3 style={{ fontSize: '12px', fontWeight: 700, color: '#1A1A1A', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Essential Branch Files & Journal
          </h3>
          {isMergedState && (
            <span style={{ fontSize: '11px', color: '#166534', backgroundColor: '#DCFCE7', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
              already merged — see main
            </span>
          )}
        </div>

        {/* Status Picker & Timestamp */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: '#666666' }}>Current Status:</span>
          <button
            onClick={() => setShowStatusModal(true)}
            style={{
              fontSize: '11px', padding: '3px 10px', borderRadius: '12px', fontWeight: 600,
              backgroundColor: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', cursor: 'pointer'
            }}
          >
            {activeBranch.status || 'In Development'}
          </button>
        </div>
      </div>

      {/* Grid of Essential File Trigger Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
        <div
          onClick={() => onOpenEssentialFile('prd')}
          style={{ border: '1px solid #E5E5E5', borderRadius: '6px', padding: '8px 12px', backgroundColor: '#FAFAFA', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FileText size={16} color="#2563EB" />
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#1A1A1A' }}>PRD.md</span>
          </div>
          <span style={{ fontSize: '10px', color: '#2563EB', fontWeight: 600 }}>Edit</span>
        </div>

        <div
          onClick={() => onOpenEssentialFile('wbs')}
          style={{ border: '1px solid #E5E5E5', borderRadius: '6px', padding: '8px 12px', backgroundColor: '#FAFAFA', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FileCode size={16} color="#D97706" />
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#1A1A1A' }}>WBS.md</span>
          </div>
          <span style={{ fontSize: '10px', color: '#2563EB', fontWeight: 600 }}>Edit</span>
        </div>

        <div
          onClick={() => onOpenEssentialFile('readme')}
          style={{ border: '1px solid #E5E5E5', borderRadius: '6px', padding: '8px 12px', backgroundColor: '#FAFAFA', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FileText size={16} color="#16A34A" />
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#1A1A1A' }}>README.md</span>
          </div>
          <span style={{ fontSize: '10px', color: '#2563EB', fontWeight: 600 }}>Edit</span>
        </div>

        {/* Progress Scan & Manual Journal Card */}
        <div style={{ border: '1px solid #E5E5E5', borderRadius: '6px', padding: '8px 12px', backgroundColor: '#FAFAFA', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#1A1A1A' }}>Progress Journal</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button onClick={handleScan} title="Scan commit history" style={{ background: 'transparent', padding: 0, border: 'none', cursor: 'pointer' }}>
              <Search size={14} color={isScanning ? '#2563EB' : '#666666'} className={isScanning ? 'animate-spin' : ''} />
            </button>
            <button onClick={() => setShowAddJournal(!showAddJournal)} style={{ fontSize: '11px', color: '#2563EB', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
              + Entry
            </button>
          </div>
        </div>

        {/* Status Dialog Trigger */}
        <div style={{ border: '1px solid #E5E5E5', borderRadius: '6px', padding: '8px 12px', backgroundColor: '#FAFAFA', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#1A1A1A' }}>STATUS.json</span>
          <span style={{ fontSize: '10px', color: '#888888' }}>
            {activeBranch.statusTimestamp ? new Date(activeBranch.statusTimestamp).toLocaleDateString() : 'Auto'}
          </span>
        </div>
      </div>

      {/* Manual Journal Entry Input Drawer */}
      {showAddJournal && (
        <form onSubmit={handleJournalSubmit} style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            placeholder="Write manual progress journal entry..."
            value={manualJournalText}
            onChange={(e) => setManualJournalText(e.target.value)}
            style={{ flex: 1, padding: '6px 10px', fontSize: '12px', border: '1px solid #2563EB', borderRadius: '4px' }}
          />
          <button type="submit" style={{ padding: '6px 14px', background: '#2563EB', color: '#FFF', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>Save Entry</button>
        </form>
      )}

      {/* Next Action Box — Throbbing Pulse Animation when incomplete */}
      <div
        className={isPulseActive ? 'next-action-pulse' : ''}
        style={{
          padding: '8px 14px', borderRadius: '6px',
          border: isPulseActive ? '1.5px solid #FFD54F' : '1px solid #E5E5E5',
          backgroundColor: isPulseActive ? '#FFFDF0' : '#FAFAFA',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}
      >
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={15} color={isPulseActive ? '#D97706' : '#888888'} />
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#1A1A1A' }}>Next Action:</span>
          <input
            type="text"
            placeholder="Enter next local action item..."
            value={nextActionInput}
            onChange={(e) => {
              setNextActionInput(e.target.value);
              onUpdateNextAction(e.target.value);
            }}
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: '12px', color: '#1A1A1A', fontWeight: 500 }}
          />
        </div>

        <button
          onClick={onMarkNextActionDone}
          style={{ background: 'transparent', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600, color: activeBranch.nextActionDone ? '#166534' : '#2563EB', border: 'none', cursor: 'pointer' }}
        >
          {activeBranch.nextActionDone ? <CheckSquare size={16} color="#166534" /> : <Square size={16} color="#2563EB" />}
          Done
        </button>
      </div>

      {/* Status Modal */}
      {showStatusModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: '#FFF', padding: '20px', borderRadius: '8px', width: '320px', border: '1px solid #E5E5E5', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600 }}>Select Branch Status</h3>
            <select
              value={statusValue}
              onChange={(e) => setStatusValue(e.target.value)}
              style={{ width: '100%', padding: '8px', border: '1px solid #E5E5E5', borderRadius: '4px', fontSize: '13px' }}
            >
              {statusOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowStatusModal(false)} style={{ padding: '6px 12px', background: '#F3F4F6', borderRadius: '4px' }}>Cancel</button>
              <button onClick={handleStatusSave} style={{ padding: '6px 12px', background: '#2563EB', color: '#FFF', borderRadius: '4px' }}>Update Status</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
