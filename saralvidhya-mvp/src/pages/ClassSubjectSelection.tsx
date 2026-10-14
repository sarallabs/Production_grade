import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setStudentPersona } from '@/utils/credentialsStore';
import ResumePodcastToast from '@/components/ResumePodcastToast';
import {
  getCatalog,
  getManifest,
  getChapters,
  getVisibleBoardIds,
  getRegistryTenantId,
  type Catalog,
  type CatalogBoard,
  type CatalogClass,
  type CatalogSubject,
  type Subject,
  type Manifest,
  type Chapter,
} from '@/data/contentRepository';
import { getVisitedChapterNumbersForSubject, getAnalytics } from '@/utils/analytics';
import { isChapterComplete, getCompletedTools, snapToQuarter } from '@/utils/guidedFlow';
import { useTenant } from '@/tenant/TenantProvider';
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
  if (subjectId.includes('dbms') || subjectId === 'dbms' || subjectId.includes('database')) {
    return (
      <img
        src={`${import.meta.env.BASE_URL}subject-dbms-icon.png`}
        alt="Database Management Systems"
        className="sv-card-book-img sv-card-book-img--dbms"
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
  if (fullName && (fullName.toLowerCase().includes('database') || fullName.toLowerCase().includes('dbms') || fullName.toLowerCase().includes('relational'))) {
    return 'Database Concepts';
  }
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
  const isCompleteByStorage = isChapterComplete(subjectId, chapterNumber);
  const rawCompletedSessions = Math.min(uniqueToolsDone.size, totalSessions);
  const rawPercent = rawCompletedSessions > 0
    ? Math.round((rawCompletedSessions / totalSessions) * 100)
    : isVisited
    ? 15
    : 0;

  const isFullyDone = isCompleteByStorage || rawPercent >= 100;
  const completedSessions = isFullyDone ? totalSessions : rawCompletedSessions;
  const percent = isFullyDone ? 100 : rawPercent;

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
  const { tenantId, tenantPath } = useTenant();
  const activeTenantId = tenantId || getRegistryTenantId();

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
      let boards = nextCatalog.boards;
      if (activeTenantId) {
        boards = boards.filter(
          (b) => b.id === activeTenantId || b.id === `${activeTenantId}_university` || (activeTenantId === 'angrau' && b.id === 'angrau_university')
        );
      } else {
        const visibleIds = getVisibleBoardIds();
        if (visibleIds && visibleIds.length > 0) {
          boards = boards.filter((b) => visibleIds.includes(b.id));
        }
      }

      const filtered = { ...nextCatalog, boards };
      setCatalog(filtered);
      const firstBoard = filtered.boards[0];
      if (firstBoard) {
        // Auto-select the board and class immediately for tenant-specific or single-board sessions
        if (filtered.boards.length === 1 || activeTenantId) {
          setSelectedBoardId(firstBoard.id);
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
  }, [activeTenantId]);

  const selectedBoard = useMemo(
    () => catalog.boards.find((board) => board.id === selectedBoardId) ?? null,
    [catalog.boards, selectedBoardId],
  );

  const selectedClass = useMemo(
    () => {
      if (!selectedBoard) return null;
      // In single-tenant or single-class sessions, take student straight to subjects
      if (
        selectedBoard.id === 'angrau_university' ||
        selectedBoard.id === 'mlrit' ||
        selectedBoard.classes.length === 1 ||
        !!activeTenantId
      ) {
        return selectedBoard.classes[0] ?? null;
      }
      return selectedBoard.classes.find((klass) => klass.id === selectedClassId) ?? null;
    },
    [selectedBoard, selectedClassId, activeTenantId],
  );

  const step = !selectedBoard ? 0 : !selectedClass ? 1 : 2;

  const handleBoardClick = (board: CatalogBoard) => {
    setSelectedBoardId(board.id);
    if (board.id === 'angrau_university' || board.id === 'mlrit' || board.classes.length === 1) {
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
    navigate(tenantPath(`/chapters?${params.toString()}`));
  };

  const handleBackToBoard = () => {
    if (!activeTenantId && catalog.boards.length > 1) {
      setSelectedBoardId(null);
      setSelectedClassId(null);
    }
  };

  const handleBackToClass = () => {
    if (!activeTenantId) {
      setSelectedClassId(null);
    }
  };

  const logout = () => {
    localStorage.removeItem('app_authenticated');
    localStorage.removeItem('app_role');
    localStorage.removeItem('app_user_id');
    localStorage.removeItem('username');
    localStorage.removeItem('questionnaire_completed');
    sessionStorage.removeItem('sv_video_open_counts');
    if (activeTenantId) {
      localStorage.removeItem(`sv_session_${activeTenantId}`);
      navigate(`/${activeTenantId}/login`, { replace: true });
    } else {
      navigate('/login', { replace: true });
    }
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
                {activeTenantId ? (
                  <span className="sv-bc-current">{selectedBoard?.shortName || selectedBoard?.name}</span>
                ) : (
                  <span className="sv-bc-link" onClick={handleBackToBoard}>
                    {selectedBoard?.shortName || selectedBoard?.name}
                  </span>
                )}
                {step > 1 && (
                  <>
                    {!activeTenantId && selectedBoard?.id !== 'angrau_university' && selectedBoard?.id !== 'mlrit' && (
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
          <div className="sv-topbar-right" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {/* Log Out Button (Red circular outline with soft red tint) */}
            <button
              type="button"
              onClick={logout}
              title="Log Out"
              aria-label="Log Out"
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1.5px solid #EF4444",
                background: "#FEF2F2",
                color: "#EF4444",
                cursor: "pointer",
                flexShrink: 0,
                boxShadow: "0 1px 4px rgba(239, 68, 68, 0.12)",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "#FEE2E2";
                (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.08)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "#FEF2F2";
                (e.currentTarget as HTMLButtonElement).style.transform = "none";
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 5H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h8" />
                <polyline points="15 8 19 12 15 16" />
                <line x1="9" y1="12" x2="19" y2="12" />
              </svg>
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
                  let chaptersList: Chapter[] = manifest ? getChapters(manifest, subject.id) : [];
                  if (chaptersList.length === 0 && (subject.id === 'ento_131' || subject.name.toLowerCase().includes('entomology'))) {
                    chaptersList = [
                      { number: 1, name: 'Digestive System', dir: 'chapter_01', completed: [], resourceCount: 7 },
                      { number: 2, name: 'Metamorphosis', dir: 'chapter_02', completed: [], resourceCount: 6 },
                      { number: 3, name: 'Weathering', dir: 'chapter_03', completed: [], resourceCount: 7 },
                      { number: 4, name: 'Pollination', dir: 'chapter_04', completed: [], resourceCount: 7 },
                    ];
                  } else if (chaptersList.length === 0 && (subject.id === 'dbms' || subject.id.includes('dbms'))) {
                    chaptersList = [
                      { number: 1, name: 'Database System Concepts, ER Model & Relational Design', dir: 'chapter_01', completed: [], resourceCount: 12 },
                    ];
                  }

                  const totalChapters = chaptersList.length > 0 
                    ? chaptersList.length 
                    : (chapterCounts[subject.id] ?? 0);
                  
                  const chapterStatsList = chaptersList.map((ch) => getChapterProgressStats(subject.id, ch.number));
                  const totalCompletedChapters = chapterStatsList.filter((s) => s.isFullyDone || s.percent >= 100).length;
                  const activeChaptersCount = chapterStatsList.filter((s) => s.percent > 0).length;
                  const displayTotal = totalChapters;
                  const overallCoverage = displayTotal > 0
                    ? snapToQuarter(chapterStatsList.reduce((acc, s) => acc + s.percent, 0) / displayTotal)
                    : 0;

                  const isRichSubjectCard = chaptersList.length > 0;

                  return (
                    <div
                      key={subject.id}
                      className={`sv-subject-card ${isRichSubjectCard ? 'sv-subject-card--entomology' : ''}`}
                      style={{
                        '--card-gradient': 'linear-gradient(135deg, #2563eb, #10b981)',
                        '--card-glow': 'rgba(37, 99, 235, 0.14)',
                        animationDelay: `${idx * 0.07}s`,
                      } as React.CSSProperties}
                      onClick={() => handleSubjectClick(subject)}
                    >
                      <div className="sv-card-icon">
                        <SubjectIcon subjectId={subject.id} />
                      </div>
                      <div className="sv-card-body">
                        <div className="sv-subject-head-row">
                          <div className="sv-subject-head-info">
                            <h3 className="sv-card-title">
                              {subject.name}
                            </h3>
                            {(() => {
                              const norm = (subject.id + ' ' + subject.name).toLowerCase();
                              const sub = norm.includes('ento')
                                ? 'B.Sc Agriculture'
                                : (norm.includes('dbms') || norm.includes('database'))
                                ? 'B.Tech CSE'
                                : norm.includes('physics')
                                ? 'B.Tech'
                                : (norm.includes('management') || norm.includes('marketing'))
                                ? 'MBA'
                                : '';

                              return sub ? (
                                <span className="sv-subject-subtitle">
                                  {sub}
                                </span>
                              ) : null;
                            })()}
                          </div>

                          {/* Top-Right Progress Donut (shown for standard subjects, hidden on rich cards to match Figma) */}
                          {displayTotal > 0 && !isRichSubjectCard && (
                            <div className="sv-course-progress-widget">
                              <div className="sv-progress-ring-wrap" title={`Overall Progress: ${overallCoverage}%`}>
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
                            </div>
                          )}
                        </div>

                        <div className="sv-progress-wrapper">
                          {displayTotal > 0 ? (
                            <div className="sv-chapter-icons-row" role="group" aria-label="Chapters">
                              {chaptersList.map((ch, chIdx) => {
                                const rawStats = chapterStatsList[chIdx] || getChapterProgressStats(subject.id, ch.number);
                                const isDone = rawStats.isFullyDone || rawStats.percent >= 100;
                                const stats = {
                                  ...rawStats,
                                  isFullyDone: isDone,
                                  percent: isDone ? 100 : rawStats.percent,
                                };
                                const formattedTitle = toTitleCase(ch.name);

                                // Checkmark color matching screenshot:
                                // 100%: Green (#22c55e)
                                // In-progress (> 0%): Blue (#38bdf8)
                                // 0%: Orange (#f97316)
                                const tickColor = stats.isFullyDone
                                  ? '#22c55e'
                                  : stats.percent > 0
                                  ? '#38bdf8'
                                  : '#f97316';

                                return (
                                  <div key={ch.number} className="sv-ch-circle-group">
                                    <span
                                      className="sv-ch-circle-tick"
                                      style={{ color: tickColor }}
                                      aria-hidden="true"
                                    >
                                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12" />
                                      </svg>
                                    </span>
                                    <button
                                      type="button"
                                      className={`sv-ch-circle-btn ${stats.isFullyDone ? 'is-completed' : stats.percent > 0 ? 'is-visited' : ''}`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleSubjectClick(subject, ch.number);
                                      }}
                                      title={formattedTitle}
                                      aria-label={`Chapter ${ch.number}: ${formattedTitle}`}
                                    >
                                      <span className="sv-ch-circle-num">{ch.number}</span>
                                      <div className="sv-ch-tooltip" role="tooltip">
                                        {formattedTitle}
                                      </div>
                                    </button>
                                    <div className="sv-ch-circle-percent">
                                      <span>{stats.percent}%</span>
                                    </div>
                                  </div>
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
