import { useState, useEffect, useMemo } from 'react';
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

export default function QuickCheckModal({
  isOpen = true,
  question,
  questions,
  currentSectionNumber,
  totalSections,
  sectionTitle,
  nextSectionTitle,
  initialSelectedKey = null,
  initialSelectedKeys,
  isCompleted = false,
  onNextSection,
  onAnswerSubmitted,
}: QuickCheckModalProps) {
  const qList = useMemo(() => {
    if (questions && questions.length > 0) return questions;
    return question ? [question] : [];
  }, [questions, question]);

  const [selectedByQ, setSelectedByQ] = useState<Record<number, string>>(() => {
    if (initialSelectedKeys && Object.keys(initialSelectedKeys).length > 0) {
      return { ...initialSelectedKeys };
    }
    if (initialSelectedKey) {
      return { 0: initialSelectedKey };
    }
    return {};
  });

  useEffect(() => {
    if (initialSelectedKeys && Object.keys(initialSelectedKeys).length > 0) {
      setSelectedByQ((prev) => ({ ...prev, ...initialSelectedKeys }));
    } else if (initialSelectedKey) {
      setSelectedByQ((prev) => ({ 0: initialSelectedKey, ...prev }));
    }
  }, [initialSelectedKey, initialSelectedKeys]);

  if (!isOpen || qList.length === 0) return null;

  const answeredCount = Object.keys(selectedByQ).filter((k) => Boolean(selectedByQ[Number(k)])).length;
  const allQuestionsAnswered = answeredCount >= qList.length;

  const handleSelectOption = (qIdx: number, key: string, isCorrect: boolean) => {
    if (selectedByQ[qIdx]) return;
    const nextMap = { ...selectedByQ, [qIdx]: key };
    setSelectedByQ(nextMap);
    const nextAnsweredCount = Object.keys(nextMap).filter((k) => Boolean(nextMap[Number(k)])).length;
    if (onAnswerSubmitted) {
      onAnswerSubmitted(isCorrect, key, qIdx, nextAnsweredCount >= qList.length);
    }
  };

  const borderColor =
    allQuestionsAnswered || isCompleted ? 'rgba(22, 163, 74, 0.3)' : 'rgba(45, 71, 59, 0.22)';
  const hasNextSection = currentSectionNumber < totalSections && Boolean(onNextSection);

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
        padding: '24px 28px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        gap: '22px',
      }}
    >
      {/* Header Badge */}
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
              color: '#2D473B',
              background: '#dcfce7',
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
              background: '#f1f5f9',
              padding: '3px 10px',
              borderRadius: '999px',
            }}
          >
            {qList.length} {qList.length === 1 ? 'Question' : 'Questions'}
          </span>
        </div>

        {(answeredCount > 0 || isCompleted) && (
          <span
            style={{
              fontSize: '12px',
              fontWeight: 700,
              color: '#15803d',
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              padding: '3px 10px',
              borderRadius: '999px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span>✓</span>
            <span>
              {qList.length > 1
                ? `${Math.max(answeredCount, isCompleted ? qList.length : 0)}/${qList.length} Answered`
                : 'Completed'}
            </span>
          </span>
        )}
      </div>

      {/* All Questions for this Section Rendered Visibly */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {qList.map((qItem, qIdx) => {
          const selectedKey = selectedByQ[qIdx] || null;
          const isSubmitted = Boolean(selectedKey);

          return (
            <div
              key={`${qItem.module_id || 'qc'}-${qIdx}`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                paddingTop: qIdx > 0 ? '20px' : '0',
                borderTop: qIdx > 0 ? '1px solid #e2e8f0' : 'none',
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

              {/* 3 Options (A, B, C) with Alternating Lighter and Darker Shades */}
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

                  if (isSubmitted) {
                    if (opt.is_correct) {
                      optBorder = '2px solid #16a34a';
                      optBg = '#f0fdf4';
                      optColor = '#15803d';
                    } else if (isSelected && !opt.is_correct) {
                      optBorder = '2px solid #ef4444';
                      optBg = '#fef2f2';
                      optColor = '#991b1b';
                    }
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

              {/* Diagnostic Rationale & Key Takeaway */}
              {isSubmitted && (
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
                    {qItem.options.find((o) => o.key === selectedKey)?.is_correct
                      ? '✓ Correct Answer'
                      : 'Explanation'}
                  </div>
                  <div>{qItem.rationale}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Inline Card Footer (Next Section only — Try Again removed) */}
      {hasNextSection && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '12px',
            marginTop: '2px',
            paddingTop: '14px',
            borderTop: '1px solid #f1f5f9',
          }}
        >
          <button
            type="button"
            onClick={onNextSection}
            style={{
              background: '#2D473B',
              border: '1.5px solid #2D473B',
              borderRadius: '8px',
              padding: '8px 20px',
              color: '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              textAlign: 'right',
              fontWeight: 700,
              boxShadow: '0 2px 8px rgba(45, 71, 59, 0.25)',
              transition: 'all 0.16s ease, background 0.16s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#23382e';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#2D473B';
            }}
          >
            <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#bbf7d0' }}>
              NEXT · SECTION {Math.min(currentSectionNumber + 1, totalSections)} OF{' '}
              {totalSections}
            </span>
            <span style={{ fontSize: '13.5px' }}>
              {nextSectionTitle ? `${nextSectionTitle} →` : 'Continue Reading →'}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}


