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

const KNOWN_VIDEOS_METADATA: Record<string, { title: string; topics: string[] }> = {
  "Ioa25iYy53g": {
    title: "Insects Digestive System",
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
    topics: [
      "Floral Biology Architecture & Angiosperm Double Fertilization",
      "Self-Pollination (Autogamy): Homogamy, Cleistogamy & Chasmogamy",
      "Cross-Pollination (Allogamy) & Self-Incompatibility (GSI vs SSI Systems)",
      "Pollinizer Cultivar Proportion & Commercial Orchard Planting Geometry",
      "Parthenocarpy: Vegetative, Stimulative & Stenospermocarpy Mechanisms"
    ]
  }
};

/**
 * VideosView Component
 * Renders the video study interface including list view and player view.
 */
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
  const [videoMode, setVideoMode] = useState<"long" | "short">("long");
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [activeVideo, setActiveVideo] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const [videoProgresses, setVideoProgresses] = useState<Record<string, number>>({});

  // Fullscreen state — tracks the real browser fullscreen status
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Custom Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [isCcEnabled, setIsCcEnabled] = useState(false);

  const toggleCc = () => {
    const nextState = !isCcEnabled;
    setIsCcEnabled(nextState);
    if (!playerRef.current) return;
    try {
      if (nextState) {
        if (typeof playerRef.current.loadModule === "function") {
          playerRef.current.loadModule("captions");
        }
        if (typeof playerRef.current.setOption === "function") {
          playerRef.current.setOption("captions", "track", { languageCode: "en" });
        }
      } else {
        if (typeof playerRef.current.unloadModule === "function") {
          playerRef.current.unloadModule("captions");
        }
        if (typeof playerRef.current.setOption === "function") {
          playerRef.current.setOption("captions", "track", {});
        }
      }
    } catch (err) {
      console.warn("Failed to toggle CC:", err);
    }
  };

  // Bookmarks & Sidebar Tab
  const [bookmarks, setBookmarks] = useState<{ id: string; ytId: string; timestamp: number; note: string }[]>([]);
  const [sidebarTab, setSidebarTab] = useState<"transcript" | "bookmarks">("bookmarks");
  const [bookmarkNote, setBookmarkNote] = useState("");
  const [isBookmarkInputOpen, setIsBookmarkInputOpen] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseMove = useCallback(() => {
    setIsHovered(true);
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => setIsHovered(false), 2500);
  }, []);

  // Transcript
  const [transcriptContent, setTranscriptContent] = useState<string | null>(null);
  const [isTranscriptLoading, setIsTranscriptLoading] = useState(false);

  const playerRef = useRef<any>(null);
  const hasStartedPlayingRef = useRef<boolean>(false);

  const shortVideosList = [
    { ytId: "-JpxEEPtNos", title: "Foundations of Histology", topics: ["Introduction to microscopic anatomy", "Cellular organization", "Basic tissue types overview"] },
    { ytId: "8hdw8CLVZao", title: "Epithelial Tissue", topics: ["Structural characteristics", "Basement membrane", "Avascular nature"] },
    { ytId: "awQ6iU5KWMk", title: "Simple Epithelium Types", topics: ["Squamous epithelium", "Cuboidal epithelium", "Columnar epithelium"] },
    { ytId: "XYkQgl5IC68", title: "Compound and Transitional Epithelium", topics: ["Stratified layers", "Protection functions", "Stretchable transitional tissue"] },
    { ytId: "3rOFESmVTbQ", title: "Connective Tissue Proper : cells of connective tissue", topics: ["Fibroblasts", "Macrophages", "Mast cells and Adipocytes"] },
    { ytId: "IbvSl7WkGsQ", title: "Connective Tissue Proper : Matrix and Fibers", topics: ["Collagen fibers", "Elastic and reticular fibers", "Ground substance composition"] },
    { ytId: "1NSGbA3A4Ts", title: "Loose and Dense Connective Tissue", topics: ["Areolar and adipose tissue", "Dense regular tissue", "Dense irregular tissue"] },
    { ytId: "iaWN0StIFxU", title: "Supportive Connective Tissue : Cartilage Structure and Types", topics: ["Chondrocytes", "Hyaline cartilage", "Elastic and fibrocartilage"] },
    { ytId: "WLO69oEV5uE", title: "Bone Composition and Classification", topics: ["Organic and inorganic matrix", "Compact bone", "Spongy (cancellous) bone"] },
    { ytId: "jO-NBR1Y9Qk", title: "Anatomy of Long Bones and Osteons", topics: ["Haversian systems", "Osteocytes in lacunae", "Canaliculi and blood supply"] },
    { ytId: "IzQkokKYA6A", title: "Fluid Connective Tissue: Blood and Lymph", topics: ["Plasma composition", "Formed elements", "Lymphatic fluid differences"] },
    { ytId: "1g90wbAN6as", title: "Red Blood Cells (Erythrocytes)", topics: ["Biconcave shape", "Hemoglobin transport", "Lack of nucleus in mammals"] },
    { ytId: "8FNyWX48DNs", title: "White Blood Cells and Platelets", topics: ["Granulocytes", "Agranulocytes", "Platelets and blood clotting"] },
    { ytId: "4G7POypkcLE", title: "Muscular Tissue", topics: ["Contractile properties", "Excitability", "Role in body movement"] },
    { ytId: "a3Lc7EyjKI4", title: "Skeletal (Striped) Muscle Structure", topics: ["Striations", "Multinucleated cells", "Voluntary control"] },
    { ytId: "Om40XueGJ_k", title: "Smooth and Cardiac Muscle", topics: ["Involuntary contraction", "Spindle-shaped smooth cells", "Intercalated discs in cardiac"] },
    { ytId: "Ox3CbPM9uv4", title: "Nervous Tissue : Neuroglia and Neuron Development", topics: ["Supportive glial cells", "Myelination", "Developmental origins"] },
    { ytId: "ajlWgPjEa5Y", title: "Neuron Anatomy and Classification", topics: ["Dendrites and axons", "Cell body (soma)", "Sensory, motor, and interneurons"] },
    { ytId: "aHvELPPzWIw", title: "Animal Tissues", topics: ["Summary of tissue integration", "Organ system formation", "Homeostasis regulation"] }
  ];

  // 1. Registry-backed list when the chapter is segmented, otherwise the legacy
  // hard-coded / youtube_links.md-scraped list.
  const videos = useMemo(() => {
    if (videoMode === "short" && subjectId === "neb_xii_biology" && chapterNumber === 6) {
      return shortVideosList;
    }
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
          topics: [
            "Derivation and Operator Interpretation of Klein-Gordon Equation",
            "Squaring Approach & Negative Energy Solutions",
            "Dirac Equation Formulation & Gamma Matrices",
            "Probability Density and Current Conservation"
          ]
        }
      ];
    } else if (subjectId === "pubadm_ur" && chapterNumber === 1) {
      list = [
        {
          title: "Video Lecture Part 1",
          ytId: "zudAdjtoraA",
          topics: [
            "Introduction to Public Administration & Core Concepts",
            "Evolution of Administrative Thought & Historical Context",
            "Scope and Significance in Modern Governance",
            "Key Differences between Public and Private Administration"
          ]
        },
        {
          title: "Video Lecture Part 2",
          ytId: "LEfMH2SNznY",
          topics: [
            "Organizational Structure & Bureaucratic Theories",
            "Principles of Scientific Management (F.W. Taylor)",
            "Classical Administrative Theory (Henri Fayol)",
            "Human Relations Approach & Hawthorne Experiments"
          ]
        },
        {
          title: "Video Lecture Part 3",
          ytId: "vb9N0S158GA",
          topics: [
            "Decision Making in Administration (Herbert Simon)",
            "Motivation and Leadership in Public Organizations",
            "Comparative Public Administration & Development",
            "Accountability and Control Mechanisms in Public Services"
          ]
        },
      ];
    } else if ((subjectId === "ento_131" || subjectId.includes("ento") || subjectId.includes("digestive")) && chapterNumber === 1) {
      list = [
        {
          title: "Insects Digestive System",
          ytId: "Ioa25iYy53g",
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
          topics: [
            "Floral Biology Architecture & Angiosperm Double Fertilization",
            "Self-Pollination (Autogamy): Homogamy, Cleistogamy & Chasmogamy",
            "Cross-Pollination (Allogamy) & Self-Incompatibility (GSI vs SSI Systems)",
            "Pollinizer Cultivar Proportion & Commercial Orchard Planting Geometry",
            "Parthenocarpy: Vegetative, Stimulative & Stenospermocarpy Mechanisms"
          ]
        }
      ];
    } else if (subjectId === "neb_xii_biology" && chapterNumber === 6) {
      list = [
        {
          title: "Animal Tissue",
          ytId: "q2Zgesdh0oE",
          topics: [
            "History and Overview",
            "Epithelial Tissue",
            "Connective Tissue",
            "Muscular and Nervous Tissue"
          ]
        }
      ];
    } else if (subjectId === "management") {
      list = [
        {
          title: "Importance and Scope of Marketing",
          ytId: "HKKodDR1VN8",
          topics: [
            "Introduction to Marketing Concepts & Nine Core Elements",
            "The Evolution of Marketing Thought & Modern Management Tasks",
            "Marketing Environment Analysis & Customer Value Equations",
            "Industrial (B2B) Marketing & Demand Volatility Strategies"
          ]
        },
        {
          title: "Services Marketing",
          ytId: "QIPTU6R6-8U",
          topics: [
            "Introduction to Services Marketing & Economic Context",
            "Uber Case Study & Service Industry Business Models",
            "The Six Inherent Characteristics of Services",
            "The Extended Seven Ps Framework & Service Excellence"
          ]
        },
        {
          title: "Global Marketing",
          ytId: "JUth69rroDM",
          topics: [
            "Global Marketing Definitions & Core Analytical Concepts",
            "Global Strategy Dilemmas & Market Expansion Frameworks",
            "Multinational Case Studies & Foundational Competitive Benefits",
            "Critical International Challenges & Cultural Adaptations"
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
        if (!list.some(v => v.ytId === id)) {
          const curated = KNOWN_VIDEOS_METADATA[id];
          list.push({
            title: curated?.title || `Video ${idx++}`,
            ytId: id,
            topics: curated?.topics || [
              "Key conceptual overview & core principles",
              "Practical examples and real-world applications",
              "Critical analysis and problem solving",
              "Summary of key takeaways and summary points"
            ]
          });
        }
      }
    }
    return list;
  }, [subjectId, chapterNumber, youtubeLinksContent, chapterName, chapterVideos, videoMode]);

  const isSegmented = !!chapterVideos && chapterVideos.length > 0;

  const robustActive = activeVideo >= videos.length ? 0 : activeVideo;
  const currentVideo = selectedVideoId ? videos.find(v => v.ytId === selectedVideoId) || videos[robustActive] : videos[robustActive];

  /** 1-based index of the video on screen — the unit the gating store keys on. */
  const currentVideoIndex = (selectedVideoId
    ? videos.findIndex((v) => v.ytId === selectedVideoId)
    : robustActive) + 1;

  // Videos already reported as watched, so the 1s progress tick past the
  // threshold reports once rather than every second for the rest of the video.
  const reportedWatchedRef = useRef<Set<number>>(new Set());

  const previousVideoIndexRef = useRef<number | null>(null);

  // Follow the unit the parent is studying. This is what lands the learner on
  // the next video after they finish (or skip) the previous one's tools.
  useEffect(() => {
    if (!isSegmented || !activeVideoIndex || videos.length === 0) return;
    const idx = Math.min(Math.max(activeVideoIndex, 1), videos.length) - 1;
    setActiveVideo(idx);

    // Open the player only when the parent moves us to a *different* video —
    // arriving on the tool should still show the list, so the learner can see
    // what is unlocked and what is still ahead of them.
    const previous = previousVideoIndexRef.current;
    previousVideoIndexRef.current = activeVideoIndex;
    if (previous !== null && previous !== activeVideoIndex && videos[idx]) {
      setSelectedVideoId(videos[idx].ytId);
    }
  }, [isSegmented, activeVideoIndex, videos]);

  // The parent passes a fresh inline callback on every render. Reading it from a
  // ref keeps `markWatched` referentially stable, which matters because it is a
  // dependency of the player effect below — an unstable one would tear the
  // YouTube player down and rebuild it on every parent render.
  const onVideoWatchedRef = useRef(onVideoWatched);
  useEffect(() => {
    onVideoWatchedRef.current = onVideoWatched;
  });

  /**
   * `advance` separates the two things that used to be conflated. Crossing the
   * threshold only unlocks the video's tools — it must not navigate, or the
   * learner gets yanked out of a video they are still watching. Only the video
   * genuinely ending hands off to the next step.
   */
  const markWatched = useCallback((videoIndex: number, advance = false) => {
    if (reportedWatchedRef.current.has(videoIndex) && !advance) return;
    reportedWatchedRef.current.add(videoIndex);
    onVideoWatchedRef.current?.(videoIndex, advance);
  }, []);

  // Load bookmarks
  useEffect(() => {
    const saved = localStorage.getItem(`sv_video_bookmarks_${subjectId}_${chapterNumber}`);
    if (saved) {
      try {
        setBookmarks(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load bookmarks", e);
      }
    } else {
      setBookmarks([]);
    }
  }, [subjectId, chapterNumber]);

  // Load progresses of all videos in the playlist on load
  useEffect(() => {
    const progresses: Record<string, number> = {};
    videos.forEach((vid) => {
      const saved = localStorage.getItem(`sv_video_progress_${subjectId}_${chapterNumber}_${vid.ytId}`);
      if (saved) {
        try {
          const { pct } = JSON.parse(saved);
          progresses[vid.ytId] = pct || 0;
        } catch {
          // ignore
        }
      }
    });
    setVideoProgresses(progresses);
  }, [videos, subjectId, chapterNumber]);

  // 2. Fetch video_script.md for transcript
  useEffect(() => {
    if (!currentVideo) return;
    setIsTranscriptLoading(true);
    getResourceContent(subjectId, chapterNumber, "video_script.md", persona)
      .then((res) => {
        if (res && res !== "Content not available.") {
          const cleaned = res
            .replace(/<div[\s\S]*?<iframe[\s\S]*?<\/iframe>[\s\S]*?<\/div>/gi, "")
            .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
            .trim();
          setTranscriptContent(cleaned);
        } else {
          getResourceContent(subjectId, chapterNumber, "podcast_script.md", persona)
            .then((podRes) => {
              if (podRes && podRes !== "Content not available.") {
                setTranscriptContent(`*(Transcript fallback from Podcast Script)*\n\n${podRes}`);
              } else {
                setTranscriptContent(null);
              }
            })
            .catch(() => setTranscriptContent(null));
        }
        setIsTranscriptLoading(false);
      })
      .catch(() => {
        setTranscriptContent(null);
        setIsTranscriptLoading(false);
      });
  }, [currentVideo, subjectId, chapterNumber, persona]);

  // 3. YouTube API loading & player management (only when video selected)
  useEffect(() => {
    hasStartedPlayingRef.current = false;
    if (!selectedVideoId || !currentVideo) return;

    if (!(window as any).YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    let checkInterval: any;
    let progressInterval: any;

    const initPlayer = () => {
      const elementId = `yt-player-${currentVideo.ytId}`;
      const el = document.getElementById(elementId);
      if (!el || el.tagName === "IFRAME") return;

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
        },
        events: {
          onReady: (event: any) => {
            try {
              if (event.target && typeof event.target.unloadModule === "function") {
                event.target.unloadModule("captions");
              }
              if (event.target && typeof event.target.setOption === "function") {
                event.target.setOption("captions", "track", {});
              }
            } catch (err) { }

            const saved = localStorage.getItem(`sv_video_progress_${subjectId}_${chapterNumber}_${currentVideo.ytId}`);
            if (saved) {
              try {
                const { current } = JSON.parse(saved);
                event.target.seekTo(current, true);
                setCurrentTime(current);
              } catch (e) {
                console.error(e);
              }
            }
          },
          onStateChange: (event: any) => {
            try {
              if (event.target) {
                if (typeof event.target.unloadModule === "function") {
                  event.target.unloadModule("captions");
                }
                if (typeof event.target.setOption === "function") {
                  event.target.setOption("captions", "track", {});
                }
              }
            } catch (e) { }
            if (event.data === (window as any).YT.PlayerState.PLAYING) {
              hasStartedPlayingRef.current = true;
              setIsPlaying(true);
              if (!progressInterval) {
                progressInterval = setInterval(() => {
                  if (playerRef.current && typeof playerRef.current.getCurrentTime === "function") {
                    const current = playerRef.current.getCurrentTime();
                    const dur = playerRef.current.getDuration();
                    if (dur > 0) {
                      const pct = (current / dur) * 100;
                      setCurrentTime(current);
                      setDuration(dur);
                      setProgress(pct);
                      localStorage.setItem(
                        `sv_video_progress_${subjectId}_${chapterNumber}_${currentVideo.ytId}`,
                        JSON.stringify({ current, duration: dur, pct })
                      );
                      setVideoProgresses((prev) => ({
                        ...prev,
                        [currentVideo.ytId]: pct,
                      }));
                      // Watching ~the whole video counts, so trailing credits or
                      // an outro the learner skips don't strand them. Unlocks
                      // only — the video keeps playing to its end. Gated on
                      // hasStartedPlayingRef: onReady seeks back to the saved
                      // position, so reopening an almost-finished video would
                      // otherwise clear the threshold without any playback.
                      if (pct >= WATCHED_THRESHOLD_PCT && hasStartedPlayingRef.current) {
                        markWatched(currentVideoIndex, false);
                      }
                    }
                  }
                }, 1000);
              }
            } else if (event.data === (window as any).YT.PlayerState.ENDED) {
              setIsPlaying(false);
              if (progressInterval) {
                clearInterval(progressInterval);
                progressInterval = null;
              }
              // Only count a genuine play-through, not the ENDED that fires when
              // onReady restores a position at the very end of the video.
              if (hasStartedPlayingRef.current) {
                hasStartedPlayingRef.current = false;
                markWatched(currentVideoIndex, true);
                if (onComplete) {
                  onComplete();
                }
              }
            } else {
              setIsPlaying(false);
              if (progressInterval) {
                clearInterval(progressInterval);
                progressInterval = null;
              }
            }
          },
        },
      });
    };

    checkInterval = setInterval(() => {
      if ((window as any).YT && (window as any).YT.Player && document.getElementById(`yt-player-${currentVideo.ytId}`)) {
        clearInterval(checkInterval);
        initPlayer();
      }
    }, 200);

    return () => {
      clearInterval(checkInterval);
      if (progressInterval) clearInterval(progressInterval);
      if (playerRef.current && typeof playerRef.current.destroy === "function") {
        try {
          // The YouTube IFrame API modifies the DOM internally. When React
          // unmounts the component (e.g. ArrowLeft chapter navigation) React
          // may have already removed some nodes before destroy() runs, causing
          // a "removeChild: node is not a child" DOMException. We silence it
          // here because the player teardown is still logically complete.
          playerRef.current.destroy();
        } catch (e) {
          // intentionally ignored — harmless cleanup race between React and the YT API
        }
        playerRef.current = null;
      }
    };
    // Keyed on the video's id rather than the object: the `videos` memo
    // recomputes when youtube_links.md arrives, and rebuilding the player for a
    // new object describing the same video would interrupt playback.
  }, [
    selectedVideoId,
    currentVideo?.ytId,
    subjectId,
    chapterNumber,
    currentVideoIndex,
    isSegmented,
    markWatched,
  ]);

  // Sync isFullscreen with the browser's actual fullscreen state
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  // Auto-enter fullscreen whenever a video is selected; exit when deselected
  useEffect(() => {
    if (selectedVideoId) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    }
  }, [selectedVideoId]);

  useEffect(() => {
    // Reset video index when switching modes to avoid out of bounds
    setSelectedVideoId(null);
    setActiveVideo(0);
  }, [videoMode]);

  const formatTime = (sec: number) => {
    if (isNaN(sec) || sec < 0) return "00:00";
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const handlePlayPause = () => {
    if (!playerRef.current) return;
    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!playerRef.current || duration === 0) return;
    const newPct = parseFloat(e.target.value);
    const newTime = (newPct / 100) * duration;
    playerRef.current.seekTo(newTime, true);
    setCurrentTime(newTime);
    setProgress(newPct);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!playerRef.current) return;
    const newVol = parseInt(e.target.value, 10);
    setVolume(newVol);
    playerRef.current.setVolume(newVol);
    if (newVol > 0 && isMuted) {
      setIsMuted(false);
      playerRef.current.unMute();
    }
  };

  const toggleMute = () => {
    if (!playerRef.current) return;
    if (isMuted) {
      playerRef.current.unMute();
      setIsMuted(false);
      if (volume === 0) setVolume(50);
    } else {
      playerRef.current.mute();
      setIsMuted(true);
    }
  };

  const handleSpeedChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!playerRef.current) return;
    const speed = parseFloat(e.target.value);
    setPlaybackRate(speed);
    playerRef.current.setPlaybackRate(speed);
  };

  const unitTabsNode = (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        borderBottom: subjectId === "neb_xii_biology" && chapterNumber === 6 ? "2px solid #e2e8f0" : "none",
        paddingBottom: "8px",
        marginBottom: "12px",
        flexShrink: 0,
      }}
    >

      {/* Video Mode Toggle */}
      {subjectId === "neb_xii_biology" && chapterNumber === 6 && (
        <div style={{ display: "flex", background: "#f1f5f9", padding: "4px", borderRadius: "12px", gap: "4px" }}>
          <button
            onClick={() => setVideoMode("long")}
            style={{
              padding: "6px 14px",
              borderRadius: "8px",
              border: "none",
              background: videoMode === "long" ? "#ffffff" : "transparent",
              color: videoMode === "long" ? "#0f172a" : "#64748b",
              fontWeight: videoMode === "long" ? "700" : "600",
              boxShadow: videoMode === "long" ? "0 2px 6px rgba(0,0,0,0.05)" : "none",
              cursor: "pointer",
              fontSize: "13.5px",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <span style={{ fontSize: "16px" }}>💻</span> Videos
          </button>
          <button
            onClick={() => setVideoMode("short")}
            style={{
              padding: "6px 14px",
              borderRadius: "8px",
              border: "none",
              background: videoMode === "short" ? "#ffffff" : "transparent",
              color: videoMode === "short" ? "#0f172a" : "#64748b",
              fontWeight: videoMode === "short" ? "700" : "600",
              boxShadow: videoMode === "short" ? "0 2px 6px rgba(0,0,0,0.05)" : "none",
              cursor: "pointer",
              fontSize: "13.5px",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <span style={{ fontSize: "16px" }}>📱</span> Shorts
          </button>
        </div>
      )}
    </div>
  );

  if (videos.length > 0) {
    return (
      <div className="videos-layout-container" style={{ display: "flex", flexDirection: "column", width: "100%", margin: "0 auto", height: "100%", overflow: "hidden" }}>
        {/* ── MODE 1: CATALOG PREVIEW LIST (When no video selected) ── */}
        {!selectedVideoId ? (
          <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            {unitTabsNode}
            <div
              style={{
                display: videoMode === "short" ? "grid" : "flex",
                gridTemplateColumns: videoMode === "short" ? "repeat(auto-fill, minmax(200px, 1fr))" : "none",
                flexDirection: videoMode === "short" ? "row" : "column",
                gap: "20px",
                flex: 1,
                minHeight: 0,
                overflowY: "auto",
                padding: "10px 14px 100px 16px",
                boxSizing: "border-box",
              }}
            >
              {videos.map((vid, vIdx) => {
                // Videos open in sequence only when the chapter is segmented;
                // legacy chapters keep every part clickable.
                const locked = isSegmented && isVideoPlayableAt ? !isVideoPlayableAt(vIdx + 1) : false;
                const watched = isSegmented && isVideoWatchedAt ? isVideoWatchedAt(vIdx + 1) : false;
                const watchPct = Math.min(100, Math.round(videoProgresses[vid.ytId] ?? 0));
                return (
                  <div
                    key={vid.ytId}
                    style={{
                      display: "flex",
                      alignItems: videoMode === "short" ? "stretch" : "center",
                      gap: "16px",
                      width: "100%",
                      height: videoMode === "short" ? "100%" : "auto",
                      boxSizing: "border-box",
                      position: videoMode === "short" ? "relative" : "static",
                    }}
                  >
                    {/* The Video Card Box */}
                    <div
                      onClick={() => {
                        if (locked) return;
                        setActiveVideo(vIdx);
                        setSelectedVideoId(vid.ytId);
                        if (onSelectVideoIndex) {
                          onSelectVideoIndex(vIdx + 1);
                        }
                      }}
                      title={locked ? "Watch the previous video to unlock this one" : vid.title}
                      className="video-preview-card"
                      style={{
                        display: "flex",
                        alignItems: videoMode === "short" ? "flex-start" : "center",
                        flexDirection: videoMode === "short" ? "column" : "row",
                        flex: 1,
                        minHeight: videoMode === "short" ? "100%" : "185px",
                        background: "#ffffff",
                        borderRadius: "22px",
                        border: `1.5px solid ${watched ? "#86efac" : locked ? "#e2e8f0" : "#bfdbfe"}`,
                        boxShadow: locked ? "none" : "0 8px 24px rgba(59, 130, 246, 0.08)",
                        position: "relative",
                        overflow: "hidden",
                        cursor: locked ? "not-allowed" : "pointer",
                        opacity: locked ? 0.5 : 1,
                        padding: videoMode === "short" ? "10px" : "10px 18px 10px 10px",
                        gap: videoMode === "short" ? "12px" : "20px",
                        boxSizing: "border-box",
                        transition: "transform 0.2s ease, boxShadow 0.2s ease, borderColor 0.2s ease",
                      }}
                    >
                      {/* Status badge: locked, or watch progress once started */}
                      {(locked || watched || watchPct > 0) && (
                        <div
                          style={{
                            position: "absolute",
                            top: "12px",
                            right: "14px",
                            zIndex: 6,
                            padding: "3px 10px",
                            borderRadius: "999px",
                            fontSize: "11px",
                            fontWeight: 800,
                            background: locked ? "#f1f5f9" : watched ? "#dcfce7" : "#eff6ff",
                            color: locked ? "#64748b" : watched ? "#15803d" : "#1d4ed8",
                            border: `1px solid ${locked ? "#cbd5e1" : watched ? "#86efac" : "#bfdbfe"}`,
                          }}
                        >
                          {locked ? "🔒 Locked" : watched ? "✓ Watched" : `${watchPct}% watched`}
                        </div>
                      )}

                      {/* Left Side: Curved Standalone Video Preview Stage with YouTube Thumbnail */}
                      <div style={{ width: videoMode === "short" ? "100%" : "46%", flexShrink: 0 }}>
                        <div
                          style={{
                            width: "100%",
                            height: videoMode === "short" ? "200px" : "auto",
                            aspectRatio: videoMode === "short" ? "auto" : "1.43 / 1",
                            position: "relative",
                            background: "#0f172a",
                            borderRadius: "18px",
                            border: "1.5px solid #93c5fd",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            overflow: "hidden",
                          }}
                        >
                          {/* YouTube Video Thumbnail Image */}
                          {vid.ytId && (
                            <img
                              src={videoMode === "short" ? `https://img.youtube.com/vi/${vid.ytId}/hqdefault.jpg` : `https://img.youtube.com/vi/${vid.ytId}/hqdefault.jpg`}
                              alt={vid.title}
                              onError={(e) => {
                                (e.target as HTMLElement).setAttribute(
                                  'src',
                                  `https://i.ytimg.com/vi/${vid.ytId}/mqdefault.jpg`
                                );
                              }}
                              style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                opacity: locked ? 0.6 : 0.9,
                              }}
                            />
                          )}

                          {/* Timestamp Badge */}
                          <div
                            style={{
                              position: "absolute",
                              bottom: "8px",
                              right: "8px",
                              background: "rgba(0, 0, 0, 0.75)",
                              color: "#ffffff",
                              padding: "2px 6px",
                              borderRadius: "4px",
                              fontSize: "11px",
                              fontWeight: 600,
                              zIndex: 10,
                              letterSpacing: "0.5px"
                            }}
                          >
                            {vid.duration || (videoMode === "short" ? `0:${String(30 + (vIdx % 30)).padStart(2, '0')}` : `${10 + (vIdx % 5)}:${String(15 + (vIdx % 45)).padStart(2, '0')}`)}
                          </div>

                          {/* Top-Left University Logo Overlay */}
                          <div
                            style={{
                              position: "absolute",
                              top: "8px",
                              left: "8px",
                              zIndex: 10,
                              pointerEvents: "none",
                            }}
                          >
                            <img
                              src={sessionStorage.getItem('sv_logo') || '/brand-logo.png'}
                              alt="University Logo"
                              style={{
                                width: "32px",
                                height: "32px",
                                objectFit: "contain",
                                filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))",
                              }}
                            />
                          </div>

                          {/* Subtle Overlay to contrast Play Button and Logo */}
                          <div
                            style={{
                              position: "absolute",
                              inset: 0,
                              background: "rgba(15, 23, 42, 0.25)",
                              zIndex: 2,
                            }}
                          />


                          {/* White Circle Button with Blue Play Triangle */}
                          <div
                            style={{
                              width: "56px",
                              height: "56px",
                              borderRadius: "50%",
                              background: "#ffffff",
                              boxShadow: "0 10px 28px rgba(0, 0, 0, 0.3)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              zIndex: 5,
                              transition: "transform 0.2s ease",
                            }}
                          >
                            <div
                              style={{
                                width: 0,
                                height: 0,
                                borderTop: "11px solid transparent",
                                borderBottom: "11px solid transparent",
                                borderLeft: "18px solid #2563eb",
                                marginLeft: "4px",
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Right Side: Topics List covered in that video */}
                      <div
                        style={{
                          flex: 1,
                          padding: "8px 0",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "center",
                          gap: "10px",
                          background: "#ffffff",
                        }}
                      >
                        {/* Video title (registry-backed chapters carry a real one) */}
                        {isSegmented && (
                          <div
                            style={{
                              fontSize: "15px",
                              fontWeight: 800,
                              color: "#0f172a",
                              lineHeight: 1.25,
                            }}
                          >
                            {vid.title}
                          </div>
                        )}

                        {/* Topics Header */}
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span
                            style={{
                              fontSize: isSegmented ? "13px" : "15px",
                              fontWeight: "800",
                              color: isSegmented ? "#475569" : "#0f172a",
                            }}
                          >
                            {vid.title}
                          </span>
                        </div>

                        {/* Bullet list of topics covered in that video */}
                        {videoMode !== "short" && (
                          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            {(vid.topics || [
                              "E-Commerce and Digital Marketing strategies",
                              "Customer Relationship Management (CRM) tools and best practices",
                              "Social media marketing and influencer campaigns",
                              "Green marketing and sustainable business practices"
                            ]).slice(0, 6).map((topicText, tIdx) => (
                              <div key={tIdx} style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                                <div
                                  style={{
                                    width: "16px",
                                    height: "16px",
                                    borderRadius: "50%",
                                    background: "#eff6ff",
                                    border: "1.5px solid #3b82f6",
                                    color: "#2563eb",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "9.5px",
                                    fontWeight: "800",
                                    marginTop: "2px",
                                    flexShrink: 0,
                                  }}
                                >
                                  ✓
                                </div>
                                <span style={{ fontSize: "12.5px", fontWeight: "600", color: "#334155", lineHeight: "1.35" }}>
                                  {topicText}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Resume bar — only once there is something to resume */}
                        {watchPct > 0 && !watched && (
                          <div
                            style={{
                              height: "4px",
                              borderRadius: "999px",
                              background: "#e2e8f0",
                              overflow: "hidden",
                              marginTop: "2px",
                            }}
                          >
                            <div
                              style={{
                                width: `${watchPct}%`,
                                height: "100%",
                                background: "#3b82f6",
                                borderRadius: "999px",
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* ── MODE 2: CINEMA FULLSCREEN PLAYER (When a video card is clicked) ── */
          <div
            className="video-cinema-overlay"
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseMove}
            onMouseLeave={() => {
              if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
              setIsHovered(false);
            }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 1000,
              background: "#000",
              cursor: isHovered ? "default" : "none",
            }}
          >
            {/* YouTube Iframe Player — fills entire screen */}
            <div
              id={`yt-player-${currentVideo.ytId}`}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                border: 0,
              }}
            />

            {/* Gradient scrim — only visible on hover so controls are readable */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: isHovered
                  ? "linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, transparent 18%, transparent 72%, rgba(0,0,0,0.75) 100%)"
                  : "transparent",
                transition: "background 0.35s ease",
                pointerEvents: "none",
                zIndex: 2,
              }}
            />

            {/* Top bar — logo + exit button (hover only) */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "18px 24px",
                zIndex: 10,
                opacity: isHovered ? 1 : 0,
                transform: isHovered ? "translateY(0)" : "translateY(-12px)",
                transition: "opacity 0.3s ease, transform 0.3s ease",
                pointerEvents: isHovered ? "auto" : "none",
              }}
            >
              {/* Logo */}
              <img
                src={sessionStorage.getItem('sv_logo') || '/brand-logo.png'}
                alt="University Logo"
                style={{
                  width: "52px",
                  height: "52px",
                  objectFit: "contain",
                  filter: "drop-shadow(0 2px 12px rgba(0,0,0,0.6))",
                }}
              />

              {/* Video title */}
              {currentVideo && (
                <div style={{
                  flex: 1,
                  marginLeft: "16px",
                  color: "#fff",
                  fontSize: "15px",
                  fontWeight: "700",
                  textShadow: "0 1px 6px rgba(0,0,0,0.7)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}>
                  {isSegmented ? `Video ${currentVideoIndex} of ${videos.length} — ` : ""}{currentVideo.title}
                </div>
              )}

              {/* Exit cinema button */}
              <button
                onClick={() => {
                  // Also exit native fullscreen if active
                  if (document.fullscreenElement) {
                    document.exitFullscreen().catch(() => {});
                  }
                  setSelectedVideoId(null);
                }}
                title="Exit cinema view"
                aria-label="Exit cinema view"
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "50%",
                  border: "1.5px solid rgba(255,255,255,0.35)",
                  background: "rgba(0,0,0,0.55)",
                  backdropFilter: "blur(8px)",
                  color: "#fff",
                  fontSize: "22px",
                  lineHeight: 1,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  transition: "background 0.2s ease, transform 0.2s ease",
                  marginLeft: "12px",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.85)";
                  (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.08)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,0,0,0.55)";
                  (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
                }}
              >
                ✕
              </button>

              {/* Native browser fullscreen — hides URL bar, tabs, all chrome */}
              <button
                onClick={() => {
                  if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen().catch(() => {});
                  } else {
                    document.exitFullscreen().catch(() => {});
                  }
                }}
                title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen — hides browser chrome"}
                aria-label="Toggle fullscreen"
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "50%",
                  border: `1.5px solid ${isFullscreen ? "rgba(59,130,246,0.8)" : "rgba(255,255,255,0.35)"}`,
                  background: isFullscreen ? "rgba(59,130,246,0.55)" : "rgba(0,0,0,0.55)",
                  backdropFilter: "blur(8px)",
                  color: "#fff",
                  fontSize: "18px",
                  lineHeight: 1,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  transition: "background 0.2s ease, transform 0.2s ease, border-color 0.2s ease",
                  marginLeft: "8px",
                  boxShadow: isFullscreen ? "0 0 12px rgba(59,130,246,0.6)" : "none",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = isFullscreen ? "rgba(239,68,68,0.75)" : "rgba(59,130,246,0.75)";
                  (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.08)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = isFullscreen ? "rgba(59,130,246,0.55)" : "rgba(0,0,0,0.55)";
                  (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
                }}
              >
                {isFullscreen ? (
                  /* Compress: arrows pointing INWARD (heads facing each other) */
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="4 14 10 14 10 20"/>
                    <polyline points="20 10 14 10 14 4"/>
                    <line x1="10" y1="14" x2="3" y2="21"/>
                    <line x1="21" y1="3" x2="14" y2="10"/>
                  </svg>
                ) : (
                  /* Expand: arrows pointing OUTWARD */
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 3 21 3 21 9"/>
                    <polyline points="9 21 3 21 3 15"/>
                    <line x1="21" y1="3" x2="14" y2="10"/>
                    <line x1="3" y1="21" x2="10" y2="14"/>
                  </svg>
                )}
              </button>
            </div>

            {/* Center Play overlay (shown when paused, always visible) */}
            {!isPlaying && (
              <button
                onClick={handlePlayPause}
                aria-label="Play Video"
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  width: "90px",
                  height: "90px",
                  borderRadius: "50%",
                  border: "none",
                  background: "rgba(255,255,255,0.92)",
                  boxShadow: "0 8px 40px rgba(0,0,0,0.35)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 8,
                  transition: "transform 0.2s ease, background 0.2s ease",
                }}
              >
                <div
                  style={{
                    width: 0,
                    height: 0,
                    borderTop: "18px solid transparent",
                    borderBottom: "18px solid transparent",
                    borderLeft: "30px solid #2563eb",
                    marginLeft: "8px",
                  }}
                />
              </button>
            )}

            {/* Bottom control bar — slides up on hover */}
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 10,
                opacity: isHovered ? 1 : 0,
                transform: isHovered ? "translateY(0)" : "translateY(16px)",
                transition: "opacity 0.3s ease, transform 0.3s ease",
                pointerEvents: isHovered ? "auto" : "none",
                background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.5) 70%, transparent 100%)",
                paddingTop: "48px",
              }}
            >
              {/* Seek bar */}
              <div style={{ position: "relative", width: "100%", height: "4px", background: "rgba(255,255,255,0.25)", marginBottom: "12px" }}>
                <div
                  style={{
                    height: "100%",
                    width: `${progress || 0}%`,
                    background: "#3b82f6",
                    position: "relative",
                    transition: "width 0.25s linear",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      right: "-6px",
                      top: "-4px",
                      width: "12px",
                      height: "12px",
                      borderRadius: "50%",
                      background: "#60a5fa",
                      boxShadow: "0 0 8px rgba(59,130,246,0.9)",
                    }}
                  />
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={progress || 0}
                  onChange={handleSeek}
                  style={{
                    position: "absolute",
                    top: "-8px",
                    left: 0,
                    width: "100%",
                    height: "20px",
                    opacity: 0,
                    cursor: "pointer",
                    margin: 0,
                  }}
                />
              </div>

              {/* Controls row */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0 28px 20px",
                }}
              >
                {/* Left controls */}
                <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
                  {/* Play/Pause */}
                  <button
                    onClick={handlePlayPause}
                    title={isPlaying ? "Pause" : "Play"}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#fff",
                      fontSize: "22px",
                      cursor: "pointer",
                      padding: 0,
                      display: "flex",
                      alignItems: "center",
                      lineHeight: 1,
                    }}
                  >
                    {isPlaying ? (
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                    ) : (
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><polygon points="5,3 19,12 5,21"/></svg>
                    )}
                  </button>

                  {/* Rewind 10s */}
                  <button
                    onClick={() => {
                      if (playerRef.current) {
                        const cur = playerRef.current.getCurrentTime();
                        playerRef.current.seekTo(Math.max(0, cur - 10), true);
                      }
                    }}
                    title="Rewind 10s"
                    style={{ background: "none", border: "none", color: "#fff", fontSize: "18px", fontWeight: "800", cursor: "pointer", padding: 0 }}
                  >
                    «
                  </button>

                  {/* Forward 10s */}
                  <button
                    onClick={() => {
                      if (playerRef.current) {
                        const cur = playerRef.current.getCurrentTime();
                        const dur = playerRef.current.getDuration();
                        playerRef.current.seekTo(Math.min(dur, cur + 10), true);
                      }
                    }}
                    title="Forward 10s"
                    style={{ background: "none", border: "none", color: "#fff", fontSize: "18px", fontWeight: "800", cursor: "pointer", padding: 0 }}
                  >
                    »
                  </button>

                  {/* Volume */}
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <button
                      onClick={toggleMute}
                      style={{ background: "none", border: "none", color: "#fff", fontSize: "16px", cursor: "pointer", padding: 0, display: "flex", alignItems: "center" }}
                    >
                      {isMuted || volume === 0 ? "🔇" : "🔊"}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={isMuted ? 0 : volume}
                      onChange={handleVolumeChange}
                      style={{ width: "80px", height: "3px", accentColor: "#3b82f6", cursor: "pointer" }}
                    />
                  </div>

                  {/* Time */}
                  <div style={{ color: "rgba(255,255,255,0.8)", fontSize: "13px", fontWeight: "600", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </div>
                </div>

                {/* Right controls */}
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  {/* Speed */}
                  <select
                    value={playbackRate}
                    onChange={handleSpeedChange}
                    title="Playback Speed"
                    style={{
                      background: "rgba(255,255,255,0.12)",
                      backdropFilter: "blur(8px)",
                      color: "#fff",
                      border: "1px solid rgba(255,255,255,0.25)",
                      borderRadius: "6px",
                      padding: "4px 8px",
                      fontSize: "13px",
                      fontWeight: "700",
                      cursor: "pointer",
                      outline: "none",
                    }}
                  >
                    <option value="0.5" style={{ color: "#000" }}>0.5x</option>
                    <option value="1" style={{ color: "#000" }}>1.0x</option>
                    <option value="1.5" style={{ color: "#000" }}>1.5x</option>
                    <option value="2" style={{ color: "#000" }}>2.0x</option>
                  </select>

                  {/* Exit cinema (bottom-right duplicate for easy access) */}
                  <button
                    onClick={() => setSelectedVideoId(null)}
                    title="Exit cinema view"
                    aria-label="Exit cinema view (bottom)"
                    style={{
                      background: "rgba(255,255,255,0.12)",
                      backdropFilter: "blur(8px)",
                      border: "1px solid rgba(255,255,255,0.25)",
                      borderRadius: "8px",
                      color: "#fff",
                      fontSize: "12px",
                      fontWeight: "700",
                      cursor: "pointer",
                      padding: "5px 12px",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      letterSpacing: "0.3px",
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
                    </svg>
                    Back to list
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // For english/science: show youtube_links.md content as markdown guidance
  if (youtubeLinksContent && youtubeLinksContent !== "Content not available.") {
    return (
      <div className="videos-view" style={{ display: "flex", flexDirection: "column", maxWidth: "960px", margin: "0 auto", width: "100%" }}>
        {unitTabsNode}
        <div
          className="card"
          style={{
            padding: "4px 8px",
            marginBottom: "16px",
            background: "var(--primary-light)",
            borderRadius: "10px",
            borderLeft: "4px solid var(--primary)",
          }}
        >
          <p
            style={{
              margin: "8px 0",
              fontSize: "0.9rem",
              color: "var(--primary)",
              fontWeight: 600,
            }}
          >
            🎥 No embedded videos yet — use these curated search queries on
            YouTube to find the best lessons for this chapter.
          </p>
        </div>
        <div className="markdown-container">
          <MarkdownView content={youtubeLinksContent} />
        </div>
      </div>
    );
  }

  // Fallback: nothing available
  return (
    <div className="videos-view" style={{ display: "flex", flexDirection: "column", maxWidth: "960px", margin: "0 auto", width: "100%" }}>
      {unitTabsNode}
      <div
        className="card"
        style={{ padding: "40px", textAlign: "center", marginTop: "20px" }}
      >
        <span style={{ fontSize: "3rem", opacity: 0.5 }}>🎥</span>
        <p style={{ marginTop: "1rem" }}>
          No video content is currently available for this chapter.
        </p>
      </div>
    </div>
  );
}
