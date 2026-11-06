import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCatalog, getVisibleBoardIds, type CatalogBoard } from '@/data/contentRepository';
import ExaminerConsole from './ExaminerConsole';

const defaultLogo = `${import.meta.env.BASE_URL}brand-logo.png`;

const SESSION_KEY = 'sv_visible_boards';
const BRAND_KEY = 'sv_brand_name';
const LOGO_KEY = 'sv_logo';
const MODEL_KEY = 'sv_gemini_model';
const MOOCS_KEY = 'sv_moocs_mode';

export default function ConfigPage() {
  const navigate = useNavigate();
  const [boards, setBoards] = useState<CatalogBoard[]>([]);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState(false);
  
  const [logo, setLogo] = useState<string>(defaultLogo);
  const [brandName, setBrandName] = useState<string>('Saral Vidhya');
  const [isDragging, setIsDragging] = useState(false);
  const [geminiModel, setGeminiModel] = useState<string>('gemini-3.5-flash');
  const [moocsMode, setMoocsMode] = useState<boolean>(true);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  type ConfigView = 'menu' | 'boards' | 'brand' | 'logo' | 'model' | 'moocs' | 'examiner';
  const [view, setView] = useState<ConfigView>('menu');

  useEffect(() => {
    getCatalog().then((catalog) => {
      setBoards(catalog.boards);
      const stored = getVisibleBoardIds();
      const initial: Record<string, boolean> = {};
      for (const b of catalog.boards) {
        initial[b.id] = stored ? stored.includes(b.id) : true;
      }
      setChecked(initial);
    });
    
    const storedBrand = sessionStorage.getItem(BRAND_KEY);
    if (storedBrand) setBrandName(storedBrand);
    
    const storedLogo = sessionStorage.getItem(LOGO_KEY);
    if (storedLogo) setLogo(storedLogo);
    
    const storedModel = sessionStorage.getItem(MODEL_KEY);
    if (storedModel) setGeminiModel(storedModel);

    const storedMoocs = sessionStorage.getItem(MOOCS_KEY);
    if (storedMoocs) setMoocsMode(storedMoocs === 'true');
  }, []);

  const selectBoard = (id: string) => {
    const newChecked: Record<string, boolean> = {};
    boards.forEach(b => newChecked[b.id] = false);
    newChecked[id] = true;
    setChecked(newChecked);
    
    // Auto update brand name
    const board = boards.find(b => b.id === id);
    if (board) {
      setBrandName(`${board.name} (${board.shortName})`);
      setLogo(board.logo || defaultLogo);
    }
  };

  const handleSave = () => {
    if (brandName.length < 3 || brandName.length > 100) {
      alert("Brand name must be between 3 and 100 characters.");
      return;
    }
    
    const visible = boards.map((b) => b.id).filter((id) => checked[id]);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(visible));
    sessionStorage.setItem(BRAND_KEY, brandName);
    sessionStorage.setItem(LOGO_KEY, logo);
    sessionStorage.setItem(MODEL_KEY, geminiModel);
    sessionStorage.setItem(MOOCS_KEY, moocsMode ? 'true' : 'false');
    
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };



  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleFile = (file: File) => {
    if (file.size > 2 * 1024 * 1024) return alert("Max file size 2MB");
    if (!['image/png', 'image/jpeg', 'image/svg+xml'].includes(file.type)) return alert("Invalid file type. Please upload PNG, JPG, or SVG.");
    const reader = new FileReader();
    reader.onload = (e) => setLogo(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const renderActionButtons = () => (
    <div className="sv-action-bar">
      <button onClick={handleSave} className="sv-btn sv-btn-primary">
        {saved ? (
          <>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            Saved successfully!
          </>
        ) : 'Save & Apply'}
      </button>

      <button onClick={() => navigate('/')} className="sv-btn sv-btn-secondary">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        Go Back to Home
      </button>
      <button onClick={() => setView('menu')} className="sv-btn sv-btn-secondary" style={{ borderStyle: 'dashed' }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        Back to Options
      </button>
    </div>
  );

  return (
    <>
      <style>{`
        .sv-config-page {
          height: 100vh;
          overflow-y: auto;
          background: linear-gradient(135deg, #F5F3FF, #FDF2F8, #FAF5FF);
          padding: ${view === 'examiner' ? '0' : '60px 20px 100px'};
          font-family: 'Inter', system-ui, sans-serif;
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
          position: absolute; width: 600px; height: 600px; background: rgba(168, 85, 247, 0.12);
          filter: blur(100px); border-radius: 50%; top: -150px; left: -100px; animation: float 12s ease-in-out infinite;
        }
        .sv-blob-2 {
          position: absolute; width: 500px; height: 500px; background: rgba(236, 72, 153, 0.12);
          filter: blur(100px); border-radius: 50%; bottom: 10%; right: -50px; animation: float 15s ease-in-out infinite reverse;
        }
        
        .sv-config-container {
          max-width: ${view === 'examiner' ? '100%' : '680px'};
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 32px;
          position: relative;
          z-index: 10;
          transition: max-width 0.3s ease;
        }

        .sv-card {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-radius: 24px;
          box-shadow: 0 10px 40px rgba(124, 58, 237, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.9);
          padding: 32px 40px;
          animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) backwards;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .sv-menu-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
          margin-top: 24px;
        }
        
        .sv-menu-option {
          background: white;
          border: 2px solid #E2E8F0;
          border-radius: 16px;
          padding: 24px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 20px;
          transition: all 0.3s ease;
        }
        .sv-menu-option:hover {
          border-color: #A855F7;
          background: #FAF5FF;
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(168, 85, 247, 0.12);
        }
        .sv-menu-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: linear-gradient(135deg, #7C3AED, #F472B6);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        @keyframes float {
          0% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(40px) scale(1.05); }
          100% { transform: translateY(0px) scale(1); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes pop {
          0% { transform: scale(0.8); }
          50% { transform: scale(1.15); }
          100% { transform: scale(1); }
        }

        .sv-title {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 8px;
          background: linear-gradient(135deg, #7C3AED, #EC4899);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .sv-desc {
          font-size: 0.95rem;
          color: #64748b;
          margin-bottom: 24px;
          line-height: 1.5;
        }

        /* Boards */
        .sv-board-label {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px 20px;
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          margin-bottom: 12px;
          background: white;
          border: 2px solid #E2E8F0;
        }
        .sv-board-label:hover {
          transform: scale(1.02) translateX(4px);
        }
        .sv-board-label.checked {
          border-color: #A855F7;
          background: #FAF5FF;
          box-shadow: 0 4px 12px rgba(168, 85, 247, 0.08);
        }
        .sv-radio {
          width: 24px;
          height: 24px;
          accent-color: #A855F7;
          cursor: pointer;
          transition: transform 0.2s;
        }
        .sv-radio:checked {
          animation: pop 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        /* Upload Area */
        .sv-upload-area {
          border: 2px dashed #C4B5FD;
          border-radius: 20px;
          padding: 40px 24px;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          background: rgba(255, 255, 255, 0.6);
          position: relative;
          overflow: hidden;
        }
        .sv-upload-area.dragging {
          border-color: #EC4899;
          background: #FDF2F8;
          transform: scale(1.03);
        }
        .sv-upload-area:hover {
          border-color: #A855F7;
          background: #FAF5FF;
        }
        .sv-logo-preview {
          width: 90px;
          height: 90px;
          object-fit: contain;
          border-radius: 16px;
          margin: 0 auto 20px;
          animation: fadeIn 0.6s ease;
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          filter: drop-shadow(0 4px 12px rgba(0,0,0,0.08));
        }
        .sv-logo-preview:hover {
          transform: scale(1.15) rotate(2deg);
        }
        .sv-guidelines {
          background: linear-gradient(135deg, rgba(248, 250, 252, 0.8), rgba(241, 245, 249, 0.8));
          border-left: 4px solid #F472B6;
          padding: 20px;
          border-radius: 12px;
          font-size: 0.9rem;
          color: #475569;
          margin-top: 24px;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);
        }
        .sv-guidelines ul {
          margin: 12px 0 0 24px;
          padding: 0;
          line-height: 1.6;
        }
        .sv-guidelines li {
          margin-bottom: 6px;
        }

        /* Brand Input */
        .sv-input {
          width: 100%;
          padding: 16px 20px;
          border-radius: 14px;
          border: 2px solid #E2E8F0;
          font-size: 1.05rem;
          font-weight: 500;
          color: #1E293B;
          transition: all 0.3s ease;
          box-sizing: border-box;
          background: white;
        }
        .sv-input:focus {
          outline: none;
          border-color: #A855F7;
          box-shadow: 0 0 0 4px rgba(168, 85, 247, 0.15);
        }
        .sv-live-preview {
          margin-top: 20px;
          padding: 20px;
          background: linear-gradient(135deg, rgba(124, 58, 237, 0.05), rgba(236, 72, 153, 0.05));
          border-radius: 16px;
          display: flex;
          align-items: center;
          gap: 16px;
          border: 1px solid rgba(168, 85, 247, 0.1);
        }
        .sv-preview-text {
          font-size: 1.4rem;
          font-weight: 700;
          background: linear-gradient(135deg, #7C3AED, #EC4899);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        /* Bottom Buttons */
        .sv-action-bar {
          display: flex;
          justify-content: center;
          gap: 16px;
          flex-wrap: wrap;
          margin-top: 16px;
        }
        .sv-btn {
          padding: 16px 28px;
          border-radius: 14px;
          font-weight: 600;
          font-size: 1.05rem;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 10px;
        }
        .sv-btn-primary {
          background: linear-gradient(135deg, #7C3AED, #F472B6);
          color: white;
          border: none;
          box-shadow: 0 8px 20px rgba(124, 58, 237, 0.25);
          position: relative;
          overflow: hidden;
        }
        .sv-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 28px rgba(124, 58, 237, 0.35);
          background: linear-gradient(135deg, #8B5CF6, #F9A8D4);
        }
        .sv-btn-primary:active { transform: translateY(1px); }
        
        .sv-btn-secondary {
          background: white;
          color: #475569;
          border: 2px solid #E2E8F0;
        }
        .sv-btn-secondary:hover {
          border-color: #A855F7;
          color: #7C3AED;
          background: #FAF5FF;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(168, 85, 247, 0.1);
        }

        @media (max-width: 600px) {
          .sv-config-page { padding: 40px 16px 100px; }
          .sv-card { padding: 24px 20px; }
          .sv-action-bar { flex-direction: column; }
          .sv-btn { width: 100%; }
        }
      `}</style>
      
      <div className="sv-config-page">
        <div className="sv-bg-blobs">
          <div className="sv-blob-1"></div>
          <div className="sv-blob-2"></div>
        </div>
        
        <div className="sv-config-container">
          
          {view === 'menu' && (
            <div className="sv-card">
              <h2 className="sv-title" style={{ textAlign: 'center', fontSize: '1.8rem' }}>Configuration Menu</h2>
              <p className="sv-desc" style={{ textAlign: 'center' }}>Select an option below to customize your experience.</p>
              
              <div className="sv-menu-grid">
                <div className="sv-menu-option" onClick={() => setView('boards')}>
                  <div className="sv-menu-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#1E293B' }}>Select University</div>
                    <div style={{ fontSize: '0.85rem', color: '#64748B' }}>Choose which university to view.</div>
                  </div>
                </div>
                
                <div className="sv-menu-option" onClick={() => setView('brand')}>
                  <div className="sv-menu-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#1E293B' }}>Brand Name</div>
                    <div style={{ fontSize: '0.85rem', color: '#64748B' }}>Set your custom branding text.</div>
                  </div>
                </div>
                
                <div className="sv-menu-option" onClick={() => setView('logo')}>
                  <div className="sv-menu-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#1E293B' }}>Select Logo</div>
                    <div style={{ fontSize: '0.85rem', color: '#64748B' }}>Customize the application logo.</div>
                  </div>
                </div>

                <div className="sv-menu-option" onClick={() => setView('examiner')}>
                  <div className="sv-menu-icon" style={{ background: 'linear-gradient(135deg, #2563EB, #0284C7)' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                      <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#1E293B' }}>Examiner Console</div>
                    <div style={{ fontSize: '0.85rem', color: '#64748B' }}>Create, review, auto & manual generate certification exam papers.</div>
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '32px' }}>
                <button onClick={() => navigate('/')} className="sv-btn sv-btn-secondary">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 12H5M12 19l-7-7 7-7"/>
                  </svg>
                  Go Back to Home
                </button>
              </div>
            </div>
          )}

          {view === 'boards' && (
            <div className="sv-card">
              <h2 className="sv-title">Select University</h2>
              <p className="sv-desc">Choose which university is visible on the home screen.</p>
              
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {boards.map((board) => (
                  <label
                    key={board.id}
                    className={`sv-board-label ${checked[board.id] ? 'checked' : ''}`}
                  >
                    <input
                      type="radio"
                      name="university_selection"
                      className="sv-radio"
                      checked={!!checked[board.id]}
                      onChange={() => selectBoard(board.id)}
                    />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '1.05rem', color: '#1E293B' }}>
                        {board.shortName || board.name}
                      </div>
                      {board.shortName && (
                        <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px' }}>
                          {board.name}
                        </div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
              {renderActionButtons()}
            </div>
          )}

          {view === 'brand' && (
            <div className="sv-card">
              <h2 className="sv-title">Brand Name</h2>
              <p className="sv-desc">Set your custom branding text. (Default: Saral Vidhya)</p>
              
              <input
                type="text"
                className="sv-input"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="Enter brand name"
                maxLength={40}
              />
              
              <div className="sv-live-preview">
                <div style={{ fontSize: '0.9rem', color: '#64748B', fontWeight: 600 }}>Preview:</div>
                <img src={logo} alt="Preview" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
                <div className="sv-preview-text">
                  {brandName || ' '}
                </div>
              </div>
              {renderActionButtons()}
            </div>
          )}

          {view === 'logo' && (
            <div className="sv-card">
              <h2 className="sv-title">Select Logo</h2>
              <p className="sv-desc">Customize the application logo for your brand.</p>
              
              <div 
                className={`sv-upload-area ${isDragging ? 'dragging' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <img src={logo} alt="Logo Preview" className="sv-logo-preview" style={{ width: 'auto', height: '90px', maxWidth: '200px' }} />
                <div style={{ fontWeight: 600, color: '#7C3AED', marginBottom: '8px', fontSize: '1.1rem' }}>
                  Click to upload or drag and drop
                </div>
                <div style={{ fontSize: '0.9rem', color: '#94A3B8' }}>
                  Supports SVG, PNG, or JPG
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  accept=".png,.jpg,.jpeg,.svg"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFile(e.target.files[0]);
                    }
                  }}
                />
              </div>
              
              <div className="sv-guidelines">
                <strong>Logo Guidelines:</strong>
                <ul>
                  <li>Recommended dimensions: 512 × 512 px (Preferred)</li>
                  <li>Minimum: 256 × 256 px</li>
                  <li>Aspect Ratio: 1:1</li>
                  <li>Transparent PNG recommended</li>
                  <li>Max file size: 2 MB</li>
                </ul>
              </div>
              {renderActionButtons()}
            </div>
          )}

          {view === 'model' && (
            <div className="sv-card">
              <h2 className="sv-title">AI Model</h2>
              <p className="sv-desc">Select the Gemini model to be used in the Ask feature.</p>
              
              <select
                className="sv-input"
                value={geminiModel}
                onChange={(e) => setGeminiModel(e.target.value)}
              >
                <option value="gemini-3.5-flash">Gemini 3.5 Flash</option>
                <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                <option value="gemini-2.5-flash-lite">Gemini 2.5 Flash Lite</option>
                <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite</option>
                <option value="gemini-3-flash-preview">Gemini 3 Flash Preview</option>
                <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro Preview</option>
                <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                <option value="gemini-pro-latest">Gemini Pro Latest</option>
                <option value="gemini-flash-latest">Gemini Flash Latest</option>
              </select>
              
              <div className="sv-live-preview" style={{ marginTop: '16px' }}>
                <div style={{ fontSize: '0.9rem', color: '#64748B', fontWeight: 600 }}>Currently Selected:</div>
                <div className="sv-preview-text" style={{ fontSize: '1.1rem' }}>
                  {geminiModel}
                </div>
              </div>
              {renderActionButtons()}
            </div>
          )}

          {view === 'moocs' && (
            <div className="sv-card">
              <h2 className="sv-title">MOOCs Mode</h2>
              <p className="sv-desc">Toggle MOOCs-style guided learning journey for all chapters.</p>
              
              <label
                className={`sv-board-label ${moocsMode ? 'checked' : ''}`}
                style={{ display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer' }}
              >
                <input
                  type="checkbox"
                  className="sv-checkbox"
                  checked={moocsMode}
                  onChange={() => setMoocsMode(!moocsMode)}
                />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '1.05rem', color: '#1E293B' }}>
                    Enable MOOCs Mode
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px' }}>
                    When enabled, elements like Videos, Podcasts, and Flashcards are shown in a strictly guided sequence. Question Bank, PYQs, and Deep Dives are hidden.
                  </div>
                </div>
              </label>
              {renderActionButtons()}
            </div>
          )}

          {view === 'examiner' && (
            <div style={{ width: '100%' }}>
              <ExaminerConsole />
            </div>
          )}

        </div>
      </div>
    </>
  );
}
