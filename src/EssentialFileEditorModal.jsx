import React, { useState } from 'react';
import { FileText, Save, X } from 'lucide-react';

export default function EssentialFileEditorModal({
  fileName,
  fileContent,
  onSaveContent,
  onClose
}) {
  const [content, setContent] = useState(fileContent || '');

  const displayTitle = fileName.endsWith('.md') || fileName.endsWith('.json')
    ? fileName
    : `${fileName}.md`;

  const handleSave = () => {
    onSaveContent(content);
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 110 }}>
      <div style={{
        backgroundColor: '#FFFFFF', borderRadius: '8px', width: '60%', height: '70%',
        border: '1px solid #E5E5E5', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 24px rgba(0,0,0,0.1)'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '12px 20px', borderBottom: '1px solid #E5E5E5', backgroundColor: '#FAFAFA',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={18} color="#2563EB" />
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#1A1A1A' }}>
              Editing Essential File: <span style={{ color: '#2563EB' }}>{displayTitle}</span>
            </h3>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', padding: '4px', border: 'none', cursor: 'pointer' }}>
            <X size={18} color="#666666" />
          </button>
        </div>

        {/* Textarea Editor */}
        <div style={{ flex: 1, padding: '16px', backgroundColor: '#FFFFFF' }}>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            style={{
              width: '100%', height: '100%', padding: '12px', fontSize: '13px',
              fontFamily: "'JetBrains Mono', monospace", border: '1px solid #E5E5E5',
              borderRadius: '6px', outline: 'none', resize: 'none', background: '#FAFAFA'
            }}
          />
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '12px 20px', borderTop: '1px solid #E5E5E5', backgroundColor: '#FAFAFA',
          display: 'flex', justifyContent: 'flex-end', gap: '8px'
        }}>
          <button onClick={onClose} style={{ padding: '6px 16px', background: '#F3F4F6', color: '#666', borderRadius: '4px', fontSize: '13px', border: 'none', cursor: 'pointer' }}>
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: '6px 16px', background: '#2563EB', color: '#FFF', borderRadius: '4px',
              fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', border: 'none', cursor: 'pointer'
            }}
          >
            <Save size={14} /> Save Essential File
          </button>
        </div>
      </div>
    </div>
  );
}
