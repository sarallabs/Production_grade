import React, { useState, useEffect, useMemo, useRef, startTransition } from 'react';
import ReadingHighlightView from './ReadingHighlightView';
import QuickCheckModal from './QuickCheckModal';
import {
  getSectionizedReadData,
  getCachedSectionizedReadDataSync,
  type SectionizedChapterData,
} from '@/data/sectionizedReadService';
import type { DifficultyLevel } from '@/data/manifestService';
import { cloudStorage } from '@/context/CloudStateContext';

interface SectionizedReadViewProps {
  subjectId: string;
  chapterNumber: number;
  persona: DifficultyLevel;
  track?: 'quick' | 'detailed';
  onPersonaChange?: (lvl: DifficultyLevel) => void;
  isPurpleTheme?: boolean;
  onLoadedContent?: (text: string) => void;
  targetSectionIndex?: number | null;
  dbDurationMinutes?: number;
  readingHighlight?: {
    active: boolean;
    startWord: number;
    endWord: number;
  };
}

function SectionizedReadViewInner({
  subjectId,
  chapterNumber,
  persona,
  track = 'quick',
  isPurpleTheme = true,
  onLoadedContent,
  targetSectionIndex,
  readingHighlight,
  dbDurationMinutes,
}: SectionizedReadViewProps) {
  const initialCache = getCachedSectionizedReadDataSync(subjectId, chapterNumber, track, persona);
  const [data, setData] = useState<SectionizedChapterData | null>(initialCache);
  const [loading, setLoading] = useState(!initialCache);
  const [renderedCount, setRenderedCount] = useState<number>(99);
  const [activeVisibleIndex, setActiveVisibleIndex] = useState(0);
  const [activeQcIndex, setActiveQcIndex] = useState<number | null>(null);
  const [completedSections, setCompletedSections] = useState<Set<number>>(new Set());
  const [completedQuickChecks, setCompletedQuickChecks] = useState<Set<number>>(new Set());
  const [qcAnswers, setQcAnswers] = useState<Record<string, string>>({});

  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const quickCheckRefs = useRef<(HTMLDivElement | null)[]>([]);
  const isAutoScrollingRef = useRef(false);
  const onLoadedContentRef = useRef(onLoadedContent);

  useEffect(() => {
    onLoadedContentRef.current = onLoadedContent;
  });

  // Storage keys for persisting reading progress and answered quick checks separately (synced to PostgreSQL via cloudStorage)
  const storageKey = `sv_read_progress_${subjectId}_${chapterNumber}_${persona}_${track}`;
  const chapterStorageKey = `sv_read_progress_${subjectId}_${chapterNumber}`;
  const qcStorageKey = `sv_qc_done_${subjectId}_${chapterNumber}_${persona}_${track}`;
  const chapterQcStorageKey = `sv_qc_done_${subjectId}_${chapterNumber}`;
  const qcAnswersStorageKey = `sv_qc_answers_${subjectId}_${chapterNumber}_${persona}_${track}`;
  const chapterPctStorageKey = `sv_chapter_read_pct_${subjectId}_${chapterNumber}`;

  useEffect(() => {
    const syncFromCloud = () => {
      try {
        const saved = cloudStorage.getItem(storageKey) || cloudStorage.getItem(chapterStorageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setCompletedSections(new Set<number>(parsed));
          } else {
            setCompletedSections((prev) => (prev.size === 0 ? prev : new Set()));
          }
        } else {
          setCompletedSections((prev) => (prev.size === 0 ? prev : new Set()));
        }
      } catch {
        setCompletedSections((prev) => (prev.size === 0 ? prev : new Set()));
      }

      try {
        const savedQc = cloudStorage.getItem(qcStorageKey) || cloudStorage.getItem(chapterQcStorageKey);
        if (savedQc) {
          const parsedQc = JSON.parse(savedQc);
          if (Array.isArray(parsedQc) && parsedQc.length > 0) {
            setCompletedQuickChecks(new Set<number>(parsedQc));
          } else {
            setCompletedQuickChecks((prev) => (prev.size === 0 ? prev : new Set()));
          }
        } else {
          setCompletedQuickChecks((prev) => (prev.size === 0 ? prev : new Set()));
        }
      } catch {
        setCompletedQuickChecks((prev) => (prev.size === 0 ? prev : new Set()));
      }

      try {
        const savedAnswers = cloudStorage.getItem(qcAnswersStorageKey);
        if (savedAnswers) {
          const parsedAnswers = JSON.parse(savedAnswers);
          if (parsedAnswers && typeof parsedAnswers === 'object') {
            setQcAnswers(parsedAnswers);
          } else {
            setQcAnswers((prev) => (Object.keys(prev).length === 0 ? prev : {}));
          }
        } else {
          setQcAnswers((prev) => (Object.keys(prev).length === 0 ? prev : {}));
        }
      } catch {
        setQcAnswers((prev) => (Object.keys(prev).length === 0 ? prev : {}));
      }
    };

    syncFromCloud();
    const unsubscribe = cloudStorage.subscribe(syncFromCloud);
    return () => {
      unsubscribe();
    };
  }, [storageKey, chapterStorageKey, qcStorageKey, chapterQcStorageKey, qcAnswersStorageKey]);

  useEffect(() => {
    let isMounted = true;
    const cached = getCachedSectionizedReadDataSync(subjectId, chapterNumber, track, persona);
    if (cached) {
      setRenderedCount(cached.sections?.length || 99);
      setData(cached);
      setLoading(false);
      if (cached.sections && onLoadedContentRef.current) {
        const fullText = cached.sections.map((s) => s.content).join('\n\n---\n\n');
        onLoadedContentRef.current(fullText);
      }
      return;
    }

    setLoading(true);

    getSectionizedReadData(subjectId, chapterNumber, track, persona)
      .then((res) => {
        if (!isMounted) return;
        setRenderedCount(res?.sections?.length || 99);
        setData(res);
        setLoading(false);

        // Notify parent with concatenated markdown so ReadAloud gets accurate duration
        if (res?.sections && onLoadedContentRef.current) {
          const fullText = res.sections.map((s) => s.content).join('\n\n---\n\n');
          onLoadedContentRef.current(fullText);
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setData(null);
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [subjectId, chapterNumber, track, persona]);

  const sections = useMemo(() => data?.sections || [], [data]);
  const totalSections = sections.length;

  // Progressively mount below-the-fold sections 1 at a time across idle/animation frames
  // so initial paint and persona switches stay under 30ms (eliminating Long Tasks / TBT / INP)
  useEffect(() => {
    if (loading || totalSections === 0) return;
    if (readingHighlight?.active && renderedCount < totalSections) {
      setRenderedCount(totalSections);
      return;
    }
    if (renderedCount >= totalSections) return;

    const timer = setTimeout(() => {
      startTransition(() => {
        setRenderedCount((prev) => Math.min(totalSections, prev + 1));
      });
    }, 32);

    return () => clearTimeout(timer);
  }, [loading, totalSections, renderedCount, readingHighlight?.active]);

  // Once all sections of the active persona have mounted, pre-warm the other personas in idle time
  useEffect(() => {
    if (loading || totalSections === 0 || renderedCount < totalSections) return;
    const otherPersonas: DifficultyLevel[] = (['beginner', 'intermediate', 'advanced'] as DifficultyLevel[]).filter(
      (p) => p !== persona
    );
    const timer = setTimeout(() => {
      otherPersonas.forEach((p, idx) => {
        setTimeout(() => {
          if (!getCachedSectionizedReadDataSync(subjectId, chapterNumber, track, p)) {
            getSectionizedReadData(subjectId, chapterNumber, track, p).catch(() => {});
          }
        }, idx * 450);
      });
    }, 900);
    return () => clearTimeout(timer);
  }, [loading, totalSections, renderedCount, subjectId, chapterNumber, track, persona]);

  // Auto-scroll directly to target section from podcasts or external tool navigation
  useEffect(() => {
    if (loading || !sections.length) return;
    const urlParams = new URLSearchParams(window.location.search);
    const secParam = urlParams.get('section');
    const target = (targetSectionIndex !== undefined && targetSectionIndex !== null)
      ? targetSectionIndex
      : (secParam ? parseInt(secParam, 10) : null);

    if (target !== null && target >= 0) {
      const idx = sections.findIndex(s => s.sectionNumber === target);
      const scrollIdx = idx >= 0 ? idx : target;
      if (scrollIdx >= renderedCount) {
        setRenderedCount(Math.min(sections.length, scrollIdx + 1));
      }
      const timer = setTimeout(() => {
        handleScrollToSection(scrollIdx);
        const el = sectionRefs.current[scrollIdx];
        if (el) {
          el.classList.add('heading-highlight-flash');
          setTimeout(() => el.classList.remove('heading-highlight-flash'), 2500);
        }
      }, 40);
      return () => clearTimeout(timer);
    }
  }, [loading, sections, targetSectionIndex]);

  // Lightweight, smooth scroll spy to update active item in sticky sidebar
  useEffect(() => {
    if (!sections.length) return;

    const handleScroll = () => {
      if (isAutoScrollingRef.current) return;
      let bestIdx = 0;
      let minDistance = Infinity;

      sectionRefs.current.forEach((el, idx) => {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        if (rect.top <= 220 && rect.bottom >= 120) {
          bestIdx = idx;
          minDistance = 0;
        } else {
          const dist = Math.abs(rect.top - 140);
          if (dist < minDistance && minDistance !== 0) {
            minDistance = dist;
            bestIdx = idx;
          }
        }
      });

      setActiveVisibleIndex(bestIdx);

      const qcEl = quickCheckRefs.current[bestIdx];
      if (qcEl) {
        const qcRect = qcEl.getBoundingClientRect();
        if (qcRect.top <= 340 && qcRect.bottom >= 100) {
          setActiveQcIndex(bestIdx);
        } else {
          setActiveQcIndex(null);
        }
      } else {
        setActiveQcIndex(null);
      }
    };

    const scrollParent = document.querySelector('.st-mainview') || window;
    let ticking = false;

    const onScrollThrottled = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    scrollParent.addEventListener('scroll', onScrollThrottled, { passive: true });
    return () => {
      scrollParent.removeEventListener('scroll', onScrollThrottled);
    };
  }, [sections, dbDurationMinutes]);

  const markQuickCheckCompleted = (
    idx: number,
    selectedKey?: string,
    questionIndex: number = 0,
    markSectionComplete: boolean = true
  ) => {
    if (markSectionComplete) {
      setCompletedQuickChecks((prev) => {
        const updated = new Set(prev);
        updated.add(idx);
        try {
          const serialized = JSON.stringify(Array.from(updated));
          cloudStorage.setItem(qcStorageKey, serialized);
          cloudStorage.setItem(chapterQcStorageKey, serialized);
        } catch (err) {
          console.warn('Failed to save quick check progress', err);
        }
        return updated;
      });
    }

    if (selectedKey) {
      setQcAnswers((prev) => {
        const updated = {
          ...prev,
          [`${idx}_${questionIndex}`]: selectedKey,
          ...(questionIndex === 0 ? { [String(idx)]: selectedKey } : {}),
        };
        try {
          cloudStorage.setItem(qcAnswersStorageKey, JSON.stringify(updated));
        } catch (err) {
          console.warn('Failed to save quick check answer', err);
        }
        return updated;
      });
    }
  };

  const handleScrollToSection = (idx: number) => {
    if (idx >= renderedCount) {
      setRenderedCount(Math.min(totalSections, idx + 1));
    }
    requestAnimationFrame(() => {
      const el = sectionRefs.current[idx];
      if (el) {
        setActiveVisibleIndex(idx);
        setActiveQcIndex(null);
        isAutoScrollingRef.current = true;
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setTimeout(() => {
          isAutoScrollingRef.current = false;
        }, 700);
      }
    });
  };

  const handleScrollToQuickCheck = (idx: number) => {
    if (idx >= renderedCount) {
      setRenderedCount(Math.min(totalSections, idx + 1));
    }
    requestAnimationFrame(() => {
      const el = quickCheckRefs.current[idx] || sectionRefs.current[idx];
      if (el) {
        setActiveVisibleIndex(idx);
        setActiveQcIndex(idx);
        isAutoScrollingRef.current = true;
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => {
          isAutoScrollingRef.current = false;
        }, 700);
      }
    });
  };

  const handleNextSectionInline = (idx: number) => {
    const nextIdx = idx + 1;
    if (nextIdx < totalSections) {
      handleScrollToSection(nextIdx);
    }
  };

  const completedCount = useMemo(() => {
    return sections.filter((s, i) => {
      const hasQc = Boolean((s.quickChecks && s.quickChecks.length > 0) || s.quickCheck);
      return hasQc ? completedQuickChecks.has(i) : completedSections.has(i);
    }).length;
  }, [sections, completedQuickChecks, completedSections]);

  const progressPercent = totalSections > 0
    ? Math.min(100, Math.round((completedCount / totalSections) * 100))
    : 0;

  useEffect(() => {
    if (totalSections === 0) return;
    try {
      const prevPct = cloudStorage.getItem(chapterPctStorageKey);
      if (prevPct !== String(progressPercent)) {
        cloudStorage.setItem(chapterPctStorageKey, String(progressPercent));
      }
    } catch {
      // ignore storage error
    }
  }, [progressPercent, totalSections, chapterPctStorageKey]);

  // Learn tools botanical sage palette (#375545 / #9CC0B4 / #EBF3EE)
  const pineDeep = '#375545';
  const amberAccent = '#9CC0B4';
  const amberHeading = '#375545';

  const getSectionExamSignal = (title: string, idx: number): { mainTag: string; sidebarQcTag: string } => {
    const lower = (title || '').toLowerCase();
    if (idx === 1 || lower.includes('foregut') || lower.includes('stomodaeum')) {
      return {
        mainTag: '🎯 Asked in 2023 & 2024 · 8 marks',
        sidebarQcTag: "asked '23 '24 · 8 marks",
      };
    }
    if (idx === 0 || lower.includes('alimentary') || lower.includes('overview') || lower.includes('digestive')) {
      return {
        mainTag: '🎯 Asked in 2023 & 2024 · 8 marks',
        sidebarQcTag: "asked '23 '24 · 8 marks",
      };
    }
    if (idx === 2 || lower.includes('midgut') || lower.includes('ventriculus') || lower.includes('mesenteron')) {
      return {
        mainTag: '🎯 Asked in 2022 & 2024 · 4 marks',
        sidebarQcTag: "asked '22 '24 · 4 marks",
      };
    }
    if (idx === 3 || lower.includes('hindgut') || lower.includes('proctodaeum')) {
      return {
        mainTag: '🎯 Asked in 2023 · 4 marks',
        sidebarQcTag: "asked '23 · 4 marks",
      };
    }
    return {
      mainTag: '🎯 Asked in 2022 & 2023 · 6 marks',
      sidebarQcTag: "asked '22 '23 · 6 marks",
    };
  };
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '360px', color: '#64748b' }}>
        Loading chapter sections...
      </div>
    );
  }

  if (!sections || sections.length === 0) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
        No sectionized reading material found for this chapter.
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        gap: '24px',
        width: '100%',
        margin: 0,
        padding: '0 0 60px',
        boxSizing: 'border-box',
        alignItems: 'flex-start',
      }}
    >
      {/* ── LEFT NAVIGATION SIDEBAR (Sticky, intact, 3 clean states: completed, selected, unselected) ── */}
      <div
        style={{
          width: '260px',
          flexShrink: 0,
          position: 'sticky',
          top: '8px',
          alignSelf: 'flex-start',
          maxHeight: 'calc(100vh - 80px)',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          zIndex: 10,
        }}
      >
        {/* Section Checklist Card */}
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #E6E1D6',
            padding: '16px 12px',
            boxShadow: '0 4px 16px rgba(30, 40, 34, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          <div
            style={{
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '0.07em',
              textTransform: 'uppercase',
              color: '#64748b',
              padding: '0 8px 6px',
              borderBottom: '1px solid #F1EFEA',
            }}
          >
            IN THIS CHAPTER
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {sections.map((sec, idx) => {
              const isSelected = idx === activeVisibleIndex;
              const hasQc = Boolean((sec.quickChecks && sec.quickChecks.length > 0) || sec.quickCheck);
              const isQcDone = completedQuickChecks.has(idx);
              const isDone = hasQc ? isQcDone : completedSections.has(idx);
              const displayTitle = (sec.title || sec.shortTitle || `Section ${idx + 1}`).replace(/^\d+[\.\)]\s*/, '');

              return (
                <div
                  key={sec.id}
                  onClick={() => handleScrollToSection(idx)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleScrollToSection(idx);
                    }
                  }}
                  title={sec.title}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '9px 10px',
                    borderRadius: '10px',
                    border: isSelected ? '1px solid #C5D9CD' : '1px solid transparent',
                    background: isSelected ? '#EBF3EE' : 'transparent',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {/* Status Indicator Icon */}
                  {isDone ? (
                    <span
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        background: pineDeep,
                        color: '#ffffff',
                        fontSize: '11px',
                        fontWeight: 800,
                      }}
                    >
                      ✓
                    </span>
                  ) : isSelected ? (
                    <span
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        background: '#FFFFFF',
                        border: `1.8px solid ${pineDeep}`,
                        boxSizing: 'border-box',
                      }}
                    >
                      <span
                        style={{
                          width: '7px',
                          height: '7px',
                          borderRadius: '50%',
                          background: pineDeep,
                          display: 'block',
                        }}
                      />
                    </span>
                  ) : (
                    <span
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        background: 'transparent',
                        border: '1.5px solid #cbd5e1',
                        boxSizing: 'border-box',
                      }}
                    />
                  )}

                  {/* Full Section Title (wraps cleanly on multiple lines, no ellipsis) */}
                  <span
                    style={{
                      fontSize: '12.5px',
                      fontWeight: isSelected ? 700 : isDone ? 600 : 500,
                      color: isSelected ? '#18221D' : '#475569',
                      lineHeight: 1.35,
                      flex: 1,
                      minWidth: 0,
                      whiteSpace: 'normal',
                      wordBreak: 'break-word',
                    }}
                  >
                    {displayTitle}
                  </span>

                  {/* Far-right Quick Check redirect icon */}
                  {hasQc && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleScrollToQuickCheck(idx);
                      }}
                      title={`Jump to Quick Check (${displayTitle})`}
                      aria-label={`Jump to Quick Check for ${displayTitle}`}
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '7px',
                        border: isQcDone
                          ? '1px solid #9CC0B4'
                          : isSelected
                          ? '1px solid #C5D9CD'
                          : '1px solid #E2E8F0',
                        background: isQcDone
                          ? '#DCEBE3'
                          : isSelected
                          ? '#FFFFFF'
                          : '#F8FAFC',
                        color: isQcDone ? '#2E4A3B' : '#475569',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        cursor: 'pointer',
                        padding: 0,
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M9 11l3 3L22 4" />
                        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                      </svg>
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Progress Bar Footer */}
          <div
            style={{
              marginTop: '10px',
              paddingTop: '10px',
              borderTop: '1px solid #F1EFEA',
              paddingLeft: '6px',
              paddingRight: '6px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '12px',
                fontWeight: 600,
                color: '#64748b',
                marginBottom: '6px',
              }}
            >
              <span>Chapter progress</span>
              <span style={{ color: '#1E2822', fontWeight: 700 }}>{progressPercent}%</span>
            </div>
            <div
              style={{
                height: '6px',
                width: '100%',
                background: '#EFECE4',
                borderRadius: '999px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${progressPercent}%`,
                  background: amberAccent,
                  borderRadius: '999px',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN READING STREAM (Smooth, continuous single scroll, no locks) ── */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          background: 'transparent',
          border: 'none',
          boxShadow: 'none',
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: '28px',
        }}
      >
        {/* Vertical stream of all sections */}
        {sections.map((sec, idx) => {
          const isQcDone = completedQuickChecks.has(idx);
          const qcList =
            sec.quickChecks && sec.quickChecks.length > 0
              ? sec.quickChecks
              : sec.quickCheck
              ? [sec.quickCheck]
              : [];
          const qcCount = qcList.length;
          const secSelectedKeys: Record<number, string> = {};
          for (let qIdx = 0; qIdx < qcCount; qIdx++) {
            const val = qcAnswers[`${idx}_${qIdx}`] || (qIdx === 0 ? qcAnswers[String(idx)] : undefined);
            if (val) secSelectedKeys[qIdx] = val;
          }
          const answeredInSec = Object.keys(secSelectedKeys).length;

          return (
            <div
              key={sec.id}
              ref={(el) => {
                sectionRefs.current[idx] = el;
              }}
              data-section-index={idx}
              style={{
                position: 'relative',
                paddingBottom: '36px',
                borderBottom: idx < sections.length - 1 ? '1px solid #E6E1D6' : 'none',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '18px',
                }}
              >
                {/* Section Header */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: 800,
                        letterSpacing: '0.06em',
                        color: amberHeading,
                        textTransform: 'uppercase',
                      }}
                    >
                      SECTION {idx + 1} OF {totalSections}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', margin: '0 0 6px' }}>
                    <h2
                      style={{
                        fontSize: '24px',
                        fontWeight: 800,
                        color: '#1E2822',
                        lineHeight: '1.3',
                        margin: 0,
                      }}
                    >
                      {sec.title}
                    </h2>
                  </div>

                  {sec.subtitle && (
                    <p
                      style={{
                        fontSize: '14.5px',
                        color: '#475569',
                        margin: '0 0 10px',
                        fontWeight: 500,
                      }}
                    >
                      {sec.subtitle}
                    </p>
                  )}

                  {/* Section Meta Row (Learn tools sage theme) */}
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginTop: '6px' }}>
                    <span
                      style={{
                        background: '#F1F5F3',
                        color: '#2E4A3B',
                        border: '1px solid #DCE7E1',
                        borderRadius: '6px',
                        padding: '3px 10px',
                        fontSize: '12px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      ⏱ {sec.readTimeMinutes} min read
                    </span>

                    {qcCount > 0 && (
                      <button
                        type="button"
                        onClick={() => handleScrollToQuickCheck(idx)}
                        title="Skip to Quick Check"
                        style={{
                          background: isQcDone ? '#DCEBE3' : '#EBF3EE',
                          color: '#2E4A3B',
                          border: '1px solid #C5D9CD',
                          borderRadius: '6px',
                          padding: '3px 10px',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        {isQcDone
                          ? `✓ ${qcCount} quick check${qcCount > 1 ? 's' : ''} answered`
                          : answeredInSec > 0
                          ? `✔ ${answeredInSec}/${qcCount} quick checks`
                          : `✔ ${qcCount} quick check${qcCount > 1 ? 's' : ''}`}
                      </button>
                    )}
                  </div>
                </div>

                {/* Section Markdown Body (progressively mounted to keep frame time < 30ms) */}
                {idx < renderedCount ? (
                  <>
                    <div
                      className="sectionized-markdown-content"
                      style={{
                        lineHeight: '1.7',
                        color: '#1e293b',
                        fontSize: '15.5px',
                      }}
                    >
                      <ReadingHighlightView
                        content={sec.content}
                        active={Boolean(readingHighlight?.active)}
                        startWord={readingHighlight?.startWord ?? -1}
                        endWord={readingHighlight?.endWord ?? -1}
                        isPurpleTheme={false}
                      />
                    </div>

                    {/* Inline Quick Check Card at the end of the section/module */}
                    {qcCount > 0 && (
                      <div
                        ref={(el) => {
                          quickCheckRefs.current[idx] = el;
                        }}
                        style={{ scrollMarginTop: '20px' }}
                      >
                        <QuickCheckModal
                          key={`inline-qc-${sec.id}-${persona}-${track}`}
                          isOpen={true}
                          question={qcList[0]}
                          questions={qcList}
                          currentSectionNumber={idx + 1}
                          totalSections={totalSections}
                          sectionTitle={sec.shortTitle}
                          nextSectionTitle={sections[idx + 1]?.shortTitle}
                          isPurpleTheme={false}
                          initialSelectedKey={secSelectedKeys[0] || null}
                          initialSelectedKeys={secSelectedKeys}
                          isCompleted={isQcDone}
                          onNextSection={
                            idx + 1 < totalSections
                              ? () => {
                                  markQuickCheckCompleted(idx);
                                  handleNextSectionInline(idx);
                                }
                              : undefined
                          }
                          onAnswerSubmitted={(_isCorrect, selectedKey, questionIndex, allAnswered) => {
                            markQuickCheckCompleted(idx, selectedKey, questionIndex, allAnswered || qcCount === 1);
                          }}
                        />
                      </div>
                    )}
                  </>
                ) : (
                  <div
                    style={{
                      minHeight: '280px',
                      borderRadius: '12px',
                      background: 'rgba(241, 239, 234, 0.6)',
                    }}
                  />
                )}
              </div>
            </div>
          );
        })}

        {/* Compact Floating Next-Section Button anchored bottom-right for every section */}
        {activeVisibleIndex + 1 < totalSections && (
          <div
            style={{
              position: 'sticky',
              bottom: '16px',
              display: 'flex',
              justifyContent: 'flex-end',
              pointerEvents: 'none',
              zIndex: 15,
              marginTop: '-16px',
            }}
          >
            <button
              type="button"
              onClick={() => {
                const currentSec = sections[activeVisibleIndex];
                const hasQc = Boolean(
                  (currentSec?.quickChecks && currentSec.quickChecks.length > 0) || currentSec?.quickCheck
                );
                if (!hasQc) {
                  setCompletedSections((prev) => {
                    const updated = new Set(prev);
                    updated.add(activeVisibleIndex);
                    try {
                      const serialized = JSON.stringify(Array.from(updated));
                      cloudStorage.setItem(storageKey, serialized);
                      cloudStorage.setItem(chapterStorageKey, serialized);
                    } catch {
                      // ignore storage error
                    }
                    return updated;
                  });
                }
                handleNextSectionInline(activeVisibleIndex);
              }}
              title={sections[activeVisibleIndex + 1]?.title || `Section ${activeVisibleIndex + 2}`}
              style={{
                pointerEvents: 'auto',
                background: 'linear-gradient(135deg, #B2E5D2 0%, #8FD1B8 100%)',
                color: '#0F221A',
                border: '1.5px solid #BCEAD9',
                borderRadius: '999px',
                padding: '9px 18px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 0 16px rgba(143, 209, 184, 0.6), 0 4px 12px rgba(24, 34, 29, 0.18)',
                transition: 'all 0.16s ease',
                whiteSpace: 'nowrap',
              }}
            >
              <span>Next: Section {activeVisibleIndex + 2} →</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const SectionizedReadView = React.memo(SectionizedReadViewInner);
export default SectionizedReadView;
