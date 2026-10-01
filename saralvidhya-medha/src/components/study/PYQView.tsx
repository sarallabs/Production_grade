import React, { useState, useMemo, useEffect } from "react";
import {
  QuestionCard,
  MANAGEMENT_MOCKED_QUESTIONS,
  ANU_PHYSICS_MOCKED_QUESTIONS,
  ANU_CHARACTERIZATION_MOCKED_QUESTIONS,
} from "@/pages/PreviousYearQuestions";

export interface PYQViewProps {
  subjectName: string;
  subjectId: string;
  chapterNumber: number;
  onSOS: (subjectId: string, chapterNumber: number) => void;
}

/**
 * Renders the Previous Year Questions view.
 */
export function PYQView({
  subjectName,
  subjectId,
  chapterNumber,
  onSOS,
}: PYQViewProps) {
  const [selectedYear, setSelectedYear] = useState("All Years");

  const supportedSubjects = [
    "management",
    "anu_physics",
    "anu_characterization",
  ];
  const isSupported = supportedSubjects.includes(subjectId);

  const baseQuestions =
    subjectId === "management"
      ? MANAGEMENT_MOCKED_QUESTIONS
      : subjectId === "anu_physics"
        ? ANU_PHYSICS_MOCKED_QUESTIONS
        : subjectId === "anu_characterization"
          ? ANU_CHARACTERIZATION_MOCKED_QUESTIONS
          : [];

  const availableYearsForSubject = useMemo(() => {
    const years = baseQuestions
      .map((q) => q.year)
      .filter((y): y is number => typeof y === "number");
    return Array.from(new Set(years)).sort((a, b) => b - a);
  }, [baseQuestions]);

  useEffect(() => {
    setSelectedYear("All Years");
  }, [subjectId]);

  useEffect(() => {
    if (
      selectedYear !== "All Years" &&
      !availableYearsForSubject.includes(parseInt(selectedYear))
    ) {
      setSelectedYear("All Years");
    }
  }, [subjectId, availableYearsForSubject, selectedYear]);

  const displayQuestions =
    selectedYear === "All Years"
      ? baseQuestions
      : baseQuestions.filter((q) => q.year === parseInt(selectedYear));

  if (!isSupported) {
    return (
      <div
        className="pyq-view"
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
          padding: "20px",
          color: "var(--text-secondary)",
        }}
      >
        <p>PYQs are currently unavailable for this subject.</p>
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
            className={`pyq-year-btn ${
              selectedYear === "All Years" ? "active" : ""
            }`}
          >
            All Years
          </button>
          {availableYearsForSubject.map((yearVal) => (
            <button
              key={yearVal}
              onClick={() => setSelectedYear(yearVal.toString())}
              className={`pyq-year-btn ${
                selectedYear === yearVal.toString() ? "active" : ""
              }`}
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
          maxHeight: "calc(100vh - 220px)",
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

export default PYQView;

