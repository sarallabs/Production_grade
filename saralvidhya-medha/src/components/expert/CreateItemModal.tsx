import React from 'react';

/**
 * Props for the CreateItemModal component
 */
export interface CreateItemModalProps {
  showCreateModal: 'file' | 'directory' | null;
  setShowCreateModal: (type: 'file' | 'directory' | null) => void;
  createPath: string;
  newItemName: string;
  setNewItemName: (name: string) => void;
  createError: string | null;
  creating: boolean;
  handleCreate: () => void;
}

/**
 * Component for creating new files or folders
 */
export default function CreateItemModal({
  showCreateModal,
  setShowCreateModal,
  createPath,
  newItemName,
  setNewItemName,
  createError,
  creating,
  handleCreate
}: CreateItemModalProps) {
  if (!showCreateModal) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, animation: 'fadeIn 0.2s ease'
    }}>
      <div style={{
        background: 'white', padding: 32, borderRadius: 24,
        width: 400, boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ marginTop: 0, fontSize: '1.4rem', color: '#1E293B' }}>
          Create New {showCreateModal === 'file' ? 'File' : 'Folder'}
        </h3>
        {createPath && (
          <div style={{ fontSize: '0.85rem', color: '#64748B', marginBottom: 16 }}>
            In: {createPath}
          </div>
        )}
        <input 
          type="text" 
          autoFocus
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          placeholder={`Enter ${showCreateModal} name...`}
          style={{
            width: '100%', padding: '12px 16px', borderRadius: 12,
            border: `1px solid ${createError ? '#EF4444' : '#E2E8F0'}`, 
            fontSize: '1rem', marginBottom: 12,
            outline: 'none', boxSizing: 'border-box'
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleCreate();
            if (e.key === 'Escape') setShowCreateModal(null);
          }}
        />
        {createError && (
          <div style={{ color: '#EF4444', fontSize: '0.9rem', marginBottom: 16, fontWeight: 500 }}>
            ❌ {createError}
          </div>
        )}
        {showCreateModal === 'file' && (
          <div style={{ marginBottom: 24, padding: '12px 16px', background: '#F8FAFC', borderRadius: 12, border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 600, marginBottom: 8 }}>Allowed Extensions:</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {['.md', '.json', '.txt', '.html', '.pdf', '.csv'].map(ext => (
                <span key={ext} style={{ fontSize: '0.8rem', background: 'white', padding: '2px 8px', borderRadius: 6, border: '1px solid #E2E8F0', color: '#334155' }}>
                  {ext}
                </span>
              ))}
            </div>
          </div>
        )}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: showCreateModal === 'directory' ? 12 : 0 }}>
          <button 
            className="sv-btn" 
            style={{ background: '#F1F5F9', color: '#475569' }}
            onClick={() => setShowCreateModal(null)}
          >
            Cancel
          </button>
          <button 
            className="sv-btn sv-btn-primary" 
            onClick={handleCreate}
            disabled={!newItemName.trim() || creating}
          >
            {creating ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}
