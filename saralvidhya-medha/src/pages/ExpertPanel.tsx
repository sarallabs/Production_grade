import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import TurndownService from 'turndown';
import { marked } from 'marked';
import ExpertLogin from '@/components/expert/ExpertLogin';
import FileTreeSidebar from '@/components/expert/FileTreeSidebar';
import FileEditor from '@/components/expert/FileEditor';
import CreateItemModal from '@/components/expert/CreateItemModal';
import { FileNode, SaveStatus } from '@/components/expert/types';

const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  emDelimiter: '*'
});

const API_BASE = import.meta.env.VITE_API_URL || (
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://127.0.0.1:3001' 
    : ''
);

export default function ExpertPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    sessionStorage.getItem('expert_access') === 'true'
  );
  const [tree, setTree] = useState<FileNode[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  
  const [fileContent, setFileContent] = useState<string>('');
  const [originalContent, setOriginalContent] = useState<string>('');
  const [loadingFile, setLoadingFile] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState<'file' | 'directory' | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [createPath, setCreatePath] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetchTree();
  }, []);

  const fetchTree = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/resources/tree`);
      if (!res.ok) throw new Error('Failed to fetch file tree');
      
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        throw new Error("Local backend server is not running. Please keep 'npm run dev' running.");
      }

      const data = await res.json();
      setTree(data);
    } catch (err: any) {
      if (err.message === 'Failed to fetch') {
        setError("Failed to fetch: The local backend server is not running. Please run 'npm run dev' in your workspace terminal.");
      } else {
        setError(err.message);
      }
    }
  };

  const loadFile = async (path: string) => {
    if (fileContent !== originalContent && selectedFile) {
      await saveFile();
    }
    
    setSelectedFile(path);
    setLoadingFile(true);
    setError(null);

    const ext = path.split('.').pop()?.toLowerCase() || '';
    const isBinary = ['mp3', 'wav', 'ogg', 'png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext);

    if (isBinary) {
      setFileContent('');
      setOriginalContent('');
      setLastSaved(null);
      setLoadingFile(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/resources/file`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path })
      });
      if (!res.ok) throw new Error('Failed to load file content');
      let text = await res.text();
      
      if (ext === 'md') {
        text = await marked.parse(text);
      }
      
      setFileContent(text);
      setOriginalContent(text);
      setLastSaved(null);
    } catch (err: any) {
      if (err.message === 'Failed to fetch') {
        setError("Failed to fetch: The local backend server is not running. Please run 'npm run dev' in your workspace terminal.");
      } else {
        setError(err.message);
      }
    } finally {
      setLoadingFile(false);
    }
  };

  const saveFile = useCallback(async () => {
    if (!selectedFile) return;
    if (fileContent === originalContent) return;
    
    setSaving(true);
    setSaveStatus({ type: 'saving', message: 'Saving changes...' });
    setError(null);

    const timeouts: number[] = [];
    const statusSteps = [
      { delay: 800, message: 'Committing changes to GitHub...' },
      { delay: 2000, message: 'Creating Pull Request...' }
    ];

    statusSteps.forEach(step => {
      const t = window.setTimeout(() => {
        setSaveStatus(prev => prev && prev.type === 'saving' ? { ...prev, message: step.message } : prev);
      }, step.delay);
      timeouts.push(t);
    });

    const clearSimulatedTimeouts = () => {
      timeouts.forEach(t => clearTimeout(t));
    };

    try {
      let contentToSave = fileContent;
      const ext = selectedFile.split('.').pop()?.toLowerCase();
      if (ext === 'md') {
        contentToSave = turndownService.turndown(fileContent);
      }
      
      const res = await fetch(`${API_BASE}/api/resources/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: selectedFile, content: contentToSave })
      });
      
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to save file');
      }
      
      const data = await res.json();
      clearSimulatedTimeouts();
      setOriginalContent(fileContent);
      const now = new Date();
      setLastSaved(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      
      if (data.prCreated) {
        setSaveStatus({
          type: 'pr_created',
          message: `Commit successful! Pull Request #${data.prNumber} created.`,
          prUrl: data.prUrl,
          prNumber: data.prNumber
        });
      } else {
        setSaveStatus({
          type: 'deploy_triggered',
          message: `Commit successful to branch '${data.branch}'! Cloudflare deployment triggered.`
        });
      }
      
    } catch (err: any) {
      clearSimulatedTimeouts();
      console.error('Error saving file:', err);
      let errMsg = err.message;
      if (err.message === 'Failed to fetch') {
        errMsg = "Failed to fetch: The local backend server is not running. Please run 'npm run dev' in your workspace terminal.";
      }
      setError(errMsg);
      setSaveStatus({
        type: 'error',
        message: errMsg
      });
    } finally {
      setSaving(false);
    }
  }, [selectedFile, fileContent, originalContent]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveFile();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [saveFile]);

  const toggleDir = (clickedPath: string) => {
    setExpanded(prev => ({ ...prev, [clickedPath]: !prev[clickedPath] }));
  };

  const handleCreate = async () => {
    if (!newItemName.trim() || !showCreateModal) return;
    setCreateError(null);
    
    if (showCreateModal === 'file') {
      const allowedExtensions = ['.md', '.json', '.txt', '.html', '.pdf', '.csv'];
      const ext = '.' + newItemName.split('.').pop()?.toLowerCase();
      
      if (!newItemName.includes('.') || !allowedExtensions.includes(ext)) {
        setCreateError('Invalid file type');
        return;
      }
    }

    setCreating(true);
    try {
      const fullPath = createPath ? `${createPath}/${newItemName}` : newItemName;
      const endpoint = showCreateModal === 'file' ? 'create-file' : 'create-directory';
      
      const res = await fetch(`${API_BASE}/api/resources/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: fullPath })
      });
      
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Failed to create ${showCreateModal}`);
      }
      
      setNewItemName('');
      setShowCreateModal(null);
      await fetchTree();
      
      if (showCreateModal === 'file') {
        loadFile(fullPath);
      }
    } catch (err: any) {
      if (err.message === 'Failed to fetch') {
        setCreateError("Failed to fetch: The local backend server is not running. Please run 'npm run dev' in your workspace terminal.");
      } else {
        setCreateError(err.message);
      }
    } finally {
      setCreating(false);
    }
  };

  const openCreateModal = (type: 'file' | 'directory', path: string = '') => {
    setCreatePath(path);
    setNewItemName('');
    setCreateError(null);
    setShowCreateModal(type);
  };

  if (!isAuthenticated) {
    return <ExpertLogin onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <>
      <style>{`
        .sv-expert-layout {
          display: flex;
          height: 100vh;
          background: linear-gradient(135deg, #F8FAFC, #FDF2F8, #FAF5FF);
          font-family: 'Inter', system-ui, sans-serif;
          color: #1E293B;
          overflow: hidden;
          position: relative;
        }
        
        .sv-bg-blobs {
          position: absolute;
          top: 0; left: 0; width: 100%; height: 100%;
          overflow: hidden;
          z-index: 0;
          pointer-events: none;
        }
        .sv-blob-1 {
          position: absolute; width: 600px; height: 600px; background: rgba(168, 85, 247, 0.15);
          filter: blur(120px); border-radius: 50%; top: -200px; left: -100px; animation: float 14s ease-in-out infinite;
        }
        .sv-blob-2 {
          position: absolute; width: 500px; height: 500px; background: rgba(236, 72, 153, 0.15);
          filter: blur(120px); border-radius: 50%; bottom: -100px; right: -50px; animation: float 18s ease-in-out infinite reverse;
        }

        .sv-sidebar {
          width: 320px;
          background: rgba(255, 255, 255, 0.65);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border-right: 1px solid rgba(124, 58, 237, 0.12);
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
          z-index: 10;
          box-shadow: 4px 0 24px rgba(0,0,0,0.02);
          animation: slideRight 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .sv-sidebar-header {
          padding: 24px;
          border-bottom: 1px solid rgba(124, 58, 237, 0.08);
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.8), rgba(250, 245, 255, 0.8));
        }
        .sv-brand-title {
          margin: 0;
          font-size: 1.3rem;
          font-weight: 800;
          background: linear-gradient(135deg, #7C3AED, #EC4899);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          letter-spacing: -0.02em;
        }
        .sv-tree-container {
          flex: 1;
          overflow-y: auto;
          padding: 16px 8px;
        }
        
        .sv-tree-item {
          padding: 8px 12px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s ease;
          font-size: 0.95rem;
          color: #334155;
          display: flex;
          align-items: center;
          margin-bottom: 2px;
          font-weight: 500;
          user-select: none;
        }
        .sv-tree-item:hover {
          background: rgba(168, 85, 247, 0.08);
          color: #7C3AED;
        }
        .sv-tree-item.selected {
          background: linear-gradient(135deg, rgba(124, 58, 237, 0.1), rgba(236, 72, 153, 0.1));
          color: #7C3AED;
          font-weight: 700;
        }
        .sv-tree-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          color: #94A3B8;
        }
        .sv-tree-actions {
          display: none;
          color: #94A3B8;
        }
        .sv-tree-item:hover .sv-tree-actions {
          display: inline-flex;
        }
        .sv-tree-children {
          display: block;
          overflow: hidden;
        }

        .sv-editor-area {
          flex: 1;
          display: flex;
          flex-direction: column;
          position: relative;
          z-index: 10;
          animation: fadeIn 0.6s ease;
        }
        .sv-editor-header {
          padding: 20px 32px;
          background: rgba(255, 255, 255, 0.6);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(124, 58, 237, 0.1);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .sv-editor-content {
          flex: 1;
          padding: 24px 32px;
          overflow: hidden;
          display: flex;
        }
        .sv-textarea {
          flex: 1;
          width: 100%;
          height: 100%;
          padding: 24px;
          border-radius: 16px;
          border: 1px solid rgba(168, 85, 247, 0.15);
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(10px);
          font-family: 'Fira Code', 'Consolas', monospace;
          font-size: 0.95rem;
          color: #1E293B;
          line-height: 1.7;
          resize: none;
          outline: none;
          box-shadow: 0 10px 30px rgba(0,0,0,0.02), inset 0 2px 10px rgba(0,0,0,0.01);
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .sv-textarea:focus {
          border-color: #A855F7;
          background: white;
          box-shadow: 0 10px 40px rgba(124, 58, 237, 0.08), inset 0 2px 10px rgba(124, 58, 237, 0.02);
          transform: translateY(-2px);
        }
        .sv-btn {
          padding: 12px 24px;
          border-radius: 12px;
          border: none;
          font-weight: 600;
          font-size: 0.95rem;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .sv-btn-primary {
          background: linear-gradient(135deg, #7C3AED, #EC4899);
          color: white;
          box-shadow: 0 8px 20px rgba(124, 58, 237, 0.25);
        }
        .sv-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 28px rgba(124, 58, 237, 0.35);
          background: linear-gradient(135deg, #8B5CF6, #F9A8D4);
        }
        .sv-btn-primary:active {
          transform: translateY(1px);
        }
        .sv-btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }
        .sv-search {
          width: 100%;
          padding: 14px 16px;
          border-radius: 12px;
          border: 1px solid #E2E8F0;
          background: rgba(255, 255, 255, 0.9);
          font-size: 0.95rem;
          margin-top: 16px;
          outline: none;
          transition: all 0.3s ease;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);
        }
        .sv-search:focus {
          border-color: #A855F7;
          background: white;
          box-shadow: 0 0 0 4px rgba(168, 85, 247, 0.1);
        }
        .sv-status-badge {
          font-size: 0.85rem;
          padding: 6px 14px;
          border-radius: 20px;
          background: rgba(245, 158, 11, 0.1);
          border: 1px solid rgba(245, 158, 11, 0.2);
          color: #D97706;
          font-weight: 700;
          animation: pulseFade 2s infinite alternate;
        }

        @keyframes float {
          0% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(40px) scale(1.05); }
          100% { transform: translateY(0px) scale(1); }
        }
        @keyframes slideRight {
          from { opacity: 0; transform: translateX(-30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseFade {
          from { opacity: 0.7; }
          to { opacity: 1; }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div className="sv-expert-layout">
        <div className="sv-bg-blobs">
          <div className="sv-blob-1"></div>
          <div className="sv-blob-2"></div>
        </div>

        <FileTreeSidebar 
          tree={tree}
          error={error}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          expanded={expanded}
          selectedFile={selectedFile}
          onToggleDir={toggleDir}
          onLoadFile={loadFile}
          onOpenCreateModal={openCreateModal}
          onExit={() => {
            sessionStorage.removeItem('expert_access');
            setIsAuthenticated(false);
          }}
        />

        <FileEditor 
          selectedFile={selectedFile}
          fileContent={fileContent}
          setFileContent={setFileContent}
          originalContent={originalContent}
          loadingFile={loadingFile}
          saving={saving}
          error={error}
          setError={setError}
          saveStatus={saveStatus}
          setSaveStatus={setSaveStatus}
          lastSaved={lastSaved}
          onSave={saveFile}
        />
      </div>

      <CreateItemModal 
        showCreateModal={showCreateModal}
        setShowCreateModal={setShowCreateModal}
        createPath={createPath}
        newItemName={newItemName}
        setNewItemName={setNewItemName}
        createError={createError}
        creating={creating}
        handleCreate={handleCreate}
      />
    </>
  );
}
