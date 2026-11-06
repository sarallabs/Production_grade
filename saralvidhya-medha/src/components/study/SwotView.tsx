import React, { useState, useEffect } from "react";

export interface SwotViewProps {
  subjectId: string;
  chapterNumber: number;
}

export default function SwotView({ subjectId, chapterNumber }: SwotViewProps) {
  const [swot, setSwot] = useState({
    s: [] as string[],
    w: [] as string[],
    o: [] as string[],
    t: [] as string[],
  });

  useEffect(() => {
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const opportunities: string[] = [];
    const threats: string[] = [];

    // Assuming a max of 5 chapters for this MVP demo
    const maxChapters = 5;

    for (let i = 1; i <= maxChapters; i++) {
      const timeKey = `ekam_time_${subjectId}_${i}`;
      const timeSpent = parseInt(localStorage.getItem(timeKey) || "0", 10);
      const scoreKey = `ekam_quiz_score_${subjectId}_${i}`;
      const scoreRaw = localStorage.getItem(scoreKey);
      const score = scoreRaw ? parseInt(scoreRaw, 10) : null;

      const chapterName = `Chapter ${i}`;

      if (score !== null) {
        if (score >= 60) strengths.push(chapterName);
        else weaknesses.push(chapterName);
      } else if (timeSpent > 120) {
        // Spent over 2 minutes but took no quiz -> still a strength in reading
        strengths.push(chapterName);
      } else {
        opportunities.push(chapterName);
      }

      if (timeSpent > 0 && timeSpent < 10 && score !== null) {
        threats.push(
          `${chapterName} completed suspiciously fast (${timeSpent}s). Possible skimming evasion.`,
        );
      }
    }

    setSwot({ s: strengths, w: weaknesses, o: opportunities, t: threats });
  }, [subjectId]);

  return (
    <div className="swot-view" style={{ padding: "20px" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "20px",
          marginTop: "20px",
        }}
      >
        <div className="card swot-card">
          <h3 style={{ color: "#4caf50" }}>💪 Strengths</h3>
          {swot.s.length > 0 ? (
            <ul>
              {swot.s.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          ) : (
            <p className="opacity-70">Read more chapters and take quizzes.</p>
          )}
        </div>
        <div className="card swot-card">
          <h3 style={{ color: "#ff9800" }}>⚠️ Weaknesses</h3>
          {swot.w.length > 0 ? (
            <ul>
              {swot.w.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          ) : (
            <p className="opacity-70">No weaknesses yet! Great job.</p>
          )}
        </div>
        <div className="card swot-card">
          <h3 style={{ color: "#2196f3" }}>🚀 Opportunities</h3>
          {swot.o.length > 0 ? (
            <ul>
              {swot.o.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          ) : (
            <p className="opacity-70">You've covered all the curriculum!</p>
          )}
        </div>
        <div className="card swot-card">
          <h3 style={{ color: "#f44336" }}>🚨 Threats</h3>
          {swot.t.length > 0 ? (
            <ul>
              {swot.t.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          ) : (
            <p className="opacity-70">Your study patterns look healthy.</p>
          )}
        </div>
      </div>
    </div>
  );
}
