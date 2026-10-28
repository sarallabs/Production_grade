import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { setStudentPersona } from '@/utils/credentialsStore';
import { cloudStorage } from '@/context/CloudStateContext';

const PERSONAS = [
  {
    id: 'beginner',
    name: 'Beginner',
    desc: 'Focus on basics and clear fundamentals',
    imgSrc: `${import.meta.env.BASE_URL}personas/beginner.png`,
    gradient: 'linear-gradient(135deg, #7BA88B, #96C1A4)',
    glow: 'rgba(123, 168, 139, 0.22)'
  },
  {
    id: 'intermediate',
    name: 'Intermediate',
    desc: 'Standard pacing and explanations',
    imgSrc: `${import.meta.env.BASE_URL}personas/intermediate.png`,
    gradient: 'linear-gradient(135deg, #4F7B64, #6B9C82)',
    glow: 'rgba(79, 123, 100, 0.22)'
  },
  {
    id: 'advanced',
    name: 'Advanced',
    desc: 'Advanced concepts and deeper dives',
    imgSrc: `${import.meta.env.BASE_URL}personas/advanced.png`,
    gradient: 'linear-gradient(135deg, #2D3E36, #415A4F)',
    glow: 'rgba(45, 62, 54, 0.22)'
  },
];

export default function PersonaSelection() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const savedCourseParams: Record<string, string> = (() => {
    try { return JSON.parse(cloudStorage.getItem('sv_last_course_params') || '{}'); } catch { return {}; }
  })();
  const sId = searchParams.get('sId') || savedCourseParams.sId || '';
  const treeLogoSrc = `${import.meta.env.BASE_URL}brand-tree-cropped.png`;
  const className = searchParams.get('className') || savedCourseParams.className || '';
  const semesterName = searchParams.get('semesterName') || savedCourseParams.semesterName || '';
  const subjectName = searchParams.get('subjectName') || savedCourseParams.subjectName || '';

  React.useEffect(() => {
    if (window.location.search) {
      const merged: Record<string, string> = { ...savedCourseParams };
      searchParams.forEach((v, k) => { if (v) merged[k] = v; });
      cloudStorage.setItem('sv_last_course_params', JSON.stringify(merged));
      window.history.replaceState(window.history.state, '', window.location.pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePersonaSelect = (personaId: string) => {
    const cId = searchParams.get('cId') || savedCourseParams.cId || '';
    const semId = searchParams.get('semId') || savedCourseParams.semId || '';
    if (cId && sId) {
      cloudStorage.setItem(`persona_${cId}_${semId}_${sId}`, personaId);
      // Fallback key format used in ClassSubjectSelection
      cloudStorage.setItem(`persona_${cId}_${sId}`, personaId);
    }
    // Also persist to credentials store so expert can see & override
    const username = cloudStorage.getItem('username') || '';
    if (username) setStudentPersona(username, personaId);

    const nextParams: Record<string, string> = {
      ...savedCourseParams,
      ...(cId ? { cId } : {}),
      ...(sId ? { sId } : {}),
      ...(className ? { className } : {}),
      ...(semesterName ? { semesterName } : {}),
      ...(subjectName ? { subjectName } : {}),
      persona: personaId,
    };
    cloudStorage.setItem('sv_last_course_params', JSON.stringify(nextParams));
    navigate('/chapters', { state: nextParams });
  };
  const handleBackToClass = () => navigate('/');

  const logout = () => {
    cloudStorage.removeItem('app_authenticated');
    cloudStorage.removeItem('app_role');
    cloudStorage.removeItem('questionnaire_completed');
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
          </div>
          <div className="sv-topbar-right">
            <button className="sv-logout-btn" onClick={logout}>
              Log Out
            </button>
            <button className="sv-profile-btn" onClick={() => navigate('/profile')}>
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Profile
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
