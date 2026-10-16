import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { getManifest, getChapters, getSubject, type Chapter } from '@/data/contentRepository';
import { getAnalytics } from '@/utils/analytics';
import { getCompletedTools, isChapterComplete, snapToQuarter } from '@/utils/guidedFlow';
import { useTenant } from '@/tenant/TenantProvider';
import './ChapterCard.css';

const PUBADM_UR_ENABLED_COUNT = 1;

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
  const { tenantPath } = useTenant();
  const treeLogoSrc = subjectId?.startsWith('neb_')
    ? `${import.meta.env.BASE_URL}neb-logo.png`
    : `${import.meta.env.BASE_URL}brand-tree-cropped.png`;
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookOpen, setBookOpen] = useState(false);
  const [clickedChapter, setClickedChapter] = useState<number | null>(null);

  const initialChapterParam = searchParams.get('chapter');
  const initialChapterNum = initialChapterParam ? parseInt(initialChapterParam, 10) : null;
  const [flipIndex, setFlipIndex] = useState<number>(() => {
    return initialChapterNum && initialChapterNum > 0 ? initialChapterNum - 1 : 0;
  });
  const className   = searchParams.get('className')   || '';
  const sId         = subjectId || searchParams.get('sId')         || '';
  const [resolvedSubjectName, setResolvedSubjectName] = useState(searchParams.get('subjectName') || '');
  const lastChapterParamRef = React.useRef<string | null>(initialChapterParam);

  useEffect(() => {
    if (!sId) return;
    getManifest().then((m) => {
      const subject = getSubject(m, sId);
      const chList = getChapters(m, sId);
      setChapters(chList);
      setResolvedSubjectName(searchParams.get('subjectName') || subject?.name || sId);
      setLoading(false);

      const chParam = searchParams.get('chapter');
      if (chParam) {
        const chNum = parseInt(chParam, 10);
        const idx = chList.findIndex((c) => c.number === chNum);
        if (idx !== -1) {
          setFlipIndex(idx);
        }
      }
    });
  }, [sId, searchParams]);

  useEffect(() => {
    const chParam = searchParams.get('chapter');
    if (chParam && chParam !== lastChapterParamRef.current && chapters.length > 0) {
      lastChapterParamRef.current = chParam;
      const chNum = parseInt(chParam, 10);
      const idx = chapters.findIndex((c) => c.number === chNum);
      if (idx !== -1) {
        setFlipIndex(idx);
      }
    }
  }, [searchParams, chapters]);

  useEffect(() => {
    if (!loading) {
      const t = setTimeout(() => setBookOpen(true), 80);
      return () => clearTimeout(t);
    }
  }, [loading]);

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
    const params = new URLSearchParams(searchParams);
    if (sId) params.set('sId', sId);
    if (resolvedSubjectName && !params.get('subjectName')) params.set('subjectName', resolvedSubjectName);
    params.set('chapter', ch.number.toString());
    params.set('chapterName', toTitleCase(ch.name));
    params.delete('tool');
    navigate(tenantPath(`/study-table?${params.toString()}`));
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
              <span className="sv-bc-link" onClick={() => navigate(tenantPath('/'))}>{className || 'Class'}</span>
              <span className="sv-bc-sep">/</span>
              <span className="sv-bc-current">{resolvedSubjectName || 'Subject'}</span>
            </div>
          </div>
          <div className="sv-topbar-right">
            <button className="sv-logout-btn" onClick={() => navigate(tenantPath('/'))}>
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              Logout
            </button>
            <button className="sv-profile-btn" onClick={() => navigate(tenantPath('/profile'))}>
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
                  <div>
                    <h1 className="book-title">{resolvedSubjectName}</h1>
                  </div>
                </div>
              </div>

              {/* Chapters View (Middle / Hero Card View) */}
              {chapters.length > 0 && (() => {
                const flipCh = chapters[flipIndex];
                if (!flipCh) return null;

                const topicList = flipCh.topics || [];
                const topicsCount = topicList.length > 0 ? topicList.length : (flipCh.number * 2 + 6);

                const estMins = flipCh.estimatedMinutes ?? Math.round(topicsCount * 13);
                const estHours = Math.floor(estMins / 60);
                const estRemainingMins = estMins % 60;
                const estimatedTimeStr = estHours > 0
                  ? `${estHours}h ${estRemainingMins > 0 ? `${estRemainingMins}min` : ''}`.trim()
                  : `${estMins}min`;

                const cleanId = (id?: string) => (id || '').toLowerCase().replace(/[^a-z0-9]/g, '');
                const targetSub = cleanId(sId);

                const completedFromGuided = getCompletedTools(sId, flipCh.number);
                const analyticsData = getAnalytics();
                const toolsFromEvents = analyticsData.toolEvents
                  .filter((e) => {
                    const sub = cleanId(e.subjectId);
                    return sub === targetSub && e.chapterNumber === flipCh.number;
                  })
                  .map((e) => e.tool);

                const uniqueToolsDone = new Set([...completedFromGuided, ...toolsFromEvents]);

                const totalSessions = 6;
                const isFullyDone = isChapterComplete(sId, flipCh.number);
                const completedSessions = isFullyDone ? totalSessions : Math.min(uniqueToolsDone.size, totalSessions);
                const chapterPct = isFullyDone ? 100 : snapToQuarter((completedSessions / totalSessions) * 100);

                const cleanChapterName = flipCh.name.replace(/^chapter\s*\d+[\s:–-]*/i, '').trim() || flipCh.name;
                const lowerName = (flipCh.name || '').toLowerCase();
                const lowerSubName = (resolvedSubjectName || '').toLowerCase();
                const isDbms =
                  sId.toLowerCase().includes('dbms') ||
                  lowerSubName.includes('database') ||
                  lowerName.includes('database');
                const isDigestive =
                  !isDbms && (
                    lowerName.includes('digestive') ||
                    flipCh.number === 1 ||
                    flipIndex === 0
                  );
                const isMetamorphosis =
                  !isDbms && (
                    lowerName.includes('metamorphosis') ||
                    lowerName.includes('morphology') ||
                    flipCh.number === 2 ||
                    flipCh.number === 11 ||
                    flipIndex === 1
                  );
                const isWeathering =
                  !isDbms && (
                    lowerName.includes('weathering') ||
                    lowerName.includes('soil') ||
                    flipCh.number === 3 ||
                    flipIndex === 2
                  );
                const isPollination =
                  !isDbms && (
                    lowerName.includes('pollination') ||
                    lowerName.includes('floral') ||
                    flipCh.number === 4 ||
                    flipIndex === 3
                  );

                const fallbackHero = isDbms
                  ? 'chapter-dbms-hero.png'
                  : isDigestive
                  ? 'chapter-digestive-hero.png'
                  : isMetamorphosis
                  ? 'chapter-metamorphosis-hero.png'
                  : isWeathering
                  ? 'chapter-weathering-hero.png'
                  : isPollination
                  ? 'chapter-pollination-hero.png'
                  : 'chapter-entomology-hero.png';

                const rawHero = flipCh.heroImageUrl || fallbackHero;
                const heroImgSrc =
                  rawHero.startsWith('http://') || rawHero.startsWith('https://') || rawHero.startsWith('data:')
                    ? rawHero
                    : `${import.meta.env.BASE_URL}${rawHero.replace(/^\//, '')}`;

                return (
                  <div className="flip-mode-stack fade-in">
                    <div className="chapter-hero-nav-wrapper">
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
                        <div className="chapter-hero-img-wrap">
                          <img
                            src={heroImgSrc}
                            alt="Chapter Hero"
                            className="chapter-hero-img"
                          />
                        </div>

                        <div className="chapter-hero-sub">
                          Chapter {flipCh.number}
                        </div>

                        <h2 className="chapter-hero-name">
                          {toTitleCase(cleanChapterName)}
                        </h2>

                        <div className="chapter-stats-grid">
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

                        <div className="chapter-progress-box">
                          <div className="chapter-progress-labels chapter-progress-labels--center">
                            <span>{chapterPct}%</span>
                          </div>
                          <div className="chapter-progress-track chapter-progress-track--half">
                            <div
                              className="chapter-progress-fill"
                              style={{ width: `${chapterPct}%` }}
                            />
                          </div>
                        </div>
                      </div>

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
