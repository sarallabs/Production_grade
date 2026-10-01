import React, { useState, useEffect, useMemo } from "react";
import {
  QuestionCard,
  MANAGEMENT_MOCKED_QUESTIONS,
  ANU_PHYSICS_MOCKED_QUESTIONS,
  ANU_CHARACTERIZATION_MOCKED_QUESTIONS,
} from "@/pages/PreviousYearQuestions";

/**
 * Displays Previous Year Questions for the selected subject and chapter.
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

  const supportedSubjects = [
    "management",
    "anu_physics",
    "anu_characterization",
    "neb_xii_biology"
  ];
  const isSupported = supportedSubjects.includes(subjectId);

  useEffect(() => {
    async function loadPYQs() {
      setIsLoading(true);
      if (subjectId === "neb_xii_biology") {
        try {
          const res = await fetch(`/generated_resources/neb_nepal/class_12/biology/chapter_06/Prepare/PYQs/Chapter_Level/pyq_chapter_6.json`);
          const ct = res.headers.get('content-type') || '';
          if (res.ok && !ct.includes('text/html')) {
            const data = await res.json();
            const items = Array.isArray(data) ? data : data.pyqs || data.items || [];
            // map them to the expected QuestionData format
            const mapped = items.map((q: any, i: number) => ({
              id: (q.id && parseInt(q.id.replace(/[^0-9]/g, ''))) || (i + 1),
              text: (q.stem || q.question || '') + (q.options ? '\n\n' + q.options.join('\n') : ''),
              shortAnswer: q.answer || '',
              longAnswer: q.explanation || '',
              chapter: `Chp: ${chapterNumber}`,
              section: q.exam || 'General',
              marks: 1,
              subjectId,
              chapterNumber,
              year: q.exam ? parseInt(q.exam.replace(/[^0-9]/g, '')) || 2024 : 2024,
            }));
            setBaseQuestions(mapped);
          } else {
            setBaseQuestions([]);
          }
        } catch (e) {
          setBaseQuestions([]);
        }
      } else {
        const questions =
          subjectId === "management"
            ? MANAGEMENT_MOCKED_QUESTIONS
            : subjectId === "anu_physics"
              ? ANU_PHYSICS_MOCKED_QUESTIONS
              : subjectId === "anu_characterization"
                ? ANU_CHARACTERIZATION_MOCKED_QUESTIONS
                : [];
        setBaseQuestions(questions);
      }
      setIsLoading(false);
    }
    if (isSupported) {
      loadPYQs();
    } else {
      setIsLoading(false);
      setBaseQuestions([]);
    }
  }, [subjectId, chapterNumber, isSupported]);

  const availableYearsForSubject = useMemo(() => {
    const years = baseQuestions
      .map(q => q.year)
      .filter((y): y is number => typeof y === 'number' && !isNaN(y));
    return Array.from(new Set(years)).sort((a, b) => b - a);
  }, [baseQuestions]);

  useEffect(() => {
    setSelectedYear("All Years");
  }, [subjectId]);

  useEffect(() => {
    if (selectedYear !== "All Years" && !availableYearsForSubject.includes(parseInt(selectedYear))) {
      setSelectedYear("All Years");
    }
  }, [subjectId, availableYearsForSubject, selectedYear]);

  const displayQuestions = selectedYear === "All Years"
    ? baseQuestions
    : baseQuestions.filter(q => q.year === parseInt(selectedYear));

  if (isLoading) {
    return (
      <div className="pyq-view" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '360px', padding: '20px', color: 'var(--text-secondary)' }}>
        <p>Loading PYQs...</p>
      </div>
    );
  }

  if (!isSupported || baseQuestions.length === 0) {
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
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        </div>
        <h3 style={{ fontSize: "1.15rem", fontWeight: "700", color: "var(--text-primary)", marginBottom: "6px" }}>
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
          style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "-8px", justifyContent: "center" }}
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

