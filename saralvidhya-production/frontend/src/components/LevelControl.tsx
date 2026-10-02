import React from 'react';

export type DifficultyLevel = "beginner" | "intermediate" | "advanced";

interface LevelControlProps {
  currentLevel: DifficultyLevel;
  onLevelChange: (level: DifficultyLevel) => void;
}

export const LevelControl: React.FC<LevelControlProps> = ({ currentLevel, onLevelChange }) => {
  const handleUp = () => {
    if (currentLevel === "beginner") onLevelChange("intermediate");
    else if (currentLevel === "intermediate") onLevelChange("advanced");
  };

  const handleDown = () => {
    if (currentLevel === "advanced") onLevelChange("intermediate");
    else if (currentLevel === "intermediate") onLevelChange("beginner");
  };

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "12px",
      margin: "16px auto",
      padding: "8px 16px",
      background: "#ffffff",
      borderRadius: "24px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      width: "fit-content",
      border: "1px solid #e2e8f0"
    }}>
      <button 
        onClick={handleDown}
        disabled={currentLevel === "beginner"}
        style={{
          background: "transparent",
          border: "none",
          cursor: currentLevel === "beginner" ? "not-allowed" : "pointer",
          color: currentLevel === "beginner" ? "#cbd5e1" : "#7c3aed",
          display: "flex",
          alignItems: "center",
          padding: "4px"
        }}
        title="Level Down"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>
      
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        minWidth: "100px"
      }}>
        <span style={{ fontSize: "0.7rem", textTransform: "uppercase", fontWeight: 700, color: "#64748b", letterSpacing: "1px" }}>Current Level</span>
        <span style={{ fontSize: "1rem", fontWeight: 700, color: "#1e293b", textTransform: "capitalize" }}>{currentLevel}</span>
      </div>

      <button 
        onClick={handleUp}
        disabled={currentLevel === "advanced"}
        style={{
          background: "transparent",
          border: "none",
          cursor: currentLevel === "advanced" ? "not-allowed" : "pointer",
          color: currentLevel === "advanced" ? "#cbd5e1" : "#7c3aed",
          display: "flex",
          alignItems: "center",
          padding: "4px"
        }}
        title="Level Up"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="18 15 12 9 6 15"></polyline>
        </svg>
      </button>
    </div>
  );
};
