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

  const renderOptionText = (text: string) => {
    if (!text) return "";
    if (typeof text !== "string") return String(text);
    if (!/[*_`#\[\]\\]/.test(text)) {
      return text;
    }
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
                    color: "#3b82f6",
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
                  onClick={onQuit}
                  style={{
                    padding: "10px 36px",
                    borderRadius: "24px",
                    border: "none",
                    background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                    color: "#ffffff",
                    cursor: "pointer",
                    fontWeight: "700",
                    fontSize: "14.5px",
                    marginTop: "8px",
                    boxShadow: "0 6px 18px rgba(37, 99, 235, 0.3)",
                    transition: "all 0.2s ease",
                  }}
                >
                  Continue
                </button>
              </div>
            );
          })()}
        </div>
      ) : (
        // Assessment Content
        <>
          <style>{`
            .quiz-options button,
            .quiz-options button *,
            .quiz-options .assessment-option-text,
            .quiz-options .assessment-option-text *,
            .quiz-options .markdown-view,
            .quiz-options .markdown-view p,
            .quiz-options .markdown-view span {
              color: #ffffff !important;
            }
          `}</style>
          <div
            className="assessment-outer-wrapper"
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: "16px",
              width: "100%",
              minHeight: "100%",
              padding: "16px 12px",
              marginTop: "0px",
              boxSizing: "border-box",
              background: "transparent",
            }}
          >
            {/* Left Spacer to maintain alignment when right-side study icons appear on last question */}
            {step === questions.length - 1 && (
              <div style={{ width: "44px", flexShrink: 0 }} />
            )}

            {/* Assessment card with clean charcoal outline matching Figma screenshot */}
            <div
              className="quiz-card assessment-view"
              style={{
                flex: "0 1 820px",
                width: "100%",
                maxWidth: "820px",
                minHeight: "min(440px, calc(100vh - 180px))",
                maxHeight: "calc(100vh - 130px)",
                display: "flex",
                flexDirection: "column",
                overflowY: "auto",
                margin: "0 auto",
                background: "rgba(111, 154, 127, 0.15)",
                border: "2px solid #2D3748",
                borderRadius: "20px",
                boxShadow: "0 6px 24px rgba(0, 0, 0, 0.05)",
                position: "relative",
                padding: "18px 26px 16px 26px",
                boxSizing: "border-box",
              }}
            >
              {/* Card Header: Question Number Badge (Left) & Difficulty Tag (Right) in standard flow */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  marginBottom: "12px",
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    padding: "3px 12px",
                    borderRadius: "8px",
                    background: "#ffffff",
                    border: "1.5px solid #2D3748",
                    color: "#111827",
                    fontWeight: "700",
                    fontSize: "13.5px",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    letterSpacing: "0.4px",
                  }}
                >
                  {step + 1} / {questions.length}
                </div>

                <div
                  style={{
                    color: "#111827",
                    fontWeight: "600",
                    fontSize: "13px",
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
                  marginBottom: "4px",
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

                  // 4-Tier Dynamic Sizing Engine for Advanced Personas & Long Questions:
                  const isExtreme = totalCharLen > 460 || maxOptLen > 120;
                  const isUltraLong = !isExtreme && (totalCharLen > 280 || maxOptLen > 70);
                  const isLongQ = !isExtreme && !isUltraLong && (totalCharLen > 160 || qRaw.length > 80);

                  const qFontSize = isExtreme ? "13px" : isUltraLong ? "13.5px" : isLongQ ? "14.5px" : "15.5px";
                  const optTextSize = isExtreme ? "12px" : isUltraLong ? "12.5px" : isLongQ ? "13.2px" : "14px";

                  const qLineHeight = isExtreme ? "1.25" : isUltraLong ? "1.3" : isLongQ ? "1.34" : "1.38";
                  const qMarginBottom = isExtreme ? "8px" : isUltraLong ? "10px" : isLongQ ? "12px" : "14px";

                  const optGap = isExtreme ? "6px" : isUltraLong ? "8px" : isLongQ ? "9px" : "11px";
                  const optPadding = isExtreme ? "6px 10px" : isUltraLong ? "7px 12px" : isLongQ ? "9px 14px" : "11px 16px";
                  const optLineHeight = isExtreme ? "1.18" : isUltraLong ? "1.22" : isLongQ ? "1.26" : "1.3";

                  const badgeSize = isExtreme ? "22px" : isUltraLong ? "24px" : isLongQ ? "26px" : "28px";
                  const badgeFont = isExtreme ? "11.5px" : isUltraLong ? "12px" : isLongQ ? "12.5px" : "13px";
                  const radioSize = isExtreme ? "13px" : isUltraLong ? "14px" : isLongQ ? "15px" : "16px";
                  const dotSize = isExtreme ? "5px" : isUltraLong ? "6px" : isLongQ ? "6px" : "7px";

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
                        {/* Question Title (Bold Sans-Serif Typography matching 2nd Figma screenshot) */}
                        <div
                          className="quiz-q"
                          style={{
                            fontSize: qFontSize,
                            fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
                            fontWeight: "700",
                            color: "#111827",
                            lineHeight: "1.38",
                            letterSpacing: "-0.2px",
                            marginTop: "0px",
                            marginBottom: qMarginBottom,
                            willChange: "font-size, margin-bottom",
                            transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
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

                              // Alternating forest green and sage green matching the Figma screenshot:
                              // Even (A, C): #4E745D (Dark Forest Green)
                              // Odd  (B, D): #6E977D (Medium Sage Green)
                              const baseGreen = idx % 2 === 0 ? "#4E745D" : "#6E977D";

                              let borderStyle = "2px solid transparent";
                              let bgStyle = baseGreen;
                              let rightIcon = null;

                              if (isSelected && !submitted) {
                                borderStyle = "2px solid #ffffff";
                                bgStyle = idx % 2 === 0 ? "#3E634D" : "#5E866D";
                              }

                              if (submitted) {
                                if (isCorrectAnswer) {
                                  borderStyle = "2px solid #22c55e";
                                  bgStyle = idx % 2 === 0 ? "#3B634A" : "#568565";
                                  rightIcon = (
                                    <span style={{ color: "#ffffff", fontWeight: "800", fontSize: "18px", marginLeft: "auto", paddingRight: "4px" }}>
                                      ✓
                                    </span>
                                  );
                                } else if (isSelected) {
                                  borderStyle = "2px solid #ef4444";
                                  bgStyle = "#7E4747";
                                  rightIcon = (
                                    <span style={{ color: "#ffffff", fontWeight: "800", fontSize: "18px", marginLeft: "auto", paddingRight: "4px" }}>
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
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "14px",
                                    width: "100%",
                                    padding: optPadding,
                                    borderRadius: "10px",
                                    border: borderStyle,
                                    background: bgStyle,
                                    cursor: submitted ? "default" : "pointer",
                                    willChange: "transform, font-size, padding",
                                    transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                                    textAlign: "left",
                                    transform: "translate3d(0, 0, 0)",
                                    boxShadow: isSelected ? "0 4px 12px rgba(0, 0, 0, 0.15)" : "0 2px 4px rgba(0, 0, 0, 0.04)",
                                    position: "relative",
                                  }}
                                  onMouseEnter={(e) => {
                                    if (!submitted) {
                                      e.currentTarget.style.filter = "brightness(1.08)";
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    if (!submitted) {
                                      e.currentTarget.style.filter = "none";
                                    }
                                  }}
                                >
                                  {/* White Square Indicator (matching Figma 2nd screenshot) */}
                                  <div
                                    style={{
                                      width: "14px",
                                      height: "14px",
                                      borderRadius: "3px",
                                      background: "#ffffff",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      flexShrink: 0,
                                      opacity: isSelected ? 1 : 0.9,
                                    }}
                                  >
                                    {isSelected && (
                                      <div
                                        style={{
                                          width: "6px",
                                          height: "6px",
                                          borderRadius: "1px",
                                          background: baseGreen,
                                        }}
                                      />
                                    )}
                                  </div>

                                  {/* Option Letter (A, B, C, D) with subtle translucent pill */}
                                  <div
                                    style={{
                                      width: badgeSize,
                                      height: badgeSize,
                                      borderRadius: "6px",
                                      background: "rgba(255, 255, 255, 0.18)",
                                      color: "#ffffff",
                                      fontWeight: "700",
                                      fontSize: badgeFont,
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      flexShrink: 0,
                                    }}
                                  >
                                    {String.fromCharCode(65 + idx)}
                                  </div>

                                  {/* Option Text in Pure White */}
                                  <div
                                    className="assessment-option-text"
                                    style={{
                                      flex: 1,
                                      color: "#ffffff",
                                      fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                                      fontWeight: "600",
                                      fontSize: optTextSize,
                                      lineHeight: optLineHeight,
                                    }}
                                  >
                                    {renderOptionText(option)}
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
                              const isCorrectOption = Array.isArray(currentQ.answer) ? currentQ.answer.includes(idx) : false;

                              const baseGreen = idx % 2 === 0 ? "#4E745D" : "#6E977D";

                              let borderStyle = "2px solid transparent";
                              let bgStyle = baseGreen;
                              let rightIcon = null;

                              if (isSelected && !submitted) {
                                borderStyle = "2px solid #ffffff";
                                bgStyle = idx % 2 === 0 ? "#3E634D" : "#5E866D";
                              }

                              if (submitted) {
                                if (isCorrectOption) {
                                  borderStyle = "2px solid #22c55e";
                                  bgStyle = idx % 2 === 0 ? "#3B634A" : "#568565";
                                  rightIcon = <span style={{ color: "#ffffff", fontWeight: "800", marginLeft: "auto" }}>✓</span>;
                                } else if (isSelected) {
                                  borderStyle = "2px solid #ef4444";
                                  bgStyle = "#7E4747";
                                  rightIcon = <span style={{ color: "#ffffff", fontWeight: "800", marginLeft: "auto" }}>✕</span>;
                                }
                              }

                              return (
                                <button
                                  key={idx}
                                  onClick={() => handleMSQToggle(idx)}
                                  disabled={submitted}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "14px",
                                    width: "100%",
                                    padding: optPadding,
                                    borderRadius: "10px",
                                    border: borderStyle,
                                    background: bgStyle,
                                    cursor: submitted ? "default" : "pointer",
                                    textAlign: "left",
                                    transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                                    boxShadow: isSelected ? "0 4px 12px rgba(0, 0, 0, 0.15)" : "0 2px 4px rgba(0, 0, 0, 0.04)",
                                    position: "relative",
                                  }}
                                  onMouseEnter={(e) => {
                                    if (!submitted) {
                                      e.currentTarget.style.filter = "brightness(1.08)";
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    if (!submitted) {
                                      e.currentTarget.style.filter = "none";
                                    }
                                  }}
                                >
                                  {/* White Square Checkbox */}
                                  <div
                                    style={{
                                      width: "14px",
                                      height: "14px",
                                      borderRadius: "3px",
                                      background: "#ffffff",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      flexShrink: 0,
                                    }}
                                  >
                                    {isSelected && (
                                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={baseGreen} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12" />
                                      </svg>
                                    )}
                                  </div>

                                  <div
                                    style={{
                                      width: badgeSize,
                                      height: badgeSize,
                                      borderRadius: "6px",
                                      background: "rgba(255, 255, 255, 0.18)",
                                      color: "#ffffff",
                                      fontWeight: "700",
                                      fontSize: badgeFont,
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      flexShrink: 0,
                                    }}
                                  >
                                    {String.fromCharCode(65 + idx)}
                                  </div>

                                  <div
                                    className="assessment-option-text"
                                    style={{
                                      flex: 1,
                                      color: "#ffffff",
                                      fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                                      fontWeight: "600",
                                      fontSize: optTextSize,
                                      lineHeight: optLineHeight,
                                    }}
                                  >
                                    {renderOptionText(option)}
                                  </div>
                                  {rightIcon}
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {/* Type 2: True / False */}
                        {currentQ.type === "true_false" && (
                          <div style={{ display: "flex", gap: "16px", justifyContent: "center", marginTop: "12px" }}>
                            {[true, false].map((val) => {
                              const isSelected = selectedTF === val;
                              const isCorrectAnswer = val === currentQ.answer;

                              let btnBorder = "1.5px solid #e2e8f0";
                              let btnBg = "#fff";
                              let btnTextColor = "#1e293b";

                              if (isSelected) {
                                btnBorder = "2px solid #3b82f6";
                                btnBg = "#eff6ff";
                              }
                              if (submitted) {
                                if (isCorrectAnswer) {
                                  btnBorder = "2px solid #34C759";
                                  btnBg = "#34C75933";
                                  btnTextColor = "#15803d";
                                } else if (isSelected) {
                                  btnBorder = "2px solid #FF383C";
                                  btnBg = "#FF383C1A";
                                  btnTextColor = "#b91c1c";
                                }
                              }

                              return (
                                <button
                                  key={val.toString()}
                                  onClick={() => handleTFSelect(val)}
                                  disabled={submitted}
                                  style={{
                                    flex: 1,
                                    height: "80px",
                                    borderRadius: "14px",
                                    border: btnBorder,
                                    background: btnBg,
                                    color: btnTextColor,
                                    fontSize: "1.1rem",
                                    fontWeight: "700",
                                    cursor: submitted ? "default" : "pointer",
                                    transition: "all 0.2s ease",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
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
                          <div style={{ padding: "16px", background: "#f8fafc", borderRadius: "14px", border: "1.5px dashed #cbd5e1" }}>
                            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px", lineHeight: "2.2", fontSize: "1rem" }}>
                              {currentQ.q.split("[blank]").map((segment, idx, arr) => (
                                <React.Fragment key={idx}>
                                  <span>{segment}</span>
                                  {idx < arr.length - 1 && (
                                    <button
                                      type="button"
                                      onClick={() => !submitted && setActiveBlankIndex(idx)}
                                      style={{
                                        minWidth: "70px",
                                        padding: "2px 10px",
                                        borderRadius: "8px",
                                        border: activeBlankIndex === idx ? "2px solid #3b82f6" : "1.5px solid #cbd5e1",
                                        background: fillInputs[idx] ? "#eff6ff" : "#ffffff",
                                        color: fillInputs[idx] ? "#1d4ed8" : "#94a3b8",
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
                                <div style={{ fontSize: "12px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", marginBottom: "8px" }}>
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
                                        border: "1px solid #93c5fd",
                                        background: "#eff6ff",
                                        color: "#1d4ed8",
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
                                    padding: "10px 20px",
                                    borderRadius: "10px",
                                    border: "none",
                                    background: "#3b82f6",
                                    color: "#ffffff",
                                    fontWeight: "700",
                                    fontSize: "14px",
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
                            <div style={{ fontSize: "13px", color: "#64748b" }}>Match items on left with right.</div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                              {currentQ.leftItems.map((lhs: string) => {
                                const matchedRhs = matchSelections[lhs];
                                const isCorrectMatch = matchedRhs === currentQ.correctPairs[lhs];
                                return (
                                  <div key={lhs} style={{ padding: "10px", border: "1.5px dashed #cbd5e1", borderRadius: "10px", background: "#f8fafc" }}>
                                    <div style={{ fontWeight: "700", color: "#1e293b", fontSize: "14px" }}>{lhs}</div>
                                    {matchedRhs && (
                                      <div style={{ marginTop: "4px", fontSize: "13px", color: submitted ? (isCorrectMatch ? "#16a34a" : "#ef4444") : "#3b82f6", fontWeight: "600" }}>
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
                                  padding: "10px 20px",
                                  borderRadius: "10px",
                                  border: "none",
                                  background: "#3b82f6",
                                  color: "#ffffff",
                                  fontWeight: "700",
                                  fontSize: "14px",
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
                          <div style={{ fontSize: "14px", color: "#64748b" }}>
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
                      marginTop: "14px",
                      borderRadius: "12px",
                      border: `1.5px solid ${currentIsCorrect ? "#4ade80" : "#f87171"}`,
                      background: currentIsCorrect ? "#f0fdf4" : "#fff5f5",
                      padding: "12px 16px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                    }}
                  >
                      {/* Status + correct option in one row */}
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                        <span style={{
                          fontWeight: "800",
                          fontSize: "13px",
                          color: currentIsCorrect ? "#16a34a" : "#ef4444",
                          display: "flex", alignItems: "center", gap: "4px",
                        }}>
                          {currentIsCorrect ? "✓ Correct!" : "✕ Incorrect"}
                        </span>
                        {!currentIsCorrect && (
                          <span style={{ fontSize: "12px", color: "#64748b", display: "flex", alignItems: "center", gap: "4px" }}>
                            Correct option:
                            <span style={{
                              background: "#dcfce7", color: "#16a34a", fontWeight: "800",
                              borderRadius: "5px", padding: "1px 7px", fontSize: "12px",
                              border: "1px solid #4ade80",
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
                        fontSize: "13px",
                        color: "#334155",
                        lineHeight: "1.5",
                        fontWeight: "500",
                        maxHeight: "120px",
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

              {/* Card Footer: Floating / Right-aligned Circular Next Button (matching 2nd Figma screenshot) */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  alignItems: "center",
                  width: "100%",
                  marginTop: "10px",
                  flexShrink: 0,
                }}
              >
                <button
                  type="button"
                  onClick={submitted ? handleNext : (currentQ.type === "msq" ? handleMSQSubmit : handleSkip)}
                  title={submitted ? (step === questions.length - 1 ? "Finish Assessment" : "Next Question") : (currentQ.type === "msq" ? "Submit Answer" : "Next / Skip")}
                  aria-label="Next Question"
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    border: "none",
                    background: "#263B30",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    boxShadow: "0 3px 10px rgba(38, 59, 48, 0.3)",
                    transition: "transform 0.2s ease, background 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "scale(1.1)";
                    e.currentTarget.style.background = "#1B2C23";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                    e.currentTarget.style.background = "#263B30";
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </button>
              </div>

            </div>

            {/* Right Action Icons shown only on Last Assessment Question */}
            {step < questions.length - 1 ? null : (
              /* Inline Action Icons on Last Assessment Question (Same horizontal axis beside card box) */
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "10px",
                  flexShrink: 0,
                }}
              >
                {/* 0. Finish Assessment Checkmark Button (shown when submitted) */}
                {submitted && (
                  <button
                    type="button"
                    onClick={handleNext}
                    title="Finish Assessment"
                    aria-label="Finish Assessment"
                    style={{
                      width: "42px",
                      height: "42px",
                      borderRadius: "50%",
                      border: "none",
                      background: "linear-gradient(135deg, #22c55e, #16a34a)",
                      color: "#ffffff",
                      boxShadow: "0 4px 14px rgba(34, 197, 94, 0.4)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      transition: "transform 0.2s ease, box-shadow 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "scale(1.1)";
                      e.currentTarget.style.boxShadow = "0 6px 18px rgba(34, 197, 94, 0.5)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "scale(1)";
                      e.currentTarget.style.boxShadow = "0 4px 14px rgba(34, 197, 94, 0.4)";
                    }}
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </button>
                )}

                {/* 1a. Level Down Button */}
                {persona !== 'beginner' && (
                  <button
                    type="button"
                    onClick={() => {
                      if (persona === "advanced") setPersona?.("intermediate");
                      else if (persona === "intermediate") setPersona?.("beginner");
                    }}
                    title={`Level Down to ${persona === 'advanced' ? 'Intermediate' : 'Beginner'}`}
                    style={{
                      width: "42px",
                      height: "42px",
                      borderRadius: "50%",
                      background: "#ffffff",
                      border: "1.5px solid #2563eb",
                      boxShadow: "0 4px 12px rgba(37, 99, 235, 0.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      transition: "transform 0.2s ease, box-shadow 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "scale(1.1)";
                      e.currentTarget.style.boxShadow = "0 6px 16px rgba(37, 99, 235, 0.25)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "scale(1)";
                      e.currentTarget.style.boxShadow = "0 4px 12px rgba(37, 99, 235, 0.15)";
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                )}

                {/* 1b. Level Up Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (persona === "beginner") setPersona?.("intermediate");
                    else if (persona === "intermediate") setPersona?.("advanced");
                    else setPersona?.("beginner");
                  }}
                  title={`Level Up to ${persona === 'beginner' ? 'Intermediate' : persona === 'intermediate' ? 'Advanced' : 'Beginner'}`}
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #0088ff, #0066cc)",
                    border: "none",
                    boxShadow: "0 4px 14px rgba(0, 136, 255, 0.4)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "scale(1.1)";
                    e.currentTarget.style.boxShadow = "0 6px 18px rgba(0, 136, 255, 0.5)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                    e.currentTarget.style.boxShadow = "0 4px 14px rgba(0, 136, 255, 0.4)";
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="18 15 12 9 6 15" />
                  </svg>
                </button>

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
