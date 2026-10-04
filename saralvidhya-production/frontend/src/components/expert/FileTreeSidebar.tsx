import React from 'react';
import { FileNode } from './types';

/**
 * Props for the FileTreeSidebar component
 */
export interface FileTreeSidebarProps {
  tree: FileNode[];
  error: string | null;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  expanded: Record<string, boolean>;
  selectedFile: string | null;
  onToggleDir: (path: string) => void;
  onLoadFile: (path: string) => void;
  onOpenCreateModal: (type: 'file' | 'directory', path: string) => void;
  onExit: () => void;
}

/**
 * Component for rendering the file tree sidebar
 */
export default function FileTreeSidebar({
  tree,
  error,
  searchTerm,
  setSearchTerm,
  expanded,
  selectedFile,
  onToggleDir,
  onLoadFile,
  onOpenCreateModal,
  onExit
}: FileTreeSidebarProps) {
  const renderTree = (nodes: FileNode[], depth = 0) => {
    const term = searchTerm.toLowerCase();
    
    return nodes.filter(n => n.name.toLowerCase().includes(term) || n.type === 'directory').map((node, index) => {
      const isDir = node.type === 'directory';
      const isExpanded = !!expanded[node.path];
      const isSelected = selectedFile === node.path;
      
      return (
        <div key={node.path}>
          <div 
            onClick={() => isDir ? onToggleDir(node.path) : onLoadFile(node.path)}
            className={`sv-tree-item ${isSelected ? 'selected' : ''}`}
            style={{ paddingLeft: `${depth * 16 + 12}px` }}
          >
            <span className={`sv-tree-icon ${isDir && isExpanded ? 'expanded' : ''}`}>
              {isDir ? (
                <>
                  <span style={{ fontSize: '0.75rem', marginRight: '8px', color: '#64748B', display: 'inline-block', width: '12px', textAlign: 'center' }}>
                    {isExpanded ? '▼' : '▶'}
                  </span>
                  <span style={{ fontSize: '1.2rem', marginRight: '6px' }}>{isExpanded ? '📂' : '📁'}</span>
                </>
              ) : (
                <>
                  <span style={{ marginRight: '8px', display: 'inline-block', width: '12px' }}></span>
                  <span style={{ fontSize: '1.2rem', marginRight: '6px' }}>📄</span>
                </>
              )}
            </span>
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>{node.name}</span>
            {isDir && (
              <span className="sv-tree-actions">
                <span title="New File" onClick={(e) => { e.stopPropagation(); onOpenCreateModal('file', node.path); }} style={{ fontSize: '1.1rem', cursor: 'pointer' }}>+📄</span>
                <span title="New Folder" onClick={(e) => { e.stopPropagation(); onOpenCreateModal('directory', node.path); }} style={{ fontSize: '1.1rem', cursor: 'pointer' }}>+📁</span>
              </span>
            )}
          </div>
          {isDir && isExpanded && (
            <div className="sv-tree-children" style={{ animation: 'slideDown 0.2s ease-out forwards' }}>
              {node.children && renderTree(node.children, depth + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="sv-sidebar">
      <div className="sv-sidebar-header">
        <h2 className="sv-brand-title">Expert Content</h2>
        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
          <button 
            className="sv-btn" 
            style={{ flex: 1, padding: '8px', fontSize: '0.85rem', background: 'rgba(236, 72, 153, 0.1)', color: '#EC4899' }}
            onClick={() => onOpenCreateModal('directory', '')}
          >
            + Folder
          </button>
        </div>
        <input 
          type="text" 
          className="sv-search" 
          placeholder="Search folders and files..." 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>
      <div className="sv-tree-container">
        {tree.length === 0 && !error ? (
          <div style={{ padding: 20, color: '#94A3B8', textAlign: 'center', fontSize: '0.9rem', animation: 'fadeIn 0.5s ease' }}>
            <div style={{ marginBottom: 12 }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            </div>
            Loading resources...
          </div>
        ) : (
          renderTree(tree)
        )}
      </div>
      <div style={{ padding: 24, background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(10px)' }}>
        <button 
          className="sv-btn" 
          style={{ width: '100%', background: 'white', border: '2px solid #E2E8F0', color: '#475569', justifyContent: 'center' }} 
          onClick={onExit}
        >
          <span style={{ fontSize: '1.1rem' }}>🔒</span>
          Exit Expert Panel
        </button>
      </div>
    </div>
  );
}
