import React, { useEffect, useRef, useState } from "react";
import MarkdownView from "@/components/MarkdownView";
import { getAssessments } from "@/data/contentRepository";
import { parseQuestionBank } from "@/utils/quizParser";
import type { AssessmentQuestion } from "@/utils/assessmentTypes";
import { StudyToolLoadingWaitScreen } from "@/pages/StudyTable";

export interface AssessmentViewProps {
  markdownContent: string;
  subjectId: string;
  chapterNumber: number;
  persona: string;
  onQuit: () => void;
  setPersona?: (p: string) => void;
  setActiveTool?: (t: any) => void;
  /** Video-scoped asset directory in a segmented chapter. */
  videoDir?: string;
}

export function AssessmentView({
  markdownContent,
  subjectId,
  chapterNumber,
  persona,
  onQuit,
  setPersona,
  setActiveTool,
  videoDir,
}: AssessmentViewProps) {
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
      setFillInputs(new Array((currentQ as any).correctAnswers.length).fill(""));
      setActiveBlankIndex(0);
      const choices = [...(currentQ as any).correctAnswers];
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
      setSequencedItems([...(currentQ as any).items].sort(() => 0.5 - Math.random()));
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
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "20px",
              width: "100%",
              height: "100%",
              flex: 1,
              padding: "0px",
              marginTop: "0px",
              boxSizing: "border-box",
            }}
          >
            {/* Assessment card with floating badges (zero block layout impact) */}
            <div
              className="quiz-card assessment-view"
              style={{
                width: "85%",
                flex: 1,
                minWidth: 0,
                maxWidth: "960px",
                height: "auto",
                minHeight: "450px",
                display: "flex",
                flexDirection: "column",
                margin: "0 16px",
                background: persona === 'intermediate' ? '#0088FF33' : persona === 'advanced' ? '#0088FF4D' : '#0088FF1A',
                border: "1.5px solid #0088FF4D",
                borderRadius: "20px",
                boxShadow: "0 12px 36px rgba(59, 130, 246, 0.12)",
                position: "relative",
                padding: "24px",
                boxSizing: "border-box",
              }}
            >
              {/* Floating Question Number Badge (Top-Left, Position Absolute) */}
              <div
                style={{
                  position: "absolute",
                  top: "12px",
                  left: "24px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  zIndex: 10,
                  pointerEvents: "none",
                }}
              >
                <div
                  style={{
                    padding: "3px 12px",
                    borderRadius: "14px",
                    background: "#eff6ff",
                    border: "1.5px solid #3b82f6",
                    color: "#1d4ed8",
                    fontWeight: "800",
                    fontSize: "13px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 2px 5px rgba(59, 130, 246, 0.12)",
                  }}
                >
                  {step + 1} / {questions.length}
                </div>
              </div>

              {/* Floating Difficulty Tag (Top-Right, Position Absolute) */}
              <div
                style={{
                  position: "absolute",
                  top: "12px",
                  right: "24px",
                  background: "#eff6ff",
                  border: "1.5px solid #93c5fd",
                  padding: "2px 10px",
                  borderRadius: "20px",
                  color: "#2563eb",
                  fontWeight: "700",
                  fontSize: "11px",
                  textTransform: "uppercase",
                  letterSpacing: "0.4px",
                  zIndex: 10,
                  pointerEvents: "none",
                  boxShadow: "0 2px 5px rgba(59, 130, 246, 0.08)",
                }}
              >
                {persona === 'beginner' ? 'Easy' : persona === 'intermediate' ? 'Medium' : persona === 'advanced' ? 'Hard' : 'Easy'}
              </div>

              {/* Single Floating Bottom-Right MSQ Submit Button (Empty Space in Bottom Right) */}
              {currentQ.type === "msq" && !submitted && (
                <button
                  onClick={handleMSQSubmit}
                  disabled={selectedMSQ.length === 0}
                  style={{
                    position: "absolute",
                    bottom: "16px",
                    right: "24px",
                    padding: "9px 24px",
                    borderRadius: "22px",
                    border: "none",
                    background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                    color: "#ffffff",
                    fontWeight: "800",
                    fontSize: "13.5px",
                    letterSpacing: "0.2px",
                    cursor: selectedMSQ.length === 0 ? "not-allowed" : "pointer",
                    opacity: selectedMSQ.length === 0 ? 0.45 : 1,
                    boxShadow: "0 6px 18px rgba(37, 99, 235, 0.32)",
                    zIndex: 30,
                    transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
                >
                  Submit Answer →
                </button>
              )}
              {/* Split Body: 2-Column Grid with GPU Hardware-Accelerated 60fps Sliding */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
                  gridTemplateRows: "minmax(0, 1fr)",
                  gap: "28px",
                  width: "100%",
                  flex: 1,
                  minHeight: 0,
                  alignItems: "stretch",
                  marginTop: "0px",
                  marginBottom: "4px",
                }}
              >
                {/* ── LEFT COLUMN: Question & Options (Centered when unanswered, GPU hardware slides smoothly to left on submit) ── */}
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

                  const qFontSize = isExtreme ? "14px" : isUltraLong ? "15.5px" : isLongQ ? "17px" : "19px";
                  const optTextSize = isExtreme ? "13.5px" : isUltraLong ? "14.5px" : isLongQ ? "15.5px" : "17px";

                  const qLineHeight = isExtreme ? "1.3" : isUltraLong ? "1.35" : isLongQ ? "1.4" : "1.45";
                  const qMarginBottom = isExtreme ? "12px" : isUltraLong ? "16px" : isLongQ ? "20px" : "28px";

                  const optGap = isExtreme ? "8px" : isUltraLong ? "12px" : isLongQ ? "16px" : "20px";
                  const optPadding = isExtreme ? "10px 14px" : isUltraLong ? "12px 18px" : isLongQ ? "14px 20px" : "18px 26px";
                  const optLineHeight = isExtreme ? "1.25" : isUltraLong ? "1.3" : isLongQ ? "1.35" : "1.42";

                  const badgeSize = isExtreme ? "26px" : isUltraLong ? "28px" : isLongQ ? "32px" : "36px";
                  const badgeFont = isExtreme ? "13px" : isUltraLong ? "13.5px" : isLongQ ? "14.5px" : "15.5px";
                  const radioSize = isExtreme ? "28px" : isUltraLong ? "32px" : isLongQ ? "36px" : "40px";
                  const dotSize = isExtreme ? "11px" : isUltraLong ? "13px" : isLongQ ? "15px" : "18px";

                  return (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "flex-start",
                        width: "100%",
                        maxWidth: "100%",
                        height: "100%",
                        paddingRight: "4px",
                        transform: submitted ? "translate3d(0, 0, 0)" : "translate3d(calc(50% + 14px), 0, 0)",
                        transition: "transform 0.55s cubic-bezier(0.16, 1, 0.3, 1)",
                        willChange: "transform",
                        WebkitFontSmoothing: "antialiased",
                        MozOsxFontSmoothing: "grayscale",
                      }}
                    >
                      <div style={{ margin: "0" }}>
                        {/* Question Title (Roman / Serif Editorial Typography) */}
                        <div
                          className="quiz-q"
                          style={{
                            fontSize: qFontSize,
                            fontFamily: "'Georgia', 'Cambria', 'Times New Roman', Times, serif",
                            fontWeight: "600",
                            color: "#0f172a",
                            lineHeight: "1.42",
                            letterSpacing: "0.1px",
                            marginTop: "22px",
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
                            {(currentQ as any).options.map((option: string, idx: number) => {
                              const isSelected = selectedMCQ === idx;
                              const isCorrectAnswer = idx === (currentQ as any).answer;

                              const optionBadgeColors = ["#FCDE91", "#F0B0FC", "#AEF4FC", "#FFE7D6"];
                              const optColorHex = optionBadgeColors[idx % 4];

                              let borderStyle = "1.5px solid rgba(0, 0, 0, 0.08)";
                              let bgStyle = optColorHex;
                              let radioBorder = "#475569";
                              let radioBg = "#ffffff";
                              let showDot = false;
                              let rightIcon = null;
                              let badgeBg = "#ffffff";
                              let badgeColor = "#0f172a";

                              if (isSelected) {
                                borderStyle = "2.5px solid #16a34a";
                                bgStyle = optColorHex;
                                radioBorder = "#16a34a";
                                radioBg = "#16a34a";
                                showDot = true;
                                badgeBg = "#16a34a";
                                badgeColor = "#ffffff";
                              }

                              if (submitted) {
                                if (isCorrectAnswer) {
                                  borderStyle = "2px solid #34C759";
                                  bgStyle = "#34C75933";
                                  radioBorder = "#34C759";
                                  radioBg = "#34C759";
                                  showDot = true;
                                  badgeBg = "#34C759";
                                  badgeColor = "#ffffff";
                                  rightIcon = (
                                    <span style={{ color: "#34C759", fontWeight: "800", fontSize: "18px", marginLeft: "auto", paddingRight: "4px" }}>
                                      ✓
                                    </span>
                                  );
                                } else if (isSelected) {
                                  borderStyle = "2px solid #FF383C";
                                  bgStyle = "#FF383C1A";
                                  radioBorder = "#FF383C";
                                  radioBg = "#FF383C";
                                  showDot = true;
                                  badgeBg = "#FF383C";
                                  badgeColor = "#ffffff";
                                  rightIcon = (
                                    <span style={{ color: "#FF383C", fontWeight: "800", fontSize: "18px", marginLeft: "auto", paddingRight: "4px" }}>
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
                                    alignItems: isExtreme || isUltraLong ? "flex-start" : "center",
                                    gap: isExtreme ? "8px" : isUltraLong ? "10px" : isLongQ ? "12px" : "14px",
                                    width: "100%",
                                    padding: optPadding,
                                    borderRadius: isExtreme || isUltraLong ? "8px" : "12px",
                                    border: borderStyle,
                                    background: bgStyle,
                                    cursor: submitted ? "default" : "pointer",
                                    willChange: "transform, font-size, padding",
                                    transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                                    textAlign: "left",
                                    transform: "translate3d(0, 0, 0)",
                                    boxShadow: isSelected ? "0 4px 14px rgba(0, 0, 0, 0.12)" : "0 2px 6px rgba(0, 0, 0, 0.04)",
                                  }}
                                >
                                  {/* Radio Button (Doubled Size 36px) */}
                                  <div
                                    style={{
                                      width: radioSize,
                                      height: radioSize,
                                      borderRadius: "50%",
                                      border: `2.5px solid ${radioBorder}`,
                                      background: radioBg,
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      flexShrink: 0,
                                      marginTop: isExtreme || isUltraLong ? "2px" : "0",
                                    }}
                                  >
                                    {showDot && (
                                      <div
                                        style={{
                                          width: dotSize,
                                          height: dotSize,
                                          borderRadius: "50%",
                                          background: "#ffffff",
                                        }}
                                      />
                                    )}
                                  </div>

                                  <div
                                    style={{
                                      width: badgeSize,
                                      height: badgeSize,
                                      borderRadius: "6px",
                                      background: badgeBg,
                                      color: badgeColor,
                                      fontWeight: "700",
                                      fontSize: badgeFont,
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      flexShrink: 0,
                                      marginTop: isExtreme || isUltraLong ? "1px" : "0",
                                    }}
                                  >
                                    {String.fromCharCode(65 + idx)}
                                  </div>

                                  <div style={{ flex: 1, color: "#0f172a", fontFamily: "'Georgia', 'Cambria', 'Times New Roman', Times, serif", fontWeight: "400", fontSize: optTextSize, lineHeight: optLineHeight }}>
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
                          <div className="quiz-options" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                            {(currentQ as any).options.map((option: string, idx: number) => {
                              const isSelected = selectedMSQ.includes(idx);
                              const isCorrectOption = (currentQ as any).answer.includes(idx);

                              const optionBadgeColors = ["#FCDE91", "#F0B0FC", "#AEF4FC", "#FFE7D6"];
                              const optColorHex = optionBadgeColors[idx % 4];

                              let borderStyle = "1.5px solid rgba(0, 0, 0, 0.08)";
                              let bgStyle = optColorHex;
                              let badgeBg = "#ffffff";
                              let badgeColor = "#0f172a";
                              let rightIcon = null;
                              let checkboxBorder = isSelected ? "#16a34a" : "#cbd5e1";
                              let checkboxBg = isSelected ? "#16a34a" : "#ffffff";
                              let showCheckmark = isSelected;

                              if (isSelected) {
                                borderStyle = "2.5px solid #16a34a";
                                bgStyle = optColorHex;
                                badgeBg = "#16a34a";
                                badgeColor = "#ffffff";
                              }

                              if (submitted) {
                                if (isCorrectOption) {
                                  borderStyle = "2px solid #34C759";
                                  bgStyle = "#34C75933";
                                  badgeBg = "#34C759";
                                  badgeColor = "#ffffff";
                                  checkboxBorder = "#34C759";
                                  checkboxBg = "#34C759";
                                  showCheckmark = true;
                                  rightIcon = <span style={{ color: "#34C759", fontWeight: "800", marginLeft: "auto" }}>✓</span>;
                                } else if (isSelected) {
                                  borderStyle = "2px solid #FF383C";
                                  bgStyle = "#FF383C1A";
                                  badgeBg = "#FF383C";
                                  badgeColor = "#ffffff";
                                  checkboxBorder = "#FF383C";
                                  checkboxBg = "#FF383C";
                                  rightIcon = <span style={{ color: "#FF383C", fontWeight: "800", marginLeft: "auto" }}>✕</span>;
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
                                    padding: "10px 14px",
                                    borderRadius: "14px",
                                    border: borderStyle,
                                    background: bgStyle,
                                    cursor: submitted ? "default" : "pointer",
                                    textAlign: "left",
                                    boxShadow: isSelected ? "0 4px 14px rgba(0, 0, 0, 0.12)" : "0 2px 6px rgba(0, 0, 0, 0.04)",
                                  }}
                                >
                                  {/* Checkbox (Doubled Size 34px) */}
                                  <div
                                    style={{
                                      width: radioSize,
                                      height: radioSize,
                                      borderRadius: "7px",
                                      border: `2.5px solid ${checkboxBorder}`,
                                      background: checkboxBg,
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      flexShrink: 0,
                                    }}
                                  >
                                    {showCheckmark && (
                                      <svg width={dotSize} height={dotSize} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5">
                                        <polyline points="20 6 9 17 4 12" />
                                      </svg>
                                    )}
                                  </div>

                                  <div
                                    style={{
                                      width: "32px",
                                      height: "32px",
                                      borderRadius: "8px",
                                      background: badgeBg,
                                      color: badgeColor,
                                      fontWeight: "700",
                                      fontSize: "14px",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      flexShrink: 0,
                                    }}
                                  >
                                    {String.fromCharCode(65 + idx)}
                                  </div>

                                  <div style={{ flex: 1, color: "#1e293b", fontFamily: "'Georgia', 'Cambria', 'Times New Roman', Times, serif", fontWeight: "400", fontSize: optTextSize, lineHeight: optLineHeight }}>
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
                          <div style={{ display: "flex", gap: "16px", justifyContent: "center", marginTop: "12px" }}>
                            {[true, false].map((val) => {
                              const isSelected = selectedTF === val;
                              const isCorrectAnswer = val === (currentQ as any).answer;

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
                              {currentQ.q.split("[blank]").map((segment: string, idx: number, arr: any[]) => (
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
                              {(currentQ as any).leftItems.map((lhs: string) => {
                                const matchedRhs = matchSelections[lhs];
                                const isCorrectMatch = matchedRhs === (currentQ as any).correctPairs[lhs];
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

                {/* ── RIGHT COLUMN: Dynamic Status & Explanation Panel (GPU-Accelerated Pop Up & Fade In) ── */}
                <div
                  className="quiz-slide-right"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    height: "100%",
                    position: "relative",
                    opacity: submitted ? 1 : 0,
                    transform: submitted ? "translate3d(0, 0, 0) scale(1)" : "translate3d(45px, 0, 0) scale(0.97)",
                    pointerEvents: submitted ? "auto" : "none",
                    visibility: submitted ? "visible" : "hidden",
                    transition: "opacity 0.52s cubic-bezier(0.16, 1, 0.3, 1), transform 0.55s cubic-bezier(0.16, 1, 0.3, 1), visibility 0.52s ease",
                    willChange: "transform, opacity",
                  }}
                >
                  {/* Case 1: Answered & Correct State */}
                  {submitted && currentIsCorrect && (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        margin: "0",
                        maxHeight: "100%",
                        minHeight: "260px",
                        borderRadius: "20px",
                        border: "1.5px solid #4ade80",
                        background: "#ffffff",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        padding: "20px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                        textAlign: "center",
                      }}
                    >
                      <div
                        style={{
                          width: "80px",
                          height: "80px",
                          borderRadius: "50%",
                          backgroundColor: "#22c55e",
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          marginBottom: "16px",
                          boxShadow: "0 4px 12px rgba(34, 197, 94, 0.25)",
                        }}
                      >
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                      <div style={{ color: "#16a34a", fontWeight: "700", fontSize: "20px" }}>
                        That's Correct!
                      </div>
                    </div>
                  )}

                  {/* Case 2: Answered & Incorrect State */}
                  {submitted && !currentIsCorrect && (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        margin: "0",
                        maxHeight: "100%",
                        minHeight: "260px",
                        borderRadius: "20px",
                        border: "1.5px solid #f87171",
                        background: "#ffffff",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "flex-start",
                        padding: "20px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                        textAlign: "left",
                      }}
                    >
                      {/* Top Header Row */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          width: "100%",
                          paddingBottom: "4px",
                        }}
                      >
                        {/* Incorrect Title */}
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#ef4444", fontWeight: "800", fontSize: "17px" }}>
                          <span>✕</span>
                          <span>Incorrect</span>
                        </div>
                        {/* Correct Option Badge */}
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" }}>
                          <span style={{ color: "#16a34a", fontWeight: "600" }}>Correct option:</span>
                          <span
                            style={{
                              border: "1px solid #4ade80",
                              background: "#f0fdf4",
                              color: "#16a34a",
                              fontWeight: "800",
                              borderRadius: "6px",
                              padding: "1px 8px",
                            }}
                          >
                            {typeof (currentQ as any).answer === 'number'
                              ? String.fromCharCode(65 + (currentQ as any).answer)
                              : Array.isArray((currentQ as any).answer)
                                ? (currentQ as any).answer.map((a: number) => String.fromCharCode(65 + a)).join(', ')
                                : (currentQ as any).correctAnswers
                                  ? (currentQ as any).correctAnswers.join(', ')
                                  : String((currentQ as any).answer || '')}
                          </span>
                        </div>
                      </div>

                      {/* Explanation Title */}
                      <div style={{ color: "#3b82f6", fontFamily: "'Georgia', 'Cambria', 'Times New Roman', Times, serif", fontWeight: "700", fontSize: "15px", marginTop: "4px", marginBottom: "6px" }}>
                        Explanation:
                      </div>

                      {/* Explanation Text (Auto-expanding height, scrollable when long) */}
                      <div
                        style={{
                          color: "#334155",
                          fontFamily: "'Georgia', 'Cambria', 'Times New Roman', Times, serif",
                          fontSize: "14px",
                          lineHeight: "1.52",
                          fontWeight: "500",
                          overflowY: "auto",
                          flex: 1,
                          paddingBottom: "56px",
                        }}
                      >
                        <MarkdownView
                          content={
                            (currentQ.explanation || "No detailed explanation provided.")
                              .replace(/^(?:\*\*)?(?:Explanation|Brief Explanation|Solution|Answer|Model Answer|Outline Answer|Rationale|وضاحت)(?:\*\*)?[:\s-]*\s*/gi, '')
                              .replace(/Rationale:\*\*\s*(?:correct:)?/gi, '')
                              .replace(/---\s*#/g, '')
                              .trim() || "No detailed explanation provided."
                          }
                        />
                      </div>
                    </div>
                  )}
                  {/* Floating Next / Finish Arrow Button (Absolute Floating Component, Zero Layout Shift) */}
                  {submitted && (
                    <button
                      onClick={handleNext}
                      title={step < questions.length - 1 ? "Next Question" : "Finish Assessment"}
                      aria-label="Next Question"
                      style={{
                        position: "absolute",
                        bottom: "20px",
                        right: "20px",
                        width: "48px",
                        height: "48px",
                        borderRadius: "50%",
                        border: "none",
                        background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                        color: "#ffffff",
                        fontWeight: "800",
                        fontSize: "20px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        boxShadow: "0 6px 20px rgba(37, 99, 235, 0.4)",
                        zIndex: 30,
                        transition: "transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), boxShadow 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "scale(1.1)";
                        e.currentTarget.style.boxShadow = "0 8px 24px rgba(37, 99, 235, 0.5)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "scale(1)";
                        e.currentTarget.style.boxShadow = "0 6px 20px rgba(37, 99, 235, 0.4)";
                      }}
                    >
                      {step < questions.length - 1 ? "→" : "✓"}
                    </button>
                  )}
                </div>
              </div>

              {/* Inline Action Icons on Last Assessment Question (Vertical axis on the right side of card box) */}
              {step === questions.length - 1 && (
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    right: "20px",
                    transform: "translateY(-50%)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "10px",
                    flexShrink: 0,
                    zIndex: 50,
                  }}
                >
                  {/* 1. Level Up Button */}
                  <button
                    type="button"
                    onClick={() => {
                      if (persona === "beginner") setPersona?.("intermediate");
                      else if (persona === "intermediate") setPersona?.("advanced");
                      else setPersona?.("beginner");
                    }}
                    title={`Current Level: ${persona}. Click to Level Up`}
                    style={{
                      width: "42px",
                      height: "42px",
                      borderRadius: "50%",
                      background: "#ffffff",
                      border: "1.5px solid #0f172a",
                      boxShadow: "0 4px 12px rgba(15, 23, 42, 0.12)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      padding: "5px",
                      boxSizing: "border-box",
                      transition: "transform 0.2s ease, boxShadow 0.2s ease",
                    }}
                  >
                    <img
                      src={`${import.meta.env.BASE_URL}icon-level-up.png`}
                      alt="Level Up"
                      style={{ width: "100%", height: "100%", objectFit: "contain" }}
                    />
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
                      transition: "transform 0.2s ease, boxShadow 0.2s ease",
                    }}
                  >
                    <img
                      src={`${import.meta.env.BASE_URL}icon-quick-study.png`}
                      alt="Quick Study"
                      style={{ width: "100%", height: "100%", objectFit: "contain" }}
                    />
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
                      transition: "transform 0.2s ease, boxShadow 0.2s ease",
                    }}
                  >
                    <img
                      src={`${import.meta.env.BASE_URL}icon-detailed-study.png`}
                      alt="Detailed Study"
                      style={{ width: "100%", height: "100%", objectFit: "contain" }}
                    />
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
                      transition: "transform 0.2s ease, boxShadow 0.2s ease",
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
          </div>
        </>
      )}
    </>
  );
}

export default AssessmentView;
