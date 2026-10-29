import React, { useState, useEffect, useRef } from "react";
import MarkdownView from "@/components/MarkdownView";
import { getAssessments } from "@/data/contentRepository";
import { parseQuestionBank } from "@/utils/quizParser";
import { type AssessmentQuestion } from "@/utils/assessmentTypes";
import { StudyToolLoadingWaitScreen } from "@/pages/StudyTable";
import { cloudStorage } from "@/context/CloudStateContext";

/**
 * AssessmentView Component
 * Renders the assessment view for answering various types of questions.
 */
export function AssessmentView({
  markdownContent,
  subjectId,
  chapterNumber,
  chapterName,
  persona,
  onQuit,
  setPersona,
  setActiveTool,
  videoDir,
}: {
  markdownContent: string;
  subjectId: string;
  chapterNumber: number;
  chapterName?: string;
  persona: string;
  onQuit: () => void;
  setPersona?: (p: string) => void;
  setActiveTool?: (t: any) => void;
  /** Video-scoped asset directory in a segmented chapter. */
  videoDir?: string;
}) {
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const [showExplanation, setShowExplanation] = useState(false);
  const [answered, setAnswered] = useState<boolean[]>([]);
  const autoNextTimeoutRef = useRef<any>(null);
  const cardTopRef = useRef<HTMLDivElement | null>(null);
  const footerRef = useRef<HTMLDivElement | null>(null);

  // User input states for active question
  const [submitted, setSubmitted] = useState(false);
  const [currentIsCorrect, setCurrentIsCorrect] = useState<boolean | null>(null);

  const [retriesUsed, setRetriesUsed] = useState<Record<number, number>>({});
  const [awaitingRetry, setAwaitingRetry] = useState(false);
  const [disabledMCQByStep, setDisabledMCQByStep] = useState<Record<number, number[]>>({});
  const [disabledTFByStep, setDisabledTFByStep] = useState<Record<number, boolean[]>>({});
  // Question-specific interaction states
  const [selectedMCQ, setSelectedMCQ] = useState<number | null>(null);
  const [selectedMSQ, setSelectedMSQ] = useState<number[]>([]);
  const [selectedTF, setSelectedTF] = useState<boolean | null>(null);
  const [fillInputs, setFillInputs] = useState<string[]>([]);
  const [activeBlankIndex, setActiveBlankIndex] = useState<number | null>(0);
  const [fillChoices, setFillChoices] = useState<string[]>([]);
  const [matchSelections, setMatchSelections] = useState<Record<string, string>>({}); // LHS -> RHS
  const [selectedLHS, setSelectedLHS] = useState<string | null>(null);
  const [sequencedItems, setSequencedItems] = useState<string[]>([]);
  const [labelSelections, setLabelSelections] = useState<Record<string, string>>({}); // Label ID -> user option

  // Load questions dynamically from the backend, filtered by the active persona.
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    getAssessments(subjectId, chapterNumber, persona as any, videoDir).then((fetchedQuestions) => {
      if (!isMounted) return;
      let validQuestions = fetchedQuestions.filter(
        (q) => q.type === "mcq" || q.type === "msq"
      );

      // Fallback: If fetchedQuestions fails or returns only the 1-question mock,
      // and we have markdownContent (like quiz.md), parse it manually!
      if ((validQuestions.length <= 4) && markdownContent) {
        const parsed = parseQuestionBank(markdownContent);
        if (parsed.length > 0) {
          validQuestions = parsed.map((pq, idx) => ({
            id: `markdown_q_${idx}`,
            type: "mcq",
            q: pq.q,
            options: pq.options,
            answer: pq.answer,
            explanation: pq.explanation,
          })) as any;
        }
      }

      setQuestions(validQuestions);
      const storageKey = `sv_assessment_state_${subjectId}_ch${chapterNumber}_${persona}${videoDir ? `_${videoDir}` : ""}`;
      let restored = false;
      try {
        const raw = cloudStorage.getItem(storageKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.questionCount === validQuestions.length && validQuestions.length > 0) {
            setStep(Math.min(Math.max(0, parsed.step || 0), validQuestions.length - 1));
            setScore(parsed.score || 0);
            setIsFinished(Boolean(parsed.isFinished));
            setAnswered(
              Array.isArray(parsed.answered) && parsed.answered.length === validQuestions.length
                ? parsed.answered
                : new Array(validQuestions.length).fill(false)
            );
            setRetriesUsed(parsed.retriesUsed || {});
            setDisabledMCQByStep(parsed.disabledMCQByStep || {});
            setDisabledTFByStep(parsed.disabledTFByStep || {});
            restored = true;
          }
        }
      } catch {}
      if (!restored) {
        setStep(0);
        setScore(0);
        setIsFinished(false);
        setAnswered(new Array(validQuestions.length).fill(false));
        setRetriesUsed({});
        setDisabledMCQByStep({});
        setDisabledTFByStep({});
      }
      setAwaitingRetry(false);
      setLoading(false);
    });

    return () => { isMounted = false; };
  }, [subjectId, chapterNumber, persona, markdownContent, videoDir]);

  const assessmentStorageKey = `sv_assessment_state_${subjectId}_ch${chapterNumber}_${persona}${videoDir ? `_${videoDir}` : ""}`;

  useEffect(() => {
    return cloudStorage.subscribe(() => {
      if (loading || questions.length === 0) return;
      try {
        const raw = cloudStorage.getItem(assessmentStorageKey);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (parsed && parsed.questionCount === questions.length) {
          setStep((prevStep) => {
            if (prevStep === 0 && score === 0 && !answered.some(Boolean) && !isFinished) {
              setScore(parsed.score || 0);
              setIsFinished(Boolean(parsed.isFinished));
              if (Array.isArray(parsed.answered) && parsed.answered.length === questions.length) {
                setAnswered(parsed.answered);
              }
              setRetriesUsed(parsed.retriesUsed || {});
              setDisabledMCQByStep(parsed.disabledMCQByStep || {});
              setDisabledTFByStep(parsed.disabledTFByStep || {});
              return Math.min(Math.max(0, parsed.step || 0), questions.length - 1);
            }
            return prevStep;
          });
        }
      } catch {}
    });
  }, [assessmentStorageKey, loading, questions.length, score, answered, isFinished]);

  useEffect(() => {
    if (loading || questions.length === 0) return;
    try {
      cloudStorage.setItem(
        assessmentStorageKey,
        JSON.stringify({
          questionCount: questions.length,
          step,
          score,
          isFinished,
          answered,
          retriesUsed,
          disabledMCQByStep,
          disabledTFByStep,
        })
      );
    } catch {}
  }, [assessmentStorageKey, loading, questions.length, step, score, isFinished, answered, retriesUsed, disabledMCQByStep, disabledTFByStep]);

  // Reset inputs when step changes
  useEffect(() => {
    if (autoNextTimeoutRef.current) {
      clearTimeout(autoNextTimeoutRef.current);
      autoNextTimeoutRef.current = null;
    }
    if (questions.length === 0) return;
    const currentQ = questions[step];
    setSubmitted(false);
    setCurrentIsCorrect(null);
    setSelectedMCQ(null);
    setSelectedMSQ([]);
    setSelectedTF(null);
    setShowExplanation(false);
    setAwaitingRetry(false);
    setTimeout(() => {
      cardTopRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 30);

    if (currentQ.type === "fill_blanks") {
      setFillInputs(new Array(currentQ.correctAnswers.length).fill(""));
      setActiveBlankIndex(0);
      const choices = [...currentQ.correctAnswers];
      choices.forEach((c) => {
        const lower = c.toLowerCase();
        if (lower === "sell" && !choices.includes("buy")) choices.push("buy");
        if (lower === "short" && !choices.includes("long")) choices.push("long");
        if (lower === "buy" && !choices.includes("sell")) choices.push("sell");
        if (lower === "long" && !choices.includes("short")) choices.push("short");
      });
      const uniqueChoices = Array.from(new Set(choices));
      setFillChoices(uniqueChoices.sort(() => 0.5 - Math.random()));
    } else if (currentQ.type === "match_following") {
      setMatchSelections({});
      setSelectedLHS(null);
    } else if (currentQ.type === "sequencing") {
      // Shuffle sequencing items initially to give a challenge
      setSequencedItems([...currentQ.items].sort(() => 0.5 - Math.random()));
    } else if (currentQ.type === "labelling") {
      setLabelSelections({});
    }
  }, [step, questions]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isFinished || loading || showExplanation) return;
      if (e.key === "ArrowLeft") {
        handlePrevious();
      } else if (e.key === "ArrowRight") {
        if (submitted) handleNext();
        else handleSkip();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (autoNextTimeoutRef.current) {
        clearTimeout(autoNextTimeoutRef.current);
        autoNextTimeoutRef.current = null;
      }
    };
  }, [step, submitted, isFinished, loading, showExplanation, questions.length]);

  const handleNext = () => {
    setShowExplanation(false);
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      setIsFinished(true);
    }
  };

  const handlePrevious = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleSkip = () => {
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      setIsFinished(true);
    }
  };

  const handleTryAgainAssessment = () => {
    if (selectedMCQ !== null) {
      setDisabledMCQByStep((prev) => {
        const existing = prev[step] || [];
        return existing.includes(selectedMCQ) ? prev : { ...prev, [step]: [...existing, selectedMCQ] };
      });
    }
    if (selectedTF !== null) {
      setDisabledTFByStep((prev) => {
        const existing = prev[step] || [];
        return existing.includes(selectedTF) ? prev : { ...prev, [step]: [...existing, selectedTF] };
      });
    }
    setRetriesUsed((prev) => ({ ...prev, [step]: (prev[step] || 0) + 1 }));
    setAwaitingRetry(false);
    setSubmitted(false);
    setCurrentIsCorrect(null);
    setSelectedMCQ(null);
    setSelectedMSQ([]);
    setSelectedTF(null);
  };

  const markQuestionAnswered = (isAnswerCorrect: boolean) => {
    const used = retriesUsed[step] || 0;
    if (!isAnswerCorrect && used < 1) {
      setSubmitted(true);
      setCurrentIsCorrect(false);
      setAwaitingRetry(true);
      setTimeout(() => {
        footerRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 60);
      return;
    }

    setAwaitingRetry(false);
    setSubmitted(true);
    setCurrentIsCorrect(isAnswerCorrect);
    setAnswered((prev) => {
      const next = [...prev];
      if (!next[step]) {
        if (isAnswerCorrect) {
          setScore((s) => s + 1);
        }
        next[step] = true;
      }
      return next;
    });
    setTimeout(() => {
      footerRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 60);
  };

  // --- MCQ handlers ---
  const handleMCQSelect = (idx: number) => {
    if (submitted) return;
    if ((disabledMCQByStep[step] || []).includes(idx)) return;
    setSelectedMCQ(idx);
    const correct = idx === currentQ.answer;
    markQuestionAnswered(correct);
  };

  // --- MSQ handlers ---
  const handleMSQToggle = (idx: number) => {
    if (submitted) return;
    setSelectedMSQ((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const handleMSQSubmit = () => {
    if (submitted) return;
    const currentQ = questions[step] as any;
    const userAnswers = [...selectedMSQ].sort();
    const correctAnswers = [...currentQ.answer].sort();
    const isCorrect =
      userAnswers.length === correctAnswers.length &&
      userAnswers.every((val, index) => val === correctAnswers[index]);
    markQuestionAnswered(isCorrect);
  };

  // --- True / False handlers ---
  const handleTFSelect = (val: boolean) => {
    if (submitted) return;
    if ((disabledTFByStep[step] || []).includes(val)) return;
    setSelectedTF(val);
    const correct = val === currentQ.answer;
    markQuestionAnswered(correct);
  };

  // --- Fill in the Blanks handlers ---
  const handleBlankClick = (idx: number) => {
    if (submitted) return;
    setActiveBlankIndex(idx);
    if (fillInputs[idx]) {
      const nextInputs = [...fillInputs];
      nextInputs[idx] = "";
      setFillInputs(nextInputs);
    }
  };

  const handleWordClick = (word: string) => {
    if (submitted || activeBlankIndex === null) return;
    const nextInputs = [...fillInputs];
    const existingIdx = nextInputs.indexOf(word);
    if (existingIdx !== -1) {
      nextInputs[existingIdx] = "";
    }
    nextInputs[activeBlankIndex] = word;
    setFillInputs(nextInputs);

    const nextEmptyIdx = nextInputs.findIndex((val) => !val);
    if (nextEmptyIdx !== -1) {
      setActiveBlankIndex(nextEmptyIdx);
    } else {
      setActiveBlankIndex(null);
    }
  };

  const handleFillSubmit = () => {
    if (submitted) return;
    const currentQ = questions[step] as any;
    const correct = currentQ.correctAnswers.every((ans: string, idx: number) => {
      const userInput = (fillInputs[idx] || "").trim().toLowerCase();
      return userInput === ans.trim().toLowerCase();
    });
    markQuestionAnswered(correct);
  };

  // --- Match the Following Drag & Drop + Click handlers ---
  const handleMatchDragStart = (e: React.DragEvent, rhsItem: string) => {
    e.dataTransfer.setData("text/plain", rhsItem);
  };

  const handleMatchDrop = (e: React.DragEvent, lhsItem: string) => {
    e.preventDefault();
    if (submitted) return;
    const rhsItem = e.dataTransfer.getData("text/plain");
    if (!rhsItem) return;

    const nextSelections = { ...matchSelections };
    // Remove if already matched elsewhere
    for (const key in nextSelections) {
      if (nextSelections[key] === rhsItem) {
        delete nextSelections[key];
      }
    }
    nextSelections[lhsItem] = rhsItem;
    setMatchSelections(nextSelections);
  };

  const handleMatchReset = (lhsItem: string) => {
    if (submitted) return;
    const nextSelections = { ...matchSelections };
    delete nextSelections[lhsItem];
    setMatchSelections(nextSelections);
  };

  const handleMatchSubmit = () => {
    if (submitted) return;
    const currentQ = questions[step] as any;
    const correct = currentQ.leftItems.every((lhs: string) => {
      return matchSelections[lhs] === currentQ.correctPairs[lhs];
    });
    markQuestionAnswered(correct);
  };

  // --- Sequencing Drag & Drop + Button handlers ---
  const handleSequenceDragStart = (e: React.DragEvent, idx: number) => {
    e.dataTransfer.setData("text/plain", idx.toString());
  };

  const handleSequenceDrop = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault();
    if (submitted) return;
    const sourceIdxStr = e.dataTransfer.getData("text/plain");
    if (!sourceIdxStr) return;
    const sourceIdx = parseInt(sourceIdxStr, 10);

    const nextItems = [...sequencedItems];
    const [removed] = nextItems.splice(sourceIdx, 1);
    nextItems.splice(targetIdx, 0, removed);
    setSequencedItems(nextItems);
  };

  const moveSequenceItem = (idx: number, direction: "up" | "down") => {
    if (submitted) return;
    if (direction === "up" && idx === 0) return;
    if (direction === "down" && idx === sequencedItems.length - 1) return;

    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    const nextItems = [...sequencedItems];
    const temp = nextItems[idx];
    nextItems[idx] = nextItems[targetIdx];
    nextItems[targetIdx] = temp;
    setSequencedItems(nextItems);
  };

  const handleSequenceSubmit = () => {
    if (submitted) return;
    const currentQ = questions[step] as any;
    const correct = sequencedItems.every((val, idx) => val === currentQ.correctOrder[idx]);
    markQuestionAnswered(correct);
  };

  // --- Labelling Diagram handlers ---
  const handleLabelChange = (labelId: string, val: string) => {
    if (submitted) return;
    setLabelSelections((prev) => ({
      ...prev,
      [labelId]: val,
    }));
  };

  const handleLabellingSubmit = () => {
    if (submitted) return;
    const currentQ = questions[step] as any;
    const correct = currentQ.labels.every((label: any) => {
      return labelSelections[label.id] === label.correctText;
    });
    markQuestionAnswered(correct);
  };

  const renderText = (text: string) => {
    return <MarkdownView content={text} isPurpleTheme={false} disableGlossary={true} />;
  };

  const attemptedCount = answered.filter(Boolean).length;
  const wrongCount = Math.max(0, attemptedCount - score);
  const notAttemptedCount = questions.length - attemptedCount;
  const currentQ = questions[step];

  if (!loading && questions.length > 0 && !isFinished && !currentQ) {
    return null;
  }

  return (
    <>
      {loading ? (
        <StudyToolLoadingWaitScreen />
      ) : questions.length === 0 ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            gap: "24px",
            color: "#64748b",
          }}
        >
          <div style={{ fontSize: "18px", fontWeight: "600" }}>No questions available</div>
          <button
            onClick={onQuit}
            style={{
              padding: "10px 20px",
              borderRadius: "8px",
              border: "none",
              background: "var(--primary)",
              color: "#fff",
              cursor: "pointer",
              fontWeight: "600",
            }}
          >
            Go Back
          </button>
        </div>
      ) : isFinished ? (
        // Finished state
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            gap: "20px",
            textAlign: "center",
          }}
        >
          {(() => {
            const pct = Math.round((score / questions.length) * 100);
            const scoreEmoji = pct < 40 ? "🙁" : pct < 80 ? "🤗" : "🥳";

            return (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  minHeight: "360px",
                  gap: "14px",
                  textAlign: "center",
                  padding: "40px 20px",
                }}
              >
                <div style={{ fontSize: "56px", lineHeight: "1" }}>{scoreEmoji}</div>
                <div style={{ fontSize: "20px", fontWeight: "700", color: "#0f172a" }}>
                  Assessment Completed!
                </div>
                <div
                  style={{
                    fontSize: "44px",
                    fontWeight: "800",
                    color: "#2D3E36",
                    letterSpacing: "-0.5px",
                    lineHeight: "1.1",
                  }}
                >
                  {pct}%
                </div>
                <div style={{ fontSize: "14px", color: "#64748b", fontWeight: "500" }}>
                  You got {score} of {questions.length} correct
                </div>
                <button
                  onClick={() => {
                    if (setActiveTool) {
                      setActiveTool("qbank");
                    } else {
                      onQuit();
                    }
                  }}
                  style={{
                    padding: "11px 32px",
                    borderRadius: "24px",
                    border: "none",
                    background: '#E7B864',
                    color: '#18221D',
                    cursor: "pointer",
                    fontWeight: "700",
                    fontSize: "14.5px",
                    marginTop: "8px",
                    boxShadow: "0 6px 18px rgba(45, 62, 54, 0.25)",
                    transition: "all 0.2s ease",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                  title="Proceed to Question Bank"
                >
                  <span>Up next: Question Bank</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStep(0);
                    setScore(0);
                    setIsFinished(false);
                    setAnswered(new Array(questions.length).fill(false));
                    setRetriesUsed({});
                    setDisabledMCQByStep({});
                    setDisabledTFByStep({});
                    setAwaitingRetry(false);
                    try {
                      cloudStorage.removeItem(assessmentStorageKey);
                    } catch {}
                  }}
                  style={{
                    padding: "8px 20px",
                    borderRadius: "999px",
                    border: "1px solid #DFD9CE",
                    background: "#FFFFFF",
                    color: "#435D50",
                    cursor: "pointer",
                    fontWeight: 700,
                    fontSize: "12.5px",
                  }}
                >
                  Retake Assessment
                </button>
              </div>
            );
          })()}
        </div>
      ) : (
        // Assessment Content
        <>
          <style>{`
            .assessment-view .quiz-q p,
            .assessment-view .quiz-options p,
            .assessment-view .assessment-explanation-md p {
              margin: 0 !important;
            }
            .assessment-view .assessment-explanation-md p + p {
              margin-top: 6px !important;
            }
          `}</style>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "flex-start",
              justifyContent: "center",
              width: "100%",
              minHeight: "100%",
              flexShrink: 0,
              background: '#F8F5EE',
              padding: "12px 20px 28px",
              boxSizing: "border-box",
              fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, -apple-system, sans-serif",
            }}
          >
            {/* Assessment Card matching Warm Cream & Terracotta/Sage Mockup */}
            <div
              ref={cardTopRef}
              className="quiz-card assessment-view"
              style={{
                width: "100%",
                maxWidth: "880px",
                display: "flex",
                flexDirection: "column",
                margin: "0 auto",
                background: "#FFFFFF",
                border: "1px solid #E6E0D4",
                borderRadius: "20px",
                boxShadow: "0 4px 20px rgba(30, 40, 34, 0.04)",
                position: "relative",
                padding: "18px 26px 16px",
                boxSizing: "border-box",
                color: "#1E2822",
              }}
            >
              {/* Top Header Row: Left Badges (4 / 20, Single Choice, Medium) + Right Score (✓ 3 correct · ✕ 1 wrong) */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  gap: "12px",
                  flexWrap: "wrap",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                  {/* Step Counter Pill */}
                  <div
                    style={{
                      padding: "4px 12px",
                      borderRadius: "999px",
                      background: "#FFFFFF",
                      border: "1.5px solid #D8A97C",
                      color: "#B46530",
                      fontWeight: 700,
                      fontSize: "12px",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {step + 1} / {questions.length}
                  </div>

                  {/* Difficulty Pill */}
                  <div
                    style={{
                      padding: "4px 12px",
                      borderRadius: "999px",
                      background: "#F4E5D2",
                      color: "#8C5228",
                      fontWeight: 700,
                      fontSize: "11.5px",
                      display: "inline-flex",
                      alignItems: "center",
                    }}
                  >
                    {persona === "beginner"
                      ? "Easy"
                      : persona === "intermediate"
                      ? "Medium"
                      : persona === "advanced"
                      ? "Hard"
                      : "Medium"}
                  </div>
                </div>

                {/* Top-Right Score Tally */}
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "12.5px",
                    fontWeight: 700,
                  }}
                >
                  <span style={{ color: "#2E6F4E" }}>✓ {score} correct</span>
                  <span style={{ color: "#B8B2A6" }}>·</span>
                  <span style={{ color: "#B86B3D" }}>✕ {wrongCount} wrong</span>
                </div>
              </div>

              {/* Thin Progress Bar */}
              <div
                style={{
                  width: "100%",
                  height: "5px",
                  background: "#EFEBE1",
                  borderRadius: "999px",
                  overflow: "hidden",
                  marginTop: "10px",
                  marginBottom: "14px",
                }}
              >
                <div
                  style={{
                    width: `${Math.min(100, Math.round(((step + 1) / Math.max(1, questions.length)) * 100))}%`,
                    height: "100%",
                    background: "#D89B48",
                    borderRadius: "999px",
                    transition: "width 0.3s ease",
                  }}
                />
              </div>

              {/* Question Body & Options */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  width: "100%",
                  flex: 1,
                }}
              >
                {(() => {
                  const cleanQText = (text: string) => {
                    if (!text) return "";
                    return text
                      .replace(/^#+\s*/, "")
                      .replace(/^\s*(?:\*\*)?(?:Question|q):\s*(?:\*\*)?\s*/i, "")
                      .replace(/(?:\*\*)?(?:Options|options):\s*(?:\*\*)?\s*$/i, "")
                      .replace(/\s*Options:\s*/gi, "")
                      .replace(/\s*Question:\s*/gi, "")
                      .trim();
                  };

                  return (
                    <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
                      {/* Question Stem */}
                      <div
                        className="quiz-q"
                        style={{
                          fontSize: "16px",
                          fontWeight: 800,
                          color: "#1E2822",
                          lineHeight: 1.4,
                          marginBottom: "12px",
                        }}
                      >
                        {renderText(cleanQText(currentQ.q))}
                      </div>

                      {/* Type 1: MCQ */}
                      {currentQ.type === "mcq" && (
                        <div className="quiz-options" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          {currentQ.options.map((option, idx) => {
                            const isSelected = selectedMCQ === idx;
                            const isCorrectAnswer = idx === currentQ.answer;
                            const isPreviouslyWrong = (disabledMCQByStep[step] || []).includes(idx);
                            const isOptionDisabled = submitted || isPreviouslyWrong;

                            let bgStyle = "#FFFFFF";
                            let borderStyle = "1px solid #EAE5DC";
                            let radioBorder = "1.5px solid #C5BEB3";
                            let radioDotColor = "transparent";
                            let badgeBg = "#F2EFE9";
                            let badgeColor = "#5A625C";
                            let textColor = submitted ? "#6E766E" : "#1E2822";
                            let textWeight = 600;
                            let rightIcon: React.ReactNode = null;

                            if (isPreviouslyWrong && !isSelected) {
                              bgStyle = "#F3F4F6";
                              borderStyle = "1.5px dashed #CBD5E1";
                              radioBorder = "1.5px solid #CBD5E1";
                              radioDotColor = "transparent";
                              badgeBg = "#E2E8F0";
                              badgeColor = "#94A3B8";
                              textColor = "#94A3B8";
                              textWeight = 500;
                              rightIcon = (
                                <span style={{ color: "#94A3B8", fontWeight: 700, fontSize: "13px", marginLeft: "auto" }}>
                                  ✕
                                </span>
                              );
                            }

                            if (!submitted && isSelected) {
                              bgStyle = "#FAF2E9";
                              borderStyle = "1.5px solid #C88A5A";
                              radioBorder = "2px solid #B86B3D";
                              radioDotColor = "#B86B3D";
                              badgeBg = "#C27D4E";
                              badgeColor = "#FFFFFF";
                              textColor = "#1E2822";
                              textWeight = 700;
                            } else if (submitted) {
                              if (isCorrectAnswer && !awaitingRetry) {
                                bgStyle = "#EEF6F1";
                                borderStyle = "1.5px solid #A3C9B3";
                                radioBorder = "1.5px solid #4A8B69";
                                radioDotColor = "#4A8B69";
                                badgeBg = "#9DC5AE";
                                badgeColor = "#1E3F2E";
                                textColor = "#1E2822";
                                textWeight = 700;
                                rightIcon = (
                                  <span style={{ color: "#2E6F4E", fontWeight: 800, fontSize: "15px", marginLeft: "auto" }}>
                                    ✓
                                  </span>
                                );
                              } else if (isSelected) {
                                bgStyle = "#FCF3EC";
                                borderStyle = "1.5px solid #CFA07E";
                                radioBorder = "2px solid #B86B3D";
                                radioDotColor = "#B86B3D";
                                badgeBg = "#C27D4E";
                                badgeColor = "#FFFFFF";
                                textColor = "#1E2822";
                                textWeight = 700;
                                rightIcon = (
                                  <span style={{ color: "#B86B3D", fontWeight: 800, fontSize: "14px", marginLeft: "auto" }}>
                                    ✕
                                  </span>
                                );
                              }
                            }

                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => handleMCQSelect(idx)}
                                disabled={isOptionDisabled}
                                onMouseEnter={(e) => {
                                  if (!submitted && !isSelected && !isPreviouslyWrong) {
                                    e.currentTarget.style.background = "#FAF8F4";
                                    e.currentTarget.style.borderColor = "#D5CEC2";
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (!submitted && !isSelected && !isPreviouslyWrong) {
                                    e.currentTarget.style.background = "#FFFFFF";
                                    e.currentTarget.style.borderColor = "#EAE5DC";
                                  }
                                }}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "12px",
                                  width: "100%",
                                  padding: "10px 16px",
                                  borderRadius: "12px",
                                  border: borderStyle,
                                  background: bgStyle,
                                  cursor: isPreviouslyWrong && !submitted ? "not-allowed" : submitted ? "default" : "pointer",
                                  opacity: isPreviouslyWrong && !isSelected ? 0.6 : 1,
                                  transition: "all 0.15s ease",
                                  textAlign: "left",
                                  boxSizing: "border-box",
                                }}
                              >
                                {/* Circular Radio Indicator */}
                                <div
                                  style={{
                                    width: "18px",
                                    height: "18px",
                                    borderRadius: "50%",
                                    border: radioBorder,
                                    background: isPreviouslyWrong && !isSelected ? "#F1F5F9" : "#FFFFFF",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                    boxSizing: "border-box",
                                  }}
                                >
                                  {(isSelected || (submitted && isCorrectAnswer && !awaitingRetry)) && (
                                    <div
                                      style={{
                                        width: "8px",
                                        height: "8px",
                                        borderRadius: "50%",
                                        background: radioDotColor,
                                      }}
                                    />
                                  )}
                                </div>

                                {/* Letter Badge (A, B, C, D) */}
                                <div
                                  style={{
                                    width: "24px",
                                    height: "24px",
                                    borderRadius: "6px",
                                    background: badgeBg,
                                    color: badgeColor,
                                    fontWeight: 800,
                                    fontSize: "12px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                  }}
                                >
                                  {String.fromCharCode(65 + idx)}
                                </div>

                                <div
                                  style={{
                                    flex: 1,
                                    color: textColor,
                                    fontWeight: textWeight,
                                    fontSize: "14px",
                                    lineHeight: 1.45,
                                    textDecoration: isPreviouslyWrong && !isSelected ? "line-through" : "none",
                                  }}
                                >
                                  {renderText(option)}
                                </div>
                                {rightIcon}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Type: MSQ */}
                      {currentQ.type === "msq" && (
                        <div className="quiz-options" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          <div style={{ fontSize: "12px", color: "#8C5228", fontWeight: 600, marginBottom: "2px" }}>
                            Select all correct options, then click <b>Submit Answer</b> below.
                          </div>
                          {currentQ.options.map((option, idx) => {
                            const isSelected = selectedMSQ.includes(idx);
                            const isCorrectOption = currentQ.answer.includes(idx);

                            let bgStyle = isSelected ? "#FAF2E9" : "#FFFFFF";
                            let borderStyle = isSelected ? "1.5px solid #C88A5A" : "1px solid #EAE5DC";
                            let badgeBg = isSelected ? "#C27D4E" : "#F2EFE9";
                            let badgeColor = isSelected ? "#FFFFFF" : "#5A625C";
                            let rightIcon: React.ReactNode = null;

                            if (submitted) {
                              if (isCorrectOption && !awaitingRetry) {
                                bgStyle = "#EEF6F1";
                                borderStyle = "1.5px solid #A3C9B3";
                                badgeBg = "#9DC5AE";
                                badgeColor = "#1E3F2E";
                                rightIcon = <span style={{ color: "#2E6F4E", fontWeight: 800, marginLeft: "auto", fontSize: "15px" }}>✓</span>;
                              } else if (isSelected) {
                                bgStyle = "#FCF3EC";
                                borderStyle = "1.5px solid #CFA07E";
                                badgeBg = "#C27D4E";
                                badgeColor = "#FFFFFF";
                                rightIcon = <span style={{ color: "#B86B3D", fontWeight: 800, marginLeft: "auto", fontSize: "14px" }}>✕</span>;
                              }
                            }

                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => handleMSQToggle(idx)}
                                disabled={submitted}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "12px",
                                  width: "100%",
                                  padding: "10px 16px",
                                  borderRadius: "12px",
                                  border: borderStyle,
                                  background: bgStyle,
                                  cursor: submitted ? "default" : "pointer",
                                  transition: "all 0.15s ease",
                                  textAlign: "left",
                                  boxSizing: "border-box",
                                }}
                              >
                                <div
                                  style={{
                                    width: "18px",
                                    height: "18px",
                                    borderRadius: "4px",
                                    border: isSelected ? "1.5px solid #B86B3D" : "1.5px solid #C5BEB3",
                                    background: isSelected ? "#B86B3D" : "#FFFFFF",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                  }}
                                >
                                  {isSelected && (
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                                      <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                  )}
                                </div>

                                <div
                                  style={{
                                    width: "24px",
                                    height: "24px",
                                    borderRadius: "6px",
                                    background: badgeBg,
                                    color: badgeColor,
                                    fontWeight: 800,
                                    fontSize: "12px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                  }}
                                >
                                  {String.fromCharCode(65 + idx)}
                                </div>

                                <div style={{ flex: 1, color: "#1E2822", fontWeight: 600, fontSize: "14px", lineHeight: 1.45 }}>
                                  {renderText(option)}
                                </div>
                                {rightIcon}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Type 2: True / False */}
                      {currentQ.type === "true_false" && (
                        <div style={{ display: "flex", gap: "14px", justifyContent: "center", marginTop: "12px" }}>
                          {[true, false].map((val) => {
                            const isSelected = selectedTF === val;
                            const isCorrectAnswer = val === currentQ.answer;
                            const isPreviouslyWrong = (disabledTFByStep[step] || []).includes(val);
                            const isOptionDisabled = submitted || isPreviouslyWrong;

                            let btnBg = isSelected ? "#FAF2E9" : "#FFFFFF";
                            let btnBorder = isSelected ? "1.5px solid #C88A5A" : "1px solid #EAE5DC";
                            let btnColor = "#1E2822";

                            if (isPreviouslyWrong && !isSelected) {
                              btnBg = "#F3F4F6";
                              btnBorder = "1.5px dashed #CBD5E1";
                              btnColor = "#94A3B8";
                            }

                            if (submitted) {
                              if (isCorrectAnswer && !awaitingRetry) {
                                btnBorder = "1.5px solid #A3C9B3";
                                btnBg = "#EEF6F1";
                                btnColor = "#1E2822";
                              } else if (isSelected) {
                                btnBorder = "1.5px solid #CFA07E";
                                btnBg = "#FCF3EC";
                                btnColor = "#1E2822";
                              }
                            }

                            return (
                              <button
                                key={val.toString()}
                                type="button"
                                onClick={() => handleTFSelect(val)}
                                disabled={isOptionDisabled}
                                style={{
                                  flex: 1,
                                  height: "56px",
                                  borderRadius: "12px",
                                  border: btnBorder,
                                  background: btnBg,
                                  color: btnColor,
                                  fontSize: "15px",
                                  fontWeight: 700,
                                  textDecoration: isPreviouslyWrong && !isSelected ? "line-through" : "none",
                                  opacity: isPreviouslyWrong && !isSelected ? 0.6 : 1,
                                  cursor: isPreviouslyWrong && !submitted ? "not-allowed" : submitted ? "default" : "pointer",
                                }}
                              >
                                {val ? "True" : "False"}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* ── INLINE EXPLANATION BOX — shown below options after submit ── */}
                {submitted && (
                  <div
                    style={{
                      marginTop: "10px",
                      borderRadius: "12px",
                      border: currentIsCorrect ? "1px solid #C6DEC9" : "1px solid #E5C8AF",
                      background: currentIsCorrect ? "#F3F8F5" : "#FCF6F0",
                      padding: "10px 16px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                    }}
                  >
                    {/* Status + correct option pill */}
                    {awaitingRetry ? (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
                        <span
                          style={{
                            fontWeight: 800,
                            fontSize: "12.5px",
                            color: "#B86B3D",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          <span>✕ Incorrect</span>
                          <span style={{ fontWeight: 600, color: "#5A625C" }}>
                            — {1 - (retriesUsed[step] || 0)} try-again {1 - (retriesUsed[step] || 0) === 1 ? "attempt" : "attempts"} left
                          </span>
                        </span>
                        <button
                          type="button"
                          onClick={handleTryAgainAssessment}
                          style={{
                            padding: "5px 14px",
                            borderRadius: "999px",
                            border: "1.5px solid #C88A5A",
                            background: "#FFFFFF",
                            color: "#9A5226",
                            fontWeight: 700,
                            fontSize: "12px",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                          }}
                        >
                          <span>↻</span>
                          <span>Try Again ({1 - (retriesUsed[step] || 0)} left)</span>
                        </button>
                      </div>
                    ) : (
                      <>
                        {/* Status + correct option pill */}
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                          <span
                            style={{
                              fontWeight: 800,
                              fontSize: "12.5px",
                              color: currentIsCorrect ? "#2E6F4E" : "#B86B3D",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            {currentIsCorrect ? "✓ Correct" : "✕ Incorrect"}
                          </span>
                          {!currentIsCorrect && (
                            <span
                              style={{
                                fontSize: "12.5px",
                                color: "#5A625C",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                              }}
                            >
                              <span>— correct option:</span>
                              <span
                                style={{
                                  background: "#DCECE2",
                                  color: "#2E6F4E",
                                  fontWeight: 800,
                                  borderRadius: "5px",
                                  padding: "2px 8px",
                                  fontSize: "11px",
                                }}
                              >
                                {typeof (currentQ as any).answer === "number"
                                  ? String.fromCharCode(65 + (currentQ as any).answer)
                                  : Array.isArray((currentQ as any).answer)
                                  ? (currentQ as any).answer.map((a: number) => String.fromCharCode(65 + a)).join(", ")
                                  : (currentQ as any).correctAnswers
                                  ? (currentQ as any).correctAnswers.join(", ")
                                  : String((currentQ as any).answer || "")}
                              </span>
                            </span>
                          )}
                        </div>

                        {/* Explanation Markdown */}
                        <div
                          className="assessment-explanation-md"
                          style={{
                            fontSize: "13px",
                            color: "#2C3530",
                            lineHeight: 1.5,
                            fontWeight: 500,
                          }}
                        >
                          <MarkdownView
                            isPurpleTheme={false}
                            disableGlossary={false}
                            content={
                              (currentQ.explanation || "No explanation provided.")
                                .replace(
                                  /^(?:\*\*)?(?:Explanation|Brief Explanation|Solution|Answer|Model Answer|Outline Answer|Rationale|وضاحت)(?:\*\*)?[:\s-]*\s*/gi,
                                  ""
                                )
                                .replace(/Rationale:\*\*\s*(?:correct:)?/gi, "")
                                .replace(/---\s*#/g, "")
                                .trim() || "No explanation provided."
                            }
                          />
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Thin Horizontal Divider above Footer */}
              <div
                style={{
                  height: "1px",
                  background: "#EFECE6",
                  margin: "12px 0 10px",
                  width: "100%",
                }}
              />

              {/* Bottom Card Footer: Source (Left) + Weak Cards & Next Question (Right) */}
              <div
                ref={footerRef}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  gap: "12px",
                  flexWrap: "wrap",
                }}
              >

                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginLeft: "auto" }}>
                  {currentQ.type === "msq" && !submitted && (
                    <button
                      type="button"
                      onClick={handleMSQSubmit}
                      disabled={selectedMSQ.length === 0}
                      style={{
                        padding: "8px 18px",
                        borderRadius: "999px",
                        border: "none",
                        background: '#E7B864',
                        color: '#18221D',
                        fontWeight: 700,
                        fontSize: "12.5px",
                        cursor: selectedMSQ.length === 0 ? "not-allowed" : "pointer",
                        opacity: selectedMSQ.length === 0 ? 0.45 : 1,
                      }}
                    >
                      Submit Answer →
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={!submitted}
                    title={
                      submitted
                        ? step < questions.length - 1
                          ? "Next"
                          : "Finish Assessment"
                        : "Select an answer to proceed"
                    }
                    style={{
                      padding: "9px 22px",
                      borderRadius: "999px",
                      border: "none",
                      background: '#E7B864',
                      color: '#18221D',
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      justifyContent: "center",
                      cursor: submitted ? "pointer" : "default",
                      opacity: submitted ? 1 : 0.4,
                      fontSize: "12.5px",
                      fontWeight: 800,
                      transition: "all 0.15s ease",
                    }}
                  >
                    <span>{step < questions.length - 1 ? "Next ›" : "Finish ›"}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Action Icons shown only on Last Assessment Question */}
            {step === questions.length - 1 && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "10px",
                  marginLeft: "12px",
                  flexShrink: 0,
                }}
              >


                {/* 2. Quick Study Button */}
                <button
                  type="button"
                  onClick={() => setActiveTool?.("summary")}
                  title="Quick Study"
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "50%",
                    background: "#ffffff",
                    border: "1.5px solid #fdba74",
                    boxShadow: "0 4px 12px rgba(249, 115, 22, 0.12)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    padding: "4px",
                    boxSizing: "border-box",
                    transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "scale(1.1)";
                    e.currentTarget.style.boxShadow = "0 6px 16px rgba(249, 115, 22, 0.25)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(249, 115, 22, 0.12)";
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                </button>

                {/* 3. Detailed Study Button */}
                <button
                  type="button"
                  onClick={() => setActiveTool?.("detailed")}
                  title="Detailed Study"
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "50%",
                    background: "#ffffff",
                    border: "1.5px solid #fdba74",
                    boxShadow: "0 4px 12px rgba(249, 115, 22, 0.12)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    padding: "4px",
                    boxSizing: "border-box",
                    transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "scale(1.1)";
                    e.currentTarget.style.boxShadow = "0 6px 16px rgba(249, 115, 22, 0.25)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(249, 115, 22, 0.12)";
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                  </svg>
                </button>

                {/* 4. Home / Video Player Button */}
                <button
                  type="button"
                  onClick={() => setActiveTool?.("videos")}
                  title="Home (Videos)"
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "50%",
                    background: "#ffffff",
                    border: "2px solid #f97316",
                    boxShadow: "0 4px 12px rgba(249, 115, 22, 0.16)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "scale(1.1)";
                    e.currentTarget.style.boxShadow = "0 6px 16px rgba(249, 115, 22, 0.25)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(249, 115, 22, 0.16)";
                  }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <path d="M3 10.5L12 3L21 10.5V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V10.5Z" stroke="#f97316" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M9 21V14H15V21" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            )}






          </div>
        </>
      )}
    </>
  );
}

export default AssessmentView;
