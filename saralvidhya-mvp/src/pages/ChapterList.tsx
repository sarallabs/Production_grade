import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { getManifest, getChapters, getSubject, type Chapter } from '@/data/contentRepository';
import { getChapterToolCoveragePercent, getAnalytics } from '@/utils/analytics';
import { getCompletedTools, isChapterComplete } from '@/utils/guidedFlow';
import { getTopicsForChapter } from '@/data/chapterTopics';
import './ChapterCard.css';

const PUBADM_UR_ENABLED_COUNT = 1;

function SubjectHeaderIcon({ subjectId }: { subjectId: string }) {
  const id = (subjectId || '').toLowerCase();
  const common = { width: 36, height: 36, fill: 'none', stroke: 'currentColor', strokeWidth: 2 } as const;
  if (id.includes('ento') || id === 'ento_131') {
    return (
      <img
        src={`${import.meta.env.BASE_URL}subject-entomology-icon.png`}
        alt="Entomology"
        className="subject-header-illustration"
      />
    );
  }
  switch (id) {
    case 'english':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...common}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      );
    case 'telugu':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...common}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
        </svg>
      );
    case 'hindi':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...common}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      );
    case 'science':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...common}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      );
    case 'math':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...common}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      );
    case 'social':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...common}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 002 2h2a2.5 2.5 0 002.5-2.5V14a2 2 0 012-2h.027M13.757 5.107A4.477 4.477 0 0012 5.05c-.179.01-.354.03-.523.062M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    default:
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...common}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      );
  }
}

export function toTitleCase(str: string): string {
  if (!str) return str;
  const smallWords = new Set(['of', 'and', 'the', 'in', 'on', 'at', 'to', 'for', 'a', 'an', 'with', 'is', 'by']);
  return str.toLowerCase().split(' ').map((word, i, arr) => {
    if (i !== 0 && i !== arr.length - 1 && smallWords.has(word)) {
      return word;
    }
    return word.charAt(0).toUpperCase() + word.slice(1);
  }).join(' ');
}

export default function ChapterList() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { subjectId } = useParams<{ subjectId: string }>();
  const treeLogoSrc = subjectId?.startsWith('neb_') 
    ? `${import.meta.env.BASE_URL}neb-logo.png` 
    : `${import.meta.env.BASE_URL}brand-logo.png`;
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookOpen, setBookOpen] = useState(false);
  const [clickedChapter, setClickedChapter] = useState<number | null>(null);
  
  const [flipIndex, setFlipIndex] = useState(0);
  const className   = searchParams.get('className')   || '';
  const sId         = subjectId || searchParams.get('sId')         || '';
  const [resolvedSubjectName, setResolvedSubjectName] = useState(searchParams.get('subjectName') || '');

  useEffect(() => {
    if (!sId) return;
    getManifest().then((m) => {
      const subject = getSubject(m, sId);
      setChapters(getChapters(m, sId));
      setResolvedSubjectName(searchParams.get('subjectName') || subject?.name || sId);
      setLoading(false);
    });
  }, [sId, searchParams]);

  // Trigger the book-open animation shortly after data loads
  useEffect(() => {
    if (!loading) {
      const t = setTimeout(() => setBookOpen(true), 80);
      return () => clearTimeout(t);
    }
  }, [loading]);

  // Keyboard navigation for chapters
  useEffect(() => {
    if (chapters.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (activeEl && (
        activeEl.tagName === 'INPUT' || 
        activeEl.tagName === 'TEXTAREA' || 
        activeEl.getAttribute('contenteditable') === 'true'
      )) {
        return;
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        setFlipIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        setFlipIndex((prev) => Math.min(chapters.length - 1, prev + 1));
      } else if (e.key === 'Enter') {
        const currentCh = chapters[flipIndex];
        if (currentCh && !isDisabled(currentCh)) {
          handleChapterClick(currentCh);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [chapters, flipIndex]);

  const isDisabled = (ch: Chapter) =>
    sId === 'pubadm_ur' ? ch.number > PUBADM_UR_ENABLED_COUNT : false;

  const handleChapterClick = (ch: Chapter) => {
    if (isDisabled(ch)) return;
    setClickedChapter(ch.number);
    setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      // The subject lives in the route path (/subjects/:subjectId), not the query string
      if (sId) params.set('sId', sId);
      if (resolvedSubjectName && !params.get('subjectName')) params.set('subjectName', resolvedSubjectName);
      params.set('chapter', ch.number.toString());
      params.set('chapterName', toTitleCase(ch.name));
      params.delete('tool');
      navigate(`/study-table?${params.toString()}`);
    }, 200);
  };

  return (
    <div className="sv-app book-app sv-app--no-rail">

      <main className="sv-main book-main">

        {/* Frosted topbar */}
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
              <span className="sv-bc-link" onClick={() => navigate('/')}>{className || 'Class'}</span>
              <span className="sv-bc-sep">/</span>
              <span className="sv-bc-current">{resolvedSubjectName || 'Subject'}</span>
            </div>
          </div>
          <div className="sv-topbar-right">
            <button className="sv-logout-btn" onClick={() => navigate('/')}>
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              Logout
            </button>
            <button className="sv-profile-btn" onClick={() => navigate('/profile')}>
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Profile
            </button>
          </div>
        </header>

        {/* Book page content */}
        <div className="book-content">

          {loading ? (
            <div className="book-loading">
              <div className="book-loading-icon">
                <div className="book-loading-left"/>
                <div className="book-loading-spine"/>
                <div className="book-loading-right"/>
              </div>
              <p className="book-loading-text">Opening your book…</p>
            </div>
          ) : (
            <>
              {/* Page header */}
              <div className={`book-header ${bookOpen ? 'book-header--visible' : ''}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%' }}>
                <div className="book-header-left" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  {(sId.toLowerCase().includes('ento') || sId === 'ento_131' || resolvedSubjectName.toLowerCase().includes('ento')) ? (
                    <div className="subject-header-img-wrap">
                      <SubjectHeaderIcon subjectId={sId} />
                    </div>
                  ) : (
                    <div className="book-icon-deco book-icon-deco--subject">
                      <SubjectHeaderIcon subjectId={sId} />
                    </div>
                  )}
                  <div>
                    <h1 className="book-title">{resolvedSubjectName}</h1>
                  </div>
                </div>
              </div>

              {/* Chapters View (Middle / Hero Card View) */}
              {chapters.length > 0 && (() => {
                const flipCh = chapters[flipIndex];
                if (!flipCh) return null;

                const topicList = getTopicsForChapter(sId, flipCh.number);
                const topicsCount = topicList.length > 0 ? topicList.length : (flipCh ? (flipCh.number * 2 + 6) : 12);
                
                // Dynamic estimated time based on actual topic count (approx 12-14 mins per topic)
                const estMins = Math.round(topicsCount * 13);
                const estHours = Math.floor(estMins / 60);
                const estRemainingMins = estMins % 60;
                const estimatedTimeStr = estHours > 0 
                  ? `${estHours}h ${estRemainingMins > 0 ? `${estRemainingMins}min` : ''}`.trim()
                  : `${estMins}min`;

                // DB-driven real user progress in this chapter
                const cleanId = (id?: string) => (id || '').toLowerCase().replace(/[^a-z0-9]/g, '');
                const targetSub = cleanId(sId);

                const completedFromGuided = getCompletedTools(sId, flipCh.number);
                const analyticsData = getAnalytics();
                const toolsFromEvents = analyticsData.toolEvents
                  .filter((e) => {
                    const sub = cleanId(e.subjectId);
                    return (sub === targetSub || (targetSub.includes('ento') && sub.includes('ento'))) && e.chapterNumber === flipCh.number;
                  })
                  .map((e) => e.tool);

                const uniqueToolsDone = new Set([...completedFromGuided, ...toolsFromEvents]);

                // Total standard learning sessions/tools per chapter in StudyTable
                const totalSessions = 6;
                const isFullyDone = isChapterComplete(sId, flipCh.number);
                const completedSessions = isFullyDone ? totalSessions : Math.min(uniqueToolsDone.size, totalSessions);
                const chapterPct = Math.round((completedSessions / totalSessions) * 100);

                // Clean real chapter name without duplicate "Chapter X" prefix
                const cleanChapterName = flipCh.name.replace(/^chapter\s*\d+[\s:–-]*/i, '').trim() || flipCh.name;
                const lowerName = cleanChapterName.toLowerCase();
                const isDigestive =
                  lowerName.includes('digestive') ||
                  flipCh.number === 1 ||
                  flipIndex === 0;
                const isMetamorphosis =
                  lowerName.includes('metamorphosis') ||
                  lowerName.includes('morphology') ||
                  flipCh.number === 2 ||
                  flipCh.number === 11 ||
                  flipIndex === 1;
                const isPollination =
                  lowerName.includes('pollination') ||
                  lowerName.includes('floral') ||
                  flipCh.number === 3 ||
                  flipIndex === 2;
                const isWeathering =
                  lowerName.includes('weathering') ||
                  lowerName.includes('soil') ||
                  flipCh.number === 4 ||
                  flipIndex === 3;

                const heroImgSrc = isDigestive
                  ? `${import.meta.env.BASE_URL}chapter-digestive-hero.png`
                  : isMetamorphosis
                  ? `${import.meta.env.BASE_URL}chapter-metamorphosis-hero.png`
                  : isPollination
                  ? `${import.meta.env.BASE_URL}chapter-pollination-hero.png`
                  : isWeathering
                  ? `${import.meta.env.BASE_URL}chapter-weathering-hero.png`
                  : `${import.meta.env.BASE_URL}chapter-entomology-hero.png`;

                return (
                  <div className="flip-mode-stack fade-in">
                    <div className="chapter-hero-nav-wrapper">
                      {/* Left Navigation Arrow */}
                      <button
                        className="chapter-nav-btn chapter-nav-btn--prev"
                        disabled={flipIndex === 0}
                        onClick={() => setFlipIndex((prev) => Math.max(0, prev - 1))}
                        title="Previous Chapter"
                        aria-label="Previous Chapter"
                      >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="15 18 9 12 15 6" />
                        </svg>
                      </button>

                      {/* Main Dynamic Chapter Card (Clickable) */}
                      <div
                        className={`chapter-hero-card ${clickedChapter === flipCh.number ? 'chapter-hero-card--opening' : ''} ${isDisabled(flipCh) ? 'chapter-hero-card--disabled' : ''}`}
                        key={`ch-${flipCh.number}`}
                        onClick={() => handleChapterClick(flipCh)}
                        role="button"
                        tabIndex={isDisabled(flipCh) ? -1 : 0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleChapterClick(flipCh);
                          }
                        }}
                        title={isDisabled(flipCh) ? `Chapter ${flipCh.number} is locked` : `Open Chapter ${flipCh.number}: ${toTitleCase(cleanChapterName)}`}
                      >
                        {/* Hero Illustration */}
                        <div className="chapter-hero-img-wrap">
                          <img
                            src={heroImgSrc}
                            alt="Chapter Hero"
                            className="chapter-hero-img"
                          />
                        </div>

                        {/* Chapter Subtitle (Dynamic: Chapter 1, 2, 3, etc.) */}
                        <div className="chapter-hero-sub">
                          Chapter {flipCh.number}
                        </div>

                        {/* Chapter Name (Real Chapter Name) */}
                        <h2 className="chapter-hero-name">
                          {toTitleCase(cleanChapterName)}
                        </h2>

                        {/* 2 Dynamic Metric Cards (Topics & Estimated Time - Compact Squares) */}
                        <div className="chapter-stats-grid">
                          {/* Card 1: Topics */}
                          <div className="chapter-stat-item chapter-stat-item--topics">
                            <div className="chapter-stat-icon-circle">
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                                <line x1="16" y1="13" x2="8" y2="13" />
                                <line x1="16" y1="17" x2="8" y2="17" />
                                <polyline points="10 9 9 9 8 9" />
                              </svg>
                            </div>
                            <div className="chapter-stat-val">{topicsCount}</div>
                            <div className="chapter-stat-label">Topics</div>
                          </div>

                          {/* Card 2: Estimated Time */}
                          <div className="chapter-stat-item chapter-stat-item--time">
                            <div className="chapter-stat-icon-circle">
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                              </svg>
                            </div>
                            <div className="chapter-stat-val">{estimatedTimeStr}</div>
                            <div className="chapter-stat-label">Estimated time</div>
                          </div>
                        </div>

                        {/* Progress Section */}
                        <div className="chapter-progress-box">
                          <div className="chapter-progress-labels">
                            <span>Your progress</span>
                            <span>{chapterPct}%</span>
                          </div>
                          <div className="chapter-progress-track">
                            <div
                              className="chapter-progress-fill"
                              style={{ width: `${chapterPct}%` }}
                            />
                          </div>
                          <div className="chapter-progress-action-row">
                            <span className="chapter-sessions-subtext">
                              {completedSessions} out of {totalSessions} sessions completed
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right Navigation Arrow */}
                      <button
                        className="chapter-nav-btn chapter-nav-btn--next"
                        disabled={flipIndex === chapters.length - 1}
                        onClick={() => setFlipIndex((prev) => Math.min(chapters.length - 1, prev + 1))}
                        title="Next Chapter"
                        aria-label="Next Chapter"
                      >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })()}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
