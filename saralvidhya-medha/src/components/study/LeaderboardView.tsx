import React, { useState, useEffect } from "react";

export interface LeaderboardViewProps {
  subjectId: string;
}

export default function LeaderboardView({ subjectId }: LeaderboardViewProps) {
  const [users, setUsers] = useState<
    { name: string; points: number; isMe: boolean }[]
  >([]);

  useEffect(() => {
    const dummyUsers = [
      { name: "Rahul Sharma", points: 850, isMe: false },
      { name: "Aisha Khan", points: 920, isMe: false },
      { name: "Tariq Ali", points: 640, isMe: false },
      { name: "Sneha Reddy", points: 710, isMe: false },
      { name: "Rohan Patel", points: 530, isMe: false },
    ];

    let myTotalPoints = 0;
    // Sum points from storage
    for (let i = 1; i <= 15; i++) {
      const scoreKey = `ekam_quiz_score_${subjectId}_${i}`;
      const scoreRaw = localStorage.getItem(scoreKey);
      if (scoreRaw) myTotalPoints += parseInt(scoreRaw, 10);
    }

    // Scale points to make it equivalent to dummy user points (e.g., 10x multiplier per percentage point)
    myTotalPoints = myTotalPoints * 5;

    // Combine and sort
    const all = [
      ...dummyUsers,
      { name: "You (Student)", points: myTotalPoints, isMe: true },
    ];
    all.sort((a, b) => b.points - a.points);
    setUsers(all);
  }, [subjectId]);

  return (
    <div className="leaderboard-view" style={{ padding: "20px" }}>
      <h3 style={{ marginBottom: "16px" }}>🏆 Leaderboard</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {users.map((u, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              background: u.isMe ? "#e8f0fe" : "var(--surface)",
              border: u.isMe
                ? "2px solid var(--primary)"
                : "1px solid var(--border)",
              borderRadius: "10px",
              padding: "10px 16px",
              fontWeight: u.isMe ? 700 : 400,
            }}
          >
            <span
              style={{
                width: "24px",
                fontWeight: 700,
                color:
                  i === 0
                    ? "#FFD700"
                    : i === 1
                      ? "#C0C0C0"
                      : i === 2
                        ? "#CD7F32"
                        : "var(--text-secondary)",
              }}
            >
              {i + 1}
            </span>
            <span style={{ flex: 1 }}>
              {u.name}
              {u.isMe ? " (You)" : ""}
            </span>
            <span style={{ color: "var(--primary)", fontWeight: 700 }}>
              {u.points} pts
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
