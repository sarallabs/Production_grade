import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import MarkdownView from "@/components/MarkdownView";
import {
  getResourceContent,
  type Chapter,
  type ChapterVideo,
  type DifficultyLevel,
} from "@/data/contentRepository";

/**
 * Singleton promise that resolves once the YouTube IFrame API is ready.
 * Injecting the script and polling with setInterval inside a React effect is
 * unreliable: React's cleanup function fires between renders and kills the
 * interval before it ever gets a chance to call initPlayer. A cached promise
 * solves this — once resolved it stays resolved, and any `.then()` attached
 * after resolution fires synchronously on the next microtask tick.
 */
let _ytReadyPromise: Promise<void> | null = null;

function ensureYTReady(): Promise<void> {
  // Already resolved (API was loaded in a previous session on this page)
  if ((window as any).YT?.Player) {
    _ytReadyPromise = _ytReadyPromise ?? Promise.resolve();
    return _ytReadyPromise;
  }
  if (_ytReadyPromise) return _ytReadyPromise;

  _ytReadyPromise = new Promise<void>((resolve) => {
    // Chain onto any existing ready handler so we don't clobber it.
    const prev = (window as any).onYouTubeIframeAPIReady;
    (window as any).onYouTubeIframeAPIReady = () => {
      if (typeof prev === "function") prev();
      resolve();
    };
    // Only inject the script tag once.
    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);
    }
  });

  return _ytReadyPromise;
}

/**
 * Share of a video that must be played for it to count as watched. Short of
 * 100% so credits, outros, or a stream that stalls a few seconds from the end
 * don't leave a learner unable to unlock the tools they've earned.
 */
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
  /** Registry-backed videos for a segmented chapter; empty when unsegmented. */
  chapterVideos?: ChapterVideo[];
  /** 1-based index of the video being studied. */
  activeVideoIndex?: number;
  /**
   * Called when a video passes the watched threshold (`advance: false`, unlock
   * only) and again when it actually finishes (`advance: true`, hand off).
   */
  onVideoWatched?: (videoIndex: number, advance: boolean) => void;
  isVideoWatchedAt?: (videoIndex: number) => boolean;
  isVideoPlayableAt?: (videoIndex: number) => boolean;
  onSelectVideoIndex?: (videoIndex: number) => void;
}

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
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [activeVideo, setActiveVideo] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const [videoProgresses, setVideoProgresses] = useState<Record<string, number>>({});

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

  // Transcript
  const [transcriptContent, setTranscriptContent] = useState<string | null>(null);
  const [isTranscriptLoading, setIsTranscriptLoading] = useState(false);

  const playerRef = useRef<any>(null);
  const hasStartedPlayingRef = useRef<boolean>(false);

  // 1. Registry-backed list when the chapter is segmented, otherwise the legacy
  // hard-coded / youtube_links.md-scraped list.
  const videos = useMemo(() => {
    let list: { title: string; ytId: string; topics?: string[] }[] = [];

    if (chapterVideos && chapterVideos.length > 0) {
      list = chapterVideos.map((v) => ({
        title: v.title,
        ytId: v.ytId,
        topics: v.topics,
      }));
    } else {
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
      } else if (subjectId === "ento_131" && chapterNumber === 1) {
        list = [
          {
            title: "Insects Digestive System",
            ytId: "K6TcM8Q-V3w",
            topics: [
              "Anatomy of the Insect Digestive System",
              "Functions of Foregut, Midgut, and Hindgut",
              "Process of Digestion and Absorption in Insects",
              "Digestive Enzymes and Dietary Adaptations"
            ]
          }
        ];
      } else if (subjectId === "management" && chapterNumber === 1) {
        list = [
          {
            title: "Importance and Scope of Marketing",
            ytId: "lI-PTcybm-Q",
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
            ytId: "BrQlpbkP60U",
            topics: [
              "Global Marketing Definitions & Core Analytical Concepts",
              "Global Strategy Dilemmas & Market Expansion Frameworks",
              "Multinational Case Studies & Foundational Competitive Benefits",
              "Critical International Challenges & Cultural Adaptations"
            ]
          }
        ];
      }
    }

    if (youtubeLinksContent) {
      const ytRegex = /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/g;
      let match;
      let idx = 0;
      while ((match = ytRegex.exec(youtubeLinksContent)) !== null) {
        if (idx < list.length) {
          // Override the ytId from the markdown content
          list[idx].ytId = match[1];
        } else {
          // Add as a new video if it exceeds existing metadata
          list.push({
            title: `Video ${idx + 1}`,
            ytId: match[1],
            topics: [
              "Key conceptual overview & core principles",
              "Practical examples and real-world applications",
              "Critical analysis and problem solving",
              "Summary of key takeaways and summary points"
            ]
          });
        }
        idx++;
      }
    }

    return list;
  }, [subjectId, chapterNumber, youtubeLinksContent, chapterName, chapterVideos]);

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

    let cancelled = false;
    let progressInterval: any;

    const initPlayer = () => {
      // Guard: effect was cleaned up (component unmounted or video changed) before
      // the API became ready, or the element is already an iframe (double-init).
      if (cancelled) return;
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
            } catch (e) {}

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
            } catch (e) {}
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

    // ensureYTReady() returns a cached, singleton promise:
    //   • If the API is already loaded it resolves immediately (next microtask).
    //   • If not, it injects the <script> tag once and resolves when YouTube
    //     fires onYouTubeIframeAPIReady — no polling interval that React
    //     effect cleanup could kill between renders.
    ensureYTReady().then(initPlayer);

    return () => {
      // Signal any pending .then(initPlayer) to abort.
      cancelled = true;
      if (progressInterval) clearInterval(progressInterval);
      if (playerRef.current && typeof playerRef.current.destroy === "function") {
        playerRef.current.destroy();
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
        justifyContent: "space-between",
        borderBottom: "2px solid #e2e8f0",
        paddingBottom: "8px",
        marginBottom: "12px",
        flexShrink: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        {(subjectChapters && subjectChapters.length > 0 ? subjectChapters : [{ number: 1, name: chapterName }]).map((ch) => {
          const uNum = ch.number;
          const isActive = Number(chapterNumber || 1) === uNum;

          return (
            <button
              key={uNum}
              onClick={() => {
                setSelectedVideoId(null);
                if (onSelectChapter) onSelectChapter(uNum);
              }}
              style={{
                padding: "6px 18px",
                borderRadius: "10px",
                border: isActive ? "1.5px solid #93c5fd" : "1px solid transparent",
                background: isActive ? "#eff6ff" : "transparent",
                color: isActive ? "#2563eb" : "#475569",
                fontWeight: isActive ? "800" : "600",
                fontSize: "14.5px",
                cursor: "pointer",
                transition: "all 0.2s ease",
                borderBottom: isActive ? "3px solid #3b82f6" : "none",
              }}
            >
              Unit-{uNum}
            </button>
          );
        })}
      </div>
    </div>
  );

  if (videos.length > 0) {
    return (
      <div className="videos-layout-container" style={{ display: "flex", flexDirection: "column", width: "100%", maxWidth: selectedVideoId ? "100%" : "960px", margin: "0 auto", height: "100%", overflow: "hidden" }}>
        {/* Top Horizontal Unit Tabs Bar (Only when in video catalog preview list) */}
        {!selectedVideoId && unitTabsNode}
        {/* ── MODE 1: CATALOG PREVIEW LIST (When no video selected) ── */}
        {!selectedVideoId ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
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
                  alignItems: "center",
                  gap: "16px",
                  width: "100%",
                  boxSizing: "border-box",
                }}
              >
                {/* Video Number Badge (OUTSIDE the entire card box) */}
                <div
                  style={{
                    width: "30px",
                    height: "30px",
                    borderRadius: "50%",
                    background: watched ? "#dcfce7" : locked ? "#f1f5f9" : "#eff6ff",
                    border: `2px solid ${watched ? "#22c55e" : locked ? "#cbd5e1" : "#3b82f6"}`,
                    color: watched ? "#15803d" : locked ? "#94a3b8" : "#1d4ed8",
                    fontWeight: "800",
                    fontSize: "12.5px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: locked ? "none" : "0 2px 8px rgba(59, 130, 246, 0.2)",
                    flexShrink: 0,
                  }}
                >
                  {watched ? "✓" : String(vIdx + 1).padStart(2, "0")}
                </div>

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
                    alignItems: "center",
                    flex: 1,
                    minHeight: "185px",
                    background: "#ffffff",
                    borderRadius: "22px",
                    border: `1.5px solid ${watched ? "#86efac" : locked ? "#e2e8f0" : "#bfdbfe"}`,
                    boxShadow: locked ? "none" : "0 8px 24px rgba(59, 130, 246, 0.08)",
                    position: "relative",
                    overflow: "hidden",
                    cursor: locked ? "not-allowed" : "pointer",
                    opacity: locked ? 0.5 : 1,
                    padding: "10px 18px 10px 10px",
                    gap: "20px",
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
                  <div
                    style={{
                      width: "46%",
                      height: "100%",
                      minHeight: "165px",
                      position: "relative",
                      background: "#0f172a",
                      borderRadius: "18px",
                      border: "1.5px solid #93c5fd",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      overflow: "hidden",
                    }}
                  >
                    {/* YouTube Video Thumbnail Image */}
                    {vid.ytId && (
                      <img
                        src={`https://img.youtube.com/vi/${vid.ytId}/hqdefault.jpg`}
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
                        Topics
                      </span>
                    </div>

                    {/* Bullet list of topics covered in that video */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {(vid.topics || [
                        "E-Commerce and Digital Marketing strategies",
                        "Customer Relationship Management (CRM) tools and best practices",
                        "Social media marketing and influencer campaigns",
                        "Green marketing and sustainable business practices"
                      ]).slice(0, 4).map((topicText, tIdx) => (
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
        ) : (
          /* ── MODE 2: ACTIVE FULL VIDEO PLAYER (When a video card is clicked) ── */
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "10px", height: "100%" }}>

            {/* Header: Back button + Unit & Chapter Title */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <button
                onClick={() => setSelectedVideoId(null)}
                title="Back to Unit Videos"
                aria-label="Back to Unit Videos"
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  border: "1.5px solid #3b82f6",
                  background: "#eff6ff",
                  color: "#2563eb",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 6px rgba(59, 130, 246, 0.12)",
                  flexShrink: 0,
                  transition: "all 0.2s ease",
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5" />
                  <path d="M12 19l-7-7 7-7" />
                </svg>
              </button>
              <div style={{ fontSize: "17px", fontWeight: "700", minWidth: 0 }}>
                <span style={{ color: "#3b82f6", fontWeight: "800" }}>{chapterName}</span>
                {/* Which video, once a chapter actually has more than one */}
                {isSegmented && currentVideo && (
                  <span style={{ color: "#64748b", fontWeight: 600, fontSize: "15px" }}>
                    {"  •  "}
                    Video {currentVideoIndex} of {videos.length} — {currentVideo.title}
                  </span>
                )}
              </div>
            </div>

            {/* Video Player Card Stage */}
            <div
              className="video-player-container shadow-md"
              style={{
                position: "relative",
                width: "100%",
                flex: 1,
                minHeight: 0,
                overflow: "hidden",
                borderRadius: "8px",
                background: "#ffffff",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
                border: "1px solid #e2e8f0",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* YouTube Iframe Player API */}
              <div
                id={`yt-player-${currentVideo.ytId}`}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "calc(100% - 48px)",
                  border: 0,
                }}
              />

              {/* Top-Left Logo */}
              <div
                style={{
                  position: "absolute",
                  top: "14px",
                  left: "18px",
                  zIndex: 6,
                  pointerEvents: "none",
                }}
              >
                <img
                  src={sessionStorage.getItem('sv_logo') || '/brand-logo.png'}
                  alt="University Logo"
                  style={{
                    width: "56px",
                    height: "56px",
                    objectFit: "contain",
                    filter: "drop-shadow(0 2px 8px rgba(0, 0, 0, 0.4))",
                  }}
                />
              </div>

              {/* Red Center Play Overlay (Shown when paused) */}
              {!isPlaying && (
                <button
                  onClick={handlePlayPause}
                  aria-label="Play Video"
                  style={{
                    position: "absolute",
                    top: "calc(50% - 24px)",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: "80px",
                    height: "80px",
                    borderRadius: "50%",
                    border: "3px solid #e0f2fe",
                    background: "#ffffff",
                    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.1)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 8,
                  }}
                >
                  <div
                    style={{
                      width: 0,
                      height: 0,
                      borderTop: "16px solid transparent",
                      borderBottom: "16px solid transparent",
                      borderLeft: "26px solid #2563eb",
                      marginLeft: "6px",
                    }}
                  />
                </button>
              )}

              {/* Dark Control Bar */}
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: "48px",
                  background: "#27272a",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  zIndex: 10,
                }}
              >
                {/* Blue Scrub Line */}
                <div style={{ position: "relative", width: "100%", height: "5px", background: "#e5e7eb" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${progress || 0}%`,
                      background: "#3b82f6",
                      position: "relative",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        right: "-6px",
                        top: "-3.5px",
                        width: "12px",
                        height: "12px",
                        borderRadius: "50%",
                        background: "#60a5fa",
                        boxShadow: "0 0 6px rgba(59, 130, 246, 0.8)",
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
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      opacity: 0,
                      cursor: "pointer",
                      margin: 0,
                    }}
                  />
                </div>

                {/* Controls Row */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0 20px",
                    height: "43px",
                  }}
                >
                  {/* Left Controls */}
                  <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                    <button
                      onClick={handlePlayPause}
                      title={isPlaying ? "Pause" : "Play"}
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        border: "1.5px solid #3b82f6",
                        background: "none",
                        color: "#60a5fa",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "13px",
                        fontWeight: "800",
                        cursor: "pointer",
                      }}
                    >
                      {isPlaying ? "❚❚" : "▶"}
                    </button>

                    <button
                      onClick={() => {
                        if (playerRef.current) {
                          const cur = playerRef.current.getCurrentTime();
                          playerRef.current.seekTo(Math.max(0, cur - 10), true);
                        }
                      }}
                      title="Rewind 10s"
                      style={{
                        background: "none",
                        border: "none",
                        color: "#60a5fa",
                        fontSize: "16px",
                        fontWeight: "800",
                        cursor: "pointer",
                        padding: 0,
                      }}
                    >
                      «
                    </button>

                    <button
                      onClick={() => {
                        if (playerRef.current) {
                          const cur = playerRef.current.getCurrentTime();
                          const dur = playerRef.current.getDuration();
                          playerRef.current.seekTo(Math.min(dur, cur + 10), true);
                        }
                      }}
                      title="Forward 10s"
                      style={{
                        background: "none",
                        border: "none",
                        color: "#60a5fa",
                        fontSize: "16px",
                        fontWeight: "800",
                        cursor: "pointer",
                        padding: 0,
                      }}
                    >
                      »
                    </button>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        background: "#333333",
                        padding: "4px 12px",
                        borderRadius: "14px",
                        border: "1px solid #404040",
                      }}
                    >
                      <button
                        onClick={toggleMute}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#60a5fa",
                          fontSize: "13px",
                          cursor: "pointer",
                          padding: 0,
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        {isMuted || volume === 0 ? "🔇" : "🔊"}
                      </button>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={isMuted ? 0 : volume}
                        onChange={handleVolumeChange}
                        style={{
                          width: "70px",
                          height: "3px",
                          accentColor: "#3b82f6",
                          cursor: "pointer",
                        }}
                      />
                    </div>
                  </div>

                  {/* Time Counter */}
                  <div
                    style={{
                      background: "#363636",
                      border: "1px solid #404040",
                      padding: "4px 16px",
                      borderRadius: "8px",
                      color: "#94a3b8",
                      fontSize: "12.5px",
                      fontWeight: "600",
                      letterSpacing: "0.5px",
                    }}
                  >
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </div>

                  {/* Right Controls */}
                  <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                    {/* Settings Gear (with invisible speed select overlay) */}
                    <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="3"></circle>
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                      </svg>
                      <select
                        value={playbackRate}
                        onChange={handleSpeedChange}
                        title="Playback Speed"
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          height: "100%",
                          opacity: 0,
                          cursor: "pointer",
                        }}
                      >
                        <option value="0.5">0.5x</option>
                        <option value="1">1.0x</option>
                        <option value="1.5">1.5x</option>
                        <option value="2">2.0x</option>
                      </select>
                    </div>

                    <button
                      onClick={() => {
                        const playerEl = document.querySelector(".video-player-container");
                        if (playerEl) {
                          if (document.fullscreenElement) {
                            document.exitFullscreen();
                          } else {
                            playerEl.requestFullscreen();
                          }
                        }
                      }}
                      title="Fullscreen (Expand)"
                      aria-label="Fullscreen (Expand)"
                      style={{
                        background: "none",
                        border: "none",
                        color: "#60a5fa",
                        cursor: "pointer",
                        padding: "4px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: "4px",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                      </svg>
                    </button>
                  </div>
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
