import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import MarkdownView from "@/components/MarkdownView";
import JsMindView from "@/components/JsMindView";
import FlashcardsView from "@/components/FlashcardsView";
import QuestionBankView, {
  QBankReadAloudToolbar,
} from "@/components/QuestionBankView";
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
import { getTopicsForChapter } from "@/data/chapterTopics";
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
import ReadAloudBar from "@/components/study/ReadAloudBar";
import ReadingHighlightView from "@/components/study/ReadingHighlightView";
import AskBotView from "@/components/study/AskBotView";
import PodcastsView from "@/components/study/PodcastsView";
import PYQView from "@/components/study/PYQView";
import MockTestView from "@/components/study/MockTestView";
import VideosView from "@/components/study/VideosView";
import { AssessmentView } from "@/components/study/AssessmentView";
import SwotView from "@/components/study/SwotView";
import LeaderboardView from "@/components/study/LeaderboardView";

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
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const treeLogoSrc = `${import.meta.env.BASE_URL}brand-logo.png`;
  const isMoocMode = sessionStorage.getItem('sv_moocs_mode') === 'true';

  const className = searchParams.get("className") || "Class";
  const subjectName = searchParams.get("subjectName") || "Subject";
  const semesterName = searchParams.get("semesterName") || "";
  const subjectId = searchParams.get("sId") || searchParams.get("subjectId") || "english";
  const personaRaw = searchParams.get("persona") || "intermediate";
  const [persona, setPersonaState] = useState<DifficultyLevel>(
    PERSONA_TO_LEVEL[personaRaw] || "intermediate",
  );

  // Clean query strings from URL address bar on initial mount for clean URLs
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.search) {
      // window.history.replaceState(window.history.state, document.title, window.location.pathname);
    }
  }, []);

  const setPersona = (level: DifficultyLevel) => {
    // Stop any active TTS/audio before switching persona
    googleTtsStop();
    trackPersonaChange(persona, level);
    setPersonaState(level);
    if (typeof window !== "undefined" && window.location.search) {
      // window.history.replaceState(window.history.state, document.title, window.location.pathname);
    }
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

  const [subjectChapters, setSubjectChapters] = useState<Chapter[]>([]);

  useEffect(() => {
    if (!subjectId) return;
    getManifest().then((m) => {
      const list = getChapters(m, subjectId);
      setSubjectChapters(list);
    });
  }, [subjectId]);

  const rawChapterName =
    subjectChapters.find((c) => c.number === chapterNumber)?.name ||
    searchParams.get("chapterName") ||
    `Chapter ${chapterNumber}`;

  const chapterTopics = getTopicsForChapter(subjectId, chapterNumber);
  const chapterName =
    rawChapterName.match(/^(Chapter|Unit)\s*[-]?\d+$/i) && chapterTopics.length > 0
      ? chapterTopics[0]
      : rawChapterName;

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
    if (typeof window !== "undefined" && window.location.search) {
      // window.history.replaceState(window.history.state, document.title, window.location.pathname);
    }
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
      if (isSegmented) {
        return isToolUnlockedForVideo(
          tool,
          subjectId,
          chapterNumber,
          videoIndex,
          chapterVideos.length,
        );
      }
      return isToolUnlocked(tool, completedOverride ?? completedTools);
    },
    [isSegmented, subjectId, chapterNumber, videoIndex, chapterVideos.length, completedTools],
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

  const lastSyncRef = useRef("");

  useEffect(() => {
    const completed = completedToolsFor(videoIndex);
    setCompletedTools((prev) => {
      if (prev.length === completed.length && prev.every((t, i) => t === completed[i])) {
        return prev;
      }
      return completed;
    });

    const currentSyncKey = `${subjectId}-${chapterNumber}-${videoIndex}-${searchParams.toString()}-${videosLoaded}`;
    if (lastSyncRef.current === currentSyncKey) return;
    lastSyncRef.current = currentSyncKey;

    // Sync active tool state for the new chapter/unit
    const fromUrl = searchParams.get("tool") as ToolId | null;
    if (!videosLoaded) return;
    if (!isMoocMode) {
      setActiveToolState(fromUrl || "videos");
    } else {
      if (fromUrl && isToolUnlockedHere(fromUrl, completed)) {
        setActiveToolState(fromUrl);
      } else {
        setActiveToolState(resumeToolHere(completed));
      }
    }
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
    (searchParams.get("tool") as ToolId) || "videos";

  // Persist activeTool in URL so refresh restores the same tool.
  // The registry is still loading on first render, so this consults the cached
  // video count instead — without it a locked tool would render for one frame
  // before the sync effect corrects it.
  const [activeTool, setActiveToolState] = useState<ToolId>(() => {
    const fromUrl = searchParams.get("tool") as ToolId | null;
    if (!isMoocMode) return fromUrl || "videos";

    const cachedVideoCount = getChapterVideoCount(subjectId, chapterNumber);
    if (cachedVideoCount > 0) {
      const idx = Math.max(1, parseInt(searchParams.get("video") || "1", 10) || 1);
      if (
        fromUrl &&
        isToolUnlockedForVideo(fromUrl, subjectId, chapterNumber, idx, cachedVideoCount)
      ) {
        return fromUrl;
      }
      return "videos";
    }

    const completed = getCompletedTools(subjectId, chapterNumber);
    if (fromUrl && isToolUnlocked(fromUrl, completed)) return fromUrl;
    return getResumeTool(completed);
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
      setActiveToolState("videos");
      return;
    }
    // Last video done — the chapter-wide exams are unlocked now.
    setActiveTool("mocktest");
  };

  useEffect(() => {
    // Check if the user has paid for this subject/course
    const hasPaid = localStorage.getItem(`registered_${subjectId}`) === 'true';
    if (!hasPaid) {
      navigate(`/course/${subjectId}`);
    }
  }, [subjectId, navigate]);

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

  useEffect(() => {
    if (!videosLoaded) return;
    if (isMoocMode && !isToolUnlockedHere(activeTool)) {
      // Locked tool requested via the URL — bounce back to where they left off.
      setActiveTool(resumeToolHere(completedTools));
      return;
    }
  }, [videosLoaded]);

  // `completedOverride` lets a caller that just marked a step done unlock the
  // next one in the same tick, before the completedTools state has re-rendered.
  const setActiveTool = (tool: ToolId, completedOverride?: ToolId[]) => {
    const completed = completedOverride ?? completedTools;
    if (isMoocMode && !isToolUnlockedHere(tool, completed)) return;
    if (tool !== activeTool) {
      triggerToolTransition(tool);
    }
    setActiveToolState(tool);
    if (typeof window !== "undefined" && window.location.search) {
      // window.history.replaceState(window.history.state, document.title, window.location.pathname);
    }
    trackToolUsage({
      tool,
      subjectId,
      chapterNumber,
      chapterName: `Chapter ${chapterNumber}`,
    });
  };

  const chapterHasVideos = useMemo(() => {
    if (isSegmented) return true;
    if (subjectId === "management") return true;
    if (subjectId === "anu_physics") return true;
    if (subjectId === "pubadm_ur" && chapterNumber === 1) return true;
    if (subjectId === "ento_131" && chapterNumber === 1) return true;
    
    const currentChapter = subjectChapters.find(c => c.number === chapterNumber);
    if (currentChapter && currentChapter.completed && currentChapter.completed.includes("youtube_links")) return true;
    
    return false;
  }, [isSegmented, subjectId, chapterNumber, subjectChapters]);

  useEffect(() => {
    if (subjectChapters.length > 0) {
      if (!subjectChapters.some((c) => c.number === chapterNumber)) {
        const firstValid = subjectChapters[0].number;
        setChapterNumber(firstValid);
        if (typeof window !== "undefined") {
          const newParams = new URLSearchParams(window.location.search);
          newParams.set("chapter", String(firstValid));
          window.history.replaceState(null, "", `${window.location.pathname}?${newParams.toString()}`);
        }
      }
    }
  }, [subjectChapters, chapterNumber]);

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
    if (typeof window !== "undefined" && window.location.search) {
      // window.history.replaceState(window.history.state, document.title, window.location.pathname);
    }
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
    if (typeof window !== "undefined" && window.location.search) {
      // window.history.replaceState(window.history.state, document.title, window.location.pathname);
    }
  };

  // The unit that follows the one being studied — where "Finish Unit" lands.
  const currentUnitIdx = subjectChapters.findIndex(
    (c) => c.number === chapterNumber,
  );
  const nextUnit =
    currentUnitIdx === -1 ? undefined : subjectChapters[currentUnitIdx + 1];

  // Guided chapter gating has been removed per user request so they can freely 
  // navigate between unit tabs in MOOC mode.

  // Keep the active unit tab in view when the row overflows horizontally.
  useEffect(() => {
    if (!isMoocMode) return;
    document
      .querySelector(".mooc-unit-tab.is-active")
      ?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [isMoocMode, chapterNumber, subjectChapters.length]);

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
  const [isToolbarOpen, setIsToolbarOpen] = useState(false);
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

  // Reset masterminds concept panel when switching chapters, subjects, or tools
  useEffect(() => {
    setMmActiveNodeId(null);
    setMmConceptRaw('');
    setMmDeepDiveRaw('');
    setMmConceptSection('summary');
    setMmFlippedCards(new Set());
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
    const handleDocumentClick = (e: MouseEvent) => {
      const wrapper = document.querySelector('.mooc-toolbar-wrapper');
      if (wrapper && !wrapper.contains(e.target as Node)) {
        setIsToolbarOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    window.addEventListener("click", handleDocumentClick);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("click", handleDocumentClick);
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
      Promise.all([
        getFlashcards(internalSubId, chapterNumber, "beginner", activeVideoDir),
        getFlashcards(internalSubId, chapterNumber, "intermediate", activeVideoDir),
        getFlashcards(internalSubId, chapterNumber, "advanced", activeVideoDir)
      ])
        .then(([beg, int, adv]) => {
          const allCards = [
            ...(beg || []).map(c => ({ ...c, level: "beginner" as const })),
            ...(int || []).map(c => ({ ...c, level: "intermediate" as const })),
            ...(adv || []).map(c => ({ ...c, level: "advanced" as const }))
          ];
          // Random shuffle for Revision Flashcards master deck
          for (let i = allCards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [allCards[i], allCards[j]] = [allCards[j], allCards[i]];
          }
          apply(allCards);
        })
        .catch(() => apply([]));
    } else if (activeTool === "mindmap") {
      getResourceContent(internalSubId, chapterNumber, "mindmap.md", persona)
        .then(apply)
        .catch(() => apply('{"name":"Unavailable","children":[{"name":"Mindmap not found"}]}'));
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
    navigate("/my-learning");
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
          <div className="markdown-container">
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
              content={typeof content === "string" ? content : ""}
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
                    {s === 'summary' ? 'Summary' :
                      s === 'detailed' ? 'Detailed' :
                        s === 'flashcards' ? 'Flashcards' :
                          'Deep Dive'}
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

        return (
          <div className="mindmap-container">
            <JsMindView
              content={typeof content === "string" ? content : ""}
              toolbarHint={isMmMasterminds ? '🗺️ Mindmap · Click a concept node to explore' : undefined}
              onTopicClick={(nodeId, topicName) => {
                if (isMmMasterminds && (nodeId.startsWith('concept_') || nodeId.startsWith('subtopic_') || nodeId.startsWith('topic_'))) {
                  setMmActiveNodeId(nodeId);
                  setMmConceptSection('summary');
                } else if (!isMmMasterminds) {
                  // Standard mindmap click
                  setActiveTool(isMoocMode ? "summary" : "detailed");
                  setTimeout(() => {
                    const headings = Array.from(document.querySelectorAll('.markdown-view h1, .markdown-view h2, .markdown-view h3, .markdown-view h4, .markdown-view h5, .markdown-view h6'));
                    const cleanName = topicName.replace(/[^\w\s-]/g, '').trim().toLowerCase();
                    const target = headings.find(h => {
                      const text = h.textContent?.replace(/[^\w\s-]/g, '').trim().toLowerCase() || "";
                      return text.includes(cleanName) || cleanName.includes(text);
                    });
                    if (target) {
                      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      target.classList.add('heading-highlight-flash');
                      setTimeout(() => target.classList.remove('heading-highlight-flash'), 2000);
                    }
                  }, 300);
                }
              }}
            />
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
            onQuit={() => setActiveTool("videos")}
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
            onQuit={() => setActiveTool("videos")}
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
            onQuit={() => setActiveTool("videos")}
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
            onReadAloudTextChange={setQbankReadAloudText}
            highlight={readingHighlight}
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
    mindmap: "Mindmap",
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
        {!isMoocMode && !["mocktest", "pre_final_test", "prep_exam"].includes(activeTool) && (
          <header
            className="sv-topbar"
            style={{ borderBottom: "none", height: "40px", minHeight: "40px", padding: "0 24px" }}
          >
            <div className="sv-topbar-left">
              <div
                className="sv-rail-brand"
                onClick={handleBackToChapters}
                style={{
                  cursor: "pointer",
                  marginRight: "16px",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <img
                  className="sv-brand-logo-img sv-study-rail-tree-logo"
                  src={treeLogoSrc}
                  alt="Saral Vidhya"
                />
              </div>
              <div className="sv-breadcrumb">
                <span className="sv-bc-link" onClick={handleBackToClass}>
                  {className || "Class"}
                </span>
                <span className="sv-bc-sep">/</span>
                <span className="sv-bc-link" onClick={handleBackToChapters}>
                  {subjectName || "Subject"}
                </span>
                <span className="sv-bc-sep">/</span>
                <span className="sv-bc-link" onClick={handleBackToChapters}>
                  Chapters
                </span>
                <span className="sv-bc-sep">/</span>
                <span className="sv-bc-current">{getChapterPrefix(subjectId)} {chapterNumber}: {chapterName}</span>
              </div>
            </div>
            <div className="sv-topbar-right" style={{ display: "flex", alignItems: "center", gap: "14px", flexShrink: 0 }}>
              <button
                className="sv-logout-btn"
                onClick={handleAuthClick}
                title={isAuthenticated ? "Log Out" : "Log In"}
                aria-label={isAuthenticated ? "Log Out" : "Log In"}
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                <svg width="26" height="26" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="50" cy="50" r="44" stroke="#FF4D4D" strokeWidth="8" fill="none" />
                  <path d="M48 30H30V70H48" stroke="#FF4D4D" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  <path d="M42 50H74M74 50L60 36M74 50L60 64" stroke="#FF4D4D" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </svg>
              </button>
              <button
                className="sv-profile-btn"
                onClick={() => navigate("/profile")}
                title="Profile & Settings"
                aria-label="Profile & Settings"
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                  }}
                >
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="#3B82F6">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '0px',
                      right: '0px',
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      background: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="#3B82F6">
                      <path d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12-.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5-3.5z" />
                    </svg>
                  </div>
                </div>
              </button>
            </div>
          </header>
        )}

        <div
          className="sv-content"
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            minHeight: 0,
            overflow: "hidden",
          }}
        >
          {/* Collapsible Horizontal Toolbar (Floating Overlay Drawer, zero content push/cutoff) */}
          {isMoocMode && !["mocktest", "pre_final_test", "prep_exam"].includes(activeTool) && (
            <div
              className="mooc-toolbar-wrapper"
              onMouseEnter={() => setIsToolbarOpen(true)}
              onMouseLeave={() => setIsToolbarOpen(false)}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
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
                  const TOOL_THEMES: Record<string, { main: string; badge: string; text: string; bg: string }> = {
                    videos: { main: "#0088FF", badge: "#0088FF", text: "#0088FF", bg: learnThemeBg },
                    flashcards: { main: "#0088FF", badge: "#0088FF", text: "#0088FF", bg: learnThemeBg },
                    assessment: { main: "#0088FF", badge: "#0088FF", text: "#0088FF", bg: learnThemeBg },
                    summary: { main: "#0088FF", badge: "#0088FF", text: "#0088FF", bg: learnThemeBg },
                    quick_study: { main: "#0088FF", badge: "#0088FF", text: "#0088FF", bg: learnThemeBg },
                    detailed: { main: "#0088FF", badge: "#0088FF", text: "#0088FF", bg: learnThemeBg },
                    detailed_notes: { main: "#0088FF", badge: "#0088FF", text: "#0088FF", bg: learnThemeBg },
                    mindmap: { main: "#0088FF", badge: "#0088FF", text: "#0088FF", bg: learnThemeBg },

                    master_flashcards: { main: "#CB30E0", badge: "#CB30E0", text: "#CB30E0", bg: prepThemeBg },
                    revision_flashcards: { main: "#CB30E0", badge: "#CB30E0", text: "#CB30E0", bg: prepThemeBg },
                    revise: { main: "#CB30E0", badge: "#CB30E0", text: "#CB30E0", bg: prepThemeBg },
                    mocktest: { main: "#22C55E", badge: "#22C55E", text: "#16a34a", bg: "#f0fdf4" },
                    prep_test: { main: "#22C55E", badge: "#22C55E", text: "#16a34a", bg: "#f0fdf4" },
                    pre_final_test: { main: "#22C55E", badge: "#22C55E", text: "#16a34a", bg: "#f0fdf4" },
                    certification_exam: { main: "#22C55E", badge: "#22C55E", text: "#16a34a", bg: "#f0fdf4" },
                    qbank: { main: "#22C55E", badge: "#22C55E", text: "#16a34a", bg: "#f0fdf4" },
                    ask: { main: "#f59e0b", badge: "#f59e0b", text: "#d97706", bg: "#fffbeb" },
                  };

                  const getNodeIcon = (toolId: string, color: string, active: boolean) => {
                    switch (toolId) {
                      case "videos":
                        return (
                          <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
                            <path d="M4 10C4 8.89543 4.89543 8 6 8H26C27.1046 8 28 8.89543 28 10V24C28 25.1046 27.1046 26 26 26H6C4.89543 26 4 25.1046 4 24V10Z" fill="#3B82F6" />
                            <path d="M4 10C4 8.89543 4.89543 8 6 8H26C27.1046 8 28 8.89543 28 10V14H4V10Z" fill="#1D4ED8" />
                            <polygon points="10,8 14,8 11,14 7,14" fill="#ffffff" opacity="0.9" />
                            <polygon points="18,8 22,8 19,14 15,14" fill="#ffffff" opacity="0.9" />
                            <polygon points="13,16 21,20 13,24" fill="#ffffff" />
                            <path d="M2 5L3 2L4 5L7 6L4 7L3 10L2 7L-1 6L2 5Z" fill="#60A5FA" transform="translate(1, 1) scale(0.6)" />
                            <path d="M2 5L3 2L4 5L7 6L4 7L3 10L2 7L-1 6L2 5Z" fill="#93C5FD" transform="translate(23, -1) scale(0.5)" />
                          </svg>
                        );
                      case "flashcards":
                        return (
                          <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
                            <rect x="3" y="5" width="16" height="20" rx="3" fill="#93C5FD" />
                            <rect x="7" y="3" width="16" height="20" rx="3" fill="#60A5FA" />
                            <rect x="11" y="7" width="17" height="21" rx="3" fill="#2563EB" />
                            <line x1="15" y1="13" x2="23" y2="13" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
                            <line x1="15" y1="17" x2="20" y2="17" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
                          </svg>
                        );
                      case "assessment":
                        return (
                          <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
                            <rect x="6" y="6" width="18" height="22" rx="3" fill="#ffffff" stroke="#2563EB" strokeWidth="2" />
                            <rect x="11" y="4" width="8" height="4" rx="1.5" fill="#2563EB" />
                            <path d="M10 12L12 14L16 10" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <line x1="18" y1="12" x2="21" y2="12" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" />
                            <path d="M10 18L12 20L16 16" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <line x1="18" y1="18" x2="21" y2="18" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" />
                            <path d="M22 24L27 15L25 13L20 22L20 25L22 24Z" fill="#3B82F6" stroke="#1D4ED8" strokeWidth="1" />
                          </svg>
                        );
                      case "summary":
                      case "quick_study":
                        return (
                          <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
                            <circle cx="16" cy="16" r="11" stroke="#2563EB" strokeWidth="2.5" fill="none" />
                            <path d="M16 10V16L20 18" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            <polygon points="12 2 16 2 14 7" fill="#3B82F6" />
                          </svg>
                        );
                      case "detailed":
                      case "detailed_notes":
                        return (
                          <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
                            <path d="M4 7C4 5.34315 5.34315 4 7 4H15V26H7C5.34315 26 4 24.6569 4 23V7Z" fill="#ffffff" stroke="#2563EB" strokeWidth="2" />
                            <path d="M28 7C28 5.34315 26.6569 4 25 4H17V26H25C26.6569 26 28 24.6569 28 23V7Z" fill="#ffffff" stroke="#2563EB" strokeWidth="2" />
                            <line x1="7" y1="9" x2="12" y2="9" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" />
                            <line x1="7" y1="13" x2="13" y2="13" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" />
                            <line x1="7" y1="17" x2="11" y2="17" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" />
                            <line x1="19" y1="9" x2="25" y2="9" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" />
                            <line x1="19" y1="13" x2="24" y2="13" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" />
                          </svg>
                        );
                      case "revision_flashcards":
                      case "revise":
                        return (
                          <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
                            <path d="M16 4C22.6274 4 28 9.37258 28 16C28 19.5 26.5 22.6 24 24.8" stroke="#C026D3" strokeWidth="2" strokeLinecap="round" fill="none" />
                            <polyline points="22 25 25 25 25 22" stroke="#C026D3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M16 28C9.37258 28 4 22.6274 4 16C4 12.5 5.5 9.4 8 7.2" stroke="#C026D3" strokeWidth="2" strokeLinecap="round" fill="none" />
                            <polyline points="10 7 7 7 7 10" stroke="#C026D3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M9 12C9 12 12 11 16 13C20 11 23 12 23 12V21C23 21 20 20 16 22C12 20 9 21 9 21V12Z" fill="#ffffff" stroke="#C026D3" strokeWidth="1.5" strokeLinejoin="round" />
                            <line x1="16" y1="13" x2="16" y2="22" stroke="#C026D3" strokeWidth="1.5" />
                          </svg>
                        );
                      case "mocktest":
                        return (
                          <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
                            <path d="M7 5C7 3.89543 7.89543 3 9 3H20L25 8V25C25 26.1046 24.1046 27 23 27H9C7.89543 27 7 26.1046 7 25V5Z" fill="#ffffff" stroke={color} strokeWidth="2" />
                            <line x1="11" y1="9" x2="17" y2="9" stroke={color} strokeWidth="2" strokeLinecap="round" />
                            <line x1="11" y1="13" x2="21" y2="13" stroke={color} strokeWidth="2" strokeLinecap="round" />
                            <circle cx="17" cy="20" r="4.5" fill={color} />
                            <path d="M14.5 20L16.2 21.7L19.5 18.5" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        );
                      case "prep_exam":
                      case "prep_test":
                        return (
                          <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        );
                      case "certification_exam":
                      case "pre_final_test":
                      case "qbank":
                        return (
                          <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
                            <circle cx="16" cy="16" r="9" stroke="#22C55E" strokeWidth="2.5" />
                            <path d="M11 23V30l5-2 5 2v-7" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M16 11l1.5 3 3.5.5-2.5 2.5.5 3.5-3-1.5-3 1.5.5-3.5-2.5-2.5 3.5-.5L16 11z" fill="#22C55E" />
                          </svg>
                        );
                      case "ask":
                        return (
                          <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
                            <path d="M16 4C9.37258 4 4 8.70557 4 14.5C4 17.6534 5.56843 20.4705 8.04618 22.3789C7.8 24.5 6.5 26.5 6.5 26.5C6.5 26.5 9.5 26.2 12.2 24.5C13.4074 24.8258 14.6806 25 16 25C22.6274 25 28 20.2944 28 14.5C28 8.70557 22.6274 4 16 4Z" fill="#ffffff" stroke="#F59E0B" strokeWidth="2" strokeLinejoin="round" />
                            <text x="13" y="15" fill="#F59E0B" fontSize="10" fontWeight="bold" fontFamily="sans-serif">?</text>
                            <circle cx="21" cy="18" r="4" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="1.5" />
                            <circle cx="21" cy="17" r="1.2" fill="#F59E0B" />
                            <path d="M19 20.8C19.5 20 22.5 20 23 20.8" stroke="#F59E0B" strokeWidth="1" strokeLinecap="round" />
                          </svg>
                        );
                      default:
                        return (
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75">
                            <circle cx="12" cy="12" r="8" />
                          </svg>
                        );
                    }
                  };

                  const renderNode = (toolId: ToolId, labelOverride?: string, colorOverride?: string) => {
                    const isCompleted = unitCompleted.includes(toolId);
                    const locked = !isToolUnlockedHere(toolId, unitCompleted);
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
                            setIsToolbarOpen(false);
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
                          opacity: locked ? 0.5 : 1,
                          transition: 'all 0.2s ease',
                          position: 'relative',
                          gap: '3px'
                        }}
                        title={labelOverride || GUIDED_LABELS[toolId]}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '26px' }}>
                          {getNodeIcon(toolId, themeColor, active)}
                        </div>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: active ? 700 : 500,
                          color: active ? themeColor : locked ? '#94A3B8' : '#64748B',
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
                          onClick={handleBackToChapters}
                          style={{ cursor: "pointer", display: "flex", alignItems: "center" }}
                        >
                          <img className="sv-brand-logo-img sv-study-rail-tree-logo" src={treeLogoSrc} alt="Saral Vidhya" />
                        </div>
                      </div>

                      {/* CENTER TOOL NODES */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', flex: 1, gap: '12px', padding: '0 12px' }}>
                        {/* 1. LEARN SECTION */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <div style={{ background: '#3B82F6', color: '#fff', fontSize: '12px', fontWeight: 700, padding: '3px 20px', borderRadius: '8px', marginBottom: '8px', textAlign: 'center', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>Learn</span>
                            {/* Three parallel tool sets exist in a segmented
                                chapter — say which video's is on screen. */}
                            {isSegmented && (
                              <span
                                title={activeVideo?.title}
                                style={{ background: 'rgba(255,255,255,0.25)', borderRadius: '6px', padding: '0 7px', fontSize: '11px', fontWeight: 800 }}
                              >
                                Video {videoIndex}/{chapterVideos.length}
                              </span>
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            {chapterHasVideos && (
                              <>
                                {renderNode(GUIDED_FLOW[0])}
                                {renderLine(unitCompleted.includes(GUIDED_FLOW[0]), TOOL_THEMES[GUIDED_FLOW[0]]?.main || "#3b82f6")}
                              </>
                            )}
                            {renderNode(GUIDED_FLOW[1])}
                            {renderLine(unitCompleted.includes(GUIDED_FLOW[1]), TOOL_THEMES[GUIDED_FLOW[1]]?.main || "#3b82f6")}
                            {renderNode(GUIDED_FLOW[2])}
                            {renderLine(unitCompleted.includes(GUIDED_FLOW[2]), TOOL_THEMES[GUIDED_FLOW[2]]?.main || "#3b82f6")}
                            {renderNode(GUIDED_FLOW[3])}
                            {renderLine(unitCompleted.includes(GUIDED_FLOW[3]), TOOL_THEMES[GUIDED_FLOW[3]]?.main || "#3b82f6")}
                            {renderNode(GUIDED_FLOW[4])}
                          </div>
                        </div>

                        {/* Divider */}
                        <div style={{ width: '1px', height: '36px', background: '#E2E8F0', margin: '6px 14px 0 14px', flexShrink: 0 }} />

                        {/* 2. PREPARE SECTION */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <div style={{ background: '#C026D3', color: '#fff', fontSize: '12px', fontWeight: 700, padding: '3px 20px', borderRadius: '8px', marginBottom: '8px', textAlign: 'center' }}>Prepare</div>
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            {renderNode("revision_flashcards", "Revise")}
                            {renderLine(unitCompleted.includes("revision_flashcards"), "#c026d3")}
                            {renderNode("mocktest", "Mock Test", "#c026d3")}
                          </div>
                        </div>

                        {/* Divider */}
                        <div style={{ width: '1px', height: '36px', background: '#E2E8F0', margin: '6px 14px 0 14px', flexShrink: 0 }} />

                        {/* 3. EXAMINATION SECTION */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <div style={{ background: '#22C55E', color: '#fff', fontSize: '12px', fontWeight: 700, padding: '3px 20px', borderRadius: '8px', marginBottom: '8px', textAlign: 'center' }}>Examination</div>
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            {renderNode("prep_exam", "Preparation Exam", "#22c55e")}
                            {renderLine(unitCompleted.includes("prep_exam"), "#22c55e")}
                            {renderNode("pre_final_test", "Certification Exam", "#22c55e")}
                          </div>
                        </div>

                        {/* Divider */}
                        <div style={{ width: '1px', height: '36px', background: '#E2E8F0', margin: '6px 14px 0 14px', flexShrink: 0 }} />

                        {/* 4. HELP SECTION */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <div style={{ background: '#F59E0B', color: '#fff', fontSize: '12px', fontWeight: 700, padding: '3px 20px', borderRadius: '8px', marginBottom: '8px', textAlign: 'center' }}>Help</div>
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            {renderNode("ask", "Ask me")}
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
                      </div>

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
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Thick Blue Centered Bar (Floating absolute, zero layout shift) */}
          {!isToolbarOpen && activeTool !== "mocktest" && activeTool !== "pre_final_test" && activeTool !== "prep_exam" && (
            <div
              onMouseEnter={() => setIsToolbarOpen(true)}
              onClick={() => setIsToolbarOpen(true)}
              title="Hover or click to open Study Tools"
              style={{
                position: "absolute",
                top: "4px",
                left: "50%",
                transform: "translateX(-50%) translate3d(0, 0, 0)",
                width: "240px",
                height: "8px",
                borderRadius: "100px",
                background: "linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)",
                boxShadow: "0 4px 12px rgba(37, 99, 235, 0.45)",
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
            onMouseEnter={() => setIsToolbarOpen(false)}
            style={{
              flex: 1,
              overflowY:
                activeTool === "flashcards" || activeTool === "podcasts" || ["mocktest", "pre_final_test", "prep_exam", "prep_test", "certification_exam"].includes(activeTool)
                  ? "hidden"
                  : "auto",
              padding:
                activeTool === "pyq" || activeTool === "mindmap" || activeTool === "deep_dive" || activeTool === "videos" || activeTool === "summary" || activeTool === "detailed"
                  ? "0px 12px 0 12px"
                  : activeTool === "flashcards"
                    ? "4px 12px 0 12px"
                    : activeTool === "assessment" ||
                      activeTool === "podcasts"
                      ? "12px 12px 0 12px"
                      : ["mocktest", "pre_final_test", "prep_exam"].includes(activeTool)
                        ? "0px"
                        : "16px 12px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-start",
              minHeight: 0,
              background: "transparent",
              position: "relative",
            }}
          >
            {/* ── COMPACT TOP BAR ── */}
            {!["mocktest", "pre_final_test", "prep_exam"].includes(activeTool) && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  position: "relative",
                  gap: "20px",
                  marginTop: activeTool === "pyq" ? "-8px" : 0,
                  paddingTop: activeTool === "mindmap" ? "2px" : 0,
                  marginBottom:
                    activeTool === "flashcards" || activeTool === "assessment" || activeTool === "pyq" || activeTool === "mindmap" || activeTool === "videos" || activeTool === "summary" || activeTool === "detailed"
                      ? "2px"
                      : "12px",
                  flexShrink: 0,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", width: "200px" }}>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    {!isMoocMode && (
                      <h1
                        className="st-page-title"
                        style={{ margin: 0, fontSize: "1.6rem" }}
                      >
                        {["summary", "detailed"].includes(activeTool)
                          ? "Study Table"
                          : TOOL_LABELS[activeTool]}
                      </h1>
                    )}
                    {["summary", "detailed"].includes(activeTool) ? (
                      <div className="st-page-subtitle-row">
                        <span
                          className="st-page-subtitle"
                          style={{
                            fontSize: "1.05rem",
                            fontWeight: 700,
                            color: "#0066CC",
                            background: "rgba(0, 136, 255, 0.14)",
                            padding: "3px 10px",
                            borderRadius: "6px",
                            border: "1px solid rgba(0, 136, 255, 0.25)",
                            display: "inline-flex",
                            alignItems: "center",
                          }}
                        >
                          {activeTool === "summary" ? "Quick Study" : "Detailed Study"}
                        </span>
                        {!isMoocMode && (
                          <>
                            <span className="st-page-subtitle-sep">•</span>
                            <span className="st-chapter-subtitle">{getChapterPrefix(subjectId)} {chapterNumber}: {chapterName}</span>
                          </>
                        )}
                      </div>
                    ) : activeTool === "mindmap" ? (
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
                    )}
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    alignItems: "center",
                    minWidth: "200px",
                  }}
                >

                  {activeTool === "podcasts" && (
                    <div className="read-aloud-tool-pill read-aloud-tool-pill--transport">
                      <div className="read-aloud-play-cluster">
                        <button
                          type="button"
                          onClick={() => {
                            podcastIsPlaying
                              ? setPodcastPauseTrigger((t) => t + 1)
                              : setPodcastPlayTrigger((t) => t + 1);
                            if (!podcastIsPlaying) setIsSidebarOpen(false);
                          }}
                          className="read-aloud-play-btn"
                          aria-label={podcastIsPlaying ? "Pause" : "Play"}
                          data-label={podcastIsPlaying ? "Pause" : "Play"}
                        >
                          {podcastIsPlaying ? (
                            <svg
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                            >
                              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                            </svg>
                          ) : (
                            <svg
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              style={{ marginLeft: "2px" }}
                            >
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          )}
                        </button>
                        {podcastHasStarted && (
                          <button
                            type="button"
                            onClick={() => {
                              setPodcastStopTrigger((t) => t + 1);
                              setPodcastHasStarted(false);
                            }}
                            className="read-aloud-action-btn"
                            aria-label="Stop"
                            data-label="Stop"
                          >
                            <svg
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                            >
                              <path d="M6 6h12v12H6z" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {(activeTool === "summary" || activeTool === "detailed") && (
                    <ReadAloudBar
                      key={`${persona}-${activeTool}`}
                      text={typeof content === "string" ? content : ""}
                      subjectId={subjectId}
                      persona={persona}
                      onPlay={() => {
                        setIsSidebarOpen(false);
                      }}
                      onHighlightChange={(payload) =>
                        setReadingHighlight(payload)
                      }
                      activeTool={activeTool}
                      onSwitchTool={setActiveTool}
                    />
                  )}
                  {activeTool === "qbank" && (
                    <QBankReadAloudToolbar
                      text={qbankReadAloudText}
                      subjectId={subjectId}
                      onPlay={() => setIsSidebarOpen(false)}
                      onHighlightChange={(payload) =>
                        setReadingHighlight(payload)
                      }
                    />
                  )}
                </div>
              </div>
            )}

            <div
              className={`st-mainview ${activeTool === "flashcards" || activeTool === "assessment" ? "st-mainview--flashcards" : ""}`}
              style={{
                flex: 1,
                minHeight: 0,
                display: "flex",
                flexDirection: "column",
                background:
                  activeTool === "flashcards" ||
                    activeTool === "assessment"
                    ? "transparent"
                    : activeTool === "summary" || activeTool === "detailed"
                      ? "#0088FF1A"
                      : "#ffffff",
                borderRadius: ["mocktest", "pre_final_test", "prep_exam"].includes(activeTool) ? "0px" : "16px",
                border:
                  ["mocktest", "pre_final_test", "prep_exam"].includes(activeTool) ||
                    activeTool === "flashcards" ||
                    activeTool === "assessment"
                    ? "none"
                    : activeTool === "podcasts"
                      ? "none"
                      : activeTool === "summary" || activeTool === "detailed"
                        ? "1px solid #0088FF4D"
                        : "1px solid #E2E8F0",
                overflowX: "hidden",
                overflowY:
                  activeTool === "flashcards" ||
                    activeTool === "ask" ||
                    activeTool === "videos"
                    ? "hidden"
                    : "auto",
                paddingTop: isToolbarOpen
                  ? "88px"
                  : ["mocktest", "pre_final_test", "prep_exam"].includes(activeTool)
                    ? "0px"
                    : activeTool === "ask"
                      ? "20px"
                      : activeTool === "flashcards"
                        ? "0px"
                        : activeTool === "assessment"
                          ? "18px"
                          : activeTool === "podcasts"
                            ? "16px"
                            : activeTool === "deep_dive"
                              ? "8px"
                              : activeTool === "videos" || activeTool === "summary" || activeTool === "detailed"
                                ? "0px"
                                : "20px",
                paddingRight: activeTool === "videos" ? "16px" : activeTool === "ask" ? "20px" : "16px",
                paddingBottom: activeTool === "videos" ? "16px" : activeTool === "assessment" ? "24px" : "16px",
                paddingLeft: activeTool === "videos" ? "16px" : activeTool === "ask" ? "20px" : "16px",
                transition: "padding-top 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            >
              {renderContent()}
            </div>



            {/* Floating guided flow navigation controls */}
            {isMoocMode && guidedFlowIdx !== -1 && !isFocusModeActive && !["mocktest", "pre_final_test", "prep_exam"].includes(activeTool) && (

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
                {!( (activeTool === "flashcards" || activeTool === "assessment") && !canSkipForward ) && (
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
