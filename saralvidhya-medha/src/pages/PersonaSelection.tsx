import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { setStudentPersona } from '@/utils/credentialsStore';

const PERSONAS = [
  {
    id: 'beginner',
    name: 'Beginner',
    desc: 'Focus on basics and clear fundamentals',
    imgSrc: '/personas/beginner.png',
    gradient: 'linear-gradient(135deg, #10B981, #34D399)',
    glow: 'rgba(16, 185, 129, 0.15)'
  },
  {
    id: 'intermediate',
    name: 'Intermediate',
    desc: 'Standard pacing and explanations',
    imgSrc: '/personas/intermediate.png',
    gradient: 'linear-gradient(135deg, #3B82F6, #60A5FA)',
    glow: 'rgba(59, 130, 246, 0.15)'
  },
  {
    id: 'advanced',
    name: 'Advanced',
    desc: 'Advanced concepts and deeper dives',
    imgSrc: '/personas/advanced.png',
    gradient: 'linear-gradient(135deg, #8B5CF6, #A78BFA)',
    glow: 'rgba(139, 92, 246, 0.15)'
  },
];

export default function PersonaSelection() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const treeLogoSrc = `${import.meta.env.BASE_URL}brand-logo.png`;
  const className = searchParams.get('className') || '';
  const semesterName = searchParams.get('semesterName') || '';
  const subjectName = searchParams.get('subjectName') || '';
  const sId = searchParams.get('sId') || '';

  const handlePersonaSelect = (personaId: string) => {
    const cId = searchParams.get('cId') || '';
    const semId = searchParams.get('semId') || '';
    if (cId && sId) {
      localStorage.setItem(`persona_${cId}_${semId}_${sId}`, personaId);
      // Fallback key format used in ClassSubjectSelection
      localStorage.setItem(`persona_${cId}_${sId}`, personaId);
    }
    // Also persist to credentials store so expert can see & override
    const username = localStorage.getItem('username') || '';
    if (username) setStudentPersona(username, personaId);

    const params = new URLSearchParams(searchParams);
    params.set('persona', personaId);
    navigate(`/chapters?${params.toString()}`);
  };

  const handleBackToClass = () => navigate('/');

  const logout = () => {
    localStorage.removeItem('app_authenticated');
    localStorage.removeItem('app_role');
    localStorage.removeItem('questionnaire_completed');
    navigate('/login', { replace: true });
  };

  return (
    <div className="sv-app sv-app--no-rail">
      <main className="sv-main">
        <header className="sv-topbar">
          <div className="sv-topbar-left">
            <div className="sv-persona-brand-mark">
              <img
                className="sv-persona-tree-logo"
                src={treeLogoSrc}
                alt="Saral Vidhya"
                width={220}
                height={132}
              />
            </div>
            <div className="sv-breadcrumb">
              <span className="sv-bc-sep">/</span>
              <span className="sv-bc-link" onClick={handleBackToClass}>{className}</span>
              {semesterName && (
                <>
                  <span className="sv-bc-sep">/</span>
                  <span className="sv-bc-link">{semesterName}</span>
                </>
              )}
              <span className="sv-bc-sep">/</span>
              <span className="sv-bc-link" onClick={() => navigate('/')}>{subjectName}</span>
            </div>
          </div>
          <div className="sv-topbar-right" style={{ display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
            <button className="sv-logout-btn" onClick={logout} title="Log Out" aria-label="Log Out">
              <svg width="26" height="26" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="50" r="44" stroke="#FF4D4D" strokeWidth="7" fill="none"/>
                <path d="M48 30H30V70H48" stroke="#FF4D4D" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                <path d="M42 50H74M74 50L60 36M74 50L60 64" stroke="#FF4D4D" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              </svg>
            </button>
            <button className="sv-profile-btn" onClick={() => navigate('/profile')} title="Profile" aria-label="Profile">
              <svg width="26" height="26" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="50" r="50" fill="#4285F4"/>
                <circle cx="50" cy="40" r="18" fill="#FFFFFF"/>
                <path d="M20 84C20 67 33.4 54 50 54C66.6 54 80 67 80 84H20Z" fill="#FFFFFF"/>
              </svg>
            </button>
          </div>
        </header>

        <div className="sv-content">
          <div className="sv-subjects fade-in">


            <div className="sv-persona-grid">
              {PERSONAS.map((p, idx) => (
                <div
                  key={p.id}
                  className="sv-persona-card"
                  style={{
                    '--card-gradient': p.gradient,
                    '--card-glow': p.glow,
                    animationDelay: `${idx * 0.07}s`
                  } as React.CSSProperties}
                  onClick={() => handlePersonaSelect(p.id)}
                >
                  <div className="sv-persona-card-glow-overlay" />
                  <div className="sv-persona-icon-wrap">
                    <img src={p.imgSrc} alt={p.name} className="sv-persona-img" />
                  </div>
                  <div className="sv-persona-body">
                    <h3 className="sv-persona-title">{p.name}</h3>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
