import React from 'react';
import './GlobalLearningNav.css';

interface GlobalLearningNavProps {
  activePillar?: 'read' | 'listen' | 'watch' | 'revise' | 'assessment' | 'question_bank' | 'pyq' | 'exam' | 'study_plan' | 'mindmap' | 'takeaways' | 'ask_me';
  onNavigate?: (tab: string) => void;
  onExit?: () => void;
}

export const GlobalLearningNav: React.FC<GlobalLearningNavProps> = ({
  activePillar = 'read',
  onNavigate,
  onExit,
}) => {
  return (
    <header className="global-learning-nav">
      {/* Brand Tree Logo */}
      <div className="nav-brand" onClick={() => onNavigate?.('home')} role="button" tabIndex={0}>
        <svg className="brand-tree-icon" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 36V22" stroke="#8D6E63" strokeWidth="3" strokeLinecap="round"/>
          <path d="M20 28C17 26 14 27 12 29" stroke="#8D6E63" strokeWidth="2.5" strokeLinecap="round"/>
          <path d="M20 25C23 23 26 24 28 26" stroke="#8D6E63" strokeWidth="2.5" strokeLinecap="round"/>
          {/* Leaves */}
          <circle cx="12" cy="14" r="5" fill="#A5D6A7"/>
          <circle cx="20" cy="10" r="6" fill="#81C784"/>
          <circle cx="28" cy="14" r="5" fill="#A5D6A7"/>
          <circle cx="15" cy="19" r="4.5" fill="#66BB6A"/>
          <circle cx="25" cy="19" r="4.5" fill="#66BB6A"/>
          <circle cx="20" cy="16" r="5" fill="#4CAF50"/>
        </svg>
      </div>

      {/* 4 Learning Clusters */}
      <div className="nav-clusters">
        {/* Cluster 1: Learn */}
        <div className="cluster-box cluster-learn">
          <span className="cluster-badge badge-learn">Learn</span>
          <div className="cluster-items">
            <button
              className={`cluster-item ${activePillar === 'read' ? 'active-green' : ''}`}
              onClick={() => onNavigate?.('read')}
              title="Read Curriculum"
            >
              <svg className="cluster-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
              </svg>
              <span>Read</span>
            </button>
            <button
              className={`cluster-item ${activePillar === 'listen' ? 'active' : ''}`}
              onClick={() => onNavigate?.('listen')}
              title="Listen to Podcasts"
            >
              <svg className="cluster-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 18v-6a9 9 0 0 1 18 0v6"/>
                <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>
              </svg>
              <span>Listen</span>
            </button>
            <button
              className={`cluster-item ${activePillar === 'watch' ? 'active' : ''}`}
              onClick={() => onNavigate?.('watch')}
              title="Watch Micro-Lectures"
            >
              <svg className="cluster-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="4" width="20" height="16" rx="2.18"/>
                <polygon points="10 8 16 12 10 16 10 8" fill="currentColor"/>
              </svg>
              <span>Watch</span>
            </button>
          </div>
        </div>

        {/* Cluster 2: Practice */}
        <div className="cluster-box cluster-practice">
          <span className="cluster-badge badge-practice">Practice</span>
          <div className="cluster-items">
            <button
              className={`cluster-item ${activePillar === 'revise' ? 'active' : ''}`}
              onClick={() => onNavigate?.('revise')}
              title="Flashcards & Revision"
            >
              <svg className="cluster-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                <rect x="8" y="2" width="8" height="4" rx="1"/>
                <path d="M9 14l2 2 4-4"/>
              </svg>
              <span>Revise</span>
            </button>
            <button
              className={`cluster-item ${activePillar === 'assessment' ? 'active' : ''}`}
              onClick={() => onNavigate?.('assessment')}
              title="Self-Assessment Quizzes"
            >
              <svg className="cluster-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="9" y1="15" x2="15" y2="15"/>
              </svg>
              <span>Assessment</span>
            </button>
            <button
              className={`cluster-item ${activePillar === 'question_bank' ? 'active' : ''}`}
              onClick={() => onNavigate?.('question_bank')}
              title="University Question Bank"
            >
              <svg className="cluster-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <span>Question Bank</span>
            </button>
          </div>
        </div>

        {/* Cluster 3: Prepare */}
        <div className="cluster-box cluster-prepare">
          <span className="cluster-badge badge-prepare">Prepare</span>
          <div className="cluster-items">
            <button
              className={`cluster-item ${activePillar === 'pyq' ? 'active' : ''}`}
              onClick={() => onNavigate?.('pyq')}
              title="Previous Year Questions"
            >
              <svg className="cluster-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <path d="M14 2v6h6"/>
                <text x="8" y="16" fontSize="7" fontWeight="bold" fill="currentColor">PYQ</text>
              </svg>
              <span>PYQ</span>
            </button>
            <button
              className={`cluster-item ${activePillar === 'exam' ? 'active' : ''}`}
              onClick={() => onNavigate?.('exam')}
              title="Mock & Certification Exam"
            >
              <svg className="cluster-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              <span>Preparation Exam</span>
            </button>
            <button
              className={`cluster-item ${activePillar === 'study_plan' ? 'active' : ''}`}
              onClick={() => onNavigate?.('study_plan')}
              title="Personalized Study Plan"
            >
              <svg className="cluster-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
              </svg>
              <span>Study plan</span>
            </button>
          </div>
        </div>

        {/* Cluster 4: Resources */}
        <div className="cluster-box cluster-resources">
          <span className="cluster-badge badge-resources">Resources</span>
          <div className="cluster-items">
            <button
              className={`cluster-item ${activePillar === 'mindmap' ? 'active' : ''}`}
              onClick={() => onNavigate?.('mindmap')}
              title="Hierarchical Mindmaps"
            >
              <svg className="cluster-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="18" cy="5" r="3"/>
                <circle cx="6" cy="12" r="3"/>
                <circle cx="18" cy="19" r="3"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
              </svg>
              <span>Mindmaps</span>
            </button>
            <button
              className={`cluster-item ${activePillar === 'takeaways' ? 'active' : ''}`}
              onClick={() => onNavigate?.('takeaways')}
              title="Key Takeaways"
            >
              <svg className="cluster-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              <span>Key Takeaways</span>
            </button>
            <button
              className={`cluster-item ${activePillar === 'ask_me' ? 'active' : ''}`}
              onClick={() => onNavigate?.('ask_me')}
              title="Ask Gemini AI Tutor"
            >
              <svg className="cluster-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
              </svg>
              <span>Ask me</span>
            </button>
          </div>
        </div>
      </div>

      {/* Exit Button */}
      <div className="nav-exit">
        <button className="exit-btn" onClick={onExit} title="Exit Workspace">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>
      </div>
    </header>
  );
};
