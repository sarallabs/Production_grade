import React, { useState } from 'react';

/**
 * Props for the ExpertLogin component
 */
export interface ExpertLoginProps {
  onLogin: () => void;
}

/**
 * Component for the expert login screen
 */
export default function ExpertLogin({ onLogin }: ExpertLoginProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'Ekam@2026') {
      sessionStorage.setItem('expert_access', 'true');
      onLogin();
    } else {
      setError(true);
      setTimeout(() => setError(false), 500);
    }
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh',
      background: 'linear-gradient(135deg, #F8FAFC, #FDF2F8, #FAF5FF)',
      fontFamily: "'Inter', system-ui, sans-serif",
      position: 'relative',
      overflow: 'hidden'
    }}>
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          50% { transform: translateX(8px); }
          75% { transform: translateX(-8px); }
        }
        .shake-animation { animation: shake 0.4s ease-in-out; }
      `}</style>
      <div style={{ position: 'absolute', width: 600, height: 600, background: 'rgba(168, 85, 247, 0.15)', filter: 'blur(120px)', borderRadius: '50%', top: '-200px', left: '-100px', animation: 'float 14s infinite' }}></div>
      <div style={{ position: 'absolute', width: 500, height: 500, background: 'rgba(236, 72, 153, 0.15)', filter: 'blur(120px)', borderRadius: '50%', bottom: '-100px', right: '-50px', animation: 'float 18s infinite reverse' }}></div>
      
      <div style={{
        position: 'relative', zIndex: 10,
        background: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        padding: '48px',
        borderRadius: '24px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.04), inset 0 2px 10px rgba(255,255,255,0.5)',
        border: '1px solid rgba(124, 58, 237, 0.15)',
        width: '100%', maxWidth: '420px',
        textAlign: 'center'
      }}>
        <div style={{ marginBottom: 24, color: '#A855F7', display: 'flex', justifyContent: 'center' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
        </div>
        <h2 style={{ 
          margin: '0 0 12px 0', 
          fontSize: '1.6rem', 
          fontWeight: 800,
          background: 'linear-gradient(135deg, #7C3AED, #EC4899)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>Expert Access Required</h2>
        <p style={{ color: '#475569', fontSize: '0.95rem', marginBottom: 32, lineHeight: 1.5 }}>
          Enter the admin password to continue.
        </p>
        
        <form onSubmit={handleSubmit} className={error ? 'shake-animation' : ''}>
          <input 
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(false); }}
            placeholder="Enter Password"
            autoFocus
            style={{
              width: '100%',
              padding: '16px 20px',
              borderRadius: '12px',
              border: `2px solid ${error ? '#EF4444' : 'rgba(168, 85, 247, 0.2)'}`,
              background: 'rgba(255,255,255,0.9)',
              fontSize: '1rem',
              outline: 'none',
              marginBottom: '16px',
              transition: 'all 0.3s',
              boxShadow: error ? '0 0 0 4px rgba(239, 68, 68, 0.1)' : 'inset 0 2px 4px rgba(0,0,0,0.02)',
              boxSizing: 'border-box'
            }}
          />
          
          {error && (
            <div style={{ color: '#EF4444', fontSize: '0.85rem', marginBottom: '16px', fontWeight: 500 }}>
              ❌ Incorrect password. Please try again.
            </div>
          )}
          
          <button 
            type="submit"
            style={{
              width: '100%',
              padding: '16px',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, #7C3AED, #EC4899)',
              color: 'white',
              fontSize: '1rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.3s',
              boxShadow: '0 8px 20px rgba(124, 58, 237, 0.25)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            Unlock Expert Panel
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </button>
        </form>
      </div>
    </div>
  );
}
