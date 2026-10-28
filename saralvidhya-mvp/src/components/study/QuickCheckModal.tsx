import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { QuickCheckQuestion } from '@/data/sectionizedReadService';

interface QuickCheckModalProps {
  isOpen?: boolean;
  question: QuickCheckQuestion;
  questions?: QuickCheckQuestion[];
  currentSectionNumber: number;
  totalSections: number;
  sectionTitle?: string;
  nextSectionTitle?: string;
  isPurpleTheme?: boolean;
  initialSelectedKey?: string | null;
  initialSelectedKeys?: Record<number, string>;
  isCompleted?: boolean;
  onClose?: () => void;
  onNextSection?: () => void;
  onAnswerSubmitted?: (
    isCorrect: boolean,
    selectedKey: string,
    questionIndex: number,
    allAnswered: boolean
  ) => void;
}

function QuickCheckModalInner({
  isOpen = true,
  question,
  questions,
  currentSectionNumber,
  sectionTitle,
  initialSelectedKey = null,
  initialSelectedKeys,
  isCompleted = false,
  onAnswerSubmitted,
}: QuickCheckModalProps) {
  const qList = useMemo(() => {
    if (questions && questions.length > 0) return questions;
    return question ? [question] : [];
  }, [questions, question]);

  const [currentIdx, setCurrentIdx] = useState(0);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [selectedByQ, setSelectedByQ] = useState<Record<number, string>>(() => {
    if (initialSelectedKeys && Object.keys(initialSelectedKeys).length > 0) {
      return { ...initialSelectedKeys };
    }
    if (initialSelectedKey) {
      return { 0: initialSelectedKey };
    }
    return {};
  });
  const [retriesUsedByQ, setRetriesUsedByQ] = useState<Record<number, number>>({});
  const [pendingWrongByQ, setPendingWrongByQ] = useState<Record<number, string | null>>({});

  useEffect(() => {
    setCurrentIdx(0);
    setRetriesUsedByQ({});
    setPendingWrongByQ({});
  }, [qList.length, currentSectionNumber, sectionTitle]);

  useEffect(() => {
    if (initialSelectedKeys && Object.keys(initialSelectedKeys).length > 0) {
      setSelectedByQ((prev) => {
        const keys = Object.keys(initialSelectedKeys);
        const changed = keys.some((k) => prev[Number(k)] !== initialSelectedKeys[Number(k)]);
        return changed ? { ...prev, ...initialSelectedKeys } : prev;
      });
    } else if (initialSelectedKey) {
      setSelectedByQ((prev) => (prev[0] === initialSelectedKey ? prev : { 0: initialSelectedKey, ...prev }));
    }
  }, [initialSelectedKey, initialSelectedKeys]);

  if (!isOpen || qList.length === 0) return null;

  const safeIdx = Math.min(Math.max(0, currentIdx), qList.length - 1);
  const answeredCount = Object.keys(selectedByQ).filter((k) => Boolean(selectedByQ[Number(k)])).length;
  const allQuestionsAnswered = answeredCount >= qList.length;

  const scrollQuickCheckToCenter = () => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const el = cardRef.current;
        if (!el) return;
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    });
  };

  const handleSelectOption = (qIdx: number, key: string, isCorrect: boolean) => {
    if (selectedByQ[qIdx] || pendingWrongByQ[qIdx]) return;
    const usedRetries = retriesUsedByQ[qIdx] || 0;
    if (!isCorrect && usedRetries < 1) {
      setPendingWrongByQ((prev) => ({ ...prev, [qIdx]: key }));
      scrollQuickCheckToCenter();
      return;
    }
    setPendingWrongByQ((prev) => ({ ...prev, [qIdx]: null }));
    const nextMap = { ...selectedByQ, [qIdx]: key };
    setSelectedByQ(nextMap);
    const nextAnsweredCount = Object.keys(nextMap).filter((k) => Boolean(nextMap[Number(k)])).length;
    if (onAnswerSubmitted) {
      onAnswerSubmitted(isCorrect, key, qIdx, nextAnsweredCount >= qList.length);
    }
    scrollQuickCheckToCenter();
  };

  const handleTryAgain = (qIdx: number) => {
    setRetriesUsedByQ((prev) => ({ ...prev, [qIdx]: (prev[qIdx] || 0) + 1 }));
    setPendingWrongByQ((prev) => ({ ...prev, [qIdx]: null }));
  };

  const borderColor =
    allQuestionsAnswered || isCompleted ? 'rgba(134, 239, 172, 0.45)' : 'rgba(156, 192, 180, 0.28)';
  const canPrev = safeIdx > 0;
  const canNext = safeIdx < qList.length - 1;

  return (
    <div
      ref={cardRef}
      style={{
        position: 'relative',
        width: '100%',
        marginTop: '12px',
        background: 'linear-gradient(145deg, #3A5648 0%, #2F483C 100%)',
        borderRadius: '16px',
        border: `1.5px solid ${borderColor}`,
        boxShadow: '0 10px 28px rgba(24, 38, 31, 0.16)',
        padding: '20px 24px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      {/* Header Row: 1 / 4 on Left, subtle Quick Check heading + Carousel Arrows on Right */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >
        {/* Left: 1 / 4 counter (+ subtle answered status if applicable) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span
            style={{
              fontSize: '12.5px',
              fontWeight: 700,
              color: '#ECF4F0',
              background: 'rgba(255, 255, 255, 0.14)',
              padding: '3px 11px',
              borderRadius: '999px',
              letterSpacing: '0.02em',
            }}
          >
            {safeIdx + 1} / {qList.length}
          </span>

          {(answeredCount > 0 || isCompleted) && (
            <span
              style={{
                fontSize: '11.5px',
                fontWeight: 600,
                color: '#D1FAE5',
                background: 'rgba(16, 185, 129, 0.2)',
                padding: '3px 10px',
                borderRadius: '999px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <span>{(isCompleted || answeredCount >= qList.length) ? '✓' : '●'}</span>
              <span>
                {qList.length > 1
                  ? `${Math.max(answeredCount, isCompleted ? qList.length : 0)}/${qList.length} Answered`
                  : 'Completed'}
              </span>
            </span>
          )}
        </div>

        {/* Right: Subtle Quick Check heading (no border/highlight) + Left/Right Navigation */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px' }}>
          <span
            style={{
              fontSize: '12.5px',
              fontWeight: 600,
              letterSpacing: '0.03em',
              color: 'rgba(232, 242, 237, 0.78)',
            }}
          >
            Quick Check
          </span>

          {qList.length > 1 && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                aria-label="Previous question"
                disabled={!canPrev}
                onClick={() => canPrev && setCurrentIdx((i) => Math.max(0, i - 1))}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  border: canPrev ? '1.5px solid rgba(255, 255, 255, 0.35)' : '1.5px solid rgba(255, 255, 255, 0.14)',
                  background: canPrev ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                  color: canPrev ? '#F1F7F4' : 'rgba(255, 255, 255, 0.28)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: canPrev ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s ease',
                  padding: 0,
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <button
                type="button"
                aria-label="Next question"
                disabled={!canNext}
                onClick={() => canNext && setCurrentIdx((i) => Math.min(qList.length - 1, i + 1))}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  border: canNext ? '1.5px solid #C6EDE0' : '1.5px solid rgba(255, 255, 255, 0.14)',
                  background: canNext ? '#A8DBC8' : 'rgba(255, 255, 255, 0.04)',
                  color: canNext ? '#12241C' : 'rgba(255, 255, 255, 0.28)',
                  boxShadow: canNext ? '0 0 12px rgba(168, 219, 200, 0.5)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: canNext ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s ease',
                  padding: 0,
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Smooth Horizontal Carousel Viewport */}
      <div style={{ width: '100%', overflow: 'hidden' }}>
        <div
          style={{
            display: 'flex',
            width: '100%',
            transform: `translateX(-${safeIdx * 100}%)`,
            transition: 'transform 0.38s cubic-bezier(0.22, 1, 0.36, 1)',
            willChange: 'transform',
          }}
        >
          {qList.map((qItem, qIdx) => {
            const finalSelectedKey = selectedByQ[qIdx] || null;
            const pendingWrongKey = pendingWrongByQ[qIdx] || null;
            const selectedKey = finalSelectedKey || pendingWrongKey;
            const isFinalSubmitted = Boolean(finalSelectedKey);
            const isPendingRetry = Boolean(pendingWrongKey) && !isFinalSubmitted;
            const isSubmitted = isFinalSubmitted || isPendingRetry;
            return (
              <div
                key={`${qItem.module_id || 'qc'}-${qIdx}`}
                style={{
                  minWidth: '100%',
                  width: '100%',
                  flexShrink: 0,
                  boxSizing: 'border-box',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  padding: '2px',
                }}
              >
                <h3
                  style={{
                    fontSize: '16px',
                    fontWeight: 600,
                    color: '#F8FBF9',
                    lineHeight: '1.45',
                    margin: 0,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px',
                  }}
                >
                  <span
                    style={{
                      color: '#A8DBC8',
                      fontWeight: 700,
                      minWidth: '22px',
                    }}
                  >
                    {qIdx + 1}.
                  </span>
                  <span style={{ flex: 1 }}>{qItem.stem}</span>
                </h3>

                {/* Options */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
                  {qItem.options.map((opt, optIdx) => {
                    const isSelected = selectedKey === opt.key;
                    const isEven = optIdx % 2 === 0;

                    let optBorder = isEven ? 'rgba(255, 255, 255, 0.16)' : 'rgba(255, 255, 255, 0.22)';
                    let optBg = isEven ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.13)';
                    let optColor = '#F1F7F4';
                    let pillBg = isEven ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.2)';
                    let pillColor = '#FFFFFF';

                    if (isSelected && !isSubmitted) {
                      optBorder = '2px solid #A8DBC8';
                      optBg = 'rgba(168, 219, 200, 0.22)';
                      optColor = '#FFFFFF';
                      pillBg = '#A8DBC8';
                      pillColor = '#14261E';
                    }

                    if (isFinalSubmitted) {
                      if (opt.is_correct) {
                        optBorder = '2px solid #4ADE80';
                        optBg = 'rgba(22, 163, 74, 0.28)';
                        optColor = '#ECFDF5';
                        pillBg = '#22C55E';
                        pillColor = '#FFFFFF';
                      } else if (isSelected && !opt.is_correct) {
                        optBorder = '2px solid #F87171';
                        optBg = 'rgba(239, 68, 68, 0.26)';
                        optColor = '#FEF2F2';
                        pillBg = '#EF4444';
                        pillColor = '#FFFFFF';
                      }
                    } else if (isPendingRetry && isSelected) {
                      optBorder = '2px solid #F87171';
                      optBg = 'rgba(239, 68, 68, 0.26)';
                      optColor = '#FEF2F2';
                      pillBg = '#EF4444';
                      pillColor = '#FFFFFF';
                    }

                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => handleSelectOption(qIdx, opt.key, opt.is_correct)}
                        disabled={isSubmitted}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          textAlign: 'left',
                          width: '100%',
                          padding: '12px 16px',
                          borderRadius: '10px',
                          border:
                            typeof optBorder === 'string' && optBorder.startsWith('2px')
                              ? optBorder
                              : `1.5px solid ${optBorder}`,
                          background: optBg,
                          color: optColor,
                          fontSize: '14.5px',
                          fontWeight: isSelected ? 600 : 500,
                          cursor: isSubmitted ? 'default' : 'pointer',
                          transition: 'all 0.16s ease',
                          boxSizing: 'border-box',
                        }}
                      >
                        {/* Option Pill Indicator */}
                        <div
                          style={{
                            width: '26px',
                            height: '26px',
                            borderRadius: '6px',
                            background: pillBg,
                            color: pillColor,
                            fontWeight: 700,
                            fontSize: '12.5px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {String.fromCharCode(65 + optIdx)}
                        </div>
                        <span style={{ flex: 1 }}>{opt.text}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Pending Retry Banner (shown on 1st wrong attempt only) */}
                {isPendingRetry && (
                  <div
                    style={{
                      padding: '10px 16px',
                      borderRadius: '10px',
                      background: 'rgba(254, 243, 199, 0.14)',
                      border: '1px solid rgba(251, 191, 36, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#FDE68A' }}>
                      ✕ Not quite right — you have 1 retry attempt remaining.
                    </span>
                    <button
                      type="button"
                      onClick={() => handleTryAgain(qIdx)}
                      style={{
                        padding: '5px 14px',
                        borderRadius: '999px',
                        border: '1px solid #FCD34D',
                        background: '#FEF3C7',
                        color: '#78350F',
                        fontWeight: 700,
                        fontSize: '12px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                      }}
                    >
                      <span>↻</span>
                      <span>Try Again</span>
                    </button>
                  </div>
                )}

                {/* Diagnostic Rationale & Key Takeaway */}
                {isFinalSubmitted && (
                  <div
                    style={{
                      padding: '12px 16px',
                      borderRadius: '10px',
                      background: 'rgba(15, 28, 22, 0.34)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      fontSize: '13.5px',
                      lineHeight: '1.5',
                      color: '#E2EFE9',
                    }}
                  >
                    <div style={{ fontWeight: 700, color: '#FFFFFF', marginBottom: '4px' }}>
                      {qItem.options.find((o) => o.key === finalSelectedKey)?.is_correct
                        ? '✓ Correct Answer'
                        : '✕ Incorrect — Explanation'}
                    </div>
                    <div>{qItem.rationale}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const QuickCheckModal = React.memo(QuickCheckModalInner);
export default QuickCheckModal;


