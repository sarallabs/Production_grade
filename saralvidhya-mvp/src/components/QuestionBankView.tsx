import { useEffect, useMemo, useRef, useState } from 'react';
import { getManifest, getResourceContent, getChapterExamQuestions, type DifficultyLevel, type Manifest } from '@/data/contentRepository';
import { parseQuestionBankMarkdown, type QuestionBankEntry } from '@/utils/questionBankParser';
import MarkdownView from './MarkdownView';

// ── Forest Green palette ────────────────────────────────────────────────────
const G = {
  dark:       '#2D3E36',
  mid:        '#4F7B64',
  light:      '#7BA88B',
  pale:       '#EEF5F1',
  paleBorder: '#B2CFC2',
  paleBg:     '#f7fbf9',
} as const;
// ────────────────────────────────────────────────────────────────────────────

interface QuestionBankViewProps {
  persona: DifficultyLevel;
  currentSubjectId?: string;
  currentChapterNumber?: number;
}

const SUBJECT_LABEL_OVERRIDES: Record<string, string> = {
  pubadm_ur: 'Public Administration (Urdu)',
};

function _formatSubjectLabel(subjectName: string, subjectId: string) {
  if (SUBJECT_LABEL_OVERRIDES[subjectId]) return SUBJECT_LABEL_OVERRIDES[subjectId];
  if (!subjectName) return subjectId.replace(/_/g, ' ');
  return subjectName.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function QuestionBankView({ 
  persona, 
  currentSubjectId, 
  currentChapterNumber
}: QuestionBankViewProps) {
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedChapters, setSelectedChapters] = useState<Record<string, number[]>>({});
  const [appliedSubjects, setAppliedSubjects] = useState<string[]>([]);
  const [appliedChapters, setAppliedChapters] = useState<Record<string, number[]>>({});
  const [questions, setQuestions] = useState<QuestionBankEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  const visibleSubjects = useMemo(() => {
    if (!manifest) return [];
    return manifest.subjects;
  }, [manifest]);

  useEffect(() => {
    getManifest().then((m) => setManifest(m)).catch(() => setManifest({ subjects: [], resourceTabs: [] }));
  }, []);

  useEffect(() => {
    if (!manifest) return;
    
    if (currentSubjectId && currentChapterNumber) {
      const subId = currentSubjectId;
      const chNum = currentChapterNumber;
      setSelectedSubjects([subId]);
      setSelectedChapters({ [subId]: [chNum] });
      setAppliedSubjects([subId]);
      setAppliedChapters({ [subId]: [chNum] });
      loadQuestions([subId], { [subId]: [chNum] });
      return;
    }
    
    const defaultSubjects = visibleSubjects.map((subject) => subject.id);
    const defaultChapters = visibleSubjects.reduce<Record<string, number[]>>((acc, subject) => {
      acc[subject.id] = subject.chapters.map((chapter) => chapter.number);
      return acc;
    }, {});
    setSelectedSubjects(defaultSubjects);
    setSelectedChapters(defaultChapters);
  }, [manifest, visibleSubjects, currentSubjectId, currentChapterNumber]);

  const selectedCount = useMemo(
    () => Object.values(appliedChapters).reduce((sum, list) => sum + list.length, 0),
    [appliedChapters],
  );

  const focusedMode = Boolean(currentSubjectId);
  const focusedSubject = useMemo(() => {
    if (!focusedMode) return null;
    return visibleSubjects.find((s) => s.id === currentSubjectId) ?? manifest?.subjects.find((s) => s.id === currentSubjectId) ?? null;
  }, [focusedMode, visibleSubjects, currentSubjectId, manifest]);

  const loadQuestions = async (subjectsToLoad: string[], chaptersToLoad: Record<string, number[]>) => {
    if (!manifest) return;
    setLoading(true);
    const requested: Promise<QuestionBankEntry[]>[] = [];

    for (const subjectId of subjectsToLoad) {
      const subject = visibleSubjects.find((s) => s.id === subjectId) ?? manifest.subjects.find((s) => s.id === subjectId);
      if (!subject) continue;
      const chapters = chaptersToLoad[subjectId] ?? [];
      if (chapters.length === 0) continue;
      for (const chapterNumber of chapters) {
        const chapterLabel =
          subject.chapters.find((c) => c.number === chapterNumber)?.name ?? `Chapter ${chapterNumber}`;
        requested.push(
          getResourceContent(subjectId, chapterNumber, 'question_bank.md', persona)
            .then(async (markdown) => {
              if (markdown && markdown.trim().length > 0 && !markdown.includes('Content not available')) {
                const parsed = parseQuestionBankMarkdown(markdown, subjectId, subject.name, chapterNumber, chapterLabel);
                if (parsed.length > 0) return parsed;
              }
              const pooled = await getChapterExamQuestions(subjectId, chapterNumber, 'certification');
              return pooled.map((q, idx): QuestionBankEntry => ({
                id: `cert-${subjectId}-${chapterNumber}-${idx}`,
                subjectId,
                subjectName: subject.name,
                chapterNumber,
                chapterName: chapterLabel,
                question: q.q,
                shortAnswer: (Array.isArray((q as any).answer) ? (q as any).answer : [(q as any).answer])
                  .map((i: any) => (q as any).options ? (q as any).options[i as number] : String(i ?? ''))
                  .filter(Boolean)
                  .join('; '),
                longAnswer: q.explanation || '',
              }));
            })
            .catch(() => []),
        );
      }
    }

    const results = (await Promise.all(requested)).flat();
    setQuestions(results);
    setLoading(false);
  };

  const toggleChapter = (subjectId: string, chapterNumber: number) => {
    setSelectedChapters((prev) => {
      const current = prev[subjectId] ?? [];
      const nextList = current.includes(chapterNumber)
        ? current.filter((n) => n !== chapterNumber)
        : [...current, chapterNumber];
      return { ...prev, [subjectId]: nextList };
    });
  };

  const toggleCardFlip = (id: string) => {
    setExpandedCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const qbankContainerRef = useRef<HTMLDivElement>(null);

  const handleGo = () => {
    setAppliedSubjects(selectedSubjects);
    setAppliedChapters(selectedChapters);
    loadQuestions(selectedSubjects, selectedChapters);
  };

  if (!manifest) {
    return <div className="loading-state">Loading question bank…</div>;
  }

  return (
    <div className="qbank-root" ref={qbankContainerRef}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '40px', flexWrap: 'wrap', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flex: 1, minWidth: '300px' }}>
          {/* Icon badge */}
          <div style={{
            background: `linear-gradient(135deg, ${G.mid} 0%, ${G.dark} 100%)`,
            borderRadius: '16px',
            width: '72px',
            height: '72px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 8px 16px rgba(47,79,64,0.28)`,
            position: 'relative',
            border: `3px solid ${G.paleBorder}`
          }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 700, color: G.dark, margin: 0 }}>Question Bank</h1>
        </div>

        {focusedSubject && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', flex: 1, minWidth: '300px' }}>
              <div className="qbank-simple-chapter-row" style={{ gap: '12px', display: 'flex' }}>
                {focusedSubject.chapters.map((chapter) => {
                  const selected = (selectedChapters[focusedSubject.id] ?? []).includes(chapter.number);
                  return (
                    <button
                      key={`${focusedSubject.id}-${chapter.number}`}
                      onClick={() => toggleChapter(focusedSubject.id, chapter.number)}
                      className={`qbank-simple-chapter-pill ${selected ? 'active' : ''}`}
                      style={{
                        width: '32px',
                        height: '32px',
                        minWidth: '32px',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '8px',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        border: `1px solid ${selected ? 'transparent' : G.paleBorder}`,
                        background: selected ? `linear-gradient(135deg, ${G.mid}, ${G.dark})` : G.pale,
                        color: selected ? 'white' : G.dark,
                        boxShadow: selected ? `0 4px 8px rgba(47,79,64,0.28)` : 'none',
                        transition: 'all 0.18s ease',
                      }}
                    >
                      {chapter.number}
                    </button>
                  );
                })}
              </div>
              <button 
                type="button" 
                onClick={handleGo} 
                disabled={loading || (selectedChapters[focusedSubject.id] ?? []).length === 0}
                style={{
                  background: loading || (selectedChapters[focusedSubject.id] ?? []).length === 0
                    ? G.pale
                    : `linear-gradient(135deg, ${G.mid}, ${G.dark})`,
                  color: loading || (selectedChapters[focusedSubject.id] ?? []).length === 0 ? G.light : 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '6px 20px',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: (loading || (selectedChapters[focusedSubject.id] ?? []).length === 0) ? 'not-allowed' : 'pointer',
                  opacity: (loading || (selectedChapters[focusedSubject.id] ?? []).length === 0) ? 0.7 : 1,
                  boxShadow: `0 2px 8px rgba(47,79,64,0.2)`,
                  transition: 'all 0.18s ease',
                }}
              >
                {loading ? '...' : 'Go'}
              </button>
            </div>
            <div style={{ flex: 1, minWidth: '300px' }}></div>
          </>
        )}
      </div>

      {!focusedSubject && selectedSubjects.length > 0 ? (
        <div className="qbank-section" style={{ marginBottom: '40px' }}>
          <div className="qbank-section-label" style={{ marginBottom: '16px', fontWeight: 600, color: G.dark }}>Chapter selection for chosen subjects</div>
          <div className="qbank-card-grid">
            {selectedSubjects.map((subjectId) => {
              const subject = visibleSubjects.find((s) => s.id === subjectId) ?? manifest.subjects.find((s) => s.id === subjectId);
              if (!subject) return null;
              const selectedChapterIds = selectedChapters[subjectId] ?? [];
              return (
                <div key={subject.id} className="qbank-card" style={{ marginBottom: '16px' }}>
                  <div style={{ fontWeight: 600, marginBottom: '8px', color: G.dark }}>{subject.name}</div>
                  <div className="qbank-chip-row" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {subject.chapters.map((chapter) => {
                      const selected = selectedChapterIds.includes(chapter.number);
                      return (
                        <button
                          key={`${subject.id}-${chapter.number}`}
                          onClick={() => toggleChapter(subject.id, chapter.number)}
                          style={{
                            width: '32px',
                            height: '32px',
                            padding: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '8px',
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            border: `1px solid ${selected ? 'transparent' : G.paleBorder}`,
                            background: selected ? `linear-gradient(135deg, ${G.mid}, ${G.dark})` : G.pale,
                            color: selected ? 'white' : G.dark,
                            cursor: 'pointer',
                            transition: 'all 0.18s ease',
                          }}
                        >
                          {chapter.number}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="qbank-go-row">
            <button 
              type="button" 
              onClick={handleGo} 
              disabled={loading || selectedSubjects.length === 0}
              style={{
                background: loading || selectedSubjects.length === 0
                  ? G.pale
                  : `linear-gradient(135deg, ${G.mid}, ${G.dark})`,
                color: loading || selectedSubjects.length === 0 ? G.light : 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 24px',
                fontSize: '0.95rem',
                fontWeight: 600,
                cursor: (loading || selectedSubjects.length === 0) ? 'not-allowed' : 'pointer',
                boxShadow: `0 4px 12px rgba(47,79,64,0.22)`,
                transition: 'all 0.18s ease',
              }}
            >
              {loading ? 'Loading...' : 'Go'}
            </button>
          </div>
        </div>
      ) : (
        <div style={{ marginBottom: '24px', color: '#6B7280' }}>Select subjects to see chapters and load question bank content.</div>
      )}

      {loading ? (
        <div className="loading-state">Loading selected question bank content…</div>
      ) : questions.length === 0 && appliedSubjects.length > 0 ? (
        <div className="qbank-empty">
          No question bank entries were found for the selected subjects and chapters.
        </div>
      ) : questions.length === 0 ? (
        <div className="qbank-empty">
          Select chapters and click Go to load questions.
        </div>
      ) : (
        <div className="qbank-card-list">
          {questions.map((entry, index) => {
            const flipped = expandedCards[entry.id] ?? false;
            
            return (
              <div key={entry.id} className="qbank-simple-question-card">
                {/* Left side: Number */}
                <div style={{ flexShrink: 0, width: '48px', display: 'flex', justifyContent: 'center' }}>
                  <span style={{
                    fontSize: '1.75rem',
                    fontWeight: 700,
                    color: G.mid,
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                    {String(index + 1).padStart(2, '0')}
                  </span>
                </div>

                {/* Right side: Content */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  {/* Top: Question & Tags */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div style={{ flex: 1, fontSize: '1.15rem', fontWeight: 500, color: '#111', lineHeight: 1.55 }}>
                      <MarkdownView content={entry.question} />
                    </div>
                    <div style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'flex-end',
                      marginLeft: '24px',
                      fontSize: '0.78rem',
                      color: G.mid,
                      fontWeight: 600,
                      flexShrink: 0,
                      gap: '4px',
                    }}>
                      <span style={{
                        background: G.pale,
                        border: `1px solid ${G.paleBorder}`,
                        borderRadius: '999px',
                        padding: '2px 10px',
                        whiteSpace: 'nowrap',
                        color: G.dark,
                      }}>Ch {entry.chapterNumber}</span>
                      {entry.chapterName && (
                        <span style={{
                          background: G.pale,
                          border: `1px solid ${G.paleBorder}`,
                          borderRadius: '999px',
                          padding: '2px 10px',
                          whiteSpace: 'nowrap',
                          color: G.mid,
                          maxWidth: '140px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}>{entry.chapterName}</span>
                      )}
                    </div>
                  </div>

                  {/* Bottom: Answer & Eye Icon */}
                  <div style={{ 
                    paddingTop: '16px', 
                    borderTop: `1px solid ${G.paleBorder}`, 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-end',
                    position: 'relative'
                  }}>
                    <div style={{ flex: 1, fontSize: '1.05rem', color: '#1e293b', lineHeight: 1.6 }}>
                      <MarkdownView 
                        content={(flipped && entry.longAnswer) ? entry.longAnswer : (entry.shortAnswer || entry.longAnswer || '')} 
                      />
                    </div>
                    {entry.shortAnswer && entry.longAnswer && (
                      <button
                        onClick={() => toggleCardFlip(entry.id)}
                        title={flipped ? 'Show short answer' : 'Show detailed answer'}
                        style={{
                          background: flipped ? G.pale : 'white',
                          border: `1px solid ${G.paleBorder}`,
                          borderRadius: '8px',
                          width: '32px',
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          marginLeft: '16px',
                          flexShrink: 0,
                          alignSelf: 'center',
                          transition: 'background 0.18s ease',
                        }}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={G.mid} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
