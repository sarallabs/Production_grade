import { useNavigate, useSearchParams } from "react-router-dom";

export type ToolId =
  | "summary"
  | "detailed"
  | "flashcards"
  | "podcasts"
  | "ask"
  | "videos"
  | "mindmap"
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
const ALL_TOOLS: { id: ToolId; icon: string; label: string; desc: string }[] = [
  { id: "videos", icon: "🎥", label: "Videos", desc: "Watch and learn" },
  { id: "summary", icon: "📖", label: "Quick Study", desc: "Quick notes" },
  { id: "detailed", icon: "📝", label: "Detailed Study", desc: "In-depth notes" },
  { id: "flashcards", icon: "🗂️", label: "Flashcards", desc: "Quick revision" },
  { id: "assessment", icon: "🎯", label: "Assessments", desc: "Test knowledge" },
  { id: "qbank", icon: "🏦", label: "Question Bank", desc: "Practice more" },
  { id: "pyq", icon: "📄", label: "PYQ", desc: "Past year questions" },
  { id: "mindmap", icon: "🧠", label: "Mindmap", desc: "Visualise concepts" },
  { id: "mocktest", icon: "📋", label: "Mock Test", desc: "Mock Test" },
  { id: "pre_final_test", icon: "🎓", label: "Certification Exam", desc: "Certification Exam" },
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
          {(sessionStorage.getItem('sv_moocs_mode') === 'true'
            ? [
                { id: "videos" as ToolId, icon: "🎥", label: "Videos", desc: "Watch and learn" },
                { id: "summary" as ToolId, icon: "📖", label: "Quick Study", desc: "Quick notes" },
                { id: "detailed" as ToolId, icon: "📝", label: "Detailed Study", desc: "In-depth notes" },
                { id: "flashcards" as ToolId, icon: "🗂️", label: "Flashcards", desc: "Quick revision" },
                { id: "assessment" as ToolId, icon: "🎯", label: "Assessments", desc: "Test knowledge" },
                { id: "mindmap" as ToolId, icon: "🧠", label: "Mindmap", desc: "Visualise concepts" },
                { id: "mocktest" as ToolId, icon: "📋", label: "Mock Test", desc: "Mock Test" },
                { id: "pre_final_test" as ToolId, icon: "🎓", label: "Certification Exam", desc: "Certification Exam" },
              ]
            : ALL_TOOLS
          ).map((t, idx) => (
            <button
              key={t.id}
              className={`st-sidebar-btn ${activeTool === t.id ? "active" : ""}`}
              onClick={() => {
                onSelectTool(t.id);
                if (window.innerWidth < 768) onCloseDrawer();
              }}
              style={
                { animationDelay: `${idx * 0.03}s` } as React.CSSProperties
              }
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
