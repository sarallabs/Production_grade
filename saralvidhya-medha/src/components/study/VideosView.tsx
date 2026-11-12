import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { type Chapter, type ChapterVideo, type DifficultyLevel } from "@/data/contentRepository";

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

interface WatchVideoItem {
  title: string;
  ytId: string;
  topics?: string[];
  duration?: string;
  thumbnailUrl?: string;
  introEndTime?: number;
}

const KNOWN_VIDEOS_METADATA: Record<
  string,
  { title: string; topics: string[]; duration?: string; introEndTime?: number }
> = {};

const VIDEO_SKIP_INTRO_SECONDS: Record<string, number> = {
  Zyqv9fMnTrc: 70,
  TWtsTE0sLAQ: 68,
  i1eoBK9RUDk: 0,
  K0lv_ubMinE: 40,
  g37gQCAyKf8: 70,
};

function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore storage errors */
  }
}

function safeRemoveItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore storage errors */
  }
}

let _ytReadyPromise: Promise<void> | null = null;

function ensureYTReady(): Promise<void> {
  if ((window as any).YT?.Player) {
    _ytReadyPromise = _ytReadyPromise ?? Promise.resolve();
    return _ytReadyPromise;
  }
  if (_ytReadyPromise) return _ytReadyPromise;

  _ytReadyPromise = new Promise<void>((resolve) => {
    const prev = (window as any).onYouTubeIframeAPIReady;
    (window as any).onYouTubeIframeAPIReady = () => {
      if (typeof prev === "function") prev();
      resolve();
    };
    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);
    }
  });

  return _ytReadyPromise;
}

export default function VideosView({
  chapterName,
  subjectId,
  chapterNumber,
  youtubeLinksContent,
  onSelectChapter,
  subjectChapters,
  isCompleted = false,
  onComplete,
  chapterVideos,
  activeVideoIndex,
  onVideoWatched,
  isVideoWatchedAt,
  onSelectVideoIndex,
}: VideosViewProps) {
  const [activeVideo, setActiveVideo] = useState(() => {
    const savedIdx = safeGetItem(`sv_last_video_idx_${subjectId}_ch${chapterNumber}`);
    if (savedIdx != null) {
      const idx = parseInt(savedIdx, 10);
      if (!isNaN(idx) && idx >= 0) return idx;
    }
    if (activeVideoIndex && activeVideoIndex >= 1) return activeVideoIndex - 1;
    return 0;
  });

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const playerReadyRef = useRef(false);

  // Custom Player State
  const [watchMode, setWatchMode] = useState<"videos" | "clips">("videos");
  const [activeClipIdx, setActiveClipIdx] = useState(0);
  const [playingClipIdx, setPlayingClipIdx] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStartedVideo, setHasStartedVideo] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [isCcEnabled, setIsCcEnabled] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [seekFeedback, setSeekFeedback] = useState<"-10s" | "+10s" | "skip" | null>(null);

  const activePlaybackSessionYtIdRef = useRef<string | null>(null);

  const recordVideoOpen = useCallback((ytId?: string, vidIndexOneBased?: number) => {
    const keyId = ytId || (vidIndexOneBased ? `video_${vidIndexOneBased}` : "");
    if (!keyId) return;
    const sessionKey = `${vidIndexOneBased || 1}:${keyId}`;
    if (activePlaybackSessionYtIdRef.current === sessionKey) return;
    activePlaybackSessionYtIdRef.current = sessionKey;
    try {
      const raw = safeGetItem("sv_video_open_counts");
      const prev = raw ? (JSON.parse(raw) as Record<string, number>) : {};
      const next = { ...prev, [keyId]: (prev[keyId] || 0) + 1 };
      safeSetItem("sv_video_open_counts", JSON.stringify(next));
    } catch {
      /* ignore storage errors */
    }
  }, []);

  const playerRef = useRef<any>(null);
  const playerContainerRef = useRef<HTMLDivElement | null>(null);
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
    seekFeedbackTimerRef.current = setTimeout(
      () => {
        setSeekFeedback(null);
      },
      type === "skip" ? 1100 : 650,
    );
  };

  // Build video list from chapterVideos / youtubeLinksContent / curated course fallbacks
  const videos = useMemo<WatchVideoItem[]>(() => {
    const ytIdsFromMd: string[] = [];
    if (youtubeLinksContent) {
      const ytRegex = /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/g;
      let match;
      while ((match = ytRegex.exec(youtubeLinksContent)) !== null) {
        if (match[1] && !ytIdsFromMd.includes(match[1])) {
          ytIdsFromMd.push(match[1]);
        }
      }
    }

    const extractYt = (raw?: string): string => {
      if (!raw) return "";
      const trimmed = String(raw).trim();
      if (/^[A-Za-z0-9_-]{11}$/.test(trimmed)) return trimmed;
      const m = trimmed.match(
        /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/,
      );
      return m ? m[1] : trimmed;
    };

    if (chapterVideos && chapterVideos.length > 0) {
      const firstValidYt =
        chapterVideos.map((v) => extractYt(v.ytId)).find(Boolean) || ytIdsFromMd[0] || "";
      return chapterVideos.map((v, idx) => {
        const resolvedYt = extractYt(v.ytId) || ytIdsFromMd[idx] || firstValidYt;
        const candidateThumb = String((v as any).thumbnailUrl || "").trim();
        const isHeroThumb = !candidateThumb || /\/hero\.|\/cover\./i.test(candidateThumb);
        return {
          title: v.title || `Part ${idx + 1}`,
          ytId: resolvedYt,
          topics: v.topics,
          duration: v.duration,
          thumbnailUrl: !isHeroThumb
            ? candidateThumb
            : resolvedYt
              ? `https://i.ytimg.com/vi/${resolvedYt}/hqdefault.jpg`
              : undefined,
          introEndTime:
            typeof (v as any).introEndTime === "number"
              ? (v as any).introEndTime
              : VIDEO_SKIP_INTRO_SECONDS[resolvedYt],
        };
      });
    }

    let list: WatchVideoItem[] = [];
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
            "Covariant Formulation & Lorentz Transformation Properties",
          ],
        },
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
            "Administrative Paradigms and New Public Management",
          ],
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
            "Behavioral Approaches & Informal Organizations",
          ],
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
            "Citizen Charters, Transparency & RTI Act Dynamics",
          ],
        },
      ];
    } else if (subjectId === "ento_131" && chapterNumber === 1) {
      list = [
        {
          title: "Insects Digestive System",
          ytId: "K6TcM8Q-V3w",
          duration: "10:15min",
          topics: [
            "Anatomy of the Insect Digestive System",
            "Functions of Foregut, Midgut, and Hindgut",
            "Process of Digestion and Absorption in Insects",
            "Digestive Enzymes and Dietary Adaptations",
          ],
        },
      ];
    } else if (subjectId === "management") {
      list = [
        {
          title: "Importance and Scope of Marketing",
          ytId: "lI-PTcybm-Q",
          duration: "13:20min",
          topics: [
            "Introduction to Marketing Concepts & Nine Core Elements",
            "The Evolution of Marketing Thought & Modern Management Tasks",
            "Marketing Environment Analysis & Customer Value Equations",
            "Industrial (B2B) Marketing & Demand Volatility Strategies",
            "Integrated Marketing Communications Framework",
          ],
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
            "Service Quality Gaps & Customer Expectation Models",
          ],
        },
        {
          title: "Global Marketing",
          ytId: "BrQlpbkP60U",
          duration: "15:10min",
          topics: [
            "Global Marketing Definitions & Core Analytical Concepts",
            "Global Strategy Dilemmas & Market Expansion Frameworks",
            "Multinational Case Studies & Foundational Competitive Benefits",
            "Critical International Challenges & Cultural Adaptations",
            "Global Supply Chain Alignment & Standardization vs Localization",
          ],
        },
      ];
    } else if (subjectId === "mongodb") {
      list = [
        {
          title: "Part 1: Database Creation & Collection Lifecycle",
          ytId: "Zyqv9fMnTrc",
          introEndTime: 70,
          topics: [
            "use <DATABASE_NAME> Context Switch & Lazy Allocation",
            "db Global Reference & show dbs Storage Threshold",
            "Explicit Collection Provisioning: db.createCollection(name, options)",
            "Capped Collections (capped: true, size, max) & Auto-FIFO Eviction",
            "Implicit Collection Auto-Creation & db.<collection>.drop()",
          ],
        },
        {
          title: "Part 2: Document Ingestion & Cursor Retrieval",
          ytId: "TWtsTE0sLAQ",
          introEndTime: 68,
          topics: [
            "Single-Document Write Mechanics: insertOne() & insert()",
            "Batch Array Ingestion: insertMany() & 12-Byte _id: ObjectId Architecture",
            "Cursor Iteration with find() vs Single-Document findOne()",
            "JSON Formatting with pretty() & Implicit Logical AND Filters",
          ],
        },
        {
          title: "Part 3: Query Filtering, Projection & Cursor Pagination",
          ytId: "i1eoBK9RUDk",
          introEndTime: 0,
          topics: [
            "Comparison Operators ($eq, $ne, $gt, $gte, $lt, $lte, $in, $nin)",
            "Logical Operators ($and, $or, $not, $nor) & Compound Queries",
            "Field Projection Rules: Inclusion (1), Exclusion (0) & _id Exception",
            "Cursor Chaining Pipeline: sort(1|-1), skip(n) & limit(n) Execution Order",
          ],
        },
        {
          title: "Part 4: In-Place Atomic Updates & Three-Tier Deletion",
          ytId: "K0lv_ubMinE",
          introEndTime: 40,
          topics: [
            "updateOne(), updateMany(), replaceOne() & Whole-Document Replacement",
            "Atomic Update Modifiers ($set, $unset, $inc, $push, $pull) & Upsert",
            "Document-Level Removal: deleteOne(), deleteMany() & Index Preservation",
            "Collection Drop (db.collection.drop()) vs Database Drop (db.dropDatabase())",
          ],
        },
        {
          title: "Complete Video: Databases, Collections & CRUD Operations",
          ytId: "g37gQCAyKf8",
          introEndTime: 70,
          topics: [
            "Database Creation & Lazy Instantiation (use, db, show dbs)",
            "Collection Lifecycle: Explicit Provisioning, Capped & Drop",
            "Document Ingestion & 12-Byte ObjectId Architecture",
            "Document Retrieval: find() Cursor vs findOne() & pretty()",
            "Query Filtering, Projection Rules & Cursor Pagination",
            "In-Place Document Updates & Atomic Operators ($set, $inc, $push)",
            "Three-Tier Deletion Hierarchy (Document, Collection & Database)",
          ],
        },
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
              "Practical examples and real-world applications",
              "Synthesis of key takeaways and summary points",
            ],
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
          topics: [],
        },
      ];
    }

    return list;
  }, [subjectId, chapterNumber, youtubeLinksContent, chapterName, chapterVideos]);

  const robustActive = activeVideo >= videos.length ? 0 : activeVideo;
  const currentVideo = videos[robustActive] || videos[0];

  // Sync active video index when chapter or parent activeVideoIndex changes
  useEffect(() => {
    const savedRaw = safeGetItem(`sv_last_video_idx_${subjectId}_ch${chapterNumber}`);
    if (activeVideoIndex && activeVideoIndex >= 1 && (videos.length <= 1 || activeVideoIndex <= videos.length)) {
      const targetIdx = activeVideoIndex - 1;
      setActiveVideo((prev) => (prev !== targetIdx ? targetIdx : prev));
      return;
    }
    if (savedRaw != null) {
      const idx = parseInt(savedRaw, 10);
      if (!isNaN(idx) && idx >= 0 && (videos.length <= 1 || idx < videos.length)) {
        setActiveVideo((prev) => (prev !== idx ? idx : prev));
        return;
      }
    }
    setActiveVideo(0);
  }, [videos.length, subjectId, chapterNumber, activeVideoIndex]);

  useEffect(() => {
    if (!currentVideo?.ytId) return;
    if (activeVideo >= videos.length && videos.length <= 1) return;
    safeSetItem(`sv_last_video_idx_${subjectId}_ch${chapterNumber}`, String(robustActive));
  }, [robustActive, activeVideo, videos.length, subjectId, chapterNumber, currentVideo?.ytId]);

  const completedStorageKey = `sv_watch_done_${subjectId}_ch${chapterNumber}`;
  const [completedVideos, setCompletedVideos] = useState<Set<number>>(() => {
    try {
      const raw = safeGetItem(completedStorageKey);
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
    try {
      const raw = safeGetItem(completedStorageKey);
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
    setCompletedVideos(new Set());
  }, [completedStorageKey]);

  const markVideoDone = useCallback(
    (idx: number) => {
      setCompletedVideos((prev) => {
        if (prev.has(idx)) return prev;
        const next = new Set(prev);
        next.add(idx);
        safeSetItem(completedStorageKey, JSON.stringify(Array.from(next)));
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

  const markWatched = useCallback(
    (videoIndex: number, advance = false) => {
      markVideoDone(videoIndex - 1);
      const notifyKey = `${subjectId}_${chapterNumber}_${videoIndex}_${advance ? "adv" : "threshold"}`;
      if (notifiedWatchedSetRef.current.has(notifyKey)) return;
      notifiedWatchedSetRef.current.add(notifyKey);
      onVideoWatchedRef.current?.(videoIndex, advance);
    },
    [markVideoDone, subjectId, chapterNumber],
  );

  const markWatchedRef = useRef(markWatched);
  useEffect(() => {
    markWatchedRef.current = markWatched;
  }, [markWatched]);

  const sendYtIframeCommand = useCallback(
    (func: string, args: any[] = []) => {
      try {
        if (currentVideo?.ytId) {
          const iframeEl = (document.getElementById(`yt-player-${robustActive}-${currentVideo.ytId}`) ||
            document.getElementById(`yt-player-${currentVideo.ytId}`)) as HTMLIFrameElement | null;
          iframeEl?.contentWindow?.postMessage(
            JSON.stringify({ event: "command", func, args }),
            "*",
          );
        }
      } catch {}
    },
    [currentVideo?.ytId, robustActive],
  );

  // Format time utility
  const formatTime = (sec: number) => {
    if (isNaN(sec) || sec < 0) return "00:00";
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const getVideoTimeKey = useCallback(
    (vidIdx: number, ytId?: string) => {
      if (!ytId) return "";
      const hasDuplicateYtId = videos.filter((v) => v.ytId === ytId).length > 1;
      return hasDuplicateYtId
        ? `sv_video_time_${subjectId}_ch${chapterNumber}_v${vidIdx + 1}_${ytId}`
        : `sv_video_time_${subjectId}_ch${chapterNumber}_${ytId}`;
    },
    [videos, subjectId, chapterNumber],
  );

  const videoTimeStorageKey = getVideoTimeKey(robustActive, currentVideo?.ytId);
  const videoTimeStorageKeyRef = useRef(videoTimeStorageKey);
  videoTimeStorageKeyRef.current = videoTimeStorageKey;
  const durationRef = useRef(duration);
  durationRef.current = duration;
  const playbackRateRef = useRef(playbackRate);
  playbackRateRef.current = playbackRate;
  const lastVideoTimeSaveRef = useRef<number>(0);
  const restoredVideoTimeRef = useRef<number>(0);

  // Restore saved video playback position immediately for visual progress bar & timestamp
  useEffect(() => {
    if (!videoTimeStorageKey) return;
    try {
      const raw = safeGetItem(videoTimeStorageKey);
      if (!raw) {
        restoredVideoTimeRef.current = 0;
        if (!isPlaying) {
          setCurrentTime(0);
          setProgress(0);
        }
        return;
      }
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.currentTime === "number" && parsed.currentTime >= 0) {
        restoredVideoTimeRef.current = parsed.currentTime;
        setCurrentTime(parsed.currentTime);
        if (typeof parsed.duration === "number" && parsed.duration > 0) {
          setDuration(parsed.duration);
          setProgress(Math.min(100, (parsed.currentTime / parsed.duration) * 100));
        } else {
          setProgress(0);
        }
      }
    } catch {
      // ignore
    }
  }, [videoTimeStorageKey, isPlaying]);

  // YouTube Player setup — plays directly inline inside the 16:9 Watch card and in fullscreen
  useEffect(() => {
    hasStartedPlayingRef.current = false;
    playerReadyRef.current = false;
    setHasStartedVideo(false);
    setIsPlaying(false);
    if (watchMode !== "videos" || !currentVideo?.ytId) return;

    let cancelled = false;
    const ytId = currentVideo.ytId;
    const vidIndexOneBased = robustActive + 1;
    const elementId = `yt-player-${robustActive}-${ytId}`;

    const readSavedSec = (): number => {
      try {
        const key = videoTimeStorageKeyRef.current;
        const raw = key ? safeGetItem(key) : null;
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed.currentTime === "number" && parsed.currentTime >= 0) {
            return parsed.currentTime;
          }
        }
      } catch {}
      return 0;
    };

    const persistVideoSec = (cur: number, dur: number, force = false) => {
      const key = videoTimeStorageKeyRef.current;
      if (!key || cur < 0) return;
      const now = Date.now();
      if (!force && now - lastVideoTimeSaveRef.current < 3000) return;
      lastVideoTimeSaveRef.current = now;
      restoredVideoTimeRef.current = cur;
      safeSetItem(key, JSON.stringify({ currentTime: cur, duration: dur, updatedAt: now }));
    };

    const startProgressTicker = () => {
      if (progressIntervalRef.current) return;
      progressIntervalRef.current = setInterval(() => {
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
            setDuration((prev) => (Math.abs(prev - dur) > 0.5 ? dur : prev));
            setProgress(pct);
            persistVideoSec(cur, dur, false);
            if (pct >= WATCHED_THRESHOLD_PCT && hasStartedPlayingRef.current) {
              markWatchedRef.current(vidIndexOneBased, false);
            }
          }
        }
      }, 500);
    };

    const initPlayer = () => {
      if (cancelled) return;
      const el = document.getElementById(elementId);
      if (!el || el.tagName === "IFRAME") return;

      try {
        if (playerRef.current && typeof playerRef.current.destroy === "function") {
          try {
            playerRef.current.destroy();
          } catch {}
        }
        playerRef.current = new (window as any).YT.Player(elementId, {
          width: "100%",
          height: "100%",
          videoId: ytId,
          playerVars: {
            origin: window.location.origin,
            rel: 0,
            modestbranding: 1,
            enablejsapi: 1,
            controls: 0,
            disablekb: 1,
            cc_load_policy: 0,
            playsinline: 1,
            iv_load_policy: 3,
          },
          events: {
            onReady: (event: any) => {
              if (cancelled) return;
              playerReadyRef.current = true;
              try {
                if (event.target) {
                  event.target.unloadModule?.("captions");
                  event.target.setOption?.("captions", "track", {});
                  if (playbackRateRef.current !== 1) {
                    event.target.setPlaybackRate?.(playbackRateRef.current);
                  }
                  const dur =
                    typeof event.target.getDuration === "function" ? event.target.getDuration() : 0;
                  const recentSeek =
                    lastSeekTargetRef.current.ts > 0 && Date.now() - lastSeekTargetRef.current.ts < 8000
                      ? lastSeekTargetRef.current.time
                      : null;
                  const savedSec =
                    recentSeek !== null
                      ? recentSeek
                      : Math.max(readSavedSec(), restoredVideoTimeRef.current);
                  if (savedSec >= 0) {
                    restoredVideoTimeRef.current = savedSec;
                    setCurrentTime(savedSec);
                  }
                  if (dur > 0) {
                    setDuration(dur);
                    if (savedSec > 0 && savedSec < dur - 2) {
                      setProgress((savedSec / dur) * 100);
                    }
                  }
                  if (autoPlayOnReadyRef.current && typeof event.target.playVideo === "function") {
                    autoPlayOnReadyRef.current = false;
                    setHasStartedVideo(true);
                    if (savedSec > 0 && (dur <= 0 || savedSec < dur - 2)) {
                      event.target.seekTo?.(savedSec, true);
                    }
                    event.target.playVideo();
                  }
                }
              } catch {}
            },
            onStateChange: (event: any) => {
              if (cancelled) return;
              const state = event.data;
              const YT = (window as any).YT;
              if (state === YT?.PlayerState?.PLAYING || state === 1) {
                isSeekingRef.current = false;
                recordVideoOpen(ytId, vidIndexOneBased);
                if (!isCcEnabledRef.current && playerRef.current) {
                  try {
                    playerRef.current.unloadModule?.("captions");
                    playerRef.current.setOption?.("captions", "track", {});
                  } catch {}
                }
                if (!hasStartedPlayingRef.current && playerRef.current) {
                  const recentSeek =
                    lastSeekTargetRef.current.ts > 0 && Date.now() - lastSeekTargetRef.current.ts < 8000
                      ? lastSeekTargetRef.current.time
                      : null;
                  const savedSec =
                    recentSeek !== null
                      ? recentSeek
                      : Math.max(readSavedSec(), restoredVideoTimeRef.current);
                  const curNow =
                    typeof playerRef.current.getCurrentTime === "function"
                      ? playerRef.current.getCurrentTime()
                      : 0;
                  const durNow =
                    typeof playerRef.current.getDuration === "function"
                      ? playerRef.current.getDuration()
                      : 0;
                  if (
                    savedSec > 0 &&
                    Math.abs(curNow - savedSec) > 2 &&
                    (durNow <= 0 || savedSec < durNow - 2)
                  ) {
                    try {
                      playerRef.current.seekTo?.(savedSec, true);
                      setCurrentTime(savedSec);
                      if (durNow > 0) setProgress((savedSec / durNow) * 100);
                    } catch {}
                  }
                }
                hasStartedPlayingRef.current = true;
                setHasStartedVideo(true);
                setIsPlaying(true);
                startProgressTicker();
              } else if (state === YT?.PlayerState?.BUFFERING || state === 3) {
                setHasStartedVideo(true);
                if (isSeekingRef.current && playerRef.current) {
                  try {
                    playerRef.current.playVideo?.();
                  } catch {}
                }
              } else if (state === YT?.PlayerState?.ENDED || state === 0) {
                isSeekingRef.current = false;
                activePlaybackSessionYtIdRef.current = null;
                setIsPlaying(false);
                setHasStartedVideo(false);
                if (progressIntervalRef.current) {
                  clearInterval(progressIntervalRef.current);
                  progressIntervalRef.current = null;
                }
                const key = videoTimeStorageKeyRef.current;
                if (key) safeRemoveItem(key);
                restoredVideoTimeRef.current = 0;
                if (hasStartedPlayingRef.current) {
                  hasStartedPlayingRef.current = false;
                  markWatchedRef.current(vidIndexOneBased, true);
                  if (onCompleteRef.current) onCompleteRef.current();
                }
              } else if (state === YT?.PlayerState?.PAUSED || state === 2) {
                if (isSeekingRef.current) {
                  try {
                    playerRef.current?.playVideo?.();
                  } catch {}
                  return;
                }
                if (playerRef.current && typeof playerRef.current.getCurrentTime === "function") {
                  const cur = playerRef.current.getCurrentTime();
                  const dur =
                    typeof playerRef.current.getDuration === "function"
                      ? playerRef.current.getDuration()
                      : durationRef.current;
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
      if (
        playerReadyRef.current &&
        playerRef.current &&
        typeof playerRef.current.getCurrentTime === "function"
      ) {
        try {
          const cur = playerRef.current.getCurrentTime();
          const dur =
            typeof playerRef.current.getDuration === "function"
              ? playerRef.current.getDuration()
              : 0;
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

    ensureYTReady().then(() => {
      if (!cancelled) {
        initPlayer();
      }
    });

    return () => {
      cancelled = true;
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
  }, [watchMode, currentVideo?.ytId, robustActive, subjectId, chapterNumber, recordVideoOpen]);

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

  const isCcEnabledRef = useRef(isCcEnabled);
  useEffect(() => {
    isCcEnabledRef.current = isCcEnabled;
  }, [isCcEnabled]);

  const isFullscreenRef = useRef(isFullscreen);
  useEffect(() => {
    isFullscreenRef.current = isFullscreen;
  }, [isFullscreen]);

  const isPlayingRef = useRef(isPlaying);
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

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
    } catch {}
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
    } catch {}
  };

  const exitFullscreen = () => {
    setIsFullscreen(false);
    isFullscreenRef.current = false;
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
    } catch {}
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
      setIsFullscreen(fs);
      isFullscreenRef.current = fs;
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

  // Player controls — plays directly inside the inline 16:9 Watch player (and fullscreen)
  const handlePlayPause = () => {
    if (isPlaying) {
      setIsPlaying(false);
      playerRef.current?.pauseVideo?.();
      sendYtIframeCommand("pauseVideo", []);
    } else {
      setHasStartedVideo(true);
      if (!playerRef.current || !playerReadyRef.current) {
        autoPlayOnReadyRef.current = true;
        return;
      }
      if (!hasStartedPlayingRef.current && restoredVideoTimeRef.current > 1) {
        try {
          playerRef.current.seekTo?.(restoredVideoTimeRef.current, true);
        } catch {}
      }
      try {
        playerRef.current.playVideo?.();
      } catch {
        sendYtIframeCommand("playVideo", []);
      }
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
    setHasStartedVideo(true);
    setIsPlaying(true);
    if (!playerRef.current || !playerReadyRef.current) {
      autoPlayOnReadyRef.current = true;
      return;
    }
    try {
      playerRef.current?.playVideo?.();
    } catch {}
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
    setHasStartedVideo(true);
    setIsPlaying(true);
    if (!playerRef.current || !playerReadyRef.current) {
      autoPlayOnReadyRef.current = true;
      return;
    }
    try {
      playerRef.current?.playVideo?.();
    } catch {}
  };

  // Netflix-style Skip Intro
  const skipIntroTargetSec = useMemo(() => {
    const vidIntro = currentVideo?.introEndTime;
    if (typeof vidIntro === "number") return vidIntro;
    const ytId = currentVideo?.ytId || "";
    if (ytId && ytId in VIDEO_SKIP_INTRO_SECONDS) {
      return VIDEO_SKIP_INTRO_SECONDS[ytId];
    }
    return 120;
  }, [currentVideo]);

  const canSkipIntro =
    skipIntroTargetSec > 0 &&
    currentTime < skipIntroTargetSec &&
    (duration === 0 || duration > skipIntroTargetSec + 5);

  const canSkipIntroRef = useRef(canSkipIntro);
  useEffect(() => {
    canSkipIntroRef.current = canSkipIntro;
  }, [canSkipIntro]);

  const handleSkipIntro = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    const target = skipIntroTargetSec > 0 ? skipIntroTargetSec : 120;
    const dur =
      typeof playerRef.current?.getDuration === "function"
        ? playerRef.current.getDuration()
        : duration;
    const safeTarget = dur > 0 ? Math.min(target, Math.max(0, dur - 5)) : target;
    isSeekingRef.current = true;
    hasStartedPlayingRef.current = true;
    lastSeekTargetRef.current = { time: safeTarget, ts: Date.now() };
    restoredVideoTimeRef.current = safeTarget;
    showSeekBadge("skip");
    if (playerRef.current) {
      playerRef.current.seekTo?.(safeTarget, true);
    }
    sendYtIframeCommand("seekTo", [safeTarget, true]);
    setCurrentTime(safeTarget);
    if (dur > 0) setProgress((safeTarget / dur) * 100);
    setHasStartedVideo(true);
    setIsPlaying(true);
    if (!playerRef.current || !playerReadyRef.current) {
      autoPlayOnReadyRef.current = true;
      return;
    }
    try {
      playerRef.current?.playVideo?.();
    } catch {}
  };

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

  const keyHandlersRef = useRef({
    handlePlayPause,
    handleForward10,
    handleRewind10,
    toggleFullscreen,
    toggleCc,
    toggleMute,
    handleSkipIntro,
  });
  keyHandlersRef.current = {
    handlePlayPause,
    handleForward10,
    handleRewind10,
    toggleFullscreen,
    toggleCc,
    toggleMute,
    handleSkipIntro,
  };

  // Keyboard shortcuts
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
        keyHandlersRef.current.handlePlayPause();
      } else if (e.key === "ArrowRight" || e.key === "l" || e.key === "L") {
        e.preventDefault();
        keyHandlersRef.current.handleForward10();
      } else if (e.key === "ArrowLeft" || e.key === "j" || e.key === "J") {
        e.preventDefault();
        keyHandlersRef.current.handleRewind10();
      } else if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        keyHandlersRef.current.toggleFullscreen();
      } else if (e.key === "c" || e.key === "C") {
        e.preventDefault();
        keyHandlersRef.current.toggleCc();
      } else if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        keyHandlersRef.current.toggleMute();
      } else if (e.key === "s" || e.key === "S") {
        if (canSkipIntroRef.current) {
          e.preventDefault();
          keyHandlersRef.current.handleSkipIntro();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Controls Auto-Hide Logic
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

  const displayTitle = currentVideo.title || chapterName || "Chapter Video Lecture";

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
    return rawTopics.slice(0, 6);
  }, [currentVideo, displayTitle, chapterName]);

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

  const seekToSecond = useCallback(
    (targetSec: number) => {
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
      if (videoTimeStorageKey) {
        safeSetItem(
          videoTimeStorageKey,
          JSON.stringify({
            currentTime: clamped,
            duration: dur || effectiveDurationSec,
            updatedAt: Date.now(),
          }),
        );
      }
      setHasStartedVideo(true);
      setIsPlaying(true);
      isPlayingRef.current = true;
      if (!playerRef.current || !playerReadyRef.current) {
        autoPlayOnReadyRef.current = true;
        return;
      }
      try {
        playerRef.current.seekTo?.(clamped, true);
        playerRef.current.playVideo?.();
      } catch {
        sendYtIframeCommand("seekTo", [clamped, true]);
        sendYtIframeCommand("playVideo", []);
      }
    },
    [effectiveDurationSec, videoTimeStorageKey, sendYtIframeCommand],
  );

  // Video switching handler — all videos are always unlocked & selectable
  const handleSelectVideo = (index: number) => {
    if (index < 0 || index >= videos.length || index === robustActive) return;
    if (
      playerReadyRef.current &&
      playerRef.current &&
      typeof playerRef.current.getCurrentTime === "function"
    ) {
      try {
        const cur = playerRef.current.getCurrentTime();
        const dur =
          typeof playerRef.current.getDuration === "function"
            ? playerRef.current.getDuration()
            : duration;
        if (cur > 1 && videoTimeStorageKey) {
          safeSetItem(
            videoTimeStorageKey,
            JSON.stringify({
              currentTime: cur,
              duration: dur || effectiveDurationSec,
              updatedAt: Date.now(),
            }),
          );
        }
      } catch {}
    }
    try {
      playerRef.current?.pauseVideo?.();
      sendYtIframeCommand("pauseVideo", []);
    } catch {}
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    activePlaybackSessionYtIdRef.current = null;
    hasStartedPlayingRef.current = false;
    isSeekingRef.current = false;
    autoPlayOnReadyRef.current = false;

    safeSetItem(`sv_last_video_idx_${subjectId}_ch${chapterNumber}`, String(index));

    const targetVid = videos[index];
    const targetTimeKey = getVideoTimeKey(index, targetVid?.ytId);
    let restoredSec = 0;
    let restoredDur = parseDurationSec(targetVid?.duration, 210);
    if (targetTimeKey) {
      try {
        const raw = safeGetItem(targetTimeKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed.currentTime === "number" && parsed.currentTime >= 0) {
            restoredSec = parsed.currentTime;
          }
          if (parsed && typeof parsed.duration === "number" && parsed.duration > 0) {
            restoredDur = parsed.duration;
          }
        }
      } catch {}
    }
    restoredVideoTimeRef.current = restoredSec;
    lastSeekTargetRef.current = { time: restoredSec, ts: 0 };
    setCurrentTime(restoredSec);
    setDuration(restoredDur);
    setProgress(restoredDur > 0 && restoredSec > 0 ? Math.min(100, (restoredSec / restoredDur) * 100) : 0);
    setIsPlaying(false);
    setHasStartedVideo(false);
    isPlayingRef.current = false;

    setActiveVideo(index);
    if (onSelectVideoIndex) {
      onSelectVideoIndex(index + 1);
    }
  };

  const totalVideos = Math.max(1, videos.length);

  useEffect(() => {
    setActiveClipIdx(0);
    setPlayingClipIdx(null);
  }, [subjectId, chapterNumber, robustActive, watchMode]);

  const renderClipsMultiWindow = () => {
    const thumbSrc =
      currentVideo.ytId &&
      (!currentVideo.thumbnailUrl || /\/hero\.|\/cover\./i.test(currentVideo.thumbnailUrl))
        ? `https://i.ytimg.com/vi/${currentVideo.ytId}/hqdefault.jpg`
        : currentVideo.thumbnailUrl ||
          (currentVideo.ytId ? `https://i.ytimg.com/vi/${currentVideo.ytId}/hqdefault.jpg` : "");

    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: segmentsList.length === 1 ? "minmax(0, 1fr)" : "repeat(2, minmax(0, 1fr))",
          gap: "12px",
          width: "100%",
        }}
      >
        {segmentsList.map((seg, idx) => {
          const isSelectedClip = idx === activeClipIdx;
          const isClipPlaying = playingClipIdx === idx && Boolean(currentVideo.ytId);

          return (
            <div
              key={`clip-win-${subjectId}-${chapterNumber}-${robustActive}-${seg.index}`}
              onClick={() => {
                setActiveClipIdx(idx);
                if (!isClipPlaying && currentVideo.ytId) {
                  setPlayingClipIdx(idx);
                }
              }}
              style={{
                position: "relative",
                width: "100%",
                aspectRatio: "16 / 9",
                borderRadius: "10px",
                overflow: "hidden",
                background: "#0F1713",
                border: isSelectedClip ? "2px solid #5B8C72" : "1px solid #DED8CA",
                boxShadow: isSelectedClip
                  ? "0 6px 18px rgba(20, 32, 26, 0.14)"
                  : "0 3px 10px rgba(20, 32, 26, 0.08)",
                cursor: isClipPlaying ? "default" : "pointer",
                transition: "border-color 0.18s ease, box-shadow 0.18s ease",
              }}
            >
              {isClipPlaying && currentVideo.ytId ? (
                <iframe
                  key={`clip-iframe-${subjectId}-${chapterNumber}-${robustActive}-${idx}`}
                  title={`${displayTitle} - ${seg.title}`}
                  src={`https://www.youtube.com/embed/${currentVideo.ytId}?autoplay=1&start=${seg.startSec}${
                    seg.endSec > seg.startSec + 4 ? `&end=${seg.endSec}` : ""
                  }&rel=0&modestbranding=1&playsinline=1&controls=1`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    border: 0,
                  }}
                />
              ) : (
                <>
                  {thumbSrc && (
                    <img
                      src={thumbSrc}
                      alt={seg.title}
                      onError={(e) => {
                        if (currentVideo.ytId) {
                          const fallback = `https://i.ytimg.com/vi/${currentVideo.ytId}/hqdefault.jpg`;
                          if (e.currentTarget.src !== fallback) {
                            e.currentTarget.src = fallback;
                          }
                        }
                      }}
                      style={{
                        position: "absolute",
                        inset: 0,
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
                        "linear-gradient(180deg, rgba(14, 22, 18, 0.48) 0%, rgba(14, 22, 18, 0.18) 45%, rgba(14, 22, 18, 0.86) 100%)",
                    }}
                  />

                  {/* Top Row: Clip index + Time Range */}
                  <div
                    style={{
                      position: "absolute",
                      top: "8px",
                      left: "9px",
                      right: "9px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      zIndex: 2,
                      pointerEvents: "none",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "9.5px",
                        fontWeight: 700,
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        color: isSelectedClip ? "#162A20" : "#E4EFE9",
                        background: isSelectedClip ? "#9DC2AD" : "rgba(15, 23, 19, 0.74)",
                        padding: "2.5px 7px",
                        borderRadius: "4px",
                      }}
                    >
                      {`Clip ${idx + 1}`}
                    </span>
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: 600,
                        color: "#E4EFE9",
                        background: "rgba(15, 23, 19, 0.74)",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {`${formatTime(seg.startSec)} – ${formatTime(seg.endSec)}`}
                    </span>
                  </div>

                  {/* Center Sage Play Button */}
                  <button
                    type="button"
                    aria-label={`Play Clip ${idx + 1}: ${seg.title}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveClipIdx(idx);
                      if (currentVideo.ytId) {
                        setPlayingClipIdx(idx);
                      }
                    }}
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                      width: "42px",
                      height: "42px",
                      borderRadius: "50%",
                      border: "none",
                      background: "#9DC2AD",
                      boxShadow: "0 6px 18px rgba(0, 0, 0, 0.36)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      zIndex: 3,
                    }}
                  >
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="#162A20"
                      style={{ marginLeft: "2px" }}
                    >
                      <polygon points="6,4 20,12 6,20" />
                    </svg>
                  </button>

                  {/* Bottom Clip Title & Duration */}
                  <div
                    style={{
                      position: "absolute",
                      left: "10px",
                      right: "10px",
                      bottom: "8px",
                      zIndex: 2,
                      display: "flex",
                      flexDirection: "column",
                      gap: "2px",
                      pointerEvents: "none",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "#F4F7F5",
                        lineHeight: 1.3,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {seg.title}
                    </div>
                    <div
                      style={{
                        fontSize: "10.5px",
                        fontWeight: 500,
                        color: "#B6C9BE",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {seg.durationLabel}
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Video Player Component matching Saral Vidhya Watch screen
  const renderVideoPlayer = (_isFullWidth = false, _isStackedRow = false, rowIndex = robustActive) => (
    <div
      ref={(el) => {
        rowPlayerContainerRefs.current[rowIndex] = el;
        if (rowIndex === robustActive) {
          playerContainerRef.current = el;
        }
      }}
      onMouseMove={handlePlayerMouseMove}
      onMouseLeave={handlePlayerMouseLeave}
      style={{
        position: "relative",
        width: "100%",
        height: isFullscreen ? "100%" : "clamp(300px, calc(100vh - 230px), 470px)",
        flexShrink: 0,
        background: "#0F1713",
        borderRadius: isFullscreen ? "0px" : "12px",
        overflow: "hidden",
        boxShadow: isFullscreen ? "none" : "0 8px 26px rgba(20, 32, 26, 0.14)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        cursor: isFullscreen && isPlaying && !showControls ? "none" : "default",
      }}
    >
      {/* YouTube Player target wrapped in keyed container so React cleanly unmounts on video switch */}
      <div
        key={`yt-wrap-${subjectId}-${chapterNumber}-${robustActive}-${currentVideo.ytId}`}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          border: 0,
          pointerEvents: "none",
          opacity: hasStartedVideo || isPlaying ? 1 : 0,
          transition: "opacity 0.2s ease",
        }}
      >
        {currentVideo.ytId ? (
          <div
            id={`yt-player-${robustActive}-${currentVideo.ytId}`}
            style={{
              width: "100%",
              height: "100%",
            }}
          />
        ) : null}
      </div>

      {/* Clean Video Thumbnail Cover shown before playback starts */}
      {!hasStartedVideo && !isPlaying && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse at center, rgba(46, 66, 56, 0.88) 0%, rgba(25, 38, 31, 0.96) 100%)",
            pointerEvents: "none",
            zIndex: 1,
            overflow: "hidden",
          }}
        >
          {(currentVideo.thumbnailUrl || currentVideo.ytId) && (
            <img
              key={`vid-thumb-${robustActive}-${currentVideo.ytId}`}
              src={
                currentVideo.ytId &&
                (!currentVideo.thumbnailUrl || /\/hero\.|\/cover\./i.test(currentVideo.thumbnailUrl))
                  ? `https://i.ytimg.com/vi/${currentVideo.ytId}/hqdefault.jpg`
                  : currentVideo.thumbnailUrl || `https://i.ytimg.com/vi/${currentVideo.ytId}/hqdefault.jpg`
              }
              onError={(e) => {
                if (currentVideo.ytId) {
                  const fallback = `https://i.ytimg.com/vi/${currentVideo.ytId}/hqdefault.jpg`;
                  if (e.currentTarget.src !== fallback) {
                    e.currentTarget.src = fallback;
                  }
                }
              }}
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

      {/* Transparent Click overlay covering video (single-click: Play/Pause, double-click: Fullscreen) */}
      <div
        onClick={(e) => {
          e.stopPropagation();
          handleVideoClick(e);
        }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          toggleFullscreen();
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
      {!isPlaying && (
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

      {/* Netflix-style Floating Skip Intro Button */}
      {canSkipIntro && (
        <button
          type="button"
          onClick={handleSkipIntro}
          title={`Skip Intro (Jump to ${formatTime(skipIntroTargetSec)})`}
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
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="5 4 15 12 5 20 5 4" fill="currentColor" />
            <line x1="19" y1="5" x2="19" y2="19" />
          </svg>
        </button>
      )}

      {/* Sleek Bottom Control Bar */}
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
          background:
            "linear-gradient(to top, rgba(16, 24, 20, 0.92) 0%, rgba(16, 24, 20, 0.55) 70%, transparent 100%)",
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

        {/* Rewind 10s */}
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
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
            <polyline points="3 3 3 8 8 8" />
          </svg>
          <span style={{ fontSize: "10px" }}>10</span>
        </button>

        {/* Forward 10s */}
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
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 12a9 9 0 1 1-3-6.7L21 8" />
            <polyline points="21 3 21 8 16 8" />
          </svg>
          <span style={{ fontSize: "10px" }}>10</span>
        </button>

        {/* Inline Horizontal Seek Bar with Segment Dividers & Fullscreen Timestamp Popups */}
        <div
          style={{
            position: "relative",
            flex: 1,
            height: "24px",
            display: "flex",
            alignItems: "center",
          }}
        >
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
                        background: isCurrentSeg
                          ? "rgba(20, 32, 26, 0.76)"
                          : "rgba(16, 24, 20, 0.58)",
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
                        background: isCurrentSeg
                          ? "rgba(157, 194, 173, 0.55)"
                          : "rgba(255, 255, 255, 0.22)",
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
          <span>{`${formatTime(currentTime)} / ${formatTime(effectiveDurationSec)}`}</span>

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
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
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
    completedVideos.has(idx) ||
    Boolean(isVideoWatchedAt?.(idx + 1)) ||
    (videos.length === 1 && isCompleted);

  const watchProgressPercent = useMemo(() => {
    if (totalVideos <= 0) return 0;
    let totalFraction = 0;
    for (let idx = 0; idx < videos.length; idx++) {
      if (isVideoDone(idx)) {
        totalFraction += 1;
      } else if (idx === robustActive) {
        totalFraction += Math.min(1, Math.max(0, progress / 100));
      } else {
        const tKey = getVideoTimeKey(idx, videos[idx]?.ytId);
        if (tKey) {
          try {
            const raw = safeGetItem(tKey);
            if (raw) {
              const parsed = JSON.parse(raw);
              const cTime = Number(parsed?.currentTime || 0);
              const cDur = Number(
                parsed?.duration || parseDurationSec(videos[idx]?.duration, 210),
              );
              if (cTime > 0 && cDur > 0) {
                totalFraction += Math.min(1, cTime / cDur);
              }
            }
          } catch {}
        }
      }
    }
    return Math.min(100, Math.round((totalFraction / totalVideos) * 100));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videos, totalVideos, robustActive, progress, completedVideos, isCompleted, getVideoTimeKey, parseDurationSec]);

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
      {/* ── Top Header Bar: Left Chapter Title + Middle-Top Toggle (Videos | Clips) + Right Unit Selector ── */}
      <div
        className="videos-sticky-top"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          flexWrap: "wrap",
          paddingBottom: "10px",
          marginBottom: "12px",
          borderBottom: "1px solid #E6E1D6",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "13.5px",
            color: "#6E7670",
            fontWeight: 500,
            minWidth: 0,
            flex: 1,
          }}
        >
          <strong
            style={{
              color: "#1E2822",
              fontWeight: 700,
              fontSize: "0.84rem",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
            title={chapterName}
          >
            {chapterName}
          </strong>
        </div>

        {/* Centered Segmented Toggle: Videos | Clips */}
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", flexShrink: 0 }}>
          <div
            role="tablist"
            aria-label="Watch mode selector"
            style={{
              display: "inline-flex",
              alignItems: "center",
              background: "#FFFFFF",
              borderRadius: "9999px",
              padding: "4px",
              border: "1px solid #DED8CA",
              boxShadow: "0 1px 3px rgba(30, 40, 34, 0.05)",
              gap: "2px",
            }}
          >
            {(
              [
                {
                  key: "videos" as const,
                  label: "Videos",
                  icon: (active: boolean) => (
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={active ? "#FFFFFF" : "#4A554E"}
                      strokeWidth="2.1"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="2" y="4" width="20" height="16" rx="3" />
                      <polygon
                        points="10 9 15 12 10 15 10 9"
                        fill={active ? "#FFFFFF" : "#4A554E"}
                        stroke="none"
                      />
                    </svg>
                  ),
                },
                {
                  key: "clips" as const,
                  label: "Clips",
                  icon: (active: boolean) => (
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={active ? "#FFFFFF" : "#4A554E"}
                      strokeWidth="2.1"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="2.5" y="4" width="8" height="6.5" rx="1.2" />
                      <rect x="13.5" y="4" width="8" height="6.5" rx="1.2" />
                      <rect x="2.5" y="13.5" width="8" height="6.5" rx="1.2" />
                      <rect x="13.5" y="13.5" width="8" height="6.5" rx="1.2" />
                    </svg>
                  ),
                },
              ]
            ).map(({ key, label, icon }) => {
              const isActive = watchMode === key;
              return (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => {
                    if (key === "clips" && isPlaying) {
                      try {
                        playerRef.current?.pauseVideo?.();
                        sendYtIframeCommand("pauseVideo", []);
                      } catch {}
                      setIsPlaying(false);
                      isPlayingRef.current = false;
                    }
                    setWatchMode(key);
                  }}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "6px 16px",
                    borderRadius: "9999px",
                    border: "none",
                    outline: "none",
                    background: isActive ? "#2E3B33" : "transparent",
                    color: isActive ? "#FFFFFF" : "#4A554E",
                    fontSize: "13px",
                    fontWeight: isActive ? 700 : 600,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    userSelect: "none",
                    whiteSpace: "nowrap",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {icon(isActive)}
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Balance Slot (compact Unit switcher when multi-unit course) */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
          }}
        >
          {subjectChapters && subjectChapters.length > 1 && onSelectChapter && (
            <div
              role="navigation"
              aria-label="Unit selector"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "3px",
                background: "#FFFFFF",
                border: "1px solid #DED8CA",
                borderRadius: "8px",
                padding: "3px",
              }}
            >
              {subjectChapters.map((ch) => {
                const isActiveUnit = ch.number === chapterNumber;
                return (
                  <button
                    key={ch.number}
                    type="button"
                    onClick={() => onSelectChapter(ch.number)}
                    title={ch.name || `Unit ${ch.number}`}
                    style={{
                      padding: "4px 9px",
                      borderRadius: "6px",
                      border: "none",
                      background: isActiveUnit ? "#EEF5F1" : "transparent",
                      color: isActiveUnit ? "#1E2822" : "#6E7B73",
                      fontSize: "11.5px",
                      fontWeight: isActiveUnit ? 700 : 600,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {`Unit ${ch.number}`}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Three-Column Watch Layout (Shared across Videos & Clips) ── */}
      <div
        style={{
          display: "flex",
          gap: "20px",
          width: "100%",
          margin: 0,
          padding: "4px 0 36px 0",
          boxSizing: "border-box",
          alignItems: "flex-start",
        }}
      >
          {/* ── LEFT NAVIGATION SIDEBAR (IN THIS CHAPTER · N VIDEOS) ── */}
          <div
            style={{
              width: "256px",
              flexShrink: 0,
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
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

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {videos.map((vid, idx) => {
                  const isSelected = idx === robustActive;
                  const isWatched = isVideoDone(idx);
                  let savedVidDur = 0;
                  if (!isSelected) {
                    const tKey = getVideoTimeKey(idx, vid.ytId);
                    if (tKey) {
                      try {
                        const raw = safeGetItem(tKey);
                        if (raw) {
                          const parsed = JSON.parse(raw);
                          if (parsed && typeof parsed.duration === "number" && parsed.duration > 0) {
                            savedVidDur = Math.round(parsed.duration);
                          }
                        }
                      } catch {}
                    }
                  }
                  const vidSec =
                    isSelected && duration > 0
                      ? Math.round(duration)
                      : savedVidDur > 0
                        ? savedVidDur
                        : parseDurationSec(vid.duration, 210);
                  const vidDurFormatted = formatTime(vidSec);

                  let statusBadge = "";
                  if (isSelected) {
                    statusBadge = "HERE";
                  } else if (isWatched) {
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
                      key={`video-item-${idx}-${vid.ytId || idx}`}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleSelectVideo(idx)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleSelectVideo(idx);
                        }
                      }}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "10px",
                        padding: "10px 10px",
                        borderRadius: "12px",
                        cursor: "pointer",
                        border: isSelected ? "1px solid #C5D9CD" : "1px solid transparent",
                        background: isSelected ? "#EFF5F1" : "transparent",
                        transition: "all 0.18s ease",
                      }}
                    >
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
                          <svg
                            width="10"
                            height="10"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#FFFFFF"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        ) : null}
                      </div>

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
                          {`• ${vidDurFormatted}`}
                        </div>
                      </div>
                    </div>
                  );
                })}
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
                      background: "#9CC0B4",
                      borderRadius: "999px",
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ── MIDDLE MAIN VIDEO / MULTI-CLIP COLUMN ── */}
          <div
            style={{
              flex: 1,
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >
            {watchMode === "clips"
              ? renderClipsMultiWindow()
              : renderVideoPlayer(true, false, robustActive)}
          </div>

          {/* ── RIGHT SUBTLE TIMESTAMPS / CLIPS COLUMN ── */}
          <div
            style={{
              width: "268px",
              flexShrink: 0,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                background: "#FFFFFF",
                borderRadius: "14px",
                padding: "14px 14px",
                border: "1px solid #EAE5DC",
                boxShadow: "0 1px 6px rgba(30, 40, 34, 0.02)",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0 4px 6px 4px",
                  borderBottom: "1px solid #F2EFE9",
                }}
              >
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    color: "#7C8780",
                    textTransform: "uppercase",
                  }}
                >
                  {watchMode === "clips" ? `Clips · ${segmentsList.length}` : "Timestamps"}
                </span>
                <span
                  style={{
                    fontSize: "10.5px",
                    fontWeight: 500,
                    color: "#9AA39D",
                  }}
                >
                  {watchMode === "clips" ? "Click to play" : "Click to jump"}
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                }}
              >
                {segmentsList.map((seg, idx) => {
                  const isNowPlaying =
                    watchMode === "clips" ? idx === activeClipIdx : idx === activeSegmentIdx;

                  return (
                    <div
                      key={seg.index}
                      onClick={() => {
                        if (watchMode === "clips") {
                          setActiveClipIdx(idx);
                          if (currentVideo.ytId) {
                            setPlayingClipIdx(idx);
                          }
                        } else {
                          seekToSecond(seg.startSec);
                        }
                      }}
                      style={{
                        background: isNowPlaying ? "#F3F8F5" : "transparent",
                        border: isNowPlaying ? "1px solid #DCEAE2" : "1px solid transparent",
                        borderRadius: "10px",
                        padding: "9px 10px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "10px",
                        transition: "background 0.15s ease, border-color 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        if (!isNowPlaying) {
                          e.currentTarget.style.background = "#FAF8F4";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isNowPlaying) {
                          e.currentTarget.style.background = "transparent";
                        }
                      }}
                    >
                      <span
                        style={{
                          background: isNowPlaying ? "#E2EFE8" : "#F4F1EA",
                          color: isNowPlaying ? "#2F5944" : "#6E7B73",
                          fontSize: "10.5px",
                          fontWeight: 600,
                          padding: "3px 7px",
                          borderRadius: "5px",
                          fontVariantNumeric: "tabular-nums",
                          flexShrink: 0,
                          marginTop: "1px",
                        }}
                      >
                        {formatTime(seg.startSec)}
                      </span>

                      <div
                        style={{
                          flex: 1,
                          minWidth: 0,
                          display: "flex",
                          flexDirection: "column",
                          gap: "3px",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "12px",
                            fontWeight: isNowPlaying ? 600 : 500,
                            color: isNowPlaying ? "#1E2822" : "#3E4A43",
                            lineHeight: 1.38,
                          }}
                        >
                          {seg.title}
                        </div>

                        <div
                          style={{
                            fontSize: "10.5px",
                            fontWeight: 400,
                            color: "#8F9993",
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          {seg.durationLabel}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
      </div>
    </div>
  );
}
