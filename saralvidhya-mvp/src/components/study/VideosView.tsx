import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import MarkdownView from "@/components/MarkdownView";
import { getResourceContent, type Chapter, type ChapterVideo, type DifficultyLevel } from "@/data/contentRepository";
import { getRegistryChapterData } from "@/data/manifestService";
import { cloudStorage, useCloudState } from "@/context/CloudStateContext";
const WATCHED_THRESHOLD_PCT = 90;

export interface VideosViewProps {
  chapterName: string;
  subjectId: string;
  chapterNumber: number;
  youtubeLinksContent?: string | null;
  persona?: DifficultyLevel;
  onDownloadTranscriptLoaded?: (handler: (() => void) | null) => void;
  onAddBookmarkLoaded?: (handler: (() => void) | null) => void;
  onSelectChapter?: (num: number) => void;
  subjectChapters?: Chapter[];
  isCompleted?: boolean;
  onComplete?: () => void;
  chapterVideos?: ChapterVideo[];
  activeVideoIndex?: number;
  onVideoWatched?: (videoIndex: number, advance: boolean) => void;
  isVideoWatchedAt?: (videoIndex: number) => boolean;
  isVideoPlayableAt?: (videoIndex: number) => boolean;
  onSelectVideoIndex?: (videoIndex: number) => void;
}

const KNOWN_VIDEOS_METADATA: Record<string, { title: string; topics: string[]; duration?: string }> = {};

/** Faint green insect outline watermark matching Figma */
const InsectWatermark = ({ width = "165px", height = "165px", opacity = 0.22 }: { width?: string; height?: string; opacity?: number }) => (
  <svg
    viewBox="0 0 200 200"
    fill="none"
    stroke="#7BA88B"
    strokeWidth="1.35"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{
      position: "absolute",
      right: "12px",
      bottom: "6px",
      width,
      height,
      opacity,
      pointerEvents: "none",
      zIndex: 0,
    }}
  >
    {/* Head & antennae */}
    <ellipse cx="100" cy="42" rx="12" ry="10" />
    <path d="M94 35 Q80 18 68 22" />
    <path d="M106 35 Q120 18 132 22" />
    <circle cx="95" cy="41" r="2.5" fill="#7BA88B" />
    <circle cx="105" cy="41" r="2.5" fill="#7BA88B" />
    {/* Thorax */}
    <ellipse cx="100" cy="70" rx="16" ry="18" />
    {/* Abdomen segmented */}
    <path d="M88 88 Q76 122 100 158 Q124 122 112 88 Z" />
    <line x1="84" y1="102" x2="116" y2="102" />
    <line x1="87" y1="117" x2="113" y2="117" />
    <line x1="91" y1="132" x2="109" y2="132" />
    <line x1="96" y1="146" x2="104" y2="146" />
    {/* Forewings */}
    <path d="M92 64 C58 38 22 58 42 105 C58 122 84 84 92 70" />
    <path d="M108 64 C142 38 178 58 158 105 C142 122 116 84 108 70" />
    {/* Hindwings */}
    <path d="M90 73 C68 64 45 84 60 118 C70 128 86 100 90 78" />
    <path d="M110 73 C132 64 155 84 140 118 C130 128 114 100 110 78" />
    {/* Veins */}
    <path d="M42 105 Q68 80 92 68" strokeDasharray="3 2" />
    <path d="M158 105 Q132 80 108 68" strokeDasharray="3 2" />
    {/* Legs */}
    <path d="M86 66 Q64 64 50 78" />
    <path d="M114 66 Q136 64 150 78" />
    <path d="M86 76 Q56 86 48 114" />
    <path d="M114 76 Q144 86 152 114" />
    <path d="M88 84 Q60 114 64 146" />
    <path d="M112 84 Q140 114 136 146" />
  </svg>
);

/** Dedicated Figma topic icon per row (0 to 4) */
const renderTopicIcon = (index: number, size = 18) => {
  const iconIdx = index % 5;
  switch (iconIdx) {
    case 0:
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#4B5563" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="9" y1="13" x2="15" y2="13" />
          <line x1="9" y1="17" x2="13" y2="17" />
        </svg>
      );
    case 1:
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#4B5563" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z" />
          <line x1="16" y1="8" x2="2" y2="22" />
        </svg>
      );
    case 2:
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#4B5563" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="13" r="7" />
          <line x1="12" y1="6" x2="12" y2="2" />
          <path d="M8 3.5l2 2.5" />
          <path d="M16 3.5l-2 2.5" />
          <line x1="9" y1="12" x2="15" y2="12" />
          <circle cx="12" cy="15" r="1.2" fill="#4B5563" />
        </svg>
      );
    case 3:
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#4B5563" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      );
    case 4:
    default:
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#4B5563" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 2v5.5L4.5 18a2 2 0 0 0 1.7 3h11.6a2 2 0 0 0 1.7-3L14 7.5V2" />
          <line x1="8" y1="2" x2="16" y2="2" />
          <line x1="7" y1="15" x2="17" y2="15" />
        </svg>
      );
  }
};

export default function VideosView({
  chapterName,
  subjectId,
  chapterNumber,
  youtubeLinksContent,
  persona = "intermediate",
  onDownloadTranscriptLoaded,
  onAddBookmarkLoaded,
  onSelectChapter,
  subjectChapters,
  isCompleted = false,
  onComplete,
  chapterVideos,
  activeVideoIndex,
  onVideoWatched,
  isVideoWatchedAt,
  isVideoPlayableAt,
  onSelectVideoIndex,
}: VideosViewProps) {
  const { isHydrated } = useCloudState();
  const [activeVideo, setActiveVideo] = useState(() => {
    const savedIdx = cloudStorage.getItem(`sv_last_video_idx_${subjectId}_ch${chapterNumber}`);
    if (savedIdx != null) {
      const idx = parseInt(savedIdx, 10);
      if (!isNaN(idx) && idx >= 0) return idx;
    }
    return 0;
  });
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const [registryVideos, setRegistryVideos] = useState<ChapterVideo[]>([]);
  const [isRegistryLoaded, setIsRegistryLoaded] = useState(false);
  const playerReadyRef = useRef(false);
  const iframeLoadedRef = useRef(false);
  useEffect(() => {
    let cancelled = false;
    setIsRegistryLoaded(false);
    getRegistryChapterData(subjectId, chapterNumber)
      .then((reg) => {
        const regList = reg?.chapter?.videos || (reg as any)?.videos;
        if (cancelled) return;
        if (Array.isArray(regList) && regList.length > 0) {
          setRegistryVideos(
            regList.map((v: any, idx: number) => ({
              index: v.order ?? idx + 1,
              id: v.id || `vid_${idx + 1}`,
              title: v.title,
              ytId: v.videoId || v.ytId || "",
              duration: v.duration,
              thumbnailUrl: v.thumbnailUrl || v.thumbnail || reg?.chapter?.heroImageUrl,
              dir: "",
              topics: v.topics,
            })),
          );
        }
      })
      .finally(() => {
        if (!cancelled) setIsRegistryLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [subjectId, chapterNumber]);

  // Custom Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [isCcEnabled, setIsCcEnabled] = useState(false);
  const [showSpeedSelector, setShowSpeedSelector] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [seekFeedback, setSeekFeedback] = useState<"-10s" | "+10s" | "skip" | null>(null);

  // Track how many times each video (ytId) has been opened in the current login session via cloudStorage.
  const [videoOpenCounts, setVideoOpenCounts] = useState<Record<string, number>>(() => {
    try {
      const raw = cloudStorage.getItem("sv_video_open_counts");
      return raw ? (JSON.parse(raw) as Record<string, number>) : {};
    } catch {
      return {};
    }
  });
  const activePlaybackSessionYtIdRef = useRef<string | null>(null);

  const recordVideoOpen = useCallback((ytId?: string) => {
    if (!ytId) return;
    if (activePlaybackSessionYtIdRef.current === ytId) return;
    activePlaybackSessionYtIdRef.current = ytId;
    setVideoOpenCounts((prev) => {
      const next = { ...prev, [ytId]: (prev[ytId] || 0) + 1 };
      try {
        cloudStorage.setItem("sv_video_open_counts", JSON.stringify(next));
      } catch {
        /* ignore storage errors */
      }
      return next;
    });
  }, []);

  const playerRef = useRef<any>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const rowPlayerContainerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const autoPlayOnReadyRef = useRef<boolean>(false);
  const hideControlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasStartedPlayingRef = useRef<boolean>(false);
  const progressIntervalRef = useRef<any>(null);
  const isSeekingRef = useRef<boolean>(false);
  const lastSeekTargetRef = useRef<{ time: number; ts: number }>({ time: 0, ts: 0 });
  const seekResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seekFeedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showSeekBadge = (type: "-10s" | "+10s" | "skip") => {
    setSeekFeedback(type);
    if (seekFeedbackTimerRef.current) clearTimeout(seekFeedbackTimerRef.current);
    seekFeedbackTimerRef.current = setTimeout(() => {
      setSeekFeedback(null);
    }, type === "skip" ? 1100 : 650);
  };

  // 1. Build video list from registry / chapterVideos / manifest subjectChapters prop first
  const videos = useMemo(() => {
    const manifestVids = subjectChapters?.find((c) => c.number === chapterNumber)?.videos || [];
    const mappedManifestVids = manifestVids.map((v) => ({
      title: v.title,
      ytId: v.videoId || "",
      topics: v.topics,
      duration: v.duration,
      thumbnailUrl: v.thumbnailUrl || v.thumbnail,
    }));
    const sourceVideos =
      chapterVideos && chapterVideos.length > 0
        ? chapterVideos
        : registryVideos.length > 0
          ? registryVideos
          : mappedManifestVids;
    if (sourceVideos.length > 0) {
      return sourceVideos.map((v) => ({
        title: v.title,
        ytId: v.ytId,
        topics: v.topics,
        duration: v.duration,
        thumbnailUrl: v.thumbnailUrl,
      }));
    }
    let list: { title: string; ytId: string; topics?: string[]; duration?: string; thumbnailUrl?: string }[] = [];
    if (subjectId === "anu_physics") {
      list = [
        {
          title: "Relativistic Quantum Mechanics & Dirac Theory",
          ytId: "wla3hcd1S68",
          duration: "15:00min",
          topics: [
            "Derivation and Operator Interpretation of Klein-Gordon Equation",
            "Squaring Approach & Negative Energy Solutions",
            "Dirac Equation Formulation & Gamma Matrices",
            "Probability Density and Current Conservation",
            "Covariant Formulation & Lorentz Transformation Properties"
          ]
        }
      ];
    } else if (subjectId === "pubadm_ur" && chapterNumber === 1) {
      list = [
        {
          title: "Introduction to Public Administration",
          ytId: "zudAdjtoraA",
          duration: "12:30min",
          topics: [
            "Introduction to Public Administration & Core Concepts",
            "Evolution of Administrative Thought & Historical Context",
            "Scope and Significance in Modern Governance",
            "Key Differences between Public and Private Administration",
            "Administrative Paradigms and New Public Management"
          ]
        },
        {
          title: "Organizational Structure & Theories",
          ytId: "LEfMH2SNznY",
          duration: "14:10min",
          topics: [
            "Organizational Structure & Bureaucratic Theories",
            "Principles of Scientific Management (F.W. Taylor)",
            "Classical Administrative Theory (Henri Fayol)",
            "Human Relations Approach & Hawthorne Experiments",
            "Behavioral Approaches & Informal Organizations"
          ]
        },
        {
          title: "Decision Making & Accountability",
          ytId: "vb9N0S158GA",
          duration: "10:45min",
          topics: [
            "Decision Making in Administration (Herbert Simon)",
            "Motivation and Leadership in Public Organizations",
            "Comparative Public Administration & Development",
            "Accountability and Control Mechanisms in Public Services",
            "Citizen Charters, Transparency & RTI Act Dynamics"
          ]
        }
      ];
    } else if (subjectId === "management") {
      list = [
        {
          title: "Importance and Scope of Marketing",
          ytId: "HKKodDR1VN8",
          duration: "13:20min",
          topics: [
            "Introduction to Marketing Concepts & Nine Core Elements",
            "The Evolution of Marketing Thought & Modern Management Tasks",
            "Marketing Environment Analysis & Customer Value Equations",
            "Industrial (B2B) Marketing & Demand Volatility Strategies",
            "Integrated Marketing Communications Framework"
          ]
        },
        {
          title: "Services Marketing",
          ytId: "QIPTU6R6-8U",
          duration: "12:15min",
          topics: [
            "Introduction to Services Marketing & Economic Context",
            "Uber Case Study & Service Industry Business Models",
            "The Six Inherent Characteristics of Services",
            "The Extended Seven Ps Framework & Service Excellence",
            "Service Quality Gaps & Customer Expectation Models"
          ]
        },
        {
          title: "Global Marketing",
          ytId: "JUth69rroDM",
          duration: "15:10min",
          topics: [
            "Global Marketing Definitions & Core Analytical Concepts",
            "Global Strategy Dilemmas & Market Expansion Frameworks",
            "Multinational Case Studies & Foundational Competitive Benefits",
            "Critical International Challenges & Cultural Adaptations",
            "Global Supply Chain Alignment & Standardization vs Localization"
          ]
        }
      ];
    }

    if (youtubeLinksContent) {
      const ytRegex = /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/g;
      let match;
      let idx = 1;
      while ((match = ytRegex.exec(youtubeLinksContent)) !== null) {
        const id = match[1];
        if (!list.some((v) => v.ytId === id)) {
          list.push({
            title: `Video Lecture Part ${idx++}`,
            ytId: id,
            duration: "10:15min",
            topics: [
              "Key conceptual overview & core principles",
              "Structural anatomy and physiological pathways",
              "Synthesis of key takeaways and summary points"
            ]
          });
        }
      }
    }

    if (list.length === 0) {
      list = [
        {
          title: chapterName || "Chapter Video Lecture",
          ytId: "",
          duration: "10:15min",
          topics: []
        }
      ];
    }

    return list;
  }, [subjectId, chapterNumber, youtubeLinksContent, chapterName, chapterVideos, registryVideos, subjectChapters]);

  const robustActive = activeVideo >= videos.length ? 0 : activeVideo;
  const currentVideo = videos[robustActive] || videos[0];
  const isSingleVideo = videos.length <= 1;

  // Active index sync from parent (only for segmented chapters) or cloud storage
  const isParentSegmented = Boolean(chapterVideos && chapterVideos.length > 0);
  useEffect(() => {
    if (isParentSegmented && activeVideoIndex && activeVideoIndex >= 1 && activeVideoIndex <= videos.length) {
      setActiveVideo(activeVideoIndex - 1);
      return;
    }
    const syncSavedVideoIdx = () => {
      const savedIdx = cloudStorage.getItem(`sv_last_video_idx_${subjectId}_ch${chapterNumber}`);
      if (savedIdx != null) {
        const idx = parseInt(savedIdx, 10);
        if (!isNaN(idx) && idx >= 0 && (videos.length === 0 || idx < videos.length)) {
          setActiveVideo((prev) => (prev !== idx ? idx : prev));
        }
      }
    };
    syncSavedVideoIdx();
    return cloudStorage.subscribe(syncSavedVideoIdx);
  }, [isParentSegmented, activeVideoIndex, videos.length, subjectId, chapterNumber]);

  useEffect(() => {
    if (!isHydrated || !isRegistryLoaded || !currentVideo?.ytId) return;
    cloudStorage.setItem(`sv_last_video_idx_${subjectId}_ch${chapterNumber}`, String(robustActive));
  }, [robustActive, subjectId, chapterNumber, isHydrated, isRegistryLoaded, currentVideo?.ytId]);
  const completedStorageKey = `sv_watch_done_${subjectId}_ch${chapterNumber}`;
  const [completedVideos, setCompletedVideos] = useState<Set<number>>(() => {
    try {
      const raw = cloudStorage.getItem(completedStorageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return new Set(parsed);
      }
    } catch {
      // ignore
    }
    return new Set();
  });

  useEffect(() => {
    let lastRaw: string | null = null;
    const syncCompleted = () => {
      try {
        const raw = cloudStorage.getItem(completedStorageKey);
        if (raw === lastRaw) return;
        lastRaw = raw;
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            setCompletedVideos(new Set(parsed));
            return;
          }
        }
      } catch {
        // ignore
      }
      setCompletedVideos((prev) => (prev.size === 0 ? prev : new Set()));
    };
    syncCompleted();
    return cloudStorage.subscribe(syncCompleted);
  }, [completedStorageKey]);
  const markVideoDone = useCallback(
    (idx: number) => {
      setCompletedVideos((prev) => {
        if (prev.has(idx)) return prev;
        const next = new Set(prev);
        next.add(idx);
        try {
          cloudStorage.setItem(completedStorageKey, JSON.stringify(Array.from(next)));
        } catch {
          // ignore
        }
        return next;
      });
    },
    [completedStorageKey],
  );

  const onVideoWatchedRef = useRef(onVideoWatched);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onVideoWatchedRef.current = onVideoWatched;
    onCompleteRef.current = onComplete;
  });

  const notifiedWatchedSetRef = useRef<Set<string>>(new Set());

  const markWatched = useCallback((videoIndex: number, advance = false) => {
    markVideoDone(videoIndex - 1);
    const notifyKey = `${subjectId}_${chapterNumber}_${videoIndex}_${advance ? "adv" : " threshold"}`;
    if (notifiedWatchedSetRef.current.has(notifyKey)) return;
    notifiedWatchedSetRef.current.add(notifyKey);
    onVideoWatchedRef.current?.(videoIndex, advance);
  }, [markVideoDone, subjectId, chapterNumber]);

  const markWatchedRef = useRef(markWatched);
  useEffect(() => {
    markWatchedRef.current = markWatched;
  }, [markWatched]);

  const sendYtIframeCommand = useCallback(
    (func: string, args: any[] = []) => {
      try {
        if (currentVideo?.ytId) {
          const iframeEl = document.getElementById(`yt-player-${currentVideo.ytId}`) as HTMLIFrameElement | null;
          iframeEl?.contentWindow?.postMessage(
            JSON.stringify({ event: "command", func, args }),
            "*",
          );
        }
      } catch {}
    },
    [currentVideo?.ytId],
  );
  // Format time utility
  const formatTime = (sec: number) => {
    if (isNaN(sec) || sec < 0) return "00:00";
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const videoTimeStorageKey = currentVideo?.ytId
    ? `sv_video_time_${subjectId}_ch${chapterNumber}_${currentVideo.ytId}`
    : "";
  const lastVideoTimeSaveRef = useRef<number>(0);
  const restoredVideoTimeRef = useRef<number>(0);

  // Restore saved video playback position immediately for visual progress bar & timestamp
  useEffect(() => {
    if (!videoTimeStorageKey) return;
    const applySavedVideoTime = () => {
      try {
        const raw = cloudStorage.getItem(videoTimeStorageKey);
        if (!raw) {
          restoredVideoTimeRef.current = 0;
          if (!isPlaying) {
            setCurrentTime(0);
            setProgress(0);
          }
          return;
        }
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed.currentTime === "number" && parsed.currentTime > 1) {
          restoredVideoTimeRef.current = parsed.currentTime;
          setCurrentTime(parsed.currentTime);
          if (typeof parsed.duration === "number" && parsed.duration > 0) {
            setDuration(parsed.duration);
            setProgress(Math.min(100, (parsed.currentTime / parsed.duration) * 100));
          }
        }
      } catch {
        // ignore
      }
    };
    applySavedVideoTime();
    return cloudStorage.subscribe(() => {
      if (!isPlaying) {
        applySavedVideoTime();
      }
    });
  }, [videoTimeStorageKey, isPlaying]);

  // YouTube Player setup
  useEffect(() => {
    hasStartedPlayingRef.current = false;
    playerReadyRef.current = false;
    iframeLoadedRef.current = false;
    if (!isRegistryLoaded || !currentVideo?.ytId) return;
    if (!(window as any).YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
    }

    let checkInterval: any;
    const timeKey = `sv_video_time_${subjectId}_ch${chapterNumber}_${currentVideo.ytId}`;

    const readSavedSec = (): number => {
      try {
        const raw = cloudStorage.getItem(timeKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed.currentTime === "number" && parsed.currentTime > 1) {
            return parsed.currentTime;
          }
        }
      } catch {}
      return 0;
    };

    const persistVideoSec = (cur: number, dur: number, force = false) => {
      if (!timeKey || cur <= 0) return;
      const now = Date.now();
      if (!force && now - lastVideoTimeSaveRef.current < 3000) return;
      lastVideoTimeSaveRef.current = now;
      restoredVideoTimeRef.current = cur;
      try {
        cloudStorage.setItem(
          timeKey,
          JSON.stringify({ currentTime: cur, duration: dur, updatedAt: now }),
        );
      } catch {}
    };

    const initPlayer = () => {
      const elementId = `yt-player-${currentVideo.ytId}`;
      const el = document.getElementById(elementId);
      if (!el) return;

      try {
        playerRef.current = new (window as any).YT.Player(elementId, {
          events: {
            onReady: (event: any) => {
              playerReadyRef.current = true;
              try {
                if (event.target) {
                  if (typeof event.target.unloadModule === "function") {
                    event.target.unloadModule("captions");
                  }
                  if (typeof event.target.setOption === "function") {
                    event.target.setOption("captions", "track", {});
                  }
                  const dur = typeof event.target.getDuration === "function" ? event.target.getDuration() : 0;
                  const savedSec = Math.max(readSavedSec(), restoredVideoTimeRef.current);
                  if (savedSec > 1) {
                    restoredVideoTimeRef.current = savedSec;
                    setCurrentTime(savedSec);
                  }
                  if (dur > 0) {
                    setDuration(dur);
                    if (savedSec > 1 && savedSec < dur - 2) {
                      setProgress((savedSec / dur) * 100);
                    }
                  }
                  const fsReady = !!(
                    document.fullscreenElement ||
                    (document as any).webkitFullscreenElement ||
                    (document as any).mozFullScreenElement ||
                    (document as any).msFullscreenElement ||
                    isFullscreenRef.current
                  );
                  if (autoPlayOnReadyRef.current && fsReady && typeof event.target.playVideo === "function") {
                    autoPlayOnReadyRef.current = false;
                    if (savedSec > 1 && typeof event.target.seekTo === "function") {
                      event.target.seekTo(savedSec, true);
                    }
                    event.target.playVideo();
                  } else if (!fsReady) {
                    autoPlayOnReadyRef.current = false;
                    try {
                      event.target.pauseVideo?.();
                    } catch {}
                  }
                }
              } catch (err) {}
            },
            onStateChange: (event: any) => {
              const state = event.data;
              const YT = (window as any).YT;
              const fsNow = !!(
                document.fullscreenElement ||
                (document as any).webkitFullscreenElement ||
                (document as any).mozFullScreenElement ||
                (document as any).msFullscreenElement ||
                isFullscreenRef.current
              );
              if (state === YT?.PlayerState?.PLAYING || state === 1) {
                if (!fsNow) {
                  isSeekingRef.current = false;
                  autoPlayOnReadyRef.current = false;
                  setIsPlaying(false);
                  isPlayingRef.current = false;
                  if (progressIntervalRef.current) {
                    clearInterval(progressIntervalRef.current);
                    progressIntervalRef.current = null;
                  }
                  try {
                    event?.target?.pauseVideo?.();
                    playerRef.current?.pauseVideo?.();
                  } catch {}
                  return;
                }
                isSeekingRef.current = false;
                recordVideoOpen(currentVideo.ytId);
                if (!isCcEnabledRef.current && playerRef.current) {
                  try {
                    playerRef.current.unloadModule?.("captions");
                    playerRef.current.setOption?.("captions", "track", {});
                  } catch (e) {}
                }
                if (!hasStartedPlayingRef.current && playerRef.current) {
                  const savedSec = Math.max(readSavedSec(), restoredVideoTimeRef.current);
                  const curNow = typeof playerRef.current.getCurrentTime === "function" ? playerRef.current.getCurrentTime() : 0;
                  const durNow = typeof playerRef.current.getDuration === "function" ? playerRef.current.getDuration() : 0;
                  if (savedSec > 1 && Math.abs(curNow - savedSec) > 2 && (durNow <= 0 || savedSec < durNow - 2)) {
                    try {
                      playerRef.current.seekTo?.(savedSec, true);
                      setCurrentTime(savedSec);
                      if (durNow > 0) setProgress((savedSec / durNow) * 100);
                    } catch {}
                  }
                }
                hasStartedPlayingRef.current = true;
                setIsPlaying(true);
                if (!progressIntervalRef.current) {
                  progressIntervalRef.current = setInterval(() => {
                    const stillFs = !!(
                      document.fullscreenElement ||
                      (document as any).webkitFullscreenElement ||
                      (document as any).mozFullScreenElement ||
                      (document as any).msFullscreenElement ||
                      isFullscreenRef.current
                    );
                    if (!stillFs) {
                      isSeekingRef.current = false;
                      autoPlayOnReadyRef.current = false;
                      setIsPlaying(false);
                      isPlayingRef.current = false;
                      try {
                        playerRef.current?.pauseVideo?.();
                      } catch {}
                      if (progressIntervalRef.current) {
                        clearInterval(progressIntervalRef.current);
                        progressIntervalRef.current = null;
                      }
                      return;
                    }
                    if (playerRef.current && typeof playerRef.current.getCurrentTime === "function") {
                      const cur = playerRef.current.getCurrentTime();
                      const dur = playerRef.current.getDuration();
                      if (dur > 0) {
                        const sinceSeek = Date.now() - lastSeekTargetRef.current.ts;
                        if (sinceSeek < 1500 && Math.abs(cur - lastSeekTargetRef.current.time) > 3) {
                          return;
                        }
                        const pct = (cur / dur) * 100;
                        setCurrentTime(cur);
                        setDuration(dur);
                        setProgress(pct);
                        persistVideoSec(cur, dur, false);
                        if (pct >= WATCHED_THRESHOLD_PCT && hasStartedPlayingRef.current) {
                          markWatchedRef.current(robustActive + 1, false);
                        }
                      }
                    }
                  }, 500);
                }
              } else if (state === YT?.PlayerState?.BUFFERING || state === 3) {
                if (!fsNow) {
                  isSeekingRef.current = false;
                  autoPlayOnReadyRef.current = false;
                  setIsPlaying(false);
                  isPlayingRef.current = false;
                  try {
                    event?.target?.pauseVideo?.();
                    playerRef.current?.pauseVideo?.();
                  } catch {}
                  return;
                }
                // Buffering during seek or playback
                if (isSeekingRef.current && playerRef.current) {
                  try {
                    playerRef.current.playVideo?.();
                  } catch (e) {}
                }
              } else if (state === YT?.PlayerState?.ENDED || state === 0) {
                isSeekingRef.current = false;
                activePlaybackSessionYtIdRef.current = null;
                setIsPlaying(false);
                if (progressIntervalRef.current) {
                  clearInterval(progressIntervalRef.current);
                  progressIntervalRef.current = null;
                }
                try {
                  cloudStorage.removeItem(timeKey);
                  restoredVideoTimeRef.current = 0;
                } catch {}
                if (hasStartedPlayingRef.current) {
                  hasStartedPlayingRef.current = false;
                  markWatchedRef.current(robustActive + 1, true);
                  if (onCompleteRef.current) onCompleteRef.current();
                }
              } else if (state === YT?.PlayerState?.PAUSED || state === 2) {
                if (isSeekingRef.current) {
                  // YouTube's internal seek pause event - force resume playback!
                  try {
                    playerRef.current?.playVideo?.();
                  } catch (e) {}
                  return;
                }
                if (playerRef.current && typeof playerRef.current.getCurrentTime === "function") {
                  const cur = playerRef.current.getCurrentTime();
                  const dur = typeof playerRef.current.getDuration === "function" ? playerRef.current.getDuration() : duration;
                  if (cur > 1) {
                    persistVideoSec(cur, dur || 0, true);
                  }
                }
                setIsPlaying(false);
                if (progressIntervalRef.current) {
                  clearInterval(progressIntervalRef.current);
                  progressIntervalRef.current = null;
                }
              }
            },
          },
        });
      } catch (err) {
        console.warn("Error initializing YT player:", err);
      }
    };

    const handleUnloadSave = () => {
      if (playerReadyRef.current && playerRef.current && typeof playerRef.current.getCurrentTime === "function") {
        try {
          const cur = playerRef.current.getCurrentTime();
          const dur = typeof playerRef.current.getDuration === "function" ? playerRef.current.getDuration() : 0;
          if (cur > 1 && (!dur || cur < dur - 2)) {
            persistVideoSec(cur, dur, true);
          }
        } catch {}
      }
    };

    const handleVisibilitySave = () => {
      if (document.visibilityState === "hidden") {
        handleUnloadSave();
      }
    };

    window.addEventListener("beforeunload", handleUnloadSave);
    window.addEventListener("pagehide", handleUnloadSave);
    document.addEventListener("visibilitychange", handleVisibilitySave);

    checkInterval = setInterval(() => {
      const el = document.getElementById(`yt-player-${currentVideo.ytId}`);
      if (
        (iframeLoadedRef.current || el) &&
        (window as any).YT &&
        (window as any).YT.Player &&
        el
      ) {
        clearInterval(checkInterval);
        initPlayer();
      }
    }, 150);

    return () => {
      clearInterval(checkInterval);
      window.removeEventListener("beforeunload", handleUnloadSave);
      window.removeEventListener("pagehide", handleUnloadSave);
      document.removeEventListener("visibilitychange", handleVisibilitySave);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      handleUnloadSave();
      try {
        playerRef.current?.destroy?.();
      } catch {}
      playerReadyRef.current = false;
      playerRef.current = null;
    };
  }, [isRegistryLoaded, currentVideo?.ytId, robustActive, subjectId, chapterNumber]);
  // Player controls
  const handlePlayPause = () => {
    if (isPlaying && isCurrentlyFullscreen()) {
      playerRef.current?.pauseVideo?.();
      sendYtIframeCommand("pauseVideo", []);
    } else {
      if (!isCurrentlyFullscreen()) {
        enterFullscreen(currentVideo?.ytId);
      }
      if (!playerRef.current || !playerReadyRef.current) {
        autoPlayOnReadyRef.current = true;
        if (restoredVideoTimeRef.current > 1) {
          sendYtIframeCommand("seekTo", [restoredVideoTimeRef.current, true]);
        }
        sendYtIframeCommand("playVideo", []);
        return;
      }
      if (!hasStartedPlayingRef.current && restoredVideoTimeRef.current > 1) {
        try {
          playerRef.current.seekTo?.(restoredVideoTimeRef.current, true);
          sendYtIframeCommand("seekTo", [restoredVideoTimeRef.current, true]);
        } catch {}
      }
      playerRef.current.playVideo?.();
      sendYtIframeCommand("playVideo", []);
    }
  };

  const handleRewind10 = () => {
    isSeekingRef.current = true;
    showSeekBadge("-10s");
    const cur =
      playerRef.current && typeof playerRef.current.getCurrentTime === "function"
        ? playerRef.current.getCurrentTime()
        : currentTime;
    const target = Math.max(0, cur - 10);
    lastSeekTargetRef.current = { time: target, ts: Date.now() };
    playerRef.current?.seekTo?.(target, true);
    sendYtIframeCommand("seekTo", [target, true]);
    setCurrentTime(target);
    const dur =
      (playerRef.current && typeof playerRef.current.getDuration === "function"
        ? playerRef.current.getDuration()
        : duration) || effectiveDurationSec;
    if (dur > 0) setProgress((target / dur) * 100);
    setIsPlaying(true);
    try {
      playerRef.current?.playVideo?.();
      sendYtIframeCommand("playVideo", []);
    } catch (e) {}
    setTimeout(() => {
      try {
        playerRef.current?.playVideo?.();
        sendYtIframeCommand("playVideo", []);
      } catch (e) {}
    }, 60);
  };

  const handleForward10 = () => {
    isSeekingRef.current = true;
    showSeekBadge("+10s");
    const cur =
      playerRef.current && typeof playerRef.current.getCurrentTime === "function"
        ? playerRef.current.getCurrentTime()
        : currentTime;
    const dur =
      (playerRef.current && typeof playerRef.current.getDuration === "function"
        ? playerRef.current.getDuration()
        : duration) || effectiveDurationSec;
    const target = Math.min(dur || 900, cur + 10);
    lastSeekTargetRef.current = { time: target, ts: Date.now() };
    playerRef.current?.seekTo?.(target, true);
    sendYtIframeCommand("seekTo", [target, true]);
    setCurrentTime(target);
    if (dur > 0) setProgress((target / dur) * 100);
    setIsPlaying(true);
    try {
      playerRef.current?.playVideo?.();
      sendYtIframeCommand("playVideo", []);
    } catch (e) {}
    setTimeout(() => {
      try {
        playerRef.current?.playVideo?.();
        sendYtIframeCommand("playVideo", []);
      } catch (e) {}
    }, 60);
  };

  const handleSeekClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!playerRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const dur = duration || 615;
    const newTime = ratio * dur;
    playerRef.current.seekTo?.(newTime, true);
    setCurrentTime(newTime);
    setProgress(ratio * 100);
    restoredVideoTimeRef.current = newTime;
    if (videoTimeStorageKey && newTime > 1) {
      try {
        cloudStorage.setItem(
          videoTimeStorageKey,
          JSON.stringify({ currentTime: newTime, duration: dur, updatedAt: Date.now() }),
        );
      } catch {}
    }
    if (isPlayingRef.current) {
      playerRef.current.playVideo?.();
    }
  };

  // Netflix-style Skip Intro (available inside player during the first 2 minutes / 120s, including on fresh login)
  const canSkipIntro =
    currentTime < 120 &&
    (duration === 0 || duration > 125);
  const canSkipIntroRef = useRef(canSkipIntro);
  useEffect(() => {
    canSkipIntroRef.current = canSkipIntro;
  }, [canSkipIntro]);

  const handleSkipIntro = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    const target = 120; // 2 minutes (120 seconds)
    const dur = typeof playerRef.current?.getDuration === "function" ? playerRef.current.getDuration() : duration;
    const safeTarget = dur > 0 ? Math.min(target, Math.max(0, dur - 5)) : target;
    isSeekingRef.current = true;
    showSeekBadge("skip");
    if (playerRef.current) {
      playerRef.current.seekTo?.(safeTarget, true);
    }
    setCurrentTime(safeTarget);
    if (dur > 0) setProgress((safeTarget / dur) * 100);
    setIsPlaying(true);
    try {
      playerRef.current?.playVideo?.();
    } catch (err) {}
    setTimeout(() => {
      try {
        playerRef.current?.playVideo?.();
      } catch (err) {}
    }, 80);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setVolume(val);
    if (playerRef.current?.setVolume) {
      playerRef.current.setVolume(val);
    }
    if (val > 0 && isMuted) {
      setIsMuted(false);
      playerRef.current?.unMute?.();
    }
  };

  const toggleMute = () => {
    if (!playerRef.current) return;
    if (isMuted) {
      playerRef.current.unMute?.();
      setIsMuted(false);
      if (volume === 0) setVolume(50);
    } else {
      playerRef.current.mute?.();
      setIsMuted(true);
    }
  };

  const isCcEnabledRef = useRef(isCcEnabled);
  useEffect(() => {
    isCcEnabledRef.current = isCcEnabled;
  }, [isCcEnabled]);

  const isFullscreenRef = useRef(isFullscreen);
  useEffect(() => {
    isFullscreenRef.current = isFullscreen;
  }, [isFullscreen]);

  const toggleCc = () => {
    const nextState = !isCcEnabled;
    setIsCcEnabled(nextState);
    isCcEnabledRef.current = nextState;
    if (!playerRef.current) return;
    try {
      if (nextState) {
        playerRef.current.loadModule?.("captions");
        playerRef.current.setOption?.("captions", "track", { languageCode: "en" });
      } else {
        playerRef.current.unloadModule?.("captions");
        playerRef.current.setOption?.("captions", "track", {});
      }
    } catch (err) {}
  };

  const enterFullscreen = (targetYtId?: string) => {
    const container = playerContainerRef.current;
    if (!container) return;
    recordVideoOpen(targetYtId || currentVideo?.ytId);
    try {
      if (container.requestFullscreen) {
        container.requestFullscreen().catch(() => {});
      } else if ((container as any).webkitRequestFullscreen) {
        (container as any).webkitRequestFullscreen();
      } else if ((container as any).mozRequestFullScreen) {
        (container as any).mozRequestFullScreen();
      } else if ((container as any).msRequestFullscreen) {
        (container as any).msRequestFullscreen();
      }
      setIsFullscreen(true);
      isFullscreenRef.current = true;
    } catch (e) {}
  };

  const forcePauseOnExitFullscreen = () => {
    activePlaybackSessionYtIdRef.current = null;
    isSeekingRef.current = false;
    autoPlayOnReadyRef.current = false;
    setIsFullscreen(false);
    isFullscreenRef.current = false;
    setIsPlaying(false);
    isPlayingRef.current = false;
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    const pauseNow = () => {
      try {
        playerRef.current?.pauseVideo?.();
      } catch (e) {}
      try {
        if (currentVideo?.ytId) {
          const iframeEl = document.getElementById(`yt-player-${currentVideo.ytId}`) as HTMLIFrameElement | null;
          iframeEl?.contentWindow?.postMessage('{"event":"command","func":"pauseVideo","args":""}', "*");
        }
      } catch (e) {}
    };
    pauseNow();
    setTimeout(() => {
      if (!isFullscreenRef.current) pauseNow();
    }, 150);
    setTimeout(() => {
      if (!isFullscreenRef.current) pauseNow();
    }, 400);
  };

  const exitFullscreen = () => {
    forcePauseOnExitFullscreen();
    try {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      } else if ((document as any).mozCancelFullScreen) {
        (document as any).mozCancelFullScreen();
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen();
      }
    } catch (e) {}
  };

  const isCurrentlyFullscreen = () => {
    return !!(
      document.fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).mozFullScreenElement ||
      (document as any).msFullscreenElement ||
      isFullscreenRef.current
    );
  };

  const toggleFullscreen = () => {
    if (isCurrentlyFullscreen()) {
      exitFullscreen();
    } else {
      enterFullscreen();
    }
  };

  useEffect(() => {
    const handler = () => {
      const fs = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      if (!fs) {
        forcePauseOnExitFullscreen();
      } else {
        setIsFullscreen(true);
        isFullscreenRef.current = true;
      }
    };
    document.addEventListener("fullscreenchange", handler);
    document.addEventListener("webkitfullscreenchange", handler);
    document.addEventListener("mozfullscreenchange", handler);
    document.addEventListener("MSFullscreenChange", handler);
    return () => {
      document.removeEventListener("fullscreenchange", handler);
      document.removeEventListener("webkitfullscreenchange", handler);
      document.removeEventListener("mozfullscreenchange", handler);
      document.removeEventListener("MSFullscreenChange", handler);
    };
  }, [currentVideo?.ytId]);

  const isPlayingRef = useRef(isPlaying);
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Click on video opens fullscreen by default if small, and plays.
  // In fullscreen:
  // - Left 30% click: Rewind 10s («)
  // - Right 30% click: Forward 10s (»)
  // - Center click: Toggle Play / Pause
  const handleVideoClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isCurrentlyFullscreen()) {
      handlePlayPause();
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = clickX / rect.width;

    if (ratio < 0.3) {
      handleRewind10();
    } else if (ratio > 0.7) {
      handleForward10();
    } else {
      handlePlayPause();
    }
  };

  // Keyboard shortcuts (YouTube style: Space = pause/play, Right = +10s, Left = -10s, F = fullscreen, C = captions, M = mute)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target) {
        const tagName = target.tagName;
        if (
          tagName === "INPUT" ||
          tagName === "TEXTAREA" ||
          target.isContentEditable ||
          target.closest("input, textarea, [contenteditable='true']")
        ) {
          return;
        }
      }

      if (e.code === "Space" || e.key === " " || e.key === "k" || e.key === "K") {
        e.preventDefault();
        handlePlayPause();
      } else if (e.key === "ArrowRight" || e.key === "l" || e.key === "L") {
        e.preventDefault();
        handleForward10();
      } else if (e.key === "ArrowLeft" || e.key === "j" || e.key === "J") {
        e.preventDefault();
        handleRewind10();
      } else if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === "c" || e.key === "C") {
        e.preventDefault();
        toggleCc();
      } else if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        toggleMute();
      } else if (e.key === "s" || e.key === "S") {
        if (canSkipIntroRef.current) {
          e.preventDefault();
          handleSkipIntro();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Controls Auto-Hide Logic:
  // When video is playing, controls hide after 2.8s of no mouse movement.
  // When cursor moves, controls immediately appear and timer resets.
  // When paused, controls remain visible.
  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (hideControlsTimerRef.current) {
      clearTimeout(hideControlsTimerRef.current);
      hideControlsTimerRef.current = null;
    }
    if (isPlaying) {
      hideControlsTimerRef.current = setTimeout(() => {
        setShowControls(false);
      }, 2800);
    }
  }, [isPlaying]);

  const handlePlayerMouseMove = useCallback(() => {
    resetControlsTimer();
  }, [resetControlsTimer]);

  const handlePlayerMouseLeave = useCallback(() => {
    if (isPlaying) {
      if (hideControlsTimerRef.current) {
        clearTimeout(hideControlsTimerRef.current);
      }
      hideControlsTimerRef.current = setTimeout(() => {
        setShowControls(false);
      }, 600);
    }
  }, [isPlaying]);

  useEffect(() => {
    if (!isPlaying) {
      setShowControls(true);
      if (hideControlsTimerRef.current) {
        clearTimeout(hideControlsTimerRef.current);
        hideControlsTimerRef.current = null;
      }
    } else {
      if (hideControlsTimerRef.current) {
        clearTimeout(hideControlsTimerRef.current);
      }
      hideControlsTimerRef.current = setTimeout(() => {
        setShowControls(false);
      }, 2800);
    }
    return () => {
      if (hideControlsTimerRef.current) {
        clearTimeout(hideControlsTimerRef.current);
      }
    };
  }, [isPlaying]);

  // Title and topics
  const displayTitle = currentVideo.title || chapterName || "Insects Digestive System";
  const displayDuration = useMemo(() => {
    if (currentVideo.duration) return currentVideo.duration;
    if (duration > 0) {
      const mins = Math.floor(duration / 60);
      const secs = Math.floor(duration % 60);
      return `${mins}:${String(secs).padStart(2, "0")}min`;
    }
    return "10:15min";
  }, [currentVideo.duration, duration]);

  const topicsList = useMemo(() => {
    let rawTopics: string[] = [];
    if (currentVideo.topics && currentVideo.topics.length > 0) {
      rawTopics = currentVideo.topics;
    } else {
      const curated = KNOWN_VIDEOS_METADATA[currentVideo.ytId];
      if (curated?.topics && curated.topics.length > 0) {
        rawTopics = curated.topics;
      } else {
        const cleanBase = (displayTitle || chapterName || "Core Concepts")
          .replace(/^Part\s*\d+\s*:\s*/i, "")
          .trim();
        rawTopics = [
          `${cleanBase}: Foundations & Architecture`,
          `Core Mechanisms, Models & System Components`,
          `Practical Applications, Roles & Structural Summary`,
        ];
      }
    }
    return rawTopics.slice(0, 3);
  }, [currentVideo, displayTitle, chapterName]);

  // Helper to parse duration strings like "04:12", "4:12", "10:15min", "12 min" into total seconds
  const parseDurationSec = useCallback((rawDur?: string, fallbackSec = 252): number => {
    if (!rawDur) return fallbackSec;
    const cleaned = rawDur.replace(/min(s|utes)?/gi, "").trim();
    const mmss = cleaned.match(/^(\d+)\s*:\s*(\d+)$/);
    if (mmss) {
      return parseInt(mmss[1], 10) * 60 + parseInt(mmss[2], 10);
    }
    const minsOnly = cleaned.match(/^(\d+(?:\.\d+)?)$/);
    if (minsOnly) {
      return Math.round(parseFloat(minsOnly[1]) * 60);
    }
    return fallbackSec;
  }, []);

  const effectiveDurationSec = useMemo(() => {
    if (duration > 0) return Math.round(duration);
    return parseDurationSec(currentVideo.duration, 252);
  }, [duration, currentVideo.duration, parseDurationSec]);

  const totalChapterWatchFormatted = useMemo(() => {
    const totalSec = videos.reduce((acc, v, idx) => {
      if (idx === robustActive && duration > 0) {
        return acc + Math.round(duration);
      }
      return acc + parseDurationSec(v.duration, 210);
    }, 0);
    return formatTime(totalSec);
  }, [videos, robustActive, duration, parseDurationSec]);

  const segmentsList = useMemo(() => {
    const count = Math.max(1, topicsList.length);
    return topicsList.map((topic, idx) => {
      const startSec = Math.round((idx / count) * effectiveDurationSec);
      const endSec =
        idx === count - 1
          ? effectiveDurationSec
          : Math.round(((idx + 1) / count) * effectiveDurationSec);
      const segSec = Math.max(1, endSec - startSec);
      const mins = Math.floor(segSec / 60);
      const secs = segSec % 60;
      const durationLabel =
        mins > 0 && secs > 0
          ? `${mins} min ${secs} sec`
          : mins > 0
            ? `${mins} min`
            : `${secs} sec`;
      return {
        index: idx,
        title: topic,
        startSec,
        endSec,
        timeRangeStr: `${formatTime(startSec)} – ${formatTime(endSec)}`,
        durationLabel,
      };
    });
  }, [topicsList, effectiveDurationSec]);

  const activeSegmentIdx = useMemo(() => {
    for (let i = segmentsList.length - 1; i >= 0; i--) {
      if (currentTime >= segmentsList[i].startSec) {
        return i;
      }
    }
    return 0;
  }, [segmentsList, currentTime]);

  const keyMomentsList = useMemo(() => {
    return segmentsList.map((seg, idx) => {
      const momentSec = Math.min(
        Math.max(0, seg.endSec - 5),
        seg.startSec + Math.max(12, Math.round((seg.endSec - seg.startSec) * 0.28)),
      );
      const colonIdx = seg.title.indexOf(":");
      let lead = "";
      let detail = "";
      if (colonIdx !== -1) {
        lead = seg.title.slice(0, colonIdx).trim();
        detail = seg.title.slice(colonIdx + 1).trim();
      } else {
        const parts = seg.title.split(/\s+(?:&|—|-)\s+/);
        lead = parts[0] || seg.title;
        detail =
          parts.length > 1
            ? `${parts.slice(1).join(", ")} — core conceptual breakdown and exam focus.`
            : `Core principles, structural relationships, and key exam takeaways for Segment ${idx + 1}.`;
      }
      return {
        timeSec: momentSec,
        timeStr: formatTime(momentSec),
        lead,
        detail,
      };
    });
  }, [segmentsList]);

  const seekToSecond = useCallback(
    (targetSec: number) => {
      if (!isCurrentlyFullscreen()) {
        enterFullscreen(currentVideo?.ytId);
      }
      const dur =
        (playerRef.current && typeof playerRef.current.getDuration === "function"
          ? playerRef.current.getDuration()
          : 0) || effectiveDurationSec;
      const clamped = Math.max(0, Math.min(dur > 0 ? dur : targetSec, targetSec));
      isSeekingRef.current = true;
      hasStartedPlayingRef.current = true;
      lastSeekTargetRef.current = { time: clamped, ts: Date.now() };
      if (seekResetTimerRef.current) clearTimeout(seekResetTimerRef.current);
      seekResetTimerRef.current = setTimeout(() => {
        isSeekingRef.current = false;
      }, 1200);
      restoredVideoTimeRef.current = clamped;
      setCurrentTime(clamped);
      if (dur > 0) {
        setProgress((clamped / dur) * 100);
      }
      if (videoTimeStorageKey && clamped > 1) {
        try {
          cloudStorage.setItem(
            videoTimeStorageKey,
            JSON.stringify({ currentTime: clamped, duration: dur || effectiveDurationSec, updatedAt: Date.now() }),
          );
        } catch {}
      }
      sendYtIframeCommand("seekTo", [clamped, true]);
      sendYtIframeCommand("playVideo", []);
      setIsPlaying(true);
      isPlayingRef.current = true;
      if (!playerRef.current || !playerReadyRef.current) {
        autoPlayOnReadyRef.current = true;
        return;
      }
      if (playerRef.current?.seekTo) {
        try {
          playerRef.current.seekTo(clamped, true);
          playerRef.current.playVideo?.();
        } catch {}
        setTimeout(() => {
          if (isCurrentlyFullscreen()) {
            try {
              playerRef.current?.playVideo?.();
              sendYtIframeCommand("playVideo", []);
            } catch {}
          }
        }, 60);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [effectiveDurationSec, currentVideo?.ytId, videoTimeStorageKey, sendYtIframeCommand],
  );

  // Video switching handler for multi-video
  const handleSelectVideo = (index: number) => {
    if (index === robustActive) return;
    try {
      playerRef.current?.pauseVideo?.();
    } catch {}
    activePlaybackSessionYtIdRef.current = null;
    setCurrentTime(0);
    setDuration(0);
    setProgress(0);
    setIsPlaying(false);
    setActiveVideo(index);
    if (onSelectVideoIndex) {
      onSelectVideoIndex(index + 1);
    }
  };

  const cutLabelUpper =
    persona === "beginner"
      ? "ESSENTIALS CUT"
      : persona === "advanced"
        ? "IN-DEPTH CUT"
        : "STANDARD CUT";

  const cutOverlayTopRightLabel =
    persona === "beginner"
      ? "Essentials cut · Standard / In-depth available"
      : persona === "advanced"
        ? "In-depth cut · Essentials / Standard available"
        : "Standard cut · Essentials / In-depth available";

  const subjectShortWatermark = useMemo(() => {
    const cleanSubj = (subjectId || "COURSE")
      .replace(/^anu_/i, "")
      .replace(/_.*$/, "")
      .toUpperCase();
    return `${cleanSubj} PART ${robustActive + 1}`;
  }, [subjectId, robustActive]);

  const totalVideos = Math.max(1, videos.length);
  // Video Player Component matching Screen 1 mockup
  const renderVideoPlayer = (_isFullWidth = false, _isStackedRow = false, rowIndex = robustActive) => (
    <div
      ref={(el) => {
        rowPlayerContainerRefs.current[rowIndex] = el;
        if (rowIndex === robustActive) {
          (playerContainerRef as any).current = el;
        }
      }}
      onMouseMove={handlePlayerMouseMove}
      onMouseLeave={handlePlayerMouseLeave}
      style={{
        position: "relative",
        width: "100%",
        height: isFullscreen ? "100%" : "clamp(280px, calc(100vh - 255px), 425px)",
        flexShrink: 0,
        background: "radial-gradient(ellipse at center, #2E4238 0%, #1B2821 100%)",
        borderRadius: isFullscreen ? "0px" : "16px",
        overflow: "hidden",
        boxShadow: isFullscreen ? "none" : "0 8px 26px rgba(20, 32, 26, 0.14)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        cursor: isFullscreen && isPlaying && !showControls ? "none" : "default",
      }}
    >
      {/* YouTube Iframe wrapped in keyed container so React cleanly unmounts on video switch */}
      <div
        key={`yt-wrap-${subjectId}-${chapterNumber}-${robustActive}-${currentVideo.ytId}`}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          border: 0,
          pointerEvents: "none",
          opacity: isFullscreen ? 1 : 0,
          transition: "opacity 0.25s ease",
        }}
      >
        {isRegistryLoaded && currentVideo.ytId ? (
          <iframe
            id={`yt-player-${currentVideo.ytId}`}
            title={displayTitle}
            src={`https://www.youtube.com/embed/${currentVideo.ytId}?enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}&rel=0&modestbranding=1&controls=0&disablekb=1&cc_load_policy=0&cc_lang_pref=none&playsinline=1&iv_load_policy=3`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            onLoad={() => {
              iframeLoadedRef.current = true;
            }}
            style={{
              width: "100%",
              height: "100%",
              border: 0,
            }}
          />
        ) : null}
      </div>

      {/* Clean Video Thumbnail Cover when not in fullscreen (no YouTube buttons/chrome) */}
      {!isFullscreen && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(ellipse at center, rgba(46, 66, 56, 0.88) 0%, rgba(25, 38, 31, 0.96) 100%)",
            pointerEvents: "none",
            zIndex: 1,
            overflow: "hidden",
          }}
        >
          {(currentVideo.thumbnailUrl || currentVideo.ytId) && (
            <img
              src={currentVideo.thumbnailUrl || `https://i.ytimg.com/vi/${currentVideo.ytId}/hqdefault.jpg`}
              alt={displayTitle}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "center",
                display: "block",
                userSelect: "none",
              }}
            />
          )}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(180deg, rgba(14, 22, 18, 0.36) 0%, rgba(14, 22, 18, 0.14) 45%, rgba(14, 22, 18, 0.68) 100%)",
            }}
          />
        </div>
      )}

      {/* Top Overlay Pills (Resumed Pill on Left, Cut Availability Pill on Right) */}
      <div
        style={{
          position: "absolute",
          top: "16px",
          left: "18px",
          right: "18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          zIndex: 6,
          pointerEvents: "none",
          opacity: showControls || !isPlaying ? 1 : 0,
          transition: "opacity 0.25s ease",
        }}
      >
        <div
          style={{
            background: "#9DC2AD",
            color: "#182C22",
            borderRadius: "999px",
            padding: "6px 14px",
            fontSize: "12px",
            fontWeight: 700,
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.18)",
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" />
            <polyline points="12 7 12 12 15 14" />
          </svg>
          <span>
            {currentTime > 0
              ? `Resumed at ${formatTime(currentTime)}`
              : `Ready · ${formatTime(effectiveDurationSec)}`}
          </span>
        </div>

        <div
          style={{
            background: "rgba(22, 33, 27, 0.72)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            border: "1px solid rgba(255, 255, 255, 0.18)",
            color: "#E5EFE9",
            borderRadius: "999px",
            padding: "6px 14px",
            fontSize: "12px",
            fontWeight: 600,
          }}
        >
          {`Video ${robustActive + 1} of ${totalVideos} · ${segmentsList.length} Segments · ${totalChapterWatchFormatted} total`}
        </div>
      </div>

      {/* Transparent Click overlay covering video */}
      <div
        onClick={(e) => {
          e.stopPropagation();
          handleVideoClick(e);
        }}
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 2,
          cursor: isFullscreen && isPlaying && !showControls ? "none" : "pointer",
        }}
      />

      {/* Sleek Seek Feedback Badge (-10s / +10s / Skip) */}
      {seekFeedback && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: seekFeedback === "-10s" ? "18%" : seekFeedback === "+10s" ? "82%" : "50%",
            transform: "translate(-50%, -50%)",
            background: "rgba(0, 0, 0, 0.82)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            color: "#FFFFFF",
            padding: "14px 22px",
            borderRadius: "50px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontSize: "18px",
            fontWeight: 800,
            zIndex: 15,
            pointerEvents: "none",
            boxShadow: "0 10px 36px rgba(0, 0, 0, 0.6)",
            border: "1.5px solid rgba(255, 255, 255, 0.3)",
          }}
        >
          {seekFeedback === "-10s" ? (
            <>
              <span>{"«"}</span>
              <span>10s</span>
            </>
          ) : seekFeedback === "+10s" ? (
            <>
              <span>10s</span>
              <span>{"»"}</span>
            </>
          ) : (
            <span>Skipped</span>
          )}
        </div>
      )}

      {/* Center Sage Play Button Overlay when Paused or in Thumbnail view */}
      {(!isPlaying || !isFullscreen) && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handlePlayPause();
          }}
          aria-label="Play Video"
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: isFullscreen ? "82px" : "68px",
            height: isFullscreen ? "82px" : "68px",
            borderRadius: "50%",
            border: "none",
            background: "#9DC2AD",
            boxShadow: "0 10px 28px rgba(0, 0, 0, 0.36)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 8,
            transition: "transform 0.2s ease, background 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translate(-50%, -50%) scale(1.07)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translate(-50%, -50%) scale(1)";
          }}
        >
          <svg
            width={isFullscreen ? "26" : "22"}
            height={isFullscreen ? "26" : "22"}
            viewBox="0 0 24 24"
            fill="#162A20"
            style={{ marginLeft: "3px" }}
          >
            <polygon points="6,4 20,12 6,20" />
          </svg>
        </button>
      )}

      {/* Netflix-style Floating Skip Intro Button (first 2 minutes) */}
      {canSkipIntro && (
        <button
          type="button"
          onClick={handleSkipIntro}
          title="Skip Intro (Jump to 2:00)"
          aria-label="Skip Intro"
          style={{
            position: "absolute",
            right: isFullscreen ? "28px" : "18px",
            bottom: isFullscreen ? "74px" : "60px",
            zIndex: 12,
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: isFullscreen ? "9px 16px" : "7px 13px",
            borderRadius: "8px",
            background: "rgba(22, 42, 32, 0.88)",
            border: "1px solid rgba(255, 255, 255, 0.35)",
            color: "#FFFFFF",
            fontSize: isFullscreen ? "13px" : "12px",
            fontWeight: 700,
            letterSpacing: "0.02em",
            cursor: "pointer",
            backdropFilter: "blur(8px)",
            boxShadow: "0 4px 14px rgba(0, 0, 0, 0.35)",
            transition: "all 0.2s ease",
          }}
        >
          <span>Skip Intro</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="5 4 15 12 5 20 5 4" fill="currentColor" />
            <line x1="19" y1="5" x2="19" y2="19" />
          </svg>
        </button>
      )}

      {/* Sleek Bottom Control Bar (Always visible when paused or hovered, both inline & fullscreen) */}
      <div
        onMouseEnter={() => {
          if (hideControlsTimerRef.current) {
            clearTimeout(hideControlsTimerRef.current);
          }
          setShowControls(true);
        }}
        style={{
          position: "relative",
          zIndex: 10,
          background: "linear-gradient(to top, rgba(16, 24, 20, 0.92) 0%, rgba(16, 24, 20, 0.55) 70%, transparent 100%)",
          padding: "18px 18px 13px 18px",
          display: "flex",
          alignItems: "center",
          gap: "14px",
          width: "100%",
          boxSizing: "border-box",
          opacity: showControls || !isPlaying ? 1 : 0,
          pointerEvents: showControls || !isPlaying ? "auto" : "none",
          transition: "opacity 0.25s ease",
          userSelect: "none",
        }}
      >
        {/* Play / Pause Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handlePlayPause();
          }}
          title={isPlaying ? "Pause" : "Play"}
          aria-label={isPlaying ? "Pause" : "Play"}
          style={{
            background: "transparent",
            border: "none",
            color: "#FFFFFF",
            cursor: "pointer",
            padding: "2px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {isPlaying ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#FFFFFF">
              <rect x="5" y="4" width="4.5" height="16" rx="1.2" />
              <rect x="14.5" y="4" width="4.5" height="16" rx="1.2" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#FFFFFF">
              <polygon points="6,4 20,12 6,20" />
            </svg>
          )}
        </button>

        {/* Rewind 10s (↺10) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleRewind10();
          }}
          title="Rewind 10 seconds"
          aria-label="Rewind 10 seconds"
          style={{
            background: "transparent",
            border: "none",
            color: "rgba(255, 255, 255, 0.85)",
            cursor: "pointer",
            padding: "2px 4px",
            display: "inline-flex",
            alignItems: "center",
            gap: "2px",
            fontSize: "11.5px",
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
            <polyline points="3 3 3 8 8 8" />
          </svg>
          <span style={{ fontSize: "10px" }}>10</span>
        </button>

        {/* Forward 10s (↻10) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleForward10();
          }}
          title="Forward 10 seconds"
          aria-label="Forward 10 seconds"
          style={{
            background: "transparent",
            border: "none",
            color: "rgba(255, 255, 255, 0.85)",
            cursor: "pointer",
            padding: "2px 4px",
            display: "inline-flex",
            alignItems: "center",
            gap: "2px",
            fontSize: "11.5px",
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 1 1-3-6.7L21 8" />
            <polyline points="21 3 21 8 16 8" />
          </svg>
          <span style={{ fontSize: "10px" }}>10</span>
        </button>

        {/* Inline Horizontal Seek Bar with Segment Dividers & Subtle Fullscreen Timestamp Popups */}
        <div
          style={{
            position: "relative",
            flex: 1,
            height: "24px",
            display: "flex",
            alignItems: "center",
          }}
        >
          {/* Subtle Timestamp & Topic Name Popups right above the progress bar in Fullscreen mode */}
          {isFullscreen && segmentsList.length > 0 && (
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: "22px",
                height: "28px",
                pointerEvents: "none",
                zIndex: 14,
              }}
            >
              {segmentsList.map((seg, idx) => {
                const startPct =
                  effectiveDurationSec > 0
                    ? Math.min(92, Math.max(0, (seg.startSec / effectiveDurationSec) * 100))
                    : (idx / segmentsList.length) * 100;
                const endPct =
                  effectiveDurationSec > 0
                    ? Math.min(100, Math.max(startPct + 8, (seg.endSec / effectiveDurationSec) * 100))
                    : ((idx + 1) / segmentsList.length) * 100;
                const maxWidthPct = Math.max(10, endPct - startPct - 1.2);
                const isCurrentSeg = activeSegmentIdx === idx;
                return (
                  <div
                    key={`fs-seg-popup-${seg.index}`}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      seekToSecond(seg.startSec);
                    }}
                    style={{
                      position: "absolute",
                      left: `${startPct}%`,
                      bottom: 0,
                      maxWidth: `calc(${maxWidthPct}% - 6px)`,
                      pointerEvents: "auto",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                    }}
                  >
                    <div
                      style={{
                        background: isCurrentSeg ? "rgba(20, 32, 26, 0.76)" : "rgba(16, 24, 20, 0.58)",
                        backdropFilter: "blur(6px)",
                        WebkitBackdropFilter: "blur(6px)",
                        border: isCurrentSeg
                          ? "1px solid rgba(157, 194, 173, 0.34)"
                          : "1px solid rgba(255, 255, 255, 0.12)",
                        borderRadius: "5px",
                        padding: "2.5px 7px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                        maxWidth: "100%",
                        boxSizing: "border-box",
                        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.22)",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "10.5px",
                          fontWeight: 700,
                          color: "#9DC2AD",
                          fontVariantNumeric: "tabular-nums",
                          flexShrink: 0,
                        }}
                      >
                        {formatTime(seg.startSec)}
                      </span>
                      <span
                        style={{
                          fontSize: "10.5px",
                          fontWeight: 500,
                          color: "rgba(255, 255, 255, 0.86)",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {seg.title}
                      </span>
                    </div>
                    <div
                      style={{
                        width: "1px",
                        height: "4px",
                        marginLeft: "6px",
                        background: isCurrentSeg ? "rgba(157, 194, 173, 0.55)" : "rgba(255, 255, 255, 0.22)",
                      }}
                    />
                  </div>
                );
              })}
            </div>
          )}

          {/* Clickable & Draggable Seek Track Hit Area */}
          <div
            onMouseDown={(e) => {
              e.stopPropagation();
              const barEl = e.currentTarget;
              const computeTargetSec = (clientX: number): { sec: number; dur: number } | null => {
                const rect = barEl.getBoundingClientRect();
                if (rect.width <= 0) return null;
                const clickX = Math.max(0, Math.min(clientX - rect.left, rect.width));
                const pct = clickX / rect.width;
                const dur =
                  (playerRef.current && typeof playerRef.current.getDuration === "function"
                    ? playerRef.current.getDuration()
                    : 0) || effectiveDurationSec;
                return { sec: Math.round(pct * dur), dur };
              };

              const initial = computeTargetSec(e.clientX);
              if (initial) {
                lastSeekTargetRef.current = { time: initial.sec, ts: Date.now() };
                setCurrentTime(initial.sec);
                if (initial.dur > 0) setProgress((initial.sec / initial.dur) * 100);
              }

              const handleMouseMove = (moveEvt: MouseEvent) => {
                const pos = computeTargetSec(moveEvt.clientX);
                if (pos) {
                  lastSeekTargetRef.current = { time: pos.sec, ts: Date.now() };
                  setCurrentTime(pos.sec);
                  if (pos.dur > 0) setProgress((pos.sec / pos.dur) * 100);
                }
              };
              const handleMouseUp = (upEvt: MouseEvent) => {
                window.removeEventListener("mousemove", handleMouseMove);
                window.removeEventListener("mouseup", handleMouseUp);
                const finalPos = computeTargetSec(upEvt.clientX) || initial;
                if (finalPos) {
                  seekToSecond(finalPos.sec);
                }
              };
              window.addEventListener("mousemove", handleMouseMove);
              window.addEventListener("mouseup", handleMouseUp);
            }}
            onClick={(e) => {
              e.stopPropagation();
            }}
            title="Click or drag to seek"
            style={{
              position: "relative",
              width: "100%",
              height: "24px",
              display: "flex",
              alignItems: "center",
              cursor: "pointer",
              zIndex: 15,
            }}
          >
            <div
              style={{
                position: "relative",
                width: "100%",
                height: "5px",
                background: "rgba(255, 255, 255, 0.24)",
                borderRadius: "999px",
                pointerEvents: "none",
              }}
            >
              {/* Segment Boundary Ticks */}
              {segmentsList.slice(1).map((seg) => {
                const tickPct =
                  effectiveDurationSec > 0
                    ? Math.min(98, Math.max(2, (seg.startSec / effectiveDurationSec) * 100))
                    : 0;
                return (
                  <div
                    key={`tick-${seg.index}`}
                    style={{
                      position: "absolute",
                      left: `${tickPct}%`,
                      top: "-1px",
                      width: "2px",
                      height: "7px",
                      background: "rgba(18, 28, 23, 0.85)",
                      zIndex: 2,
                      pointerEvents: "none",
                    }}
                  />
                );
              })}

              {/* Progress Fill */}
              <div
                style={{
                  height: "100%",
                  width: `${Math.min(100, Math.max(0, effectiveDurationSec > 0 ? (currentTime / effectiveDurationSec) * 100 : progress))}%`,
                  background: "#9DC2AD",
                  borderRadius: "999px",
                  position: "relative",
                  pointerEvents: "none",
                }}
              >
                {/* Scrubber White Thumb */}
                <div
                  style={{
                    position: "absolute",
                    right: "-6px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: "13px",
                    height: "13px",
                    borderRadius: "50%",
                    background: "#FFFFFF",
                    boxShadow: "0 1px 4px rgba(0, 0, 0, 0.5)",
                    pointerEvents: "none",
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Info Cluster: Time | Segment X of Y | Speed | Fullscreen */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            flexShrink: 0,
            color: "#FFFFFF",
            fontSize: "12px",
            fontWeight: 600,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          <span>
            {`${formatTime(currentTime)} / ${formatTime(effectiveDurationSec)}`}
          </span>

          <span style={{ color: "rgba(255, 255, 255, 0.72)", fontWeight: 500 }}>
            {`Segment ${activeSegmentIdx + 1} of ${segmentsList.length}`}
          </span>

          {/* Speed Selector */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              const rates = [1, 1.25, 1.5, 1.75, 2, 0.75];
              const nextRate = rates[(rates.indexOf(playbackRate) + 1) % rates.length];
              setPlaybackRate(nextRate);
              try {
                playerRef.current?.setPlaybackRate?.(nextRate);
              } catch {}
            }}
            title="Change playback speed"
            style={{
              background: "transparent",
              border: "none",
              color: "#FFFFFF",
              fontWeight: 700,
              fontSize: "12px",
              cursor: "pointer",
              padding: "2px 4px",
              display: "inline-flex",
              alignItems: "center",
              gap: "3px",
            }}
          >
            <span>{`${playbackRate}x`}</span>
            <span style={{ fontSize: "9px", opacity: 0.8 }}>▾</span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleFullscreen();
            }}
            title={isFullscreen ? "Exit Fullscreen (f)" : "Fullscreen (f)"}
            aria-label="Toggle Fullscreen"
            style={{
              background: "transparent",
              border: "none",
              color: "#FFFFFF",
              cursor: "pointer",
              padding: "2px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 3H5a2 2 0 0 0-2 2v3" />
              <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
              <path d="M3 16v3a2 2 0 0 0 2 2h3" />
              <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );

  const isVideoDone = (idx: number) =>
    completedVideos.has(idx) || Boolean(isVideoWatchedAt?.(idx + 1)) || (videos.length === 1 && isCompleted);

  const completedCount = videos.reduce((acc, _, idx) => acc + (isVideoDone(idx) ? 1 : 0), 0);
  const activePartialFraction = isVideoDone(robustActive)
    ? 0
    : Math.min(1, Math.max(0.2, progress / 100));
  const watchProgressPercent = Math.min(
    100,
    Math.max(20, Math.round(((completedCount + activePartialFraction) / totalVideos) * 100)),
  );

  const upcomingPlaylist = useMemo(() => {
    const items: { idx: number; title: string; durationStr: string }[] = [];
    for (let offset = 1; offset < videos.length; offset++) {
      const targetIdx = (robustActive + offset) % videos.length;
      const vid = videos[targetIdx];
      if (vid) {
        items.push({
          idx: targetIdx,
          title: vid.title || `Part ${targetIdx + 1}`,
          durationStr: formatTime(parseDurationSec(vid.duration, 185)),
        });
      }
    }
    return items;
  }, [videos, robustActive, parseDurationSec]);

  const nextVideoIdx = (robustActive + 1) % totalVideos;
  const nextVideoObj = videos[nextVideoIdx];
  const hasNextVideo = totalVideos > 1 && robustActive + 1 < totalVideos;

  return (
    <div
      className="videos-figma-container"
      style={{
        width: "100%",
        height: "100%",
        maxHeight: "100%",
        overflowY: "auto",
        overflowX: "hidden",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        paddingRight: "4px",
      }}
    >
      {/* ── Two-Column Watch Layout (Screen 1 Top + Screen 2 Scrolled Down) ── */}
      <div
        style={{
          display: "flex",
          gap: "26px",
          width: "100%",
          margin: 0,
          padding: "4px 0 36px 0",
          boxSizing: "border-box",
          alignItems: "flex-start",
        }}
      >
        {/* ── LEFT NAVIGATION SIDEBAR (Watching Guide + IN THIS CHAPTER · N VIDEOS) ── */}
        <div
          style={{
            width: "256px",
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          {/* Top Dark Forest-Green Pill: Watching Guide */}
          <div
            style={{
              background: '#9CC0B4',
              color: '#18221D',
              borderRadius: "999px",
              padding: "10px 18px",
              fontSize: "13px",
              fontWeight: 700,
              textAlign: "center",
              letterSpacing: "0.01em",
              boxShadow: "0 2px 6px rgba(29, 43, 36, 0.12)",
            }}
          >
            Watching Guide
          </div>

          {/* White Chapter Video Playlist Card */}
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: "16px",
              padding: "16px 14px",
              border: "1px solid #E6E0D4",
              boxShadow: "0 2px 10px rgba(30, 40, 34, 0.03)",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            <div
              style={{
                fontSize: "10.5px",
                fontWeight: 800,
                letterSpacing: "0.07em",
                color: "#6E7B73",
                textTransform: "uppercase",
                padding: "0 4px 4px 4px",
              }}
            >
              {`IN THIS CHAPTER · ${totalVideos} ${totalVideos === 1 ? "VIDEO" : "VIDEOS"}`}
            </div>

            {/* Video List Items */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {videos.map((vid, idx) => {
                const isSelected = idx === robustActive;
                const isWatched = isVideoDone(idx);
                const vidSec =
                  isSelected && duration > 0
                    ? Math.round(duration)
                    : parseDurationSec(vid.duration, 210);
                const vidDurFormatted = formatTime(vidSec);

                // Determine right status label: HERE, UP NEXT, 2ND, 3RD, 4TH, or DONE
                let statusBadge = "";
                if (isSelected) {
                  statusBadge = "HERE";
                } else if (isWatched && idx < robustActive) {
                  statusBadge = "DONE";
                } else {
                  const queueOffset =
                    idx > robustActive ? idx - robustActive : totalVideos - robustActive + idx;
                  if (queueOffset === 1) statusBadge = "UP NEXT";
                  else if (queueOffset === 2) statusBadge = "2ND";
                  else if (queueOffset === 3) statusBadge = "3RD";
                  else statusBadge = `${queueOffset}TH`;
                }

                return (
                  <div
                    key={vid.ytId || idx}
                    onClick={() => handleSelectVideo(idx)}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "10px",
                      padding: "10px 10px",
                      borderRadius: "12px",
                      cursor: "pointer",
                      background: isSelected ? "#EFF5F1" : "transparent",
                      transition: "background 0.18s ease",
                    }}
                  >
                    {/* Left Radio / Check Icon */}
                    <div
                      style={{
                        width: "16px",
                        height: "16px",
                        borderRadius: "50%",
                        marginTop: "2px",
                        flexShrink: 0,
                        border: isSelected
                          ? "1.5px solid #5B8C72"
                          : isWatched
                            ? "1.5px solid #5B8C72"
                            : "1.5px solid #C5C0B6",
                        background: isWatched && !isSelected ? "#5B8C72" : "transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {isSelected ? (
                        <div
                          style={{
                            width: "6px",
                            height: "6px",
                            borderRadius: "50%",
                            background: "#5B8C72",
                          }}
                        />
                      ) : isWatched ? (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : null}
                    </div>

                    {/* Title + Duration Row */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          justifyContent: "space-between",
                          gap: "6px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "12.5px",
                            fontWeight: isSelected ? 700 : 600,
                            color: isSelected ? "#1E2822" : "#37423B",
                            lineHeight: 1.35,
                          }}
                        >
                          {vid.title || `Part ${idx + 1}`}
                        </span>
                        <span
                          style={{
                            fontSize: "9.5px",
                            fontWeight: 800,
                            letterSpacing: "0.04em",
                            color: isSelected ? "#4F7D65" : "#88938B",
                            flexShrink: 0,
                            marginTop: "2px",
                          }}
                        >
                          {statusBadge}
                        </span>
                      </div>

                      <div
                        style={{
                          fontSize: "11px",
                          fontWeight: 500,
                          color: isSelected ? "#586B60" : "#88938B",
                          marginTop: "4px",
                        }}
                      >
                        {`• ${vidDurFormatted}${
                          isSelected
                            ? ` · resumed at ${formatTime(currentTime)}`
                            : ""
                        }`}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Resumed Status Pill inside Sidebar Card */}
            <div
              style={{
                background: "#EFF5F1",
                border: "1px solid #DCE8E0",
                borderRadius: "999px",
                padding: "8px 12px",
                fontSize: "11.5px",
                fontWeight: 700,
                color: "#2D3E36",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                marginTop: "4px",
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" />
                <polyline points="12 7 12 12 15 14" />
              </svg>
              <span>
                {`${isPlaying ? "Playing" : "Resumed"} · Video ${robustActive + 1} at ${formatTime(currentTime)}`}
              </span>
            </div>

            {/* Chapter Progress Footer */}
            <div
              style={{
                borderTop: "1px solid #EFECE6",
                paddingTop: "12px",
                marginTop: "2px",
                display: "flex",
                flexDirection: "column",
                gap: "7px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: "11.5px",
                }}
              >
                <span style={{ color: "#6E7B73", fontWeight: 600 }}>Chapter progress</span>
                <span style={{ color: "#2D3E36", fontWeight: 800 }}>{`${watchProgressPercent}%`}</span>
              </div>
              <div
                style={{
                  width: "100%",
                  height: "5px",
                  background: "#EAE5DC",
                  borderRadius: "999px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${watchProgressPercent}%`,
                    height: "100%",
                    background: '#9CC0B4',
                    borderRadius: "999px",
                    transition: "width 0.3s ease",
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT MAIN CONTENT COLUMN (Screen 1 + Screen 2 on Scroll) ── */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          {/* 16:9 Main Video Player (Aligned directly with Watching Guide, single-view fit with Segments below) */}
          {renderVideoPlayer(true, false, robustActive)}

          {/* ── SEGMENTS IN THIS VIDEO — CLICK TO JUMP (Visible in single view right under thumbnail) ── */}
          <div style={{ marginTop: "2px", display: "flex", flexDirection: "column", gap: "8px" }}>
            <div
              style={{
                fontSize: "10.5px",
                fontWeight: 800,
                letterSpacing: "0.08em",
                color: "#6E7B73",
                textTransform: "uppercase",
              }}
            >
              SEGMENTS IN THIS VIDEO — CLICK TO JUMP
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${Math.min(3, segmentsList.length)}, minmax(0, 1fr))`,
                gap: "12px",
              }}
            >
              {segmentsList.map((seg, idx) => {
                const isNowPlaying = idx === activeSegmentIdx;
                const isUpNext = idx === activeSegmentIdx + 1;
                const isWatchedSeg = idx < activeSegmentIdx;

                return (
                  <div
                    key={seg.index}
                    onClick={() => seekToSecond(seg.startSec)}
                    style={{
                      background: isNowPlaying ? "#EAF3EE" : "#FFFFFF",
                      border: isNowPlaying ? "1.5px solid #8AB89E" : "1px solid #E6E0D4",
                      borderRadius: "13px",
                      padding: "12px 15px",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      gap: "8px",
                      transition: "all 0.18s ease",
                      boxShadow: isNowPlaying
                        ? "0 4px 14px rgba(45, 62, 54, 0.06)"
                        : "0 2px 6px rgba(0, 0, 0, 0.02)",
                    }}
                  >
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {/* Segment Icon */}
                      <div style={{ display: "flex", alignItems: "center" }}>
                        {idx === 0 ? (
                          <span style={{ fontSize: "16px", lineHeight: 1 }}>🌿</span>
                        ) : idx === 1 ? (
                          <span style={{ fontSize: "16px", lineHeight: 1 }}>🛡️</span>
                        ) : (
                          <span style={{ fontSize: "16px", lineHeight: 1 }}>👥</span>
                        )}
                      </div>

                      {/* Segment Title */}
                      <div
                        style={{
                          fontSize: "13.5px",
                          fontWeight: 800,
                          color: "#1E2822",
                          lineHeight: 1.35,
                        }}
                      >
                        {seg.title}
                      </div>

                      {/* Time Range + Duration */}
                      <div
                        style={{
                          fontSize: "11.5px",
                          fontWeight: 600,
                          color: "#6E7B73",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {`${seg.timeRangeStr} · ${seg.durationLabel}`}
                      </div>
                    </div>

                    {/* Segment Status Badge */}
                    <div>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          background: isNowPlaying
                            ? "#9DC2AD"
                            : isWatchedSeg
                              ? "#DCECE3"
                              : "#EFECE6",
                          color: isNowPlaying
                            ? "#182C22"
                            : isWatchedSeg
                              ? "#26593E"
                              : "#6E7B73",
                          fontSize: "10px",
                          fontWeight: 800,
                          letterSpacing: "0.05em",
                          padding: "4px 10px",
                          borderRadius: "999px",
                          textTransform: "uppercase",
                        }}
                      >
                        {isNowPlaying
                          ? "▶ NOW PLAYING"
                          : isUpNext
                            ? "UP NEXT"
                            : isWatchedSeg
                              ? "✓ WATCHED"
                              : "NOT WATCHED"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── SCREEN 2: KEY MOMENTS (Left) + UP NEXT IN THIS CHAPTER (Right) ── */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.12fr 1fr",
              gap: "16px",
              marginTop: "6px",
            }}
          >
            {/* Left Card: Key Moments */}
            <div
              style={{
                background: "#FFFFFF",
                border: "1px solid #E6E0D4",
                borderRadius: "16px",
                padding: "20px 22px",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.02)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "8px",
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    fontSize: "15.5px",
                    fontWeight: 800,
                    color: "#1E2822",
                  }}
                >
                  Key Moments
                </h3>
                <span
                  style={{
                    fontSize: "11.5px",
                    fontWeight: 600,
                    color: "#7C8780",
                  }}
                >
                  Click a timestamp to jump
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column" }}>
                {keyMomentsList.map((km, idx) => (
                  <div
                    key={idx}
                    onClick={() => seekToSecond(km.timeSec)}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "12px",
                      padding: "12px 0",
                      borderTop: idx === 0 ? "none" : "1px solid #F0ECE3",
                      cursor: "pointer",
                    }}
                  >
                    <span
                      style={{
                        background: "#FAF2E9",
                        color: "#B46530",
                        fontSize: "11.5px",
                        fontWeight: 800,
                        padding: "4px 9px",
                        borderRadius: "6px",
                        fontVariantNumeric: "tabular-nums",
                        flexShrink: 0,
                      }}
                    >
                      {km.timeStr}
                    </span>

                    <div
                      style={{
                        fontSize: "13px",
                        color: "#2D3831",
                        lineHeight: 1.45,
                      }}
                    >
                      <strong style={{ fontWeight: 800, color: "#1E2822" }}>
                        {`${km.lead}: `}
                      </strong>
                      <span>{km.detail}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Card: Up Next in This Chapter */}
            <div
              style={{
                background: "#FFFFFF",
                border: "1px solid #E6E0D4",
                borderRadius: "16px",
                padding: "20px 22px",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.02)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "8px",
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    fontSize: "15.5px",
                    fontWeight: 800,
                    color: "#1E2822",
                  }}
                >
                  Up Next in This Chapter
                </h3>
                <span
                  style={{
                    fontSize: "11.5px",
                    fontWeight: 600,
                    color: "#7C8780",
                  }}
                >
                  {`${totalVideos}-video playlist`}
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column" }}>
                {upcomingPlaylist.length > 0 ? (
                  upcomingPlaylist.map((item, upIdx) => (
                    <div
                      key={item.idx}
                      onClick={() => handleSelectVideo(item.idx)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "10px 0",
                        borderTop: upIdx === 0 ? "none" : "1px solid #F0ECE3",
                        cursor: "pointer",
                      }}
                    >
                      {/* Dark Forest Thumbnail Badge */}
                      <div
                        style={{
                          width: "44px",
                          height: "30px",
                          borderRadius: "7px",
                          background: "#35473E",
                          color: "#FFFFFF",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "12px",
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {upIdx === 0 ? (
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="#FFFFFF">
                            <polygon points="6,4 20,12 6,20" />
                          </svg>
                        ) : (
                          <span>{upIdx + 1}</span>
                        )}
                      </div>

                      {/* Title + Duration */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: "13px",
                            fontWeight: 800,
                            color: "#1E2822",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {item.title}
                        </div>
                        <div
                          style={{
                            fontSize: "11.5px",
                            color: "#7C8780",
                            marginTop: "2px",
                          }}
                        >
                          {`${item.durationStr}${upIdx === 0 ? " · plays after this video" : ""}`}
                        </div>
                      </div>

                      {/* Right Play Circle */}
                      <div
                        style={{
                          width: "30px",
                          height: "30px",
                          borderRadius: "50%",
                          background: upIdx === 0 ? "#9DC2AD" : "#FFFFFF",
                          border: upIdx === 0 ? "none" : "1px solid #E2DDD3",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <svg
                          width="10"
                          height="10"
                          viewBox="0 0 24 24"
                          fill={upIdx === 0 ? "#182C22" : "#37423B"}
                          style={{ marginLeft: "1px" }}
                        >
                          <polygon points="6,4 20,12 6,20" />
                        </svg>
                      </div>
                    </div>
                  ))
                ) : (
                  segmentsList.map((seg, sIdx) => (
                    <div
                      key={seg.index}
                      onClick={() => seekToSecond(seg.startSec)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "10px 0",
                        borderTop: sIdx === 0 ? "none" : "1px solid #F0ECE3",
                        cursor: "pointer",
                      }}
                    >
                      <div
                        style={{
                          width: "44px",
                          height: "30px",
                          borderRadius: "7px",
                          background: "#35473E",
                          color: "#FFFFFF",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "12px",
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {sIdx === 0 ? "▶" : sIdx + 1}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: "13px",
                            fontWeight: 800,
                            color: "#1E2822",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {seg.title}
                        </div>
                        <div style={{ fontSize: "11.5px", color: "#7C8780", marginTop: "2px" }}>
                          {`${seg.timeRangeStr} · ${seg.durationLabel}`}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* ── SCREEN 2 BOTTOM FOOTER: Quick Check (Left) + Next Video CTA (Right) ── */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "16px",
              marginTop: "6px",
              flexWrap: "wrap",
            }}
          >
            {/* Left Dashed Card: Quick Check · 3 questions */}
            <button
              type="button"
              onClick={() => onComplete?.()}
              style={{
                background: "#FAF8F3",
                border: "1.5px dashed #C7C1B4",
                borderRadius: "12px",
                padding: "12px 18px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                cursor: "pointer",
                textAlign: "left",
                transition: "background 0.18s ease, border-color 0.18s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#F3EFE6";
                e.currentTarget.style.borderColor = "#9DC2AD";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#FAF8F3";
                e.currentTarget.style.borderColor = "#C7C1B4";
              }}
            >
              <div
                style={{
                  width: "22px",
                  height: "22px",
                  borderRadius: "6px",
                  background: "#22C55E",
                  color: "#FFFFFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 800, color: "#1E2822" }}>
                  Quick Check · 3 questions
                </div>
                <div style={{ fontSize: "11.5px", color: "#6E7B73", marginTop: "1px" }}>
                  Active recall after every video — about 90 seconds
                </div>
              </div>
            </button>

            {/* Right Sage Pill CTA: Next · Video X of Y */}
            <button
              type="button"
              onClick={() => {
                if (hasNextVideo) {
                  handleSelectVideo(robustActive + 1);
                } else if (totalVideos > 1) {
                  handleSelectVideo(0);
                } else {
                  onComplete?.();
                }
              }}
              style={{
                background: '#9CC0B4',
                border: "none",
                borderRadius: "12px",
                padding: "12px 24px",
                cursor: "pointer",
                textAlign: "center",
                minWidth: "260px",
                boxShadow: "0 2px 10px rgba(45, 62, 54, 0.1)",
                transition: "transform 0.15s ease, filter 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.filter = "brightness(0.96)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.filter = "brightness(1)";
              }}
            >
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "#23372C",
                }}
              >
                {hasNextVideo
                  ? `Next · Video ${robustActive + 2} of ${totalVideos}`
                  : totalVideos > 1
                    ? `Replay · Video 1 of ${totalVideos}`
                    : "Complete Watch"}
              </div>
              <div
                style={{
                  fontSize: "13.5px",
                  fontWeight: 800,
                  color: "#14241B",
                  marginTop: "2px",
                }}
              >
                {`${nextVideoObj?.title || displayTitle} →`}
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
