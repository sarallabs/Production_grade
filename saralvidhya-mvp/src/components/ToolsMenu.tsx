import { useNavigate, useSearchParams } from "react-router-dom";

export type ToolId =
  | "summary"
  | "detailed"
  | "key_takeaways"
  | "flashcards"
  | "podcasts"
  | "ask"
  | "videos"
  | "mindmap"
  | "foundation"
  | "pyq"
  | "assessment"
  | "qbank"
  | "deep_dive"
  | "swot"
  | "revision_flashcards"
  | "mocktest"
  | "prep_exam"
  | "pre_final_test"
  | "leaderboard";

export interface ToolsMenuProps {
  activeTool: ToolId;
  onSelectTool: (tool: ToolId) => void;
  /** New Option-1 props */
  drawerOpen: boolean;
  onOpenDrawer: () => void;
  onCloseDrawer: () => void;
}

// Full tools list
const ALL_TOOLS: { id: ToolId; icon: string; label: string; desc: string; disabled?: boolean }[] = [
  { id: "summary", icon: "📖", label: "Read", desc: "Read chapter notes" },
  { id: "podcasts", icon: "🎧", label: "Listen", desc: "Listen to audio" },
  { id: "videos", icon: "🎥", label: "Watch", desc: "Watch video lectures" },
  { id: "mindmap", icon: "🧠", label: "Mindmap", desc: "Visual mind map" },
  // { id: "foundation", icon: "🏛️", label: "Foundation", desc: "Mind Maps" },
  { id: "revision_flashcards", icon: "🗂️", label: "Revise", desc: "Quick revision" },
  { id: "assessment", icon: "🎯", label: "Assessments", desc: "Test knowledge" },
  { id: "qbank", icon: "🏦", label: "Question Bank", desc: "Practice more" },
  { id: "key_takeaways", icon: "🔑", label: "Key Takeaways", desc: "Key Takeaways" },
  { id: "pyq", icon: "📄", label: "PYQ", desc: "Previous Year Questions" },
  { id: "prep_exam", icon: "📝", label: "Preparation Exam", desc: "Test your preparation" },
  { id: "swot", icon: "💡", label: "SWOT", desc: "SWOT Analysis", disabled: true },
  { id: "deep_dive", icon: "🔍", label: "Deep Dive", desc: "Detailed explanations" },
  { id: "pre_final_test", icon: "🎓", label: "Certification Exam", desc: "Certification Exam" },
  { id: "ask", icon: "❓", label: "Ask Me", desc: "Ask me anything" },
];

export default function ToolsMenu({
  activeTool,
  onSelectTool,
  drawerOpen,
  onOpenDrawer,
  onCloseDrawer,
}: ToolsMenuProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const handleChaptersClick = () => {
    navigate('/my-learning');
  };

  return (
    <aside className={`st-sidebar ${drawerOpen ? "open" : "closed"}`}>
      {/* Header */}
      <div className="st-sidebar-header">
        <div className="st-sidebar-header-title">
          <span className="st-header-icon">🧭</span>
          <span>Study Tools</span>
        </div>
        <button
          className="st-sidebar-toggle-btn"
          onClick={drawerOpen ? onCloseDrawer : onOpenDrawer}
          title={drawerOpen ? "Collapse sidebar" : "Expand sidebar"}
          aria-label={drawerOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          <div className={`st-hamburger ${drawerOpen ? "active" : ""}`}>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </button>
      </div>

      {/* Tools List */}
      <div className="st-sidebar-scroll">
        <div className="st-sidebar-tools">
          {ALL_TOOLS.map((t, idx) => (
            <button
              key={t.id}
              className={`st-sidebar-btn ${activeTool === t.id ? "active" : ""} ${t.disabled ? "disabled" : ""}`}
              onClick={() => {
                if (t.disabled) return;
                onSelectTool(t.id);
                if (window.innerWidth < 768) onCloseDrawer();
              }}
              disabled={t.disabled}
              title={t.disabled ? "Coming Soon (Mocked Data)" : ""}
              style={{
                animationDelay: `${idx * 0.03}s`,
                ...(t.disabled ? { opacity: 0.5, cursor: "not-allowed" } : {})
              } as React.CSSProperties}
            >
              <div className="st-btn-icon">{t.icon}</div>
              <div className="st-btn-text">
                <span className="st-btn-label">{t.label}</span>
                <span className="st-btn-desc">{t.desc}</span>
              </div>
              {activeTool === t.id && <div className="st-btn-glow" />}
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="st-sidebar-footer">
        <button className="st-footer-btn" onClick={handleChaptersClick}>
          <span className="st-btn-icon">⬅️</span>
          <span className="st-btn-label">Back to Courses</span>
        </button>
      </div>
    </aside>
  );
}
