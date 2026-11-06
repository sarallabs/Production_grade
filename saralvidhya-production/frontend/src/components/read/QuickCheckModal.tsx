import React, { useState } from 'react';
import { QuickCheckQuestion, QuickCheckEvaluationResult } from '../../api/client';
import './QuickCheckModal.css';

interface QuickCheckModalProps {
  isOpen: boolean;
  question?: QuickCheckQuestion;
  nextSectionTitle?: string;
  nextSectionNumber?: number;
  totalSections?: number;
  subjectName?: string;
  onClose: () => void;
  onSubmitAnswer: (selectedKey: string) => Promise<QuickCheckEvaluationResult>;
  onAdvanceToNextSection: () => void;
  onBackToChapterList?: () => void;
}

export const QuickCheckModal: React.FC<QuickCheckModalProps> = ({
  isOpen,
  question,
  nextSectionTitle = 'Chamber by Chamber',
  nextSectionNumber = 2,
  totalSections = 5,
  subjectName = 'Entomology',
  onClose,
  onSubmitAnswer,
  onAdvanceToNextSection,
  onBackToChapterList,
}) => {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evalResult, setEvalResult] = useState<QuickCheckEvaluationResult | null>(null);

  if (!isOpen || !question) return null;

  const handleSelectOption = async (key: string) => {
    if (isSubmitting || (evalResult && evalResult.isCorrect)) return;

    setSelectedKey(key);
    setIsSubmitting(true);

    try {
      const result = await onSubmitAnswer(key);
      setEvalResult(result);
    } catch (err) {
      console.error('[QuickCheckModal] Evaluation failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdvance = () => {
    onAdvanceToNextSection();
    // Reset state for next section
    setSelectedKey(null);
    setEvalResult(null);
    onClose();
  };

  return (
    <div className="quick-check-overlay" onClick={onClose}>
      <div className="quick-check-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Purple Header */}
        <div className="quick-check-header">
          <span className="quick-check-tag">QUICK CHECK · 1 OF 1</span>
        </div>

        {/* Question Stem */}
        <h2 className="quick-check-stem">{question.stem}</h2>

        {/* 3 Options */}
        <div className="quick-check-options-list">
          {question.options.map((opt) => {
            const isSelected = selectedKey === opt.key;
            let statusClass = '';

            if (evalResult) {
              if (opt.key === evalResult.correctKey) {
                statusClass = 'correct';
              } else if (isSelected && !evalResult.isCorrect) {
                statusClass = 'incorrect';
              }
            } else if (isSelected) {
              statusClass = 'selected';
            }

            return (
              <button
                key={opt.key}
                className={`quick-check-option-btn ${statusClass}`}
                onClick={() => handleSelectOption(opt.key)}
                disabled={isSubmitting || (evalResult?.isCorrect ?? false)}
              >
                <span className="option-text">{opt.text}</span>
              </button>
            );
          })}
        </div>

        {/* Pedagogical Rationale Feedback Banner */}
        {evalResult && (
          <div className={`quick-check-feedback-banner ${evalResult.isCorrect ? 'banner-correct' : 'banner-incorrect'}`}>
            <div className="feedback-status-row">
              <span className="feedback-badge">{evalResult.isCorrect ? '✅ Well Done!' : '⚠️ Review Needed'}</span>
              {evalResult.keyTakeaway && (
                <span className="feedback-takeaway">{evalResult.keyTakeaway}</span>
              )}
            </div>
            <p className="feedback-rationale-text">{evalResult.rationale}</p>
          </div>
        )}

        {/* Footer Action Bar */}
        <footer className="quick-check-modal-footer">
          {/* Left Action: Back */}
          <button
            className="footer-back-btn"
            onClick={onBackToChapterList || onClose}
          >
            <span className="btn-subtext">← BACK</span>
            <span className="btn-maintext">Chapter list · {subjectName}</span>
          </button>

          {/* Right Action: Next Section (Advances & Unlocks) */}
          <button
            className={`footer-next-btn ${evalResult?.isCorrect ? 'enabled' : 'disabled'}`}
            onClick={handleAdvance}
            disabled={!evalResult?.isCorrect}
            title={evalResult?.isCorrect ? 'Proceed to next section' : 'Answer correctly to unlock next section'}
          >
            <span className="btn-subtext">NEXT · SECTION {nextSectionNumber} OF {totalSections}</span>
            <span className="btn-maintext">{nextSectionTitle} →</span>
          </button>
        </footer>
      </div>
    </div>
  );
};
