import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setStudentPersona } from '@/utils/credentialsStore';
import ResumePodcastToast from '@/components/ResumePodcastToast';
import {
  getCatalog,
  getManifest,
  getChapters,
  type Catalog,
  type CatalogBoard,
  type CatalogClass,
  type CatalogSubject,
  type Subject,
  type Manifest,
  type Chapter,
} from '@/data/contentRepository';
import { getVisitedChapterNumbersForSubject, getAnalytics } from '@/utils/analytics';
import { isChapterComplete, getCompletedTools } from '@/utils/guidedFlow';
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

function getShortChapterTitle(fullName: string, chNum: number): string {
  if (chNum === 1) return 'Digestive System';
  if (chNum === 2) return 'Metamorphosis';
  if (chNum === 3) return 'Weathering';
  if (chNum === 4) return 'Pollination';

  if (!fullName) return `Chapter ${chNum}`;
  const clean = fullName.replace(/^chapter\s*\d+[\s:–-]*/i, '').trim();
  const lower = clean.toLowerCase();
  if (lower.includes('digestive')) return 'Digestive System';
  if (lower.includes('morphology') || lower.includes('metamorphosis')) return 'Metamorphosis';
  if (lower.includes('weathering') || lower.includes('soil')) return 'Weathering';
  if (lower.includes('pollination') || lower.includes('floral')) return 'Pollination';

  const parts = clean.split('&')[0].trim().split(' ');
  if (parts.length > 2) {
    return parts.slice(0, 2).join(' ');
  }
  return clean.length > 22 ? clean.slice(0, 20) + '…' : clean;
}

function getChapterProgressStats(subjectId: string, chapterNumber: number) {
  const cleanId = (id?: string) => (id || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const targetSub = cleanId(subjectId);
  const completedFromGuided = getCompletedTools(subjectId, chapterNumber);
  const analyticsData = getAnalytics();
  const toolsFromEvents = (analyticsData.toolEvents || [])
    .filter((e) => {
      const sub = cleanId(e.subjectId);
      return (sub === targetSub || (targetSub.includes('ento') && sub.includes('ento'))) && e.chapterNumber === chapterNumber;
    })
    .map((e) => e.tool);

  const uniqueToolsDone = new Set([...completedFromGuided, ...toolsFromEvents]);
  const isVisited = (analyticsData.chapterVisits || []).some((v) => {
    const sub = cleanId(v.subjectId);
    return (sub === targetSub || (targetSub.includes('ento') && sub.includes('ento'))) && v.chapterNumber === chapterNumber;
  });

  const totalSessions = 6;
  const isFullyDone = isChapterComplete(subjectId, chapterNumber);
  const completedSessions = isFullyDone ? totalSessions : Math.min(uniqueToolsDone.size, totalSessions);
  const percent = isFullyDone 
    ? 100 
    : completedSessions > 0 
    ? Math.round((completedSessions / totalSessions) * 100) 
    : isVisited 
    ? 15 
    : 0;

  return {
    isFullyDone,
    isVisited,
    completedSessions,
    totalSessions,
    percent,
  };
}

export default function ClassSubjectSelection() {
  const navigate = useNavigate();
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
  const treeLogoSrc = selectedBoardId?.startsWith('neb') 
    ? `${import.meta.env.BASE_URL}neb-logo.png` 
    : `${import.meta.env.BASE_URL}brand-logo.png`;
  const [catalog, setCatalog] = useState<Catalog>({ version: 1, boards: [] });
  const [manifest, setManifest] = useState<Manifest | null>(null);
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

    getManifest().then((m) => {
      setManifest(m);
      setManifestSubjects(m.subjects);
      setChapterCounts(
        Object.fromEntries(m.subjects.map((subject) => [subject.id, subject.chapters.length])),
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

  const handleSubjectClick = (subject: CatalogSubject, targetChapter?: number) => {
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
    if (targetChapter) {
      params.set('chapter', targetChapter.toString());
    }
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
                  let chaptersList: Chapter[] = manifest ? getChapters(manifest, subject.id) : [];
                  if (chaptersList.length === 0 && isEntomology) {
                    chaptersList = [
                      { number: 1, name: 'Digestive System', dir: 'chapter_01', completed: [], resourceCount: 7 },
                      { number: 2, name: 'Metamorphosis', dir: 'chapter_02', completed: [], resourceCount: 6 },
                      { number: 3, name: 'Weathering', dir: 'chapter_03', completed: [], resourceCount: 7 },
                      { number: 4, name: 'Pollination', dir: 'chapter_04', completed: [], resourceCount: 7 },
                    ];
                  }

                  const totalChapters = chaptersList.length > 0 
                    ? chaptersList.length 
                    : (chapterCounts[subject.id] ?? (isEntomology ? 4 : 0));
                  
                  const chapterStatsList = chaptersList.map((ch) => getChapterProgressStats(subject.id, ch.number));
                  const totalCompletedChapters = chapterStatsList.filter((s) => s.isFullyDone || s.percent >= 100).length;
                  const activeChaptersCount = chapterStatsList.filter((s) => s.percent > 0).length;
                  const displayTotal = totalChapters;
                  const overallCoverage = displayTotal > 0
                    ? Math.round(chapterStatsList.reduce((acc, s) => acc + s.percent, 0) / displayTotal)
                    : 0;

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
                        <div className="sv-subject-head-row">
                          <div className="sv-subject-head-info">
                            <h3 className="sv-card-title">
                              {subject.name === 'Characterization Techniques' ? 'Analytics' : subject.name}
                            </h3>
                            <span className="sv-subject-subtitle">
                              ANGRAU B.Sc. Agriculture • {displayTotal} Core Chapters
                            </span>
                          </div>
                          {displayTotal > 0 && (
                            <div className="sv-course-progress-widget">
                              <div className="sv-progress-ring-wrap">
                                <svg className="sv-progress-ring" width="46" height="46" viewBox="0 0 46 46">
                                  <circle
                                    className="sv-progress-ring-bg"
                                    stroke="rgba(255, 255, 255, 0.15)"
                                    strokeWidth="4"
                                    fill="transparent"
                                    r="18"
                                    cx="23"
                                    cy="23"
                                  />
                                  <circle
                                    className="sv-progress-ring-fill"
                                    stroke="#E2B18E"
                                    strokeWidth="4"
                                    strokeDasharray={2 * Math.PI * 18}
                                    strokeDashoffset={2 * Math.PI * 18 * (1 - overallCoverage / 100)}
                                    strokeLinecap="round"
                                    fill="transparent"
                                    r="18"
                                    cx="23"
                                    cy="23"
                                  />
                                </svg>
                                <span className="sv-progress-ring-text">{overallCoverage}%</span>
                              </div>
                              <div className="sv-progress-widget-labels">
                                <span className="sv-progress-widget-title">Overall Progress</span>
                                <span className="sv-progress-widget-sub">
                                  {overallCoverage === 100
                                    ? '100% Completed'
                                    : overallCoverage > 0
                                    ? `${overallCoverage}% Completed`
                                    : '0% Completed'}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="sv-progress-wrapper">
                          {displayTotal > 0 ? (
                            <div className="sv-chapter-cards-grid" role="group" aria-label="Chapters">
                              {chaptersList.map((ch, chIdx) => {
                                const stats = chapterStatsList[chIdx] || getChapterProgressStats(subject.id, ch.number);
                                const shortTitle = getShortChapterTitle(ch.name, ch.number);
                                return (
                                  <button
                                    key={ch.number}
                                    type="button"
                                    className={`sv-chapter-card-item ${stats.isFullyDone ? 'is-completed' : stats.percent > 0 ? 'is-visited' : ''}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSubjectClick(subject, ch.number);
                                    }}
                                    title={`Directly open Chapter ${ch.number}: ${ch.name}`}
                                  >
                                    <div className="sv-ch-item-top">
                                      <span className="sv-ch-item-num">CHAPTER 0{ch.number}</span>
                                      <span className={`sv-ch-item-badge ${stats.isFullyDone ? 'is-done' : ''}`}>
                                        {stats.isFullyDone ? '✓ 100%' : `${stats.percent}%`}
                                      </span>
                                    </div>
                                    <span className="sv-ch-item-title">{shortTitle}</span>

                                    {/* Progress update below every chapter button */}
                                    <div className="sv-ch-progress-block">
                                      <div className="sv-ch-progress-track">
                                        <div
                                          className={`sv-ch-progress-bar-fill ${stats.isFullyDone ? 'bar-complete' : ''}`}
                                          style={{ width: `${stats.percent}%` }}
                                        />
                                      </div>
                                      <div className="sv-ch-progress-info">
                                        <span className="sv-ch-progress-text">
                                          {stats.isFullyDone
                                            ? 'Completed'
                                            : stats.percent > 0
                                            ? 'In Progress'
                                            : 'Not Started'}
                                        </span>
                                        <span className="sv-ch-progress-val">
                                          {stats.percent}%
                                        </span>
                                      </div>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
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
