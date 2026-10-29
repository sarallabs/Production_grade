import { useEffect, useMemo, useRef, useState } from 'react';
import { getManifest, getResourceContent, getChapterExamQuestions, type DifficultyLevel, type Manifest } from '@/data/contentRepository';
import { parseQuestionBankMarkdown, ensureQuestionMark, type QuestionBankEntry } from '@/utils/questionBankParser';
import MarkdownView from './MarkdownView';

interface QuestionBankViewProps {
  persona: DifficultyLevel;
  currentSubjectId?: string;
  currentChapterNumber?: number;
}

type MarkTier = 'short' | 'long' | 'ten';

export default function QuestionBankView({
  persona,
  currentSubjectId,
  currentChapterNumber,
}: QuestionBankViewProps) {
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedChapters, setSelectedChapters] = useState<Record<string, number[]>>({});
  const [appliedSubjects, setAppliedSubjects] = useState<string[]>([]);
  const [appliedChapters, setAppliedChapters] = useState<Record<string, number[]>>({});
  const [questions, setQuestions] = useState<QuestionBankEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [revealedCards, setRevealedCards] = useState<Record<string, boolean>>({});
  const [answerModes, setAnswerModes] = useState<Record<string, MarkTier>>({});
  const [globalMark, setGlobalMark] = useState<'all' | MarkTier>('all');

  // Interactive "Hide answer & try first" state per question card
  const [tryFirstMode, setTryFirstMode] = useState<Record<string, boolean>>({});
  const [tryFirstDrafts, setTryFirstDrafts] = useState<Record<string, string>>({});
  const [tryFirstCompared, setTryFirstCompared] = useState<Record<string, boolean>>({});

  const visibleSubjects = useMemo(() => {
    if (!manifest) return [];
    return manifest.subjects;
  }, [manifest]);

  useEffect(() => {
    getManifest()
      .then((m) => setManifest(m))
      .catch(() => setManifest({ subjects: [], resourceTabs: [] }));
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

  const loadQuestions = async (subjectsToLoad: string[], chaptersToLoad: Record<string, number[]>) => {
    if (!manifest) return;
    setLoading(true);
    const requested: Promise<QuestionBankEntry[]>[] = [];

    for (const subjectId of subjectsToLoad) {
      const subject =
        visibleSubjects.find((s) => s.id === subjectId) ??
        manifest.subjects.find((s) => s.id === subjectId);
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
                const parsed = parseQuestionBankMarkdown(
                  markdown,
                  subjectId,
                  subject.name,
                  chapterNumber,
                  chapterLabel,
                );
                if (parsed.length > 0) return parsed;
              }
              try {
                const jsonText = await getResourceContent(
                  subjectId,
                  chapterNumber,
                  'question_bank.json',
                  persona,
                );
                if (jsonText && jsonText.trim().length > 0 && !jsonText.includes('Content not available')) {
                  const parsedJson = parseQuestionBankMarkdown(
                    jsonText,
                    subjectId,
                    subject.name,
                    chapterNumber,
                    chapterLabel,
                  );
                  if (parsedJson.length > 0) return parsedJson;
                }
              } catch {}
              const pooled = await getChapterExamQuestions(subjectId, chapterNumber, 'certification');
              return pooled.map((q, idx): QuestionBankEntry => ({
                id: `cert-${subjectId}-${chapterNumber}-${idx}`,
                subjectId,
                subjectName: subject.name,
                chapterNumber,
                chapterName: chapterLabel,
                question: ensureQuestionMark(q.q),
                shortAnswer: (Array.isArray((q as any).answer) ? (q as any).answer : [(q as any).answer])
                  .map((i: any) => ((q as any).options ? (q as any).options[i as number] : String(i ?? '')))
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

  // Assign each question a primary mark bucket so the filter pills (2 Marks, 5 Marks, 10 Marks)
  // show a realistic exam distribution (e.g. 6 / 5 / 4 for 15 questions) and filter cleanly.
  const questionPrimaryTier = useMemo(() => {
    const map: Record<string, MarkTier> = {};
    const total = questions.length;
    if (total === 0) return map;

    const shortCut = Math.ceil(total * 0.4); // e.g. 6 of 15
    const longCut = shortCut + Math.round(total * 0.333); // e.g. 6 + 5 = 11 of 15

    questions.forEach((q, idx) => {
      const has2 = Boolean(q.shortAnswer);
      const has5 = Boolean(q.longAnswer);
      const has10 = Boolean(q.tenMarkAnswer);

      // If a question only has one specific tier, honor it; otherwise distribute across 2M / 5M / 10M
      if (has10 && !has2 && !has5) {
        map[q.id] = 'ten';
      } else if (has5 && !has2 && !has10) {
        map[q.id] = 'long';
      } else if (has2 && !has5 && !has10) {
        map[q.id] = 'short';
      } else {
        if (idx < shortCut) map[q.id] = 'short';
        else if (idx < longCut) map[q.id] = has5 ? 'long' : 'short';
        else map[q.id] = has10 ? 'ten' : has5 ? 'long' : 'short';
      }
    });
    return map;
  }, [questions]);

  const tierCounts = useMemo(() => {
    let shortCount = 0;
    let longCount = 0;
    let tenCount = 0;
    questions.forEach((q) => {
      const t = questionPrimaryTier[q.id] ?? 'short';
      if (t === 'short') shortCount++;
      else if (t === 'long') longCount++;
      else if (t === 'ten') tenCount++;
    });
    return {
      all: questions.length,
      short: shortCount,
      long: longCount,
      ten: tenCount,
    };
  }, [questions, questionPrimaryTier]);

  const filteredQuestions = useMemo(() => {
    if (globalMark === 'all') return questions;
    return questions.filter((q) => questionPrimaryTier[q.id] === globalMark);
  }, [questions, globalMark, questionPrimaryTier]);

  // By default, open the first question in the list; in 'all' view, default Card 01 to 5M ('long') if available
  useEffect(() => {
    if (filteredQuestions.length > 0) {
      const first = filteredQuestions[0];
      setRevealedCards({ [first.id]: true });
      setAnswerModes((prev) => {
        const next = { ...prev };
        if (globalMark === 'all') {
          if (!next[first.id]) {
            next[first.id] = first.longAnswer ? 'long' : 'short';
          }
        } else {
          filteredQuestions.forEach((q) => {
            if (globalMark === 'ten' && q.tenMarkAnswer) next[q.id] = 'ten';
            else if (globalMark === 'long' && q.longAnswer) next[q.id] = 'long';
            else next[q.id] = 'short';
          });
        }
        return next;
      });
    } else {
      setRevealedCards({});
    }
  }, [filteredQuestions, globalMark]);

  const toggleReveal = (id: string) => {
    setRevealedCards((prev) => (prev[id] ? {} : { [id]: true }));
  };

  const handleSelectCardMode = (id: string, mode: MarkTier) => {
    setAnswerModes((prev) => ({ ...prev, [id]: mode }));
    setRevealedCards((prev) => {
      const currentMode = answerModes[id] ?? 'short';
      const isCurrentlyRevealed = prev[id] ?? false;
      if (currentMode === mode && isCurrentlyRevealed) {
        return {};
      }
      return { [id]: true };
    });
  };

  const handleGlobalMarkChange = (mark: 'all' | MarkTier) => {
    setGlobalMark(mark);
    if (mark !== 'all') {
      const updatedModes: Record<string, MarkTier> = {};
      questions.forEach((q) => {
        if (mark === 'ten' && q.tenMarkAnswer) updatedModes[q.id] = 'ten';
        else if (mark === 'long' && q.longAnswer) updatedModes[q.id] = 'long';
        else updatedModes[q.id] = 'short';
      });
      setAnswerModes((prev) => ({ ...prev, ...updatedModes }));
    }
  };

  const toggleTryFirst = (id: string) => {
    setTryFirstMode((prev) => {
      const nextVal = !prev[id];
      if (!nextVal) {
        setTryFirstCompared((c) => ({ ...c, [id]: false }));
      }
      return { ...prev, [id]: nextVal };
    });
  };

  const qbankContainerRef = useRef<HTMLDivElement>(null);

  if (!manifest) {
    return (
      <div style={{ padding: '48px 36px', background: '#FAF8F3', minHeight: '100%', color: '#5A655E', fontSize: '14px' }}>
        Loading question bank…
      </div>
    );
  }

  const activeChapterNum = currentChapterNumber || questions[0]?.chapterNumber || 1;

  return (
    <div
      className="qbank-root"
      ref={qbankContainerRef}
      style={{
        background: '#FAF8F3',
        minHeight: '100%',
        width: '100%',
        padding: '22px 36px 56px',
        boxSizing: 'border-box',
        fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif",
      }}
    >
      <style>{`
        .qbank-question-title p {
          margin: 0 !important;
          display: inline;
        }
        .qbank-answer-body {
          font-size: 13.5px;
          line-height: 1.62;
          color: #2B352E;
        }
        .qbank-answer-body p {
          margin: 0 0 12px 0;
        }
        .qbank-answer-body p:last-child {
          margin-bottom: 0;
        }
        .qbank-answer-body strong {
          font-weight: 700;
          color: #1E2822;
          border-bottom: 1.5px dotted #B89146;
          padding-bottom: 1px;
        }
        .qbank-answer-body h1,
        .qbank-answer-body h2,
        .qbank-answer-body h3,
        .qbank-answer-body h4 {
          font-family: 'Fraunces', 'Georgia', serif;
          color: #1E2822;
          margin: 16px 0 8px 0;
          font-size: 15px;
          font-weight: 700;
        }
        .qbank-answer-body ul,
        .qbank-answer-body ol {
          margin: 8px 0 12px 0;
          padding-left: 20px;
        }
        .qbank-answer-body li {
          margin-bottom: 6px;
        }
        /* Rich Table Styling matching mockup */
        .qbank-answer-body table {
          width: 100%;
          border-collapse: collapse;
          margin: 14px 0 10px 0;
          border-radius: 6px;
          overflow: hidden;
          font-size: 12.8px;
          border: 1px solid #E5DFD3;
        }
        .qbank-answer-body thead tr {
          background: #233329 !important;
          color: #FFFFFF !important;
        }
        .qbank-answer-body thead th {
          background: #233329 !important;
          color: #FFFFFF !important;
          font-weight: 700 !important;
          text-align: left !important;
          padding: 10px 14px !important;
          font-size: 12px !important;
          letter-spacing: 0.01em;
          border: none !important;
        }
        .qbank-answer-body thead th strong {
          color: #FFFFFF !important;
          border-bottom: none !important;
        }
        .qbank-answer-body tbody tr:nth-child(odd) {
          background: #F5F1E6 !important;
        }
        .qbank-answer-body tbody tr:nth-child(even) {
          background: #FFFFFF !important;
        }
        .qbank-answer-body tbody td {
          padding: 11px 14px !important;
          border-bottom: 1px solid #EAE4D7 !important;
          color: #2C3730 !important;
          vertical-align: top !important;
          line-height: 1.48 !important;
        }
        .qbank-answer-body tbody td:first-child {
          font-weight: 700 !important;
          color: #1E2822 !important;
          width: 18%;
          white-space: nowrap;
        }
        .qbank-answer-body tbody td strong {
          border-bottom: none !important;
        }
      `}</style>

      <div style={{ maxWidth: '1160px', margin: '0 auto', width: '100%' }}>
        {/* ── Header Title & Inline Subtitle ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: '12px',
            flexWrap: 'wrap',
            marginBottom: '12px',
          }}
        >
          <h1
            style={{
              fontFamily: "'Fraunces', 'Georgia', serif",
              fontSize: '26px',
              fontWeight: 700,
              color: '#1E2822',
              margin: 0,
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
            }}
          >
            Question Bank
          </h1>
          {questions.length > 0 && (
            <span
              style={{
                fontSize: '12.5px',
                fontWeight: 600,
                color: '#647068',
              }}
            >
              {questions.length} {questions.length === 1 ? 'question' : 'questions'}
            </span>
          )}
        </div>

        {/* ── Filter Pills Row (All · 15 | 2 Marks · 6 | 5 Marks · 5 | 10 Marks · 4 | Chapter 1) ── */}
        {questions.length > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexWrap: 'wrap',
              marginBottom: '18px',
            }}
          >
            {(
              [
                { key: 'all' as const, label: `All · ${tierCounts.all}` },
                { key: 'short' as const, label: `2 Marks · ${tierCounts.short}` },
                { key: 'long' as const, label: `5 Marks · ${tierCounts.long}` },
                { key: 'ten' as const, label: `10 Marks · ${tierCounts.ten}` },
              ] as const
            ).map((pill) => {
              const active = globalMark === pill.key;
              return (
                <button
                  key={pill.key}
                  type="button"
                  onClick={() => handleGlobalMarkChange(pill.key)}
                  style={{
                    padding: '5px 14px',
                    borderRadius: '999px',
                    fontSize: '12px',
                    fontWeight: active ? 700 : 600,
                    cursor: 'pointer',
                    background: active ? '#E7B864' : '#FAF8F3',
                    color: active ? '#18221D' : '#4A544E',
                    border: active ? '1px solid #D4A34F' : '1px solid #DFD9CC',
                    boxShadow: active ? '0 1px 4px rgba(212, 155, 75, 0.22)' : 'none',
                    transition: 'all 0.16s ease',
                  }}
                >
                  {pill.label}
                </button>
              );
            })}

            {/* Chapter indicator pill */}
            <span
              style={{
                padding: '5px 14px',
                borderRadius: '999px',
                fontSize: '12px',
                fontWeight: 600,
                background: '#FAF8F3',
                color: '#4A544E',
                border: '1px solid #DFD9CC',
              }}
            >
              Chapter {activeChapterNum}
            </span>
          </div>
        )}

        {/* ── Question Cards List ── */}
        {loading ? (
          <div
            style={{
              padding: '48px 24px',
              textAlign: 'center',
              color: '#647068',
              fontSize: '14px',
              background: '#FFFFFF',
              borderRadius: '14px',
              border: '1px solid #E6E0D4',
            }}
          >
            Loading question bank…
          </div>
        ) : questions.length === 0 && appliedSubjects.length > 0 ? (
          <div
            style={{
              padding: '48px 24px',
              textAlign: 'center',
              color: '#647068',
              fontSize: '14px',
              background: '#FFFFFF',
              borderRadius: '14px',
              border: '1px solid #E6E0D4',
            }}
          >
            No question bank entries were found for this chapter.
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div
            style={{
              padding: '36px 24px',
              textAlign: 'center',
              color: '#647068',
              fontSize: '14px',
              background: '#FFFFFF',
              borderRadius: '14px',
              border: '1px solid #E6E0D4',
            }}
          >
            No questions in this mark filter. Click &ldquo;All&rdquo; to view all questions.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {filteredQuestions.map((entry, index) => {
              const modeOptions: { key: MarkTier; label: string }[] = [
                { key: 'short', label: '2M' },
                { key: 'long', label: '5M' },
                ...(entry.tenMarkAnswer ? [{ key: 'ten' as const, label: '10M' }] : [{ key: 'ten' as const, label: '10M' }]),
              ];
              const defaultMode: MarkTier =
                index === 0 && globalMark === 'all' && entry.longAnswer
                  ? 'long'
                  : globalMark !== 'all'
                  ? globalMark
                  : 'short';
              const mode: MarkTier = answerModes[entry.id] ?? defaultMode;
              const isRevealed = revealedCards[entry.id] ?? false;

              const shownAnswer =
                (mode === 'ten' && (entry.tenMarkAnswer || entry.longAnswer || entry.shortAnswer)) ||
                (mode === 'long' && (entry.longAnswer || entry.shortAnswer)) ||
                entry.shortAnswer ||
                entry.longAnswer ||
                entry.tenMarkAnswer ||
                '';

              const cleanChapName = (entry.chapterName || '')
                .replace(/^(Chapter|Unit)\s*\d+\s*[:·\-–—]?\s*/i, '')
                .trim();

              const isTryingFirst = Boolean(tryFirstMode[entry.id]);
              const isCompared = Boolean(tryFirstCompared[entry.id]);
              const modeLabelLong = mode === 'ten' ? '10-mark' : mode === 'long' ? '5-mark' : '2-mark';
              const examBudgetText =
                mode === 'ten'
                  ? '15–18 minutes of writing time for this question'
                  : mode === 'long'
                  ? '8–10 minutes of writing time for this question'
                  : '2–3 minutes of writing time for this question';

              return (
                <div
                  key={entry.id}
                  onClick={() => toggleReveal(entry.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleReveal(entry.id);
                    }
                  }}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #E5DFD3',
                    borderRadius: '14px',
                    padding: isRevealed ? '20px 24px 18px' : '16px 24px',
                    boxShadow: '0 2px 8px rgba(30, 40, 34, 0.03)',
                    cursor: 'pointer',
                    transition: 'border-color 0.18s ease, box-shadow 0.18s ease',
                  }}
                >
                  {/* ── Card Top Header: Number + Question + Right Controls ── */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: isRevealed ? 'flex-start' : 'center',
                      justifyContent: 'space-between',
                      gap: '18px',
                    }}
                  >
                    {/* Left: Number + Question text */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '14px',
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "'Fraunces', 'Georgia', serif",
                          fontSize: '18px',
                          fontWeight: 700,
                          color: '#4F6A5A',
                          fontVariantNumeric: 'tabular-nums',
                          lineHeight: 1.35,
                          flexShrink: 0,
                          minWidth: '26px',
                        }}
                      >
                        {String(index + 1).padStart(2, '0')}
                      </span>

                      <div
                        className="qbank-question-title"
                        style={{
                          flex: 1,
                          minWidth: 0,
                          fontSize: '15px',
                          fontWeight: 700,
                          color: '#1E2822',
                          lineHeight: 1.45,
                        }}
                      >
                        <MarkdownView content={ensureQuestionMark(entry.question)} />
                      </div>
                    </div>

                    {/* Right: 2M | 5M | 10M Segmented Control + Chapter Badge */}
                    <div
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        display: 'flex',
                        flexDirection: isRevealed ? 'column' : 'row',
                        alignItems: isRevealed ? 'flex-end' : 'center',
                        gap: isRevealed ? '6px' : '8px',
                        flexShrink: 0,
                      }}
                    >
                      {/* Segmented 2M | 5M | 10M box */}
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          background: '#FAF8F3',
                          border: '1px solid #E2DDD2',
                          borderRadius: '8px',
                          overflow: 'hidden',
                        }}
                      >
                        {modeOptions.map((opt, optIdx) => {
                          const isCurrentMode = mode === opt.key;
                          return (
                            <button
                              key={opt.key}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectCardMode(entry.id, opt.key);
                              }}
                              title={`View ${opt.label} model answer`}
                              style={{
                                border: 'none',
                                borderLeft: optIdx > 0 ? '1px solid #E6E1D6' : 'none',
                                cursor: 'pointer',
                                padding: '5px 11px',
                                fontSize: '11px',
                                fontWeight: isCurrentMode ? 800 : 600,
                                background: isCurrentMode ? '#E7B864' : 'transparent',
                                color: isCurrentMode ? '#18221D' : '#5A655E',
                                transition: 'all 0.15s ease',
                              }}
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>

                      {/* Chapter badge pill */}
                      <span
                        style={{
                          background: '#EFF3F0',
                          color: '#526358',
                          borderRadius: '999px',
                          padding: isRevealed ? '3px 10px' : '4px 11px',
                          fontSize: '10.5px',
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                          maxWidth: isRevealed ? '260px' : '120px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {isRevealed && cleanChapName
                          ? `Chapter ${entry.chapterNumber} · ${cleanChapName}`
                          : `Chapter ${entry.chapterNumber}`}
                      </span>
                    </div>
                  </div>

                  {/* ── Expanded Answer Section ── */}
                  {isRevealed && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        marginTop: '14px',
                        cursor: 'default',
                      }}
                    >
                      {/* "Attempt before you read" Dashed Callout Box */}
                      <div
                        style={{
                          background: '#FDF9F1',
                          border: '1.5px dashed #DFC28F',
                          borderRadius: '10px',
                          padding: '10px 16px',
                          marginBottom: '14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '16px',
                          flexWrap: 'wrap',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '15px', lineHeight: 1 }} aria-hidden="true">
                            ✍️
                          </span>
                          <div>
                            <div
                              style={{
                                fontSize: '12.5px',
                                fontWeight: 700,
                                color: '#4A3210',
                                lineHeight: 1.3,
                              }}
                            >
                              Attempt before you read
                            </div>
                            <div
                              style={{
                                fontSize: '11.5px',
                                color: '#8C6D3F',
                                lineHeight: 1.35,
                              }}
                            >
                              Hide the answer, write your own {modeLabelLong} version, then compare.
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleTryFirst(entry.id)}
                          style={{
                            background: '#D49B4B',
                            color: '#1E2822',
                            border: 'none',
                            borderRadius: '999px',
                            padding: '6px 14px',
                            fontSize: '11.5px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            flexShrink: 0,
                            transition: 'filter 0.15s ease',
                          }}
                        >
                          {isTryingFirst ? 'Show answer directly' : 'Hide answer & try first'}
                        </button>
                      </div>

                      {/* Interactive Try-First Scratchpad (when user clicks "Hide answer & try first") */}
                      {isTryingFirst && (
                        <div
                          style={{
                            background: '#FAF8F3',
                            border: '1px solid #E5DFD3',
                            borderRadius: '10px',
                            padding: '12px 14px',
                            marginBottom: '14px',
                          }}
                        >
                          <div
                            style={{
                              fontSize: '11.5px',
                              fontWeight: 700,
                              color: '#4F6A5A',
                              marginBottom: '6px',
                              textTransform: 'uppercase',
                              letterSpacing: '0.04em',
                            }}
                          >
                            Your {modeLabelLong} Attempt
                          </div>
                          <textarea
                            value={tryFirstDrafts[entry.id] ?? ''}
                            onChange={(e) =>
                              setTryFirstDrafts((prev) => ({ ...prev, [entry.id]: e.target.value }))
                            }
                            placeholder={`Write your ${modeLabelLong} answer here before revealing the model answer...`}
                            rows={4}
                            style={{
                              width: '100%',
                              boxSizing: 'border-box',
                              borderRadius: '8px',
                              border: '1px solid #DCD5C7',
                              background: '#FFFFFF',
                              padding: '10px 12px',
                              fontSize: '13px',
                              lineHeight: 1.5,
                              color: '#1E2822',
                              fontFamily: 'inherit',
                              resize: 'vertical',
                              outline: 'none',
                            }}
                          />
                          {!isCompared && (
                            <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'flex-end' }}>
                              <button
                                type="button"
                                onClick={() =>
                                  setTryFirstCompared((prev) => ({ ...prev, [entry.id]: true }))
                                }
                                style={{
                                  background: '#233329',
                                  color: '#FFFFFF',
                                  border: 'none',
                                  borderRadius: '999px',
                                  padding: '6px 14px',
                                  fontSize: '11.5px',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                }}
                              >
                                Reveal model answer &amp; compare
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Model Answer Body (visible unless hidden by try-first before compare) */}
                      {(!isTryingFirst || isCompared) && (
                        <>
                          <div className="qbank-answer-body">
                            <MarkdownView content={shownAnswer} />
                          </div>

                          {/* Footer Exam Budget */}
                          <div
                            style={{
                              marginTop: '14px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              fontSize: '11.5px',
                              fontWeight: 600,
                              color: '#B86B35',
                            }}
                          >
                            <svg
                              width="13"
                              height="13"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <circle cx="12" cy="12" r="10" />
                              <polyline points="12 6 12 12 16 14" />
                            </svg>
                            <span>Exam budget · {examBudgetText}</span>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
