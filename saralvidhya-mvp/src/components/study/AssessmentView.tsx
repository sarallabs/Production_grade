import React, { useState, useEffect, useRef } from "react";
import MarkdownView from "@/components/MarkdownView";
import { getAssessments } from "@/data/contentRepository";
import { parseQuestionBank } from "@/utils/quizParser";
import { type AssessmentQuestion } from "@/utils/assessmentTypes";
import { StudyToolLoadingWaitScreen } from "@/pages/StudyTable";

/**
 * AssessmentView Component
 * Renders the assessment view for answering various types of questions.
 */
export function AssessmentView({
  markdownContent,
  subjectId,
  chapterNumber,
  persona,
  onQuit,
  setPersona,
  setActiveTool,
  videoDir,
}: {
  markdownContent: string;
  subjectId: string;
  chapterNumber: number;
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

  // User input states for active question
  const [submitted, setSubmitted] = useState(false);
  const [currentIsCorrect, setCurrentIsCorrect] = useState<boolean | null>(null);

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
      setStep(0);
      setScore(0);
      setIsFinished(false);
      setAnswered(new Array(validQuestions.length).fill(false));
      setLoading(false);
    });

    return () => { isMounted = false; };
  }, [subjectId, chapterNumber, persona, markdownContent, videoDir]);

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

  const markQuestionAnswered = (isAnswerCorrect: boolean) => {
    setSubmitted(true);
    setCurrentIsCorrect(isAnswerCorrect);
    setAnswered((prev) => {
      const next = [...prev];
      next[step] = true;
      return next;
    });

    if (isAnswerCorrect) {
      setScore((s) => s + 1);
    }
    setShowExplanation(true);

    if (step === questions.length - 1) {
      const finalScore = isAnswerCorrect ? score + 1 : score;
      const pct = Math.round((finalScore / questions.length) * 100);
      localStorage.setItem(`ekam_quiz_score_${subjectId}_${chapterNumber}`, pct.toString());
    }
  };

  // --- MCQ handlers ---
  const handleMCQSelect = (idx: number) => {
    if (submitted) return;
    setSelectedMCQ(idx);
    const currentQ = questions[step] as any;
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
    setSelectedTF(val);
    const currentQ = questions[step] as any;
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
    return <MarkdownView content={text} />;
  };

  const attemptedCount = answered.filter(Boolean).length;
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
                    background: "#2D3E36",
                    color: "#ffffff",
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
              </div>
            );
          })()}
        </div>
      ) : (
        // Assessment Content
        <>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              padding: "0 12px",
              marginTop: "0px",
              boxSizing: "border-box",
            }}
          >
            {/* Assessment card styled to match reference theme */}
            <div
              className="quiz-card assessment-view"
              style={{
                width: "100%",
                maxWidth: "min(96%, 1120px)",
                maxHeight: "calc(100vh - 120px)",
                display: "flex",
                flexDirection: "column",
                overflowY: "hidden",
                margin: "0 auto",
                background: "#FAFBF9",
                border: "1.5px solid #2D3E36",
                borderRadius: "20px",
                boxShadow: "0 10px 32px rgba(45, 62, 54, 0.08)",
                position: "relative",
                padding: "16px 28px 14px 28px",
                boxSizing: "border-box",
              }}
            >
              {/* Header row: Question Number Badge (Left) & Difficulty Tag (Right) */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  marginBottom: "4px",
                }}
              >
                {/* Top-Left Pill Badge: 2 / 10 */}
                <div
                  style={{
                    padding: "3px 12px",
                    borderRadius: "8px",
                    background: "#FFFFFF",
                    border: "1.5px solid #2D3E36",
                    color: "#2D3E36",
                    fontWeight: "700",
                    fontSize: "13px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 1px 3px rgba(45, 62, 54, 0.05)",
                  }}
                >
                  {step + 1} / {questions.length}
                </div>

                {/* Top-Right Difficulty */}
                <div
                  style={{
                    color: "#2D3E36",
                    fontWeight: "600",
                    fontSize: "13px",
                    textTransform: "capitalize",
                    letterSpacing: "0.2px",
                  }}
                >
                  {persona === 'beginner' ? 'Easy' : persona === 'intermediate' ? 'Medium' : persona === 'advanced' ? 'Hard' : 'Easy'}
                </div>
              </div>
              {/* Single-column layout — explanation shown inline below options */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0",
                  width: "100%",
                  flex: 1,
                  minHeight: 0,
                  alignItems: "stretch",
                  marginTop: "0px",
                  marginBottom: "2px",
                }}
              >
                {/* ── LEFT COLUMN: Question & Options ── */}
                {(() => {
                  const cleanQText = (text: string) => {
                    if (!text) return "";
                    return text
                      .replace(/^#+\s*/, '')
                      .replace(/^\s*(?:\*\*)?(?:Question|q):\s*(?:\*\*)?\s*/i, '')
                      .replace(/(?:\*\*)?(?:Options|options):\s*(?:\*\*)?\s*$/i, '')
                      .replace(/\s*Options:\s*/gi, '')
                      .replace(/\s*Question:\s*/gi, '')
                      .trim();
                  };

                  const qRaw = cleanQText(currentQ.q || '');
                  const opts = (currentQ as any).options || [];
                  const maxOptLen = opts.reduce((max: number, o: any) => Math.max(max, (typeof o === 'string' ? o : o.text || '').length), 0);
                  const totalCharLen = qRaw.length + opts.reduce((acc: number, o: any) => acc + (typeof o === 'string' ? o : o.text || '').length, 0);

                  // Responsive sizing tuned for single screen fit without being tiny:
                  const isExtreme = totalCharLen > 480 || maxOptLen > 140;
                  const isUltraLong = !isExtreme && (totalCharLen > 320 || maxOptLen > 90);
                  const isLongQ = !isExtreme && !isUltraLong && (totalCharLen > 180 || qRaw.length > 100);

                  const qFontSize = isExtreme ? "15.5px" : isUltraLong ? "16.5px" : isLongQ ? "17.5px" : "18.5px";
                  const optTextSize = isExtreme ? "14px" : isUltraLong ? "14.5px" : isLongQ ? "15px" : "15.5px";

                  const qLineHeight = isExtreme ? "1.32" : isUltraLong ? "1.35" : isLongQ ? "1.38" : "1.42";
                  const qMarginBottom = isExtreme ? "8px" : isUltraLong ? "10px" : isLongQ ? "12px" : "14px";

                  const optGap = isExtreme ? "6px" : isUltraLong ? "8px" : isLongQ ? "9px" : "10px";
                  const optPadding = isExtreme ? "8px 14px" : isUltraLong ? "9px 16px" : isLongQ ? "10px 18px" : "11px 20px";
                  const optLineHeight = isExtreme ? "1.3" : isUltraLong ? "1.34" : isLongQ ? "1.38" : "1.4";

                  return (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "flex-start",
                        width: "100%",
                        maxWidth: "100%",
                        paddingRight: "2px",
                        transform: "translate3d(0, 0, 0)",
                        WebkitFontSmoothing: "antialiased",
                        MozOsxFontSmoothing: "grayscale",
                      }}
                    >
                      <div>
                        {/* Question Title */}
                        <div
                          className="quiz-q"
                          style={{
                            fontSize: qFontSize,
                            fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                            fontWeight: "700",
                            color: "#111827",
                            lineHeight: qLineHeight,
                            letterSpacing: "-0.1px",
                            marginTop: "4px",
                            marginBottom: qMarginBottom,
                            willChange: "font-size, margin-bottom",
                            transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                          }}
                        >
                          {renderText(cleanQText(currentQ.q))}
                        </div>

                        {/* ── QUESTION TYPE RENDERERS ── */}

                        {/* Type 1: MCQ */}
                        {currentQ.type === "mcq" && (
                          <div className="quiz-options" style={{ display: "flex", flexDirection: "column", gap: optGap }}>
                            {currentQ.options.map((option, idx) => {
                              const isSelected = selectedMCQ === idx;
                              const isCorrectAnswer = idx === currentQ.answer;

                              // Very light, subtle sage tints for maximum readability:
                              const optionLightTints = ["#E6ECE8", "#E1E9E3", "#E6ECE8", "#E1E9E3"];
                              let bgStyle = isSelected ? "#CDE4D6" : optionLightTints[idx % optionLightTints.length];
                              let borderStyle = isSelected ? "2px solid #2D3E36" : "1.5px solid #BDCDC2";
                              let rightIcon = null;

                              if (submitted) {
                                if (isCorrectAnswer) {
                                  bgStyle = "#E2F4E9";
                                  borderStyle = "2px solid #2D3E36";
                                  rightIcon = (
                                    <span style={{ color: "#2D3E36", fontWeight: "800", fontSize: "17px", marginLeft: "auto", paddingRight: "4px" }}>
                                      ✓
                                    </span>
                                  );
                                } else if (isSelected) {
                                  bgStyle = "#FDF0ED";
                                  borderStyle = "2px solid #D9534F";
                                  rightIcon = (
                                    <span style={{ color: "#D9534F", fontWeight: "800", fontSize: "17px", marginLeft: "auto", paddingRight: "4px" }}>
                                      ✕
                                    </span>
                                  );
                                }
                              }

                              return (
                                <button
                                  key={idx}
                                  onClick={() => handleMCQSelect(idx)}
                                  disabled={submitted}
                                  onMouseEnter={(e) => {
                                    if (!submitted && !isSelected) {
                                      e.currentTarget.style.background = "#D7E3DC";
                                      e.currentTarget.style.borderColor = "#9EB5A6";
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    if (!submitted && !isSelected) {
                                      e.currentTarget.style.background = bgStyle;
                                      e.currentTarget.style.borderColor = "#BDCDC2";
                                    }
                                  }}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "12px",
                                    width: "100%",
                                    padding: optPadding,
                                    borderRadius: "10px",
                                    border: borderStyle,
                                    background: bgStyle,
                                    cursor: submitted ? "default" : "pointer",
                                    transition: "all 0.18s ease",
                                    textAlign: "left",
                                    boxShadow: isSelected ? "0 3px 10px rgba(45, 62, 54, 0.12)" : "0 1px 3px rgba(45, 62, 54, 0.03)",
                                    boxSizing: "border-box",
                                  }}
                                >
                                  {/* Square Checkbox Indicator */}
                                  <div
                                    style={{
                                      width: "18px",
                                      height: "18px",
                                      borderRadius: "4px",
                                      border: isSelected ? "1.5px solid #2D3E36" : "1.5px solid #6E8576",
                                      background: isSelected ? "#2D3E36" : "#FFFFFF",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      flexShrink: 0,
                                      transition: "all 0.15s ease",
                                    }}
                                  >
                                    {isSelected && (
                                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12" />
                                      </svg>
                                    )}
                                  </div>

                                  {/* Letter Pill */}
                                  <div
                                    style={{
                                      width: "24px",
                                      height: "24px",
                                      borderRadius: "6px",
                                      background: isSelected ? "#B4D5C1" : "#D1DFD6",
                                      border: isSelected ? "1px solid #2D3E36" : "1px solid rgba(45, 62, 54, 0.22)",
                                      color: isSelected ? "#16241C" : "#1E2F26",
                                      fontWeight: "700",
                                      fontSize: "13px",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      flexShrink: 0,
                                      transition: "background 0.15s ease",
                                    }}
                                  >
                                    {String.fromCharCode(65 + idx)}
                                  </div>

                                  <div style={{ flex: 1, color: "#111A15", fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", fontWeight: "600", fontSize: optTextSize, lineHeight: optLineHeight }}>
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
                          <div className="quiz-options" style={{ display: "flex", flexDirection: "column", gap: optGap }}>
                            {currentQ.options.map((option, idx) => {
                              const isSelected = selectedMSQ.includes(idx);
                              const isCorrectOption = currentQ.answer.includes(idx);

                              // Very light, subtle sage tints for maximum readability:
                              const optionLightTints = ["#E6ECE8", "#E1E9E3", "#E6ECE8", "#E1E9E3"];
                              let bgStyle = isSelected ? "#CDE4D6" : optionLightTints[idx % optionLightTints.length];
                              let borderStyle = isSelected ? "2px solid #2D3E36" : "1.5px solid #BDCDC2";
                              let rightIcon = null;

                              if (submitted) {
                                if (isCorrectOption) {
                                  bgStyle = "#E2F4E9";
                                  borderStyle = "2px solid #2D3E36";
                                  rightIcon = <span style={{ color: "#2D3E36", fontWeight: "800", marginLeft: "auto", fontSize: "17px" }}>✓</span>;
                                } else if (isSelected) {
                                  bgStyle = "#FDF0ED";
                                  borderStyle = "2px solid #D9534F";
                                  rightIcon = <span style={{ color: "#D9534F", fontWeight: "800", marginLeft: "auto", fontSize: "17px" }}>✕</span>;
                                }
                              }

                              return (
                                <button
                                  key={idx}
                                  onClick={() => handleMSQToggle(idx)}
                                  disabled={submitted}
                                  onMouseEnter={(e) => {
                                    if (!submitted && !isSelected) {
                                      e.currentTarget.style.background = "#D7E3DC";
                                      e.currentTarget.style.borderColor = "#9EB5A6";
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    if (!submitted && !isSelected) {
                                      e.currentTarget.style.background = bgStyle;
                                      e.currentTarget.style.borderColor = "#BDCDC2";
                                    }
                                  }}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "12px",
                                    width: "100%",
                                    padding: optPadding,
                                    borderRadius: "10px",
                                    border: borderStyle,
                                    background: bgStyle,
                                    cursor: submitted ? "default" : "pointer",
                                    transition: "all 0.18s ease",
                                    textAlign: "left",
                                    boxShadow: isSelected ? "0 3px 10px rgba(45, 62, 54, 0.12)" : "0 1px 3px rgba(45, 62, 54, 0.03)",
                                    boxSizing: "border-box",
                                  }}
                                >
                                  {/* Checkbox */}
                                  <div
                                    style={{
                                      width: "18px",
                                      height: "18px",
                                      borderRadius: "4px",
                                      border: isSelected ? "1.5px solid #2D3E36" : "1.5px solid #6E8576",
                                      background: isSelected ? "#2D3E36" : "#FFFFFF",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      flexShrink: 0,
                                      transition: "all 0.15s ease",
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
                                      background: isSelected ? "#B4D5C1" : "#D1DFD6",
                                      border: isSelected ? "1px solid #2D3E36" : "1px solid rgba(45, 62, 54, 0.22)",
                                      color: isSelected ? "#16241C" : "#1E2F26",
                                      fontWeight: "700",
                                      fontSize: "13px",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      flexShrink: 0,
                                      transition: "background 0.15s ease",
                                    }}
                                  >
                                    {String.fromCharCode(65 + idx)}
                                  </div>

                                  <div style={{ flex: 1, color: "#111A15", fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", fontWeight: "600", fontSize: optTextSize, lineHeight: optLineHeight }}>
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

                              let btnBg = isSelected ? "#CDE4D6" : val ? "#E6ECE8" : "#E1E9E3";
                              let btnBorder = isSelected ? "2px solid #2D3E36" : "1.5px solid #BDCDC2";
                              let btnTextColor = "#111A15";

                              if (submitted) {
                                if (isCorrectAnswer) {
                                  btnBorder = "2px solid #2D3E36";
                                  btnBg = "#E2F4E9";
                                } else if (isSelected) {
                                  btnBorder = "2px solid #D9534F";
                                  btnBg = "#FDF0ED";
                                }
                              }

                              return (
                                <button
                                  key={val.toString()}
                                  onClick={() => handleTFSelect(val)}
                                  disabled={submitted}
                                  style={{
                                    flex: 1,
                                    height: "64px",
                                    borderRadius: "10px",
                                    border: btnBorder,
                                    background: btnBg,
                                    color: btnTextColor,
                                    fontSize: "1.05rem",
                                    fontWeight: "700",
                                    cursor: submitted ? "default" : "pointer",
                                    transition: "all 0.2s ease",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    boxShadow: isSelected ? "0 3px 10px rgba(45, 62, 54, 0.12)" : "0 1px 3px rgba(45, 62, 54, 0.03)",
                                  }}
                                >
                                  {val ? "True" : "False"}
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {/* Type 3: Fill in the Blanks */}
                        {currentQ.type === "fill_blanks" && (
                          <div style={{ padding: "16px", background: "#FFFFFF", borderRadius: "12px", border: "1.5px solid #D5E2D9" }}>
                            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px", lineHeight: "2.2", fontSize: "1rem" }}>
                              {currentQ.q.split("[blank]").map((segment, idx, arr) => (
                                <React.Fragment key={idx}>
                                  <span style={{ color: "#18221D", fontWeight: "500" }}>{segment}</span>
                                  {idx < arr.length - 1 && (
                                    <button
                                      type="button"
                                      onClick={() => !submitted && setActiveBlankIndex(idx)}
                                      style={{
                                        minWidth: "70px",
                                        padding: "2px 10px",
                                        borderRadius: "6px",
                                        border: activeBlankIndex === idx ? "2px solid #2D3E36" : "1.5px solid #D5E2D9",
                                        background: fillInputs[idx] ? "#E8F3ED" : "#F5F8F6",
                                        color: fillInputs[idx] ? "#2D3E36" : "#64748b",
                                        fontWeight: "600",
                                        fontSize: "0.95rem",
                                        cursor: submitted ? "default" : "pointer",
                                      }}
                                    >
                                      {fillInputs[idx] || `Blank ${idx + 1}`}
                                    </button>
                                  )}
                                </React.Fragment>
                              ))}
                            </div>

                            {!submitted && (
                              <div style={{ marginTop: "16px" }}>
                                <div style={{ fontSize: "12px", fontWeight: "700", color: "#2D3E36", textTransform: "uppercase", marginBottom: "8px" }}>
                                  Word Bank
                                </div>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                                  {fillChoices.map((choice, idx) => (
                                    <button
                                      key={idx}
                                      type="button"
                                      onClick={() => handleWordClick(choice)}
                                      style={{
                                        padding: "6px 14px",
                                        borderRadius: "8px",
                                        border: "1px solid #D5E2D9",
                                        background: "#F5F8F6",
                                        color: "#2D3E36",
                                        fontWeight: "600",
                                        fontSize: "0.9rem",
                                        cursor: "pointer",
                                      }}
                                    >
                                      {choice}
                                    </button>
                                  ))}
                                </div>
                                <button
                                  onClick={handleFillSubmit}
                                  disabled={fillInputs.some((val) => !val.trim())}
                                  style={{
                                    marginTop: "16px",
                                    padding: "8px 20px",
                                    borderRadius: "18px",
                                    border: "none",
                                    background: "#2D3E36",
                                    color: "#ffffff",
                                    fontWeight: "700",
                                    fontSize: "13.5px",
                                    cursor: fillInputs.some((val) => !val.trim()) ? "default" : "pointer",
                                    opacity: fillInputs.some((val) => !val.trim()) ? 0.5 : 1,
                                  }}
                                >
                                  Check Answers
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Type 4: Match the Following */}
                        {currentQ.type === "match_following" && (
                          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            <div style={{ fontSize: "13px", color: "#2D3E36", fontWeight: "600" }}>Match items on left with right:</div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                              {currentQ.leftItems.map((lhs: string) => {
                                const matchedRhs = matchSelections[lhs];
                                const isCorrectMatch = matchedRhs === currentQ.correctPairs[lhs];
                                return (
                                  <div key={lhs} style={{ padding: "10px 14px", border: "1.5px solid #D5E2D9", borderRadius: "8px", background: "#F5F8F6" }}>
                                    <div style={{ fontWeight: "700", color: "#18221D", fontSize: "14px" }}>{lhs}</div>
                                    {matchedRhs && (
                                      <div style={{ marginTop: "4px", fontSize: "13px", color: submitted ? (isCorrectMatch ? "#2D3E36" : "#D9534F") : "#2D3E36", fontWeight: "600" }}>
                                        → {matchedRhs}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                            {!submitted && (
                              <button
                                onClick={handleMatchSubmit}
                                style={{
                                  marginTop: "12px",
                                  padding: "8px 20px",
                                  borderRadius: "18px",
                                  border: "none",
                                  background: "#2D3E36",
                                  color: "#ffffff",
                                  fontWeight: "700",
                                  fontSize: "13.5px",
                                  cursor: "pointer",
                                }}
                              >
                                Submit Matching
                              </button>
                            )}
                          </div>
                        )}

                        {/* Type 5 & 6 Fallback */}
                        {(currentQ.type === "sequencing" || currentQ.type === "labelling") && (
                          <div style={{ fontSize: "14px", color: "#2D3E36" }}>
                            Complete the question task to view answer status.
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* ── INLINE EXPLANATION BOX — shown below options after submit ── */}
                {submitted && (
                  <div
                    style={{
                      marginTop: "6px",
                      borderRadius: "10px",
                      border: `1.5px solid ${currentIsCorrect ? "#2D3E36" : "#D9534F"}`,
                      background: currentIsCorrect ? "#F2F8F4" : "#FDF4F3",
                      padding: "6px 12px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "3px",
                    }}
                  >
                    {/* Status + correct option in one row */}
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                      <span style={{
                        fontWeight: "800",
                        fontSize: "12px",
                        color: currentIsCorrect ? "#2D3E36" : "#D9534F",
                        display: "flex", alignItems: "center", gap: "4px",
                      }}>
                        {currentIsCorrect ? "✓ Correct!" : "✕ Incorrect"}
                      </span>
                      {!currentIsCorrect && (
                        <span style={{ fontSize: "11.5px", color: "#64748b", display: "flex", alignItems: "center", gap: "4px" }}>
                          Correct option:
                          <span style={{
                            background: "#E8F0EB", color: "#2D3E36", fontWeight: "800",
                            borderRadius: "4px", padding: "1px 6px", fontSize: "11px",
                            border: "1px solid #2D3E36",
                          }}>
                            {typeof (currentQ as any).answer === 'number'
                              ? String.fromCharCode(65 + (currentQ as any).answer)
                              : Array.isArray((currentQ as any).answer)
                                ? (currentQ as any).answer.map((a: number) => String.fromCharCode(65 + a)).join(', ')
                                : (currentQ as any).correctAnswers
                                  ? (currentQ as any).correctAnswers.join(', ')
                                  : String((currentQ as any).answer || '')}
                          </span>
                        </span>
                      )}
                    </div>
                    {/* Explanation text */}
                    <div style={{
                      fontSize: "11.5px",
                      color: "#1E293B",
                      lineHeight: "1.36",
                      fontWeight: "500",
                      maxHeight: "65px",
                      overflowY: "auto",
                    }}>
                      <MarkdownView
                        content={
                          (currentQ.explanation || "No explanation provided.")
                            .replace(/^(?:\*\*)?(?:Explanation|Brief Explanation|Solution|Answer|Model Answer|Outline Answer|Rationale|وضاحت)(?:\*\*)?[:\s-]*\s*/gi, '')
                            .replace(/Rationale:\*\*\s*(?:correct:)?/gi, '')
                            .replace(/---\s*#/g, '')
                            .trim() || "No explanation provided."
                        }
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Card Footer: MSQ Submit (if applicable) & Next Button (Right) */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginTop: "6px",
                  width: "100%",
                }}
              >
                <div>
                  {currentQ.type === "msq" && !submitted && (
                    <button
                      onClick={handleMSQSubmit}
                      disabled={selectedMSQ.length === 0}
                      style={{
                        padding: "5px 14px",
                        borderRadius: "14px",
                        border: "none",
                        background: "#2D3E36",
                        color: "#ffffff",
                        fontWeight: "700",
                        fontSize: "12px",
                        cursor: selectedMSQ.length === 0 ? "not-allowed" : "pointer",
                        opacity: selectedMSQ.length === 0 ? 0.45 : 1,
                        boxShadow: "0 3px 8px rgba(45, 62, 54, 0.2)",
                        transition: "all 0.2s ease",
                      }}
                    >
                      Submit Answer →
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!submitted}
                  title={
                    submitted
                      ? (step < questions.length - 1 ? "Next Question" : "Finish Assessment")
                      : "Select an answer to proceed"
                  }
                  aria-label={step < questions.length - 1 ? "Next Question" : "Finish Assessment"}
                  style={{
                    padding: submitted ? "5px 14px" : "5px 10px",
                    height: "30px",
                    borderRadius: "15px",
                    border: "none",
                    background: "#2D3E36",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    justifyContent: "center",
                    cursor: submitted ? "pointer" : "default",
                    opacity: submitted ? 1 : 0.35,
                    boxShadow: submitted ? "0 3px 8px rgba(45, 62, 54, 0.25)" : "none",
                    transition: "transform 0.2s ease, opacity 0.2s ease",
                    marginLeft: "auto",
                    flexShrink: 0,
                    fontSize: "12px",
                    fontWeight: "700",
                  }}
                  onMouseEnter={(e) => {
                    if (submitted) e.currentTarget.style.transform = "scale(1.05)";
                  }}
                  onMouseLeave={(e) => {
                    if (submitted) e.currentTarget.style.transform = "scale(1)";
                  }}
                >
                  <span>{step < questions.length - 1 ? "Next Question" : "Finish"}</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
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
