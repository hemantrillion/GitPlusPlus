import React, { useState, useEffect } from 'react';
import { ESSENTIAL_FILE_NAMES } from './git_client';

export default function FileTreeView({
  repoName,
  filesTree,
  isCommitMode,
  selectedFiles,
  onToggleSelectFile,
  onSelectAllFiles,
  onSelectFolderFiles,
  linkPathMode,
  selectedFolderNode,
  onSelectFolderNode,
  onOpenEssentialFile
}) {
  const [collapsedFolders, setCollapsedFolders] = useState({});

  useEffect(() => {
    setCollapsedFolders({});
  }, [filesTree]);

  const toggleFolder = (folderPath) => {
    setCollapsedFolders(prev => ({
      ...prev,
      [folderPath]: !prev[folderPath]
    }));
  };

  const isEssentialOrMdFile = (fileName) => {
    const lower = fileName.toLowerCase();
    return lower.endsWith('.md') || lower.endsWith('.json') || Object.values(ESSENTIAL_FILE_NAMES).includes(fileName);
  };

  // Helper to extract all file names under a folder node recursively
  const getAllFileNamesInTree = (nodes) => {
    let list = [];
    nodes.forEach(node => {
      if (node.type === 'file') {
        list.push(node.name);
      } else if (node.children) {
        list = [...list, ...getAllFileNamesInTree(node.children)];
      }
    });
    return list;
  };

  const isSelectFolderMode = linkPathMode === 'select_folder';
  const allFiles = getAllFileNamesInTree(filesTree || []);
  const areAllFilesSelected = allFiles.length > 0 && allFiles.every(f => selectedFiles.includes(f));

  const renderAsciiNode = (item, parentPath = '', depth = 0) => {
    const currentPath = parentPath ? `${parentPath}/${item.name}` : item.name;
    const isEssential = isEssentialOrMdFile(item.name);
    const isSelectedFile = selectedFiles.includes(item.name);
    const isTargetFolder = selectedFolderNode === currentPath;

    if (item.type === 'dir') {
      const isCollapsed = !!collapsedFolders[currentPath];
      const children = item.children || [];
      const childFiles = getAllFileNamesInTree(children);
      const isFolderFullySelected = childFiles.length > 0 && childFiles.every(f => selectedFiles.includes(f));

      return (
        <div key={currentPath} style={{ fontFamily: 'monospace', fontSize: '13px', lineHeight: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', color: '#1A1A1A' }}>
            <span style={{ color: '#888888', whiteSpace: 'pre' }}>
              {depth > 0 ? '|'.padStart(depth * 5 - 4) + '--- ' : ''}
            </span>

            {/* Folder Checkbox in Link Path Mode */}
            {isSelectFolderMode && (
              <input
                type="checkbox"
                checked={isTargetFolder}
                onChange={() => onSelectFolderNode(currentPath)}
                style={{ marginRight: '6px', cursor: 'pointer', accentColor: '#DC2626' }}
                title="Select folder node for local path link"
              />
            )}

            {/* Folder Checkbox in Commit Mode to select all contents inside this folder */}
            {isCommitMode && (
              <input
                type="checkbox"
                checked={isFolderFullySelected}
                onChange={() => onSelectFolderFiles(childFiles, !isFolderFullySelected)}
                style={{ marginRight: '6px', cursor: 'pointer', accentColor: '#1A1A1A' }}
                title="Select all files in this folder"
              />
            )}

            {/* Red Arrow (Down ▼ for open, Up ▲ for closed) */}
            <span
              onClick={() => toggleFolder(currentPath)}
              style={{ color: '#DC2626', fontWeight: 'bold', cursor: 'pointer', marginRight: '6px', userSelect: 'none' }}
            >
              {isCollapsed ? '▲' : '▼'}
            </span>

            <span
              onClick={() => {
                if (isSelectFolderMode) {
                  onSelectFolderNode(currentPath);
                } else {
                  toggleFolder(currentPath);
                }
              }}
              style={{
                fontWeight: 700,
                color: isTargetFolder ? '#DC2626' : '#1A1A1A',
                backgroundColor: isTargetFolder ? '#FEF2F2' : 'transparent',
                padding: '0 4px',
                borderRadius: '3px',
                cursor: 'pointer'
              }}
            >
              {item.name}
            </span>
          </div>

          {!isCollapsed && children.length > 0 && (
            <div style={{ paddingLeft: depth === 0 ? '8px' : '0px' }}>
              {children.map((child) =>
                renderAsciiNode(child, currentPath, depth + 1)
              )}
            </div>
          )}
        </div>
      );
    }

    return (
      <div key={currentPath} style={{ fontFamily: 'monospace', fontSize: '13px', lineHeight: '24px', display: 'flex', alignItems: 'center' }}>
        <span style={{ color: '#888888', whiteSpace: 'pre' }}>
          {depth > 0 ? '|'.padStart(depth * 5 - 4) + '--- ' : ''}
        </span>

        {isCommitMode && (
          <input
            type="checkbox"
            checked={isSelectedFile}
            onChange={() => onToggleSelectFile(item.name)}
            style={{ marginRight: '6px', cursor: 'pointer', accentColor: '#1A1A1A' }}
          />
        )}

        <span
          onClick={() => {
            if (isEssential) {
              onOpenEssentialFile(item.name);
            }
          }}
          style={{
            color: isEssential ? '#2563EB' : '#1A1A1A',
            fontWeight: isEssential ? 600 : 400,
            cursor: isEssential ? 'pointer' : 'default',
            textDecoration: 'none'
          }}
        >
          {item.name}
        </span>
      </div>
    );
  };

  const isRootTarget = selectedFolderNode === 'root';

  return (
    <div style={{
      margin: '12px 24px 24px 24px', backgroundColor: '#FFFFFF', border: '1px solid #E5E5E5',
      borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', padding: '20px 24px',
      flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column'
    }}>
      {/* Root Node Container Header */}
      <div style={{ fontFamily: 'monospace', fontSize: '14px', fontWeight: 700, color: '#1A1A1A', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Root Checkbox in Link Path Mode */}
        {isSelectFolderMode && (
          <input
            type="checkbox"
            checked={isRootTarget}
            onChange={() => onSelectFolderNode('root')}
            style={{ cursor: 'pointer', accentColor: '#DC2626' }}
            title="Select root folder for local path link"
          />
        )}

        {/* Root Checkbox in Commit Mode: Selects ALL files at once */}
        {isCommitMode && (
          <input
            type="checkbox"
            checked={areAllFilesSelected}
            onChange={() => onSelectAllFiles(allFiles, !areAllFilesSelected)}
            style={{ cursor: 'pointer', accentColor: '#1A1A1A' }}
            title="Select ALL files in repository for commit"
          />
        )}

        <span
          onClick={() => {
            if (isSelectFolderMode) {
              onSelectFolderNode('root');
            }
          }}
          style={{
            color: isRootTarget && isSelectFolderMode ? '#DC2626' : '#2563EB',
            backgroundColor: isRootTarget && isSelectFolderMode ? '#FEF2F2' : 'transparent',
            padding: '0 6px',
            borderRadius: '3px',
            cursor: isSelectFolderMode ? 'pointer' : 'default'
          }}
        >
          root
        </span>
        <span style={{ fontSize: '12px', fontWeight: 400, color: '#888888' }}>({repoName || 'Project'})</span>
      </div>
      <div style={{ fontFamily: 'monospace', fontSize: '13px', color: '#888888', marginBottom: '8px' }}>|</div>

      {filesTree && filesTree.length > 0 ? (
        filesTree.map((item) => renderAsciiNode(item, '', 0))
      ) : (
        <div style={{ color: '#888888', fontSize: '13px', fontStyle: 'italic', padding: '12px 0' }}>
          Select a branch above to view file tree.
        </div>
      )}
    </div>
  );
}
