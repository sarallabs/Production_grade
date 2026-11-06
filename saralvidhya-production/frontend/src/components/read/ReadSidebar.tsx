import React from 'react';
import { SectionSummary } from '../../api/client';
import './ReadSidebar.css';

interface ReadSidebarProps {
  sections: SectionSummary[];
  activeSectionId: string;
  resumedText?: string;
  chapterProgressPercent?: number;
  onSelectSection: (sectionId: string) => void;
  onSelectSubtopic?: (anchorId: string) => void;
}

export const ReadSidebar: React.FC<ReadSidebarProps> = ({
  sections,
  activeSectionId,
  resumedText = 'Resumed where you left off · 2h ago',
  chapterProgressPercent = 20,
  onSelectSection,
  onSelectSubtopic,
}) => {
  return (
    <aside className="read-sidebar">
      {/* Resumed Banner */}
      {resumedText && (
        <div className="resume-badge">
          <svg className="resume-clock-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span>{resumedText}</span>
        </div>
      )}

      {/* Title */}
      <h2 className="sidebar-heading">IN THIS CHAPTER</h2>

      {/* Sections List */}
      <nav className="section-list">
        {sections.map((section) => {
          const isActive = section.sectionId === activeSectionId;
          const isCompleted = section.status === 'completed';
          const isLocked = section.status === 'locked' || section.isLocked;

          return (
            <div key={section.sectionId} className="section-group">
              <button
                className={`section-item ${isActive ? 'active' : ''} ${isLocked ? 'locked' : ''} ${isCompleted ? 'completed' : ''}`}
                onClick={() => !isLocked && onSelectSection(section.sectionId)}
                disabled={isLocked}
                title={isLocked ? 'Complete the previous section quick check to unlock' : section.title}
              >
                {/* State Icon */}
                <span className="status-icon-wrapper">
                  {isCompleted || isActive ? (
                    <span className="check-icon-circle">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                  ) : isLocked ? (
                    <span className="lock-icon">
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                      </svg>
                    </span>
                  ) : (
                    <span className="empty-circle-icon" />
                  )}
                </span>

                {/* Section Title */}
                <span className="section-title-text">{section.title}</span>
              </button>

              {/* Google Docs-Style Collapsible Subtopics (Visible when section is active) */}
              {isActive && section.subtopics && section.subtopics.length > 0 && (
                <div className="subtopic-outline-list">
                  {section.subtopics.map((sub) => (
                    <button
                      key={sub.anchorId}
                      className="subtopic-outline-item"
                      onClick={() => onSelectSubtopic?.(sub.anchorId)}
                      title={`Jump to ${sub.title}`}
                    >
                      <span className="subtopic-bullet">•</span>
                      <span className="subtopic-text">{sub.title}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Progress Footer */}
      <div className="sidebar-progress-footer">
        <div className="progress-labels">
          <span className="progress-caption">Chapter progress</span>
          <span className="progress-value">{chapterProgressPercent}%</span>
        </div>
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{ width: `${Math.min(100, Math.max(0, chapterProgressPercent))}%` }}
          />
        </div>
      </div>
    </aside>
  );
};
