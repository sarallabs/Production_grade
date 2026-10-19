import React, { useState, useEffect, useMemo } from "react";
import {
  QuestionCard,
  MANAGEMENT_MOCKED_QUESTIONS,
  ANU_PHYSICS_MOCKED_QUESTIONS,
  ANU_CHARACTERIZATION_MOCKED_QUESTIONS,
} from "@/pages/PreviousYearQuestions";
import {
  getRegistryChapterData,
  getSubjectBaseUrl,
  getLocalSubjectBaseUrl,
  getChapterDir,
  resolveSubjectId,
} from "@/data/manifestService";

/**
 * Displays Previous Year Questions for the selected subject and chapter.
 * Cloud-native: loads `prepare/previous_year.json` via signed URL or dynamic subject base URL.
 */
export default function PYQView({
  subjectName,
  subjectId,
  chapterNumber,
  chapterName,
  onSOS,
}: {
  subjectName: string;
  subjectId: string;
  chapterNumber: number;
  chapterName?: string;
  onSOS: (subjectId: string, chapterNumber: number) => void;
}) {
  const [selectedYear, setSelectedYear] = useState("All Years");
  const [baseQuestions, setBaseQuestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const chapterTitle = chapterName?.trim() || `Chapter ${chapterNumber}`;

  useEffect(() => {
    let cancelled = false;
    async function loadPYQs() {
      setIsLoading(true);
      try {
        const regChapter = await getRegistryChapterData(subjectId, chapterNumber);
        const normSub = resolveSubjectId(subjectId) || subjectId;
        const chDir = getChapterDir(subjectId, chapterNumber);
        const subBase = getSubjectBaseUrl(subjectId);
        const localBase = getLocalSubjectBaseUrl(subjectId);

        const candidates = [
          regChapter?.files?.["prepare/previous_year.json"],
          `${subBase}/${chDir}/prepare/previous_year.json`,
          `${localBase}/${chDir}/prepare/previous_year.json`,
          `${localBase}/${chDir}/Prepare/PYQ/${normSub}_pyq.json`,
          `${localBase}/${chDir}/Prepare/PYQ/${subjectId}_pyq.json`,
        ].filter(Boolean) as string[];

        for (const candidateUrl of candidates) {
          try {
            const res = await fetch(candidateUrl);
            const ct = (res.headers.get("content-type") || "").toLowerCase();
            if (!res.ok || ct.includes("text/html")) continue;
            const rawText = (await res.text()).trim();
            if (!rawText.startsWith("{") && !rawText.startsWith("[")) continue;
            const data = JSON.parse(rawText);
            const items = Array.isArray(data)
              ? data
              : data.questions || data.pyqs || data.items || [];
            if (items.length > 0 && !cancelled) {
              const mapped = items.map((q: any, i: number) => {
                // Support both contract/v1 previous_year.schema.json and rich repetition metadata
                const years: string[] = q.repetition_metadata?.repeated_years || [];
                const latestYearStr = years[years.length - 1] || (q.year ? String(q.year) : "2024");
                const yrNum =
                  typeof q.year === "number"
                    ? q.year
                    : parseInt(String(latestYearStr).replace(/[^0-9]/g, "").slice(0, 4)) || 2024;
                const marksVal =
                  typeof q.marks === "number"
                    ? q.marks
                    : q.designated_mark_tier === "10M"
                      ? 10
                      : q.designated_mark_tier === "5M"
                        ? 5
                        : 2;
                const tier = q.designated_mark_tier || `${marksVal}M`;
                const fullAnswer: string = q.model_answer || q.longAnswer || q.answer || "";
                const shortAns: string =
                  q.shortAnswer || fullAnswer.split(/\n\s*\n/)[0]?.trim() || fullAnswer;

                return {
                  id:
                    typeof q.id === "number"
                      ? q.id
                      : (q.pyq_id && parseInt(String(q.pyq_id).replace(/[^0-9]/g, ""))) || i + 1,
                  text: q.canonical_question_stem || q.question || q.text || "",
                  shortAnswer: shortAns,
                  longAnswer: q.examiner_notes
                    ? `${fullAnswer}\n\n> **Examiner Notes:** ${q.examiner_notes}`
                    : fullAnswer,
                  chapter: `Chapter ${chapterNumber}`,
                  section: q.section || tier,
                  marks: marksVal,
                  subjectId,
                  chapterNumber,
                  year: yrNum,
                  frequency: q.repetition_metadata?.total_frequency_count || q.frequency,
                  repeatedYears: years.length > 0 ? years.join(", ") : q.repeatedYears,
                };
              });
              mapped.sort(
                (a: any, b: any) => (b.frequency ?? 0) - (a.frequency ?? 0) || b.marks - a.marks,
              );
              setBaseQuestions(mapped);
              setIsLoading(false);
              return;
            }
          } catch {
            // try next candidate
          }
        }
      } catch (e) {
        console.warn("[PYQView] Registry PYQ fetch failed:", e);
      }

      if (cancelled) return;

      if (subjectId === "neb_xii_biology") {
        try {
          const res = await fetch(
            `/generated_resources/neb_nepal/class_12/biology/chapter_06/Prepare/PYQs/Chapter_Level/pyq_chapter_6.json`,
          );
          const ct = res.headers.get("content-type") || "";
          if (res.ok && !ct.includes("text/html")) {
            const data = await res.json();
            const items = Array.isArray(data) ? data : data.pyqs || data.items || [];
            const mapped = items.map((q: any, i: number) => ({
              id: (q.id && parseInt(q.id.replace(/[^0-9]/g, ""))) || i + 1,
              text: (q.stem || q.question || "") + (q.options ? "\n\n" + q.options.join("\n") : ""),
              shortAnswer: q.answer || "",
              longAnswer: q.explanation || "",
              chapter: `Chp: ${chapterNumber}`,
              section: q.exam || "General",
              marks: 1,
              subjectId,
              chapterNumber,
              year: q.exam ? parseInt(q.exam.replace(/[^0-9]/g, "")) || 2024 : 2024,
            }));
            setBaseQuestions(mapped);
            setIsLoading(false);
            return;
          }
        } catch {
          // ignore
        }
      }

      const questions =
        subjectId === "management"
          ? MANAGEMENT_MOCKED_QUESTIONS
          : subjectId === "anu_physics"
            ? ANU_PHYSICS_MOCKED_QUESTIONS
            : subjectId === "anu_characterization"
              ? ANU_CHARACTERIZATION_MOCKED_QUESTIONS
              : [];
      setBaseQuestions(questions);
      setIsLoading(false);
    }

    loadPYQs();
    return () => {
      cancelled = true;
    };
  }, [subjectId, chapterNumber]);

  const yearsOf = (q: any): number[] => {
    const rep =
      typeof q.repeatedYears === "string" && q.repeatedYears
        ? q.repeatedYears
            .split(",")
            .map((s: string) => parseInt(s.trim()))
            .filter((n: number) => !isNaN(n))
        : [];
    return rep.length ? rep : typeof q.year === "number" ? [q.year] : [];
  };

  const availableYearsForSubject = useMemo(() => {
    const years = baseQuestions.flatMap(yearsOf);
    return Array.from(new Set(years)).sort((a, b) => b - a);
  }, [baseQuestions]);

  const [selectedMarks, setSelectedMarks] = useState<number | null>(null);
  const availableMarks = useMemo(
    () => Array.from(new Set(baseQuestions.map((q) => q.marks as number))).sort((a, b) => a - b),
    [baseQuestions],
  );

  useEffect(() => {
    setSelectedYear("All Years");
    setSelectedMarks(null);
  }, [subjectId, chapterNumber]);

  useEffect(() => {
    if (selectedYear !== "All Years" && !availableYearsForSubject.includes(parseInt(selectedYear))) {
      setSelectedYear("All Years");
    }
  }, [subjectId, availableYearsForSubject, selectedYear]);

  const displayQuestions = baseQuestions.filter(
    (q) =>
      (selectedYear === "All Years" || yearsOf(q).includes(parseInt(selectedYear))) &&
      (selectedMarks === null || q.marks === selectedMarks),
  );

  if (isLoading) {
    return (
      <div
        className="pyq-view"
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
          minHeight: "360px",
          padding: "20px",
          color: "var(--text-secondary)",
        }}
      >
        <p>Loading PYQs...</p>
      </div>
    );
  }

  if (baseQuestions.length === 0) {
    return (
      <div
        className="pyq-view"
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "360px",
          height: "100%",
          padding: "32px 20px",
          color: "var(--text-secondary)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            background: "rgba(59, 130, 246, 0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "16px",
            color: "#3b82f6",
          }}
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        </div>
        <h3
          style={{
            fontSize: "1.15rem",
            fontWeight: "700",
            color: "var(--text-primary)",
            marginBottom: "6px",
          }}
        >
          PYQs are not available for {chapterTitle}
        </h3>
        <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", maxWidth: "420px", margin: 0 }}>
          Previous year questions have not been added for this chapter yet. You can explore Assessment or Question Bank instead.
        </p>
      </div>
    );
  }

  return (
    <div className="pyq-view">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "16px",
        }}
      >
        <div
          className="pyq-year-selector"
          style={{
            display: "flex",
            gap: "8px",
            flexWrap: "wrap",
            marginTop: "-8px",
            justifyContent: "center",
          }}
        >
          <button
            onClick={() => setSelectedYear("All Years")}
            className={`pyq-year-btn ${selectedYear === "All Years" ? "active" : ""}`}
          >
            All Years
          </button>
          {availableYearsForSubject.map((yearVal) => (
            <button
              key={yearVal}
              onClick={() => setSelectedYear(yearVal.toString())}
              className={`pyq-year-btn ${selectedYear === yearVal.toString() ? "active" : ""}`}
            >
              {yearVal}
            </button>
          ))}
        </div>
      </div>

      {availableMarks.length > 1 && (
        <div
          style={{
            display: "flex",
            gap: "8px",
            flexWrap: "wrap",
            justifyContent: "center",
            marginBottom: "16px",
          }}
        >
          <button
            onClick={() => setSelectedMarks(null)}
            className={`pyq-year-btn ${selectedMarks === null ? "active" : ""}`}
          >
            All Marks
          </button>
          {availableMarks.map((m) => (
            <button
              key={m}
              onClick={() => setSelectedMarks(m)}
              className={`pyq-year-btn ${selectedMarks === m ? "active" : ""}`}
            >
              {m}M
            </button>
          ))}
        </div>
      )}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "32px",
          overflowY: "auto",
          paddingBottom: "40px",
        }}
      >
        {displayQuestions.map((q) => (
          <QuestionCard
            key={q.id}
            question={q}
            onSOS={() => onSOS(q.subjectId, q.chapterNumber)}
          />
        ))}
      </div>
    </div>
  );
}
