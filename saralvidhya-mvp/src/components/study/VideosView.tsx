import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import MarkdownView from "@/components/MarkdownView";
import { getResourceContent, type Chapter, type ChapterVideo, type DifficultyLevel } from "@/data/contentRepository";

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

const KNOWN_VIDEOS_METADATA: Record<string, { title: string; topics: string[]; duration?: string }> = {
  "Ioa25iYy53g": {
    title: "Insects Digestive System",
    duration: "10:15min",
    topics: [
      "Anatomy of the Insect Alimentary Canal: Foregut, Midgut & Hindgut",
      "Stomodaeal Specializations: Pharynx, Crop, and Proventriculus (Gizzard)",
      "Mesenteron Physiology: Secretory Epithelium & Peritrophic Membrane",
      "Proctodaeum & Excretion: Malpighian Tubules & Water Reabsorption",
      "Enzymatic Digestion & Nutritional Adaptations in Insects"
    ]
  },
  "UMJFfCFFF4M": {
    title: "Weathering of Rocks and Minerals",
    duration: "11:45min",
    topics: [
      "Foundations of Weathering & Regolith-Saprolite Boundary Dynamics",
      "Physical Weathering: Hydraulic Forces, Frost Wedging (9% Expansion) & Exfoliation",
      "Chemical Weathering: Hydrolysis, Hydration, Carbonation, Oxidation & Reduction",
      "Biological Agents: Pioneer Lichens, Microbial Geochemistry & Tree Root Wedging",
      "Goldich Mineral Weathering Stability Series vs Bowen's Reaction Series"
    ]
  },
  "elWWuKv5b9Q": {
    title: "Pollination, Pollinizers & Parthenocarpy in Fruit Crops",
    duration: "14:20min",
    topics: [
      "Floral Biology Architecture & Angiosperm Double Fertilization",
      "Self-Pollination (Autogamy): Homogamy, Cleistogamy & Chasmogamy",
      "Cross-Pollination (Allogamy) & Self-Incompatibility (GSI vs SSI Systems)",
      "Pollinizer Cultivar Proportion & Commercial Orchard Planting Geometry",
      "Parthenocarpy: Vegetative, Stimulative & Stenospermocarpy Mechanisms"
    ]
  }
};

/** Faint green insect outline watermark matching Figma */
const InsectWatermark = () => (
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
      width: "165px",
      height: "165px",
      opacity: 0.22,
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
const renderTopicIcon = (index: number) => {
  const iconIdx = index % 5;
  switch (iconIdx) {
    case 0:
      // Document sheet with folded corner and lines
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4B5563" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="9" y1="13" x2="15" y2="13" />
          <line x1="9" y1="17" x2="13" y2="17" />
        </svg>
      );
    case 1:
      // Leaf with central vein
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4B5563" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z" />
          <line x1="16" y1="8" x2="2" y2="22" />
        </svg>
      );
    case 2:
      // Organism / insect head / microbe
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4B5563" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="13" r="7" />
          <line x1="12" y1="6" x2="12" y2="2" />
          <path d="M8 3.5l2 2.5" />
          <path d="M16 3.5l-2 2.5" />
          <line x1="9" y1="12" x2="15" y2="12" />
          <circle cx="12" cy="15" r="1.2" fill="#4B5563" />
        </svg>
      );
    case 3:
      // Gear / settings cog
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4B5563" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      );
    case 4:
    default:
      // Chemistry laboratory flask
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4B5563" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
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
  const [activeVideo, setActiveVideo] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);

  // Custom Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [isCcEnabled, setIsCcEnabled] = useState(false);
  const [showSpeedSelector, setShowSpeedSelector] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(false);

  const playerRef = useRef<any>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const hideControlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasStartedPlayingRef = useRef<boolean>(false);
  const progressIntervalRef = useRef<any>(null);

  // 1. Build video list
  const videos = useMemo(() => {
    if (chapterVideos && chapterVideos.length > 0) {
      return chapterVideos.map((v) => ({
        title: v.title,
        ytId: v.ytId,
        topics: v.topics,
        duration: v.duration,
      }));
    }
    let list: { title: string; ytId: string; topics?: string[]; duration?: string }[] = [];
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
    } else if ((subjectId === "ento_131" || subjectId.includes("ento") || subjectId.includes("digestive")) && chapterNumber === 1) {
      list = [
        {
          title: "Insects Digestive System",
          ytId: "Ioa25iYy53g",
          duration: "10:15min",
          topics: [
            "Anatomy of the Insect Alimentary Canal: Foregut, Midgut & Hindgut",
            "Stomodaeal Specializations: Pharynx, Crop, and Proventriculus (Gizzard)",
            "Mesenteron Physiology: Secretory Epithelium & Peritrophic Membrane",
            "Proctodaeum & Excretion: Malpighian Tubules & Water Reabsorption",
            "Enzymatic Digestion & Nutritional Adaptations in Insects"
          ]
        }
      ];
    } else if ((subjectId === "ento_131" || subjectId.includes("weathering") || subjectId.includes("soil")) && chapterNumber === 3) {
      list = [
        {
          title: "Weathering of Rocks and Minerals",
          ytId: "UMJFfCFFF4M",
          duration: "11:45min",
          topics: [
            "Foundations of Weathering & Regolith-Saprolite Boundary Dynamics",
            "Physical Weathering: Hydraulic Forces, Frost Wedging (9% Expansion) & Exfoliation",
            "Chemical Weathering: Hydrolysis, Hydration, Carbonation, Oxidation & Reduction",
            "Biological Agents: Pioneer Lichens, Microbial Geochemistry & Tree Root Wedging",
            "Goldich Mineral Weathering Stability Series vs Bowen's Reaction Series"
          ]
        }
      ];
    } else if ((subjectId === "ento_131" || subjectId.includes("pollination") || subjectId.includes("fruit")) && chapterNumber === 4) {
      list = [
        {
          title: "Pollination, Pollinizers & Parthenocarpy in Fruit Crops",
          ytId: "elWWuKv5b9Q",
          duration: "14:20min",
          topics: [
            "Floral Biology Architecture & Angiosperm Double Fertilization",
            "Self-Pollination (Autogamy): Homogamy, Cleistogamy & Chasmogamy",
            "Cross-Pollination (Allogamy) & Self-Incompatibility (GSI vs SSI Systems)",
            "Pollinizer Cultivar Proportion & Commercial Orchard Planting Geometry",
            "Parthenocarpy: Vegetative, Stimulative & Stenospermocarpy Mechanisms"
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
          const curated = KNOWN_VIDEOS_METADATA[id];
          list.push({
            title: curated?.title || `Video Lecture Part ${idx++}`,
            ytId: id,
            duration: curated?.duration || "10:15min",
            topics: curated?.topics || [
              "Key conceptual overview & core principles",
              "Structural anatomy and physiological pathways",
              "Specialized adaptations and functional dynamics",
              "Critical cellular mechanisms and transport systems",
              "Synthesis of key takeaways and summary points"
            ]
          });
        }
      }
    }

    // Default fallback if list is empty
    if (list.length === 0) {
      list = [
        {
          title: chapterName || "Insects Digestive System",
          ytId: "Ioa25iYy53g",
          duration: "10:15min",
          topics: [
            "Anatomy of the Insect Alimentary Canal: Foregut, Midgut & Hindgut",
            "Stomodaeal Specializations: Pharynx, Crop, and Proventriculus (Gizzard)",
            "Mesenteron Physiology: Secretory Epithelium & Peritrophic Membrane",
            "Proctodaeum & Excretion: Malpighian Tubules & Water Reabsorption",
            "Enzymatic Digestion & Nutritional Adaptations in Insects"
          ]
        }
      ];
    }

    return list;
  }, [subjectId, chapterNumber, youtubeLinksContent, chapterName, chapterVideos]);

  const robustActive = activeVideo >= videos.length ? 0 : activeVideo;
  const currentVideo = videos[robustActive] || videos[0];
  const isSingleVideo = videos.length <= 1;

  // Active index sync from parent
  useEffect(() => {
    if (activeVideoIndex && activeVideoIndex >= 1 && activeVideoIndex <= videos.length) {
      setActiveVideo(activeVideoIndex - 1);
    }
  }, [activeVideoIndex, videos.length]);

  const onVideoWatchedRef = useRef(onVideoWatched);
  useEffect(() => {
    onVideoWatchedRef.current = onVideoWatched;
  });

  const markWatched = useCallback((videoIndex: number, advance = false) => {
    onVideoWatchedRef.current?.(videoIndex, advance);
  }, []);

  // Format time utility
  const formatTime = (sec: number) => {
    if (isNaN(sec) || sec < 0) return "00:00";
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // YouTube Player setup
  useEffect(() => {
    hasStartedPlayingRef.current = false;
    if (!currentVideo?.ytId) return;

    if (!(window as any).YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
    }

    let checkInterval: any;

    const initPlayer = () => {
      const elementId = `yt-player-${currentVideo.ytId}`;
      const el = document.getElementById(elementId);
      if (!el || el.tagName === "IFRAME") return;

      try {
        playerRef.current = new (window as any).YT.Player(elementId, {
          height: "100%",
          width: "100%",
          videoId: currentVideo.ytId,
          playerVars: {
            origin: window.location.origin,
            rel: 0,
            modestbranding: 1,
            enablejsapi: 1,
            controls: 0,
            disablekb: 1,
            cc_load_policy: 0,
            cc_lang_pref: "none",
            playsinline: 1,
          },
          events: {
            onReady: (event: any) => {
              try {
                if (event.target && typeof event.target.unloadModule === "function") {
                  event.target.unloadModule("captions");
                }
              } catch (err) { }
            },
            onStateChange: (event: any) => {
              if (event.data === (window as any).YT.PlayerState.PLAYING) {
                hasStartedPlayingRef.current = true;
                setIsPlaying(true);
                if (!progressIntervalRef.current) {
                  progressIntervalRef.current = setInterval(() => {
                    if (playerRef.current && typeof playerRef.current.getCurrentTime === "function") {
                      const cur = playerRef.current.getCurrentTime();
                      const dur = playerRef.current.getDuration();
                      if (dur > 0) {
                        const pct = (cur / dur) * 100;
                        setCurrentTime(cur);
                        setDuration(dur);
                        setProgress(pct);
                        if (pct >= WATCHED_THRESHOLD_PCT && hasStartedPlayingRef.current) {
                          markWatched(robustActive + 1, false);
                        }
                      }
                    }
                  }, 500);
                }
              } else if (event.data === (window as any).YT.PlayerState.ENDED) {
                setIsPlaying(false);
                if (progressIntervalRef.current) {
                  clearInterval(progressIntervalRef.current);
                  progressIntervalRef.current = null;
                }
                if (hasStartedPlayingRef.current) {
                  hasStartedPlayingRef.current = false;
                  markWatched(robustActive + 1, true);
                  if (onComplete) onComplete();
                }
              } else {
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

    checkInterval = setInterval(() => {
      if ((window as any).YT && (window as any).YT.Player && document.getElementById(`yt-player-${currentVideo.ytId}`)) {
        clearInterval(checkInterval);
        initPlayer();
      }
    }, 200);

    return () => {
      clearInterval(checkInterval);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      if (playerRef.current && typeof playerRef.current.destroy === "function") {
        try {
          playerRef.current.destroy();
        } catch (e) { }
        playerRef.current = null;
      }
    };
  }, [currentVideo?.ytId, robustActive, markWatched, onComplete]);

  // Player controls
  const handlePlayPause = () => {
    if (!playerRef.current) return;
    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  };

  const handleRewind10 = () => {
    if (!playerRef.current) return;
    const cur = playerRef.current.getCurrentTime?.() ?? currentTime;
    const target = Math.max(0, cur - 10);
    playerRef.current.seekTo?.(target, true);
    setCurrentTime(target);
  };

  const handleForward10 = () => {
    if (!playerRef.current) return;
    const cur = playerRef.current.getCurrentTime?.() ?? currentTime;
    const dur = playerRef.current.getDuration?.() ?? duration;
    const target = Math.min(dur || 900, cur + 10);
    playerRef.current.seekTo?.(target, true);
    setCurrentTime(target);
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

  const toggleCc = () => {
    const nextState = !isCcEnabled;
    setIsCcEnabled(nextState);
    if (!playerRef.current) return;
    try {
      if (nextState) {
        playerRef.current.loadModule?.("captions");
        playerRef.current.setOption?.("captions", "track", { languageCode: "en" });
      } else {
        playerRef.current.unloadModule?.("captions");
        playerRef.current.setOption?.("captions", "track", {});
      }
    } catch (err) { }
  };

  const toggleFullscreen = () => {
    const container = playerContainerRef.current;
    if (!container) return;
    if (!document.fullscreenElement) {
      container.requestFullscreen?.().catch(() => { });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => { });
      setIsFullscreen(false);
    }
  };

  // Inline the player is just a thumbnail: clicking anywhere opens fullscreen
  // and starts playback (both inside the same click gesture).
  const openFullscreenAndPlay = () => {
    const container = playerContainerRef.current;
    if (container && !document.fullscreenElement) {
      container.requestFullscreen?.().catch(() => { });
      setIsFullscreen(true);
    }
    try { playerRef.current?.playVideo?.(); } catch { /* player not ready */ }
  };

  useEffect(() => {
    const handler = () => {
      const fs = !!document.fullscreenElement;
      setIsFullscreen(fs);
      // Leaving fullscreen returns to the thumbnail — pause playback
      if (!fs) {
        try { playerRef.current?.pauseVideo?.(); } catch { /* ignore */ }
        setShowControls(false);
      }
    };
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
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
    // Controls are hover-only: hide shortly after the cursor leaves
    if (hideControlsTimerRef.current) {
      clearTimeout(hideControlsTimerRef.current);
    }
    hideControlsTimerRef.current = setTimeout(() => {
      setShowControls(false);
    }, 400);
  }, []);

  useEffect(() => {
    if (hideControlsTimerRef.current) {
      clearTimeout(hideControlsTimerRef.current);
      hideControlsTimerRef.current = null;
    }
    if (isPlaying) {
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
    if (currentVideo.topics && currentVideo.topics.length > 0) {
      return currentVideo.topics;
    }
    const curated = KNOWN_VIDEOS_METADATA[currentVideo.ytId];
    if (curated?.topics) return curated.topics;
    return [
      "Anatomy of the Insect Alimentary Canal: Foregut, Midgut & Hindgut",
      "Stomodaeal Specializations: Pharynx, Crop, and Proventriculus (Gizzard)",
      "Mesenteron Physiology: Secretory Epithelium & Peritrophic Membrane",
      "Proctodaeum & Excretion: Malpighian Tubules & Water Reabsorption",
      "Enzymatic Digestion & Nutritional Adaptations in Insects"
    ];
  }, [currentVideo]);

  // Video switching handler for multi-video
  const handleSelectVideo = (index: number) => {
    setActiveVideo(index);
    if (onSelectVideoIndex) {
      onSelectVideoIndex(index + 1);
    }
    if (playerRef.current?.loadVideoById && videos[index]) {
      if (document.fullscreenElement) {
        playerRef.current.loadVideoById(videos[index].ytId);
        setIsPlaying(true);
      } else {
        // Inline is a thumbnail — cue only, don't play behind it
        playerRef.current.cueVideoById?.(videos[index].ytId);
        setIsPlaying(false);
      }
      setCurrentTime(0);
      setProgress(0);
    }
  };

  // Video Player Component
  const renderVideoPlayer = (isFullWidth = false) => (
    <div
      ref={playerContainerRef}
      onMouseMove={handlePlayerMouseMove}
      onMouseLeave={handlePlayerMouseLeave}
      style={{
        position: "relative",
        width: "100%",
        maxWidth: isFullWidth ? "min(680px, 100%)" : "520px",
        maxHeight: isFullWidth ? "min(365px, 44vh)" : undefined,
        margin: "0 auto",
        aspectRatio: "16 / 9",
        minHeight: "unset",
        background: "#000000",
        borderRadius: "16px",
        overflow: "hidden",
        boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        cursor: isPlaying && !showControls ? "none" : "default",
      }}
    >
      {/* YouTube Iframe */}
      <div
        id={`yt-player-${currentVideo.ytId}`}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          border: 0,
          pointerEvents: "none",
        }}
      />

      {/* Thumbnail cover — shown inline (not fullscreen) */}
      {!isFullscreen && currentVideo?.ytId && (
        <img
          src={`https://i.ytimg.com/vi/${currentVideo.ytId}/maxresdefault.jpg`}
          onError={(e) => {
            const img = e.currentTarget;
            if (!img.src.includes("hqdefault")) img.src = `https://i.ytimg.com/vi/${currentVideo.ytId}/hqdefault.jpg`;
          }}
          alt={currentVideo.title || "Video thumbnail"}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            zIndex: 1,
            pointerEvents: "none",
          }}
        />
      )}

      {/* Transparent click overlay: inline → open fullscreen; fullscreen → play/pause */}
      <div
        onClick={() => (isFullscreen ? handlePlayPause() : openFullscreenAndPlay())}
        onDoubleClick={isFullscreen ? toggleFullscreen : undefined}
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 2,
          cursor: isPlaying && !showControls ? "none" : "pointer",
        }}
      />

      {/* Center Play Overlay when Paused */}
      {(!isPlaying || !isFullscreen) && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (isFullscreen) handlePlayPause();
            else openFullscreenAndPlay();
          }}
          aria-label="Play Video"
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            border: "none",
            background: "rgba(255, 255, 255, 0.95)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 8,
            transition: "transform 0.2s ease, background 0.2s ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = "translate(-50%, -50%) scale(1.1)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = "translate(-50%, -50%) scale(1)";
          }}
        >
          <div
            style={{
              width: 0,
              height: 0,
              borderTop: "11px solid transparent",
              borderBottom: "11px solid transparent",
              borderLeft: "18px solid #1E293B",
              marginLeft: "4px",
            }}
          />
        </button>
      )}

      {/* Control Bar - Auto-hides when video is playing unless cursor moves */}
      <div
        onMouseEnter={() => {
          if (hideControlsTimerRef.current) {
            clearTimeout(hideControlsTimerRef.current);
          }
          setShowControls(true);
        }}
        onMouseLeave={() => {
          if (isPlaying) {
            if (hideControlsTimerRef.current) {
              clearTimeout(hideControlsTimerRef.current);
            }
            hideControlsTimerRef.current = setTimeout(() => {
              setShowControls(false);
            }, 2500);
          }
        }}
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          background: "linear-gradient(to top, rgba(0, 0, 0, 0.95) 0%, rgba(0, 0, 0, 0.72) 65%, transparent 100%)",
          padding: "24px 20px 14px 20px",
          display: "flex",
          flexDirection: "column",
          width: "100%",
          boxSizing: "border-box",
          opacity: isFullscreen && showControls ? 1 : 0,
          transform: isFullscreen && showControls ? "translateY(0)" : "translateY(10px)",
          pointerEvents: isFullscreen && showControls ? "auto" : "none",
          transition: "opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1), transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
          userSelect: "none",
        }}
      >
        {/* Full-width Seek Bar with comfortable hit area */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            handleSeekClick(e);
          }}
          title="Seek"
          style={{
            position: "relative",
            width: "100%",
            height: "18px",
            display: "flex",
            alignItems: "center",
            cursor: "pointer",
            marginBottom: "6px",
          }}
          onMouseEnter={(e) => {
            const track = e.currentTarget.querySelector(".seek-track") as HTMLDivElement;
            if (track) track.style.height = "8px";
            const thumb = e.currentTarget.querySelector(".seek-thumb") as HTMLDivElement;
            if (thumb) thumb.style.transform = "translateY(-50%) scale(1.25)";
          }}
          onMouseLeave={(e) => {
            const track = e.currentTarget.querySelector(".seek-track") as HTMLDivElement;
            if (track) track.style.height = "6px";
            const thumb = e.currentTarget.querySelector(".seek-thumb") as HTMLDivElement;
            if (thumb) thumb.style.transform = "translateY(-50%) scale(1)";
          }}
        >
          {/* Seek Track */}
          <div
            className="seek-track"
            style={{
              position: "relative",
              width: "100%",
              height: "6px",
              background: "rgba(255, 255, 255, 0.32)",
              borderRadius: "4px",
              transition: "height 0.15s ease",
            }}
          >
            {/* Progress Fill */}
            <div
              style={{
                height: "100%",
                width: `${Math.min(100, Math.max(0, progress))}%`,
                background: "#FFFFFF",
                borderRadius: "4px",
                position: "relative",
              }}
            >
              {/* Scrubber Thumb */}
              <div
                className="seek-thumb"
                style={{
                  position: "absolute",
                  right: "-7px",
                  top: "50%",
                  transform: "translateY(-50%) scale(1)",
                  width: "15px",
                  height: "15px",
                  borderRadius: "50%",
                  background: "#FFFFFF",
                  boxShadow: "0 0 8px rgba(0,0,0,0.7), 0 2px 4px rgba(0,0,0,0.5)",
                  transition: "transform 0.15s ease",
                }}
              />
            </div>
          </div>
        </div>

        {/* Controls Row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "4px 6px 4px 6px",
            gap: "16px",
          }}
        >
          {/* Left Controls */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {/* Play/Pause */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePlayPause();
              }}
              title={isPlaying ? "Pause (Space/k)" : "Play (Space/k)"}
              aria-label={isPlaying ? "Pause" : "Play"}
              style={{
                background: "rgba(255, 255, 255, 0.12)",
                border: "none",
                color: "#FFFFFF",
                cursor: "pointer",
                padding: 0,
                width: "38px",
                height: "38px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background 0.15s ease, transform 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.25)";
                e.currentTarget.style.transform = "scale(1.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.12)";
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              {isPlaying ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#FFFFFF">
                  <rect x="5" y="4" width="4.5" height="16" rx="1.5" />
                  <rect x="14.5" y="4" width="4.5" height="16" rx="1.5" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#FFFFFF" style={{ marginLeft: "2px" }}>
                  <polygon points="6,4 20,12 6,20" />
                </svg>
              )}
            </button>

            {/* Rewind 10s («) */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRewind10();
              }}
              title="Rewind 10s"
              aria-label="Rewind 10s"
              style={{
                background: "transparent",
                border: "none",
                color: "#FFFFFF",
                cursor: "pointer",
                padding: 0,
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background 0.15s ease, transform 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)";
                e.currentTarget.style.transform = "scale(1.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="11 17 6 12 11 7" />
                <polyline points="18 17 13 12 18 7" />
              </svg>
            </button>

            {/* Forward 10s (») */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleForward10();
              }}
              title="Forward 10s"
              aria-label="Forward 10s"
              style={{
                background: "transparent",
                border: "none",
                color: "#FFFFFF",
                cursor: "pointer",
                padding: 0,
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background 0.15s ease, transform 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)";
                e.currentTarget.style.transform = "scale(1.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="13 17 18 12 13 7" />
                <polyline points="6 17 11 12 6 7" />
              </svg>
            </button>

            {/* Timestamp */}
            <div
              style={{
                color: "#FFFFFF",
                fontSize: "14px",
                fontWeight: 600,
                whiteSpace: "nowrap",
                letterSpacing: "0.3px",
                fontVariantNumeric: "tabular-nums",
                userSelect: "none",
                marginLeft: "4px",
              }}
            >
              {duration > 0 ? `${formatTime(currentTime)} / ${formatTime(duration)}` : "00:00 / 00:00"}
            </div>

            {/* Volume Icon + Slider */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginLeft: "6px" }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMute();
                }}
                title={isMuted ? "Unmute (m)" : "Mute (m)"}
                aria-label={isMuted ? "Unmute" : "Mute"}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#FFFFFF",
                  cursor: "pointer",
                  padding: 0,
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "background 0.15s ease, transform 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)";
                  e.currentTarget.style.transform = "scale(1.08)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                {isMuted || volume === 0 ? (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="#FFFFFF" />
                    <line x1="23" y1="9" x2="17" y2="15" />
                    <line x1="17" y1="9" x2="23" y2="15" />
                  </svg>
                ) : (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="#FFFFFF" />
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" strokeWidth="2.2" />
                    <path d="M18.8 5.2a9 9 0 0 1 0 13.6" strokeWidth="2.2" />
                  </svg>
                )}
              </button>
              <input
                type="range"
                min="0"
                max="100"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                onClick={(e) => e.stopPropagation()}
                style={{
                  width: "75px",
                  height: "5px",
                  accentColor: "#FFFFFF",
                  cursor: "pointer",
                }}
              />
            </div>
          </div>

          {/* Right Controls */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {/* Speed Selector Toggle / Inline Pills */}
            {!showSpeedSelector ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSpeedSelector(true);
                }}
                title="Playback Speed"
                aria-label="Playback Speed"
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#FFFFFF",
                  cursor: "pointer",
                  padding: 0,
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "background 0.15s ease, transform 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)";
                  e.currentTarget.style.transform = "scale(1.08)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                {/* Speedometer Gauge Icon */}
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="9" />
                  <line x1="12" y1="12" x2="16" y2="8" strokeWidth="2.2" />
                  <circle cx="12" cy="12" r="1.5" fill="#FFFFFF" />
                  <path d="M7 12a5 5 0 0 1 1.46-3.54" strokeDasharray="1 2.5" />
                </svg>
              </button>
            ) : (
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  background: "rgba(0, 0, 0, 0.6)",
                  padding: "3px 6px",
                  borderRadius: "16px",
                  border: "1px solid rgba(255, 255, 255, 0.25)",
                }}
              >
                {[
                  { label: "Normal", rate: 1 },
                  { label: "1.25x", rate: 1.25 },
                  { label: "1.5x", rate: 1.5 },
                  { label: "2x", rate: 2 },
                ].map((s) => {
                  const isActive = playbackRate === s.rate;
                  return (
                    <button
                      key={s.rate}
                      type="button"
                      onClick={() => {
                        setPlaybackRate(s.rate);
                        if (playerRef.current && typeof playerRef.current.setPlaybackRate === "function") {
                          playerRef.current.setPlaybackRate(s.rate);
                        }
                      }}
                      style={{
                        background: isActive ? "rgba(255, 255, 255, 0.28)" : "transparent",
                        border: isActive ? "1px solid rgba(255, 255, 255, 0.8)" : "1px solid transparent",
                        color: "#FFFFFF",
                        fontSize: "12px",
                        fontWeight: isActive ? 700 : 500,
                        borderRadius: "12px",
                        padding: "3px 8px",
                        cursor: "pointer",
                        lineHeight: 1.3,
                        transition: "all 0.15s ease",
                      }}
                    >
                      {s.label}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setShowSpeedSelector(false)}
                  title="Close speed selector"
                  style={{
                    background: "none",
                    border: "none",
                    color: "rgba(255, 255, 255, 0.75)",
                    cursor: "pointer",
                    padding: "0 4px",
                    fontSize: "13px",
                    lineHeight: 1,
                  }}
                >
                  ✕
                </button>
              </div>
            )}

            {/* CC Subtitles Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleCc();
              }}
              title={isCcEnabled ? "Turn Captions Off (c)" : "Turn Captions On (c)"}
              aria-label={isCcEnabled ? "Turn Captions Off" : "Turn Captions On"}
              style={{
                background: "transparent",
                border: "none",
                color: isCcEnabled ? "#60A5FA" : "#FFFFFF",
                cursor: "pointer",
                padding: 0,
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background 0.15s ease, transform 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)";
                e.currentTarget.style.transform = "scale(1.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="5" width="18" height="14" rx="3" />
                <line x1="7" y1="12" x2="11" y2="12" strokeWidth="2" />
                <line x1="13" y1="12" x2="17" y2="12" strokeWidth="2" />
              </svg>
            </button>

            {/* Fullscreen Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFullscreen();
              }}
              title={isFullscreen ? "Exit Fullscreen (f)" : "Fullscreen (f)"}
              aria-label={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              style={{
                background: "transparent",
                border: "none",
                color: "#FFFFFF",
                cursor: "pointer",
                padding: 0,
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background 0.15s ease, transform 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)";
                e.currentTarget.style.transform = "scale(1.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                {isFullscreen ? (
                  <>
                    <polyline points="4 14 10 14 10 20" />
                    <polyline points="20 10 14 10 14 4" />
                    <line x1="14" y1="10" x2="21" y2="3" />
                    <line x1="3" y1="21" x2="10" y2="14" />
                  </>
                ) : (
                  <>
                    <polyline points="15 3 21 3 21 9" />
                    <polyline points="9 21 3 21 3 15" />
                    <line x1="21" y1="3" x2="14" y2="10" />
                    <line x1="3" y1="21" x2="10" y2="14" />
                  </>
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Topics Detail Section
  const renderTopicsSection = () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        position: "relative",
        zIndex: 1,
      }}
    >
      {/* Main Chapter / Video Title (Centered and Enlarged) */}
      <h2
        style={{
          fontSize: "25px",
          fontWeight: 800,
          color: "#111827",
          margin: "4px 0 14px 0",
          textAlign: "center",
          letterSpacing: "-0.3px",
          lineHeight: 1.25,
        }}
      >
        {displayTitle}
      </h2>

      {/* 5 Topic Rows with Dedicated Icons */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", zIndex: 1 }}>
        {topicsList.slice(0, 5).map((topic, idx) => (
          <div
            key={idx}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
              padding: "10px 16px",
              background: "#FAF8F6",
              borderRadius: "14px",
              border: "1px solid #ECE7E1",
              transition: "transform 0.15s ease, background 0.15s ease",
            }}
          >
            {/* Circular Icon Container */}
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: "#EDEAE5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {renderTopicIcon(idx)}
            </div>

            {/* Topic Text */}
            <span
              style={{
                fontSize: "13px",
                fontWeight: 500,
                color: "#1F2937",
                lineHeight: 1.35,
              }}
            >
              {topic}
            </span>
          </div>
        ))}
      </div>

      {/* Watermark in Bottom-Right Corner */}
      <InsectWatermark />
    </div>
  );

  return (
    <div
      className="videos-figma-container"
      style={{
        width: "100%",
        minHeight: "100%",
        background: "radial-gradient(ellipse at 15% 15%, #FAF5ED 0%, #EFF5F0 45%, #E1ECE4 100%)",
        padding: "12px 16px 28px 16px",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
      }}
    >
      <style>{`
        .custom-details-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .custom-details-scroll::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.03);
          border-radius: 8px;
        }
        .custom-details-scroll::-webkit-scrollbar-thumb {
          background: rgba(45, 62, 54, 0.25);
          border-radius: 8px;
        }
        .custom-details-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(45, 62, 54, 0.45);
        }
      `}</style>

      {/* ── CASE 1: SINGLE VIDEO IN CHAPTER (Wider Horizontal Centered Card) ── */}
      {isSingleVideo ? (
        <div
          style={{
            width: "100%",
            maxWidth: "760px",
            margin: "0 auto",
            background: "#FFFFFF",
            borderRadius: "22px",
            padding: "16px 20px 24px 20px",
            boxShadow: "0 10px 40px rgba(0, 0, 0, 0.05)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            position: "relative",
            boxSizing: "border-box",
          }}
        >
          {/* Centered Video Player */}
          <div style={{ width: "100%", display: "flex", justifyContent: "center", flexShrink: 0 }}>
            {renderVideoPlayer(true)}
          </div>

          {/* Details Preview below */}
          <div
            style={{
              width: "100%",
              maxWidth: "680px",
              marginTop: "16px",
              position: "relative",
            }}
          >
            {renderTopicsSection()}
          </div>
        </div>
      ) : (
        /* ── CASE 2: MULTIPLE VIDEOS IN CHAPTER (Wider Grid Layout) ── */
        <div style={{ width: "100%", maxWidth: "1060px", margin: "0 auto" }}>
          {/* Video Selector Tabs for Chapter Playlist */}
          {videos.length > 1 && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "8px",
                marginBottom: "14px",
                overflowX: "auto",
                paddingBottom: "4px",
              }}
            >
              <span style={{ fontSize: "12px", fontWeight: 700, color: "#4B5563", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Chapter Videos:
              </span>
              {videos.map((vid, idx) => {
                const isActive = idx === robustActive;
                return (
                  <button
                    key={vid.ytId || idx}
                    onClick={() => handleSelectVideo(idx)}
                    style={{
                      padding: "6px 14px",
                      borderRadius: "16px",
                      border: isActive ? "1.5px solid #2D3E36" : "1px solid #D1D5DB",
                      background: isActive ? "#2D3E36" : "#FFFFFF",
                      color: isActive ? "#FFFFFF" : "#374151",
                      fontSize: "12.5px",
                      fontWeight: isActive ? 700 : 500,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      whiteSpace: "nowrap",
                      boxShadow: isActive ? "0 2px 6px rgba(45,62,54,0.2)" : "none",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <span>{isActive ? "▶" : "•"}</span>
                    <span>Video {idx + 1}: {vid.title.length > 24 ? vid.title.slice(0, 24) + "..." : vid.title}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Centered Grid Layout */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 520px) minmax(0, 1fr)",
              gap: "24px",
              alignItems: "start",
              justifyContent: "center",
            }}
          >
            {/* Left: Compact Centered Video Player */}
            <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
              {renderVideoPlayer(false)}
            </div>

            {/* Right: Details Card with Scroll */}
            <div
              className="custom-details-scroll"
              style={{
                background: "#FFFFFF",
                borderRadius: "24px",
                padding: "20px 22px",
                boxShadow: "0 10px 40px rgba(0, 0, 0, 0.05)",
                position: "relative",
                overflowY: "auto",
                maxHeight: "440px",
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {renderTopicsSection()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
