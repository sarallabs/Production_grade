import React, { useState, useEffect, useMemo } from 'react';
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

  const handleSelectOption = (qIdx: number, key: string, isCorrect: boolean) => {
    if (selectedByQ[qIdx] || pendingWrongByQ[qIdx]) return;
    const usedRetries = retriesUsedByQ[qIdx] || 0;
    if (!isCorrect && usedRetries < 1) {
      setPendingWrongByQ((prev) => ({ ...prev, [qIdx]: key }));
      return;
    }
    setPendingWrongByQ((prev) => ({ ...prev, [qIdx]: null }));
    const nextMap = { ...selectedByQ, [qIdx]: key };
    setSelectedByQ(nextMap);
    const nextAnsweredCount = Object.keys(nextMap).filter((k) => Boolean(nextMap[Number(k)])).length;
    if (onAnswerSubmitted) {
      onAnswerSubmitted(isCorrect, key, qIdx, nextAnsweredCount >= qList.length);
    }
  };

  const handleTryAgain = (qIdx: number) => {
    setRetriesUsedByQ((prev) => ({ ...prev, [qIdx]: (prev[qIdx] || 0) + 1 }));
    setPendingWrongByQ((prev) => ({ ...prev, [qIdx]: null }));
  };

  const borderColor =
    allQuestionsAnswered || isCompleted ? 'rgba(22, 163, 74, 0.3)' : 'rgba(45, 71, 59, 0.22)';
  const canPrev = safeIdx > 0;
  const canNext = safeIdx < qList.length - 1;

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        marginTop: '12px',
        background: '#ffffff',
        borderRadius: '16px',
        border: `1.5px solid ${borderColor}`,
        boxShadow: '0 8px 28px rgba(15, 23, 42, 0.06)',
        padding: '22px 26px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        gap: '18px',
      }}
    >
      {/* Header Badge + Simple Carousel Arrows */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span
            style={{
              fontSize: '11.5px',
              fontWeight: 800,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: '#2E3B33',
              background: '#FDF6EC',
              border: '1px solid #F3DEC0',
              padding: '4px 11px',
              borderRadius: '999px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            <span>⚡</span>
            <span>
              QUICK CHECK · {sectionTitle ? sectionTitle : `SECTION ${currentSectionNumber}`}
            </span>
          </span>

          <span
            style={{
              fontSize: '12px',
              fontWeight: 700,
              color: '#475569',
              background: '#F1EFEA',
              padding: '3px 10px',
              borderRadius: '999px',
            }}
          >
            {safeIdx + 1} / {qList.length}
          </span>

          {(answeredCount > 0 || isCompleted) && (
            <span
              style={{
                fontSize: '12px',
                fontWeight: 700,
                color: (isCompleted || answeredCount >= qList.length) ? '#2E3B33' : '#8C5A19',
                background: (isCompleted || answeredCount >= qList.length) ? '#EBF3EE' : '#FDF6EC',
                border: (isCompleted || answeredCount >= qList.length) ? '1px solid #C5D9CD' : '1px solid #F3DEC0',
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

        {/* Simple Left / Right Arrow Navigation */}
        {qList.length > 1 && (
          <div style={{ display: ' inline-flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              aria-label="Previous question"
              disabled={!canPrev}
              onClick={() => canPrev && setCurrentIdx((i) => Math.max(0, i - 1))}
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                border: '1.5px solid #cbd5e1',
                background: canPrev ? '#ffffff' : '#f8fafc',
                color: canPrev ? '#1e293b' : '#cbd5e1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: canPrev ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s ease',
                padding: 0,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <button
              type="button"
              aria-label="Next question"
              disabled={!canNext}
              onClick={() => canNext && setCurrentIdx((i) => Math.min(qList.length - 1, i + 1))}
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                border: '1.5px solid #cbd5e1',
                background: canNext ? '#ffffff' : '#f8fafc',
                color: canNext ? '#1e293b' : '#cbd5e1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: canNext ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s ease',
                padding: 0,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        )}
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
                    fontSize: '16.5px',
                    fontWeight: 700,
                    color: '#0f172a',
                    lineHeight: '1.45',
                    margin: 0,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px',
                  }}
                >
                  <span
                    style={{
                      color: '#2D473B',
                      fontWeight: 800,
                      minWidth: '22px',
                    }}
                  >
                    {qIdx + 1}.
                  </span>
                  <span style={{ flex: 1 }}>{qItem.stem}</span>
                </h3>

                {/* Options with Alternating Lighter and Darker Shades */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
                  {qItem.options.map((opt, optIdx) => {
                    const isSelected = selectedKey === opt.key;
                    const isEven = optIdx % 2 === 0;

                    let optBorder = isEven ? '#e2e8f0' : '#cbdcd1';
                    let optBg = isEven ? '#ffffff' : '#f4f7f5';
                    let optColor = '#1e293b';

                    if (isSelected && !isSubmitted) {
                      optBorder = '2px solid #2D473B';
                      optBg = '#E4EFE8';
                      optColor = '#16251D';
                    }

                    if (isFinalSubmitted) {
                      if (opt.is_correct) {
                        optBorder = '2px solid #16a34a';
                        optBg = '#f0fdf4';
                        optColor = '#15803d';
                      } else if (isSelected && !opt.is_correct) {
                        optBorder = '2px solid #ef4444';
                        optBg = '#fef2f2';
                        optColor = '#991b1b';
                      }
                    } else if (isPendingRetry && isSelected) {
                      optBorder = '2px solid #ef4444';
                      optBg = '#fef2f2';
                      optColor = '#991b1b';
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
                            background: isSelected ? '#2D473B' : isEven ? '#f1f5f9' : '#dbe8df',
                            color: isSelected ? '#ffffff' : '#334155',
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
                      background: '#FCF6F0',
                      border: '1px solid #E5C8AF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#B86B3D' }}>
                      ✕ Not quite right — you have 1 retry attempt remaining.
                    </span>
                    <button
                      type="button"
                      onClick={() => handleTryAgain(qIdx)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '999px',
                        border: '1.5px solid #C88A5A',
                        background: '#FFFFFF',
                        color: '#9A5226',
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

                {/* Diagnostic Rationale & Key Takeaway (shown when correct or after retry is exhausted) */}
                {isFinalSubmitted && (
                  <div
                    style={{
                      padding: '12px 16px',
                      borderRadius: '10px',
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      fontSize: '13.5px',
                      lineHeight: '1.5',
                      color: '#334155',
                    }}
                  >
                    <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
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


