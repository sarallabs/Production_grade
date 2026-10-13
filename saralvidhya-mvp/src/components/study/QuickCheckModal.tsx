import { useState } from 'react';
import type { QuickCheckQuestion } from '@/data/sectionizedReadService';

interface QuickCheckModalProps {
  isOpen: boolean;
  question: QuickCheckQuestion;
  currentSectionNumber: number;
  totalSections: number;
  nextSectionTitle?: string;
  isPurpleTheme?: boolean;
  onClose: () => void;
  onNextSection: () => void;
  onAnswerSubmitted?: (isCorrect: boolean) => void;
}

export default function QuickCheckModal({
  isOpen,
  question,
  currentSectionNumber,
  totalSections,
  nextSectionTitle,
  isPurpleTheme = true,
  onClose,
  onNextSection,
  onAnswerSubmitted,
}: QuickCheckModalProps) {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen || !question) return null;

  const handleSelectOption = (key: string, isCorrect: boolean) => {
    if (isSubmitted) return;
    setSelectedKey(key);
    setIsSubmitted(true);
    if (onAnswerSubmitted) {
      onAnswerSubmitted(isCorrect);
    }
  };

  const accentColor = '#2D473B';
  const borderColor = 'rgba(45, 71, 59, 0.25)';

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        boxSizing: 'border-box',
        animation: 'sv-qc-fade-in 0.2s ease-out',
      }}
      onClick={onClose}
    >
      <style>{`
        @keyframes sv-qc-fade-in {
          from { opacity: 0; transform: scale(0.97); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
      <div
        style={{
          position: 'relative',
          maxWidth: '680px',
          width: '100%',
          background: '#ffffff',
          borderRadius: '16px',
          border: `1.5px solid ${borderColor}`,
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.18)',
          padding: '28px 32px',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Badge */}
        <div>
          <span
            style={{
              fontSize: '11.5px',
              fontWeight: 800,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: '#2D473B',
              background: '#dcfce7',
              padding: '3px 10px',
              borderRadius: '999px',
              display: 'inline-block',
            }}
          >
            QUICK CHECK · 1 OF 1
          </span>
          <h3
            style={{
              fontSize: '18px',
              fontWeight: 700,
              color: '#0f172a',
              lineHeight: '1.45',
              margin: '10px 0 0',
            }}
          >
            {question.stem}
          </h3>
        </div>

        {/* Option Items with Alternating Lighter and Darker Shades */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {question.options.map((opt, optIdx) => {
            const isSelected = selectedKey === opt.key;
            const isEven = optIdx % 2 === 0;

            // Alternating lighter (#ffffff) and darker (#f4f7f5) shades:
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
                onClick={() => handleSelectOption(opt.key, opt.is_correct)}
                disabled={isSubmitted}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  textAlign: 'left',
                  width: '100%',
                  padding: '13px 18px',
                  borderRadius: '10px',
                  border: typeof optBorder === 'string' && optBorder.startsWith('2px') ? optBorder : `1.5px solid ${optBorder}`,
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
                    background: isSelected ? '#2D473B' : (isEven ? '#f1f5f9' : '#dbe8df'),
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
              padding: '14px 18px',
              borderRadius: '10px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              fontSize: '13.5px',
              lineHeight: '1.5',
              color: '#334155',
            }}
          >
            <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
              {question.options.find(o => o.key === selectedKey)?.is_correct ? '✓ Correct Answer' : 'Explanation'}
            </div>
            <div>{question.rationale}</div>
          </div>
        )}

        {/* Modal Navigation Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            marginTop: '4px',
            paddingTop: '16px',
            borderTop: '1px solid #f1f5f9',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 600,
              color: '#475569',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              textAlign: 'left',
            }}
          >
            <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#94a3b8' }}>← Back</span>
            <span>Return to Reading</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onNextSection();
            }}
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
              NEXT · SECTION {Math.min(currentSectionNumber + 1, totalSections)} OF {totalSections}
            </span>
            <span style={{ fontSize: '13.5px' }}>
              {nextSectionTitle ? `${nextSectionTitle} →` : 'Continue Reading →'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
