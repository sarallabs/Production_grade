import { useEffect, useState, useCallback } from 'react';
import { Link, useParams, useSearchParams, useNavigate } from 'react-router-dom';
import {
  getManifest,
  getResourceTabs,
  getResourceContent,
  getFlashcards,
  getChapterVideos,
  SHARED_RESOURCE_FILES,
  DIFFICULTY_LEVELS,
  type DifficultyLevel,
} from '@/data/contentRepository';
import MarkdownView from '@/components/MarkdownView';
import JsMindView from '@/components/JsMindView';
import FlashcardsView from '@/components/FlashcardsView';
import { useFocusMode, FOCUS_STEP_LABELS } from '@/context/FocusModeContext';
import { AssessmentView } from '@/components/study/AssessmentView';

export default function ResourceTabs() {
  const { subjectId, chapterNumber } = useParams<{ subjectId: string; chapterNumber: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialTabFile = searchParams.get('tab');
  const initialLevelStr = searchParams.get('level');

  const {
    isFocusModeActive,
    currentStepIndex,
    flowSteps,
    returnUrl,
    nextStep,
    quitFocusMode,
  } = useFocusMode();

  const [chapterName, setChapterName] = useState('');
  const [tabs, setTabs] = useState<[string, string][]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [level, setLevel] = useState<DifficultyLevel>(
    DIFFICULTY_LEVELS.includes(initialLevelStr as DifficultyLevel)
      ? (initialLevelStr as DifficultyLevel)
      : 'intermediate'
  );
  const [content, setContent] = useState<string | null>(null);
  const [flashcards, setFlashcards] = useState<{ front: string; back: string }[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const chNum  = chapterNumber ? parseInt(chapterNumber, 10) : 0;
  const subject = subjectId ?? 'english';

  // Load manifest + chapter name + tabs once
  useEffect(() => {
    if (!subjectId || !chapterNumber) return;

    // Check if the user has paid for this subject/course
    const hasPaid = localStorage.getItem(`registered_${subjectId}`) === 'true';
    if (!hasPaid) {
      navigate(`/course/${subjectId}`);
      return;
    }

    getManifest().then((m) => {
      const resourceTabs = getResourceTabs(m);
      setTabs(resourceTabs);

      if (!isFocusModeActive && initialTabFile) {
        const index = resourceTabs.findIndex(([f]) => f === initialTabFile);
        if (index !== -1) setActiveTab(index);
      }

      const sub = m.subjects.find((s) => s.id === subjectId);
      const ch  = sub?.chapters.find((c) => c.number === chNum);
      setChapterName(ch?.name ?? `Chapter ${chNum}`);
      setLoading(false);
    });
  }, [subjectId, chapterNumber, chNum, initialTabFile, isFocusModeActive, navigate]);

  const [videoDir, setVideoDir] = useState<string | undefined>(undefined);
  const videoParam = searchParams.get('video');

  useEffect(() => {
    if (!subject || !chNum) return;
    getChapterVideos(subject, chNum).then((videos) => {
      if (videos && videos.length > 0) {
        const vIdx = Math.max(1, parseInt(videoParam || '1', 10) || 1);
        const v = videos.find((item) => item.index === vIdx) ?? videos[0];
        setVideoDir(v?.dir);
      } else {
        setVideoDir(undefined);
      }
    });
  }, [subject, chNum, videoParam]);

  // Resolve which resource file to display
  const activeFile = isFocusModeActive && currentStepIndex > 0
    ? (flowSteps[currentStepIndex] as string)
    : (tabs[activeTab]?.[0] ?? 'summary.md');

  const isQuizOrAssessment = activeFile === 'quiz.md' || activeFile === 'assessment.md';

  // Fetch content whenever the active file or level changes
  const fetchContent = useCallback(() => {
    if (!subjectId || !chapterNumber || tabs.length === 0) return;
    // Don't fetch on welcome step
    if (isFocusModeActive && currentStepIndex === 0) return;

    const file = isFocusModeActive && currentStepIndex > 0
      ? (flowSteps[currentStepIndex] as string)
      : (tabs[activeTab]?.[0] ?? 'summary.md');

    setContent(null);
    setFlashcards(null);
    setError(null);

    if (file === 'flashcards') {
      getFlashcards(subject, chNum, level, videoDir).then(setFlashcards);
    } else {
      getResourceContent(subject, chNum, file, level, videoDir)
        .then(setContent)
        .catch((e) => setError(String(e)));
    }
  }, [subjectId, chapterNumber, chNum, tabs, activeTab, level, subject, videoDir, isFocusModeActive, currentStepIndex, flowSteps]);

  useEffect(fetchContent, [fetchContent]);

  const handleQuit = () => {
    quitFocusMode();
    navigate(returnUrl);
  };

  const handleContinue = () => {
    if (currentStepIndex >= flowSteps.length - 1) {
      quitFocusMode();
      navigate(returnUrl);
    } else {
      nextStep();
    }
  };

  // ── Focus mode: welcome screen (step 0) ──────────────────────────────────
  if (isFocusModeActive && currentStepIndex === 0) {
    const displayName = chapterName || `Chapter ${chNum}`;
    return (
      <div className="fm-welcome-screen">
        <button className="fm-quit-corner" onClick={handleQuit}>✕ Quit</button>
        <div className="fm-welcome-card">
          <div className="fm-welcome-icon">🎯</div>
          <h1 className="fm-welcome-title">Welcome to Focus Mode</h1>
          <p className="fm-welcome-chapter">{displayName} · {subjectName(subject)}</p>
          <div className="fm-welcome-flow">
            <span className="fm-flow-step">Quick Study</span>
            <span className="fm-flow-arrow">→</span>
            <span className="fm-flow-step">Detailed Notes</span>
            <span className="fm-flow-arrow">→</span>
            <span className="fm-flow-step">Flashcards</span>
            <span className="fm-flow-arrow">→</span>
            <span className="fm-flow-step">Assessment</span>
          </div>
          <button className="fm-start-btn" onClick={handleContinue}>
            Start Quick Study →
          </button>
        </div>
      </div>
    );
  }

  if (loading) return <div className="page"><p>Loading…</p></div>;

  const isMindmap = activeFile === 'mindmap.md' && (content?.includes('```mermaid') || content?.trim().startsWith('{'));
  const isShared  = SHARED_RESOURCE_FILES.has(activeFile);

  const parseDetailedHeadings = (markdown: string) => {
    const lines = markdown.split('\n');
    const headings: { text: string }[] = [];
    for (const line of lines) {
      const match = line.match(/^(#{3,4})\s+(.+)$/);
      if (match) {
        let text = match[2].trim().replace(/\*+/g, '');
        if (text.toLowerCase().includes('concept') || text.toLowerCase().includes('overview') || text.toLowerCase().includes('definition')) {
          headings.push({ text });
        }
      }
    }
    return headings;
  };

  const detailedHeadings = activeFile === 'detailed_view.md' && typeof content === 'string' ? parseDetailedHeadings(content) : [];

  const handleMindmapTopicClick = (topicId: string, topicName: string) => {
    const detailedIndex = tabs.findIndex(t => t[0] === 'detailed_view.md');
    if (detailedIndex !== -1) {
      setActiveTab(detailedIndex);
      setTimeout(() => {
        const headings = Array.from(document.querySelectorAll('.markdown-view h1, .markdown-view h2, .markdown-view h3, .markdown-view h4, .markdown-view h5, .markdown-view h6'));
        const cleanName = topicName.replace(/[^\w\s-]/g, '').trim().toLowerCase();
        const target = domHeadingsFind(headings, cleanName);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          target.classList.add('heading-highlight-flash');
          setTimeout(() => target.classList.remove('heading-highlight-flash'), 2000);
        }
      }, 300);
    } else {
      setActiveTab(0);
    }
  };

  function domHeadingsFind(headings: Element[], name: string) {
    return headings.find(h => {
      const text = h.textContent?.replace(/[^\w\s-]/g, '').trim().toLowerCase() || "";
      return text.includes(name) || name.includes(text);
    });
  }

  // ── Focus mode: active study screen (steps 1–4) ──────────────────────────
  if (isFocusModeActive && currentStepIndex > 0) {
    const isLastStep  = currentStepIndex >= flowSteps.length - 1;
    const stepLabel   = FOCUS_STEP_LABELS[currentStepIndex] ?? '';
    const totalSteps  = flowSteps.length - 1;

    return (
      <div className="fm-active-screen">
        {/* Header */}
        <div className="fm-active-header">
          <div className="fm-header-left">
            <span className="fm-header-chapter">{chapterName}</span>
            <span className="fm-header-sep">·</span>
            <span className="fm-header-step">{stepLabel}</span>
            <span className="fm-header-progress">{currentStepIndex}/{totalSteps}</span>
          </div>
          <button className="fm-quit-btn" onClick={handleQuit}>✕ Quit Focus Mode</button>
        </div>

        {/* Progress bar */}
        <div className="fm-progress-track">
          <div
            className="fm-progress-fill"
            style={{ width: `${(currentStepIndex / totalSteps) * 100}%` }}
          />
        </div>

        {/* Content */}
        <div className="fm-active-content">
          {error && <p className="fm-error-msg">{error}</p>}
          <style>{`
            @keyframes highlightFlash {
              0% { background-color: rgba(255, 235, 59, 0.6); }
              100% { background-color: transparent; }
            }
            .heading-highlight-flash {
              animation: highlightFlash 2s ease-out;
              border-radius: 4px;
              padding: 2px 6px;
            }
          `}</style>
          {activeFile === 'flashcards' && flashcards !== null && (
            <FlashcardsView cards={flashcards} />
          )}
          {isQuizOrAssessment && content !== null && (
            <AssessmentView
              markdownContent={content}
              subjectId={subject}
              chapterNumber={chNum}
              persona={level}
              onQuit={() => setActiveTab(0)}
            />
          )}
          {activeFile !== 'flashcards' && !isQuizOrAssessment && content !== null && isMindmap && (
            <JsMindView content={content} onTopicClick={handleMindmapTopicClick} />
          )}
          {activeFile !== 'flashcards' && !isQuizOrAssessment && content !== null && !isMindmap && (
            <div className="fm-markdown-wrapper">
              {activeFile === 'detailed_view.md' && detailedHeadings.length > 0 && (
                <div className="detailed-nav-header" style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--border)',
                  background: 'var(--surface-variant, #f5f7fb)',
                  alignItems: 'center',
                  position: 'sticky',
                  top: 0,
                  zIndex: 10,
                  marginBottom: '16px',
                  borderRadius: '8px'
                }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Jump to:</span>
                  {detailedHeadings.map((h, idx) => (
                    <button
                      key={idx}
                      className="detailed-nav-btn"
                      onClick={() => {
                        const cleanName = h.text.replace(/[^\w\s-]/g, '').trim().toLowerCase();
                        const domHeadings = Array.from(document.querySelectorAll('.markdown-view h1, .markdown-view h2, .markdown-view h3, .markdown-view h4, .markdown-view h5, .markdown-view h6'));
                        const target = domHeadingsFind(domHeadings, cleanName);
                        if (target) {
                          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          target.classList.add('heading-highlight-flash');
                          setTimeout(() => target.classList.remove('heading-highlight-flash'), 2000);
                        }
                      }}
                      style={{
                        padding: '6px 12px',
                        fontSize: '0.8rem',
                        borderRadius: '16px',
                        border: '1px solid var(--border)',
                        cursor: 'pointer',
                        backgroundColor: 'var(--background, #fff)',
                        color: 'var(--primary, #6200ee)',
                        fontWeight: 500,
                        transition: 'all 0.2s'
                      }}
                    >
                      {h.text}
                    </button>
                  ))}
                </div>
              )}
              <MarkdownView content={content} />
            </div>
          )}
          {activeFile !== 'flashcards' && content === null && !error && (
            <p className="fm-loading-msg">Loading content…</p>
          )}
        </div>

        {/* Footer — hidden during quiz (AssessmentView has its own continue flow) */}
        {!isQuizOrAssessment && (
          <div className="fm-active-footer">
            <button className="fm-continue-btn" onClick={handleContinue}>
              {isLastStep ? 'Finish & Return ✓' : `Continue to ${FOCUS_STEP_LABELS[currentStepIndex + 1] ?? 'Next'} →`}
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── Normal (non-focus-mode) view ─────────────────────────────────────────
  return (
    <div className="page resource-tabs">
      <div className="resource-tabs-header">
        <Link to={`/subjects/${subjectId}`} className="back-link">← Back to chapters</Link>
        <h1>{chapterName}</h1>
        <p className="subtitle">{subjectName(subject)} • Chapter {chNum}</p>
      </div>

      {/* ── Difficulty level selector ── */}
      <div className="level-selector" title={isShared ? 'This resource is the same for all levels' : undefined}>
        {DIFFICULTY_LEVELS.map((lvl) => (
          <button
            key={lvl}
            className={`level-pill ${lvl === level ? 'active' : ''} ${isShared ? 'dimmed' : ''}`}
            onClick={() => !isShared && setLevel(lvl)}
            aria-pressed={lvl === level}
            aria-disabled={isShared}
          >
            {lvl.charAt(0).toUpperCase() + lvl.slice(1)}
          </button>
        ))}
        {isShared && (
          <span className="level-shared-note">Same for all levels</span>
        )}
      </div>

      {/* ── Tabs ── */}
      <div className="tabs-row">
        {tabs.map(([, label], i) => (
          <button
            key={i}
            className={`tab ${i === activeTab ? 'active' : ''}`}
            onClick={() => setActiveTab(i)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      <div className="tab-content">
        {error && <p className="error">{error}</p>}
        {activeFile === 'flashcards' && flashcards !== null && (
          <FlashcardsView cards={flashcards} />
        )}
        {isQuizOrAssessment && content !== null && (
          <AssessmentView
            markdownContent={content}
            subjectId={subject}
            chapterNumber={chNum}
            persona={level}
            onQuit={() => setActiveTab(0)}
          />
        )}
        {activeFile !== 'flashcards' && !isQuizOrAssessment && content !== null && isMindmap && (
          <JsMindView content={content} onTopicClick={handleMindmapTopicClick} />
        )}
        {activeFile !== 'flashcards' && !isQuizOrAssessment && content !== null && !isMindmap && (
          <div>
            <style>{`
              @keyframes highlightFlash {
                0% { background-color: rgba(255, 235, 59, 0.6); }
                100% { background-color: transparent; }
              }
              .heading-highlight-flash {
                animation: highlightFlash 2s ease-out;
                border-radius: 4px;
                padding: 2px 6px;
              }
            `}</style>
            {activeFile === 'detailed_view.md' && detailedHeadings.length > 0 && (
              <div className="detailed-nav-header" style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                padding: '12px 16px',
                borderBottom: '1px solid var(--border)',
                background: 'var(--surface-variant, #f5f7fb)',
                alignItems: 'center',
                position: 'sticky',
                top: 0,
                zIndex: 10,
                marginBottom: '16px',
                borderRadius: '8px'
              }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Jump to:</span>
                {detailedHeadings.map((h, idx) => (
                  <button
                    key={idx}
                    className="detailed-nav-btn"
                    onClick={() => {
                      const cleanName = h.text.replace(/[^\w\s-]/g, '').trim().toLowerCase();
                      const domHeadings = Array.from(document.querySelectorAll('.markdown-view h1, .markdown-view h2, .markdown-view h3, .markdown-view h4, .markdown-view h5, .markdown-view h6'));
                      const target = domHeadingsFind(domHeadings, cleanName);
                      if (target) {
                        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        target.classList.add('heading-highlight-flash');
                        setTimeout(() => target.classList.remove('heading-highlight-flash'), 2000);
                      }
                    }}
                    style={{
                      padding: '6px 12px',
                      fontSize: '0.8rem',
                      borderRadius: '16px',
                      border: '1px solid var(--border)',
                      cursor: 'pointer',
                      backgroundColor: 'var(--background, #fff)',
                      color: 'var(--primary, #6200ee)',
                      fontWeight: 500,
                      transition: 'all 0.2s'
                    }}
                  >
                    {h.text}
                  </button>
                ))}
              </div>
            )}
            <MarkdownView content={content} />
          </div>
        )}
        {activeFile !== 'flashcards' && content === null && !error && <p>Loading…</p>}
      </div>
    </div>
  );
}

function subjectName(id: string) {
  return id.charAt(0).toUpperCase() + id.slice(1);
}
