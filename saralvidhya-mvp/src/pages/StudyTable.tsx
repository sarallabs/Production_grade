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
    { key: "beginner", label: "Beginner", imgSrc: `${import.meta.env.BASE_URL}personas/beginner.png` },
    {
      key: "intermediate",
      label: "Intermediate",
      imgSrc: `${import.meta.env.BASE_URL}personas/intermediate.png`,
    },
    { key: "advanced", label: "Advanced", imgSrc: `${import.meta.env.BASE_URL}personas/advanced.png` },
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
    if (fromUrl === "foundation") return "mindmap";
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
  const [isToolbarPinned, setIsToolbarPinned] = useState<boolean>(() => {
    try {
      return localStorage.getItem("sv_study_toolbar_pinned") === "true";
    } catch {
      return false;
    }
  });
  const [isToolbarOpen, setIsToolbarOpen] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem("sv_study_toolbar_pinned");
      return stored !== null ? stored === "true" : true;
    } catch {
      return true;
    }
  });
  const toolbarCollapseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearToolbarCollapseTimer = useCallback(() => {
    if (toolbarCollapseTimerRef.current != null) {
      clearTimeout(toolbarCollapseTimerRef.current);
      toolbarCollapseTimerRef.current = null;
    }
  }, []);

  const handleToolbarMouseEnter = useCallback(() => {
    clearToolbarCollapseTimer();
    setIsToolbarOpen(true);
  }, [clearToolbarCollapseTimer]);

  const handleToolbarMouseLeave = useCallback(() => {
    if (isToolbarPinned) return;
    clearToolbarCollapseTimer();
    toolbarCollapseTimerRef.current = setTimeout(() => {
      setIsToolbarOpen(false);
    }, 250);
  }, [isToolbarPinned, clearToolbarCollapseTimer]);

  const toggleToolbarPin = useCallback(() => {
    setIsToolbarPinned((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("sv_study_toolbar_pinned", String(next));
      } catch {
        // ignore storage errors
      }
      if (next) {
        setIsToolbarOpen(true);
      }
      return next;
    });
  }, []);

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
    } else if (activeTool === "mindmap" || activeTool === "foundation") {
      getResourceContent(internalSubId, chapterNumber, "mindmap.md", persona)
        .then(apply)
        .catch(() => apply(""));
    } else if (activeTool === "study_plan") {
      getResourceContent(internalSubId, chapterNumber, "study_plan.md", persona)
        .then(apply)
        .catch(() => apply("Study plan unavailable."));
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
            />
          </div>
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
      case "study_plan": {
        const md = typeof content === "string" ? content : "Study plan not available.";
        return (
          <div className="markdown-container" style={{ position: 'relative', maxWidth: '1040px', margin: '0 auto', width: '100%', padding: '24px 32px', boxSizing: 'border-box' }}>
            <MarkdownView content={md} />
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
    study_plan: "Study Plan",
    key_takeaways: "Key Takeaways",
    mindmap: "Mindmap",
    foundation: "Mindmap",
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
      case "summary": case "podcasts": case "videos": case "mindmap": case "study_plan": case "foundation":
        return { bg: "#f0f7f4", gradient: "linear-gradient(90deg, #4F7B64 0%, #3B5E4C 100%)", shadow: "0 4px 12px rgba(79, 123, 100, 0.35)" };
      case "revision_flashcards": case "assessment": case "qbank": case "flashcards":
        return { bg: "#fdf8ee", gradient: "linear-gradient(90deg, #E8996C 0%, #D47B4B 100%)", shadow: "0 4px 12px rgba(232, 153, 108, 0.35)" };
      case "pyq": case "prep_exam": case "mocktest":
        return { bg: "#f4f8f6", gradient: "linear-gradient(90deg, #6F9A7F 0%, #587F67 100%)", shadow: "0 4px 12px rgba(111, 154, 127, 0.35)" };
      case "swot":
        return { bg: "#fff7ed", gradient: "linear-gradient(90deg, #E8996C 0%, #D47B4B 100%)", shadow: "0 4px 12px rgba(232, 153, 108, 0.35)" };
      case "deep_dive": case "ask":
        return { bg: "#f0f7f4", gradient: "linear-gradient(90deg, #547163 0%, #3D5348 100%)", shadow: "0 4px 12px rgba(84, 113, 99, 0.35)" };
      default:
        return { bg: "#ffffff", gradient: "linear-gradient(90deg, #4F7B64 0%, #3B5E4C 100%)", shadow: "0 4px 12px rgba(79, 123, 100, 0.35)" };
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
              onMouseEnter={handleToolbarMouseEnter}
              onMouseLeave={handleToolbarMouseLeave}
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
                    videos: { main: "#4F7B64", badge: "#4F7B64", text: "#4F7B64", bg: "#f0f7f4" },
                    flashcards: { main: "#E8996C", badge: "#E8996C", text: "#E8996C", bg: "#fdf8ee" },
                    assessment: { main: "#E8996C", badge: "#E8996C", text: "#E8996C", bg: "#fdf8ee" },
                    summary: { main: "#4F7B64", badge: "#4F7B64", text: "#4F7B64", bg: "#f0f7f4" },
                    quick_study: { main: "#4F7B64", badge: "#4F7B64", text: "#4F7B64", bg: "#f0f7f4" },
                    key_takeaways: { main: "#4F7B64", badge: "#4F7B64", text: "#4F7B64", bg: "#f0f7f4" },
                    detailed: { main: "#4F7B64", badge: "#4F7B64", text: "#4F7B64", bg: "#f0f7f4" },
                    detailed_notes: { main: "#4F7B64", badge: "#4F7B64", text: "#4F7B64", bg: "#f0f7f4" },
                    mindmap: { main: "#4F7B64", badge: "#4F7B64", text: "#4F7B64", bg: "#f0f7f4" },
                    foundation: { main: "#4F7B64", badge: "#4F7B64", text: "#4F7B64", bg: "#f0f7f4" },
                    study_plan: { main: "#4F7B64", badge: "#4F7B64", text: "#4F7B64", bg: "#f0f7f4" },
                    podcasts: { main: "#4F7B64", badge: "#4F7B64", text: "#4F7B64", bg: "#f0f7f4" },

                    master_flashcards: { main: "#E8996C", badge: "#E8996C", text: "#E8996C", bg: "#fdf8ee" },
                    revision_flashcards: { main: "#E8996C", badge: "#E8996C", text: "#E8996C", bg: "#fdf8ee" },
                    revise: { main: "#E8996C", badge: "#E8996C", text: "#E8996C", bg: "#fdf8ee" },
                    qbank: { main: "#4F7B64", badge: "#4F7B64", text: "#4F7B64", bg: "#EEF5F1" },

                    pyq: { main: "#6F9A7F", badge: "#6F9A7F", text: "#6F9A7F", bg: "#f4f8f6" },
                    prep_exam: { main: "#6F9A7F", badge: "#6F9A7F", text: "#6F9A7F", bg: "#f4f8f6" },
                    prep_test: { main: "#6F9A7F", badge: "#6F9A7F", text: "#6F9A7F", bg: "#f4f8f6" },
                    mocktest: { main: "#6F9A7F", badge: "#6F9A7F", text: "#6F9A7F", bg: "#f4f8f6" },
                    pre_final_test: { main: "#6F9A7F", badge: "#6F9A7F", text: "#6F9A7F", bg: "#f4f8f6" },
                    certification_exam: { main: "#6F9A7F", badge: "#6F9A7F", text: "#6F9A7F", bg: "#f4f8f6" },

                    swot: { main: "#E8996C", badge: "#E8996C", text: "#E8996C", bg: "#fdf8ee" },
                    ask: { main: "#547163", badge: "#547163", text: "#547163", bg: "#f0f7f4" },
                  };

                  const getNodeIcon = (toolId: string, color: string, active: boolean) => {
                    switch (toolId) {
                      case "summary":
                      case "quick_study":
                      case "detailed":
                      case "detailed_notes":
                        return (
                          <svg width="36" height="34" viewBox="0 0 38 34" fill="none">
                            {/* Book cover base */}
                            <path d="M4 27C10 27 15 28.5 19 31C23 28.5 28 27 34 27V29C28 29 23 30.5 19 33C15 30.5 10 29 4 29V27Z" fill="#1E3227" />
                            <path d="M3 25C10 25 15 26.5 19 29C23 26.5 28 25 35 25V28C28 28 23 29.5 19 32C15 29.5 10 28 3 28V25Z" fill="#4F7B64" />
                            {/* Left page */}
                            <path d="M4 8C10 8 15 9.5 19 12V28C15 25.5 10 24 4 24V8Z" fill="#FFFFFF" stroke="#4F7B64" strokeWidth="1.6" strokeLinejoin="round" />
                            {/* Right page */}
                            <path d="M34 8C28 8 23 9.5 19 12V28C23 25.5 28 24 34 24V8Z" fill="#FFFFFF" stroke="#4F7B64" strokeWidth="1.6" strokeLinejoin="round" />
                            {/* Cover edges visible underneath */}
                            <path d="M3 9C2 9 2 24.5 3 25" stroke="#4F7B64" strokeWidth="2.5" strokeLinecap="round" />
                            <path d="M35 9C36 9 36 24.5 35 25" stroke="#4F7B64" strokeWidth="2.5" strokeLinecap="round" />
                            {/* Left page text lines */}
                            <line x1="7.5" y1="13" x2="15.5" y2="14.5" stroke="#4F7B64" strokeWidth="1.4" strokeLinecap="round" opacity="0.7" />
                            <line x1="7.5" y1="16.5" x2="15.5" y2="18" stroke="#4F7B64" strokeWidth="1.4" strokeLinecap="round" opacity="0.7" />
                            <line x1="7.5" y1="20" x2="13" y2="21" stroke="#4F7B64" strokeWidth="1.4" strokeLinecap="round" opacity="0.7" />
                            {/* Right page text lines */}
                            <line x1="22.5" y1="14.5" x2="30.5" y2="13" stroke="#4F7B64" strokeWidth="1.4" strokeLinecap="round" opacity="0.7" />
                            <line x1="22.5" y1="18" x2="30.5" y2="16.5" stroke="#4F7B64" strokeWidth="1.4" strokeLinecap="round" opacity="0.7" />
                            <line x1="25" y1="21" x2="30.5" y2="20" stroke="#4F7B64" strokeWidth="1.4" strokeLinecap="round" opacity="0.7" />
                            {/* Center spine */}
                            <line x1="19" y1="12" x2="19" y2="29" stroke="#4F7B64" strokeWidth="1.8" strokeLinecap="round" />
                          </svg>
                        );
                      case "podcasts":
                        return (
                          <svg width="36" height="34" viewBox="0 0 36 34" fill="none">
                            {/* Headband */}
                            <path d="M7 17C7 10.9249 11.9249 6 18 6C24.0751 6 29 10.9249 29 17V20" stroke="#4F7B64" strokeWidth="3" strokeLinecap="round" />
                            {/* Top cushion */}
                            <path d="M12 7.5C13.8 6.5 16 6 18 6C20 6 22.2 6.5 24 7.5" stroke="#7BA88B" strokeWidth="2" strokeLinecap="round" />
                            {/* Left earcup outer */}
                            <rect x="5" y="16" width="6" height="11" rx="3" fill="#4F7B64" />
                            {/* Left earcup inner cushion */}
                            <rect x="9" y="17.5" width="2" height="8" rx="1" fill="#7BA88B" />
                            {/* Right earcup outer */}
                            <rect x="25" y="16" width="6" height="11" rx="3" fill="#4F7B64" />
                            {/* Right earcup inner cushion */}
                            <rect x="25" y="17.5" width="2" height="8" rx="1" fill="#7BA88B" />
                            {/* Sound wave bars in center */}
                            <line x1="15" y1="19" x2="15" y2="23" stroke="#4F7B64" strokeWidth="2" strokeLinecap="round" />
                            <line x1="18" y1="17" x2="18" y2="25" stroke="#4F7B64" strokeWidth="2" strokeLinecap="round" />
                            <line x1="21" y1="19" x2="21" y2="23" stroke="#4F7B64" strokeWidth="2" strokeLinecap="round" />
                          </svg>
                        );
                      case "videos":
                        return (
                          <svg width="36" height="34" viewBox="0 0 36 34" fill="none">
                            {/* Bottom slate */}
                            <rect x="5" y="13" width="26" height="16" rx="3" fill="#4F7B64" />
                            {/* Play button triangle */}
                            <polygon points="16,17 23,21 16,25" fill="#FFFFFF" />
                            {/* Top clapperboard bar */}
                            <g transform="rotate(-6 5 12)">
                              <rect x="5" y="6" width="26" height="6.5" rx="2" fill="#4F7B64" />
                              {/* White diagonal stripes */}
                              <polygon points="9,6 12,6 9,12.5 6,12.5" fill="#FFFFFF" />
                              <polygon points="16,6 19,6 16,12.5 13,12.5" fill="#FFFFFF" />
                              <polygon points="23,6 26,6 23,12.5 20,12.5" fill="#FFFFFF" />
                              <polygon points="30,6 31,6 30,12.5 27,12.5" fill="#FFFFFF" />
                            </g>
                          </svg>
                        );
                      case "foundation":
                      case "mindmap":
                        return (
                          <img
                            src={`${import.meta.env.BASE_URL}mindmap_icon.svg`}
                            alt="Mindmap"
                            style={{
                              width: '36px',
                              height: '32px',
                              objectFit: 'contain',
                              filter: active ? 'drop-shadow(0 2px 5px rgba(61, 123, 96, 0.45))' : 'none',
                              transition: 'transform 0.18s ease, filter 0.18s ease',
                              transform: active ? 'scale(1.08)' : 'scale(1)'
                            }}
                          />
                        );
                      case "flashcards":
                      case "revision_flashcards":
                      case "revise":
                        return (
                          <svg width="36" height="34" viewBox="0 0 36 34" fill="none">
                            {/* Clipboard board */}
                            <rect x="7" y="5" width="20" height="25" rx="3.5" fill="#FFFDF8" stroke="#E8996C" strokeWidth="2" />
                            {/* Top Clip */}
                            <rect x="13" y="3" width="8" height="4" rx="1.5" fill="#E8996C" />
                            <rect x="15" y="1.5" width="4" height="2" rx="1" fill="#D47B4B" />
                            {/* Checkmarks & lines */}
                            <path d="M10.5 11L12 12.5L15 9.5" stroke="#E8996C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            <line x1="17" y1="11" x2="23" y2="11" stroke="#E8996C" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
                            <path d="M10.5 16L12 17.5L15 14.5" stroke="#E8996C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            <line x1="17" y1="16" x2="23" y2="16" stroke="#E8996C" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
                            <path d="M10.5 21L12 22.5L15 19.5" stroke="#E8996C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            <line x1="17" y1="21" x2="20" y2="21" stroke="#E8996C" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
                            {/* Clock badge at bottom right */}
                            <circle cx="26" cy="24" r="5.5" fill="#FFFDF8" stroke="#E8996C" strokeWidth="2" />
                            <polyline points="26,21.5 26,24 28,24" stroke="#E8996C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        );
                      case "assessment":
                        return (
                          <svg width="36" height="34" viewBox="0 0 36 34" fill="none">
                            {/* Notepad body */}
                            <rect x="6" y="7" width="20" height="23" rx="3" fill="#FFFDF8" stroke="#E8996C" strokeWidth="2" />
                            {/* Spiral wire rings */}
                            <rect x="8" y="4" width="2" height="5" rx="1" fill="#C49B4B" />
                            <rect x="13" y="4" width="2" height="5" rx="1" fill="#C49B4B" />
                            <rect x="18" y="4" width="2" height="5" rx="1" fill="#C49B4B" />
                            <rect x="23" y="4" width="2" height="5" rx="1" fill="#C49B4B" />
                            {/* Lines & checks on pad */}
                            <path d="M9.5 13L11 14.5L14 11.5" stroke="#E8996C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            <line x1="16" y1="13" x2="22" y2="13" stroke="#E8996C" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
                            <path d="M9.5 18L11 19.5L14 16.5" stroke="#E8996C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            <line x1="16" y1="18" x2="20" y2="18" stroke="#E8996C" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
                            <path d="M9.5 23L11 24.5L14 21.5" stroke="#E8996C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            <line x1="16" y1="23" x2="19" y2="23" stroke="#E8996C" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
                            {/* Angled pencil writing on pad */}
                            <g transform="translate(19, 13) rotate(35)">
                              <rect x="0" y="0" width="5" height="13" rx="1" fill="#E8996C" />
                              <polygon points="0,13 5,13 2.5,18" fill="#FDDBCB" />
                              <polygon points="1.5,16 3.5,16 2.5,18" fill="#4F7B64" />
                              <rect x="0" y="-3" width="5" height="3" rx="0.8" fill="#E8996C" />
                            </g>
                          </svg>
                        );
                      case "qbank":
                        return (
                          <svg width="36" height="34" viewBox="0 0 36 34" fill="none">
                            {/* 3D Glossy Speech bubble */}
                            <path d="M18 5C10.5 5 5 10 5 16.5C5 20.2 7.2 23.4 10.7 25.4L9 30L15.2 27.8C16.1 27.9 17 28 18 28C25.5 28 31 23 31 16.5C31 10 25.5 5 18 5Z" fill="#E8996C" />
                            {/* Subtle highlight arc */}
                            <path d="M9 11C11 8 14.5 7 18 7" stroke="#FFF0E6" strokeWidth="1.8" strokeLinecap="round" opacity="0.7" />
                            {/* White Question mark */}
                            <path d="M15 13.5C15 11.5 16.2 10.5 18 10.5C19.8 10.5 21 11.5 21 13C21 14.5 19.8 15.5 18.5 16.5C18 17 18 18 18 18.8" stroke="#FFFFFF" strokeWidth="2.6" strokeLinecap="round" />
                            <circle cx="18" cy="22.5" r="1.5" fill="#FFFFFF" />
                          </svg>
                        );
                      case "pyq":
                        return (
                          <svg width="36" height="34" viewBox="0 0 36 34" fill="none">
                            {/* Document outline */}
                            <path d="M8 5C8 3.89543 8.89543 3 10 3H20L27 10V27C27 28.1046 26.1046 29 25 29H10C8.89543 29 8 28.1046 8 27V5Z" fill="#F4F8F6" stroke="#6F9A7F" strokeWidth="2" strokeLinejoin="round" />
                            {/* Dog-ear fold */}
                            <path d="M20 3V10H27" fill="#D4E5DC" stroke="#6F9A7F" strokeWidth="2" strokeLinejoin="round" />
                            {/* Document text lines */}
                            <line x1="12" y1="9" x2="16" y2="9" stroke="#6F9A7F" strokeWidth="1.6" strokeLinecap="round" opacity="0.6" />
                            <line x1="12" y1="13" x2="22" y2="13" stroke="#6F9A7F" strokeWidth="1.6" strokeLinecap="round" opacity="0.6" />
                            <line x1="12" y1="17" x2="20" y2="17" stroke="#6F9A7F" strokeWidth="1.6" strokeLinecap="round" opacity="0.6" />
                            <line x1="12" y1="21" x2="16" y2="21" stroke="#6F9A7F" strokeWidth="1.6" strokeLinecap="round" opacity="0.6" />
                            {/* PYQ Badge */}
                            <rect x="16" y="21" width="15" height="9" rx="3.5" fill="#6F9A7F" />
                            <text x="23.5" y="27.8" fill="#FFFFFF" fontSize="6.5" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">PYQ</text>
                          </svg>
                        );
                      case "prep_exam":
                      case "prep_test":
                      case "mocktest":
                      case "pre_final_test":
                      case "certification_exam":
                        return (
                          <svg width="36" height="34" viewBox="0 0 36 34" fill="none">
                            {/* Calendar body */}
                            <rect x="6" y="6" width="22" height="23" rx="3.5" fill="#F4F8F6" stroke="#6F9A7F" strokeWidth="2" />
                            {/* Calendar header bar */}
                            <path d="M6 9.5C6 7.567 7.567 6 9.5 6H24.5C26.433 6 28 7.567 28 9.5V11H6V9.5Z" fill="#6F9A7F" />
                            {/* Spiral binder rings */}
                            <rect x="10" y="3" width="2" height="5" rx="1" fill="#FFFFFF" stroke="#6F9A7F" strokeWidth="1" />
                            <rect x="16" y="3" width="2" height="5" rx="1" fill="#FFFFFF" stroke="#6F9A7F" strokeWidth="1" />
                            <rect x="22" y="3" width="2" height="5" rx="1" fill="#FFFFFF" stroke="#6F9A7F" strokeWidth="1" />
                            {/* Grid of date checkmarks */}
                            <path d="M9.5 15L10.5 16L12.5 14" stroke="#6F9A7F" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M15.5 15L16.5 16L18.5 14" stroke="#6F9A7F" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M21.5 15L22.5 16L24.5 14" stroke="#6F9A7F" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M9.5 20L10.5 21L12.5 19" stroke="#6F9A7F" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M15.5 20L16.5 21L18.5 19" stroke="#6F9A7F" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                            {/* Clock badge at bottom right */}
                            <circle cx="27" cy="24" r="5.5" fill="#F4F8F6" stroke="#6F9A7F" strokeWidth="2" />
                            <polyline points="27,21.5 27,24 29,24" stroke="#6F9A7F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        );
                      case "ask":
                        return (
                          <svg width="36" height="34" viewBox="0 0 36 34" fill="none">
                            <defs>
                              <radialGradient id="saralAiGrad" cx="35%" cy="35%" r="70%">
                                <stop offset="0%" stopColor="#9BB5A7" />
                                <stop offset="55%" stopColor="#789A89" />
                                <stop offset="100%" stopColor="#547163" />
                              </radialGradient>
                            </defs>
                            {/* Sage circular background matching screenshot 1 */}
                            <circle cx="18" cy="17" r="13" fill="url(#saralAiGrad)" />
                            {/* Big 4-point sparkle star in center (pure white) */}
                            <path d="M17 9C17 12.8 13.5 15 9.5 15C13.5 15 17 17.2 17 21C17 17.2 20.5 15 24.5 15C20.5 15 17 12.8 17 9Z" fill="#FFFFFF" />
                            {/* Small 4-point sparkle star on top right (pure white) */}
                            <path d="M24.5 8C24.5 9.8 22.8 11 21 11C22.8 11 24.5 12.2 24.5 14C24.5 12.2 26.2 11 28 11C26.2 11 24.5 9.8 24.5 8Z" fill="#FFFFFF" />
                          </svg>
                        );
                      default:
                        return (
                          <svg width="36" height="34" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75">
                            <circle cx="12" cy="12" r="8" />
                          </svg>
                        );
                    }
                  };

                  const renderNode = (toolId: ToolId, labelOverride?: string, colorOverride?: string) => {
                    const isCompleted = unitCompleted.includes(toolId);
                    const locked = false;

                    const active = activeTool === toolId;
                    const theme = TOOL_THEMES[toolId] || { main: "#2D3E36", badge: "#2D3E36", text: "#2D3E36", bg: "#f0f7f4" };
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
                          padding: '6px 12px',
                          borderRadius: '10px',
                          background: active ? '#ffffff' : 'transparent',
                          border: active ? `1.5px solid ${themeColor}` : '1.5px solid transparent',
                          boxShadow: active ? `0 2px 8px ${themeColor}25` : 'none',
                          cursor: locked ? 'not-allowed' : 'pointer',
                          opacity: active ? 1 : locked ? 0.25 : 0.45,
                          filter: active ? 'none' : 'grayscale(1)',
                          transition: 'all 0.2s ease',
                          position: 'relative',
                          gap: '4px'
                        }}
                        title={labelOverride || GUIDED_LABELS[toolId]}
                        onMouseEnter={!active && !locked ? (e) => {
                          (e.currentTarget as HTMLDivElement).style.opacity = '0.85';
                          (e.currentTarget as HTMLDivElement).style.filter = 'grayscale(0)';
                          (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
                        } : undefined}
                        onMouseLeave={!active && !locked ? (e) => {
                          (e.currentTarget as HTMLDivElement).style.opacity = '0.45';
                          (e.currentTarget as HTMLDivElement).style.filter = 'grayscale(1)';
                          (e.currentTarget as HTMLDivElement).style.transform = 'none';
                        } : undefined}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '36px', width: '38px' }}>
                          {getNodeIcon(toolId, themeColor, active)}
                        </div>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: active ? 700 : 500,
                          color: active ? themeColor : '#94a3b8',
                          textAlign: 'center',
                          lineHeight: '1.2',
                          whiteSpace: 'nowrap'
                        }}>
                          {labelOverride || GUIDED_LABELS[toolId]}
                        </span>
                      </div>
                    );
                  };

                  return (
                    <div
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', overflowX: 'auto', padding: '6px 16px', gap: '16px' }}
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

                      {/* CENTER TOOL NODES (Figma Toolbar Box) */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'center',
                          gap: '28px',
                          padding: '10px 24px',
                          border: 'none',
                          borderRadius: '12px',
                          background: '#FFFFFF',
                          boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
                          margin: '0 auto',
                          flexShrink: 0,
                        }}
                      >
                        {/* 1. LEARN SECTION */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <div style={{ color: '#4F7B64', fontSize: '13px', fontWeight: 700, marginBottom: '6px', textAlign: 'center', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>Learn</span>
                            {isSegmented && (
                              <span
                                title={activeVideo?.title}
                                style={{ background: '#4F7B64', color: '#fff', borderRadius: '6px', padding: '0 7px', fontSize: '11px', fontWeight: 800 }}
                              >
                                Video {videoIndex}/{chapterVideos.length}
                              </span>
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {renderNode("summary", "Read", "#4F7B64")}
                            {renderNode("podcasts", "Listen", "#4F7B64")}
                            {renderNode("videos", "Watch", "#4F7B64")}
                            {renderNode("mindmap", "Mindmap", "#4F7B64")}
                          </div>
                        </div>

                        {/* 2. PRACTICE SECTION */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <div style={{ color: '#E8996C', fontSize: '13px', fontWeight: 700, marginBottom: '6px', textAlign: 'center' }}>
                            Practice
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {renderNode("revision_flashcards", "Revise", "#E8996C")}
                            {renderNode("assessment", "Assessment", "#E8996C")}
                            {renderNode("qbank", "Question Bank", "#4F7B64")}
                          </div>
                        </div>

                        {/* 3. PREPARE SECTION */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <div style={{ color: '#6F9A7F', fontSize: '13px', fontWeight: 700, marginBottom: '6px', textAlign: 'center' }}>
                            Prepare
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {renderNode("pyq", "PYQ", "#6F9A7F")}
                            {renderNode("prep_exam", "Preparation Exam", "#6F9A7F")}
                          </div>
                        </div>

                        {/* 4. AI & PIN SECTION */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '22px' }}>
                          {renderNode("ask", "Saral", "#547163")}

                          {/* Pin Button (Tilted Pushpin from Figma) */}
                          <button
                            type="button"
                            onClick={toggleToolbarPin}
                            title={isToolbarPinned ? "Unpin toolbar (auto-hide on mouse leave)" : "Pin toolbar (keep open)"}
                            aria-label={isToolbarPinned ? "Unpin toolbar" : "Pin toolbar"}
                            style={{
                              width: "36px",
                              height: "36px",
                              borderRadius: "50%",
                              border: "1.8px solid #1E293B",
                              background: isToolbarPinned ? "#1E293B" : "#FFFFFF",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                              color: isToolbarPinned ? "#FFFFFF" : "#1E293B",
                              marginBottom: "18px",
                              marginLeft: "4px",
                              boxShadow: isToolbarPinned ? "0 2px 8px rgba(30, 41, 59, 0.25)" : "0 1px 3px rgba(0,0,0,0.06)",
                              transition: "all 0.2s ease",
                            }}
                          >
                            <svg
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              fill={isToolbarPinned ? "currentColor" : "none"}
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              style={{ transform: "rotate(-45deg)" }}
                            >
                              <line x1="12" y1="17" x2="12" y2="22" />
                              <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a1 1 0 0 0 1-1V3H7v2a1 1 0 0 0 1 1h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" />
                            </svg>
                          </button>
                        </div>
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
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Old Collapse Pull-Tab removed */}
            </div>
          )}

          {/* Top Hover Trigger Area & Centered Pull-Tab */}
          {!isToolbarOpen && activeTool !== "mocktest" && activeTool !== "pre_final_test" && (
            <>
              {/* Full-width top hover trigger strip */}
              <div
                onMouseEnter={handleToolbarMouseEnter}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "20px",
                  zIndex: 98,
                  cursor: "pointer",
                }}
              />
              {/* Elegant Centered Pull-Tab (Floating absolute, zero layout shift) */}
              <div
                onMouseEnter={handleToolbarMouseEnter}
                onClick={handleToolbarMouseEnter}
                title="Hover or click to open Study Tools"
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
            </>
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
                activeTool === "pyq" || activeTool === "mindmap" || activeTool === "foundation" || activeTool === "deep_dive" || activeTool === "videos" || activeTool === "summary" || activeTool === "detailed" || activeTool === "study_plan" || activeTool === "podcasts"
                  ? "0px 12px 0 12px"
                  : (activeTool === "flashcards" || activeTool === "revision_flashcards")
                    ? "4px 12px 0 12px"
                    : activeTool === "assessment"
                      ? "12px 12px 0 12px"
                      : (activeTool === "mocktest" || activeTool === "pre_final_test" || activeTool === "ask")
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
            {activeTool !== "mocktest" && activeTool !== "pre_final_test" && activeTool !== "ask" && (
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
                    activeTool === "flashcards" || activeTool === "revision_flashcards" || activeTool === "assessment" || activeTool === "pyq" || activeTool === "mindmap" || activeTool === "videos" || activeTool === "summary" || activeTool === "detailed" || activeTool === "study_plan"
                      ? "2px"
                      : "12px",
                  flexShrink: 0,
                }}
              >
                {/* ── MVP STUDY HEADER: pixel-perfect reference match ── */}
                {(activeTool === "summary" || activeTool === "detailed" || activeTool === "key_takeaways" || activeTool === "study_plan") ? (
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
                        padding: 2px 0 6px 0;
                      }
                      /* LEFT breadcrumb — single line, no card box */
                      .sv-hdr-card {
                        display: flex; align-items: center; gap: 0;
                        min-width: 0; flex-shrink: 0;
                        max-width: 380px;
                        position: relative; z-index: 1;
                      }
                      .sv-hdr-crumb {
                        font-size: 0.82rem; font-weight: 500; color: #64748b;
                        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
                        line-height: 1.4;
                      }
                      .sv-hdr-crumb .crumb-subject { color: #2563eb; font-weight: 700; }
                      .sv-hdr-crumb .crumb-sep { color: #94a3b8; margin: 0 5px; font-weight: 400; }
                      .sv-hdr-crumb .crumb-chapter { color: #4f46e5; font-weight: 700; }
                      /* MIDDLE levels — absolutely centered to the full bar */
                      .sv-hdr-levels {
                        position: absolute;
                        left: 50%; transform: translateX(-50%);
                        display: flex; gap: 8px; align-items: center; justify-content: center;
                        z-index: 0;
                      }
                      .sv-hdr-level-btn {
                        width: 44px; height: 44px; border-radius: 10px;
                        padding: 0; border: 2.5px solid transparent;
                        cursor: pointer; background: transparent;
                        transition: all 0.2s ease;
                        overflow: hidden; flex-shrink: 0;
                        display: flex; align-items: center; justify-content: center;
                      }
                      .sv-hdr-level-btn img {
                        width: 100%; height: 100%; object-fit: contain;
                        border-radius: 8px;
                        padding: 2px;
                        box-sizing: border-box;
                        filter: grayscale(0.5) opacity(0.65);
                        transition: filter 0.2s ease, transform 0.2s ease;
                      }
                      .sv-hdr-level-btn:hover img { filter: grayscale(0) opacity(1); transform: scale(1.08); }
                      /* Inactive — colored ring per level */
                      .sv-hdr-level-btn.lvl-beginner     { border-color: rgba(123, 168, 139, 0.5); background: #ffffff; }
                      .sv-hdr-level-btn.lvl-intermediate  { border-color: rgba(79, 123, 100, 0.5); background: #ffffff; }
                      .sv-hdr-level-btn.lvl-advanced      { border-color: rgba(45, 62, 54, 0.5); background: #ffffff; }
                      /* Active — vivid ring + full color image + lift */
                      .sv-hdr-level-btn.lvl-beginner.active-lvl     { border-color: #7BA88B; box-shadow: 0 0 0 3px rgba(123, 168, 139, 0.25); background: #f2f7f4; }
                      .sv-hdr-level-btn.lvl-intermediate.active-lvl  { border-color: #4F7B64; box-shadow: 0 0 0 3px rgba(79, 123, 100, 0.25); background: #eef5f1; }
                      .sv-hdr-level-btn.lvl-advanced.active-lvl      { border-color: #2D3E36; box-shadow: 0 0 0 3px rgba(45, 62, 54, 0.25); background: #e9f0ec; }
                      .sv-hdr-level-btn.active-lvl img { filter: grayscale(0) opacity(1); transform: scale(1.06); }
                      /* RIGHT controls */
                      .sv-hdr-controls {
                        display: flex; align-items: center; justify-content: flex-end; gap: 6px; flex-shrink: 0;
                      }
                      /* Mode row: Quick | Detailed | Key Takeaways */
                      .sv-hdr-modes { display: flex; gap: 8px; align-items: center; }
                      .sv-hdr-mode-btn {
                        display: inline-flex; align-items: center; gap: 6px;
                        padding: 8px 26px; border-radius: 20px;
                        font-size: 0.84rem; font-weight: 600; cursor: pointer;
                        border: 1.5px solid #cbd5e1;
                        background: #ffffff; color: #475569;
                        transition: all 0.18s ease; white-space: nowrap;
                        line-height: 1;
                      }
                      .sv-hdr-mode-btn:hover { border-color: #94a3b8; color: #0f172a; background: #f8fafc; }
                      .sv-hdr-mode-btn.active-quick    { background: #3b82f6; border-color: #3b82f6; color: #ffffff; box-shadow: 0 2px 8px rgba(59,130,246,0.4); }
                      .sv-hdr-mode-btn.active-detailed { background: #15803d; border-color: #15803d; color: #ffffff; box-shadow: 0 2px 8px rgba(21,128,61,0.4); }
                      .sv-hdr-mode-btn.active-key      { background: #d97706; border-color: #d97706; color: #ffffff; box-shadow: 0 2px 8px rgba(217,119,6,0.4); }
                      .sv-hdr-mode-btn.active-plan     { background: #4f46e5; border-color: #4f46e5; color: #ffffff; box-shadow: 0 2px 8px rgba(79,70,229,0.4); }
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
                      {activeTool !== "key_takeaways" && activeTool !== "study_plan" ? (
                        <div className="sv-hdr-levels">
                          <button id="studybar-level-beginner" type="button"
                            className={`sv-hdr-level-btn lvl-beginner${persona === "beginner" ? " active-lvl" : ""}`}
                            onClick={() => setPersona("beginner")}
                          >
                            <img src={`${import.meta.env.BASE_URL}personas/beginner.png`} alt="Beginner" title="Beginner" />
                          </button>
                          <button id="studybar-level-intermediate" type="button"
                            className={`sv-hdr-level-btn lvl-intermediate${persona === "intermediate" ? " active-lvl" : ""}`}
                            onClick={() => setPersona("intermediate")}
                          >
                            <img src={`${import.meta.env.BASE_URL}personas/intermediate.png`} alt="Intermediate" title="Intermediate" />
                          </button>
                          <button id="studybar-level-advanced" type="button"
                            className={`sv-hdr-level-btn lvl-advanced${persona === "advanced" ? " active-lvl" : ""}`}
                            onClick={() => setPersona("advanced")}
                          >
                            <img src={`${import.meta.env.BASE_URL}personas/advanced.png`} alt="Advanced" title="Advanced" />
                          </button>
                        </div>
                      ) : <div style={{ flex: 1 }} />}

                      {/* RIGHT: mode toggles — Essentials | In-depth | Study Plan */}
                      <div className="sv-hdr-controls">
                        <div className="sv-hdr-modes">
                          <button id="studybar-mode-quick" type="button"
                            className={`sv-hdr-mode-btn${activeTool === "summary" ? " active-quick" : ""}`}
                            onClick={() => setActiveTool("summary")} title="Essentials"
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                            Essentials
                          </button>
                          <button id="studybar-mode-detailed" type="button"
                            className={`sv-hdr-mode-btn${activeTool === "detailed" ? " active-detailed" : ""}`}
                            onClick={() => setActiveTool("detailed")} title="In-depth"
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v4l2 2"/></svg>
                            In-depth
                          </button>
                          <button id="studybar-mode-study-plan" type="button"
                            className={`sv-hdr-mode-btn${activeTool === "study_plan" ? " active-plan" : ""}`}
                            onClick={() => setActiveTool("study_plan")} title="Study Plan"
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                            Study Plan
                          </button>
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
                        {!isMoocMode && !["videos", "pyq", "summary", "detailed", "study_plan", "assessment", "flashcards", "revision_flashcards", "ask", "foundation"].includes(activeTool) && (
                          <h1 className="st-page-title" style={{ margin: 0, fontSize: "1.6rem" }}>
                            {TOOL_LABELS[activeTool]}
                          </h1>
                        )}
                        {activeTool !== "podcasts" && activeTool !== "foundation" && activeTool !== "study_plan" && (
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
                    activeTool === "assessment" || activeTool === "summary" || activeTool === "detailed" || activeTool === "study_plan" ||
                    activeTool === "videos" || activeTool === "ask"
                    ? "transparent"
                    : "#ffffff",
                borderRadius: (activeTool === "mocktest" || activeTool === "pre_final_test" || activeTool === "videos" || activeTool === "ask") ? "0px" : "6px",
                position: "relative",
                border:
                  activeTool === "mocktest" ||
                    activeTool === "pre_final_test" ||
                    activeTool === "flashcards" ||
                    activeTool === "revision_flashcards" ||
                    activeTool === "assessment" ||
                    activeTool === "videos" ||
                    activeTool === "ask"
                    ? "none"
                    : activeTool === "podcasts"
                      ? "none"
                      : activeTool === "summary" || activeTool === "detailed" || activeTool === "study_plan"
                        ? "1px solid #22c55e4D"
                        : "1px solid #E2E8F0",
                overflowX: "hidden",
                overflowY:
                  activeTool === "flashcards" || activeTool === "revision_flashcards" ||
                    activeTool === "ask"
                    ? "hidden"
                    : "auto",
                paddingTop:
                  (activeTool === "mocktest" || activeTool === "pre_final_test" || activeTool === "videos" || activeTool === "ask")
                    ? "0px"
                    : (activeTool === "flashcards" || activeTool === "revision_flashcards")
                      ? "0px"
                      : activeTool === "assessment"
                        ? "12px"
                        : activeTool === "podcasts"
                          ? "16px"
                          : activeTool === "deep_dive"
                            ? "8px"
                            : activeTool === "summary" || activeTool === "detailed" || activeTool === "study_plan"
                              ? "0px"
                              : "20px",
                paddingRight: (activeTool === "flashcards" || activeTool === "revision_flashcards" || activeTool === "videos" || activeTool === "ask") ? "0px" : (activeTool === "summary" || activeTool === "detailed" || activeTool === "study_plan") ? "48px" : "16px",
                paddingBottom: (activeTool === "flashcards" || activeTool === "revision_flashcards" || activeTool === "videos" || activeTool === "ask") ? "0px" : "16px",
                paddingLeft: (activeTool === "flashcards" || activeTool === "revision_flashcards" || activeTool === "videos" || activeTool === "ask") ? "0px" : (activeTool === "summary" || activeTool === "detailed" || activeTool === "study_plan") ? "48px" : "16px",
                transition: "padding-top 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            >
              {renderContent()}
            </div>



            {/* Floating guided flow navigation controls */}
            {isMoocMode && guidedFlowIdx !== -1 && !isFocusModeActive && activeTool !== "mocktest" && activeTool !== "pre_final_test" && activeTool !== "ask" && (

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

