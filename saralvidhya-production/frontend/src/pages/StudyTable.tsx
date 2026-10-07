import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import MarkdownView from "@/components/MarkdownView";
import JsMindView from "@/components/JsMindView";
import MermaidView from "@/components/MermaidView";
import FlashcardsView from "@/components/FlashcardsView";
import QuestionBankView from "@/components/QuestionBankView";
import type { ToolId } from "@/components/ToolsMenu";
import appLogo from "@/logo.png";
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
  type Chapter,
  type ChapterVideo,
} from "@/data/contentRepository";
import { truncateMindmapToLevels } from "@/data/markdownService";
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
import MasterFlashcardsView from "@/components/MasterFlashcardsView";

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
import AskBotView from "@/components/study/AskBotView";
import PodcastsView from "@/components/study/PodcastsView";
import PYQView from "@/components/study/PYQView";
import MockTestView from "@/components/study/MockTestView";
import VideosView from "@/components/study/VideosView";
import { AssessmentView } from "@/components/study/AssessmentView";
import SwotView from "@/components/study/SwotView";
import LeaderboardView from "@/components/study/LeaderboardView";


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
  if (sessionStorage.getItem("sv_moocs_mode") === "true") return "Unit";
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

export default function StudyTable() {
  // Mindmap inline topic view (no popup — content shown in-place below the map)
  const [mindmapTopicTitle, setMindmapTopicTitle] = useState<string | null>(null);
  const [mindmapTopicContent, setMindmapTopicContent] = useState<string | null>(null);
  const [mindmapDetailedContent, setMindmapDetailedContent] = useState<string | null>(null);
  const [mindmapInlineTab, setMindmapInlineTab] = useState<'quick' | 'detailed'>('quick');
  const [mindmapTopicOpen, setMindmapTopicOpen] = useState(false);
  const [mindmapInlineType, setMindmapInlineType] = useState<'text' | 'video' | 'audio'>('text');
  const [mindmapMediaUrl, setMindmapMediaUrl] = useState<string>('');
  // For microcast inline: which ANGRAU microcast index maps to this topic
  const [mindmapMicrocastIdx, setMindmapMicrocastIdx] = useState<number>(0);
  // Foundation tool: toggle between "mindmap" and "study_plan" sub-tabs
  const [foundationTab, setFoundationTab] = useState<'mindmap' | 'study_plan'>('mindmap');
  const [foundationMindmapContent, setFoundationMindmapContent] = useState<string>('');
  const [foundationStudyPlanContent, setFoundationStudyPlanContent] = useState<string>('');
  const [foundationLoading, setFoundationLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const subjectId = searchParams.get("sId") || searchParams.get("subjectId") || "english";
  const treeLogoSrc = subjectId?.startsWith('neb_')
    ? `${import.meta.env.BASE_URL}neb-logo.png`
    : `${import.meta.env.BASE_URL}brand-logo.png`;
  const isMoocMode = sessionStorage.getItem('sv_moocs_mode') === 'true';

  const className = searchParams.get("className") || "Class";
  const subjectName = searchParams.get("subjectName") || "Subject";
  const semesterName = searchParams.get("semesterName") || "";
  const personaRaw = searchParams.get("persona") || "intermediate";
  const [persona, setPersonaState] = useState<DifficultyLevel>(
    PERSONA_TO_LEVEL[personaRaw] || "intermediate",
  );

  // Clean query strings logic removed to fix refresh state persistence

  const setPersona = (level: DifficultyLevel) => {
    // Stop any active TTS/audio before switching persona
    googleTtsStop();
    trackPersonaChange(persona, level);
    setPersonaState(level);
    setSearchParams(prev => { prev.set("persona", level); return prev; }, { replace: true });
  };

  const PERSONAS: { key: DifficultyLevel; label: string; imgSrc: string }[] = [
    { key: "beginner", label: "Beginner", imgSrc: "/personas/beginner.png" },
    {
      key: "intermediate",
      label: "Intermediate",
      imgSrc: "/personas/intermediate.png",
    },
    { key: "advanced", label: "Advanced", imgSrc: "/personas/advanced.png" },
  ];

  const [chapterNumberState, setChapterNumberState] = useState<number>(() => {
    return parseInt(searchParams.get("chapter") || "1", 10) || 1;
  });
  const chapterNumber = chapterNumberState;
  const setChapterNumber = (num: number) => setChapterNumberState(num);
  const chapterName =
    searchParams.get("chapterName") || `Chapter ${chapterNumber}`;

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
    if (fromUrl === "foundation") return "summary";
    return fromUrl || "summary";
  });
  const [isAskOpen, setIsAskOpen] = useState(false);
  const [autoResumeTrack, setAutoResumeTrack] = useState<
    "long" | "short" | null
  >(null);

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
    setIsToolTransitioning(true);
    setTimeout(() => {
      setIsToolTransitioning(false);
    }, 1100);
  };

  // `completedOverride` lets a caller that just marked a step done unlock the
  // next one in the same tick, before the completedTools state has re-rendered.
  const setActiveTool = (tool: ToolId, completedOverride?: ToolId[]) => {
    const completed = completedOverride ?? completedTools;
    if (tool !== activeTool) {
      triggerToolTransition(tool);
    }
    setActiveToolState(tool);
    setSearchParams(prev => { prev.set("tool", tool); return prev; }, { replace: true });
    trackToolUsage({
      tool,
      subjectId,
      chapterNumber,
      chapterName: `Chapter ${chapterNumber}`,
    });
  };

  const [subjectChapters, setSubjectChapters] = useState<Chapter[]>([]);

  useEffect(() => {
    if (!subjectId) return;
    getManifest().then((m) => {
      const list = getChapters(m, subjectId);
      setSubjectChapters(list);
    });
  }, [subjectId]);

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
  const [isToolbarOpen, setIsToolbarOpen] = useState(true);
  const [isToolbarPinned, setIsToolbarPinned] = useState(false);
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
        const container = document.querySelector('.sv-rail-items');
        const activeItem = document.querySelector('.sv-rail-item.active');
        if (container && activeItem) {
          activeItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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
    setReadingHighlight({ active: false, startWord: -1, endWord: -1 });
  }, [persona]);

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
    () => localStorage.getItem("app_authenticated") === "true",
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

  const handleSendMiniAsk = () => {
    if (!miniAskInput.trim() || miniIsLoading) return;
    const userQ = miniAskInput.trim();
    setMiniAskInput("");
    setMiniMessages((prev) => [...prev, { role: 'user', content: userQ }]);
    setMiniIsLoading(true);

    setTimeout(() => {
      setMiniMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `I'm here to help with "${userQ}" in ${chapterName || 'this chapter'}! Feel free to ask more or review the lesson materials.`
        }
      ]);
      setMiniIsLoading(false);
    }, 600);
  };

  const handleAuthClick = () => {
    if (isAuthenticated) {
      localStorage.removeItem("app_authenticated");
      localStorage.removeItem("app_role");
      setIsAuthenticated(false);
      navigate("/login", { replace: true });
      return;
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

    // Pass the real subjectId for all tools — each tool handles subject routing itself
    const internalSubId = subjectId;

    if (activeTool === "summary") {
      getResourceContent(internalSubId, chapterNumber, "summary.md", persona, activeVideoDir)
        .then(apply)
        .catch(() => apply("Summary content unavailable for this persona."));
    } else if (activeTool === "key_takeaways") {
      getResourceContent(internalSubId, chapterNumber, "key_takeaways.md", persona, activeVideoDir)
        .then(apply)
        .catch(() => apply("Key Takeaways not available for this chapter."));
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
    } else if (activeTool === "flashcards") {
      getFlashcards(internalSubId, chapterNumber, persona, activeVideoDir)
        .then(apply)
        .catch(() => apply([]));
    } else if (activeTool === "revision_flashcards") {
      getFlashcards(internalSubId, chapterNumber, persona, activeVideoDir)
        .then((cards) => {
          const taggedCards = (cards || []).map(c => ({ ...c, level: persona }));

          // Random shuffle for Revision Flashcards
          for (let i = taggedCards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [taggedCards[i], taggedCards[j]] = [taggedCards[j], taggedCards[i]];
          }
          apply(taggedCards);
        })
        .catch(() => apply([]));
    } else if (activeTool === "mindmap") {
      getResourceContent(internalSubId, chapterNumber, "mindmap.md", persona)
        .then(apply)
        .catch(() => apply(""));
    } else if (activeTool === "foundation") {
      // Foundation: load Mind Maps + Study Plan from Foundation/ folder (ANGRAU chapters 3 & 4)
      const isAngrauFoundation = (internalSubId === "ento_131") && (chapterNumber === 3 || chapterNumber === 4);
      if (isAngrauFoundation) {
        const chDir = `chapter_0${chapterNumber}`;
        const base = `/generated_resources/angrau/${chDir}/Foundation`;
        const mmFile = chapterNumber === 3
          ? `${base}/Mind%20Maps/Lec_5_Weathering_Mindmap.md`
          : `${base}/Mind%20Maps/Pollination_Mindmap.md`;
        const spFile = `${base}/Study%20Plan/study_plan.md`;
        setFoundationLoading(true);
        Promise.all([
          fetch(mmFile, { cache: "no-cache" }).then(r => r.ok ? r.text() : "Mind map not available.").catch(() => "Mind map not available."),
          fetch(spFile, { cache: "no-cache" }).then(r => r.ok ? r.text() : "Study plan not available.").catch(() => "Study plan not available."),
        ]).then(([mm, sp]) => {
          if (stale) return;
          setFoundationMindmapContent(mm);
          setFoundationStudyPlanContent(sp);
          setFoundationLoading(false);
        });
        apply(""); // no regular content needed
      } else {
        // Fallback: behave like mindmap for other subjects
        getResourceContent(internalSubId, chapterNumber, "mindmap.md", persona)
          .then(apply)
          .catch(() => apply(""));
      }
    } else if (activeTool === "qbank" || activeTool === "assessment") {
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
      case "key_takeaways":
      case "detailed": {
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
          <div className="markdown-container" style={{ position: 'relative' }}>
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
            />
          </div>
        );
      }
      case "mindmap": {
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
                    />
                  ) : (
                    <MarkdownView content={sections.flashcards} />
                  )
                ) : (
                  <MarkdownView content={sectionContent} />
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
          const match = raw.match(/```mermaid([\s\S]*?)```/);
          if (match) return '```mermaid' + match[1] + '```';
          // Already raw mermaid (no fences)
          if (raw.trim().startsWith('mindmap')) return raw;
          return raw;
        }

        const rawMermaid = isNebBiologyChap6
          ? hardcodedMindmap
          : extractMermaidBlock(typeof content === "string" ? content : "");
        // mermaidContent computed below after ANGRAU config (needs buildAngrauMermaid)

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
          }
        };

        // ── ANGRAU mindmap config ────────────────────────────────────────────
        const isAngrau = subjectId === 'ento_131';

        // Each topic: exact display label (= node text = lookup key), file number, podcast file
        type AngrauTopic = { label: string; topicNum: number; podcastFile: string };
        const ANGRAU_CHAPTER_CONFIG: Record<number, {
          chapterTitle: string;
          quickFolder: string;
          detailedFolder: string;
          topics: AngrauTopic[];
        }> = {
          1: {
            chapterTitle: 'Insect Digestive System',
            quickFolder: 'Digestive_system_quick_Topic_Level',
            detailedFolder: 'Digestive_system_detailed_Topic_Level',
            topics: [
              { label: 'Three Primary Gut Regions',              topicNum: 1, podcastFile: '1. Anatomy of the three-part insect gut' },
              { label: 'Salivary Glands & Specialised Secretions', topicNum: 2, podcastFile: '2. Inside the Insect Foregut and Gizzard' },
              { label: 'Specialized Physiological Adaptations',  topicNum: 3, podcastFile: '3. How Insect Digestion Activates Bt Toxins' },
              { label: 'Excretory Integration & Gut Renewal',    topicNum: 4, podcastFile: '4. How insects recycle water from waste' },
            ],
          },
          2: {
            chapterTitle: 'Metamorphosis & Diapause',
            quickFolder: 'Metamorphosis_quick_Topic_Level',
            detailedFolder: 'Metamorphosis_detailed_Topic_Level',
            topics: [
              { label: 'Morphogenesis Framework',         topicNum: 1, podcastFile: '1.Three Categories of Insect Metamorphosis' },
              { label: 'Types of Metamorphosis',          topicNum: 2, podcastFile: '2.Identify Insect Larvae to Protect Crops' },
              { label: 'Immature & Pupal Classifications',topicNum: 3, podcastFile: '3.Insect pupal structures and escape tactics' },
              { label: 'Hypermetamorphosis',              topicNum: 4, podcastFile: '4.Blister beetles live multiple larval lives' },
              { label: 'Endocrine Regulation',            topicNum: 5, podcastFile: '5.Controlling Pests with Hormones and Diapause' },
              { label: 'Diapause & Dormancy',             topicNum: 6, podcastFile: '6.Predicting insect diapause for crop protection' },
            ],
          },
          3: {
            chapterTitle: 'Weathering of Rocks and Minerals',
            quickFolder: 'Weathering_quick_Topic_Level',
            detailedFolder: 'Weathering_Detailed_Topic_Level',
            topics: [
              { label: 'Fundamentals & Regolith Genesis',          topicNum: 1, podcastFile: '1. How weathering transforms bedrock into regolith' },
              { label: 'Physical Weathering (Mechanical Agents)',   topicNum: 2, podcastFile: '2. Mechanical forces breaking down Indian landscapes' },
              { label: 'Biological Weathering (Living Agents)',     topicNum: 3, podcastFile: '3. How life turns solid rock into soil' },
              { label: 'Synthesis & Quantitative Summary',          topicNum: 4, podcastFile: '4. Mathematical Forces Turning Rock into Soil' },
            ],
          },
          4: {
            chapterTitle: 'Pollination, Pollinizers & Parthenocarpy',
            quickFolder: 'Pollination_Quick_Topic_Level',
            detailedFolder: 'Pollination_detailed_Topic_Level',
            topics: [
              { label: 'Fundamentals of Floral Biology & Pollination Anatomy',     topicNum: 1, podcastFile: '1. Floral architecture and double fertilization' },
              { label: 'Self-Pollination (Autogamy) & Inbreeding Mechanisms',      topicNum: 2, podcastFile: '2. Self-Pollination Mechanisms in Indian Crops' },
              { label: 'Cross-Pollination (Allogamy / Xenogamy) & Outcrossing',   topicNum: 3, podcastFile: '3.How Indian crops force cross pollination' },
              { label: 'Pollinators & Pollination Vectors (Abiotic & Biotic)',     topicNum: 4, podcastFile: '4.How nature pollinates India_s crops' },
              { label: 'Pollinizers & Orchard Layout Management',                  topicNum: 5, podcastFile: '5. Choosing and Arranging Orchard Pollinizers' },
              { label: 'Parthenocarpy (Seedless Fruit Development)',               topicNum: 6, podcastFile: '6. How Parthenocarpy Creates Seedless Fruit' },
            ],
          },
        };

        const angrauChapCfg = isAngrau ? ANGRAU_CHAPTER_CONFIG[chapterNumber] : null;

        // Build mmIcons for ANGRAU: every topic node gets hasRead + hasPodcast
        const angrauMmIcons: Record<string, { hasRead?: boolean; hasVideo?: boolean; hasPodcast?: boolean }> = {};
        if (angrauChapCfg) {
          for (const t of angrauChapCfg.topics) {
            // Register with both exact label and lowercase — MermaidView uses the node text directly
            angrauMmIcons[t.label] = { hasRead: true, hasPodcast: true };
            angrauMmIcons[t.label.toLowerCase()] = { hasRead: true, hasPodcast: true };
          }
        }

        // For ANGRAU: generate a clean mermaid directly from config instead of using the messy mindmap.md
        // This guarantees node labels exactly match the topic files.
        function buildAngrauMermaid(cfg: typeof angrauChapCfg): string {
          if (!cfg) return '';
          const lines = ['mindmap', `  root(("${cfg.chapterTitle}"))`];
          for (const t of cfg.topics) {
            lines.push(`    "${t.label}"`);
          }
          return lines.join('\n');
        }


        const mmIcons: Record<string, { hasRead?: boolean; hasVideo?: boolean; hasPodcast?: boolean }> = isAngrau && angrauChapCfg
          ? angrauMmIcons
          : isNebBiologyChap6 ? {
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
        } : (subjectId === 'ento_131' && chapterNumber === 1) ? {
          'Foregut / Stomodaeum': { hasPodcast: true },
          'Proventriculus Anatomy': { hasPodcast: true },
          'Symbiotic Digestion': { hasPodcast: true },
          'Termite Hindgut Fermentation': { hasPodcast: true },
          'Alkaline Midgut - Lepidoptera': { hasPodcast: true },
          'Bt Cry Toxin Mode of Action': { hasPodcast: true },
          'Rectal Pads - Water Recovery': { hasPodcast: true },
        } : (subjectId === 'ento_131' && chapterNumber === 3) ? {
          'Regolith Formation (Unconsolidated weathered mantle above bedrock)': { hasPodcast: true },
          'Physical Weathering (Mechanical disintegration into smaller fragments)': { hasPodcast: true },
          'Biological Weathering (Simultaneous disintegration and decomposition)': { hasPodcast: true },
          'Master Metric Reference Matrix': { hasPodcast: true },
        } : (subjectId === 'ento_131' && chapterNumber === 4) ? {
          '1. Fundamentals of Floral Biology & Pollination Anatomy': { hasPodcast: true },
          '2. Self-Pollination (Autogamy) & Inbreeding Mechanisms': { hasPodcast: true },
          '3. Cross-Pollination (Allogamy / Xenogamy) & Outcrossing Adaptations': { hasPodcast: true },
          '4. Pollinators & Pollination Vectors (Abiotic & Biotic Zoophily)': { hasPodcast: true },
          '5. Pollinizers & Orchard Layout Management': { hasPodcast: true },
          '6. Parthenocarpy (Seedless Fruit Development)': { hasPodcast: true },
        } : {};

        for (const key of Object.keys(mmIcons)) {
          const mapped = MEDIA_MAPPING[key.toLowerCase().trim()];
          if (mapped) {
            if (mapped.ytId) mmIcons[key].hasVideo = true;
            if (mapped.audio) mmIcons[key].hasPodcast = true;
          }
        }

        // Compute the final mermaid content:
        // – ANGRAU: use the cleanly generated mermaid (no messy mindmap.md)
        // – Others: use the extracted mermaid block from the loaded file, truncated to 1 level
        const mermaidContent = isAngrau && angrauChapCfg
          ? buildAngrauMermaid(angrauChapCfg)
          : truncateMindmapToLevels(rawMermaid, 2);

        const handleTopicClick = async (label: string, action?: 'read' | 'podcast' | 'video') => {
          setMindmapTopicTitle(label);
          const lowerLabel = label.toLowerCase().trim();

          // ── ANGRAU path ──────────────────────────────────────────────────────
          if (isAngrau && angrauChapCfg) {
            const match = angrauChapCfg.topics.find(t => t.label.toLowerCase() === lowerLabel);
            if (!match) return; // root node or unmapped — ignore

            const base = `${import.meta.env.BASE_URL}generated_resources/angrau/mindmaps topic level`;
            const podcastBase = `${import.meta.env.BASE_URL}generated_resources/angrau/chapter_0${chapterNumber}/Podcasts`;

            if (action === 'podcast') {
              setMindmapInlineType('audio');
              setMindmapMediaUrl(`${podcastBase}/${match.podcastFile}.m4a`);
              // Store which microcast index this topic maps to (0-based)
              const mcIdx = angrauChapCfg.topics.indexOf(match);
              setMindmapMicrocastIdx(mcIdx >= 0 ? mcIdx : 0);
              setMindmapTopicOpen(true);
              return;
            }

            // Default: read (quick + detailed)
            setMindmapInlineType('text');
            try {
              const quickPath = `${base}/${angrauChapCfg.quickFolder}/quick_summary_topic${match.topicNum}.md`;
              const detailedPath = `${base}/${angrauChapCfg.detailedFolder}/detailed_summary_topic${match.topicNum}.md`;
              const [resQuick, resDetailed] = await Promise.all([
                fetch(quickPath, { cache: 'no-cache' }),
                fetch(detailedPath, { cache: 'no-cache' }),
              ]);
              const quickText = resQuick.ok ? await resQuick.text() : 'Quick content not found.';
              const detailedText = resDetailed.ok ? await resDetailed.text() : 'Detailed content not found.';
              setMindmapTopicContent(quickText);
              setMindmapDetailedContent(detailedText);
              setMindmapInlineTab('quick');
              setMindmapInlineType('text');
              setMindmapTopicOpen(true);
            } catch (e) {
              console.error('ANGRAU mindmap fetch error', e);
            }
            return;
          }

          // ── NEB Biology path ─────────────────────────────────────────────────
          if (!isNebBiologyChap6) return;
          const mappedMedia = MEDIA_MAPPING[lowerLabel];
          const mapped = MINDMAP_MAPPING[lowerLabel];

          if (action === 'video' && mappedMedia?.ytId) {
            setMindmapInlineType('video');
            setMindmapMediaUrl(`https://www.youtube.com/embed/${mappedMedia.ytId}?autoplay=1`);
            setMindmapTopicOpen(true);
            return;
          }

          if (action === 'podcast' && mappedMedia?.audio) {
            setMindmapInlineType('audio');
            setMindmapMediaUrl(`${import.meta.env.BASE_URL}generated_resources/neb_nepal/class_12/biology/chapter_06/Podcasts/${mappedMedia.audio}.mp3`);
            // Find the MC index for NEB Biology (index in MICROCASTS array)
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
            const nebIdx = nebMcNames.indexOf(mappedMedia.audio);
            setMindmapMicrocastIdx(nebIdx >= 0 ? nebIdx : 0);
            setMindmapTopicOpen(true);
            return;
          }

          setMindmapInlineType('text');

          if (mapped) {
            try {
              const basePathDetailed = `/generated_resources/neb_nepal/class_12/biology/chapter_06/Read/Detailed_Summary/${mapped.type === 'topic' ? 'Topic_Level' : 'SubTopic_Level'}/`;
              const basePathQuick = `/generated_resources/neb_nepal/class_12/biology/chapter_06/Read/Quick_Summary/${mapped.type === 'topic' ? 'Topic_Level' : 'SubTopic_Level'}/`;

              const detailedFilename = mapped.type === 'topic' ? `detailed_summary_topic${mapped.id}.md` : `subtopic${mapped.id}.md`;
              const quickFilename = mapped.type === 'topic' ? `quick_summary_topic${mapped.id}.md` : `subtopic${mapped.id}.md`;

              const [resDetailed, resQuick] = await Promise.all([
                fetch(basePathDetailed + detailedFilename, { cache: 'no-cache' }),
                fetch(basePathQuick + quickFilename, { cache: 'no-cache' })
              ]);

              let detailedText = resDetailed.ok ? await resDetailed.text() : "Detailed content not found for this topic.";
              let quickText = resQuick.ok ? await resQuick.text() : "Quick content not found for this topic.";

              detailedText = detailedText.replace(/\]\(images\//g, `](${basePathDetailed}images/`);
              detailedText = detailedText.replace(/src="images\//g, `src="${basePathDetailed}images/`);
              quickText = quickText.replace(/\]\(images\//g, `](${basePathQuick}images/`);
              quickText = quickText.replace(/src="images\//g, `src="${basePathQuick}images/`);

              setMindmapDetailedContent(detailedText);
              setMindmapTopicContent(quickText);
              setMindmapInlineTab('quick');
              setMindmapTopicOpen(true);
            } catch (e) {
              console.error(e);
            }
          }
        };


        // Compute next/prev topic for inline navigation (ANGRAU and NEB)
        const allTopicLabels: string[] = angrauChapCfg
          ? angrauChapCfg.topics.map(t => t.label)
          : [];
        const currentTopicIdx = allTopicLabels.indexOf(mindmapTopicTitle ?? '');
        const prevTopicLabel = currentTopicIdx > 0 ? allTopicLabels[currentTopicIdx - 1] : null;
        const nextTopicLabel = currentTopicIdx >= 0 && currentTopicIdx < allTopicLabels.length - 1
          ? allTopicLabels[currentTopicIdx + 1]
          : null;

        return (
          <div className="mindmap-container" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Map — hidden while a topic is open so only content fills the view */}
            {!mindmapTopicOpen && (
              <MermaidView content={mermaidContent} onTopicClick={handleTopicClick} nodeIcons={mmIcons} />
            )}

            {/* Inline topic panel — shown below the map, no popup */}
            {mindmapTopicOpen && (
              <div className="mm-concept-view" style={{ marginTop: 0 }}>
                {/* Top bar */}
                <div className="mm-concept-topbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'nowrap' }}>
                  {/* Left: back + prev */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                    <button
                      className="mm-back-btn"
                      onClick={() => { setMindmapTopicOpen(false); setMindmapTopicTitle(null); setMindmapInlineType('text'); setMindmapMediaUrl(''); }}
                    >
                      ← Mindmap
                    </button>
                    {prevTopicLabel && (
                      <button
                        className="mm-next-topic-btn"
                        onClick={() => handleTopicClick(prevTopicLabel, mindmapInlineType === 'audio' ? 'podcast' : 'read')}
                        title={prevTopicLabel}
                      >
                        ← Prev: {prevTopicLabel.length > 18 ? `${prevTopicLabel.slice(0, 16)}…` : prevTopicLabel}
                      </button>
                    )}
                  </div>

                  {/* Center: topic title */}
                  <span style={{ fontWeight: 700, fontSize: '15px', color: '#1e293b', textAlign: 'center', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {mindmapTopicTitle}
                  </span>

                  {/* Right: next */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', flexShrink: 0 }}>
                    {nextTopicLabel && (
                      <button
                        className="mm-next-topic-btn"
                        onClick={() => handleTopicClick(nextTopicLabel, mindmapInlineType === 'audio' ? 'podcast' : 'read')}
                        title={nextTopicLabel}
                      >
                        Next: {nextTopicLabel.length > 18 ? `${nextTopicLabel.slice(0, 16)}…` : nextTopicLabel} →
                      </button>
                    )}
                  </div>
                </div>

                {/* Tab bar for text mode */}
                {mindmapInlineType === 'text' && (
                  <div className="mm-section-tabs">
                    <button
                      className={`mm-tab-btn${mindmapInlineTab === 'quick' ? ' active' : ''}`}
                      onClick={() => setMindmapInlineTab('quick')}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                          <path d="M4 19.5C4 18.837 4.26339 18.2011 4.73223 17.7322C5.20107 17.2634 5.83696 17 6.5 17H20" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M6.5 2H20V22H6.5C5.83696 22 5.20107 21.7366 4.73223 21.2678C4.26339 20.7989 4 20.163 4 19.5V4.5C4 3.83696 4.26339 3.20107 4.73223 2.73223C5.20107 2.26339 5.83696 2 6.5 2V2Z" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Essentials
                      </span>
                    </button>
                    <button
                      className={`mm-tab-btn${mindmapInlineTab === 'detailed' ? ' active' : ''}`}
                      onClick={() => setMindmapInlineTab('detailed')}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                          <path d="M9 12h6M9 16h6M5 4h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        In-depth
                      </span>
                    </button>
                  </div>
                )}

                {/* Content */}
                <div className="mm-concept-content">
                  {mindmapInlineType === 'text' && (
                    /* Reading gutter — centred column with generous side padding for comfortable line lengths */
                    <div style={{
                      maxWidth: '72ch',
                      margin: '0 auto',
                      padding: '32px 48px 48px',
                    }}>
                      <MarkdownView content={mindmapInlineTab === 'quick' ? mindmapTopicContent : mindmapDetailedContent} />
                    </div>
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
      case "foundation": {
        const isAngrauFoundation = (subjectId === "ento_131") && (chapterNumber === 3 || chapterNumber === 4);
        if (!isAngrauFoundation) {
          // Fallback: render as normal mindmap
          const mermaidContent = typeof content === "string" ? content : "";
          return (
            <div className="mindmap-container" style={{ position: "relative" }}>
              <MermaidView content={mermaidContent} onTopicClick={() => {}} nodeIcons={{}} />
            </div>
          );
        }
        if (foundationLoading) {
          return <StudyToolLoadingWaitScreen />;
        }
        return (
          <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
            {/* Toggle Header */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "12px 20px",
              borderBottom: "1px solid #e2e8f0",
              background: "linear-gradient(135deg, #f8fafc 0%, #f0f9ff 100%)",
              flexShrink: 0,
            }}>
              {/* Pill Toggle */}
              <div style={{
                display: "flex",
                background: "#e2e8f0",
                borderRadius: "999px",
                padding: "3px",
                gap: "2px",
              }}>
                <button
                  onClick={() => setFoundationTab("mindmap")}
                  style={{
                    padding: "6px 20px",
                    borderRadius: "999px",
                    border: "none",
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: "0.875rem",
                    transition: "all 0.18s ease",
                    background: foundationTab === "mindmap" ? "#fff" : "transparent",
                    color: foundationTab === "mindmap" ? "#2563eb" : "#64748b",
                    boxShadow: foundationTab === "mindmap" ? "0 1px 4px rgba(0,0,0,0.12)" : "none",
                  }}
                >
                  🧠 Mind Maps
                </button>
                <button
                  onClick={() => setFoundationTab("study_plan")}
                  style={{
                    padding: "6px 20px",
                    borderRadius: "999px",
                    border: "none",
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: "0.875rem",
                    transition: "all 0.18s ease",
                    background: foundationTab === "study_plan" ? "#fff" : "transparent",
                    color: foundationTab === "study_plan" ? "#2563eb" : "#64748b",
                    boxShadow: foundationTab === "study_plan" ? "0 1px 4px rgba(0,0,0,0.12)" : "none",
                  }}
                >
                  📅 Study Plan
                </button>
              </div>
            </div>
            {/* Content Area */}
            <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
              {foundationTab === "mindmap" ? (
                <div style={{ padding: "20px" }}>
                  <MarkdownView content={truncateMindmapToLevels(foundationMindmapContent || "", 2) || "Mind map not available."} />
                </div>
              ) : (
                <div style={{ padding: "20px" }}>
                  <MarkdownView content={foundationStudyPlanContent || "Study plan not available."} />
                </div>
              )}
            </div>
          </div>
        );
      }
      case "flashcards":
        return Array.isArray(content) && content.length > 0 ? (
          <FlashcardsView
            key={`flashcards-${videoIndex}-${persona}`}
            cards={content}
            subjectId={subjectId}
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
            persona={persona}
            isPurpleTheme={true}
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
        return <MarkdownView content={typeof content === "string" ? content : ""} />;
      case "ask":
        return (
          <AskBotView
            chapterName={chapterName}
            subjectId={subjectId}
            chapterNumber={chapterNumber}
            difficulty={persona}
            className={className}
            subjectName={subjectName}
          />
        );
      case "podcasts":
        return (
          <PodcastsView
            chapterName={chapterName}
            subjectId={subjectId}
            chapterNumber={chapterNumber}
            persona={persona}
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
    mindmap: "Mindmap",
    foundation: "Foundation",
    flashcards: "Flashcards",
    podcasts: "Podcasts",
    videos: "Videos",
    ask: "Ask",
    assessment: "Assessments",
    qbank: "Question Bank",
    swot: "SWOT Analysis",
    pyq: "PYQ",
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
    return renderMainContent();
  };

  const getToolTheme = (toolId: ToolId) => {
    switch (toolId) {
      case "detailed":
        return { bg: "#dcfce7", gradient: "linear-gradient(90deg, #22c55e 0%, #15803d 100%)", shadow: "0 4px 12px rgba(21, 128, 61, 0.45)" };
      case "summary": case "podcasts": case "videos": case "mindmap": case "foundation":
        return { bg: "#f0fdf4", gradient: "linear-gradient(90deg, #22c55e 0%, #16a34a 100%)", shadow: "0 4px 12px rgba(34, 197, 94, 0.45)" };
      case "revision_flashcards": case "assessment": case "qbank":
        return { bg: "#faf5ff", gradient: "linear-gradient(90deg, #a855f7 0%, #9333ea 100%)", shadow: "0 4px 12px rgba(168, 85, 247, 0.45)" };
      case "pyq": case "prep_exam":
        return { bg: "#fdf2f8", gradient: "linear-gradient(90deg, #f43f5e 0%, #e11d48 100%)", shadow: "0 4px 12px rgba(244, 63, 94, 0.45)" };
      case "swot":
        return { bg: "#fff7ed", gradient: "linear-gradient(90deg, #f97316 0%, #ea580c 100%)", shadow: "0 4px 12px rgba(249, 115, 22, 0.45)" };
      case "deep_dive": case "ask":
        return { bg: "#fffbeb", gradient: "linear-gradient(90deg, #d97706 0%, #b45309 100%)", shadow: "0 4px 12px rgba(217, 119, 6, 0.45)" };
      default:
        return { bg: "#ffffff", gradient: "linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)", shadow: "0 4px 12px rgba(37, 99, 235, 0.45)" };
    }
  };
  const activeToolTheme = getToolTheme(activeTool);

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
          {/* Study Toolbar (MVP Project) */}
          {activeTool !== "mocktest" && activeTool !== "pre_final_test" && (
            <div
              className="study-toolbar-wrapper"
              style={{
                position: "relative",
                width: "100%",
                flexShrink: 0,
                background: "#ffffff",
                borderBottom: isToolbarOpen ? "1px solid #e2e8f0" : "none",
                boxShadow: isToolbarOpen ? "0 10px 30px rgba(15, 23, 42, 0.15)" : "none",
                zIndex: 100,
                transition: "box-shadow 0.25s ease",
              }}
            >
              {/* Collapsible Content Drawer (GPU Accelerated 60fps) */}
              <div
                style={{
                  maxHeight: isToolbarOpen ? "160px" : "0px",
                  opacity: isToolbarOpen ? 1 : 0,
                  transform: isToolbarOpen ? "translate3d(0, 0, 0)" : "translate3d(0, -12px, 0)",
                  willChange: "transform, opacity, max-height",
                  overflow: "hidden",
                  transition: "max-height 0.3s cubic-bezier(0.16, 1, 0.3, 1), transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease",
                  padding: isToolbarOpen ? "2px 16px" : "0px 16px",
                  background: "#ffffff",
                }}
              >
                {(() => {
                  // Reflects the video currently being studied in a segmented
                  // chapter, so the rail shows that video's progress rather than
                  // a chapter-wide mix.
                  const unitCompleted = completedTools;
                  const learnThemeBg = persona === 'intermediate' ? '#0088FF33' : persona === 'advanced' ? '#0088FF4D' : '#0088FF1A';
                  const prepThemeBg = persona === 'intermediate' ? '#CB30E033' : persona === 'advanced' ? '#CB30E04D' : '#CB30E01A';
                  const detailedThemeBg = persona === 'intermediate' ? '#15803d4D' : persona === 'advanced' ? '#15803d66' : '#15803d33';
                  const TOOL_THEMES: Record<string, { main: string; badge: string; text: string; bg: string }> = {
                    videos: { main: "#0088FF", badge: "#0088FF", text: "#0088FF", bg: learnThemeBg },
                    flashcards: { main: "#0088FF", badge: "#0088FF", text: "#0088FF", bg: learnThemeBg },
                    assessment: { main: "#0088FF", badge: "#0088FF", text: "#0088FF", bg: learnThemeBg },
                    summary: { main: "#0088FF", badge: "#0088FF", text: "#0088FF", bg: learnThemeBg },
                    quick_study: { main: "#0088FF", badge: "#0088FF", text: "#0088FF", bg: learnThemeBg },
                    key_takeaways: { main: "#16a34a", badge: "#16a34a", text: "#16a34a", bg: "#dcfce7" },
                    detailed: { main: "#15803d", badge: "#15803d", text: "#15803d", bg: detailedThemeBg },
                    detailed_notes: { main: "#15803d", badge: "#15803d", text: "#15803d", bg: detailedThemeBg },
                    mindmap: { main: "#0088FF", badge: "#0088FF", text: "#0088FF", bg: learnThemeBg },
                    foundation: { main: "#0088FF", badge: "#0088FF", text: "#0088FF", bg: learnThemeBg },


                    master_flashcards: { main: "#CB30E0", badge: "#CB30E0", text: "#CB30E0", bg: prepThemeBg },
                    revision_flashcards: { main: "#CB30E0", badge: "#CB30E0", text: "#CB30E0", bg: prepThemeBg },
                    revise: { main: "#CB30E0", badge: "#CB30E0", text: "#CB30E0", bg: prepThemeBg },
                    mocktest: { main: "#22C55E", badge: "#22C55E", text: "#16a34a", bg: "#f0fdf4" },
                    prep_test: { main: "#22C55E", badge: "#22C55E", text: "#16a34a", bg: "#f0fdf4" },
                    pre_final_test: { main: "#22C55E", badge: "#22C55E", text: "#16a34a", bg: "#f0fdf4" },
                    certification_exam: { main: "#22C55E", badge: "#22C55E", text: "#16a34a", bg: "#f0fdf4" },
                    qbank: { main: "#22C55E", badge: "#22C55E", text: "#16a34a", bg: "#f0fdf4" },
                    pyq: { main: "#ec4899", badge: "#ec4899", text: "#ec4899", bg: "#fce7f3" },
                    prep_exam: { main: "#ec4899", badge: "#ec4899", text: "#ec4899", bg: "#fce7f3" },
                    swot: { main: "#f59e0b", badge: "#f59e0b", text: "#d97706", bg: "#fffbeb" },
                    ask: { main: "#f59e0b", badge: "#f59e0b", text: "#d97706", bg: "#fffbeb" },
                  };

                  const getNodeIcon = (toolId: string, color: string, active: boolean) => {
                    switch (toolId) {
                      case "key_takeaways":
                        return (
                          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                            {/* Key bow (ring) */}
                            <circle cx="12" cy="13" r="6" stroke={color} strokeWidth="2.2" fill={color} fillOpacity="0.15" />
                            <circle cx="12" cy="13" r="2.5" fill={color} opacity="0.7" />
                            {/* Key shaft */}
                            <line x1="17" y1="16" x2="27" y2="26" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
                            {/* Key teeth */}
                            <line x1="22" y1="21" x2="22" y2="24" stroke={color} strokeWidth="2" strokeLinecap="round" />
                            <line x1="25" y1="24" x2="25" y2="27" stroke={color} strokeWidth="2" strokeLinecap="round" />
                          </svg>
                        );
                      case "mindmap":
                        return (
                          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                            <g stroke={color} strokeWidth="1.5">
                              <line x1="16" y1="6" x2="16" y2="2" />
                              <line x1="16" y1="26" x2="16" y2="30" />
                              <line x1="6" y1="16" x2="2" y2="16" />
                              <line x1="26" y1="16" x2="30" y2="16" />
                              <line x1="8.9" y1="8.9" x2="6.1" y2="6.1" />
                              <line x1="23.1" y1="8.9" x2="25.9" y2="6.1" />
                              <line x1="8.9" y1="23.1" x2="6.1" y2="25.9" />
                              <line x1="23.1" y1="23.1" x2="25.9" y2="25.9" />
                            </g>
                            <g fill={color} opacity="0.6">
                              <circle cx="16" cy="2" r="2" />
                              <circle cx="16" cy="30" r="2" />
                              <circle cx="2" cy="16" r="2" />
                              <circle cx="30" cy="16" r="2" />
                              <circle cx="6.1" cy="6.1" r="2" />
                              <circle cx="25.9" cy="6.1" r="2" />
                              <circle cx="6.1" cy="25.9" r="2" />
                              <circle cx="25.9" cy="25.9" r="2" />
                            </g>
                            <circle cx="16" cy="16" r="10" stroke={color} strokeWidth="1.5" fill={color} fillOpacity="0.1" />
                            <path d="M16 9C13 9 11 11 11 13C9 14 9 17 11 19C11 21 14 23 16 23C18 23 21 21 21 19C23 17 23 14 21 13C21 11 19 9 16 9Z" stroke={color} strokeWidth="1.5" />
                            <path d="M16 9V23" stroke={color} strokeWidth="1.5" />
                            <path d="M12 13C13 13 14 14 14 15" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
                            <path d="M20 13C19 13 18 14 18 15" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
                            <path d="M11 17C13 17 14 16 14 15" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
                            <path d="M21 17C19 17 18 16 18 15" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
                            <path d="M13 20C14 19 15 19 15 18" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
                            <path d="M19 20C18 19 17 19 17 18" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
                          </svg>
                        );
                      case "deep_dive":
                        return (
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                            <path d="M4 6h16M4 12h10M4 18h10" stroke={color} strokeWidth="2" strokeLinecap="round" />
                            <circle cx="17" cy="16" r="3.5" stroke={color} strokeWidth="1.5" />
                            <line x1="19.5" y1="18.5" x2="22" y2="21" stroke={color} strokeWidth="2" strokeLinecap="round" />
                          </svg>
                        );
                      case "pyq":
                        return (
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill={color} opacity="0.15" />
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke={color} strokeWidth="1.5" />
                            <polyline points="14 2 14 8 20 8" stroke={color} strokeWidth="1.5" />
                            <text x="7" y="16" fill={color} fontSize="6" fontWeight="bold" fontFamily="sans-serif">PYQ</text>
                          </svg>
                        );
                      case "videos":
                        return (
                          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                            <path d="M4 10C4 8.89543 4.89543 8 6 8H26C27.1046 8 28 8.89543 28 10V24C28 25.1046 27.1046 26 26 26H6C4.89543 26 4 25.1046 4 24V10Z" fill={color} opacity="0.8" />
                            <path d="M4 10C4 8.89543 4.89543 8 6 8H26C27.1046 8 28 8.89543 28 10V14H4V10Z" fill={color} />
                            <polygon points="10,8 14,8 11,14 7,14" fill="#ffffff" opacity="0.9" />
                            <polygon points="18,8 22,8 19,14 15,14" fill="#ffffff" opacity="0.9" />
                            <polygon points="13,16 21,20 13,24" fill="#ffffff" />
                          </svg>
                        );
                      case "podcasts":
                        return (
                          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                            <path d="M16 6C10.4772 6 6 10.4772 6 16V22C6 24.2091 7.79086 26 10 26H11V16H8C8 11.5817 11.5817 8 16 8C20.4183 8 24 11.5817 24 16H21V26H22C24.2091 26 26 24.2091 26 22V16C26 10.4772 21.5228 6 16 6Z" fill={color} opacity="0.8" />
                            <rect x="6" y="16" width="5" height="10" rx="2" fill={color} />
                            <rect x="21" y="16" width="5" height="10" rx="2" fill={color} />
                          </svg>
                        );
                      case "summary":
                      case "quick_study":
                        return (
                          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                            <path d="M16 8C16 8 13 4 8 4C4.68629 4 2 6.68629 2 10V26C2 26 5 22 8 22C12 22 16 26 16 26" fill={color} opacity="0.6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M16 8C16 8 19 4 24 4C27.3137 4 30 6.68629 30 10V26C30 26 27 22 24 22C20 22 16 26 16 26" fill={color} opacity="0.3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <line x1="16" y1="8" x2="16" y2="26" stroke={color} strokeWidth="2" strokeLinecap="round" />
                          </svg>
                        );
                      case "flashcards":
                      case "revision_flashcards":
                      case "revise":
                        return (
                          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                            <rect x="3" y="5" width="16" height="20" rx="3" fill="#F0ABFC" />
                            <rect x="7" y="3" width="16" height="20" rx="3" fill="#E879F9" />
                            <rect x="11" y="7" width="17" height="21" rx="3" fill="#C026D3" />
                            <line x1="15" y1="13" x2="23" y2="13" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
                            <line x1="15" y1="17" x2="20" y2="17" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="#FDE047" transform="scale(0.35) translate(40, -10)" />
                          </svg>
                        );
                      case "assessment":
                        return (
                          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                            <rect x="8" y="6" width="16" height="22" rx="3" fill="#F0ABFC" stroke="#C026D3" strokeWidth="2" strokeLinejoin="round" />
                            <path d="M12 4H20V8H12V4Z" fill="#E879F9" stroke="#C026D3" strokeWidth="2" strokeLinejoin="round" />
                            <path d="M12 16L15 19L20 13" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        );
                      case "qbank":
                        return (
                          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                            <rect x="6" y="10" width="16" height="18" rx="2" fill="#E879F9" stroke="#C026D3" strokeWidth="2" strokeLinejoin="round" />
                            <rect x="10" y="6" width="16" height="18" rx="2" fill="#F0ABFC" stroke="#C026D3" strokeWidth="2" strokeLinejoin="round" />
                            <path d="M18 12C18 12 21 12 21 14C21 16 18 17 18 19" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            <circle cx="18" cy="22" r="1.5" fill="#ffffff" />
                          </svg>
                        );
                      case "prep_exam":
                      case "prep_test":
                        return (
                          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                            <path d="M7 5C7 3.89543 7.89543 3 9 3H20L25 8V25C25 26.1046 24.1046 27 23 27H9C7.89543 27 7 26.1046 7 25V5Z" fill={color} fillOpacity="0.15" stroke={color} strokeWidth="2" />
                            <line x1="11" y1="9" x2="17" y2="9" stroke={color} strokeWidth="2" strokeLinecap="round" />
                            <circle cx="11" cy="15" r="1.5" fill={color} />
                            <line x1="14" y1="15" x2="20" y2="15" stroke={color} strokeWidth="2" strokeLinecap="round" />
                            <circle cx="11" cy="20" r="1.5" fill={color} />
                            <line x1="14" y1="20" x2="20" y2="20" stroke={color} strokeWidth="2" strokeLinecap="round" />
                          </svg>
                        );
                      case "mocktest":
                        return (
                          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                            <path d="M7 5C7 3.89543 7.89543 3 9 3H20L25 8V25C25 26.1046 24.1046 27 23 27H9C7.89543 27 7 26.1046 7 25V5Z" fill="#ffffff" stroke="#22C55E" strokeWidth="2" />
                            <line x1="11" y1="9" x2="17" y2="9" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" />
                            <line x1="11" y1="13" x2="21" y2="13" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" />
                            <circle cx="18" cy="20" r="4.5" fill="#ffffff" stroke="#22C55E" strokeWidth="2" />
                            <path d="M18 17.5V20L19.5 21" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M9 18L11 20L14 16" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <line x1="15" y1="18" x2="16" y2="18" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" />
                          </svg>
                        );
                      case "certification_exam":
                      case "pre_final_test":
                        return (
                          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                            <path d="M5 8C5 6.34315 6.34315 5 8 5H16V25H8C6.34315 25 5 23.6569 5 22V8Z" fill="#ffffff" stroke="#22C55E" strokeWidth="2" />
                            <path d="M27 8C27 6.34315 25.6569 5 24 5H16V25H24C25.6569 25 27 23.6569 27 22V8Z" fill="#ffffff" stroke="#22C55E" strokeWidth="2" />
                            <circle cx="22" cy="21" r="3.5" fill="#22C55E" />
                            <path d="M20.5 21L21.5 22L23.5 20" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M21 24.5L20 27L22 26L24 27L23 24.5" fill="#22C55E" />
                          </svg>
                        );
                      case "ask":
                        return (
                          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                            <path d="M16 4C9.37258 4 4 8.70557 4 14.5C4 17.6534 5.56843 20.4705 8.04618 22.3789C7.8 24.5 6.5 26.5 6.5 26.5C6.5 26.5 9.5 26.2 12.2 24.5C13.4074 24.8258 14.6806 25 16 25C22.6274 25 28 20.2944 28 14.5C28 8.70557 22.6274 4 16 4Z" fill="#ffffff" stroke="#F59E0B" strokeWidth="2" strokeLinejoin="round" />
                            <text x="13" y="15" fill="#F59E0B" fontSize="10" fontWeight="bold" fontFamily="sans-serif">?</text>
                            <circle cx="21" cy="18" r="4" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="1.5" />
                            <circle cx="21" cy="17" r="1.2" fill="#F59E0B" />
                            <path d="M19 20.8C19.5 20 22.5 20 23 20.8" stroke="#F59E0B" strokeWidth="1" strokeLinecap="round" />
                          </svg>
                        );
                      case "swot":
                        return (
                          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                            <rect x="4" y="20" width="6" height="8" rx="1" fill="#FDE68A" />
                            <rect x="13" y="12" width="6" height="16" rx="1" fill="#FCD34D" />
                            <rect x="22" y="6" width="6" height="22" rx="1" fill="#F59E0B" />
                            <path d="M4 16L12 8L20 14L30 2" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                          </svg>
                        );
                      case "foundation":
                        return (
                          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                            <circle cx="16" cy="16" r="12" stroke={color} strokeWidth="1.5" fill={color} fillOpacity="0.08" />
                            <circle cx="16" cy="16" r="2.5" fill={color} />
                            <polygon points="16,4 18,14 16,13.5 14,14" fill={color} opacity="0.9" />
                            <polygon points="16,28 14,18 16,18.5 18,18" fill={color} opacity="0.4" />
                            <polygon points="4,16 14,14 13.5,16 14,18" fill={color} opacity="0.4" />
                            <polygon points="28,16 18,18 18.5,16 18,14" fill={color} opacity="0.9" />
                            <text x="14.5" y="8" fill={color} fontSize="4" fontWeight="bold" fontFamily="sans-serif">N</text>
                          </svg>
                        );
                      default:
                        return (
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75">
                            <circle cx="12" cy="12" r="8" />
                          </svg>
                        );
                    }
                  };

                  const renderNode = (toolId: ToolId, labelOverride?: string, colorOverride?: string) => {
                    const isCompleted = unitCompleted.includes(toolId);
                    const locked = false;

                    const currentChapterManifest = subjectChapters?.find(ch => ch.number === chapterNumber);

                    const active = activeTool === toolId;
                    const theme = TOOL_THEMES[toolId] || { main: "#3b82f6", badge: "#3b82f6", text: "#2563eb", bg: "#eff6ff" };
                    const themeColor = colorOverride || theme.main;

                    return (
                      <div
                        key={toolId}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!locked) {
                            if (toolId === "mocktest") {
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
                          padding: '5px 12px',
                          borderRadius: '10px',
                          background: active ? '#ffffff' : 'transparent',
                          border: active ? `1.5px solid ${themeColor}` : '1.5px solid transparent',
                          boxShadow: active ? `0 2px 8px ${themeColor}25` : 'none',
                          cursor: locked ? 'not-allowed' : 'pointer',
                          opacity: active ? 1 : locked ? 0.35 : 0.38,
                          filter: active ? 'none' : 'blur(1.5px) grayscale(0.25)',
                          transition: 'all 0.2s ease, opacity 0.2s ease, filter 0.2s ease',
                          position: 'relative',
                          gap: '3px'
                        }}
                        title={labelOverride || GUIDED_LABELS[toolId]}
                        onMouseEnter={!active && !locked ? (e) => {
                          (e.currentTarget as HTMLDivElement).style.opacity = '1';
                          (e.currentTarget as HTMLDivElement).style.filter = 'none';
                        } : undefined}
                        onMouseLeave={!active && !locked ? (e) => {
                          (e.currentTarget as HTMLDivElement).style.opacity = '0.38';
                          (e.currentTarget as HTMLDivElement).style.filter = 'blur(1.5px) grayscale(0.25)';
                        } : undefined}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '32px' }}>
                          {getNodeIcon(toolId, themeColor, active)}
                        </div>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: active ? 700 : 500,
                          color: active ? themeColor : locked ? '#94A3B8' : '#334155',
                          textAlign: 'center',
                          lineHeight: '1.2',
                          whiteSpace: 'nowrap'
                        }}>
                          {labelOverride || GUIDED_LABELS[toolId]}
                        </span>
                      </div>
                    );
                  };

                  const renderLine = (isActiveOrCompleted: boolean, color: string = '#3b82f6') => (
                    <div style={{
                      width: '28px',
                      height: '1.5px',
                      background: '#CBD5E1',
                      marginTop: '18px',
                      zIndex: 1,
                      flexShrink: 0,
                      transition: 'background 0.3s ease'
                    }} />
                  );

                  return (
                    <div
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', overflowX: 'auto', padding: '4px 8px', gap: '12px' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* LEFT SIDE: LOGO */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                        <div
                          className="sv-rail-brand"
                          onClick={() => navigate("/")}
                          style={{ cursor: "pointer", display: "flex", alignItems: "center" }}
                        >
                          <img className="sv-brand-logo-img sv-study-rail-tree-logo" src={treeLogoSrc} alt="Saral Vidhya" />
                        </div>
                      </div>

                      {/* CENTER TOOL NODES */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', flex: 1, gap: '12px', padding: '0 12px' }}>
                        {/* Divider */}
                        <div style={{ width: '2.5px', height: '46px', background: 'rgba(148, 163, 184, 0.2)', alignSelf: 'flex-start', margin: '34px 16px 0 16px', flexShrink: 0, borderRadius: '2px' }} />

                        {/* 1. LEARN SECTION */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <div style={{ background: '#dcfce7', color: '#16a34a', fontSize: '12px', fontWeight: 700, padding: '3px 20px', borderRadius: '12px', marginBottom: '8px', textAlign: 'center', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>Learn</span>
                            {/* Three parallel tool sets exist in a segmented
                                chapter — say which video's is on screen. */}
                            {isSegmented && (
                              <span
                                title={activeVideo?.title}
                                style={{ background: '#16a34a', color: '#fff', borderRadius: '6px', padding: '0 7px', fontSize: '11px', fontWeight: 800 }}
                              >
                                Video {videoIndex}/{chapterVideos.length}
                              </span>
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {renderNode("summary", "Read", "#16a34a")}
                            {renderNode("podcasts", "Listen", "#16a34a")}
                            {renderNode("videos", "Watch", "#16a34a")}
                            {renderNode("mindmap", "Mindmap", "#16a34a")}
                            {renderNode("key_takeaways", "Key Takeaways", "#16a34a")}
                          </div>
                        </div>

                        {/* Divider */}
                        <div style={{ width: '2.5px', height: '46px', background: 'rgba(148, 163, 184, 0.2)', alignSelf: 'flex-start', margin: '34px 16px 0 16px', flexShrink: 0, borderRadius: '2px' }} />

                        {/* 2. PRACTICE SECTION */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <div style={{ background: '#f3e8ff', color: '#9333ea', fontSize: '12px', fontWeight: 700, padding: '3px 20px', borderRadius: '12px', marginBottom: '8px', textAlign: 'center' }}>Practice</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {renderNode("revision_flashcards", "Revise", "#9333ea")}
                            {renderNode("assessment", "Assessment", "#9333ea")}
                            {renderNode("qbank", "Question Bank", "#9333ea")}
                          </div>
                        </div>

                        {/* Divider */}
                        <div style={{ width: '2.5px', height: '46px', background: 'rgba(148, 163, 184, 0.2)', alignSelf: 'flex-start', margin: '34px 16px 0 16px', flexShrink: 0, borderRadius: '2px' }} />

                        {/* 3. PREPARE SECTION */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <div style={{ background: '#fce7f3', color: '#ec4899', fontSize: '12px', fontWeight: 700, padding: '3px 20px', borderRadius: '12px', marginBottom: '8px', textAlign: 'center' }}>Prepare</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {renderNode("pyq", "PYQ", "#ec4899")}
                            {renderNode("prep_exam", "Preparation Exam", "#ec4899")}
                          </div>
                        </div>

                        {/* Divider */}
                        <div style={{ width: '2.5px', height: '46px', background: 'rgba(148, 163, 184, 0.2)', alignSelf: 'flex-start', margin: '34px 16px 0 16px', flexShrink: 0, borderRadius: '2px' }} />

                        {/* 5. RESOURCES SECTION */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <div style={{ background: '#fef3c7', color: '#92400e', fontSize: '12px', fontWeight: 700, padding: '3px 20px', borderRadius: '12px', marginBottom: '8px', textAlign: 'center' }}>Resources</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {renderNode("ask", "Ask me", "#92400e")}
                          </div>
                        </div>

                        {/* Divider */}
                        <div style={{ width: '2.5px', height: '46px', background: 'rgba(148, 163, 184, 0.2)', alignSelf: 'flex-start', margin: '34px 16px 0 16px', flexShrink: 0, borderRadius: '2px' }} />
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

                      {/* RIGHT SIDE CONTROLS */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0, paddingLeft: '8px' }}>
                        {/* Quit / Log Out Button */}
                        <button
                          type="button"
                          onClick={() => navigate("/")}
                          title="Quit to Landing Page"
                          aria-label="Quit to Landing Page"
                          style={{
                            width: "34px",
                            height: "34px",
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            border: "1.5px solid #ef4444",
                            background: "#fef2f2",
                            color: "#ef4444",
                            cursor: "pointer",
                            flexShrink: 0,
                            boxShadow: "0 1px 3px rgba(239, 68, 68, 0.12)",
                            transition: "all 0.2s ease",
                          }}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                          </svg>
                        </button>

                        {/* Collapse Button */}
                        <button
                          type="button"
                          onClick={() => setIsToolbarOpen(false)}
                          title="Collapse Toolbar"
                          aria-label="Collapse Toolbar"
                          style={{
                            width: "34px",
                            height: "34px",
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            border: "1.5px solid #cbd5e1",
                            background: "#f8fafc",
                            color: "#64748b",
                            cursor: "pointer",
                            flexShrink: 0,
                            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                            transition: "all 0.2s ease",
                          }}
                        >
                          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Old Collapse Pull-Tab removed */}
            </div>
          )}

          {/* Elegant Centered Pull-Tab (Floating absolute, zero layout shift) */}
          {!isToolbarOpen && activeTool !== "mocktest" && activeTool !== "pre_final_test" && (
            <div
              onMouseEnter={() => setIsToolbarOpen(true)}
              title="Hover to open Study Tools"
              style={{
                position: "absolute",
                top: "0",
                left: "50%",
                transform: "translateX(-50%) translate3d(0, 0, 0)",
                width: "120px",
                height: "10px",
                borderBottomLeftRadius: "12px",
                borderBottomRightRadius: "12px",
                background: activeToolTheme.gradient,
                boxShadow: activeToolTheme.shadow,
                cursor: "pointer",
                zIndex: 99,
                willChange: "transform, opacity",
                transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            />
          )}

          {/* ── BODY ── */}
          <div
            className="st-body"
            style={{
              flex: 1,
              overflowY:
                activeTool === "flashcards" || activeTool === "revision_flashcards" || activeTool === "podcasts"
                  ? "hidden"
                  : "auto",
              padding:
                activeTool === "pyq" || activeTool === "mindmap" || activeTool === "foundation" || activeTool === "deep_dive" || activeTool === "videos" || activeTool === "summary" || activeTool === "detailed" || activeTool === "podcasts"
                  ? "0px 12px 0 12px"
                  : (activeTool === "flashcards" || activeTool === "revision_flashcards")
                    ? "4px 12px 0 12px"
                    : activeTool === "assessment"
                      ? "12px 12px 0 12px"
                      : (activeTool === "mocktest" || activeTool === "pre_final_test")
                        ? "0px"
                        : "16px 12px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-start",
              minHeight: 0,
              background: activeToolTheme.bg,
              position: "relative",
            }}
          >
            {/* ── COMPACT TOP BAR ── */}
            {activeTool !== "mocktest" && activeTool !== "pre_final_test" && (
              <div
                style={{
                  display: (activeTool === "mindmap" || activeTool === "qbank") ? "none" : "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  position: "relative",
                  gap: "20px",
                  marginTop: activeTool === "pyq" ? "-8px" : 0,
                  paddingTop: activeTool === "mindmap" ? "2px" : 0,
                  marginBottom:
                    activeTool === "flashcards" || activeTool === "revision_flashcards" || activeTool === "assessment" || activeTool === "pyq" || activeTool === "mindmap" || activeTool === "videos" || activeTool === "summary" || activeTool === "detailed"
                      ? "2px"
                      : "12px",
                  flexShrink: 0,
                }}
              >
                {/* ── MVP STUDY HEADER: pixel-perfect reference match ── */}
                {(activeTool === "summary" || activeTool === "detailed" || activeTool === "key_takeaways") ? (
                  <>
                    <style>{`
                      @keyframes sv-hdr-in {
                        from { opacity: 0; transform: translateY(-3px); }
                        to   { opacity: 1; transform: translateY(0); }
                      }
                      /* Outer row — no border/bg, just flex */
                      .sv-hdr {
                        display: flex; align-items: center; justify-content: space-between;
                        width: 100%; gap: 16px; flex-shrink: 0;
                        animation: sv-hdr-in 0.2s ease;
                        padding: 2px 0 6px 0;
                      }
                      /* LEFT breadcrumb — single line, no card box */
                      .sv-hdr-card {
                        display: flex; align-items: center; gap: 0;
                        min-width: 0; flex-shrink: 0;
                        max-width: 380px;
                      }
                      .sv-hdr-crumb {
                        font-size: 0.82rem; font-weight: 500; color: #64748b;
                        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
                        line-height: 1.4;
                      }
                      .sv-hdr-crumb .crumb-subject { color: #2563eb; font-weight: 700; }
                      .sv-hdr-crumb .crumb-sep { color: #94a3b8; margin: 0 5px; font-weight: 400; }
                      .sv-hdr-crumb .crumb-chapter { color: #4f46e5; font-weight: 700; }
                      /* MIDDLE levels */
                      .sv-hdr-levels {
                        display: flex; gap: 8px; align-items: center; justify-content: center;
                        flex: 1;
                      }
                      .sv-hdr-level-btn {
                        width: 44px; height: 44px; border-radius: 50%;
                        padding: 0; border: 2.5px solid transparent;
                        cursor: pointer; background: transparent;
                        transition: all 0.2s ease;
                        overflow: hidden; flex-shrink: 0;
                        display: flex; align-items: center; justify-content: center;
                      }
                      .sv-hdr-level-btn img {
                        width: 100%; height: 100%; object-fit: cover;
                        border-radius: 50%;
                        filter: grayscale(0.6) opacity(0.55);
                        transition: filter 0.2s ease, transform 0.2s ease;
                      }
                      .sv-hdr-level-btn:hover img { filter: grayscale(0) opacity(1); transform: scale(1.08); }
                      /* Inactive — colored ring per level */
                      .sv-hdr-level-btn.lvl-beginner     { border-color: #16a34a40; }
                      .sv-hdr-level-btn.lvl-intermediate  { border-color: #d9770640; }
                      .sv-hdr-level-btn.lvl-advanced      { border-color: #7c3aed40; }
                      /* Active — vivid ring + full color image + lift */
                      .sv-hdr-level-btn.lvl-beginner.active-lvl     { border-color: #16a34a; box-shadow: 0 0 0 3px rgba(22,163,74,0.18); }
                      .sv-hdr-level-btn.lvl-intermediate.active-lvl  { border-color: #d97706; box-shadow: 0 0 0 3px rgba(217,119,6,0.18); }
                      .sv-hdr-level-btn.lvl-advanced.active-lvl      { border-color: #7c3aed; box-shadow: 0 0 0 3px rgba(124,58,237,0.18); }
                      .sv-hdr-level-btn.active-lvl img { filter: grayscale(0) opacity(1); transform: scale(1.06); }
                      /* RIGHT controls */
                      .sv-hdr-controls {
                        display: flex; align-items: center; justify-content: flex-end; gap: 6px; flex-shrink: 0;
                      }
                      /* Mode row: Quick | Detailed */
                      .sv-hdr-modes { display: flex; gap: 8px; align-items: center; }
                      /* Reading Depth Segmented Toggle */
                      .sv-hdr-segmented-toggle {
                        position: relative;
                        display: inline-flex;
                        align-items: center;
                        background: #f1f5f9;
                        border: 1.5px solid #cbd5e1;
                        border-radius: 9999px;
                        padding: 3px;
                        box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.04);
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
                        background: #15803d;
                        border-radius: 9999px;
                        box-shadow: 0 2px 8px rgba(21, 128, 61, 0.35);
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
                        padding: 7px 22px;
                        border-radius: 9999px;
                        border: none;
                        background: transparent;
                        font-size: 0.84rem;
                        font-weight: 600;
                        cursor: pointer;
                        white-space: nowrap;
                        line-height: 1;
                        color: #475569;
                        transition: color 0.18s ease;
                        flex: 1;
                      }
                      .sv-hdr-toggle-btn:hover {
                        color: #0f172a;
                      }
                      .sv-hdr-toggle-btn.active {
                        color: #ffffff;
                        font-weight: 700;
                      }
                      .sv-hdr-toggle-btn svg {
                        transition: transform 0.18s ease;
                      }
                      .sv-hdr-toggle-btn:hover svg {
                        transform: scale(1.1);
                      }
                      .sv-hdr-mode-btn {
                        display: inline-flex; align-items: center; gap: 6px;
                        padding: 6px 16px; border-radius: 20px;
                        font-size: 0.82rem; font-weight: 600; cursor: pointer;
                        border: 1.5px solid #cbd5e1;
                        background: #ffffff; color: #475569;
                        transition: all 0.18s ease; white-space: nowrap;
                        line-height: 1;
                      }
                      .sv-hdr-mode-btn:hover { border-color: #94a3b8; color: #0f172a; background: #f8fafc; }
                      .sv-hdr-mode-btn.active-quick    { background: #15803d; border-color: #15803d; color: #ffffff; box-shadow: 0 2px 8px rgba(21,128,61,0.4); }
                      .sv-hdr-mode-btn.active-detailed { background: #15803d; border-color: #15803d; color: #ffffff; box-shadow: 0 2px 8px rgba(21,128,61,0.4); }
                      .sv-hdr-mode-btn.active-key      { background: #d97706; border-color: #d97706; color: #ffffff; box-shadow: 0 2px 8px rgba(217,119,6,0.4); }
                    `}</style>

                    <div className="sv-hdr">
                      {/* LEFT: inline breadcrumb — "Entomology · Chapter 4: Pollination" */}
                      <div className="sv-hdr-card">
                        <span className="sv-hdr-crumb">
                          <span className="crumb-subject">{subjectName}</span>
                          <span className="crumb-sep">·</span>
                          <span className="crumb-chapter">{getChapterPrefix(subjectId)} {chapterNumber}: {chapterName}</span>
                        </span>
                      </div>

                      {/* MIDDLE: persona levels */}
                      {activeTool !== "key_takeaways" ? (
                        <div className="sv-hdr-levels">
                          <button id="studybar-level-beginner" type="button"
                            className={`sv-hdr-level-btn lvl-beginner${persona === "beginner" ? " active-lvl" : ""}`}
                            onClick={() => setPersona("beginner")}
                          >
                            <img src="/personas/beginner.png" alt="Beginner" title="Beginner" />
                          </button>
                          <button id="studybar-level-intermediate" type="button"
                            className={`sv-hdr-level-btn lvl-intermediate${persona === "intermediate" ? " active-lvl" : ""}`}
                            onClick={() => setPersona("intermediate")}
                          >
                            <img src="/personas/intermediate.png" alt="Intermediate" title="Intermediate" />
                          </button>
                          <button id="studybar-level-advanced" type="button"
                            className={`sv-hdr-level-btn lvl-advanced${persona === "advanced" ? " active-lvl" : ""}`}
                            onClick={() => setPersona("advanced")}
                          >
                            <img src="/personas/advanced.png" alt="Advanced" title="Advanced" />
                          </button>
                        </div>
                      ) : <div style={{ flex: 1 }} />}

                      {/* RIGHT: mode toggles — Quick | Detailed only */}
                      <div className="sv-hdr-controls">
                        <div className="sv-hdr-modes">
                          <div
                            className="sv-hdr-segmented-toggle"
                            data-active={activeTool === "summary" ? "summary" : activeTool === "detailed" ? "detailed" : "none"}
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
                          <div style={{ width: '1px', height: '20px', background: '#e2e8f0', margin: '0 4px', alignSelf: 'center', flexShrink: 0 }} />
                          <ReadAloudBar
                            key={`${persona}-${activeTool}`}
                            text={preprocessSummaryText(typeof content === "string" ? content : "")}
                            subjectId={subjectId}
                            persona={persona}
                            onPlay={() => { setIsSidebarOpen(false); }}
                            onHighlightChange={(payload) => setReadingHighlight(payload)}
                            activeTool={activeTool}
                            onSwitchTool={setActiveTool}
                          />
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ display: "flex", alignItems: "center", width: "200px" }}>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        {!isMoocMode && !["pyq", "summary", "detailed", "assessment", "flashcards", "revision_flashcards", "ask", "foundation"].includes(activeTool) && (
                          <h1 className="st-page-title" style={{ margin: 0, fontSize: "1.6rem" }}>
                            {TOOL_LABELS[activeTool]}
                          </h1>
                        )}
                        {activeTool !== "podcasts" && activeTool !== "foundation" && (
                          activeTool === "mindmap" ? (
                            activeNodeTitle && (
                              <div className="st-page-subtitle-row" style={{ marginTop: '2px' }}>
                                <span className="st-page-subtitle" style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', fontWeight: 500 }}>
                                  {activeNodeTitle}
                                </span>
                              </div>
                            )
                          ) : activeTool === "videos" ? null : (
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
                    {activeTool === "podcasts" && !isMoocMode && (
                      <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", display: "flex", alignItems: "center", marginTop: "6px" }}>
                        <span style={{ color: '#0f172a', fontSize: '1.05rem', fontWeight: 600 }}>
                          {getChapterPrefix(subjectId)} {chapterNumber}: {chapterName}
                        </span>
                      </div>
                    )}
                    <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", minWidth: "200px" }} />
                  </>
                )}
              </div>
            )}



            <div
              className={`st-mainview ${activeTool === "flashcards" || activeTool === "revision_flashcards" || activeTool === "assessment" ? "st-mainview--flashcards" : ""}`}
              style={{
                flex: 1,
                minHeight: 0,
                display: "flex",
                flexDirection: "column",
                background:
                  activeTool === "flashcards" || activeTool === "revision_flashcards" ||
                    activeTool === "assessment" || activeTool === "summary" || activeTool === "detailed"
                    ? "transparent"
                    : "#ffffff",
                borderRadius: (activeTool === "mocktest" || activeTool === "pre_final_test") ? "0px" : "6px",
                position: "relative",
                border:
                  activeTool === "mocktest" ||
                    activeTool === "pre_final_test" ||
                    activeTool === "flashcards" ||
                    activeTool === "revision_flashcards" ||
                    activeTool === "assessment"
                    ? "none"
                    : activeTool === "podcasts"
                      ? "none"
                      : activeTool === "summary" || activeTool === "detailed"
                        ? "1px solid #22c55e4D"
                        : "1px solid #E2E8F0",
                overflowX: "hidden",
                overflowY:
                  activeTool === "flashcards" || activeTool === "revision_flashcards" ||
                    activeTool === "ask" ||
                    activeTool === "videos"
                    ? "hidden"
                    : "auto",
                paddingTop:
                  (activeTool === "mocktest" || activeTool === "pre_final_test")
                    ? "0px"
                    : activeTool === "ask"
                      ? "20px"
                      : (activeTool === "flashcards" || activeTool === "revision_flashcards")
                        ? "0px"
                        : activeTool === "assessment"
                          ? "12px"
                          : activeTool === "podcasts"
                            ? "16px"
                            : activeTool === "deep_dive"
                              ? "8px"
                              : activeTool === "videos" || activeTool === "summary" || activeTool === "detailed"
                                ? "0px"
                                : "20px",
                paddingRight: (activeTool === "flashcards" || activeTool === "revision_flashcards") ? "0px" : activeTool === "videos" ? "16px" : activeTool === "ask" ? "20px" : "16px",
                paddingBottom: (activeTool === "flashcards" || activeTool === "revision_flashcards") ? "0px" : activeTool === "videos" ? "16px" : "16px",
                paddingLeft: (activeTool === "flashcards" || activeTool === "revision_flashcards") ? "0px" : activeTool === "videos" ? "16px" : activeTool === "ask" ? "20px" : "16px",
                transition: "padding-top 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            >
              {renderContent()}
            </div>



            {/* Floating guided flow navigation controls */}
            {isMoocMode && guidedFlowIdx !== -1 && !isFocusModeActive && activeTool !== "mocktest" && activeTool !== "pre_final_test" && (

              <div
                style={{
                  position: "absolute",
                  // The video player draws its own control bar across the bottom
                  // of the stage; at 20px these arrows land underneath it and
                  // read as missing. Clear the bar on the videos tool.
                  bottom: activeTool === "videos" ? "84px" : "20px",
                  right: "24px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  zIndex: 60,
                }}
              >
                {prevTool && (
                  <button
                    onClick={() => setActiveTool(prevTool)}
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      border: "1px solid #E2E8F0",
                      background: "rgba(255, 255, 255, 0.9)",
                      backdropFilter: "blur(4px)",
                      color: "#475569",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      fontSize: "1.1rem",
                      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
                      transition: "all 0.2s",
                      padding: 0,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#F1F5F9";
                      e.currentTarget.style.borderColor = "#CBD5E1";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.9)";
                      e.currentTarget.style.borderColor = "#E2E8F0";
                    }}
                    title={`Previous: ${GUIDED_LABELS[prevTool]}`}
                  >
                    ←
                  </button>
                )}
                {/* On unwatched video or last flashcard/assessment, hide greyed out right arrow */}
                {!((activeTool === "flashcards" || activeTool === "assessment") && !canSkipForward) && (
                  <button
                    disabled={!canSkipForward}
                    onClick={() => {
                      if (!canSkipForward) return;
                      const completed = markToolHere(activeTool);
                      if (isEndOfVideoLoop) {
                        // Done with this video's tools, whether worked through or
                        // skipped — on to the next video.
                        advancePastVideoLoop();
                      } else if (nextTool) {
                        setActiveTool(nextTool, completed);
                      } else if (nextUnit) {
                        openUnitTool(nextUnit, GUIDED_FLOW[0], completed);
                      } else {
                        handleBackToChapters();
                      }
                    }}
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      border: "1px solid #E2E8F0",
                      background: "rgba(255, 255, 255, 0.9)",
                      backdropFilter: "blur(4px)",
                      color: canSkipForward ? "#7C3AED" : "#94A3B8",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: canSkipForward ? "pointer" : "not-allowed",
                      opacity: canSkipForward ? 1 : 0.55,
                      fontSize: "1.1rem",
                      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
                      transition: "all 0.2s",
                      padding: 0,
                    }}
                    onMouseEnter={(e) => {
                      if (!canSkipForward) return;
                      e.currentTarget.style.backgroundColor = "#F5F3FF";
                      e.currentTarget.style.borderColor = "#7C3AED";
                    }}
                    onMouseLeave={(e) => {
                      if (!canSkipForward) return;
                      e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.9)";
                      e.currentTarget.style.borderColor = "#E2E8F0";
                    }}
                    title={
                      !canSkipForward
                        ? "Watch this video to unlock its flashcards, assessment and notes"
                        : isEndOfVideoLoop
                          ? hasNextVideo
                            ? `Next: Video ${videoIndex + 1}`
                            : "Next: Mock Test"
                          : nextTool
                            ? `Next: ${GUIDED_LABELS[nextTool]}`
                            : nextUnit
                              ? `Finish & start Unit ${nextUnit.number}`
                              : "Finish course"
                    }
                  >
                    →
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Floating or Sliding AI Tutor Drawer */}
      {isAskOpen && (
        <aside
          className="ask-sidebar-drawer"
          style={{
            width: "380px",
            minWidth: "320px",
            borderLeft: "1px solid var(--border, #E2E8F0)",
            background: "var(--background, #fff)",
            display: "flex",
            flexDirection: "column",
            height: "100%",
            zIndex: 50,
            boxShadow: "-4px 0 16px rgba(0,0,0,0.06)",
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
              padding: "16px 20px",
              borderBottom: "1px solid var(--border, #E2E8F0)",
              background: "var(--surface, #fafafa)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "1.3rem" }}>🤖</span>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 600, color: "var(--text, #333)" }}>
                  AI Study Tutor
                </h3>
                <span style={{ fontSize: "0.75rem", color: "#666" }}>
                  Ask questions about this chapter
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsAskOpen(false)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: "1.2rem",
                color: "#666",
                padding: "4px 8px",
                borderRadius: "4px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              title="Close Tutor"
            >
              ✕
            </button>
          </div>
          <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <AskBotView
              chapterName={chapterName}
              subjectId={subjectId}
              chapterNumber={chapterNumber}
              difficulty={persona}
              className={className}
              subjectName={subjectName}
            />
          </div>
        </aside>
      )}

    </div>
  );
}

