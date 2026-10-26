import React, { useEffect, useRef, useState, useMemo, useCallback, Suspense } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import MarkdownView from "@/components/MarkdownView";
import { buildTree } from "@/components/MermaidView";
import SectionizedReadView from "@/components/study/SectionizedReadView";
import QuickCheckModal from "@/components/study/QuickCheckModal";
import type { ToolId } from "@/components/ToolsMenu";
import {
  getResourceContent,
  getFlashcards,
  getSubjectBaseUrl,
  DifficultyLevel,
  getManifest,
  getChapters,
  MASTERMINDS_MINDMAP_MAP,
  getSubjectResourcePath,
  getMastermindsConceptUrl,
  getMastermindsDeepDiveUrl,
  getDeepDiveToolUrl,
  getAssessments,
  getMockTest,
  getChapterVideos,
  getChapterExamQuestions,
  GCS_BACKEND_SUBJECTS,
  resolveSubjectId,
  type Chapter,
  type ChapterVideo,
} from "@/data/contentRepository";
import {
  getSectionizedReadData,
  estimateReadingTime,
  generateQuickCheckQuestionsFromMarkdown,
  type QuickCheckQuestion,
} from "@/data/sectionizedReadService";
import { truncateMindmapToLevels, mindmapJsonToMermaid } from '@/data/markdownService';
import { toTitleCase } from "@/pages/ChapterList";
import { askGemini } from "@/services/askService";
import {
  googleTtsSpeak,
  googleTtsStop,
  googleTtsPause,
  googleTtsResume,
} from "@/services/googleTtsService";
import {
  startSpeechSession,
  hasWebSpeechSupport,
  type SpeechSession,
} from "@/services/speechService";

import { parseQuestionBank, type QuizQuestion } from "@/utils/quizParser";
import { type AssessmentQuestion } from "@/utils/assessmentTypes";
import { MOCK_ASSESSMENT_QUESTIONS } from "@/utils/assessmentMock";
import { parseQuestionBankMarkdown, type QuestionBankEntry } from "@/utils/questionBankParser";
import {
  trackChapterVisit,
  trackToolUsage,
  trackPersonaChange,
} from "@/utils/analytics";
import {
  GUIDED_FLOW,
  GUIDED_LABELS,
  GUIDED_ICONS,
  SUPPLEMENTARY_TOOLS,
  getCompletedTools,
  markToolCompleted,
  isToolUnlocked,
  getResumeTool,
  getProgressIndex,
  getUnlockedFrontierIndex,
  isChapterComplete,
  VIDEO_FLOW,
  CHAPTER_EXAM_TOOLS,
  isToolUnlockedForVideo,
  isVideoWatched,
  isVideoPlayable,
  markVideoWatched,
  getChapterVideoCount,
  setChapterVideoCount,
} from "@/utils/guidedFlow";
import {
  useAudioProgress,
  saveProgress,
  type AudioProgress,
  GlobalAudioProgress,
} from "@/hooks/useAudioProgress";
import { useFocusMode } from "@/context/FocusModeContext";
import ReadAloudBar, { preprocessSummaryText } from "@/components/study/ReadAloudBar";
import ReadingHighlightView from "@/components/study/ReadingHighlightView";
import { getRegistryTenantId } from "@/data/manifestService";
import { useTenant } from "@/tenant/TenantProvider";
import { resolveAssetUrl, getRegistryChapterData } from "@/data/registryClient";
import { cloudStorage } from "@/context/CloudStateContext";
const MindMapView = React.lazy(() => import("@/components/MindMapView"));
const FlashcardsView = React.lazy(() => import("@/components/FlashcardsView"));
const QuestionBankView = React.lazy(() => import("@/components/QuestionBankView"));
const KeyTakeawaysView = React.lazy(() => import("@/components/study/KeyTakeawaysView"));
const StudyPlanView = React.lazy(() => import("@/components/study/StudyPlanView"));
const AskBotView = React.lazy(() => import("@/components/study/AskBotView"));
const PodcastsView = React.lazy(() => import("@/components/study/PodcastsView"));
const PYQView = React.lazy(() => import("@/components/study/PYQView"));
const MockTestView = React.lazy(() => import("@/components/study/MockTestView"));
const VideosView = React.lazy(() => import("@/components/study/VideosView"));
const AssessmentView = React.lazy(() =>
  import("@/components/study/AssessmentView").then((m) => ({ default: m.AssessmentView }))
);
const SwotView = React.lazy(() => import("@/components/study/SwotView"));
const LeaderboardView = React.lazy(() => import("@/components/study/LeaderboardView"));


export function StudyToolLoadingWaitScreen() {
  const treeLogoSrc = `${import.meta.env.BASE_URL}brand-logo.png`;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        minHeight: "380px",
        gap: "20px",
      }}
    >
      <style>{`
        @keyframes logoPulseGlow {
          0%, 100% { transform: scale(1); filter: drop-shadow(0 4px 16px rgba(59, 130, 246, 0.25)); }
          50% { transform: scale(1.06); filter: drop-shadow(0 8px 24px rgba(59, 130, 246, 0.45)); }
        }
        @keyframes spinnerRing {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      {/* Outer Ring & Prominent Logo */}
      <div style={{ position: "relative", width: "270px", height: "270px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {/* Animated Gradient Spinner Ring */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            border: "6px solid #eff6ff",
            borderTopColor: "#2563eb",
            borderRightColor: "#60a5fa",
            animation: "spinnerRing 0.9s linear infinite",
          }}
        />
        {/* Large Prominent Saral Vidhya Logo */}
        <img
          src={treeLogoSrc}
          alt="Saral Vidhya"
          style={{
            width: "180px",
            height: "180px",
            objectFit: "contain",
            animation: "logoPulseGlow 2s ease-in-out infinite",
          }}
        />
      </div>
    </div>
  );
}
import {
  QuestionCard,
  MANAGEMENT_MOCKED_QUESTIONS,
  ANU_PHYSICS_MOCKED_QUESTIONS,
  ANU_CHARACTERIZATION_MOCKED_QUESTIONS,
} from "@/pages/PreviousYearQuestions";

/** Maps persona IDs to resource folder difficulty levels */
const PERSONA_TO_LEVEL: Record<string, DifficultyLevel> = {
  // Legacy keys
  naive: "beginner",
  average: "intermediate",
  above_average: "advanced",
  // Direct keys (used by PersonaSelection)
  beginner: "beginner",
  intermediate: "intermediate",
  advanced: "advanced",
};

function getChapterPrefix(subjectId: string): string {
  // MOOCs courses are organised into units, and the sidebar labels them that
  // way — keep the breadcrumb consistent with it.
  if (cloudStorage.getItem("sv_moocs_mode") === "true") return "Unit";
  const id = (subjectId || "").toLowerCase();
  if (
    id.includes("management") ||
    id.includes("financial") ||
    id.includes("pubadm") ||
    id === "social"
  ) {
    return "Unit";
  }
  return "Chapter";
}

/** Icon shown inside a guided-flow stepper node (module-level so it isn't re-created per node per render). */
function renderFlowGlyph(toolId: ToolId, color: string, locked: boolean) {
  switch (toolId) {
    case "videos":
      return <svg width="16" height="16" viewBox="0 0 24 24" fill={color}><path d="M8 5v14l11-7z" /></svg>;
    case "flashcards":
      return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="7" y="7" width="13" height="13" rx="2" ry="2" /><path d="M4 16V5a2 2 0 0 1 2-2h11" /></svg>;
    case "assessment":
      return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></svg>;
    case "summary":
    case "revision_flashcards":
      return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>;
    case "detailed":
    case "mocktest":
      return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>;
    case "prep_exam":
    case "pre_final_test":
      return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg>;
    default:
      return <span>{GUIDED_ICONS[toolId]}</span>;
  }
}

const TOOL_TRANSITION_INFO: Record<string, { title: string; icon: React.ReactNode }> = {
  videos: {
    title: "Videos",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M8 5v14l11-7z" />
      </svg>
    ),
  },
  flashcards: {
    title: "Flashcards",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="7" y="7" width="14" height="14" rx="2.5" ry="2.5" />
        <path d="M3 13V5a2 2 0 0 1 2-2h8" />
      </svg>
    ),
  },
  assessment: {
    title: "Assessment",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="3.5" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
  },
  summary: {
    title: "Quick Study",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  detailed: {
    title: "Detailed Study",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
        <path d="M14 2v4a2 2 0 0 0 2 2h4" />
        <line x1="10" y1="9" x2="8" y2="9" />
        <line x1="16" y1="13" x2="8" y2="13" />
      </svg>
    ),
  },
  revision_flashcards: {
    title: "Revise",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
  },
  prep_exam: {
    title: "Preparation Exam",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <path d="m9 15 2 2 4-4" />
      </svg>
    ),
  },
  mocktest: {
    title: "Mock Test",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  pre_final_test: {
    title: "Certification Exam",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
  },
  qbank: {
    title: "Certification Exam",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
  },
};

// ── In-memory cache for Mindmap Topic Markdown content & Quick Checks ────────
const topicNotesCache = new Map<
  string,
  {
    quick: string;
    detailed?: string;
    quickQc?: QuickCheckQuestion[];
    detailedQc?: QuickCheckQuestion[];
    QuickQcLoaded?: boolean;
  }
>();

export function buildMindmapMermaid(chapterTitle: string, topics: Array<{ label: string }>): string {
  if (!chapterTitle && (!topics || topics.length === 0)) return '';
  const lines = ['mindmap', `  root(("${chapterTitle || 'Chapter Overview'}"))`];
  for (const t of topics || []) {
    lines.push(`    "${t.label}"`);
  }
  return lines.join('\n');
}

type MindmapTopic = { label: string; topicNum?: number; folder?: string; podcastFile?: string; podcastTitle?: string };

function getChapterTopicConfig(subjectId: string, chapterNumber: number, curCh?: Chapter): { chapterTitle: string; topics: MindmapTopic[] } | null {
  if (curCh?.topics && curCh.topics.length > 0) {
    return {
      chapterTitle: curCh.title || curCh.name || `Chapter ${chapterNumber}`,
      topics: curCh.topics,
    };
  }
  return null;
}

export default function StudyTable() {
  // Mindmap inline topic view (no popup — content shown in-place below the map)
  const [mindmapTopicTitle, setMindmapTopicTitle] = useState<string | null>(null);
  const [mindmapTopicContent, setMindmapTopicContent] = useState<string | null>(null);
  const [mindmapDetailedContent, setMindmapDetailedContent] = useState<string | null>(null);
  const [mindmapQuickChecks, setMindmapQuickChecks] = useState<{
    quick: QuickCheckQuestion[];
    detailed: QuickCheckQuestion[];
  }>({ quick: [], detailed: [] });
  const [mindmapInlineTab, setMindmapInlineTab] = useState<'quick' | 'detailed'>('quick');
  const [mindmapTopicOpen, setMindmapTopicOpen] = useState(false);
  const [mindmapTopicLoading, setMindmapTopicLoading] = useState(false);
  const [mindmapInlineType, setMindmapInlineType] = useState<'text' | 'video' | 'audio'>('text');
  const [mindmapMediaUrl, setMindmapMediaUrl] = useState<string>('');
  // For microcast inline: which microcast index maps to this topic
  const [mindmapMicrocastIdx, setMindmapMicrocastIdx] = useState<number>(0);
  const [foundationMindmapContent, setFoundationMindmapContent] = useState<string>('');
  const [foundationLoading, setFoundationLoading] = useState(false);
  const mindmapQcRef = useRef<HTMLDivElement | null>(null);
  const mmConceptQcRef = useRef<HTMLDivElement | null>(null);
  const [mmCompletedQuickChecks, setMmCompletedQuickChecks] = useState<Set<string>>(() => {
    try {
      const saved = cloudStorage.getItem('sv_mm_qc_done');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });
  const [mmQcAnswers, setMmQcAnswers] = useState<Record<string, string>>(() => {
    try {
      const saved = cloudStorage.getItem('sv_mm_qc_answers');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [mmSelectedBranch, setMmSelectedBranch] = useState<string | null>(null);
  const [mmStudiedBranches, setMmStudiedBranches] = useState<Record<string, string[]>>(() => {
    try {
      const saved = cloudStorage.getItem('sv_mm_studied_v2');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore storage errors
    }
    return {};
  });
  const markMmQuickCheckCompleted = useCallback(
    (
      artifactKey: string,
      selectedKey?: string,
      questionIndex: number = 0,
      markComplete: boolean = true
    ) => {
      if (markComplete) {
        setMmCompletedQuickChecks((prev) => {
          const updated = new Set(prev);
          updated.add(artifactKey);
          try {
            cloudStorage.setItem('sv_mm_qc_done', JSON.stringify(Array.from(updated)));
          } catch {}
          return updated;
        });
      }
      if (selectedKey) {
        setMmQcAnswers((prev) => {
          const updated = {
            ...prev,
            [`${artifactKey}_${questionIndex}`]: selectedKey,
            ...(questionIndex === 0 ? { [artifactKey]: selectedKey } : {}),
          };
          try {
            cloudStorage.setItem('sv_mm_qc_answers', JSON.stringify(updated));
          } catch {}
          return updated;
        });
      }
    },
    []
  );
  const navigate = useNavigate();
  const { tenantId: contextTenantId, logout: tenantLogout } = useTenant();
  const [searchParams, setSearchParams] = useSearchParams();
  // Remember the course params of the last valid URL so a link that lost its
  // subject (back/forward, bookmark, stripped query) doesn't fall back to "english".
  const COURSE_PARAM_KEYS = ["boardId", "boardName", "cId", "className", "sId", "subjectName", "semesterName"];
  const savedCourseParams: Record<string, string> = (() => {
    try { return JSON.parse(cloudStorage.getItem("sv_last_course_params") || "{}"); } catch { return {}; }
  })();
  const subjectId =
    searchParams.get("sId") || searchParams.get("subjectId") || savedCourseParams.sId || "english";
  useEffect(() => {
    if (searchParams.get("sId")) {
      const toSave: Record<string, string> = {};
      COURSE_PARAM_KEYS.forEach((k) => { const v = searchParams.get(k); if (v) toSave[k] = v; });
      cloudStorage.setItem("sv_last_course_params", JSON.stringify(toSave));
    } else if (!searchParams.get("subjectId") && savedCourseParams.sId) {
      setSearchParams((prev) => {
        COURSE_PARAM_KEYS.forEach((k) => { if (!prev.get(k) && savedCourseParams[k]) prev.set(k, savedCourseParams[k]); });
        return prev;
      }, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);
  const treeLogoSrc = subjectId?.startsWith('neb_')
    ? `${import.meta.env.BASE_URL}neb-logo.png`
    : `${import.meta.env.BASE_URL}brand-tree-cropped.png`;
  const isMoocMode = cloudStorage.getItem('sv_moocs_mode') === 'true';

  const className = searchParams.get("className") || "Class";
  const subjectName = searchParams.get("subjectName") || "Subject";
  const semesterName = searchParams.get("semesterName") || "";
  const personaRaw = searchParams.get("persona") || "intermediate";
  const [persona, setPersonaState] = useState<DifficultyLevel>(
    PERSONA_TO_LEVEL[personaRaw] || "intermediate",
  );
  const [uiPersona, setUiPersona] = useState<DifficultyLevel>(
    PERSONA_TO_LEVEL[personaRaw] || "intermediate",
  );

  // Clean query strings logic removed to fix refresh state persistence

  const setPersona = useCallback((level: DifficultyLevel) => {
    // Stop any active TTS/audio before switching persona
    googleTtsStop();
    setUiPersona(level);
    trackPersonaChange(persona, level);
    React.startTransition(() => {
      setPersonaState(level);
      setSearchParams(prev => { prev.set("persona", level); return prev; }, { replace: true });
    });
  }, [persona, setSearchParams]);

  const PERSONAS: { key: DifficultyLevel; label: string; imgSrc: string }[] = [
    { key: "beginner", label: "Beginner", imgSrc: `${import.meta.env.BASE_URL}personas/beginner.png` },
    {
      key: "intermediate",
      label: "Intermediate",
      imgSrc: `${import.meta.env.BASE_URL}personas/intermediate.png`,
    },
    { key: "advanced", label: "Advanced", imgSrc: `${import.meta.env.BASE_URL}personas/advanced.png` },
  ];

  // Toolbar Theme: Dark mode toolbar only (#2D3E36)
  const isDarkToolbar = true;

  const [chapterNumberState, setChapterNumberState] = useState<number>(() => {
    return parseInt(searchParams.get("chapter") || "1", 10) || 1;
  });
  const chapterNumber = chapterNumberState;
  const setChapterNumber = (num: number) => setChapterNumberState(num);
  const [subjectChapters, setSubjectChapters] = useState<Chapter[]>([]);
  const dbChapterObj = subjectChapters.find((c) => c.number === chapterNumber);
  const chapterName =
    dbChapterObj?.title ||
    dbChapterObj?.name ||
    searchParams.get("chapterName") ||
    `Chapter ${chapterNumber}`;

  const location = useLocation();
  const navState = location.state as any;

  // Videos this chapter is split into. Empty for every chapter without a
  // videos.json, which is the signal to keep the original chapter-scoped
  // behaviour throughout this component.
  const [chapterVideos, setChapterVideos] = useState<ChapterVideo[]>([]);
  const isSegmented = chapterVideos.length > 0;
  /**
   * Whether the registry lookup has settled. Gating must wait for it: until the
   * chapter is known to be segmented, a video-scoped tool looks locked under the
   * chapter rule, and a learner deep-linking or refreshing on one would be
   * bounced away from a tool they had already earned.
   */
  const [videosLoaded, setVideosLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setVideosLoaded(false);
    getChapterVideos(subjectId, chapterNumber).then((videos) => {
      if (cancelled) return;
      setChapterVideos(videos);
      // Cache the count so the synchronous chapter-level gating (which runs in
      // ChapterList, where the registry is never fetched) can see it.
      setChapterVideoCount(subjectId, chapterNumber, videos.length);
      setVideosLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [subjectId, chapterNumber]);

  useEffect(() => {
    if (!subjectId) return;
    getManifest().then((m) => {
      const list = getChapters(m, subjectId);
      setSubjectChapters(list);
    });
  }, [subjectId]);

  // 1-based index of the video being studied. Drives both which assets load and
  // which progress bucket the guided flow reads.
  const [videoIndexState, setVideoIndexState] = useState<number>(() => {
    return Math.max(1, parseInt(searchParams.get("video") || "1", 10) || 1);
  });
  const videoIndex = videoIndexState;
  const activeVideo = chapterVideos.find((v) => v.index === videoIndex) ?? chapterVideos[0];
  const activeVideoDir = isSegmented ? activeVideo?.dir : undefined;

  const setVideoIndex = (index: number) => {
    setVideoIndexState(index);
    setSearchParams(prev => { prev.set("video", index.toString()); return prev; }, { replace: true });
  };

  /**
   * Completions visible while studying a given video: that video's own learn
   * tools plus the chapter-wide exams. Unsegmented chapters just read the one
   * chapter bucket, exactly as before.
   */
  const completedToolsFor = useCallback(
    (index: number): ToolId[] => {
      if (!isSegmented) return getCompletedTools(subjectId, chapterNumber);
      return Array.from(
        new Set([
          ...getCompletedTools(subjectId, chapterNumber, index),
          ...getCompletedTools(subjectId, chapterNumber),
        ]),
      );
    },
    [isSegmented, subjectId, chapterNumber],
  );

  // Guided-flow progress for this chapter. Kept per (subject, chapter) — this
  // component stays mounted while ?chapter= changes, so it must be reloaded.
  // Segmented chapters track each video separately.
  const [completedTools, setCompletedTools] = useState<ToolId[]>(() =>
    getCompletedTools(subjectId, chapterNumber),
  );

  /**
   * Gate for the chapter currently on screen. Segmented chapters unlock per
   * video; everything else keeps the original linear rule.
   */
  const isToolUnlockedHere = useCallback(
    (tool: ToolId, completedOverride?: ToolId[]) => {
      return true;
    },
    [],
  );

  /**
   * Where to send a learner whose requested tool is locked. In a segmented
   * chapter that is always the video itself — watching it is the only thing
   * that opens anything else.
   */
  const resumeToolHere = useCallback(
    (completed: ToolId[]) => (isSegmented ? ("videos" as ToolId) : getResumeTool(completed)),
    [isSegmented],
  );

  useEffect(() => {
    const completed = completedToolsFor(videoIndex);
    setCompletedTools((prev) => {
      if (prev.length === completed.length && prev.every((t, i) => t === completed[i])) {
        return prev;
      }
      return completed;
    });

    // Sync active tool state for the new chapter/unit
    const fromUrl = searchParams.get("tool") as ToolId | null;
    if (!videosLoaded) return;
    setActiveToolState(fromUrl || "summary");
  }, [
    subjectId,
    chapterNumber,
    searchParams,
    isMoocMode,
    isSegmented,
    videoIndex,
    isToolUnlockedHere,
    resumeToolHere,
    completedToolsFor,
    videosLoaded,
  ]);

  // The tool the URL is asking for (may be locked — see the gate below).
  const toolFromUrl =
    (searchParams.get("tool") as ToolId) || "summary";

  // Persist activeTool in URL so refresh restores the same tool.
  // The registry is still loading on first render, so this consults the cached
  // video count instead — without it a locked tool would render for one frame
  // before the sync effect corrects it.
  const [activeTool, setActiveToolState] = useState<ToolId>(() => {
    const fromUrl = searchParams.get("tool") as ToolId | null;
    if (fromUrl === "foundation") return "mindmap";
    return fromUrl || "summary";
  });

  // Prefetch mindmap topic notes in background only when mindmap or foundation tool is active
  useEffect(() => {
    if (activeTool !== "mindmap" && activeTool !== "foundation") return;
    const curCh = subjectChapters.find((c) => c.number === chapterNumber);
    const cfg = getChapterTopicConfig(subjectId, chapterNumber, curCh);
    if (!cfg || !cfg.topics) return;

    const normLevel = ['beginner', 'intermediate', 'advanced'].includes(persona) ? persona : 'intermediate';
    const chDir = `chapter_${String(chapterNumber).padStart(2, '0')}`;
    const subBase = getSubjectBaseUrl(subjectId);

    const fetchSafeMd = async (url: string) => {
      try {
        const res = await fetch(url);
        const ct = res.headers.get('content-type') || '';
        if (!res.ok || ct.includes('text/html')) return '';
        const txt = await res.text();
        if (txt.trim().startsWith('<!DOCTYPE') || txt.trim().startsWith('<html') || txt.includes('<script type="module"') || txt.startsWith('<script')) return '';
        return txt;
      } catch { return ''; }
    };

    cfg.topics.forEach(async (t: any, idx: number) => {
      const topicNum = t.topicNum ?? (idx + 1);
      const cacheKey = `${subjectId}_${chapterNumber}_${topicNum}_${normLevel}`;
      if (topicNotesCache.has(cacheKey)) return;

      const quickSigned = resolveAssetUrl(subjectId, chapterNumber, `learn/topics/quick/topic_${topicNum}.md`)
        || resolveAssetUrl(subjectId, chapterNumber, `learn/topics/topic_${topicNum}/${normLevel}.md`);
      const detailedSigned = resolveAssetUrl(subjectId, chapterNumber, `learn/topics/detailed/topic_${topicNum}.md`)
        || resolveAssetUrl(subjectId, chapterNumber, `learn/topics/topic_${topicNum}/advanced.md`);

      let quick = await fetchSafeMd(quickSigned || `${subBase}/${chDir}/learn/topics/quick/topic_${topicNum}.md`);
      if (!quick) {
        quick = await fetchSafeMd(`${subBase}/${chDir}/learn/topics/topic_${topicNum}/${normLevel}.md`);
      }
      let detailed = await fetchSafeMd(detailedSigned || `${subBase}/${chDir}/learn/topics/detailed/topic_${topicNum}.md`);
      if (!detailed) {
        detailed = await fetchSafeMd(`${subBase}/${chDir}/learn/topics/topic_${topicNum}/advanced.md`);
      }

      if (quick || detailed) {
        topicNotesCache.set(cacheKey, { quick, detailed });
      }
    });
  }, [activeTool, subjectId, chapterNumber, persona, subjectChapters]);
  const [isAskOpen, setIsAskOpen] = useState(false);
  const [autoResumeTrack, setAutoResumeTrack] = useState<
    "long" | "short" | null
  >(null);
  const [podcastTargetTrack, setPodcastTargetTrack] = useState<string | null>(null);
  const [podcastTargetMcIndex, setPodcastTargetMcIndex] = useState<number | null>(null);
  const [podcastAutoPlay, setPodcastAutoPlay] = useState<boolean>(false);
  const [readTargetSection, setReadTargetSection] = useState<number | null>(() => {
    const fromUrl = searchParams.get("section");
    return fromUrl ? parseInt(fromUrl, 10) : null;
  });

  const handlePodcastNavigateToRead = (secIdx?: number) => {
    if (secIdx !== undefined && secIdx !== null) {
      setReadTargetSection(secIdx);
    }
    const targetTool = activeTool === "detailed" ? "detailed" : "summary";
    // Direct state switch to avoid 1100ms artificial transition wait screen
    setActiveToolState(targetTool);
    setSearchParams((prev) => {
      prev.set("tool", targetTool);
      if (secIdx !== undefined && secIdx !== null) {
        prev.set("section", String(secIdx));
      }
      return prev;
    }, { replace: true });
    trackToolUsage({
      tool: targetTool,
      subjectId,
      chapterNumber,
      chapterName: `Chapter ${chapterNumber}`,
    });
  };

  // Segmented chapters walk the per-video loop; everything else the chapter flow.
  const activeFlow = isSegmented ? VIDEO_FLOW : GUIDED_FLOW;
  const guidedFlowIdx = activeFlow.indexOf(activeTool);
  const prevTool = guidedFlowIdx > 0 ? activeFlow[guidedFlowIdx - 1] : null;
  const nextTool =
    guidedFlowIdx !== -1 && guidedFlowIdx < activeFlow.length - 1
      ? activeFlow[guidedFlowIdx + 1]
      : null;

  /** True when the learner is on the last tool of the current video's loop. */
  const isEndOfVideoLoop = isSegmented && guidedFlowIdx === activeFlow.length - 1;
  const hasNextVideo = isSegmented && videoIndex < chapterVideos.length;

  const currentVideoWatched = isSegmented
    ? isVideoWatched(subjectId, chapterNumber, videoIndex)
    : true;

  /**
   * The next-arrow doubles as "skip this tool", which is intended for the learn
   * tools but must not apply to the video itself — marking it done from here
   * would hand out its assets without watching anything.
   */
  const canSkipForward = !(isSegmented && activeTool === "videos" && !currentVideoWatched);

  /**
   * Marks a video watched and drops the learner into that video's own learn
   * tools. Its assets only become reachable at this point, which is the whole
   * point of the gate.
   */
  /**
   * Records a tool as done in the bucket it belongs to. Learn tools land in the
   * current video's bucket; the chapter-wide exams stay on the chapter, since
   * they assess every video rather than any one of them.
   */
  const markToolHere = (tool: ToolId): ToolId[] => {
    if (completedTools.includes(tool)) return completedTools;
    const bucket = isSegmented && !CHAPTER_EXAM_TOOLS.includes(tool) ? videoIndex : undefined;
    markToolCompleted(subjectId, chapterNumber, tool, bucket);
    const completed = [...completedTools, tool];
    setCompletedTools(completed);
    return completed;
  };

  const handleVideoWatched = (index: number) => {
    const completed = markVideoWatched(subjectId, chapterNumber, index);
    markToolHere("videos");
    if (index === videoIndex) setCompletedTools(completed);
  };

  /**
   * Leaves the current video's loop. Advances to the next video — whether the
   * learner worked through the tools or skipped them — and falls through to the
   * chapter exams once the last video is done.
   */
  const advancePastVideoLoop = () => {
    if (hasNextVideo) {
      const next = videoIndex + 1;
      setVideoIndex(next);
      setCompletedTools(completedToolsFor(next));
      setActiveToolState("summary");
      return;
    }
    // Last video done — the chapter-wide exams are unlocked now.
    setActiveTool("mocktest");
  };

  // MVP: no payment gating needed
  // useEffect(() => {
  //   const hasPaid = localStorage.getItem(`registered_${subjectId}`) === 'true';
  //   if (!hasPaid) {
  //     navigate(`/course/${subjectId}`);
  //   }
  // }, [subjectId, navigate]);

  const [isToolTransitioning, setIsToolTransitioning] = useState(false);
  const [transitionTargetTool, setTransitionTargetTool] = useState<ToolId | null>(null);
  const [mockTestVariant, setMockTestVariant] = useState<"mock" | "prep">("mock");

  const triggerToolTransition = (target: ToolId) => {
    setTransitionTargetTool(target);
    setIsToolTransitioning(false);
  };

  // `completedOverride` lets a caller that just marked a step done unlock the
  // next one in the same tick, before the completedTools state has re-rendered.
  const setActiveTool = (tool: ToolId, completedOverride?: ToolId[]) => {
    const completed = completedOverride ?? completedTools;
    if (tool !== activeTool) {
      triggerToolTransition(tool);
    }
    if (tool !== "podcasts") {
      setPodcastAutoPlay(false);
      setPodcastTargetMcIndex(null);
      setPodcastTargetTrack(null);
    }
    React.startTransition(() => {
      setActiveToolState(tool);
      setSearchParams(prev => { prev.set("tool", tool); return prev; }, { replace: true });
    });
    trackToolUsage({
      tool,
      subjectId,
      chapterNumber,
      chapterName: `Chapter ${chapterNumber}`,
    });
  };



  // Index of the current (first incomplete) unit — everything after it is locked.
  // Depends on completedTools so finishing a unit's last tool unlocks the next
  // unit in the same render.
  const frontierIndex = useMemo(
    () =>
      getUnlockedFrontierIndex(
        subjectId,
        subjectChapters.map((c) => c.number),
      ),
    [subjectId, subjectChapters, completedTools],
  );

  // Which unit section is expanded in the sidebar accordion — exactly one at a
  // time, so opening a unit collapses the others. Locked units may expand too
  // (preview) — their tools just stay locked.
  const [expandedUnit, setExpandedUnit] = useState<number | null>(chapterNumber);

  useEffect(() => {
    // Switching units focuses the accordion on the one being studied.
    setExpandedUnit(chapterNumber);
  }, [chapterNumber]);

  const toggleUnitExpanded = (num: number) => {
    setExpandedUnit((prev) => (prev === num ? null : num));
  };

  /**
   * Open a tool that may live in a different unit. Updates chapter + tool in one
   * pass: the ?tool= sync effect validates against completedTools, which still
   * belongs to the old unit for one render, so relying on it would mis-gate the
   * jump. `completedOverride` covers the finish-button case where the completion
   * that unlocks the next unit hasn't landed in state yet.
   */
  const openUnitTool = (
    ch: Chapter,
    tool: ToolId,
    completedOverride?: ToolId[],
  ) => {
    if (ch.number === chapterNumber) {
      setActiveTool(tool, completedOverride);
      return;
    }
    const numbers = subjectChapters.map((c) => c.number);
    const idx = numbers.indexOf(ch.number);
    const frontier = getUnlockedFrontierIndex(subjectId, numbers);
    if (idx === -1 || idx > frontier) return;

    // The target unit may itself be segmented, and its registry is not loaded
    // here. The cached count lets the gate use the right rule either way.
    const targetVideoCount = getChapterVideoCount(subjectId, ch.number);
    const unitCompleted = getCompletedTools(
      subjectId,
      ch.number,
      targetVideoCount > 0 ? 1 : undefined,
    );
    const allowed =
      targetVideoCount > 0
        ? isToolUnlockedForVideo(tool, subjectId, ch.number, 1, targetVideoCount)
        : isToolUnlocked(tool, unitCompleted);
    if (!allowed) return;

    googleTtsStop();
    setChapterNumber(ch.number);
    setCompletedTools(unitCompleted);
    setActiveToolState(tool);
    setVideoIndex(1);
    setSearchParams(prev => { prev.set("tool", tool); return prev; }, { replace: true });
    const chapterTitle = toTitleCase(ch.name);
    trackToolUsage({
      tool,
      subjectId,
      chapterNumber: ch.number,
      chapterName: chapterTitle,
    });
  };

  const handleChapterChange = (num: number) => {
    googleTtsStop();
    setChapterNumber(num);
    const unitCompleted = getCompletedTools(subjectId, num);
    setCompletedTools(unitCompleted);
    setVideoIndex(1);
    setSearchParams(prev => { prev.set("tool", activeTool); return prev; }, { replace: true });
  };

  // The unit that follows the one being studied — where "Finish Unit" lands.
  const currentUnitIdx = subjectChapters.findIndex(
    (c) => c.number === chapterNumber,
  );
  const nextUnit =
    currentUnitIdx === -1 ? undefined : subjectChapters[currentUnitIdx + 1];

  // Guided chapter gating has been removed per user request so they can freely 
  // navigate between unit tabs in MOOC mode.



  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === "INPUT" ||
          activeEl.tagName === "TEXTAREA" ||
          activeEl.getAttribute("contenteditable") === "true")
      ) {
        return;
      }

      // Allow interactive tools to handle their own arrow keys
      if (
        activeTool === "flashcards" ||
        activeTool === "revision_flashcards" ||
        activeTool === "assessment" ||
        activeTool === "mocktest" ||
        activeTool === "pre_final_test" ||
        activeTool === "qbank"
      ) {
        return;
      }

      if (e.key === "ArrowLeft") {
        if (subjectChapters.length > 0) {
          const currentIdx = subjectChapters.findIndex((c) => c.number === chapterNumber);
          if (currentIdx > 0) {
            const prevCh = subjectChapters[currentIdx - 1];
            const params = new URLSearchParams(searchParams);
            params.set("chapter", prevCh.number.toString());
            params.set("chapterName", prevCh.name);
            navigate(`/study-table?${params.toString()}`);
          }
        }
      } else if (e.key === "ArrowRight") {
        if (subjectChapters.length > 0) {
          const currentIdx = subjectChapters.findIndex((c) => c.number === chapterNumber);
          if (currentIdx >= 0 && currentIdx < subjectChapters.length - 1) {
            const nextCh = subjectChapters[currentIdx + 1];
            const params = new URLSearchParams(searchParams);
            params.set("chapter", nextCh.number.toString());
            params.set("chapterName", nextCh.name);
            navigate(`/study-table?${params.toString()}`);
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [chapterNumber, subjectChapters, searchParams, navigate]);

  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleLoadedReadContent = useCallback((txt: string) => {
    setContent((prev: any) => (prev === txt ? prev : txt));
  }, []);

  // Masterminds mindmap concept panel state
  const [mmActiveNodeId, setMmActiveNodeId] = useState<string | null>(null);
  const [mmConceptRaw, setMmConceptRaw] = useState<string>('');
  const [mmDeepDiveRaw, setMmDeepDiveRaw] = useState<string>('');
  const [mmConceptSection, setMmConceptSection] = useState<'summary' | 'detailed' | 'flashcards' | 'deepdive'>('summary');
  const [mmConceptLoading, setMmConceptLoading] = useState(false);
  const [mmFlippedCards, setMmFlippedCards] = useState<Set<number>>(new Set());

  let activeNodeTitle = "";
  if (activeTool === "mindmap" && mmActiveNodeId && mmConceptRaw) {
    const titleMatch = mmConceptRaw.match(/^#\s*([^\n]+)/m);
    if (titleMatch) {
      activeNodeTitle = titleMatch[1].trim();
    }
  }

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isHoverExpanded, setIsHoverExpanded] = useState(false);
  // Toolbar state: permanently open and displayed at all times
  const isToolbarOpen = true;

  const railCollapseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const clearRailCollapseTimer = useCallback(() => {
    if (railCollapseTimerRef.current != null) {
      clearTimeout(railCollapseTimerRef.current);
      railCollapseTimerRef.current = null;
    }
  }, []);

  // Auto-collapse sidebar when studying content (concept view active) and restore state when returning
  const previousSidebarState = useRef(isSidebarOpen);
  useEffect(() => {
    if (activeTool === "mindmap") {
      if (mmActiveNodeId) {
        previousSidebarState.current = isSidebarOpen;
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(previousSidebarState.current);
      }
    } else if (activeTool) {
      previousSidebarState.current = isSidebarOpen;
      setIsSidebarOpen(false);
    }
  }, [mmActiveNodeId, activeTool]);

  // Auto-scroll active rail item into view when tool changes or sidebar is collapsed
  useEffect(() => {
    if (!isSidebarOpen) {
      const timer = setTimeout(() => {
        const container = document.querySelector('.sv-rail-items') as HTMLElement | null;
        const activeItem = document.querySelector('.sv-rail-item.active') as HTMLElement | null;
        if (container && activeItem) {
          const targetTop = activeItem.offsetTop - container.offsetTop;
          container.scrollTo({ top: Math.max(0, targetTop - 20), behavior: 'smooth' });
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [activeTool, isSidebarOpen]);
  const [readingHighlight, setReadingHighlight] = useState<{
    active: boolean;
    startWord: number;
    endWord: number;
  }>({
    active: false,
    startWord: -1,
    endWord: -1,
  });
  const [qbankReadAloudText, setQbankReadAloudText] = useState("");

  useEffect(() => {
    // Stop reading whenever we switch tools to prevent overlapping audio
    googleTtsStop();

    if (activeTool !== "qbank") {
      setQbankReadAloudText("");
    }
  }, [activeTool]);

  // Stop TTS when persona changes — new content will load
  useEffect(() => {
    googleTtsStop();
    setReadingHighlight((prev) =>
      !prev.active && prev.startWord === -1 && prev.endWord === -1
        ? prev
        : { active: false, startWord: -1, endWord: -1 }
    );
  }, [persona]);

  const handleHighlightChange = useCallback(
    (payload: { active: boolean; startWord: number; endWord: number }) => {
      setReadingHighlight(payload);
    },
    []
  );

  const readAloudProcessedText = useMemo(
    () => preprocessSummaryText(typeof content === "string" ? content : ""),
    [content]
  );

  // Reset masterminds concept panel + inline topic view when switching chapters, subjects, or tools
  useEffect(() => {
    setMmActiveNodeId(null);
    setMmConceptRaw('');
    setMmDeepDiveRaw('');
    setMmConceptSection('summary');
    setMmFlippedCards(new Set());
    // Also close the inline mindmap topic panel
    setMindmapTopicOpen(false);
    setMindmapTopicTitle(null);
    setMindmapInlineType('text');
    setMindmapMediaUrl('');
  }, [subjectId, chapterNumber, activeTool]);

  // Reset flipped cards when switching concepts or tabs
  useEffect(() => {
    setMmFlippedCards(new Set());
  }, [mmActiveNodeId, mmConceptSection]);

  // Fetch masterminds concept content when a concept node is clicked
  useEffect(() => {
    if (!mmActiveNodeId || !(mmActiveNodeId.startsWith('concept_') || mmActiveNodeId.startsWith('subtopic_') || mmActiveNodeId.startsWith('topic_'))) return;
    const url = getMastermindsConceptUrl(subjectId, chapterNumber, persona, mmActiveNodeId);
    if (!url) return;
    setMmConceptLoading(true);
    setMmConceptRaw('');
    setMmDeepDiveRaw('');
    fetch(url, { cache: 'no-cache' })
      .then(r => r.ok ? r.text() : Promise.reject(r.status))
      .then(t => { setMmConceptRaw(t); setMmConceptLoading(false); })
      .catch(() => { setMmConceptRaw('Content not available for this concept.'); setMmConceptLoading(false); });
  }, [mmActiveNodeId, persona, subjectId, chapterNumber]);
  useEffect(() => {
    const handleResize = () => {
      clearRailCollapseTimer();
      setIsSidebarOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearRailCollapseTimer();
    };
  }, [clearRailCollapseTimer]);

  /** Tools that do NOT have persona-specific content — hide the switcher for these */
  const NON_PERSONA_TOOLS = new Set([
    "pyq",
    "swot",
    "leaderboard",
    "ask",
    "videos",
    "deep_dive",
    "revision_flashcards",
    "mock_test",
  ]);
  const showPersonaSwitcher = !NON_PERSONA_TOOLS.has(activeTool);
  const [activePhaseTab, setActivePhaseTab] = useState<"learn" | "prepare">("learn");

  useEffect(() => {
    const idx = GUIDED_FLOW.indexOf(activeTool);
    if (idx >= 0 && idx < 5) setActivePhaseTab("learn");
    else if (idx >= 5) setActivePhaseTab("prepare");
  }, [activeTool]);

  const [isAuthenticated, setIsAuthenticated] = useState(
    () => cloudStorage.getItem("app_authenticated") === "true",
  );

  // Flashcard speak state — button lives in topbar, logic lives in FlashcardsView
  const [flashcardSpeakTrigger, setFlashcardSpeakTrigger] = useState(0);
  const [flashcardStopTrigger, setFlashcardStopTrigger] = useState(0);
  const [flashcardIsSpeaking, setFlashcardIsSpeaking] = useState(false);

  // Podcast play state — button lives in topbar, logic lives in PodcastsView
  const [podcastPlayTrigger, setPodcastPlayTrigger] = useState(0);
  const [podcastPauseTrigger, setPodcastPauseTrigger] = useState(0);
  const [podcastStopTrigger, setPodcastStopTrigger] = useState(0);
  const [podcastIsPlaying, setPodcastIsPlaying] = useState(false);
  const [podcastHasStarted, setPodcastHasStarted] = useState(false);

  // Mini Ask AI Help Dropdown State
  const [showHelpDropdown, setShowHelpDropdown] = useState(false);
  const [miniAskInput, setMiniAskInput] = useState("");
  const [miniMessages, setMiniMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [miniIsLoading, setMiniIsLoading] = useState(false);

  const handleSendMiniAsk = async () => {
    if (!miniAskInput.trim() || miniIsLoading) return;
    const userQ = miniAskInput.trim();
    setMiniAskInput("");
    setMiniMessages((prev) => [...prev, { role: 'user', content: userQ }]);
    setMiniIsLoading(true);

    try {
      const res = await askGemini(
        userQ,
        subjectId,
        chapterName || `Chapter ${chapterNumber}`,
        chapterNumber,
        persona,
        'en-IN',
        className
      );
      setMiniMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: res.answer || `I'm here to help with "${userQ}" in ${chapterName || 'this chapter'}.`,
        },
      ]);
    } catch {
      setMiniMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `I'm here to help with "${userQ}" in ${chapterName || 'this chapter'}! Feel free to ask more or review the lesson materials.`,
        },
      ]);
    } finally {
      setMiniIsLoading(false);
    }
  };

  const handleAuthClick = () => {
    cloudStorage.removeItem("app_authenticated");
    cloudStorage.removeItem("app_role");
    cloudStorage.removeItem("app_user_id");
    cloudStorage.removeItem("username");
    cloudStorage.removeItem("questionnaire_completed");
    cloudStorage.removeItem("sv_video_open_counts");
    setIsAuthenticated(false);
    tenantLogout();
    const activeTenant = contextTenantId || getRegistryTenantId();
    if (activeTenant) {
      cloudStorage.removeItem(`sv_session_${activeTenant}`);
    }
    navigate("/login", { replace: true });
  };

  const { startFocusMode, isFocusModeActive } = useFocusMode();

  const handlePYQSOS = useCallback(
    (sosSubjectId: string, sosChapterNumber: number) => {
      startFocusMode(
        sosSubjectId,
        sosChapterNumber,
        location.pathname + location.search,
      );
      navigate(`/subjects/${sosSubjectId}/chapter/${sosChapterNumber}`);
    },
    [startFocusMode, navigate, location.pathname, location.search],
  );

  // Track chapter visit whenever chapter changes
  useEffect(() => {
    trackChapterVisit({
      subjectId,
      subjectName,
      chapterNumber,
      chapterName:
        searchParams.get("chapterName") || `Chapter ${chapterNumber}`,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectId, chapterNumber]);

  useEffect(() => {
    // Pass the real subjectId for all tools — each tool handles subject routing itself
    const internalSubId = subjectId;
    const isCloudSubject =
      GCS_BACKEND_SUBJECTS.has(internalSubId) ||
      GCS_BACKEND_SUBJECTS.has(resolveSubjectId(internalSubId));

    // SectionizedReadView manages its own fetch + cache for cloud summary/detailed
    // without needing videosLoaded or StudyTable's loading spinner
    if (isCloudSubject && (activeTool === "summary" || activeTool === "detailed")) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setContent(null);

    // Hold off until the video registry has settled. Firing now would fetch
    // chapter-scoped paths for a chapter whose assets live under a video
    // directory, and the losing request could still land last (see `stale`).
    if (!videosLoaded) return;

    // Requests are not cancellable, but their results are ignorable. Without
    // this, a slow superseded fetch — a miss walking every fallback candidate,
    // say — resolves after the fetch that replaced it and overwrites good
    // content with its own failure.
    let stale = false;
    const apply = (value: any) => {
      if (stale) return;
      setContent(value);
      setLoading(false);
    };

    if (activeTool === "summary") {
      getResourceContent(internalSubId, chapterNumber, "summary.md", persona, activeVideoDir)
        .then(apply)
        .catch(() => apply("Summary content unavailable for this persona."));
    } else if (activeTool === "key_takeaways") {
      getResourceContent(internalSubId, chapterNumber, "key_takeaways.md", persona, activeVideoDir)
        .then(apply)
        .catch(() => apply("Key Takeaways not available for this chapter."));
    } else if (activeTool === "study_plan") {
      getResourceContent(internalSubId, chapterNumber, "study_plan.md", persona, activeVideoDir)
        .then(apply)
        .catch(() => apply("Study Plan not available for this chapter."));
    } else if (activeTool === "detailed") {
      getResourceContent(
        internalSubId,
        chapterNumber,
        "detailed_view.md",
        persona,
        activeVideoDir,
      )
        .then(apply)
        .catch(() => apply("Detailed notes unavailable."));
    } else if (activeTool === "deep_dive") {
      const url = getDeepDiveToolUrl(internalSubId, chapterNumber);
      if (url) {
        fetch(url, { cache: "no-cache" })
          .then(r => r.ok ? r.arrayBuffer() : Promise.reject())
          .then(buf => apply(new TextDecoder("utf-8").decode(buf)))
          .catch(() => apply("Deep Dive content unavailable."));
      } else {
        apply("Deep Dive not available for this chapter.");
      }
    } else if (activeTool === "flashcards" || activeTool === "revision_flashcards") {
      getFlashcards(internalSubId, chapterNumber, persona, activeVideoDir)
        .then((cards) => {
          let weakCards: any[] = [];
          try {
            const rawWeak = cloudStorage.getItem(`sv_weak_cards_${subjectId}_${chapterNumber}`);
            const parsedWeak = rawWeak ? JSON.parse(rawWeak) : [];
            if (Array.isArray(parsedWeak)) {
              weakCards = parsedWeak
                .filter((w: any) => w && w.question && w.answer)
                .map((w: any, idx: number) => ({
                  id: w.id || `weak-${idx}`,
                  question: w.question,
                  answer: w.answer,
                  topic: w.topic ? `Weak Card · ${w.topic}` : "Weak Card · From Assessment",
                  level: persona,
                }));
            }
          } catch {}

          const baseCards = Array.isArray(cards) ? cards : [];
          const existingQs = new Set(baseCards.map((c: any) => (c.question || "").trim().toLowerCase()));
          const uniqueWeak = weakCards.filter((w) => !existingQs.has((w.question || "").trim().toLowerCase()));

          if (activeTool === "revision_flashcards") {
            const taggedCards = [...uniqueWeak, ...baseCards.map((c) => ({ ...c, level: persona }))];
            for (let i = taggedCards.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [taggedCards[i], taggedCards[j]] = [taggedCards[j], taggedCards[i]];
            }
            apply(taggedCards);
          } else {
            apply([...uniqueWeak, ...baseCards]);
          }
        })
        .catch(() => apply([]));
    } else if (activeTool === "mindmap" || activeTool === "foundation") {
      getResourceContent(internalSubId, chapterNumber, "mindmap.md", persona)
        .then(apply)
        .catch(() => apply(""));
    } else if (activeTool === "qbank" || activeTool === "assessment") {
      if (activeTool === "assessment" && isCloudSubject) {
        apply("");
      } else {
        getResourceContent(
          internalSubId,
          chapterNumber,
          activeTool === "assessment" ? "quiz.md" : "question_bank.md",
          persona,
          // The Certification Exam covers the whole chapter, so it stays
          // chapter-scoped even when the assessments beside it are per-video.
          activeTool === "assessment" ? activeVideoDir : undefined,
        )
          .then(apply)
          .catch(() => apply("Question bank unavailable."));
      }
    } else if (activeTool === "videos") {
      handleVideoWatched(videoIndex);
      getResourceContent(
        internalSubId,
        chapterNumber,
        "youtube_links.md",
        persona,
      )
        .then(apply)
        .catch(() => apply(null));
    } else {
      setLoading(false);
    }

    return () => {
      stale = true;
    };
  }, [activeTool, subjectId, chapterNumber, persona, activeVideoDir, videosLoaded]);

  const handleBackToClass = () => navigate("/");
  const handleBackToChapters = () => {
    navigate(`/subjects/${subjectId}`);
  };

  // Build breadcrumb: M.A > 3rd Semester > Public Administration (Urdu Medium) > Chapter 1
  const breadcrumbParts: { label: string; onClick?: () => void }[] = [];
  breadcrumbParts.push({ label: className, onClick: handleBackToClass });
  if (semesterName) {
    breadcrumbParts.push({ label: semesterName });
  }
  breadcrumbParts.push({ label: subjectName, onClick: handleBackToChapters });
  breadcrumbParts.push({ label: chapterName });

  const parseMmConceptSections = (raw: string) => {
    const title = (raw.match(/^# (.+)$/m) ?? [])[1]?.trim() ?? '';
    const pageRef = (raw.match(/\*\*Reference:\*\*\s*([^\n]+)/) ?? [])[1]?.trim() ?? '';
    const summary = (raw.match(/###[^\n]*Summary[^\n]*\n([\s\S]*?)(?=\n###\s*(?:📋|🔍|🎴|Detailed|Flashcard)|\n\s*---\s*\n|\n## |$)/) ?? [])[1]?.trim() ?? '';
    const detailed = (raw.match(/###[^\n]*Detailed[^\n]*\n([\s\S]*?)(?=\n###\s*(?:📋|🔍|🎴|Summary|Flashcard)|\n\s*---\s*\n|\n## |$)/) ?? [])[1]?.trim() ?? '';
    const flashcards = (raw.match(/###[^\n]*Flashcard[^\n]*\n([\s\S]*?)(?=\n###\s*(?:📋|🔍|🎴|Summary|Detailed)|\n\s*---\s*\n|\n## |$)/) ?? [])[1]?.trim() ?? '';
    return { title, pageRef, summary, detailed, flashcards };
  };

  const parseMmFlashcards = (flashcardSection: string) => {
    const cards: { question: string; answer: string }[] = [];
    const re = /<details>([\s\S]*?)<\/details>/gi;
    let m;
    while ((m = re.exec(flashcardSection)) !== null) {
      const block = m[1];
      const summaryMatch = block.match(/<summary>([\s\S]*?)<\/summary>/i);
      if (!summaryMatch) continue;
      let q = summaryMatch[1].trim()
        .replace(/^⚡\s*Card\s*\d+:\s*/i, '')
        .replace(/\s*\(Click to reveal\)\s*$/i, '')
        .trim();
      const answerMatch = block.match(/<b>Answer:<\/b>\s*([\s\S]*?)$/i);
      const a = answerMatch?.[1]?.trim() ?? '';
      if (q) cards.push({ question: q, answer: a });
    }
    return cards;
  };

  const renderMainContent = () => {
    if (loading)
      return <StudyToolLoadingWaitScreen />;

    switch (activeTool) {
      case "summary":
      case "detailed": {
        const isCloudSubject =
          GCS_BACKEND_SUBJECTS.has(subjectId) ||
          GCS_BACKEND_SUBJECTS.has(resolveSubjectId(subjectId));
        if (isCloudSubject) {
          return (
            <SectionizedReadView
              key={`sectionized-read-${subjectId}-${chapterNumber}`}
              subjectId={subjectId}
              chapterNumber={chapterNumber}
              persona={persona}
              track={activeTool === "detailed" ? "detailed" : "quick"}
              targetSectionIndex={readTargetSection}
              onPersonaChange={setPersona}
              isPurpleTheme={false}
              readingHighlight={readingHighlight}
              onLoadedContent={handleLoadedReadContent}
            />
          );
        }
        // fall-through for non-cloud subjects on summary / detailed
        const parseDetailedHeadings = (markdown: string) => {
          const lines = markdown.split('\n');
          const headings: { text: string }[] = [];
          for (const line of lines) {
            const match = line.match(/^(#{3,4})\s+(.+)$/);
            if (match) {
              let text = match[2].trim().replace(/\*+/g, '');
              if (text.toLowerCase().includes('concept') || text.toLowerCase().includes('overview') || text.toLowerCase().includes('definition')) {
                headings.push({ text });
              }
            }
          }
          return headings;
        };

        const detailedHeadings = activeTool === "detailed" && typeof content === "string" ? parseDetailedHeadings(content) : [];

        return (
          <div className="markdown-container" style={{ position: 'relative', maxWidth: '1040px', margin: '0 auto', width: '100%', paddingLeft: '24px', paddingRight: '24px', boxSizing: 'border-box' }}>
            <style>{`
              @keyframes highlightFlash {
                0% { background-color: rgba(255, 235, 59, 0.6); }
                100% { background-color: transparent; }
              }
              .heading-highlight-flash {
                animation: highlightFlash 2s ease-out;
                border-radius: 4px;
                padding: 2px 6px;
              }
            `}</style>
            {activeTool === "detailed" && detailedHeadings.length > 0 && (
              <div className="detailed-nav-header" style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                padding: '12px 16px',
                borderBottom: '1px solid var(--border)',
                background: 'var(--surface-variant, #f5f7fb)',
                alignItems: 'center',
                marginBottom: '16px',
                borderRadius: '8px',
                position: 'sticky',
                top: 0,
                zIndex: 10
              }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Jump to:</span>
                {detailedHeadings.map((h, idx) => (
                  <button
                    key={idx}
                    className="detailed-nav-btn"
                    onClick={() => {
                      const cleanName = h.text.replace(/[^\w\s-]/g, '').trim().toLowerCase();
                      const domHeadings = Array.from(document.querySelectorAll('.markdown-view h1, .markdown-view h2, .markdown-view h3, .markdown-view h4, .markdown-view h5, .markdown-view h6'));
                      const target = domHeadings.find(el => {
                        const text = el.textContent?.replace(/[^\w\s-]/g, '').trim().toLowerCase() || "";
                        return text.includes(cleanName) || cleanName.includes(text);
                      });
                      if (target) {
                        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        target.classList.add('heading-highlight-flash');
                        setTimeout(() => target.classList.remove('heading-highlight-flash'), 2000);
                      }
                    }}
                    style={{
                      padding: '6px 12px',
                      fontSize: '0.8rem',
                      borderRadius: '16px',
                      border: '1px solid var(--border)',
                      cursor: 'pointer',
                      backgroundColor: 'var(--background, #fff)',
                      color: 'var(--primary, #6200ee)',
                      fontWeight: 500,
                      transition: 'all 0.2s'
                    }}
                  >
                    {h.text}
                  </button>
                ))}
              </div>
            )}
            <ReadingHighlightView
              content={preprocessSummaryText(typeof content === "string" ? content : "")}
              active={readingHighlight.active}
              startWord={readingHighlight.startWord}
              endWord={readingHighlight.endWord}
              isPurpleTheme={subjectId === "dbms" || subjectId.includes("dbms")}
            />
          </div>
        );
      }
      case "key_takeaways": {
        return (
          <KeyTakeawaysView
            content={typeof content === "string" ? content : ""}
            subjectId={subjectId}
            subjectName={subjectName}
            chapterNumber={chapterNumber}
            chapterName={chapterName}
            isPurpleTheme={false}
          />
        );
      }
      case "study_plan": {
        return (
          <StudyPlanView
            content={typeof content === "string" ? content : ""}
            subjectId={subjectId}
            subjectName={subjectName}
            chapterNumber={chapterNumber}
            chapterName={chapterName}
            isPurpleTheme={false}
            persona={uiPersona}
            onChangePersona={(p) => setPersona(p)}
            onSwitchTool={(tool) => setActiveTool(tool)}
          />
        );
      }
      case "mindmap":
      case "foundation": {
        const isMmMasterminds = !!MASTERMINDS_MINDMAP_MAP[subjectId]?.[chapterNumber];

        let mindmapTree: any = null;
        if (isMmMasterminds && typeof content === "string") {
          try {
            mindmapTree = JSON.parse(content);
          } catch (e) {
            console.error("Failed to parse mindmap tree JSON", e);
          }
        }

        let siblingSubtopics: any[] = [];
        let nextTopicLink: any = null;
        let parentTopic: any = null;

        if (mindmapTree && mindmapTree.children) {
          const topics = mindmapTree.children;
          for (let i = 0; i < topics.length; i++) {
            const topic = topics[i];
            const isCurrentTopic = topic.id === mmActiveNodeId;
            const subtopicMatch = (topic.children || []).find((s: any) => s.id === mmActiveNodeId);

            if (isCurrentTopic || subtopicMatch) {
              siblingSubtopics = topic.children || [];
              const nextIndex = (i + 1) % topics.length;
              nextTopicLink = topics[nextIndex];
              // If we're inside a subtopic, remember the parent topic for "↑ Topic" nav
              if (subtopicMatch) {
                parentTopic = topic;
              }
              break;
            }
          }
        }

        if (isMmMasterminds && mmActiveNodeId && (mmActiveNodeId.startsWith('concept_') || mmActiveNodeId.startsWith('subtopic_') || mmActiveNodeId.startsWith('topic_'))) {
          const sections = parseMmConceptSections(mmConceptRaw);
          const conceptN = mmActiveNodeId.replace(/^(concept_|subtopic_|topic_)/, '');
          const sectionContent =
            mmConceptSection === 'summary' ? sections.summary :
              mmConceptSection === 'detailed' ? sections.detailed :
                mmDeepDiveRaw;
          const mmCards = mmConceptSection === 'flashcards' ? parseMmFlashcards(sections.flashcards) : [];
          const mmConceptTitle = activeNodeTitle || mmActiveNodeId.replace(/_/g, ' ');
          const mmConceptQcKey = `mm_master_${subjectId}_${chapterNumber}_${mmActiveNodeId}_${persona}_${mmConceptSection}`;
          const mmConceptQcList =
            mmConceptSection !== 'flashcards' && sectionContent
              ? generateQuickCheckQuestionsFromMarkdown(mmConceptTitle, sectionContent, `M_${conceptN}`)
              : [];
          const mmConceptQcDone = mmCompletedQuickChecks.has(mmConceptQcKey);
          const mmConceptSelectedKeys: Record<number, string> = {};
          for (let qIdx = 0; qIdx < mmConceptQcList.length; qIdx++) {
            const val =
              mmQcAnswers[`${mmConceptQcKey}_${qIdx}`] ||
              (qIdx === 0 ? mmQcAnswers[mmConceptQcKey] : undefined);
            if (val) mmConceptSelectedKeys[qIdx] = val;
          }
          const mmConceptAnsweredCount = Object.keys(mmConceptSelectedKeys).length;
          const mmConceptReadMins = estimateReadingTime(sectionContent || '');

          return (
            <div className="mm-concept-view">
              <div className="mm-concept-topbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'nowrap' }}>
                {/* Left side: Back to Mindmap + optional Back to Topic */}
                <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0, minWidth: '150px', gap: '6px' }}>
                  <button
                    className="mm-back-btn"
                    onClick={() => { setMmActiveNodeId(null); setMmConceptSection('summary'); }}
                  >
                    ← Mindmap
                  </button>
                  {parentTopic && (
                    <button
                      className="mm-next-topic-btn"
                      onClick={() => { setMmActiveNodeId(parentTopic.id); setMmConceptSection('summary'); }}
                      title={parentTopic.name}
                    >
                      ↑ Topic: {parentTopic.name.length > 18 ? `${parentTopic.name.slice(0, 16)}…` : parentTopic.name}
                    </button>
                  )}
                </div>

                {/* Middle: Sibling Subtopics */}
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'nowrap', justifyContent: 'center', flex: 1, overflow: 'hidden' }}>
                  {siblingSubtopics.length > 0 && (
                    <>
                      <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginRight: '4px' }}>Sub-topics:</span>
                      {siblingSubtopics.map((sub: any) => {
                        const isActive = sub.id === mmActiveNodeId;

                        // Abbreviate subtopic name if too long or has parenthesis
                        const parenMatch = sub.name.match(/\(([^)]+)\)/);
                        const abbreviatedName = parenMatch
                          ? parenMatch[1]
                          : sub.name.length > 20
                            ? `${sub.name.slice(0, 18)}...`
                            : sub.name;

                        return (
                          <button
                            key={sub.id}
                            className={`mm-nav-sub-btn ${isActive ? 'active' : ''}`}
                            onClick={() => {
                              setMmActiveNodeId(sub.id);
                              setMmConceptSection('summary');
                            }}
                            title={sub.name}
                          >
                            {abbreviatedName}
                          </button>
                        );
                      })}
                    </>
                  )}
                </div>

                {/* Right side: Next Topic button */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', flexShrink: 0, minWidth: '150px' }}>
                  {nextTopicLink && (
                    <button
                      className="mm-next-topic-btn"
                      onClick={() => {
                        setMmActiveNodeId(nextTopicLink.id);
                        setMmConceptSection('summary');
                      }}
                      title={nextTopicLink.name}
                    >
                      Up next: {nextTopicLink.name.length > 18 ? `${nextTopicLink.name.slice(0, 16)}...` : nextTopicLink.name} →
                    </button>
                  )}
                </div>
              </div>

              <div className="mm-section-tabs">
                {(['summary', 'detailed', 'flashcards', 'deepdive'] as const).map(s => (
                  <button
                    key={s}
                    className={`mm-tab-btn${mmConceptSection === s ? ' active' : ''}`}
                    onClick={() => {
                      setMmConceptSection(s);
                      if (s === 'deepdive' && !mmDeepDiveRaw) {
                        const ddUrl = getMastermindsDeepDiveUrl(subjectId, chapterNumber, persona, conceptN);
                        if (ddUrl) {
                          fetch(ddUrl, { cache: 'no-cache' })
                            .then(r => r.ok ? r.text() : Promise.reject(r.status))
                            .then(t => setMmDeepDiveRaw(t))
                            .catch(() => setMmDeepDiveRaw('Deep dive content not available.'));
                        }
                      }
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {s === 'summary' ? (
                        <>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                            <path d="M4 19.5C4 18.837 4.26339 18.2011 4.73223 17.7322C5.20107 17.2634 5.83696 17 6.5 17H20" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M6.5 2H20V22H6.5C5.83696 22 5.20107 21.7366 4.73223 21.2678C4.26339 20.7989 4 20.163 4 19.5V4.5C4 3.83696 4.26339 3.20107 4.73223 2.73223C5.20107 2.26339 5.83696 2 6.5 2V2Z" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          Read
                        </>
                      ) : s === 'detailed' ? (
                        <>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                            <path d="M9 12h6M9 16h6M5 4h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          Detailed
                        </>
                      ) : s === 'flashcards' ? (
                        <>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                            <rect x="4" y="6" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.75" />
                            <path d="M4 10h16" stroke="currentColor" strokeWidth="1.75" />
                          </svg>
                          Flashcards
                        </>
                      ) : (
                        <>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.75" />
                            <path d="M12 7V12L15 15" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                          </svg>
                          Deep Dive
                        </>
                      )}
                    </span>
                  </button>
                ))}
              </div>
              <div className="mm-concept-content">
                {mmConceptLoading ? (
                  <div className="mm-concept-loading">Loading concept...</div>
                ) : mmConceptSection === 'deepdive' && !mmDeepDiveRaw ? (
                  <div className="mm-concept-loading">Loading deep dive...</div>
                ) : mmConceptSection === 'flashcards' ? (
                  mmCards.length > 0 ? (
                    <FlashcardsView
                      cards={mmCards}
                      subjectId={subjectId}
                      chapterNumber={chapterNumber}
                    />
                  ) : (
                    <MarkdownView content={sections.flashcards} />
                  )
                ) : (
                  <div style={{ maxWidth: '1040px', margin: '0 auto', width: '100%' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '16px' }}>
                      <span
                        style={{
                          background: '#f1f5f9',
                          color: '#334155',
                          borderRadius: '6px',
                          padding: '3px 9px',
                          fontSize: '12px',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        ⏱ {mmConceptReadMins} min read
                      </span>

                      {mmConceptQcList.length > 0 && (
                        <button
                          type="button"
                          onClick={() => mmConceptQcRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                          title="Skip to Quick Check"
                          style={{
                            background: mmConceptQcDone ? '#dcfce7' : '#f0fdf4',
                            color: '#15803d',
                            border: '1px solid #bbf7d0',
                            borderRadius: '6px',
                            padding: '3px 9px',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          {mmConceptQcDone
                            ? `✓ ${mmConceptQcList.length} quick check${mmConceptQcList.length > 1 ? 's' : ''} answered`
                            : mmConceptAnsweredCount > 0
                            ? `✔ ${mmConceptAnsweredCount}/${mmConceptQcList.length} quick checks`
                            : `✔ ${mmConceptQcList.length} quick check${mmConceptQcList.length > 1 ? 's' : ''}`}
                        </button>
                      )}
                    </div>

                    <MarkdownView content={sectionContent} />

                    {mmConceptQcList.length > 0 && (
                      <div ref={mmConceptQcRef} style={{ scrollMarginTop: '20px', marginTop: '28px' }}>
                        <QuickCheckModal
                          key={`mm-concept-qc-${mmConceptQcKey}`}
                          isOpen={true}
                          question={mmConceptQcList[0]}
                          questions={mmConceptQcList}
                          currentSectionNumber={1}
                          totalSections={1}
                          sectionTitle={mmConceptTitle}
                          nextSectionTitle={nextTopicLink?.name}
                          isPurpleTheme={false}
                          initialSelectedKey={mmConceptSelectedKeys[0] || null}
                          initialSelectedKeys={mmConceptSelectedKeys}
                          isCompleted={mmConceptQcDone}
                          onNextSection={
                            nextTopicLink
                              ? () => {
                                  markMmQuickCheckCompleted(mmConceptQcKey);
                                  setMmActiveNodeId(nextTopicLink.id);
                                  setMmConceptSection('summary');
                                }
                              : undefined
                          }
                          onAnswerSubmitted={(_isCorrect, selectedKey, questionIndex, allAnswered) => {
                            markMmQuickCheckCompleted(
                              mmConceptQcKey,
                              selectedKey,
                              questionIndex,
                              allAnswered || mmConceptQcList.length === 1
                            );
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        }
        const hardcodedMindmap = `mindmap
  root((ANIMAL TISSUE))
    History
      Xavier Bichat
      Karl Mayer
      Marcello Malpighi
      Phylum Coelenterata
    Epithelial Tissue
      Surfaces
      Characteristics
      Layers
      Modified Epithelium
    Connective Tissue
      Proper
      Supportive
      Fluid
    Muscular Tissue
      Striped / Striated / Skeletal
      Unstriped / Smooth
      Cardiac / Heart muscle
    Nervous Tissue
      Neuroglia
      Neurone`;
        const isNebBiologyChap6 = subjectId === "neb_xii_biology" && chapterNumber === 6;

        // Extract only the mermaid block — strips any markdown title/frontmatter/blockquotes outside the fence
        function extractMermaidBlock(raw: string): string {
          if (raw.trim().startsWith('{')) {
            raw = mindmapJsonToMermaid(raw);
          }
          const match = raw.match(/```mermaid([\s\S]*?)```/);
          if (match) return '```mermaid' + match[1] + '```';
          // Already raw mermaid (no fences)
          if (raw.trim().startsWith('mindmap')) return raw;
          return raw;
        }

        const rawMermaid = isNebBiologyChap6
          ? hardcodedMindmap
          : extractMermaidBlock(typeof content === "string" ? content : "");

        const MINDMAP_MAPPING: Record<string, { type: 'topic' | 'subtopic', id: string }> = {
          'history': { type: 'topic', id: '1' },
          'epithelial tissue': { type: 'topic', id: '2' },
          'connective tissue': { type: 'topic', id: '3' },
          'muscular tissue': { type: 'topic', id: '4' },
          'nervous tissue': { type: 'topic', id: '5' },

          'xavier bichat': { type: 'subtopic', id: '1_xavier_bichat' },
          'karl mayer': { type: 'subtopic', id: '2_karl_mayer' },
          'marcello malpighi': { type: 'subtopic', id: '3_marcello_malpighi' },
          'phylum coelenterata': { type: 'subtopic', id: '4_phylum_coelenterata' },

          'surfaces': { type: 'subtopic', id: '5_epithelial_surfaces_general' },
          'characteristics': { type: 'subtopic', id: '5_epithelial_surfaces_general' },
          'layers': { type: 'subtopic', id: '6_simple_epithelium' },
          'modified epithelium': { type: 'subtopic', id: '8_modified_glandular_epithelium' },

          'proper': { type: 'subtopic', id: '9_proper_connective_tissue' },
          'supportive': { type: 'subtopic', id: '10_supportive_connective_tissue' },
          'fluid': { type: 'subtopic', id: '11_fluid_connective_tissue' },

          'striped / striated / skeletal': { type: 'subtopic', id: '12_striped_skeletal_muscle' },
          'unstriped / smooth': { type: 'subtopic', id: '13_unstriped_smooth_muscle' },
          'cardiac / heart muscle': { type: 'subtopic', id: '14_cardiac_muscle' },

          'neuroglia': { type: 'subtopic', id: '15_neuroglia' },
          'neurone': { type: 'subtopic', id: '16_neurone' },
        };

        const MEDIA_MAPPING: Record<string, { ytId?: string, audio?: string }> = {
          'animal tissue': {
            ytId: 'aHvELPPzWIw',
            audio: 'DL_Animal Tissue Podcast'
          },
          'history': {
            ytId: '-JpxEEPtNos',
            audio: 'MC1_Histology_pioneers_and_the_first_tissues'
          },
          'epithelial tissue': {
            ytId: '8hdw8CLVZao',
            audio: 'MC2_How_Avascular_Epithelium_Survives_and_Stays_Intact'
          },
          'layers': {
            ytId: 'awQ6iU5KWMk',
            audio: 'MC3_Simple_Epithelium_Types_and_Functions'
          },
          'modified epithelium': {
            ytId: 'XYkQgl5IC68',
            audio: 'MC5_Modified_Epithelia_and_Glandular_Secretion_Methods'
          },
          'proper': {
            ytId: '1NSGbA3A4Ts',
            audio: 'MC6_Connective_Tissue_Proper_Cells_and_Fibers'
          },
          'supportive': {
            ytId: 'iaWN0StIFxU',
            audio: 'MC8_Four_unique_types_of_body_cartilage'
          },
          'fluid': {
            ytId: 'IzQkokKYA6A',
            audio: 'MC10_How_Blood_and_Lymph_Fuel_and_Protect'
          },
          'muscular tissue': {
            ytId: '4G7POypkcLE',
          },
          'cardiac / heart muscle': {
            ytId: 'Om40XueGJ_k',
            audio: 'MC11_Why_Some_Muscles_Never_Get_Tired'
          },
          'nervous tissue': {
            ytId: 'Ox3CbPM9uv4',
            audio: 'MC12_How_Myelin_Speeds_Up_Nerve_Signals'
          },
          'neurone': {
            ytId: 'ajlWgPjEa5Y'
          },
          'database fundamentals & engine architecture': { ytId: 'lBf1H_J6tj4' },
          'conceptual database design & er modeling': { ytId: 'mYWnYfsHQoQ' },
          'advanced er & extended er (eer) mechanisms': { ytId: 'mYWnYfsHQoQ' },
          'relational model foundations & integrity constraints': { ytId: 'JA0_3WDjasY' },
          'logical database design (er-to-relational translation)': { ytId: 'Cmc0E1CMa3A' },
          'relational querying, views & schema evolution': { ytId: 'Cmc0E1CMa3A' },
        };

        // ── Dynamic mindmap config (Multi-Tenant & Schema Compliant) ────────
        const curCh = subjectChapters.find((c) => c.number === chapterNumber);
        const dynamicTopicCfg = getChapterTopicConfig(subjectId, chapterNumber, curCh);

        // Compute the final mermaid content:
        const mermaidContent = dynamicTopicCfg
          ? buildMindmapMermaid(dynamicTopicCfg.chapterTitle, dynamicTopicCfg.topics)
          : truncateMindmapToLevels(rawMermaid, 2);

        // Always parse mermaid tree so we can map Level-2 child nodes to their Level-1 parent branch
        const parsedMermaidTree = mermaidContent ? buildTree(mermaidContent) : null;
        const rawMermaidTree = rawMermaid ? buildTree(truncateMindmapToLevels(rawMermaid, 2)) : null;
        const treeForHierarchy = rawMermaidTree || parsedMermaidTree;
        const childToParentBranch: Record<string, string> = {};
        const dynamicTreeSubtopics: Record<string, { code: string; title: string; duration: string; mins: number }[]> = {};
        if (treeForHierarchy?.children) {
          treeForHierarchy.children.forEach((branchNode, bIdx) => {
            const bClean = branchNode.label.trim();
            childToParentBranch[bClean.toLowerCase()] = bClean;
            if (branchNode.children && branchNode.children.length > 0) {
              dynamicTreeSubtopics[bClean.toLowerCase()] = branchNode.children.map((subNode, sIdx) => {
                childToParentBranch[subNode.label.trim().toLowerCase()] = bClean;
                return {
                  code: `${bIdx + 1}.${sIdx + 1}`,
                  title: subNode.label.trim(),
                  duration: '8m',
                  mins: 8,
                };
              });
            }
          });
        }

        const effectiveTopics: MindmapTopic[] = dynamicTopicCfg
          ? dynamicTopicCfg.topics
          : parsedMermaidTree?.children?.map((c, idx) => ({
              label: c.label,
              topicNum: idx + 1,
            })) || [];
        const dynamicMmIcons: Record<string, { hasRead?: boolean; hasVideo?: boolean; hasPodcast?: boolean }> = {};
        for (const t of effectiveTopics) {
          dynamicMmIcons[t.label] = { hasRead: true, hasPodcast: true, hasVideo: true };
          dynamicMmIcons[t.label.toLowerCase()] = { hasRead: true, hasPodcast: true, hasVideo: true };
        }

        const mmIcons: Record<string, { hasRead?: boolean; hasVideo?: boolean; hasPodcast?: boolean }> = isNebBiologyChap6 ? {
          'ANIMAL TISSUE': { hasRead: true },
          'History': { hasRead: true },
          'Epithelial Tissue': { hasRead: true },
          'Connective Tissue': { hasRead: true },
          'Muscular Tissue': { hasRead: true },
          'Nervous Tissue': { hasRead: true },
          'Xavier Bichat': { hasRead: true },
          'Karl Mayer': { hasRead: true },
          'Marcello Malpighi': { hasRead: true },
          'Phylum Coelenterata': { hasRead: true },
          'Surfaces': { hasRead: true },
          'Characteristics': { hasRead: true },
          'Layers': { hasRead: true },
          'Modified Epithelium': { hasRead: true },
          'Proper': { hasRead: true },
          'Supportive': { hasRead: true },
          'Fluid': { hasRead: true },
          'Striped / Striated / Skeletal': { hasRead: true },
          'Unstriped / Smooth': { hasRead: true },
          'Cardiac / Heart muscle': { hasRead: true },
          'Neuroglia': { hasRead: true },
          'Neurone': { hasRead: true }
        } : dynamicMmIcons;

        for (const key of Object.keys(mmIcons)) {
          const mapped = MEDIA_MAPPING[key.toLowerCase().trim()];
          if (mapped) {
            if (mapped.ytId) mmIcons[key].hasVideo = true;
            if (mapped.audio) mmIcons[key].hasPodcast = true;
          }
        }

        const loadMindmapTopicForPersona = async (
          label: string,
          targetPersona: DifficultyLevel,
          action?: 'read' | 'podcast' | 'video',
          preserveTab = false
        ) => {
          setMindmapTopicTitle(label);
          const lowerLabel = label.toLowerCase().trim();

          // ── NEB Biology Chapter 6 path ────────────────────────────────────────
          if (isNebBiologyChap6) {
            const mappedMedia = MEDIA_MAPPING[lowerLabel];
            const mapped = MINDMAP_MAPPING[lowerLabel];

            if (action === 'video' && mappedMedia?.ytId) {
              setMindmapInlineType('video');
              setMindmapMediaUrl(`https://www.youtube.com/embed/${mappedMedia.ytId}?autoplay=1`);
              setMindmapTopicOpen(true);
              return;
            }

            if (action === 'podcast') {
              const nebMcNames = [
                'MC1_Histology_pioneers_and_the_first_tissues',
                'MC2_How_Avascular_Epithelium_Survives_and_Stays_Intact',
                'MC3_Simple_Epithelium_Types_and_Functions',
                'MC4_Body_armor_and_shape_shifting_bladders',
                'MC5_Modified_Epithelia_and_Glandular_Secretion_Methods',
                'MC6_Connective_Tissue_Proper_Cells_and_Fibers',
                'MC7_Why_tendons_anchor_and_ligaments_stretch',
                'MC8_Four_unique_types_of_body_cartilage',
                'MC9_The_microscopic_plumbing_of_mammalian_bones',
                'MC10_How_Blood_and_Lymph_Fuel_and_Protect',
                'MC11_Why_Some_Muscles_Never_Get_Tired',
                'MC12_How_Myelin_Speeds_Up_Nerve_Signals',
              ];
              const nebIdx = mappedMedia?.audio ? nebMcNames.indexOf(mappedMedia.audio) : -1;
              const targetIdx = nebIdx >= 0 ? nebIdx : 0;
              setMindmapTopicOpen(false);
              setPodcastTargetTrack('mc');
              setPodcastTargetMcIndex(targetIdx);
              setPodcastAutoPlay(true);
              setPodcastPlayTrigger(Date.now());
              setActiveTool('podcasts');
              return;
            }

            setMindmapInlineType('text');
            if (!preserveTab) setMindmapInlineTab('quick');
            setMindmapTopicOpen(true);

            if (mapped) {
              const cacheKey = `neb_${mapped.type}_${mapped.id}`;
              const cached = topicNotesCache.get(cacheKey);

              if (cached && cached.quick) {
                setMindmapTopicContent(cached.quick);
                setMindmapDetailedContent(cached.detailed || '');
                setMindmapQuickChecks({
                  quick: cached.quickQc || generateQuickCheckQuestionsFromMarkdown(label, cached.quick, `M_${mapped.id}`),
                  detailed: cached.detailedQc || generateQuickCheckQuestionsFromMarkdown(label, cached.detailed || cached.quick, `M_${mapped.id}`),
                });
                setMindmapTopicLoading(false);
                return;
              }

              setMindmapTopicLoading(true);
              setMindmapTopicContent(null);
              setMindmapDetailedContent(null);

              try {
                const basePathDetailed = `/generated_resources/neb_nepal/class_12/biology/chapter_06/Read/Detailed_Summary/${mapped.type === 'topic' ? 'Topic_Level' : 'SubTopic_Level'}/`;
                const basePathQuick = `/generated_resources/neb_nepal/class_12/biology/chapter_06/Read/Quick_Summary/${mapped.type === 'topic' ? 'Topic_Level' : 'SubTopic_Level'}/`;

                const detailedFilename = mapped.type === 'topic' ? `detailed_summary_topic${mapped.id}.md` : `subtopic${mapped.id}.md`;
                const quickFilename = mapped.type === 'topic' ? `quick_summary_topic${mapped.id}.md` : `subtopic${mapped.id}.md`;

                fetch(basePathQuick + quickFilename)
                  .then(r => (r.ok ? r.text() : "Quick content not found for this topic."))
                  .then(quickText => {
                    quickText = quickText.replace(/\]\(images\//g, `](${basePathQuick}images/`);
                    quickText = quickText.replace(/src="images\//g, `src="${basePathQuick}images/`);
                    const quickQc = generateQuickCheckQuestionsFromMarkdown(label, quickText, `M_${mapped.id}`);
                    setMindmapTopicContent(quickText);
                    setMindmapQuickChecks(prev => ({ ...prev, quick: quickQc }));
                    setMindmapTopicLoading(false);
                    const entry = topicNotesCache.get(cacheKey) || { quick: quickText };
                    entry.quick = quickText;
                    entry.quickQc = quickQc;
                    topicNotesCache.set(cacheKey, entry);
                  })
                  .catch(e => {
                    console.error(e);
                    setMindmapTopicLoading(false);
                  });

                fetch(basePathDetailed + detailedFilename)
                  .then(r => (r.ok ? r.text() : "Detailed content not found for this topic."))
                  .then(detailedText => {
                    detailedText = detailedText.replace(/\]\(images\//g, `](${basePathDetailed}images/`);
                    detailedText = detailedText.replace(/src="images\//g, `src="${basePathDetailed}images/`);
                    const detailedQc = generateQuickCheckQuestionsFromMarkdown(label, detailedText, `M_${mapped.id}`);
                    setMindmapDetailedContent(detailedText);
                    setMindmapQuickChecks(prev => ({ ...prev, detailed: detailedQc }));
                    const entry = topicNotesCache.get(cacheKey) || { quick: '' };
                    entry.detailed = detailedText;
                    entry.detailedQc = detailedQc;
                    topicNotesCache.set(cacheKey, entry);
                  })
                  .catch(console.error);
              } catch (e) {
                console.error(e);
                setMindmapTopicLoading(false);
              }
            }
            return;
          }

          // ── Dynamic / Multi-Tenant topic path (Works for all subjects) ───────
          const match =
            effectiveTopics.find((t: any) => t.label.toLowerCase() === lowerLabel) ||
            ({ label, topicNum: Math.max(1, effectiveTopics.findIndex((t) => t.label.toLowerCase().includes(lowerLabel)) + 1) } as MindmapTopic);

          if (action === 'video') {
            setMindmapInlineType('video');
            const mappedMedia = MEDIA_MAPPING[lowerLabel];
            const angrauYtMap: Record<number, string> = {
              1: 'Ioa25iYy53g',
              2: '7TyeiuOEVBo',
              3: 'UMJFfCFFF4M',
              4: 'elWWuKv5b9Q',
            };
            const isAngrauEnto = subjectId.includes('ento');
            const ytId = mappedMedia?.ytId || (isAngrauEnto ? angrauYtMap[chapterNumber] : undefined) || 'EQl-5nKXme0';
            setMindmapMediaUrl(`https://www.youtube.com/embed/${ytId}?autoplay=1`);
            setMindmapTopicOpen(true);
            return;
          }

          if (action === 'podcast') {
            const mcIdx = effectiveTopics.indexOf(match);
            const targetIdx = mcIdx >= 0 ? mcIdx : 0;
            setMindmapTopicOpen(false);
            setPodcastTargetTrack('mc');
            setPodcastTargetMcIndex(targetIdx);
            setPodcastAutoPlay(true);
            setPodcastPlayTrigger(Date.now());
            setActiveTool('podcasts');
            return;
          }

          // Default: read (quick + detailed + quick checks)
          setMindmapInlineType('text');
          if (!preserveTab) setMindmapInlineTab('quick');
          setMindmapTopicOpen(true);

          const normLevel = ['beginner', 'intermediate', 'advanced'].includes(targetPersona)
            ? targetPersona
            : 'intermediate';
          const topicNum = (match as any).topicNum ?? (effectiveTopics.indexOf(match) + 1);
          const cacheKey = `${subjectId}_${chapterNumber}_${topicNum}_${normLevel}`;
          const cached = topicNotesCache.get(cacheKey);

          if (cached && cached.quick && cached.quickQc && cached.QuickQcLoaded) {
            setMindmapTopicContent(cached.quick);
            setMindmapDetailedContent(cached.detailed || cached.quick);
            setMindmapQuickChecks({
              quick: cached.quickQc,
              detailed: cached.detailedQc || cached.quickQc,
            });
            setMindmapTopicLoading(false);
            return;
          }

          setMindmapTopicLoading(true);
          if (!preserveTab) {
            setMindmapTopicContent(null);
            setMindmapDetailedContent(null);
          }

          try {
            const chDir = `chapter_${String(chapterNumber).padStart(2, '0')}`;
            const subBase = getSubjectBaseUrl(subjectId);

            const fetchSafeMd = async (url: string) => {
              try {
                const res = await fetch(url);
                const ct = res.headers.get('content-type') || '';
                if (!res.ok || ct.includes('text/html')) return '';
                const txt = await res.text();
                if (txt.trim().startsWith('<!DOCTYPE') || txt.trim().startsWith('<html') || txt.includes('<script type="module"') || txt.startsWith('<script')) return '';
                return txt;
              } catch { return ''; }
            };

            const [secQuick, secDetailed] = await Promise.all([
              getSectionizedReadData(subjectId, chapterNumber, 'quick', normLevel as DifficultyLevel),
              getSectionizedReadData(subjectId, chapterNumber, 'detailed', normLevel as DifficultyLevel),
            ]);

            const foundSec =
              secQuick?.sections.find((s) => s.sectionNumber === topicNum) ||
              secQuick?.sections.find((s) => s.title.toLowerCase().includes(lowerLabel)) ||
              secQuick?.sections[topicNum - 1];
            const foundDet =
              secDetailed?.sections.find((s) => s.sectionNumber === topicNum) ||
              secDetailed?.sections.find((s) => s.title.toLowerCase().includes(lowerLabel)) ||
              secDetailed?.sections[topicNum - 1];

            let quickText = foundSec?.content || '';
            if (!quickText) {
              const quickSigned =
                resolveAssetUrl(subjectId, chapterNumber, `learn/topics/quick/topic_${topicNum}.md`) ||
                resolveAssetUrl(subjectId, chapterNumber, `learn/topics/topic_${topicNum}/${normLevel}.md`);
              quickText = await fetchSafeMd(quickSigned || `${subBase}/${chDir}/learn/topics/quick/topic_${topicNum}.md`);
              if (!quickText) {
                quickText = await fetchSafeMd(`${subBase}/${chDir}/learn/topics/topic_${topicNum}/${normLevel}.md`);
              }
            }

            let detailedText = foundDet?.content || '';
            if (!detailedText) {
              const detailedSigned =
                resolveAssetUrl(subjectId, chapterNumber, `learn/topics/detailed/topic_${topicNum}.md`) ||
                resolveAssetUrl(subjectId, chapterNumber, `learn/topics/topic_${topicNum}/advanced.md`);
              detailedText = await fetchSafeMd(detailedSigned || `${subBase}/${chDir}/learn/topics/detailed/topic_${topicNum}.md`);
              if (!detailedText) {
                detailedText = await fetchSafeMd(`${subBase}/${chDir}/learn/topics/topic_${topicNum}/advanced.md`);
              }
            }

            const finalQuick = quickText || `Summary content for ${match.label}`;
            const finalDetailed = detailedText || finalQuick || `Detailed notes for ${match.label}`;

            const quickQc =
              foundSec?.quickChecks && foundSec.quickChecks.length > 0
                ? foundSec.quickChecks
                : generateQuickCheckQuestionsFromMarkdown(match.label, finalQuick, `M${topicNum}`);
            const detailedQc =
              foundDet?.quickChecks && foundDet.quickChecks.length > 0
                ? foundDet.quickChecks
                : generateQuickCheckQuestionsFromMarkdown(match.label, finalDetailed, `M${topicNum}`);

            setMindmapTopicContent(finalQuick);
            setMindmapDetailedContent(finalDetailed);
            setMindmapQuickChecks({ quick: quickQc, detailed: detailedQc });
            topicNotesCache.set(cacheKey, {
              quick: finalQuick,
              detailed: finalDetailed,
              quickQc,
              detailedQc,
              ...({ QuickQcLoaded: true } as any),
            });
          } catch (e) {
            console.error('Dynamic mindmap topic fetch error', e);
            const fallbackMd = `Content for ${match.label}`;
            setMindmapTopicContent(fallbackMd);
            setMindmapQuickChecks({
              quick: generateQuickCheckQuestionsFromMarkdown(match.label, fallbackMd, `M${topicNum}`),
              detailed: generateQuickCheckQuestionsFromMarkdown(match.label, fallbackMd, `M${topicNum}`),
            });
          } finally {
            setMindmapTopicLoading(false);
          }
        };

        const chStudyKey = `${subjectId}_${chapterNumber}`;
        const markMmBranchStudied = (branchLabel: string) => {
          if (!branchLabel) return;
          setMmStudiedBranches((prev) => {
            const existing = prev[chStudyKey] || [];
            if (existing.some((x) => x.toLowerCase() === branchLabel.toLowerCase())) return prev;
            const next = { ...prev, [chStudyKey]: [...existing, branchLabel] };
            try {
              cloudStorage.setItem('sv_mm_studied_v2', JSON.stringify(next));
            } catch {
              // ignore storage errors
            }
            return next;
          });
        };

        const handleTopicClick = (label: string, action?: 'read' | 'podcast' | 'video') => {
          setMmSelectedBranch(label);
          markMmBranchStudied(label);
          return loadMindmapTopicForPersona(label, persona, action, false);
        };

        // Compute next/prev topic for inline navigation (Multi-Tenant)
        const allTopicLabels: string[] = isNebBiologyChap6
          ? Object.keys(mmIcons).filter((k) => k !== 'ANIMAL TISSUE')
          : effectiveTopics.map((t) => t.label);
        const currentTopicIdx = allTopicLabels.findIndex(
          (l) => l.toLowerCase() === (mindmapTopicTitle ?? '').toLowerCase()
        );
        const prevTopicLabel = currentTopicIdx > 0 ? allTopicLabels[currentTopicIdx - 1] : null;
        const nextTopicLabel = currentTopicIdx >= 0 && currentTopicIdx < allTopicLabels.length - 1
          ? allTopicLabels[currentTopicIdx + 1]
          : null;

        const activeMmMarkdown = (
          (mindmapInlineTab === 'quick' ? mindmapTopicContent : mindmapDetailedContent) || ''
        ).replace(/^#\s+[^\n]+(\r?\n)+/, '');
        const activeMmReadMins = estimateReadingTime(activeMmMarkdown);
        const rawMmQcList =
          mindmapInlineTab === 'quick' ? mindmapQuickChecks.quick : mindmapQuickChecks.detailed;
        const activeMmQcList =
          rawMmQcList && rawMmQcList.length > 0
            ? rawMmQcList
            : activeMmMarkdown
            ? generateQuickCheckQuestionsFromMarkdown(
                mindmapTopicTitle || 'Topic Overview',
                activeMmMarkdown,
                `M${currentTopicIdx >= 0 ? currentTopicIdx + 1 : 1}`
              )
            : [];
        const mmArtifactKey = `mm_topic_${subjectId}_${chapterNumber}_${mindmapTopicTitle || 'topic'}_${persona}_${mindmapInlineTab}`;
        const isMmQcDone = mmCompletedQuickChecks.has(mmArtifactKey);
        const mmSelectedKeys: Record<number, string> = {};
        for (let qIdx = 0; qIdx < activeMmQcList.length; qIdx++) {
          const val =
            mmQcAnswers[`${mmArtifactKey}_${qIdx}`] ||
            (qIdx === 0 ? mmQcAnswers[mmArtifactKey] : undefined);
          if (val) mmSelectedKeys[qIdx] = val;
        }
        const answeredInMmTopic = Object.keys(mmSelectedKeys).length;

        // ── Contextual Branch Inspector metadata for MLRIT & ANGRAU ──
        const MM_BRANCH_SUBTOPICS: Record<
          string,
          { podcastMins: number; subTopics: { code: string; title: string; duration: string; mins: number }[] }
        > = {
          // MLRIT — DBMS Unit 1 (6 branches)
          'database fundamentals & engine architecture': {
            podcastMins: 6,
            subTopics: [
              { code: '1.1', title: 'File-System vs DBMS & ACID Motivation', duration: '8m', mins: 8 },
              { code: '1.2', title: 'ANSI-SPARC Three-Schema Architecture & Data Independence', duration: '12m', mins: 12 },
              { code: '1.3', title: 'Storage Manager, Query Processor & Transaction Engine', duration: '6m', mins: 6 },
            ],
          },
          'conceptual database design & er modeling': {
            podcastMins: 6,
            subTopics: [
              { code: '2.1', title: 'Entities, Attributes (Simple, Composite, Derived) & Domains', duration: '7m', mins: 7 },
              { code: '2.2', title: 'Relationships, Degree, Role Names & Recursive Links', duration: '9m', mins: 9 },
              { code: '2.3', title: 'Mapping Cardinalities (1:1, 1:N, M:N) & Participation Constraints', duration: '8m', mins: 8 },
            ],
          },
          'advanced er & extended er (eer) mechanisms': {
            podcastMins: 7,
            subTopics: [
              { code: '3.1', title: 'Weak Entities, Identifying Relationships & Partial Keys', duration: '8m', mins: 8 },
              { code: '3.2', title: 'Specialization, Generalization & Attribute Inheritance', duration: '10m', mins: 10 },
              { code: '3.3', title: 'Disjoint/Overlapping Constraints & Aggregation', duration: '7m', mins: 7 },
            ],
          },
          'relational model foundations & integrity constraints': {
            podcastMins: 6,
            subTopics: [
              { code: '4.1', title: 'Relations, Tuples, Domains & Mathematical Set Semantics', duration: '7m', mins: 7 },
              { code: '4.2', title: 'Superkeys, Candidate Keys, Primary & Foreign Keys', duration: '9m', mins: 9 },
              { code: '4.3', title: 'Domain, Entity & Referential Integrity Rules', duration: '8m', mins: 8 },
            ],
          },
          'logical database design (er-to-relational translation)': {
            podcastMins: 7,
            subTopics: [
              { code: '5.1', title: 'Strong & Weak Entity Translation to Relational Schemas', duration: '8m', mins: 8 },
              { code: '5.2', title: '1:1, 1:N & M:N Relationship Mapping Strategies', duration: '10m', mins: 10 },
              { code: '5.3', title: 'Multivalued Attributes & EER Hierarchy Translation', duration: '8m', mins: 8 },
            ],
          },
          'relational querying, views & schema evolution': {
            podcastMins: 6,
            subTopics: [
              { code: '6.1', title: 'Relational Algebra (σ, π, ∪, −, ×, ⋈, ÷) & Calculus', duration: '11m', mins: 11 },
              { code: '6.2', title: 'SQL DDL, Constraints & Schema Modification', duration: '8m', mins: 8 },
              { code: '6.3', title: 'Virtual Views, Updatability & Logical Security', duration: '7m', mins: 7 },
            ],
          },

          // ANGRAU — Entomology Chapter 1: History of Entomology in India
          'ancient references & etymology': {
            podcastMins: 5,
            subTopics: [
              { code: '1.1', title: 'Etymology of Entomon & Logos and Arthropoda Roots', duration: '6m', mins: 6 },
              { code: '1.2', title: 'Vedic, Ramayana & Mahabharata References to Insects', duration: '7m', mins: 7 },
              { code: '1.3', title: 'Ancient Classification (Ushma-ja, Anda-ja) & Early Silkworm/Bee Lore', duration: '7m', mins: 7 },
            ],
          },
          'early entomology in india': {
            podcastMins: 6,
            subTopics: [
              { code: '2.1', title: '18th Century Pioneers: Koenig, Fabricius & Linnaeus (1758)', duration: '8m', mins: 8 },
              { code: '2.2', title: 'Medical & Natural History Contributions (Ronald Ross, Kerr, Roxburgh)', duration: '8m', mins: 8 },
              { code: '2.3', title: 'Indian Museum (1875), BNHS (1883) & Fauna of British India', duration: '7m', mins: 7 },
            ],
          },
          'imperial entomologists': {
            podcastMins: 6,
            subTopics: [
              { code: '3.1', title: 'Lionel de Niceville (1901) & H. Maxwell-Lefroy (Indian Insect Life)', duration: '8m', mins: 8 },
              { code: '3.2', title: 'T.B. Fletcher & Early Pusa Research Milestones', duration: '7m', mins: 7 },
              { code: '3.3', title: 'H.S. Pruthi, Hem Singh & Post-Independence Transition', duration: '7m', mins: 7 },
            ],
          },
          'first government entomologists': {
            podcastMins: 6,
            subTopics: [
              { code: '4.1', title: 'T.V. Ramakrishna Ayyar & Handbook of Economic Entomology', duration: '8m', mins: 8 },
              { code: '4.2', title: 'State Entomologists of Madras, Punjab, Mysore & Coimbatore', duration: '7m', mins: 7 },
              { code: '4.3', title: '1914 Destructive Insects and Pests Act & Early Quarantine', duration: '6m', mins: 6 },
            ],
          },
          'major institutions & milestones': {
            podcastMins: 6,
            subTopics: [
              { code: '5.1', title: 'IARI Pusa (1905), FRI Dehradun, ZSI (1916) & ILRI Ranchi', duration: '8m', mins: 8 },
              { code: '5.2', title: 'ESI (1938), LWO (1939), DPPQS (1946) & NBAIR Bengaluru', duration: '9m', mins: 9 },
              { code: '5.3', title: 'NCIPM, Insecticides Act (1968) & Modern Agricultural Universities', duration: '7m', mins: 7 },
            ],
          },

          // ANGRAU — Entomology Chapter 2: Factors for Insect Abundance
          'structural perfections': {
            podcastMins: 6,
            subTopics: [
              { code: '1.1', title: 'Chitinous Exoskeleton, Cuticular Wax Layer & Desiccation Resistance', duration: '8m', mins: 8 },
              { code: '1.2', title: 'Functional Wings, Hexapod Locomotion & Dispersal Advantage', duration: '7m', mins: 7 },
              { code: '1.3', title: 'Small Body Size, Tracheal Respiration & Compound Eyes', duration: '7m', mins: 7 },
            ],
          },
          'mechanism of reproduction': {
            podcastMins: 6,
            subTopics: [
              { code: '2.1', title: 'High Fecundity (Queen Termite & Honeybee) & Short Life Cycle', duration: '8m', mins: 8 },
              { code: '2.2', title: 'Parthenogenesis, Viviparity, Paedogenesis & Polyembryony', duration: '8m', mins: 8 },
              { code: '2.3', title: 'Sperm Storage (Spermatheca) & Controlled Fertilization', duration: '6m', mins: 6 },
            ],
          },
          'developmental characteristics': {
            podcastMins: 5,
            subTopics: [
              { code: '3.1', title: 'Complete Metamorphosis (Holometaboly) & Niche Partitioning', duration: '8m', mins: 8 },
              { code: '3.2', title: 'Larval Feeding Stage vs Adult Reproductive/Dispersal Stage', duration: '7m', mins: 7 },
              { code: '3.3', title: 'Diapause, Quiescence & Arrested Development in Harsh Seasons', duration: '7m', mins: 7 },
            ],
          },
          'protective adaptations & specificity': {
            podcastMins: 6,
            subTopics: [
              { code: '4.1', title: 'Crypsis, Camouflage, Batesian & Müllerian Mimicry', duration: '8m', mins: 8 },
              { code: '4.2', title: 'Aposematism, Chemical Defenses & Reflex Bleeding', duration: '7m', mins: 7 },
              { code: '4.3', title: 'Host-Plant Specificity & Co-Evolutionary Adaptations', duration: '7m', mins: 7 },
            ],
          },
          'numbers & ecological dominance': {
            podcastMins: 5,
            subTopics: [
              { code: '5.1', title: 'Global Species Share (>70% of All Known Animal Species)', duration: '6m', mins: 6 },
              { code: '5.2', title: 'Dominant Orders: Coleoptera, Lepidoptera, Diptera & Hymenoptera', duration: '8m', mins: 8 },
              { code: '5.3', title: 'Ecosystem Services vs Agricultural Pest Impact', duration: '6m', mins: 6 },
            ],
          },

          // ANGRAU — Entomology Chapter 3: Role of Insects in Pollination
          'importance & types': {
            podcastMins: 5,
            subTopics: [
              { code: '1.1', title: 'Self-Pollination (Autogamy/Geitonogamy) vs Cross-Pollination (Xenogamy)', duration: '7m', mins: 7 },
              { code: '1.2', title: 'Entomophily vs Anemophily & Hydrophily', duration: '7m', mins: 7 },
              { code: '1.3', title: 'Economic Value of Insect Pollination in Crop Yield & Quality', duration: '7m', mins: 7 },
            ],
          },
          'mechanism of pollination': {
            podcastMins: 6,
            subTopics: [
              { code: '2.1', title: 'Floral Rewards (Nectar, Pollen, Oils) & Visual/Olfactory Cues', duration: '8m', mins: 8 },
              { code: '2.2', title: 'Pollen Adhesion, Scopa/Corbicula & Stigma Transfer Mechanics', duration: '8m', mins: 8 },
              { code: '2.3', title: 'Floral Constancy & Co-adapted Flower-Pollinator Morphology', duration: '7m', mins: 7 },
            ],
          },
          'insect orders involved': {
            podcastMins: 6,
            subTopics: [
              { code: '3.1', title: 'Hymenoptera: Honeybees, Bumblebees, Solitary Bees & Fig Wasps', duration: '9m', mins: 9 },
              { code: '3.2', title: 'Diptera (Syrphid Hoverflies, Midges) & Lepidoptera (Butterflies, Moths)', duration: '8m', mins: 8 },
              { code: '3.3', title: 'Coleoptera (Cantharophily — Oil Palm Weevil) & Thysanoptera', duration: '7m', mins: 7 },
            ],
          },
          'adaptations & crop examples': {
            podcastMins: 6,
            subTopics: [
              { code: '4.1', title: 'Melittophily, Psychophily, Phalaenophily, Myophily & Cantharophily', duration: '9m', mins: 9 },
              { code: '4.2', title: 'Obligate Mutualisms: Fig–Blastophaga & Yucca–Tegeticula', duration: '8m', mins: 8 },
              { code: '4.3', title: 'Managed Bee Colonies per Hectare in Horticultural & Oilseed Crops', duration: '7m', mins: 7 },
            ],
          },

          // ANGRAU — Entomology Chapter 4: Apiculture (Bee Keeping)
          'honeybee species': {
            podcastMins: 6,
            subTopics: [
              { code: '1.1', title: 'Rock Bee (Apis dorsata) & Little Bee (Apis florea) — Wild Open-Nesting', duration: '8m', mins: 8 },
              { code: '1.2', title: 'Indian Hive Bee (Apis cerana indica) & Italian Bee (Apis mellifera)', duration: '8m', mins: 8 },
              { code: '1.3', title: 'Stingless/Dammer Bee (Tetragonula iridipennis) & Species Comparison', duration: '7m', mins: 7 },
            ],
          },
          'castes & structural adaptations': {
            podcastMins: 6,
            subTopics: [
              { code: '2.1', title: 'Queen, Worker & Drone Castes: Diploid vs Haploid Development', duration: '8m', mins: 8 },
              { code: '2.2', title: 'Age-Related Polyethism (Nurse, Builder, Guard & Forager Roles)', duration: '8m', mins: 8 },
              { code: '2.3', title: 'Pollen Basket (Corbicula), Proboscis, Wax Glands & Barbed Sting', duration: '8m', mins: 8 },
            ],
          },
          'beehive & appliances': {
            podcastMins: 6,
            subTopics: [
              { code: '3.1', title: 'Langstroth, Newton & ISI Movable-Frame Hive Architecture', duration: '8m', mins: 8 },
              { code: '3.2', title: 'Brood Chamber, Super Chamber, Queen Excluder & Bee Space Principle', duration: '8m', mins: 8 },
              { code: '3.3', title: 'Comb Foundation Sheet, Smoker, Hive Tool & Centrifugal Extractor', duration: '7m', mins: 7 },
            ],
          },
          'foraging behaviour & communication': {
            podcastMins: 6,
            subTopics: [
              { code: '4.1', title: 'Nectar, Pollen, Propolis & Water Foraging Range & Flight Activity', duration: '7m', mins: 7 },
              { code: '4.2', title: 'Karl von Frisch Dance Language: Round Dance (<50m) & Waggle Dance', duration: '9m', mins: 9 },
              { code: '4.3', title: 'Queen Substance (9-ODA) & Alarm Pheromone Regulation', duration: '7m', mins: 7 },
            ],
          },
          'seasonal management': {
            podcastMins: 6,
            subTopics: [
              { code: '5.1', title: 'Spring & Honey-Flow Management (Supering & Swarm Prevention)', duration: '8m', mins: 8 },
              { code: '5.2', title: 'Dearth-Period Sugar Feeding, Monsoon & Winter Insulation', duration: '7m', mins: 7 },
              { code: '5.3', title: 'Robbing, Absconding Control & Uniting Weak Colonies', duration: '7m', mins: 7 },
            ],
          },
          'enemies, diseases & bee products': {
            podcastMins: 7,
            subTopics: [
              { code: '6.1', title: 'Greater/Lesser Wax Moth, Varroa/Tracheal Mites, Wasps & Bee-Eaters', duration: '8m', mins: 8 },
              { code: '6.2', title: 'American/European Foulbrood, Thai Sacbrood Virus & Nosema', duration: '8m', mins: 8 },
              { code: '6.3', title: 'Honey Composition, Beeswax, Royal Jelly, Propolis & Bee Venom', duration: '8m', mins: 8 },
            ],
          },
        };

        const resolvedSelectedCandidate = mmSelectedBranch
          ? childToParentBranch[mmSelectedBranch.toLowerCase().trim()] || mmSelectedBranch
          : null;
        const matchedTopicFromList = resolvedSelectedCandidate
          ? allTopicLabels.find(
              (l) =>
                l.toLowerCase().trim() === resolvedSelectedCandidate.toLowerCase().trim() ||
                l.toLowerCase().includes(resolvedSelectedCandidate.toLowerCase().trim()) ||
                resolvedSelectedCandidate.toLowerCase().includes(l.toLowerCase().trim())
            )
          : null;
        const activeSelectedBranch =
          matchedTopicFromList || resolvedSelectedCandidate || allTopicLabels[0] || 'Overview';
        const selectedBranchIdx = Math.max(
          0,
          allTopicLabels.findIndex((l) => l.toLowerCase() === activeSelectedBranch.toLowerCase())
        );
        const branchMeta =
          MM_BRANCH_SUBTOPICS[activeSelectedBranch.toLowerCase().trim()] ||
          (dynamicTreeSubtopics[activeSelectedBranch.toLowerCase().trim()]
            ? {
                podcastMins: 6,
                subTopics: dynamicTreeSubtopics[activeSelectedBranch.toLowerCase().trim()],
              }
            : {
                podcastMins: 6,
                subTopics: [
                  {
                    code: `${selectedBranchIdx + 1}.1`,
                    title: `Core Concepts & Foundations of ${activeSelectedBranch}`,
                    duration: '8m',
                    mins: 8,
                  },
                  {
                    code: `${selectedBranchIdx + 1}.2`,
                    title: `Mechanisms, Classification & Structural Principles`,
                    duration: '10m',
                    mins: 10,
                  },
                  {
                    code: `${selectedBranchIdx + 1}.3`,
                    title: `Applied Examples & Exam-Focused Synthesis`,
                    duration: '7m',
                    mins: 7,
                  },
                ],
              });
        const totalBranchMins = branchMeta.subTopics.reduce((acc, st) => acc + st.mins, 0);
        const chapterStudiedList = mmStudiedBranches[chStudyKey] || [];
        const chapterStudiedCount = allTopicLabels.filter((lbl) =>
          chapterStudiedList.some((s) => s.toLowerCase() === lbl.toLowerCase())
        ).length;
        const cleanChapterLabel = (chapterName || '')
          .replace(/^(Chapter|Unit)\s*\d+\s*[:·\-–—]\s*/i, '')
          .trim();

        return (
          <div
            className="mindmap-container"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0px',
              height: '100%',
              width: '100%',
              background: mindmapTopicOpen ? 'transparent' : '#FAF8F3',
            }}
          >
            {/* Map + Inspector Split View — hidden while a topic is open so only content fills the view */}
            {!mindmapTopicOpen && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  width: '100%',
                  minHeight: 0,
                  background: '#FAF8F3',
                }}
              >
                {/* ── Top Sub-Header Bar ── */}
                <div
                  style={{
                    height: '50px',
                    padding: '0 24px',
                    background: '#FAF8F3',
                    borderBottom: '1px solid #EAE4D7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexShrink: 0,
                    gap: '16px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: '13.5px',
                      color: '#7A827C',
                      fontWeight: 500,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    <span>Mindmaps</span>
                    <span style={{ margin: '0 9px', color: '#B4B8B2' }}>›</span>
                    <span>{subjectName}</span>
                    <span style={{ margin: '0 9px', color: '#B4B8B2' }}>›</span>
                    <span style={{ color: '#1E2822', fontWeight: 700 }}>
                      {getChapterPrefix(subjectId)} {chapterNumber} · {cleanChapterLabel}
                    </span>
                  </div>

                  {/* Studied progress pill */}
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '7px',
                      padding: '5px 13px',
                      borderRadius: '999px',
                      background: '#FBF4EE',
                      border: '1px solid #EBD5C3',
                      color: '#B67346',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      flexShrink: 0,
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#BD7D52" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="4" />
                      <path d="M12 2v2" />
                      <path d="M12 20v2" />
                      <path d="m4.93 4.93 1.41 1.41" />
                      <path d="m17.66 17.66 1.41 1.41" />
                      <path d="M2 12h2" />
                      <path d="M20 12h2" />
                      <path d="m6.34 17.66-1.41 1.41" />
                      <path d="m19.07 4.93-1.41 1.41" />
                    </svg>
                    <span>
                      {chapterStudiedCount} of {allTopicLabels.length || 1} branches studied
                    </span>
                  </div>
                </div>

                {/* ── Main Split Area: Left MindMap Canvas + Right Branch Inspector ── */}
                <div
                  style={{
                    flex: 1,
                    minHeight: 0,
                    display: 'flex',
                    gap: '16px',
                    padding: '14px 20px 18px 20px',
                    overflow: 'hidden',
                  }}
                >
                  {/* Left: MindMap Canvas */}
                  <div
                    style={{
                      flex: 1,
                      minWidth: 0,
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <MindMapView
                      content={mermaidContent}
                      onTopicClick={handleTopicClick}
                      nodeIcons={mmIcons}
                      selectedTopic={null}
                      studiedTopics={[]}
                      onSelectTopic={(lbl, depth, parentLbl) => {
                        if (isNebBiologyChap6 && MINDMAP_MAPPING[lbl.toLowerCase().trim()]) {
                          handleTopicClick(lbl, 'read');
                          return;
                        }
                        const candidate =
                          (parentLbl && depth && depth >= 2 ? parentLbl : null) ||
                          childToParentBranch[lbl.toLowerCase().trim()] ||
                          lbl;
                        const canonical =
                          allTopicLabels.find(
                            (l) =>
                              l.toLowerCase().trim() === candidate.toLowerCase().trim() ||
                              l.toLowerCase().includes(candidate.toLowerCase().trim()) ||
                              candidate.toLowerCase().includes(l.toLowerCase().trim())
                          ) || candidate;
                        handleTopicClick(canonical, 'read');
                      }}
                    />
                  </div>

                  {/* Right: Contextual Branch Inspector Card */}
                  <aside
                    style={{
                      width: '375px',
                      flexShrink: 0,
                      height: '100%',
                      background: '#FFFFFF',
                      border: '1px solid #E6E0D4',
                      borderRadius: '16px',
                      padding: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '14px',
                      overflowY: 'auto',
                      boxShadow: '0 2px 10px rgba(30, 40, 34, 0.03)',
                    }}
                  >
                    {/* Pill badge */}
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        alignSelf: 'flex-start',
                        padding: '4px 10px',
                        borderRadius: '999px',
                        background: '#E8F0EB',
                        color: '#365343',
                        fontSize: '10.5px',
                        fontWeight: 800,
                        letterSpacing: '0.07em',
                        textTransform: 'uppercase',
                      }}
                    >
                      BRANCH · {getChapterPrefix(subjectId).toUpperCase()} {chapterNumber}
                    </div>

                    {/* Branch Title */}
                    <h2
                      style={{
                        margin: 0,
                        fontFamily: "'Fraunces', 'Georgia', serif",
                        fontSize: '20px',
                        fontWeight: 600,
                        color: '#1E2822',
                        lineHeight: 1.26,
                        letterSpacing: '-0.01em',
                      }}
                    >
                      {activeSelectedBranch}
                    </h2>

                    {/* Subtitle */}
                    <div
                      style={{
                        fontSize: '12.5px',
                        color: '#7A827C',
                        fontWeight: 500,
                        marginTop: '-6px',
                      }}
                    >
                      {branchMeta.subTopics.length} sub-topics · ~{totalBranchMins} min of study material
                    </div>

                    {/* Sub-Topics List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '2px' }}>
                      <div
                        style={{
                          fontSize: '10.5px',
                          fontWeight: 800,
                          letterSpacing: '0.08em',
                          color: '#848C86',
                          textTransform: 'uppercase',
                        }}
                      >
                        SUB-TOPICS
                      </div>

                      {branchMeta.subTopics.map((st) => (
                        <button
                          key={st.code}
                          type="button"
                          onClick={() => handleTopicClick(activeSelectedBranch, 'read')}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '11px 12px',
                            borderRadius: '11px',
                            background: '#F6F3EC',
                            border: '1px solid #EAE4D7',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.15s ease',
                            width: '100%',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#EFECE2';
                            e.currentTarget.style.borderColor = '#DCD4C4';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#F6F3EC';
                            e.currentTarget.style.borderColor = '#EAE4D7';
                          }}
                        >
                          <span
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '8px',
                              background: '#FFFFFF',
                              border: '1px solid #E5DFD2',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '11.5px',
                              fontWeight: 700,
                              color: '#5C6660',
                              flexShrink: 0,
                            }}
                          >
                            {st.code}
                          </span>
                          <span
                            style={{
                              flex: 1,
                              fontSize: '13px',
                              fontWeight: 600,
                              color: '#1E2822',
                              lineHeight: 1.35,
                            }}
                          >
                            {st.title}
                          </span>
                          <span
                            style={{
                              fontSize: '12px',
                              fontWeight: 600,
                              color: '#848C86',
                              flexShrink: 0,
                            }}
                          >
                            {st.duration}
                          </span>
                        </button>
                      ))}
                    </div>

                    {/* 4-Column Multi-Modal Action Grid */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: '8px',
                        marginTop: '2px',
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => handleTopicClick(activeSelectedBranch, 'read')}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          padding: '11px 6px',
                          borderRadius: '11px',
                          background: '#FFFFFF',
                          border: '1px solid #E5DFD2',
                          cursor: 'pointer',
                          color: '#1E2822',
                          fontSize: '12px',
                          fontWeight: 600,
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#F6F3EC';
                          e.currentTarget.style.borderColor = '#D5CEC0';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#FFFFFF';
                          e.currentTarget.style.borderColor = '#E5DFD2';
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#365343" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                        </svg>
                        <span>Read</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleTopicClick(activeSelectedBranch, 'podcast')}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          padding: '11px 6px',
                          borderRadius: '11px',
                          background: '#FFFFFF',
                          border: '1px solid #E5DFD2',
                          cursor: 'pointer',
                          color: '#1E2822',
                          fontSize: '12px',
                          fontWeight: 600,
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#F6F3EC';
                          e.currentTarget.style.borderColor = '#D5CEC0';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#FFFFFF';
                          e.currentTarget.style.borderColor = '#E5DFD2';
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#365343" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
                          <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
                        </svg>
                        <span>Listen</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleTopicClick(activeSelectedBranch, 'video')}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          padding: '11px 6px',
                          borderRadius: '11px',
                          background: '#FFFFFF',
                          border: '1px solid #E5DFD2',
                          cursor: 'pointer',
                          color: '#1E2822',
                          fontSize: '12px',
                          fontWeight: 600,
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#F6F3EC';
                          e.currentTarget.style.borderColor = '#D5CEC0';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#FFFFFF';
                          e.currentTarget.style.borderColor = '#E5DFD2';
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#365343" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                        <span>Watch</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          markMmBranchStudied(activeSelectedBranch);
                          setIsAskOpen(true);
                        }}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          padding: '11px 6px',
                          borderRadius: '11px',
                          background: '#FFFFFF',
                          border: '1px solid #E5DFD2',
                          cursor: 'pointer',
                          color: '#1E2822',
                          fontSize: '12px',
                          fontWeight: 600,
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#F6F3EC';
                          e.currentTarget.style.borderColor = '#D5CEC0';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#FFFFFF';
                          e.currentTarget.style.borderColor = '#E5DFD2';
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#365343" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                        <span>Ask me</span>
                      </button>
                    </div>

                    {/* Context Podcast Card */}
                    <div
                      style={{
                        marginTop: 'auto',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px 14px',
                        borderRadius: '13px',
                        background: '#FBF5EE',
                        border: '1px solid #EBD5C3',
                      }}
                    >
                      <div
                        style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '50%',
                          background: '#FFFFFF',
                          border: '1px solid #EBD5C3',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#BD7D52" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
                          <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
                        </svg>
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: '13px',
                            fontWeight: 700,
                            color: '#1E2822',
                            lineHeight: 1.25,
                          }}
                        >
                          Context podcast
                        </div>
                        <div
                          style={{
                            fontSize: '11.5px',
                            color: '#7D766D',
                            lineHeight: 1.35,
                            marginTop: '2px',
                          }}
                        >
                          This branch explained on the go · {branchMeta.podcastMins} min
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleTopicClick(activeSelectedBranch, 'podcast')}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '8px 14px',
                          borderRadius: '999px',
                          background: '#BD7D52',
                          color: '#FFFFFF',
                          border: 'none',
                          fontSize: '12.5px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          flexShrink: 0,
                          boxShadow: '0 2px 6px rgba(189, 125, 82, 0.25)',
                          transition: 'background 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#A96B42';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#BD7D52';
                        }}
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="#FFFFFF" stroke="none">
                          <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                        <span>Play</span>
                      </button>
                    </div>
                  </aside>
                </div>
              </div>
            )}
            {/* Inline topic panel — shown below the map, no popup */}
            {mindmapTopicOpen && (
              <div className="mm-concept-view" style={{ marginTop: 0 }}>
                {/* Top bar */}
                <div
                  className="mm-concept-topbar"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '12px',
                    flexWrap: 'nowrap',
                    width: '100%',
                  }}
                >
                  {/* Left: prev */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, justifyContent: 'flex-start', minWidth: 0 }}>
                    {prevTopicLabel && (
                      <button
                        className="mm-next-topic-btn"
                        onClick={() => handleTopicClick(prevTopicLabel, mindmapInlineType === 'audio' ? 'podcast' : 'read')}
                        title={prevTopicLabel}
                        style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '280px' }}
                      >
                        ← Prev: {prevTopicLabel.length > 20 ? `${prevTopicLabel.slice(0, 18)}…` : prevTopicLabel}
                      </button>
                    )}
                  </div>

                  {/* Center: Mindmap button */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <button
                      className="mm-back-btn"
                      onClick={() => {
                        setMindmapTopicOpen(false);
                        setMindmapTopicTitle(null);
                        setMindmapInlineType('text');
                        setMindmapMediaUrl('');
                      }}
                    >
                      ← Mindmap
                    </button>
                  </div>

                  {/* Right: next */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, justifyContent: 'flex-end', minWidth: 0 }}>
                    {nextTopicLabel && (
                      <button
                        className="mm-next-topic-btn"
                        onClick={() => handleTopicClick(nextTopicLabel, mindmapInlineType === 'audio' ? 'podcast' : 'read')}
                        title={nextTopicLabel}
                        style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '280px' }}
                      >
                        Next: {nextTopicLabel.length > 20 ? `${nextTopicLabel.slice(0, 18)}…` : nextTopicLabel} →
                      </button>
                    )}
                  </div>
                </div>

                {/* Header row: Persona levels centered + Essentials / In-depth toggle button on the right */}
                {mindmapInlineType === 'text' && (
                  <div
                    style={{
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      minHeight: '48px',
                      padding: '4px 12px 6px',
                      boxSizing: 'border-box',
                    }}
                  >
                    {/* Left spacer to keep center aligned */}
                    <div style={{ flex: 1, minWidth: 0 }} />

                    {/* Center: persona levels (exact match with assessment & flashcards) */}
                    <div
                      className="sv-hdr-levels"
                      style={{
                        position: 'absolute',
                        left: '50%',
                        top: '50%',
                        transform: 'translate(-50%, -50%)',
                        display: 'flex',
                        gap: '8px',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10,
                      }}
                    >
                      {(['beginner', 'intermediate', 'advanced'] as const).map((lvl) => {
                        const isSelected = persona === lvl;
                        return (
                          <button
                            key={lvl}
                            id={`mm-studybar-level-${lvl}`}
                            type="button"
                            className={`sv-hdr-level-btn lvl-${lvl}${isSelected ? " active-lvl" : ""}`}
                            onClick={() => {
                              setPersona(lvl);
                              if (mindmapTopicTitle) {
                                loadMindmapTopicForPersona(mindmapTopicTitle, lvl, 'read', true);
                              }
                            }}
                            title={lvl.charAt(0).toUpperCase() + lvl.slice(1)}
                            style={{
                              width: '54px',
                              height: '54px',
                              borderRadius: '12px',
                              padding: 0,
                              border: isSelected ? '2.5px solid #2D473B' : '2.5px solid transparent',
                              background: isSelected ? '#FFFFFF' : 'transparent',
                              boxShadow: isSelected ? '0 3px 12px rgba(45, 71, 59, 0.2)' : 'none',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              boxSizing: 'border-box',
                              flexShrink: 0,
                              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                            }}
                          >
                            <img
                              src={`${import.meta.env.BASE_URL}personas/${lvl}.png`}
                              alt={lvl}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'contain',
                                borderRadius: '8px',
                                padding: '3px',
                                boxSizing: 'border-box',
                                filter: isSelected ? 'grayscale(0) opacity(1)' : 'grayscale(0.2) opacity(0.75)',
                                transform: isSelected ? 'scale(1.04)' : 'none',
                                transition: 'filter 0.2s ease, transform 0.2s ease',
                              }}
                            />
                          </button>
                        );
                      })}
                    </div>

                    {/* Right: toggle button for Essentials | In-depth */}
                    <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', zIndex: 11 }}>
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          background: '#E2E8F0',
                          padding: '3px',
                          borderRadius: '999px',
                          border: '1px solid #CBD5E1',
                          boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.06)',
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => setMindmapInlineTab('quick')}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 18px',
                            borderRadius: '999px',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            border: 'none',
                            background: mindmapInlineTab === 'quick' ? '#9CC0B4' : 'transparent',
                            color: mindmapInlineTab === 'quick' ? '#18221D' : '#64748b',
                            boxShadow: mindmapInlineTab === 'quick' ? '0 2px 8px rgba(156, 192, 180, 0.35)' : 'none',
                            transition: 'all 0.18s ease',
                          }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                          </svg>
                          Essentials
                        </button>
                        <button
                          type="button"
                          onClick={() => setMindmapInlineTab('detailed')}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 18px',
                            borderRadius: '999px',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            border: 'none',
                            background: mindmapInlineTab === 'detailed' ? '#9CC0B4' : 'transparent',
                            color: mindmapInlineTab === 'detailed' ? '#18221D' : '#64748b',
                            boxShadow: mindmapInlineTab === 'detailed' ? '0 2px 8px rgba(156, 192, 180, 0.35)' : 'none',
                            transition: 'all 0.18s ease',
                          }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                            <circle cx="12" cy="12" r="9" />
                            <path d="M12 8v4l2 2" />
                          </svg>
                          In-depth
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Content */}
                <div className="mm-concept-content" style={{ padding: 0 }}>
                  {mindmapInlineType === 'text' && (
                    mindmapTopicLoading && !mindmapTopicContent ? (
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '80px 20px',
                          gap: '16px',
                        }}
                      >
                        <div
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            border: '3px solid #E2E8F0',
                            borderTopColor: '#2563eb',
                            animation: 'spinnerRing 0.8s linear infinite',
                          }}
                        />
                        <span style={{ fontSize: '14px', color: '#64748B', fontWeight: 500 }}>
                          Loading topic notes...
                        </span>
                      </div>
                    ) : (
                      <div
                        className="markdown-container"
                        style={{
                          position: 'relative',
                          maxWidth: '1040px',
                          margin: '0 auto',
                          width: '100%',
                          padding: '24px 24px 48px',
                          boxSizing: 'border-box',
                        }}
                      >
                        {/* Mindmap Artifact Meta & Quick Check Badge Row (same properties as Read sections) */}
                        <div
                          style={{
                            display: 'flex',
                            gap: '8px',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            marginBottom: '16px',
                          }}
                        >
                          <span
                            style={{
                              background: '#f1f5f9',
                              color: '#334155',
                              borderRadius: '6px',
                              padding: '3px 9px',
                              fontSize: '12px',
                              fontWeight: 600,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            ⏱ {activeMmReadMins} min read
                          </span>

                          {activeMmQcList.length > 0 && (
                            <button
                              type="button"
                              onClick={() =>
                                mindmapQcRef.current?.scrollIntoView({
                                  behavior: 'smooth',
                                  block: 'start',
                                })
                              }
                              title="Skip to Quick Check"
                              style={{
                                background: isMmQcDone ? '#dcfce7' : '#f0fdf4',
                                color: '#15803d',
                                border: '1px solid #bbf7d0',
                                borderRadius: '6px',
                                padding: '3px 9px',
                                fontSize: '12px',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              {isMmQcDone
                                ? `✓ ${activeMmQcList.length} quick check${activeMmQcList.length > 1 ? 's' : ''} answered`
                                : answeredInMmTopic > 0
                                ? `✔ ${answeredInMmTopic}/${activeMmQcList.length} quick checks`
                                : `✔ ${activeMmQcList.length} quick check${activeMmQcList.length > 1 ? 's' : ''}`}
                            </button>
                          )}
                        </div>

                        <MarkdownView content={activeMmMarkdown} />

                        {activeMmQcList.length > 0 && (
                          <div
                            ref={mindmapQcRef}
                            style={{ scrollMarginTop: '20px', marginTop: '28px' }}
                          >
                            <QuickCheckModal
                              key={`mm-inline-qc-${mmArtifactKey}`}
                              isOpen={true}
                              question={activeMmQcList[0]}
                              questions={activeMmQcList}
                              currentSectionNumber={currentTopicIdx >= 0 ? currentTopicIdx + 1 : 1}
                              totalSections={allTopicLabels.length > 0 ? allTopicLabels.length : 1}
                              sectionTitle={mindmapTopicTitle || 'Topic Overview'}
                              nextSectionTitle={nextTopicLabel || undefined}
                              isPurpleTheme={false}
                              initialSelectedKey={mmSelectedKeys[0] || null}
                              initialSelectedKeys={mmSelectedKeys}
                              isCompleted={isMmQcDone}
                              onNextSection={
                                nextTopicLabel
                                  ? () => {
                                      markMmQuickCheckCompleted(mmArtifactKey);
                                      handleTopicClick(nextTopicLabel, 'read');
                                    }
                                  : undefined
                              }
                              onAnswerSubmitted={(_isCorrect, selectedKey, questionIndex, allAnswered) => {
                                markMmQuickCheckCompleted(
                                  mmArtifactKey,
                                  selectedKey,
                                  questionIndex,
                                  allAnswered || activeMmQcList.length === 1
                                );
                              }}
                            />
                          </div>
                        )}
                      </div>
                    )
                  )}
                  {mindmapInlineType === 'video' && (
                    <div style={{ width: '100%', aspectRatio: '16/9', borderRadius: '12px', overflow: 'hidden' }}>
                      <iframe
                        style={{ width: '100%', height: '100%', border: 'none' }}
                        src={mindmapMediaUrl}
                        title="Video"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  )}
                  {mindmapInlineType === 'audio' && (
                    // Full PodcastsView with text-synced transcript, jumping straight to the right episode
                    <PodcastsView
                      chapterName={chapterName}
                      subjectId={subjectId}
                      chapterNumber={chapterNumber}
                      persona={persona}
                      resumeTrack="mc"
                      initialMcIndex={mindmapMicrocastIdx}
                      mcOnly={true}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        );
      }
      case "flashcards":
        return Array.isArray(content) && content.length > 0 ? (
          <FlashcardsView
            key={`flashcards-${videoIndex}-${persona}`}
            cards={content}
            subjectId={subjectId}
            chapterNumber={chapterNumber}
            persona={persona}
            speakTrigger={flashcardSpeakTrigger}
            stopTrigger={flashcardStopTrigger}
            onSpeakingChange={setFlashcardIsSpeaking}
            onSelectTool={(tool) => setActiveTool(tool)}
            onLevelDownPersona={() => {
              if (persona === "advanced") setPersona("intermediate");
              else if (persona === "intermediate") setPersona("beginner");
            }}
            onLevelUpPersona={() => {
              if (persona === "beginner") setPersona("intermediate");
              else if (persona === "intermediate") setPersona("advanced");
              else setPersona("beginner");
            }}
            onFlashcardsCompleted={() => {
              setActiveTool("assessment", markToolHere("flashcards"));
            }}
          />
        ) : (
          <p>No flashcards available.</p>
        );
      case "revision_flashcards":
        return Array.isArray(content) && content.length > 0 ? (
          <FlashcardsView
            key={`revision-${videoIndex}-${persona}`}
            cards={content}
            subjectId={subjectId}
            chapterNumber={chapterNumber}
            persona={persona}
            isPurpleTheme={false}
            speakTrigger={flashcardSpeakTrigger}
            stopTrigger={flashcardStopTrigger}
            onSpeakingChange={setFlashcardIsSpeaking}
            onSelectTool={(tool) => setActiveTool(tool)}
            onLevelDownPersona={() => {
              if (persona === "advanced") setPersona("intermediate");
              else if (persona === "intermediate") setPersona("beginner");
            }}
            onLevelUpPersona={() => {
              if (persona === "beginner") setPersona("intermediate");
              else if (persona === "intermediate") setPersona("advanced");
              else setPersona("beginner");
            }}
            onFlashcardsCompleted={() => {
              const completed = markToolHere("revision_flashcards");
              // Last stop in a video's loop — move on to the next video, or to
              // the chapter exams once every video is done.
              if (isSegmented) advancePastVideoLoop();
              else setActiveTool("mocktest", completed);
            }}
          />
        ) : (
          <p>No revision flashcards available.</p>
        );
      case "deep_dive":
        return (
          <MarkdownView
            content={typeof content === "string" ? content : ""}
            isPurpleTheme={subjectId === "dbms" || subjectId.includes("dbms")}
          />
        );
      case "ask":
        return (
          <AskBotView
            chapterName={chapterName}
            subjectId={subjectId}
            chapterNumber={chapterNumber}
            difficulty={persona}
            className={className}
            subjectName={subjectName}
            onNavigateTool={(tool) => setActiveTool(tool as any)}
          />
        );
      case "podcasts":
        return (
          <PodcastsView
            key={`podcasts-${subjectId}-${chapterNumber}-${podcastTargetTrack ?? 'default'}-${podcastTargetMcIndex ?? 0}`}
            chapterName={chapterName}
            subjectName={subjectName}
            subjectId={subjectId}
            chapterNumber={chapterNumber}
            persona={persona}
            resumeTrack={podcastTargetTrack || undefined}
            initialMcIndex={podcastTargetMcIndex !== null ? podcastTargetMcIndex : undefined}
            autoPlay={podcastAutoPlay}
            playTrigger={podcastPlayTrigger}
            pauseTrigger={podcastPauseTrigger}
            stopTrigger={podcastStopTrigger}
            onPlayingChange={setPodcastIsPlaying}
            onNavigateToRead={handlePodcastNavigateToRead}
          />
        );

      case "videos":
        return (
          <VideosView
            chapterName={chapterName}
            subjectId={subjectId}
            chapterNumber={chapterNumber}
            youtubeLinksContent={typeof content === "string" ? content : null}
            persona={persona}
            onSelectChapter={handleChapterChange}
            subjectChapters={subjectChapters}
            isCompleted={completedTools.includes("videos")}
            onComplete={() => {
              setActiveTool("flashcards", markToolHere("videos"));
            }}
            chapterVideos={chapterVideos}
            activeVideoIndex={videoIndex}
            onSelectVideoIndex={(index) => {
              setVideoIndex(index);
              setCompletedTools(completedToolsFor(index));
            }}
            onVideoWatched={(index, advance) => {
              handleVideoWatched(index);
              // Crossing the threshold only unlocks (the learner is still
              // watching); moving on happens when the video ends, or when they
              // press the now-enabled next arrow themselves.
              if (advance && index === videoIndex) {
                setActiveTool(
                  "flashcards",
                  getCompletedTools(subjectId, chapterNumber, index),
                );
              }
            }}
            isVideoWatchedAt={(index) => isVideoWatched(subjectId, chapterNumber, index)}
            isVideoPlayableAt={(index) => isVideoPlayable(subjectId, chapterNumber, index)}
          />
        );
      case "pyq":
        return (
          <PYQView
            subjectName={subjectName}
            subjectId={subjectId}
            chapterNumber={chapterNumber}
            chapterName={chapterName}
            onSOS={handlePYQSOS}
          />
        );
      case "assessment":
        return (
          <AssessmentView
            key={`assessment-${videoIndex}-${activeVideoDir}-${persona}`}
            markdownContent={typeof content === "string" ? content : ""}
            subjectId={subjectId}
            chapterNumber={chapterNumber}
            chapterName={chapterName}
            persona={persona}
            videoDir={activeVideoDir}
            onQuit={() => {
              setActiveTool("revision_flashcards", markToolHere("assessment"));
            }}
            setPersona={setPersona}
            setActiveTool={setActiveTool}
          />
        );
      case "prep_exam":
        return (
          <MockTestView
            subjectId={subjectId}
            chapterNumber={chapterNumber}
            subjectName={subjectName}
            chapterName={chapterName}
            persona={persona}
            subjectChapters={subjectChapters}
            isPrepExam={true}
            onQuit={() => setActiveTool("summary")}
            onComplete={() => {
              setActiveTool("pre_final_test", markToolHere("prep_exam"));
            }}
          />
        );
      case "mocktest":
        return (
          <MockTestView
            subjectId={subjectId}
            chapterNumber={chapterNumber}
            subjectName={subjectName}
            chapterName={chapterName}
            persona={persona}
            subjectChapters={subjectChapters}
            isPrepExam={false}
            onQuit={() => setActiveTool("summary")}
            onComplete={() => {
              setActiveTool("pre_final_test", markToolHere("mocktest"));
            }}
          />
        );
      case "pre_final_test":
        return (
          <MockTestView
            subjectId={subjectId}
            chapterNumber={chapterNumber}
            subjectName={subjectName}
            chapterName={chapterName}
            persona={persona}
            subjectChapters={subjectChapters}
            onQuit={() => setActiveTool("summary")}
            isPreFinalTest={true}
            onComplete={() => {
              const completed = markToolHere("pre_final_test");
              if (nextUnit) {
                openUnitTool(nextUnit, GUIDED_FLOW[0], completed);
              } else {
                handleBackToChapters();
              }
            }}
          />
        );
      case "qbank":
        return (
          <QuestionBankView
            persona={persona}
            currentSubjectId={subjectId}
            currentChapterNumber={chapterNumber}
          />
        );
      case "swot":
        return <SwotView subjectId={subjectId} chapterNumber={chapterNumber} />;
      case "leaderboard":
        return <LeaderboardView subjectId={subjectId} />;
      default:
        return <div>Select a tool from the menu</div>;
    }
  };

  const TOOL_LABELS: Record<string, string> = {
    summary: "Study Table",
    detailed: "Study Table",
    key_takeaways: "Key Takeaways",
    study_plan: "Study Plan",
    mindmap: "Mindmap",
    foundation: "Mindmap",
    flashcards: "Flashcards",
    podcasts: "Podcasts",
    videos: "Videos",
    ask: "Ask Me",
    assessment: "Assessments",
    qbank: "Question Bank",
    swot: "SWOT Analysis",
    pyq: "PYQs",
    leaderboard: "Leaderboard",
    deep_dive: "Deep Dive",
    mocktest: "Mock Test",
    pre_final_test: "Certification Exam",
  };

  const renderContent = () => {
    if (isToolTransitioning) {
      return (
        <div
          style={{
            width: "100%",
            height: "100%",
            minHeight: "450px",
            background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #eff6ff 100%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "16px",
          }}
        >
          <StudyToolLoadingWaitScreen />
        </div>
      );
    }

    if (loading) {
      return (
        <div
          style={{
            width: "100%",
            height: "100%",
            minHeight: "450px",
            background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #eff6ff 100%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "16px",
            gap: "16px",
          }}
        >
          <StudyToolLoadingWaitScreen />
          <span style={{ fontSize: "15px", fontWeight: 700, color: "#1e293b" }}>
            Loading content...
          </span>
        </div>
      );
    }
    return (
      <Suspense fallback={<StudyToolLoadingWaitScreen />}>
        {renderMainContent()}
      </Suspense>
    );
  };

  const getToolTheme = (toolId: ToolId) => {
    switch (toolId) {
      case 'swot':
        return { bg: '#FAF8F3', gradient: 'linear-gradient(90deg, #D9A382 0%, #B87B56 100%)', shadow: '0 4px 12px rgba(217, 163, 130, 0.35)' };
      case 'deep_dive':
        return { bg: '#FAF8F3', gradient: 'linear-gradient(90deg, #D9A382 0%, #B87B56 100%)', shadow: '0 4px 12px rgba(217, 163, 130, 0.35)' };
      default:
        return { bg: '#FAF8F3', gradient: 'linear-gradient(90deg, #9CC0B4 0%, #546C60 100%)', shadow: '0 4px 12px rgba(156, 192, 180, 0.35)' };
    }
  };

  return (
    <div
      className={"sv-app st-app" + (isMoocMode ? " mooc-mode" : "")}
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      {/* ── MAIN ── */}
      <main
        className="sv-main book-main"
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Frosted topbar (Only for non-MOOC mode) */}


        <div
          className="sv-content"
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            minHeight: 0,
            overflow: "hidden",
            padding: "0",
            gap: "0"
          }}
        >
          {/* Study Toolbar (MVP Project) - Toggleable Dark (#546C60) / Bright Theme */}
          {activeTool !== 'mocktest' && activeTool !== 'pre_final_test' && (
            <div
              className='study-toolbar-wrapper'
              style={{
                position: 'relative',
                width: '100%',
                flexShrink: 0,
                background: isDarkToolbar ? '#546C60' : '#FFFFFF',
                borderBottom: isDarkToolbar ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #E2E8F0',
                boxShadow: isDarkToolbar ? '0 4px 24px rgba(0, 0, 0, 0.22)' : '0 2px 12px rgba(0, 0, 0, 0.05)',
                zIndex: 100,
                transition: 'background 0.25s ease, border-color 0.25s ease',
              }}
            >
              {/* Permanent Content Drawer */}
              <div
                style={{
                  padding: '2px 14px',
                  background: isDarkToolbar ? '#546C60' : '#FFFFFF',
                  transition: 'background 0.25s ease',
                }}
              >
                {(() => {
                  // Reflects the video currently being studied in a segmented
                  // chapter, so the rail shows that video's progress rather than
                  // a chapter-wide mix.
                  const unitCompleted = completedTools;
                    const TOOL_THEMES: Record<string, { main: string; badge: string; text: string; bg: string }> = {
                    // Learn - Mint (#9CC0B4)
                    videos: { main: '#9CC0B4', badge: '#9CC0B4', text: '#9CC0B4', bg: '#f0fdf4' },
                    summary: { main: '#9CC0B4', badge: '#9CC0B4', text: '#9CC0B4', bg: '#FAF8F4' },
                    quick_study: { main: '#9CC0B4', badge: '#9CC0B4', text: '#9CC0B4', bg: '#FAF8F4' },
                    detailed: { main: '#9CC0B4', badge: '#9CC0B4', text: '#9CC0B4', bg: '#FAF8F4' },
                    podcasts: { main: '#9CC0B4', badge: '#9CC0B4', text: '#9CC0B4', bg: '#f0fdf4' },

                    // Practice - Amber Gold (#E7B864)
                    flashcards: { main: '#E7B864', badge: '#E7B864', text: '#E7B864', bg: '#fffbeb' },
                    master_flashcards: { main: '#E7B864', badge: '#E7B864', text: '#E7B864', bg: '#fffbeb' },
                    revision_flashcards: { main: '#E7B864', badge: '#E7B864', text: '#E7B864', bg: '#fffbeb' },
                    revise: { main: '#E7B864', badge: '#E7B864', text: '#E7B864', bg: '#fffbeb' },
                    assessment: { main: '#E7B864', badge: '#E7B864', text: '#E7B864', bg: '#fffbeb' },
                    qbank: { main: '#E7B864', badge: '#E7B864', text: '#E7B864', bg: '#fffbeb' },

                    // Prepare - Sage Cream (#B5BA9B)
                    study_plan: { main: '#B5BA9B', badge: '#B5BA9B', text: '#B5BA9B', bg: '#F9FAF6' },
                    pyq: { main: '#B5BA9B', badge: '#B5BA9B', text: '#B5BA9B', bg: '#F9FAF6' },
                    prep_exam: { main: '#B5BA9B', badge: '#B5BA9B', text: '#B5BA9B', bg: '#F9FAF6' },
                    prep_test: { main: '#B5BA9B', badge: '#B5BA9B', text: '#B5BA9B', bg: '#F9FAF6' },
                    mocktest: { main: '#B5BA9B', badge: '#B5BA9B', text: '#B5BA9B', bg: '#F9FAF6' },
                    pre_final_test: { main: '#B5BA9B', badge: '#B5BA9B', text: '#B5BA9B', bg: '#F9FAF6' },
                    certification_exam: { main: '#B5BA9B', badge: '#B5BA9B', text: '#B5BA9B', bg: '#F9FAF6' },

                    // Resources - Logo Peach (#D9A382)
                    mindmap: { main: '#D9A382', badge: '#D9A382', text: '#D9A382', bg: '#FDF8F5' },
                    foundation: { main: '#D9A382', badge: '#D9A382', text: '#D9A382', bg: '#FDF8F5' },
                    key_takeaways: { main: '#D9A382', badge: '#D9A382', text: '#D9A382', bg: '#FDF8F5' },
                    ask: { main: '#D9A382', badge: '#D9A382', text: '#D9A382', bg: '#FDF8F5' },
                    swot: { main: '#D9A382', badge: '#D9A382', text: '#D9A382', bg: '#FDF8F5' },
                    deep_dive: { main: '#D9A382', badge: '#D9A382', text: '#D9A382', bg: '#FDF8F5' },
                  };

                  // In Menu Theme (#546C60 Deep Pine Green): Use the section colors (Mint #9CC0B4, Amber Gold #E7B864, Sage Cream #B5BA9B, Logo Peach #D9A382)
                  // All other (idle) icons and text are crisp white (#FFFFFF) in dark mode / #18221D in bright mode.

                  const getNodeIcon = (toolId: string, color: string, active: boolean) => {
                    // Active icon: vibrant bright section color with crisp white highlights.
                    // Inactive icons (the other icons): disabled look, black & white only (no colors).
                    const iconColor = active ? color : (isDarkToolbar ? '#FFFFFF' : '#475569');
                    const iconMuted = active ? `${color}BB` : (isDarkToolbar ? 'rgba(255, 255, 255, 0.55)' : '#94A3B8');
                    const innerBg = active ? '#FFFFFF' : (isDarkToolbar ? '#546C60' : '#FFFFFF');
                    const contrastBg = active ? '#546C60' : (isDarkToolbar ? '#546C60' : '#FFFFFF');

                    switch (toolId) {
                      case "summary":
                      case "quick_study":
                      case "detailed":
                      case "detailed_notes": {
                        const bookCover = iconColor;
                        const bookBase = active ? `${color}40` : (isDarkToolbar ? "rgba(255, 255, 255, 0.15)" : "#CBD5E1");
                        return (
                          <svg width="36" height="34" viewBox="0 0 38 34" fill="none">
                            {/* Book cover base */}
                            <path d="M4 27C10 27 15 28.5 19 31C23 28.5 28 27 34 27V29C28 29 23 30.5 19 33C15 30.5 10 29 4 29V27Z" fill={bookBase} />
                            <path d="M3 25C10 25 15 26.5 19 29C23 26.5 28 25 35 25V28C28 28 23 29.5 19 32C15 29.5 10 28 3 28V25Z" fill={bookCover} />
                            {/* Left page */}
                            <path d="M4 8C10 8 15 9.5 19 12V28C15 25.5 10 24 4 24V8Z" fill={innerBg} stroke={bookCover} strokeWidth="1.6" strokeLinejoin="round" />
                            {/* Right page */}
                            <path d="M34 8C28 8 23 9.5 19 12V28C23 25.5 28 24 34 24V8Z" fill={innerBg} stroke={bookCover} strokeWidth="1.6" strokeLinejoin="round" />
                            {/* Cover edges visible underneath */}
                            <path d="M3 9C2 9 2 24.5 3 25" stroke={bookCover} strokeWidth="2.5" strokeLinecap="round" />
                            <path d="M35 9C36 9 36 24.5 35 25" stroke={bookCover} strokeWidth="2.5" strokeLinecap="round" />
                            {/* Left page text lines */}
                            <line x1="7.5" y1="13" x2="15.5" y2="14.5" stroke={bookCover} strokeWidth="1.4" strokeLinecap="round" opacity="0.8" />
                            <line x1="7.5" y1="16.5" x2="15.5" y2="18" stroke={bookCover} strokeWidth="1.4" strokeLinecap="round" opacity="0.8" />
                            <line x1="7.5" y1="20" x2="13" y2="21" stroke={bookCover} strokeWidth="1.4" strokeLinecap="round" opacity="0.8" />
                            {/* Right page text lines */}
                            <line x1="22.5" y1="14.5" x2="30.5" y2="13" stroke={bookCover} strokeWidth="1.4" strokeLinecap="round" opacity="0.8" />
                            <line x1="22.5" y1="18" x2="30.5" y2="16.5" stroke={bookCover} strokeWidth="1.4" strokeLinecap="round" opacity="0.8" />
                            <line x1="25" y1="21" x2="30.5" y2="20" stroke={bookCover} strokeWidth="1.4" strokeLinecap="round" opacity="0.8" />
                            {/* Center spine */}
                            <line x1="19" y1="12" x2="19" y2="29" stroke={bookCover} strokeWidth="1.8" strokeLinecap="round" />
                          </svg>
                        );
                      }
                      case "podcasts": {
                        const podColor = iconColor;
                        const podCushion = iconMuted;
                        return (
                          <svg width="36" height="34" viewBox="0 0 36 34" fill="none">
                            {/* Headband */}
                            <path d="M7 17C7 10.9249 11.9249 6 18 6C24.0751 6 29 10.9249 29 17V20" stroke={podColor} strokeWidth="3" strokeLinecap="round" />
                            {/* Top cushion */}
                            <path d="M12 7.5C13.8 6.5 16 6 18 6C20 6 22.2 6.5 24 7.5" stroke={podCushion} strokeWidth="2" strokeLinecap="round" />
                            {/* Left earcup outer */}
                            <rect x="5" y="16" width="6" height="11" rx="3" fill={podColor} />
                            {/* Left earcup inner cushion */}
                            <rect x="9" y="17.5" width="2" height="8" rx="1" fill={podCushion} />
                            {/* Right earcup outer */}
                            <rect x="25" y="16" width="6" height="11" rx="3" fill={podColor} />
                            {/* Right earcup inner cushion */}
                            <rect x="25" y="17.5" width="2" height="8" rx="1" fill={podCushion} />
                            {/* Sound wave bars in center */}
                            <line x1="15" y1="19" x2="15" y2="23" stroke={podColor} strokeWidth="2" strokeLinecap="round" />
                            <line x1="18" y1="17" x2="18" y2="25" stroke={podColor} strokeWidth="2" strokeLinecap="round" />
                            <line x1="21" y1="19" x2="21" y2="23" stroke={podColor} strokeWidth="2" strokeLinecap="round" />
                          </svg>
                        );
                      }
                      case "videos": {
                        const vidColor = iconColor;
                        return (
                          <svg width="36" height="34" viewBox="0 0 36 34" fill="none">
                            {/* Bottom slate */}
                            <rect x="5" y="13" width="26" height="16" rx="3" fill={vidColor} />
                            {/* Play button triangle */}
                            <polygon points="16,17 23,21 16,25" fill={contrastBg} />
                            {/* Top clapperboard bar */}
                            <g transform="rotate(-6 5 12)">
                              <rect x="5" y="6" width="26" height="6.5" rx="2" fill={vidColor} />
                              {/* White diagonal stripes */}
                              <polygon points="9,6 12,6 9,12.5 6,12.5" fill={contrastBg} />
                              <polygon points="16,6 19,6 16,12.5 13,12.5" fill={contrastBg} />
                              <polygon points="23,6 26,6 23,12.5 20,12.5" fill={contrastBg} />
                              <polygon points="30,6 31,6 30,12.5 27,12.5" fill={contrastBg} />
                            </g>
                          </svg>
                        );
                      }
                      case "foundation":
                      case "mindmap": {
                        return (
                          <img
                            src="/mindmap_brain.png"
                            alt="Mindmaps"
                            style={{
                              width: "34px",
                              height: "26px",
                              objectFit: "contain",
                              display: "block",
                              filter: active
                                ? 'brightness(1.1) drop-shadow(0 0 6px rgba(217, 163, 130, 0.65))'
                                : 'grayscale(100%) brightness(1.7) opacity(0.7)',
                            }}
                          />
                        );
                      }
                      case "key_takeaways": {
                        return (
                          <svg width="36" height="34" viewBox="0 0 36 34" fill="none">
                            {/* Notepad base board */}
                            <rect x="6" y="6" width="20" height="23" rx="3.5" fill={innerBg} stroke={iconColor} strokeWidth="2" />
                            {/* 3 Top spiral/binder rings */}
                            <rect x="9.5" y="3" width="2.2" height="5" rx="1.1" fill={iconColor} />
                            <rect x="15" y="3" width="2.2" height="5" rx="1.1" fill={iconColor} />
                            <rect x="20.5" y="3" width="2.2" height="5" rx="1.1" fill={iconColor} />
                            {/* Checklist item 1 */}
                            <path d="M9.5 12L11 13.5L13.5 10.8" stroke={iconColor} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                            <line x1="15.5" y1="12" x2="22.5" y2="12" stroke={iconColor} strokeWidth="1.6" strokeLinecap="round" opacity="0.8" />
                            {/* Checklist item 2 */}
                            <path d="M9.5 17L11 18.5L13.5 15.8" stroke={iconColor} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                            <line x1="15.5" y1="17" x2="20.5" y2="17" stroke={iconColor} strokeWidth="1.6" strokeLinecap="round" opacity="0.8" />
                            {/* Checklist item 3 */}
                            <path d="M9.5 22L11 23.5L13.5 20.8" stroke={iconColor} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                            <line x1="15.5" y1="22" x2="19" y2="22" stroke={iconColor} strokeWidth="1.6" strokeLinecap="round" opacity="0.8" />
                            {/* Angled Pencil on the right */}
                            <g transform="translate(19, 13) rotate(35)">
                              <rect x="0" y="0" width="5" height="13" rx="1" fill={iconColor} />
                              <polygon points="0,13 5,13 2.5,18" fill={innerBg} stroke={iconColor} strokeWidth="0.8" />
                              <polygon points="1.5,16 3.5,16 2.5,18" fill={iconColor} />
                              <rect x="0" y="-3" width="5" height="3" rx="0.8" fill={iconColor} opacity="0.75" />
                            </g>
                          </svg>
                        );
                      }
                      case "study_plan": {
                        return (
                          <svg width="36" height="34" viewBox="0 0 36 34" fill="none">
                            {/* Calendar base board */}
                            <rect x="5.5" y="7" width="21" height="22" rx="3.5" fill={innerBg} stroke={iconColor} strokeWidth="2" />
                            {/* Top calendar header strip */}
                            <path d="M5.5 10.5C5.5 8.567 7.067 7 9 7H24.5C25.5 7 26.5 7.8 26.5 9V12.5H5.5V10.5Z" fill={iconColor} />
                            {/* 2 Binder rings on top left */}
                            <rect x="8.5" y="4" width="2.2" height="5" rx="1.1" fill={iconColor} stroke="#FFFFFF" strokeWidth="0.8" />
                            <rect x="13.5" y="4" width="2.2" height="5" rx="1.1" fill={iconColor} stroke="#FFFFFF" strokeWidth="0.8" />
                            {/* Graduation Cap (Mortarboard) on top right */}
                            <polygon points="23,3 29.5,5.5 23,8 16.5,5.5" fill={iconColor} stroke="#FFFFFF" strokeWidth="0.8" />
                            <path d="M19.5 6.5V8.5C19.5 9.5 21 10.2 23 10.2C25 10.2 26.5 9.5 26.5 8.5V6.5" fill={iconColor} />
                            <path d="M23 5.5L29 7.8V11.5" stroke={iconColor} strokeWidth="1.2" strokeLinecap="round" />
                            <circle cx="29" cy="12" r="1" fill={iconColor} />
                            {/* Checklist items inside calendar */}
                            <path d="M8.5 16.5L10 18L12.5 15.5" stroke={iconColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            <line x1="14.5" y1="16.5" x2="20" y2="16.5" stroke={iconColor} strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
                            <path d="M8.5 21L10 22.5L12.5 20" stroke={iconColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            <line x1="14.5" y1="21" x2="19" y2="21" stroke={iconColor} strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
                            {/* Clock badge at bottom right */}
                            <circle cx="26" cy="23.5" r="5.5" fill={innerBg} stroke={iconColor} strokeWidth="2" />
                            <polyline points="26,21 26,23.5 28,23.5" stroke={iconColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        );
                      }
                      case "flashcards":
                      case "revision_flashcards":
                      case "revise": {
                        return (
                          <svg width="36" height="34" viewBox="0 0 36 34" fill="none">
                            {/* Clipboard board */}
                            <rect x="7" y="5" width="20" height="25" rx="3.5" fill={innerBg} stroke={iconColor} strokeWidth="2" />
                            {/* Top Clip */}
                            <rect x="13" y="3" width="8" height="4" rx="1.5" fill={iconColor} />
                            <rect x="15" y="1.5" width="4" height="2" rx="1" fill={iconMuted} />
                            {/* Checkmarks & lines */}
                            <path d="M10.5 11L12 12.5L15 9.5" stroke={iconColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            <line x1="17" y1="11" x2="23" y2="11" stroke={iconColor} strokeWidth="1.5" strokeLinecap="round" opacity="0.75" />
                            <path d="M10.5 16L12 17.5L15 14.5" stroke={iconColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            <line x1="17" y1="16" x2="23" y2="16" stroke={iconColor} strokeWidth="1.5" strokeLinecap="round" opacity="0.75" />
                            <path d="M10.5 21L12 22.5L15 19.5" stroke={iconColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            <line x1="17" y1="21" x2="20" y2="21" stroke={iconColor} strokeWidth="1.5" strokeLinecap="round" opacity="0.75" />
                            {/* Clock badge at bottom right */}
                            <circle cx="26" cy="24" r="5.5" fill={innerBg} stroke={iconColor} strokeWidth="2" />
                            <polyline points="26,21.5 26,24 28,24" stroke={iconColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        );
                      }
                      case "assessment": {
                        return (
                          <svg width="36" height="34" viewBox="0 0 36 34" fill="none">
                            {/* Notepad body */}
                            <rect x="6" y="7" width="20" height="23" rx="3" fill={innerBg} stroke={iconColor} strokeWidth="2" />
                            {/* Spiral wire rings */}
                            <rect x="8" y="4" width="2" height="5" rx="1" fill={iconMuted} />
                            <rect x="13" y="4" width="2" height="5" rx="1" fill={iconMuted} />
                            <rect x="18" y="4" width="2" height="5" rx="1" fill={iconMuted} />
                            <rect x="23" y="4" width="2" height="5" rx="1" fill={iconMuted} />
                            {/* Lines & checks on pad */}
                            <path d="M9.5 13L11 14.5L14 11.5" stroke={iconColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            <line x1="16" y1="13" x2="22" y2="13" stroke={iconColor} strokeWidth="1.5" strokeLinecap="round" opacity="0.75" />
                            <path d="M9.5 18L11 19.5L14 16.5" stroke={iconColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            <line x1="16" y1="18" x2="20" y2="18" stroke={iconColor} strokeWidth="1.5" strokeLinecap="round" opacity="0.75" />
                            <path d="M9.5 23L11 24.5L14 21.5" stroke={iconColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            <line x1="16" y1="23" x2="19" y2="23" stroke={iconColor} strokeWidth="1.5" strokeLinecap="round" opacity="0.75" />
                            {/* Angled pencil writing on pad */}
                            <g transform="translate(19, 13) rotate(35)">
                              <rect x="0" y="0" width="5" height="13" rx="1" fill={iconColor} />
                              <polygon points="0,13 5,13 2.5,18" fill={innerBg} />
                              <polygon points="1.5,16 3.5,16 2.5,18" fill={iconColor} />
                              <rect x="0" y="-3" width="5" height="3" rx="0.8" fill={iconMuted} />
                            </g>
                          </svg>
                        );
                      }
                      case "qbank": {
                        return (
                          <svg width="36" height="34" viewBox="0 0 36 34" fill="none">
                            {/* Speech bubble */}
                            <path
                              d="M18 5C10.5 5 5 10 5 16.5C5 20.2 7.2 23.4 10.7 25.4L9 30L15.2 27.8C16.1 27.9 17 28 18 28C25.5 28 31 23 31 16.5C31 10 25.5 5 18 5Z"
                              fill={iconColor}
                            />
                            {/* Subtle highlight arc */}
                            <path d="M9 11C11 8 14.5 7 18 7" stroke={contrastBg} strokeWidth="1.8" strokeLinecap="round" opacity="0.4" />
                            {/* Question mark */}
                            <path d="M15 13.5C15 11.5 16.2 10.5 18 10.5C19.8 10.5 21 11.5 21 13C21 14.5 19.8 15.5 18.5 16.5C18 17 18 18 18 18.8" stroke={contrastBg} strokeWidth="2.6" strokeLinecap="round" />
                            <circle cx="18" cy="22.5" r="1.5" fill={contrastBg} />
                          </svg>
                        );
                      }
                      case "pyq": {
                        const pyqFold = active ? `${color}33` : (isDarkToolbar ? "rgba(255, 255, 255, 0.2)" : "#E2E8F0");
                        return (
                          <svg width="36" height="34" viewBox="0 0 36 34" fill="none">
                            {/* Document outline */}
                            <path d="M8 5C8 3.89543 8.89543 3 10 3H20L27 10V27C27 28.1046 26.1046 29 25 29H10C8.89543 29 8 28.1046 8 27V5Z" fill={innerBg} stroke={iconColor} strokeWidth="2" strokeLinejoin="round" />
                            {/* Dog-ear fold */}
                            <path d="M20 3V10H27" fill={pyqFold} stroke={iconColor} strokeWidth="2" strokeLinejoin="round" />
                            {/* Document text lines */}
                            <line x1="12" y1="9" x2="16" y2="9" stroke={iconColor} strokeWidth="1.6" strokeLinecap="round" opacity="0.8" />
                            <line x1="12" y1="13" x2="22" y2="13" stroke={iconColor} strokeWidth="1.6" strokeLinecap="round" opacity="0.8" />
                            <line x1="12" y1="17" x2="20" y2="17" stroke={iconColor} strokeWidth="1.6" strokeLinecap="round" opacity="0.8" />
                            <line x1="12" y1="21" x2="16" y2="21" stroke={iconColor} strokeWidth="1.6" strokeLinecap="round" opacity="0.8" />
                            {/* PYQ Badge */}
                            <rect x="16" y="21" width="15" height="9" rx="3.5" fill={iconColor} />
                            <text x="23.5" y="27.8" fill={contrastBg} fontSize="6.5" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">PYQ</text>
                          </svg>
                        );
                      }
                      case "prep_exam":
                      case "prep_test":
                      case "mocktest":
                      case "pre_final_test":
                      case "certification_exam": {
                        return (
                          <svg width="36" height="34" viewBox="0 0 36 34" fill="none">
                            {/* Calendar body */}
                            <rect x="6" y="6" width="22" height="23" rx="3.5" fill={innerBg} stroke={iconColor} strokeWidth="2" />
                            {/* Calendar header bar */}
                            <path d="M6 9.5C6 7.567 7.567 6 9.5 6H24.5C26.433 6 28 7.567 28 9.5V11H6V9.5Z" fill={iconColor} />
                            {/* Spiral binder rings */}
                            <rect x="10" y="3" width="2" height="5" rx="1" fill={innerBg} stroke={iconColor} strokeWidth="1" />
                            <rect x="16" y="3" width="2" height="5" rx="1" fill={innerBg} stroke={iconColor} strokeWidth="1" />
                            <rect x="22" y="3" width="2" height="5" rx="1" fill={innerBg} stroke={iconColor} strokeWidth="1" />
                            {/* Grid of date checkmarks */}
                            <path d="M9.5 15L10.5 16L12.5 14" stroke={iconColor} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M15.5 15L16.5 16L18.5 14" stroke={iconColor} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M21.5 15L22.5 16L24.5 14" stroke={iconColor} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M9.5 20L10.5 21L12.5 19" stroke={iconColor} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M15.5 20L16.5 21L18.5 19" stroke={iconColor} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                            {/* Clock badge at bottom right */}
                            <circle cx="27" cy="24" r="5.5" fill={innerBg} stroke={iconColor} strokeWidth="2" />
                            <polyline points="27,21.5 27,24 29,24" stroke={iconColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        );
                      }
                      case "ask": {
                        return (
                          <svg width="36" height="34" viewBox="0 0 36 34" fill="none">
                            {/* Circular badge base */}
                            <circle cx="18" cy="17" r="13" fill={iconColor} />
                            {/* Large 4-point sparkle star in center */}
                            <path
                              d="M18 8.5C18 12.5 14.5 15 10.5 15C14.5 15 18 17.5 18 21.5C18 17.5 21.5 15 25.5 15C21.5 15 18 12.5 18 8.5Z"
                              fill={contrastBg}
                            />
                            {/* Small 4-point sparkle star on top right */}
                            <path
                              d="M25.5 7.5C25.5 9.5 23.8 10.8 22 10.8C23.8 10.8 25.5 12.1 25.5 14.1C25.5 12.1 27.2 10.8 29 10.8C27.2 10.8 25.5 9.5 25.5 7.5Z"
                              fill={contrastBg}
                            />
                          </svg>
                        );
                      }
                      default:
                        return (
                          <svg width="36" height="34" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="1.75">
                            <circle cx="12" cy="12" r="8" />
                          </svg>
                        );
                    }
                  };

                  const renderNode = (toolId: ToolId, labelOverride?: string, colorOverride?: string) => {
                    const locked = false;
                    const active = activeTool === toolId ||
                      (toolId === "summary" && activeTool === "detailed") ||
                      (toolId === "prep_exam" && ((activeTool as string) === "mocktest" || (activeTool as string) === "pre_final_test")) ||
                      (toolId === "revision_flashcards" && activeTool === "flashcards") ||
                      (toolId === "mindmap" && activeTool === "foundation");
                    const theme = TOOL_THEMES[toolId] || { main: "#4F7B64", badge: "#4F7B64", text: "#4F7B64", bg: "#f0f7f4" };
                    const themeColor = colorOverride || theme.main;
                    const activeThemeColor = themeColor;
                    const activeBorderColor = themeColor;

                    return (
                      <div
                        key={toolId}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!locked) {
                            if (toolId === "mocktest" || toolId === "prep_exam") {
                              setMockTestVariant(labelOverride === "Preparation Exam" ? "prep" : "mock");
                            }
                            setActiveTool(toolId);
                          }
                        }}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '2px 2px',
                          borderRadius: '9px',
                          background: active ? (isDarkToolbar ? `${themeColor}26` : '#ffffff') : 'transparent',
                          border: active ? `1.8px solid ${activeBorderColor}` : '1.8px solid transparent',
                          boxShadow: active
                            ? (isDarkToolbar
                                ? `0 2px 8px ${themeColor}40, 0 1px 3px rgba(0, 0, 0, 0.3)`
                                : `0 3px 12px ${themeColor}2e, 0 1px 3px rgba(0,0,0,0.06)`)
                            : 'none',
                          cursor: locked ? 'not-allowed' : 'pointer',
                          opacity: 1,
                          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                          position: 'relative',
                          gap: '1px',
                          flex: '1 1 0',
                          minWidth: 0,
                          width: '100%',
                          height: '56px',
                          minHeight: '56px',
                          maxHeight: '56px',
                          boxSizing: 'border-box',
                        }}
                        title={labelOverride || GUIDED_LABELS[toolId]}
                        onMouseEnter={!active && !locked ? (e) => {
                          (e.currentTarget as HTMLDivElement).style.background = isDarkToolbar ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.04)';
                          (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-1px)';
                        } : undefined}
                        onMouseLeave={!active && !locked ? (e) => {
                          (e.currentTarget as HTMLDivElement).style.background = 'transparent';
                          (e.currentTarget as HTMLDivElement).style.transform = 'none';
                        } : undefined}
                      >
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          height: '26px',
                          width: '28px',
                          transition: 'transform 0.18s ease, filter 0.18s ease, opacity 0.18s ease',
                          transform: active ? 'scale(0.95)' : 'scale(0.88)',
                          filter: active ? `drop-shadow(0 2px 8px ${themeColor}90)` : 'none',
                          opacity: active ? 1 : 0.72,
                          flexShrink: 0
                        }}>
                          {getNodeIcon(toolId, themeColor, active)}
                        </div>
                        <span style={{
                          fontSize: '10.5px',
                          fontWeight: active ? 700 : 500,
                          color: active ? activeThemeColor : (isDarkToolbar ? 'rgba(255, 255, 255, 0.75)' : '#64748B'),
                          textAlign: 'center',
                          lineHeight: '1.1',
                          letterSpacing: '-0.2px',
                          transition: 'color 0.18s ease',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          height: '22px',
                          minHeight: '22px',
                          maxHeight: '22px',
                          width: '100%',
                        }}>
                          {labelOverride || GUIDED_LABELS[toolId]}
                        </span>
                        {/* Active underline indicator */}
                        {active && (
                          <div
                            style={{
                              position: 'absolute',
                              bottom: '-2px',
                              width: '22px',
                              height: '2.5px',
                              borderRadius: '2px',
                              background: activeBorderColor,
                            }}
                          />
                        )}
                      </div>
                    );
                  };

                  return (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                        overflowX: 'auto',
                        padding: '3px 16px',
                        gap: '16px',
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* LEFT SIDE: BRAND TREE LOGO */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, paddingLeft: '4px' }}>
                        <div
                          className="sv-rail-brand"
                          onClick={() => navigate("/")}
                          style={{ cursor: "pointer", display: "flex", alignItems: "center" }}
                          title="Home"
                        >
                          <img
                            src={treeLogoSrc}
                            alt="Saral Vidhya"
                            style={{
                              height: '56px',
                              width: 'auto',
                              minWidth: '54px',
                              objectFit: 'contain',
                              display: 'block',
                              transition: 'transform 0.2s ease',
                            }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLImageElement).style.transform = 'scale(1.05)'; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLImageElement).style.transform = 'none'; }}
                          />
                        </div>
                      </div>

                      {/* CENTER TOOL NODES (Balanced Toolbar Layout: Learn, Practice, Prepare, Resources - exactly even width & height) */}
                      {(() => {
                        const isLearnActive = activeTool === "summary" || activeTool === "detailed" || activeTool === "podcasts" || activeTool === "videos";
                        const isPracticeActive = activeTool === "revision_flashcards" || activeTool === "flashcards" || activeTool === "assessment" || activeTool === "qbank";
                        const isPrepareActive = activeTool === "pyq" || activeTool === "prep_exam" || activeTool === "study_plan" || (activeTool as string) === "mocktest" || (activeTool as string) === "pre_final_test";
                        const isResourcesActive = activeTool === "mindmap" || activeTool === "foundation" || activeTool === "key_takeaways" || activeTool === "ask";

                        const groupCardStyle = (isActive: boolean, groupColor: string): React.CSSProperties => ({
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          border: isActive
                            ? `1.8px solid ${groupColor}`
                            : (isDarkToolbar ? '1.5px solid rgba(255, 255, 255, 0.12)' : '1.5px solid #D5E2D9'),
                          borderRadius: '13px',
                          padding: '3px 7px 5px',
                          background: isActive
                            ? (isDarkToolbar ? `${groupColor}14` : `${groupColor}0a`)
                            : (isDarkToolbar ? 'rgba(0, 0, 0, 0.20)' : '#FFFFFF'),
                          boxShadow: isActive
                            ? (isDarkToolbar
                                ? `0 2px 10px ${groupColor}2a, 0 2px 8px rgba(0, 0, 0, 0.28)`
                                : `0 3px 12px ${groupColor}33, 0 1px 3px rgba(0, 0, 0, 0.2)`)
                            : (isDarkToolbar ? '0 1px 4px rgba(0, 0, 0, 0.15)' : '0 1px 3px rgba(0, 0, 0, 0.04)'),
                          width: '232px',
                          minWidth: '232px',
                          maxWidth: '232px',
                          height: '84px',
                          minHeight: '84px',
                          maxHeight: '84px',
                          boxSizing: 'border-box',
                          flex: '0 0 232px',
                          transition: 'all 0.25s ease',
                        });

                        return (
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '10px',
                              padding: '2px 6px',
                              background: 'transparent',
                              margin: '0 auto',
                              flexShrink: 0,
                            }}
                          >
                            {/* 1. LEARN SECTION (3 items: Read, Listen, Watch) - Mint (#9CC0B4) */}
                            <div style={groupCardStyle(isLearnActive, '#9CC0B4')}>
                              <div style={{
                                height: '16px',
                                minHeight: '16px',
                                maxHeight: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                color: isLearnActive ? '#9CC0B4' : (isDarkToolbar ? '#9CC0B4' : '#18221D'),
                                fontSize: '11.5px',
                                fontWeight: 700,
                                textAlign: 'center',
                                lineHeight: '16px',
                                width: '100%',
                              }}>
                                <span>Learn</span>
                                {isSegmented && (
                                  <span
                                    title={activeVideo?.title}
                                    style={{ background: '#9CC0B4', color: '#18221D', borderRadius: '4px', padding: '1px 5px', fontSize: '9.5px', fontWeight: 800 }}
                                  >
                                    Video {videoIndex}/{chapterVideos.length}
                                  </span>
                                )}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', width: '100%', flex: '1 1 auto' }}>
                                {renderNode('summary', 'Read', '#9CC0B4')}
                                {renderNode('podcasts', 'Listen', '#9CC0B4')}
                                {renderNode('videos', 'Watch', '#9CC0B4')}
                              </div>
                            </div>

                            {/* 2. PRACTICE SECTION (3 items: Revise, Assessment, Question Bank) - Amber Gold (#E7B864) */}
                            <div style={groupCardStyle(isPracticeActive, '#E7B864')}>
                              <div style={{
                                height: '16px',
                                minHeight: '16px',
                                maxHeight: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: isPracticeActive ? '#E7B864' : (isDarkToolbar ? '#E7B864' : '#18221D'),
                                fontSize: '11.5px',
                                fontWeight: 700,
                                textAlign: 'center',
                                lineHeight: '16px',
                                width: '100%',
                              }}>
                                Practice
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', width: '100%', flex: '1 1 auto' }}>
                                {renderNode('revision_flashcards', 'Revise', '#E7B864')}
                                {renderNode('assessment', 'Assessment', '#E7B864')}
                                {renderNode('qbank', 'Question Bank', '#E7B864')}
                              </div>
                            </div>

                            {/* 3. PREPARE SECTION (3 items: PYQ, Preparation Exam, Study Plan) - Sage Cream (#B5BA9B) */}
                            <div style={groupCardStyle(isPrepareActive, '#B5BA9B')}>
                              <div style={{
                                height: '16px',
                                minHeight: '16px',
                                maxHeight: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: isPrepareActive ? '#B5BA9B' : (isDarkToolbar ? '#B5BA9B' : '#18221D'),
                                fontSize: '11.5px',
                                fontWeight: 700,
                                textAlign: 'center',
                                lineHeight: '16px',
                                width: '100%',
                              }}>
                                Prepare
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', width: '100%', flex: '1 1 auto' }}>
                                {renderNode('pyq', 'PYQs', '#B5BA9B')}
                                {renderNode('prep_exam', 'Preparation Exam', '#B5BA9B')}
                                {renderNode('study_plan', 'Study Plan', '#B5BA9B')}
                              </div>
                            </div>

                            {/* 4. RESOURCES SECTION (3 items: Mindmaps, Key Takeaways, Ask me) - Logo Peach (#D9A382) */}
                            <div style={groupCardStyle(isResourcesActive, '#D9A382')}>
                              <div style={{
                                height: '16px',
                                minHeight: '16px',
                                maxHeight: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: isResourcesActive ? '#D9A382' : (isDarkToolbar ? '#D9A382' : '#18221D'),
                                fontSize: '11.5px',
                                fontWeight: 700,
                                textAlign: 'center',
                                lineHeight: '16px',
                                width: '100%',
                              }}>
                                Resources
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', width: '100%', flex: '1 1 auto' }}>
                                {renderNode('mindmap', 'Mindmaps', '#D9A382')}
                                {renderNode('key_takeaways', 'Key Takeaways', '#D9A382')}
                                {renderNode('ask', 'Ask me', '#D9A382')}
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* RIGHT SIDE / END OF PAGE: ACTIONS */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          flexShrink: 0,
                          paddingRight: '6px',
                        }}
                      >

                        {/* Log Out Button - Cream (#F5F2EB) */}
                        <button
                          type='button'
                          onClick={handleAuthClick}
                          title='Log Out'
                          aria-label='Log Out'
                          style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1.5px solid #F5F2EB',
                            background: '#F5F2EB',
                            color: '#546C60',
                            cursor: 'pointer',
                            flexShrink: 0,
                            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.14)',
                            transition: 'all 0.2s ease',
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.background = '#FFFFFF';
                            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.08)';
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.background = '#F5F2EB';
                            (e.currentTarget as HTMLButtonElement).style.transform = 'none';
                          }}
                        >
                          <svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='#546C60' strokeWidth='2.2' strokeLinecap='round' strokeLinejoin='round'>
                            <path d='M14 5H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h8' />
                            <polyline points='15 8 19 12 15 16' />
                            <line x1='9' y1='12' x2='19' y2='12' />
                          </svg>
                        </button>
                      </div>

                      {/* Dropdown Ask AI Chatbot Popover (Fixed position) */}
                      {showHelpDropdown && (
                        <div
                          style={{
                            position: 'fixed',
                            top: '56px',
                            right: '60px',
                            width: '330px',
                            background: '#ffffff',
                            borderRadius: '16px',
                            border: '1px solid rgba(244, 63, 94, 0.3)',
                            boxShadow: '0 16px 40px rgba(0, 0, 0, 0.22)',
                            zIndex: 99999,
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                          }}
                        >
                          {/* Header */}
                          <div
                            style={{
                              background: 'linear-gradient(135deg, #f43f5e, #fb7185)',
                              color: '#ffffff',
                              padding: '10px 14px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '13px' }}>
                              <span>🎙️</span>
                              <span>Ask AI Assistant</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setShowHelpDropdown(false)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#ffffff',
                                fontSize: '14px',
                                cursor: 'pointer',
                                padding: '2px 4px',
                              }}
                            >
                              ✕
                            </button>
                          </div>

                          {/* Chat Messages / Placeholder Body */}
                          <div
                            style={{
                              padding: '12px',
                              overflowY: 'auto',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '8px',
                              maxHeight: '260px',
                              fontSize: '12.5px',
                              background: '#fff1f2',
                            }}
                          >
                            {miniMessages.length === 0 ? (
                              <div style={{ textAlign: 'center', color: '#64748b', padding: '12px 4px' }}>
                                <div style={{ fontSize: '24px', marginBottom: '6px' }}>🎙️</div>
                                <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: '2px' }}>Ask me anything!</div>
                                <div style={{ fontSize: '11.5px', color: '#64748b' }}>Type any question about {chapterName || 'this chapter'} below!</div>
                              </div>
                            ) : (
                              miniMessages.map((msg, idx) => (
                                <div
                                  key={idx}
                                  style={{
                                    alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                    background: msg.role === 'user' ? '#f43f5e' : '#ffffff',
                                    color: msg.role === 'user' ? '#ffffff' : '#1e293b',
                                    padding: '7px 11px',
                                    borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                                    border: msg.role === 'user' ? 'none' : '1px solid #fecdd3',
                                    maxWidth: '88%',
                                    lineHeight: 1.4,
                                  }}
                                >
                                  {msg.content}
                                </div>
                              ))
                            )}
                            {miniIsLoading && (
                              <div style={{ alignSelf: 'flex-start', color: '#64748b', fontSize: '11.5px', fontStyle: 'italic' }}>
                                AI is thinking...
                              </div>
                            )}
                          </div>

                          {/* Chat Input */}
                          <div style={{ padding: '8px 10px', borderTop: '1px solid #fecdd3', background: '#ffffff', display: 'flex', gap: '6px' }}>
                            <input
                              type="text"
                              value={miniAskInput}
                              onChange={(e) => setMiniAskInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSendMiniAsk();
                              }}
                              placeholder="Ask me a question..."
                              style={{
                                flex: 1,
                                padding: '6px 12px',
                                borderRadius: '16px',
                                border: '1px solid #cbd5e1',
                                fontSize: '12px',
                                outline: 'none',
                              }}
                            />
                            <button
                              type="button"
                              onClick={handleSendMiniAsk}
                              disabled={!miniAskInput.trim() || miniIsLoading}
                              style={{
                                background: '#f43f5e',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '16px',
                                padding: '6px 12px',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: miniAskInput.trim() && !miniIsLoading ? 'pointer' : 'not-allowed',
                                opacity: miniAskInput.trim() && !miniIsLoading ? 1 : 0.6,
                              }}
                            >
                              Send
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Old Collapse Pull-Tab removed */}
            </div>
          )}

          {/* ── BODY ── */}
          <div
            className="st-body"
            style={{
              flex: 1,
              overflowY:
                activeTool === "flashcards" || activeTool === "revision_flashcards" || activeTool === "prep_exam" || activeTool === "assessment" || activeTool === "videos" || (activeTool === "mindmap" && !mindmapTopicOpen)
                  ? "hidden"
                  : "auto",
              padding:
                activeTool === 'mocktest' || activeTool === 'pre_final_test' || activeTool === 'prep_exam' || activeTool === 'ask' || activeTool === 'key_takeaways' || activeTool === 'study_plan' || activeTool === 'qbank' || activeTool === 'videos' || activeTool === 'pyq' || (activeTool === 'mindmap' && !mindmapTopicOpen)
                  ? '0px'
                  : activeTool === 'assessment'
                  ? '4px 16px 0 16px'
                  : (activeTool === 'flashcards' || activeTool === 'revision_flashcards')
                  ? '2px 16px 8px 16px'
                  : activeTool === 'podcasts' ? '12px 24px 32px 24px' : '16px 16px 0 16px',
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-start",
              minHeight: 0,
              background: activeToolTheme.bg,
              position: "relative",
            }}
          >
            {/* ── COMPACT TOP BAR ── */}
            {activeTool !== "mocktest" && activeTool !== "pre_final_test" && activeTool !== "ask" && activeTool !== "podcasts" && activeTool !== "prep_exam" && activeTool !== "key_takeaways" && activeTool !== "study_plan" && (
              <div
                style={{
                  display: (activeTool === "mindmap" || activeTool === "qbank" || activeTool === "videos") ? "none" : "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  position: "relative",
                  gap: "20px",
                  marginTop: 0,
                  paddingTop: 0,
                  marginBottom: (activeTool === "assessment" || activeTool === "flashcards" || activeTool === "revision_flashcards" || activeTool === "videos") ? "4px" : "12px",
                  flexShrink: 0,
                }}
              >
                {/* ── MVP STUDY HEADER: pixel-perfect reference match ── */}
                {(activeTool === "summary" || activeTool === "detailed" || activeTool === "flashcards" || activeTool === "revision_flashcards" || activeTool === "assessment" || activeTool === "videos") ? (
                  <>
                    <style>{`
                      @keyframes sv-hdr-in {
                        from { opacity: 0; transform: translateY(-3px); }
                        to   { opacity: 1; transform: translateY(0); }
                      }
                      /* Outer row — no border/bg, just flex */
                      .sv-hdr {
                        position: relative;
                        display: flex; align-items: center; justify-content: space-between;
                        width: 100%; gap: 16px; flex-shrink: 0;
                        animation: sv-hdr-in 0.2s ease;
                        min-height: ${(activeTool === "assessment" || activeTool === "flashcards" || activeTool === "revision_flashcards" || activeTool === "videos") ? "46px" : "56px"};
                        padding: ${(activeTool === "assessment" || activeTool === "flashcards" || activeTool === "revision_flashcards" || activeTool === "videos") ? "0 0 2px 0" : "2px 0 6px 0"};
                        overflow: visible;
                      }
                      /* LEFT breadcrumb — single line, no card box */
                      .sv-hdr-card {
                        display: flex; align-items: center; gap: 0;
                        min-width: 0; flex-shrink: 0;
                        max-width: 420px;
                        position: relative; z-index: 1;
                      }
                      .sv-hdr-crumb {
                        font-size: 0.84rem; font-weight: 500; color: #64748b;
                        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
                        line-height: 1.4;
                      }
                      .sv-hdr-crumb .crumb-subject { color: #1E2822; font-weight: 700; }
                      .sv-hdr-crumb .crumb-sep { color: #94a3b8; margin: 0 7px; font-weight: 400; }
                      .sv-hdr-crumb .crumb-chapter { color: #64748B; font-weight: 500; }
                      /* MIDDLE levels — absolutely centered to the full bar */
                      .sv-hdr-levels {
                        position: absolute;
                        left: 50%;
                        top: 50%;
                        transform: translate(-50%, -50%);
                        display: flex; gap: ${(activeTool === "assessment" || activeTool === "flashcards" || activeTool === "revision_flashcards") ? "10px" : "16px"}; align-items: center; justify-content: center;
                        z-index: 10;
                      }
                      .sv-hdr-level-btn {
                        min-width: ${(activeTool === "assessment" || activeTool === "flashcards" || activeTool === "revision_flashcards") ? "48px" : "60px"};
                        height: ${(activeTool === "assessment" || activeTool === "flashcards" || activeTool === "revision_flashcards") ? "48px" : "54px"};
                        border-radius: 11px;
                        padding: ${(activeTool === "assessment" || activeTool === "flashcards" || activeTool === "revision_flashcards") ? "0" : "3px 8px 4px"};
                        border: 2px solid transparent;
                        cursor: pointer; background: transparent;
                        transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
                        overflow: visible; flex-shrink: 0;
                        display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px;
                        box-sizing: border-box;
                      }
                      .sv-hdr-level-btn img {
                        width: ${(activeTool === "assessment" || activeTool === "flashcards" || activeTool === "revision_flashcards") ? "100%" : "34px"};
                        height: ${(activeTool === "assessment" || activeTool === "flashcards" || activeTool === "revision_flashcards") ? "100%" : "34px"};
                        object-fit: contain;
                        border-radius: 8px;
                        padding: 0;
                        box-sizing: border-box;
                        filter: grayscale(0.15) opacity(0.78);
                        transition: filter 0.2s ease, transform 0.2s ease;
                      }
                      .sv-hdr-level-label {
                        font-size: 10.5px;
                        font-weight: 600;
                        color: #64748B;
                        line-height: 1.1;
                        letter-spacing: 0.01em;
                        white-space: nowrap;
                      }
                      .sv-hdr-level-btn:hover img {
                        filter: grayscale(0) opacity(1);
                        transform: scale(1.06);
                      }
                      .sv-hdr-level-btn:hover .sv-hdr-level-label {
                        color: #1E2822;
                      }
                      /* Inactive — NO box for unselected ones */
                      .sv-hdr-level-btn.lvl-beginner,
                      .sv-hdr-level-btn.lvl-intermediate,
                      .sv-hdr-level-btn.lvl-advanced {
                        border-color: transparent !important;
                        background: transparent !important;
                        box-shadow: none !important;
                      }
                      /* Active — warm Amber border shown ONLY for the selected one */
                      .sv-hdr-level-btn.active-lvl,
                      .sv-hdr-level-btn.lvl-beginner.active-lvl,
                      .sv-hdr-level-btn.lvl-intermediate.active-lvl,
                      .sv-hdr-level-btn.lvl-advanced.active-lvl {
                        border: 2px solid #E7B864 !important;
                        background: #FFFDF9 !important;
                        box-shadow: 0 3px 10px rgba(231, 184, 100, 0.22) !important;
                        border-radius: 12px !important;
                      }
                      .sv-hdr-level-btn.active-lvl img {
                        filter: grayscale(0) opacity(1) !important;
                        transform: scale(1.03);
                      }
                      .sv-hdr-level-btn.active-lvl .sv-hdr-level-label {
                        color: #1E2822 !important;
                        font-weight: 700 !important;
                      }
                      /* RIGHT controls */
                      .sv-hdr-controls {
                        display: flex; align-items: center; justify-content: flex-end; gap: 6px; flex-shrink: 0;
                      }
                      /* Mode row: Quick | Detailed */
                      .sv-hdr-modes { display: flex; gap: 8px; align-items: center; }
                      /* Reading Depth Segmented Toggle (2 modes: Essentials | In-depth) */
                      .sv-hdr-segmented-toggle {
                        position: relative;
                        display: inline-flex;
                        align-items: center;
                        background: #FFFFFF;
                        border: 1px solid #E2DDD3;
                        border-radius: 9999px;
                        padding: 3px;
                        box-shadow: 0 1px 3px rgba(30, 40, 34, 0.05);
                        user-select: none;
                        gap: 0;
                        box-sizing: border-box;
                      }
                      .sv-hdr-toggle-pill-bg {
                        position: absolute;
                        top: 3px;
                        bottom: 3px;
                        left: 3px;
                        width: calc(50% - 3px);
                        background: #546C60;
                        border-radius: 9999px;
                        box-shadow: 0 2px 6px rgba(84, 108, 96, 0.28);
                        transition: transform 0.22s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease;
                        pointer-events: none;
                        z-index: 1;
                      }
                      .sv-hdr-segmented-toggle[data-active="summary"] .sv-hdr-toggle-pill-bg {
                        transform: translateX(0);
                        opacity: 1;
                      }
                      .sv-hdr-segmented-toggle[data-active="detailed"] .sv-hdr-toggle-pill-bg {
                        transform: translateX(100%);
                        opacity: 1;
                      }
                      .sv-hdr-segmented-toggle[data-active="none"] .sv-hdr-toggle-pill-bg {
                        opacity: 0;
                      }
                      .sv-hdr-toggle-btn {
                        position: relative;
                        z-index: 2;
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        gap: 6px;
                        padding: 7px 20px;
                        border-radius: 9999px;
                        border: none;
                        background: transparent;
                        font-size: 0.82rem;
                        font-weight: 600;
                        cursor: pointer;
                        white-space: nowrap;
                        line-height: 1;
                        color: #475569;
                        transition: color 0.18s ease;
                        flex: 1;
                      }
                      .sv-hdr-toggle-btn:hover {
                        color: #1E2822;
                      }
                      .sv-hdr-toggle-btn.active {
                        color: #ffffff;
                        font-weight: 700;
                      }
                      .sv-hdr-toggle-btn svg {
                        transition: transform 0.18s ease;
                      }
                      .sv-hdr-toggle-btn:hover svg {
                        transform: scale(1.08);
                      }
                      .sv-hdr-mode-btn {
                        display: inline-flex; align-items: center; gap: 6px;
                        padding: 8px 22px; border-radius: 20px;
                        font-size: 0.84rem; font-weight: 600; cursor: pointer;
                        border: 1.5px solid #E2DDD3;
                        background: #ffffff; color: #475569;
                        transition: all 0.18s ease; white-space: nowrap;
                        line-height: 1;
                      }
                      .sv-hdr-mode-btn:hover { border-color: #546C60; color: #546C60; background: rgba(84, 108, 96, 0.06); }
                      .sv-hdr-mode-btn.active-quick    { background: #546C60; border-color: #546C60; color: #ffffff; box-shadow: 0 2px 8px rgba(84, 108, 96, 0.28); }
                      .sv-hdr-mode-btn.active-detailed { background: #546C60; border-color: #546C60; color: #ffffff; box-shadow: 0 2px 8px rgba(84, 108, 96, 0.28); }
                    `}</style>

                    <div className="sv-hdr">
                      {/* LEFT: inline breadcrumb — "Entomology › Chapter 4: Pollination" */}
                      <div className="sv-hdr-card">
                        <span className="sv-hdr-crumb">
                          <span className="crumb-subject">{subjectName}</span>
                          <span className="crumb-sep">›</span>
                          <span className="crumb-chapter">{getChapterPrefix(subjectId)} {chapterNumber}: {chapterName}</span>
                        </span>
                      </div>

                      {/* MIDDLE: persona levels */}
                      <div className="sv-hdr-levels">
                        <button id="studybar-level-beginner" type="button"
                          className={`sv-hdr-level-btn lvl-beginner${uiPersona === "beginner" ? " active-lvl" : ""}`}
                          onClick={() => setPersona("beginner")}
                        >
                          <img src={`${import.meta.env.BASE_URL}personas/beginner.png`} alt="Beginner" title="Beginner" />
                          {!(activeTool === "assessment" || activeTool === "flashcards" || activeTool === "revision_flashcards") && (
                            <span className="sv-hdr-level-label">Beginner</span>
                          )}
                        </button>
                        <button id="studybar-level-intermediate" type="button"
                          className={`sv-hdr-level-btn lvl-intermediate${uiPersona === "intermediate" ? " active-lvl" : ""}`}
                          onClick={() => setPersona("intermediate")}
                        >
                          <img src={`${import.meta.env.BASE_URL}personas/intermediate.png`} alt="Intermediate" title="Intermediate" />
                          {!(activeTool === "assessment" || activeTool === "flashcards" || activeTool === "revision_flashcards") && (
                            <span className="sv-hdr-level-label">Intermediate</span>
                          )}
                        </button>
                        <button id="studybar-level-advanced" type="button"
                          className={`sv-hdr-level-btn lvl-advanced${uiPersona === "advanced" ? " active-lvl" : ""}`}
                          onClick={() => setPersona("advanced")}
                        >
                          <img src={`${import.meta.env.BASE_URL}personas/advanced.png`} alt="Advanced" title="Advanced" />
                          {!(activeTool === "assessment" || activeTool === "flashcards" || activeTool === "revision_flashcards") && (
                            <span className="sv-hdr-level-label">Advanced</span>
                          )}
                        </button>
                      </div>

                      {/* RIGHT: mode toggles — Essentials | In-depth */}
                      <div className="sv-hdr-controls">
                        {(activeTool === "summary" || activeTool === "detailed") && (
                          <div className="sv-hdr-modes">
                            <div
                              className="sv-hdr-segmented-toggle"
                              data-active={activeTool === "summary" ? "summary" : "detailed"}
                              role="radiogroup"
                              aria-label="Reading depth toggle"
                            >
                              <div className="sv-hdr-toggle-pill-bg" />
                              <button
                                id="studybar-mode-quick"
                                type="button"
                                role="radio"
                                aria-checked={activeTool === "summary"}
                                className={`sv-hdr-toggle-btn${activeTool === "summary" ? " active" : ""}`}
                                onClick={() => setActiveTool("summary")}
                                title="Essentials"
                              >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                                Essentials
                              </button>
                              <button
                                id="studybar-mode-detailed"
                                type="button"
                                role="radio"
                                aria-checked={activeTool === "detailed"}
                                className={`sv-hdr-toggle-btn${activeTool === "detailed" ? " active" : ""}`}
                                onClick={() => setActiveTool("detailed")}
                                title="In-depth"
                              >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v4l2 2"/></svg>
                                In-depth
                              </button>
                            </div>
                            {/* Read Aloud — inline, right of mode buttons */}
                            <div style={{ width: '1px', height: '20px', background: '#E2DDD3', margin: '0 4px', alignSelf: 'center', flexShrink: 0 }} />
                            <ReadAloudBar
                              key={`${persona}-${activeTool}`}
                              text={readAloudProcessedText}
                              subjectId={subjectId}
                              persona={persona}
                              onPlay={() => {
                                if (window.innerWidth < 768) {
                                  setIsSidebarOpen(false);
                                }
                              }}
                              onHighlightChange={handleHighlightChange}
                              activeTool={activeTool}
                              onSwitchTool={setActiveTool}
                              isPurpleTheme={false}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ display: "flex", alignItems: "center", width: "200px" }}>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        {!isMoocMode && !["videos", "pyq", "summary", "detailed", "assessment", "flashcards", "revision_flashcards", "ask", "foundation", "study_plan"].includes(activeTool) && (
                          <h1 className="st-page-title" style={{ margin: 0, fontSize: "1.6rem" }}>
                            {TOOL_LABELS[activeTool]}
                          </h1>
                        )}
                        {activeTool !== "foundation" && (
                          activeTool === "mindmap" ? (
                            activeNodeTitle && (
                              <div className="st-page-subtitle-row" style={{ marginTop: '2px' }}>
                                <span className="st-page-subtitle" style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', fontWeight: 500 }}>
                                  {activeNodeTitle}
                                </span>
                              </div>
                            )
                          ) : (activeTool === "pyq") ? null : (
                            !isMoocMode && (
                              <div className="st-page-subtitle-row" style={{ marginTop: '2px' }}>
                                <span className="st-page-subtitle" style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', fontWeight: 500 }}>
                                  {getChapterPrefix(subjectId)} {chapterNumber}: {chapterName}
                                </span>
                              </div>
                            )
                          )
                        )}
                      </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", minWidth: "200px" }} />
                  </>
                )}
              </div>
            )}



            <div
              className={`st-mainview ${activeTool === "flashcards" || activeTool === "revision_flashcards" ? "st-mainview--flashcards" : ""}`}
              style={{
                flex: 1,
                minHeight: 0,
                display: "flex",
                flexDirection: "column",
                background:
                  activeTool === 'flashcards' || activeTool === 'revision_flashcards' ||
                    activeTool === 'assessment' || activeTool === 'summary' || activeTool === 'detailed' || activeTool === 'key_takeaways' || activeTool === 'study_plan' || activeTool === 'qbank' ||
                    activeTool === 'videos' || activeTool === 'podcasts' || activeTool === 'pyq' || activeTool === 'ask' || activeTool === 'mindmap' || activeTool === 'prep_exam'
                    ? 'transparent'
                    : '#ffffff',
                borderRadius: (activeTool === 'mocktest' || activeTool === 'pre_final_test' || activeTool === 'videos' || activeTool === 'podcasts' || activeTool === 'pyq' || activeTool === 'ask' || activeTool === 'prep_exam' || activeTool === 'key_takeaways' || activeTool === 'study_plan' || activeTool === 'qbank' || (activeTool === 'mindmap' && !mindmapTopicOpen)) ? '0px' : '6px',
                position: 'relative',
                border:
                  activeTool === 'mocktest' ||
                    activeTool === 'pre_final_test' ||
                    activeTool === 'prep_exam' ||
                    activeTool === 'flashcards' ||
                    activeTool === 'revision_flashcards' ||
                    activeTool === 'assessment' ||
                    activeTool === 'videos' ||
                    activeTool === 'podcasts' ||
                    activeTool === 'pyq' ||
                    activeTool === 'ask' ||
                    activeTool === 'key_takeaways' ||
                    activeTool === 'study_plan' ||
                    activeTool === 'qbank' ||
                    (activeTool === 'mindmap' && !mindmapTopicOpen) ||
                    activeTool === 'summary' ||
                    activeTool === 'detailed'
                    ? 'none'
                    : (activeTool === 'mindmap' && mindmapTopicOpen)
                      ? '1px solid #22c55e4D'
                      : '1px solid #E2E8F0',
                overflowX: 'hidden',
                overflowY:
                  activeTool === 'flashcards' || activeTool === 'revision_flashcards' ||
                    activeTool === 'ask' || activeTool === 'videos' || (activeTool === 'mindmap' && !mindmapTopicOpen)
                    ? 'hidden'
                    : 'auto',
                paddingTop:
                  (activeTool === 'mocktest' || activeTool === 'pre_final_test' || activeTool === 'ask' || activeTool === 'prep_exam' || activeTool === 'podcasts' || activeTool === 'pyq')
                    ? '0px'
                    : (activeTool === 'flashcards' || activeTool === 'revision_flashcards')
                      ? '0px'
                      : activeTool === 'assessment'
                        ? '0px'
                        : activeTool === 'videos'
                          ? '4px'
                          : activeTool === 'deep_dive'
                            ? '8px'
                            : activeTool === 'summary' || activeTool === 'detailed' || activeTool === 'key_takeaways' || activeTool === 'study_plan' || activeTool === 'qbank' || activeTool === 'mindmap'
                              ? '0px'
                              : '20px',
                paddingRight: (activeTool === 'flashcards' || activeTool === 'revision_flashcards' || activeTool === 'assessment' || activeTool === 'ask' || activeTool === 'key_takeaways' || activeTool === 'study_plan' || activeTool === 'qbank' || activeTool === 'prep_exam' || activeTool === 'podcasts' || activeTool === 'pyq' || activeTool === 'mindmap' || activeTool === 'summary' || activeTool === 'detailed') ? '0px' : '16px',
                paddingBottom: (activeTool === 'flashcards' || activeTool === 'revision_flashcards' || activeTool === 'assessment' || activeTool === 'ask' || activeTool === 'key_takeaways' || activeTool === 'study_plan' || activeTool === 'qbank' || activeTool === 'mindmap' || activeTool === 'prep_exam' || activeTool === 'podcasts' || activeTool === 'pyq') ? '0px' : activeTool === 'videos' ? '8px' : '16px',
                paddingLeft: (activeTool === 'flashcards' || activeTool === 'revision_flashcards' || activeTool === 'assessment' || activeTool === 'ask' || activeTool === 'key_takeaways' || activeTool === 'study_plan' || activeTool === 'qbank' || activeTool === 'prep_exam' || activeTool === 'podcasts' || activeTool === 'pyq' || activeTool === 'mindmap' || activeTool === 'summary' || activeTool === 'detailed') ? '0px' : '16px',
              }}
            >
              {renderContent()}
            </div>
          </div>
        </div>
      </main>

      {/* Floating or Sliding AI Tutor Drawer */}
      {isAskOpen && (
        <aside
          className="ask-sidebar-drawer"
          style={{
            width: "410px",
            minWidth: "340px",
            borderLeft: "1px solid #EAE4D7",
            background: "#FAF8F3",
            display: "flex",
            flexDirection: "column",
            height: "100%",
            zIndex: 50,
            boxShadow: "-6px 0 24px rgba(30, 40, 34, 0.08)",
            animation: "slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          <style>{`
            @keyframes slideInRight {
              from { transform: translateX(100%); }
              to { transform: translateX(0); }
            }
          `}</style>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "14px 18px",
              borderBottom: "1px solid #EAE4D7",
              background: "#FAF8F3",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  background: "#FBF4EE",
                  border: "1px solid #EBD5C3",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#BD7D52",
                  fontSize: "14px",
                  flexShrink: 0,
                }}
              >
                ✦
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 800, color: "#1E2822" }}>
                  Saral · 24/7 Learning Assistant
                </h3>
                <span style={{ fontSize: "11.5px", color: "#BD7D52", fontWeight: 600 }}>
                  Grounded in your {getChapterPrefix(subjectId)} {chapterNumber} material
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsAskOpen(false)}
              style={{
                background: "#FFFFFF",
                border: "1px solid #E5DFD2",
                cursor: "pointer",
                fontSize: "13px",
                color: "#5C6660",
                width: "28px",
                height: "28px",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              title="Close Saral Assistant"
            >
              ✕
            </button>
          </div>
          <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <Suspense fallback={<StudyToolLoadingWaitScreen />}>
              <AskBotView
                chapterName={chapterName}
                subjectId={subjectId}
                chapterNumber={chapterNumber}
                difficulty={persona}
                className={className}
                subjectName={subjectName}
                isCompactDrawer={true}
                onNavigateTool={(tool) => {
                  setIsAskOpen(false);
                  setActiveTool(tool as any);
                }}
              />
            </Suspense>
          </div>
        </aside>
      )}

    </div>
  );
}

