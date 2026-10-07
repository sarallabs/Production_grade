import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setStudentPersona } from '@/utils/credentialsStore';
import ResumePodcastToast from '@/components/ResumePodcastToast';
import {
  getCatalog,
  getManifest,
  type Catalog,
  type CatalogBoard,
  type CatalogClass,
  type CatalogSubject,
  type Subject,
} from '@/data/contentRepository';
import { getUniqueVisitedChaptersForSubject, getAnalytics } from '@/utils/analytics';
import { getVisibleBoardIds } from '@/pages/ConfigPage';
import './ClassSubjectSelection.css';

function SubjectIcon({ subjectId }: { subjectId: string }) {
  if (subjectId.includes('ento') || subjectId === 'ento_131') {
    return (
      <img
        src={`${import.meta.env.BASE_URL}subject-entomology-icon.png`}
        alt="Entomology"
        className="sv-card-book-img"
      />
    );
  }
  const common = { width: 28, height: 28, fill: 'none', stroke: 'currentColor', strokeWidth: 2 } as const;
  if (subjectId.includes('science') || subjectId.includes('biology') || subjectId.includes('chemistry')) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...common}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 4h8M10 4v5.2L4.8 18.1A2 2 0 0 0 6.5 21h11a2 2 0 0 0 1.7-2.9L14 9.2V4" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 15h8" />
      </svg>
    );
  }
  if (subjectId.includes('math') || subjectId.includes('financial')) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...common}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M8 3v18M16 3v18M4 15h16" />
      </svg>
    );
  }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...common}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.25v13m0-13C10.83 5.48 9.25 5 7.5 5S4.17 5.48 3 6.25v13C4.17 18.48 5.75 18 7.5 18s3.33.48 4.5 1.25m0-13C13.17 5.48 14.75 5 16.5 5S19.83 5.48 21 6.25v13C19.83 18.48 18.25 18 16.5 18s-3.33.48-4.5 1.25" />
    </svg>
  );
}

function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default function ClassSubjectSelection() {
  const navigate = useNavigate();
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
  const treeLogoSrc = selectedBoardId?.startsWith('neb') 
    ? `${import.meta.env.BASE_URL}neb-logo.png` 
    : `${import.meta.env.BASE_URL}brand-logo.png`;
  const [catalog, setCatalog] = useState<Catalog>({ version: 1, boards: [] });
  const [manifestSubjects, setManifestSubjects] = useState<Subject[]>([]);
  const [chapterCounts, setChapterCounts] = useState<Record<string, number>>({});
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

  useEffect(() => {
    getCatalog().then((nextCatalog) => {
      const visibleIds = getVisibleBoardIds();
      const filtered = visibleIds
        ? { ...nextCatalog, boards: nextCatalog.boards.filter((b) => visibleIds.includes(b.id)) }
        : nextCatalog;
      setCatalog(filtered);
      const firstBoard = filtered.boards[0];
      if (firstBoard && filtered.boards.length === 1) {
        setSelectedBoardId(firstBoard.id);
        if (firstBoard.id === 'angrau_university') {
          setSelectedClassId(firstBoard.classes[0]?.id ?? null);
        }
      }
    });

    getManifest().then((manifest) => {
      setManifestSubjects(manifest.subjects);
      setChapterCounts(
        Object.fromEntries(manifest.subjects.map((subject) => [subject.id, subject.chapters.length])),
      );
    });
  }, []);

  const selectedBoard = useMemo(
    () => catalog.boards.find((board) => board.id === selectedBoardId) ?? null,
    [catalog.boards, selectedBoardId],
  );

  const selectedClass = useMemo(
    () => {
      if (!selectedBoard) return null;
      // In ANGRAU we have only one course (B.Sc. Agriculture), take student straight to subjects
      if (selectedBoard.id === 'angrau_university') {
        return selectedBoard.classes[0] ?? null;
      }
      return selectedBoard.classes.find((klass) => klass.id === selectedClassId) ?? null;
    },
    [selectedBoard, selectedClassId],
  );

  const step = !selectedBoard ? 0 : !selectedClass ? 1 : 2;

  const handleBoardClick = (board: CatalogBoard) => {
    setSelectedBoardId(board.id);
    if (board.id === 'angrau_university') {
      setSelectedClassId(board.classes[0]?.id ?? null);
    } else {
      setSelectedClassId(null);
    }
  };

  const handleClassClick = (klass: CatalogClass) => {
    setSelectedClassId(klass.id);
  };

  const handleSubjectClick = (subject: CatalogSubject) => {
    if (!selectedBoard || !selectedClass) return;
    const params = new URLSearchParams({
      boardId: selectedBoard.id,
      boardName: selectedBoard.shortName || selectedBoard.name,
      cId: `${selectedBoard.id}_${selectedClass.id}`,
      className: `${selectedBoard.shortName || selectedBoard.name} ${selectedClass.name}`,
      sId: subject.id,
      subjectName: subject.name,
    });
    // Automatically apply the persona calculated from the Questionnaire
    const userPersona = (localStorage.getItem('user_persona') || 'beginner').toLowerCase();
    
    const cId = params.get('cId') || '';
    const sId = params.get('sId') || '';
    if (cId && sId) {
      localStorage.setItem(`persona_${cId}_${sId}`, userPersona);
    }
    
    const username = localStorage.getItem('username') || '';
    if (username) {
      setStudentPersona(username, userPersona);
    }

    params.set('persona', userPersona);
    navigate(`/chapters?${params.toString()}`);
  };

  const handleBackToBoard = () => {
    if (catalog.boards.length > 1) {
      setSelectedBoardId(null);
      setSelectedClassId(null);
    }
  };

  const handleBackToClass = () => {
    setSelectedClassId(null);
  };

  const logout = () => {
    localStorage.removeItem('app_authenticated');
    localStorage.removeItem('app_role');
    localStorage.removeItem('app_user_id');
    localStorage.removeItem('username');
    localStorage.removeItem('questionnaire_completed');
    navigate('/login', { replace: true });
  };

  return (
    <div className="sv-app sv-class-landing sv-app--no-rail">
      <ResumePodcastToast />
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
            {step > 0 && (
              <div className="sv-breadcrumb">
                <span className="sv-bc-sep">/</span>
                <span className="sv-bc-link" onClick={handleBackToBoard}>
                  {selectedBoard?.shortName || selectedBoard?.name}
                </span>
                {step > 1 && (
                  <>
                    {selectedBoard?.id !== 'angrau_university' && (
                      <>
                        <span className="sv-bc-sep">/</span>
                        <span className="sv-bc-link" onClick={handleBackToClass}>
                          {selectedClass?.name}
                        </span>
                      </>
                    )}
                    <span className="sv-bc-sep">/</span>
                    <span className="sv-bc-current">Subjects</span>
                  </>
                )}
              </div>
            )}
          </div>
          <div className="sv-topbar-right">
            <button className="sv-logout-btn" onClick={logout}>
              Log Out
            </button>
            <button className="sv-profile-btn" onClick={() => navigate('/profile')}>
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM12 14a7 7 0 0 0-7 7h14a7 7 0 0 0-7-7z" />
              </svg>
              Profile
            </button>
          </div>
        </header>

        <div className="sv-content">
          {step === 0 && (
            <div className="sv-hero sv-hero--class-only fade-in">
              <div className={`sv-class-grid ${catalog.boards.length === 1 ? 'sv-class-grid--solo' : ''}`}>
                {catalog.boards.map((board) => (
                  <div
                    key={board.id}
                    className="sv-class-card sv-class-card--large"
                    onClick={() => handleBoardClick(board)}
                  >
                    <span className="sv-class-name">{board.shortName || board.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 1 && selectedBoard && (
            <div className="sv-hero fade-in">
              <div className="sv-class-grid">
                {selectedBoard.classes.map((klass) => (
                  <div
                    key={klass.id}
                    className="sv-class-card sv-class-card--large"
                    onClick={() => handleClassClick(klass)}
                  >
                    <span className="sv-class-name">{klass.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 2 && selectedClass && (
            <div className={`sv-subjects ${selectedClass.subjects.length === 1 ? 'sv-subjects--single' : ''} fade-in`}>
              <div className="sv-subjects-header">
                <div>
                  <h2 className="sv-subjects-title">My Subjects</h2>
                </div>
              </div>

              <div className={`sv-subjects-grid ${selectedClass.subjects.length === 1 ? 'sv-subjects-grid--single' : ''}`}>
                {selectedClass.subjects.map((subject, idx) => {
                  const isEntomology = subject.id === 'ento_131' || subject.name.toLowerCase().includes('entomology');
                  const totalChapters = isEntomology
                    ? (chapterCounts[subject.id] ? Math.max(chapterCounts[subject.id], 4) : 4)
                    : (chapterCounts[subject.id] ?? 0);
                  const visited = getUniqueVisitedChaptersForSubject(subject.id);
                  const displayTotal = totalChapters > 0 ? totalChapters : (isEntomology ? 4 : 0);
                  const displayVisited = Math.min(visited, displayTotal > 0 ? displayTotal : visited);
                  const manifestSub = manifestSubjects.find(
                    (s) => s.id === subject.id || (isEntomology && (s.id === 'ento_131' || s.id.toLowerCase().includes('ento')))
                  );
                  const chaptersList = manifestSub?.chapters || [];

                  const analytics = getAnalytics();
                  const subjectVisits = (analytics.chapterVisits || []).filter(
                    (v) => v.subjectId === subject.id || (isEntomology && (v.subjectId || '').toLowerCase().includes('ento'))
                  );
                  const lastVisit = subjectVisits.length > 0 ? subjectVisits[subjectVisits.length - 1] : null;
                  const currentChNum = lastVisit?.chapterNumber || 1;

                  const currentChObj = chaptersList.find((c) => c.number === currentChNum) || chaptersList[currentChNum - 1] || chaptersList[0];
                  let rawChName = currentChObj?.title || currentChObj?.name || lastVisit?.chapterName || '';
                  if (!rawChName && isEntomology) {
                    const fallbackNames: Record<number, string> = {
                      1: 'Digestive System',
                      2: 'Metamorphosis',
                      3: 'Weathering',
                      4: 'Pollination',
                    };
                    rawChName = fallbackNames[currentChNum] || 'Digestive System';
                  } else if (!rawChName) {
                    rawChName = `Chapter ${currentChNum}`;
                  }
                  const cleanChName = rawChName.replace(/^chapter\s*\d+[\s:–-]*/i, '').trim() || rawChName;
                  const coverage = displayTotal > 0 ? Math.round((displayVisited / displayTotal) * 100) : 0;

                  return (
                    <div
                      key={subject.id}
                      className={`sv-subject-card ${isEntomology ? 'sv-subject-card--entomology' : ''}`}
                      style={{
                        '--card-gradient': 'linear-gradient(135deg, #2563eb, #10b981)',
                        '--card-glow': 'rgba(37, 99, 235, 0.14)',
                        animationDelay: `${idx * 0.07}s`,
                      } as React.CSSProperties}
                      onClick={() => handleSubjectClick(subject)}
                    >
                      <div className="sv-card-accent" />
                      <div className="sv-card-icon">
                        <SubjectIcon subjectId={subject.id} />
                      </div>
                      <div className="sv-card-body">
                        <h3 className="sv-card-title">
                          {subject.name === 'Characterization Techniques' ? 'Analytics' : subject.name}
                        </h3>
                        <div className="sv-progress-wrapper">
                          {displayTotal > 0 ? (
                            <>
                              <div className="sv-progress-segments">
                                {Array.from({ length: displayTotal }).map((_, i) => (
                                  <div
                                    key={i}
                                    className={`sv-progress-segment ${i < displayVisited ? 'filled' : ''}`}
                                  />
                                ))}
                              </div>
                              <div className="sv-progress-meta">
                                <span className="sv-badge sv-badge-progress">
                                  <span>{currentChNum} - {displayTotal} - {displayTotal === 1 ? 'Chapter' : 'Chapters'}</span>
                                </span>
                              </div>
                            </>
                          ) : (
                            <div className="sv-progress-meta">
                              <span className="sv-progress-count">Ready for content</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
