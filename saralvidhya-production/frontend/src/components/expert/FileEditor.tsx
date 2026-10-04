import React from 'react';
import { Editor } from '@tinymce/tinymce-react';
import MonacoEditor from '@monaco-editor/react';
import FilePreview from './FilePreview';
import { SaveStatus } from './types';

/**
 * Props for the FileEditor component
 */
export interface FileEditorProps {
  selectedFile: string | null;
  fileContent: string;
  setFileContent: (content: string) => void;
  originalContent: string;
  loadingFile: boolean;
  saving: boolean;
  error: string | null;
  setError: (error: string | null) => void;
  saveStatus: SaveStatus | null;
  setSaveStatus: (status: SaveStatus | null) => void;
  lastSaved: string | null;
  onSave: () => void;
}

/**
 * Component for editing files or showing previews
 */
export default function FileEditor({
  selectedFile,
  fileContent,
  setFileContent,
  originalContent,
  loadingFile,
  saving,
  error,
  setError,
  saveStatus,
  setSaveStatus,
  lastSaved,
  onSave
}: FileEditorProps) {
  const hasUnsavedChanges = fileContent !== originalContent;

  return (
    <div className="sv-editor-area">
      {error && (
        <div style={{ 
          padding: 16, 
          background: '#FEF2F2', 
          color: '#DC2626', 
          borderLeft: '4px solid #DC2626', 
          margin: 24, 
          borderRadius: 8, 
          zIndex: 20,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>Error: {error}</span>
          <button 
            onClick={() => setError(null)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#DC2626',
              cursor: 'pointer',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              padding: '2px 8px'
            }}
          >
            ✕
          </button>
        </div>
      )}
      
      {saveStatus && saveStatus.type !== 'error' && (
        <div style={{
          padding: '12px 20px',
          background: saveStatus.type === 'saving' ? '#EFF6FF' : '#ECFDF5',
          color: saveStatus.type === 'saving' ? '#1D4ED8' : '#047857',
          borderBottom: `1px solid ${saveStatus.type === 'saving' ? '#BFDBFE' : '#A7F3D0'}`,
          fontSize: '0.9rem',
          fontWeight: 600,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 8,
          zIndex: 10,
          animation: 'fadeIn 0.3s ease'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
            {saveStatus.type === 'saving' && (
              <svg style={{ animation: 'spin 1s linear infinite' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>
            )}
            {saveStatus.type !== 'saving' && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
            )}
            <span>{saveStatus.message}</span>
            {saveStatus.prUrl && (
              <a 
                href={saveStatus.prUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                style={{ 
                  color: '#2563EB', 
                  textDecoration: 'underline', 
                  marginLeft: 8,
                  fontWeight: 700 
                }}
              >
                View Pull Request #{saveStatus.prNumber} ↗
              </a>
            )}
          </div>
          {saveStatus.type !== 'saving' && (
            <button 
              onClick={() => setSaveStatus(null)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#047857',
                cursor: 'pointer',
                fontSize: '1.1rem',
                padding: '2px 8px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: 1
              }}
              title="Dismiss"
            >
              ✕
            </button>
          )}
        </div>
      )}
      
      {selectedFile ? (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', animation: 'fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>
          <div className="sv-editor-header">
            <div>
              <h3 style={{ margin: 0, fontSize: '1.4rem', color: '#1E293B', fontWeight: 800 }}>
                {selectedFile.split('/').pop()}
              </h3>
              <div style={{ fontSize: '0.85rem', color: '#64748B', marginTop: 6, fontWeight: 500, letterSpacing: '0.02em' }}>
                {selectedFile}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              {lastSaved && !hasUnsavedChanges && (
                <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 500 }}>
                  Last Saved: {lastSaved}
                </span>
              )}
              {hasUnsavedChanges && (
                <span className="sv-status-badge">Unsaved Changes</span>
              )}
              <button 
                className="sv-btn sv-btn-primary" 
                onClick={onSave}
                disabled={saving || !hasUnsavedChanges}
              >
                {saving ? (
                  <svg style={{ animation: 'spin 1s linear infinite' }} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" strokeDasharray="32" strokeDashoffset="10" fill="none"></circle>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                )}
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
          <div className="sv-editor-content">
            {loadingFile ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', color: '#94A3B8' }}>
                <svg style={{ animation: 'float 2s infinite' }} width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              </div>
            ) : (() => {
              const ext = selectedFile.split('.').pop()?.toLowerCase();
              if (['mp3', 'wav', 'ogg', 'png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext || '')) {
                return <FilePreview selectedFile={selectedFile} />;
              } else if (ext === 'json') {
                return (
                  <div style={{ flex: 1, borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(168, 85, 247, 0.15)' }}>
                    <MonacoEditor
                      height="100%"
                      language="json"
                      theme="vs-light"
                      value={fileContent}
                      onChange={(value) => setFileContent(value || '')}
                      options={{
                        minimap: { enabled: false },
                        formatOnPaste: true,
                        formatOnType: true,
                        padding: { top: 16, bottom: 16 }
                      }}
                    />
                  </div>
                );
              } else {
                return (
                  <div style={{ flex: 1, borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(168, 85, 247, 0.15)', background: 'white' }}>
                    <Editor
                      apiKey={import.meta.env.VITE_TINYMCE_API_KEY || "no-api-key"}
                      init={{
                        height: '100%',
                        width: '100%',
                        menubar: false,
                        plugins: [
                          'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                          'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                          'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
                        ],
                        toolbar: 'undo redo | blocks | ' +
                          'bold italic underline | forecolor backcolor | ' +
                          'alignleft aligncenter alignright | ' +
                          'bullist numlist | table | link image | code | fullscreen',
                        content_style: 'body { font-family:Inter,Helvetica,Arial,sans-serif; font-size:15px; color:#1E293B; line-height:1.6 }',
                        skin: 'oxide',
                        resize: false,
                        branding: false,
                        statusbar: false
                      }}
                      value={fileContent}
                      onEditorChange={(content) => setFileContent(content)}
                    />
                  </div>
                );
              }
            })()}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94A3B8' }}>
          <div style={{ marginBottom: 24, animation: 'float 6s ease-in-out infinite', color: '#C4B5FD' }}>
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path><line x1="9" y1="14" x2="15" y2="14"></line></svg>
          </div>
          <h3 style={{ margin: 0, fontSize: '1.6rem', color: '#1E293B', fontWeight: 800 }}>Select a file to edit</h3>
          <p style={{ fontSize: '1.05rem', marginTop: 12, maxWidth: 340, textAlign: 'center', lineHeight: 1.6 }}>
            Browse the <code style={{background: 'rgba(255,255,255,0.7)', padding: '4px 8px', borderRadius: 6, color: '#334155', fontWeight: 600, border: '1px solid rgba(124,58,237,0.1)'}}>public/generated_resources</code> folder to modify content.
          </p>
        </div>
      )}
    </div>
  );
}
