import { useState, useEffect, useMemo, useRef } from 'react';
import MarkdownView from '@/components/MarkdownView';
import ReadingHighlightView from './ReadingHighlightView';
import QuickCheckModal from './QuickCheckModal';
import {
  getSectionizedReadData,
  getCachedSectionizedReadDataSync,
  type SectionizedChapterData,
  type ReadSection,
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
  readingHighlight?: {
    active: boolean;
    startWord: number;
    endWord: number;
  };
}

export default function SectionizedReadView({
  subjectId,
  chapterNumber,
  persona,
  track = 'quick',
  isPurpleTheme = true,
  onLoadedContent,
  targetSectionIndex,
  readingHighlight,
}: SectionizedReadViewProps) {
  const initialCache = getCachedSectionizedReadDataSync(subjectId, chapterNumber, track, persona);
  const [data, setData] = useState<SectionizedChapterData | null>(initialCache);
  const [loading, setLoading] = useState(!initialCache);
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

  // Storage keys for persisting reading progress and answered quick checks separately
  const storageKey = `sv_read_progress_${subjectId}_${chapterNumber}_${persona}_${track}`;
  const qcStorageKey = `sv_qc_done_${subjectId}_${chapterNumber}_${persona}_${track}`;
  const qcAnswersStorageKey = `sv_qc_answers_${subjectId}_${chapterNumber}_${persona}_${track}`;

  useEffect(() => {
    try {
      const saved = cloudStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCompletedSections(new Set<number>(parsed));
        } else {
          setCompletedSections(new Set());
        }
      } else {
        setCompletedSections(new Set());
      }
    } catch {
      setCompletedSections(new Set());
    }

    try {
      const savedQc = cloudStorage.getItem(qcStorageKey);
      if (savedQc) {
        const parsedQc = JSON.parse(savedQc);
        if (Array.isArray(parsedQc) && parsedQc.length > 0) {
          setCompletedQuickChecks(new Set<number>(parsedQc));
        } else {
          setCompletedQuickChecks(new Set());
        }
      } else {
        setCompletedQuickChecks(new Set());
      }
    } catch {
      setCompletedQuickChecks(new Set());
    }

    try {
      const savedAnswers = cloudStorage.getItem(qcAnswersStorageKey);
      if (savedAnswers) {
        const parsedAnswers = JSON.parse(savedAnswers);
        if (parsedAnswers && typeof parsedAnswers === 'object') {
          setQcAnswers(parsedAnswers);
        } else {
          setQcAnswers({});
        }
      } else {
        setQcAnswers({});
      }
    } catch {
      setQcAnswers({});
    }
  }, [storageKey, qcStorageKey, qcAnswersStorageKey]);

  useEffect(() => {
    let isMounted = true;
    const cached = getCachedSectionizedReadDataSync(subjectId, chapterNumber, track, persona);
    if (cached) {
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
  }, [sections]);

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
          cloudStorage.setItem(qcStorageKey, JSON.stringify(Array.from(updated)));
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
  };

  const handleScrollToQuickCheck = (idx: number) => {
    const el = quickCheckRefs.current[idx] || sectionRefs.current[idx];
    if (el) {
      setActiveVisibleIndex(idx);
      setActiveQcIndex(idx);
      isAutoScrollingRef.current = true;
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(() => {
        isAutoScrollingRef.current = false;
      }, 700);
    }
  };

  const handleNextSectionInline = (idx: number) => {
    const nextIdx = idx + 1;
    if (nextIdx < totalSections && sectionRefs.current[nextIdx]) {
      handleScrollToSection(nextIdx);
    }
  };

  const completedCount = useMemo(() => {
    return sections.filter((s, i) => (s.quickCheck ? completedQuickChecks.has(i) : completedSections.has(i))).length;
  }, [sections, completedQuickChecks, completedSections]);

  const progressPercent = totalSections > 0
    ? Math.min(100, Math.round((completedCount / totalSections) * 100))
    : 0;

  const totalReadingMinutes = useMemo(() => {
    return sections.reduce((acc, s) => acc + (s.readTimeMinutes || 3), 0);
  }, [sections]);

  const accentColor = isPurpleTheme ? '#7c3aed' : '#15803d';
  const activeBg = isPurpleTheme ? '#f3e8ff' : '#dcfce7';
  const activeBorder = isPurpleTheme ? '#d8b4fe' : '#86efac';

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
        {/* Resumed / Reading Guide Pill */}
        <div
          style={{
            background: isPurpleTheme ? '#f3e8ff' : '#e0f2fe',
            color: isPurpleTheme ? '#6d28d9' : '#0369a1',
            borderRadius: '999px',
            padding: '6px 14px',
            fontSize: '12.5px',
            fontWeight: 700,
            textAlign: 'center',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          }}
        >
          {completedCount > 0 ? 'Resumed where you left off' : 'Reading Guide'}
        </div>

        {/* Section Checklist Card */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            padding: '16px 12px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
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
              borderBottom: '1px solid #f1f5f9',
            }}
          >
            IN THIS CHAPTER
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {sections.map((sec, idx) => {
              const isSelected = idx === activeVisibleIndex;
              const isQcActive = activeQcIndex === idx;
              const hasQc = Boolean((sec.quickChecks && sec.quickChecks.length > 0) || sec.quickCheck);
              const isQcDone = completedQuickChecks.has(idx);
              const isDone = hasQc ? isQcDone : completedSections.has(idx);

              return (
                <div key={sec.id} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <button
                    type="button"
                    onClick={() => handleScrollToSection(idx)}
                    title={sec.title}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 12px',
                      borderRadius: '10px',
                      border: '1.5px solid transparent',
                      background: isSelected && !isQcActive ? '#dbe6df' : 'transparent',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {/* Status Indicator Icon: Completed (✓), or Active (✓), or Uncompleted (open circle) */}
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
                          background: '#0f172a',
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
                          background: 'transparent',
                          border: '1.5px solid #0f172a',
                          color: '#0f172a',
                          fontSize: '11px',
                          fontWeight: 800,
                        }}
                      >
                        ✓
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
                        }}
                      />
                    )}

                    {/* Section Title */}
                    <span
                      style={{
                        fontSize: '13px',
                        fontWeight: isSelected ? 700 : isDone ? 600 : 500,
                        color: isSelected ? '#0f172a' : '#475569',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {sec.shortTitle}
                    </span>
                  </button>

                  {/* Mini sub-bullet point under the section bullet to skip directly to Quick Check */}
                  {hasQc && (
                    <button
                      type="button"
                      onClick={() => handleScrollToQuickCheck(idx)}
                      title={`Skip to Section ${idx + 1} Quick Check`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginLeft: '26px',
                        padding: '4px 10px',
                        borderRadius: '8px',
                        border: 'none',
                        background: isQcActive ? '#dbe6df' : 'transparent',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          flexShrink: 0,
                          background: isQcDone
                            ? '#15803d'
                            : isQcActive
                            ? '#0f172a'
                            : 'transparent',
                          border: isQcDone
                            ? '1.5px solid #15803d'
                            : isQcActive
                            ? '1.5px solid #0f172a'
                            : '1.5px solid #94a3b8',
                        }}
                      />
                      <span
                        style={{
                          fontSize: '11.5px',
                          fontWeight: isQcActive ? 700 : isQcDone ? 600 : 500,
                          color: isQcActive ? '#0f172a' : isQcDone ? '#15803d' : '#64748b',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        Quick Check
                      </span>
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
              borderTop: '1px solid #f1f5f9',
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
              <span style={{ color: '#0f172a', fontWeight: 700 }}>{progressPercent}%</span>
            </div>
            <div
              style={{
                height: '6px',
                width: '100%',
                background: '#f1f5f9',
                borderRadius: '999px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${progressPercent}%`,
                  background: accentColor,
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
          gap: '40px',
        }}
      >
        {/* Chapter Overview Meta Line */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', paddingBottom: '8px', borderBottom: '1px solid rgba(226, 232, 240, 0.6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                background: isPurpleTheme ? 'rgba(124, 58, 237, 0.08)' : 'rgba(21, 128, 61, 0.08)',
                color: accentColor,
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '12.5px',
                fontWeight: 700,
              }}
            >
              ⏱ {totalReadingMinutes} min total read
            </span>
            <span
              style={{
                background: '#f1f5f9',
                color: '#475569',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '12.5px',
                fontWeight: 600,
              }}
            >
              {totalSections} Sections
            </span>
          </div>
        </div>

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
                borderBottom: idx < sections.length - 1 ? '1px solid #e2e8f0' : 'none',
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
                        color: accentColor,
                        textTransform: 'uppercase',
                      }}
                    >
                      SECTION {idx + 1} OF {totalSections}
                    </span>
                  </div>

                  <h2
                    style={{
                      fontSize: '24px',
                      fontWeight: 800,
                      color: '#0f172a',
                      lineHeight: '1.3',
                      margin: '0 0 6px',
                    }}
                  >
                    {sec.title}
                  </h2>

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

                  {/* Section Badge Row */}
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginTop: '6px' }}>
                    <span
                      style={{
                        background: '#f1f5f9',
                        color: '#334155',
                        borderRadius: '6px',
                        padding: '3px 9px',
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
                          background: isQcDone ? '#dcfce7' : '#f0fdf4',
                          color: '#15803d',
                          border: '1px solid #bbf7d0',
                          borderRadius: '6px',
                          padding: '3px 9px',
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

                {/* Section Markdown Body */}
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
                    isPurpleTheme={isPurpleTheme}
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
                      key={`inline-qc-${sec.id}`}
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
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
