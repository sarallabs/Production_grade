import React, { useState, useEffect, useRef, useMemo } from "react";
import { getSubjectBaseUrl, getManifest, getChapters, getResourceContent, type DifficultyLevel } from "@/data/contentRepository";
import { useAudioProgress, saveProgress, type AudioProgress } from "@/hooks/useAudioProgress";
import {
  googleTtsSpeak,
  googleTtsStop,
  googleTtsPause,
  googleTtsResume,
} from "@/services/googleTtsService";

const SUBJECT_LANG: Record<string, string> = {};

function stripMarkdown(text: string): string {
  if (!text) return "";
  return text.replace(/[*_#`\[\]]/g, "");
}

export interface PodcastsViewProps {
  chapterName: string;
  subjectId: string;
  chapterNumber: number;
  persona: string;
  autoPlay?: boolean;
  resumeTrack?: string;
  onPlayingChange?: (playing: boolean) => void;
  playTrigger?: number;
  pauseTrigger?: number;
  stopTrigger?: number;
}

/**
 * Renders the Podcasts View.
 */
export function PodcastsView({
  chapterName,
  subjectId,
  chapterNumber,
  persona,
  autoPlay,
  resumeTrack,
  onPlayingChange,
  playTrigger,
  pauseTrigger,
  stopTrigger,
}: PodcastsViewProps) {
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [available, setAvailable] = useState<boolean | null>(null); // null = checking
  const [chapterDir, setChapterDir] = useState<string>(
    `chapter_${String(chapterNumber).padStart(2, "0")}`
  );

  useEffect(() => {
    if (!subjectId) return;
    getManifest().then((m) => {
      const list = getChapters(m, subjectId);
      const ch = list.find((c) => c.number === chapterNumber);
      if (ch?.dir) {
        setChapterDir(ch.dir);
      }
    });
  }, [subjectId, chapterNumber]);

  const getSavedTrack = (): "long" | "short" => {
    if (resumeTrack === "long" || resumeTrack === "short") return resumeTrack;
    const saved = localStorage.getItem(
      `last_track_${subjectId}_${chapterNumber}_${persona}`
    );
    return saved === "long" || saved === "short" ? saved : "short";
  };

  const [selectedTrack, setSelectedTrack] = useState<"long" | "short">(
    getSavedTrack()
  );

  useEffect(() => {
    localStorage.setItem(
      `last_track_${subjectId}_${chapterNumber}_${persona}`,
      selectedTrack
    );
  }, [selectedTrack, subjectId, chapterNumber, persona]);

  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [transcript, setTranscript] = useState<string | null>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const transcriptBoxRef = useRef<HTMLDivElement>(null);

  // ── TTS Playback State ──
  const [ttsPlaybackState, setTtsPlaybackState] = useState<
    "idle" | "playing" | "paused"
  >("idle");
  const [ttsCharIndex, setTtsCharIndex] = useState(0);

  const cleanText = useMemo(() => stripMarkdown(transcript || ""), [transcript]);

  const displayDuration = useMemo(() => {
    if (available) return audioDuration;
    return Math.max(1, cleanText.length / 15);
  }, [available, audioDuration, cleanText]);

  const displayCurrent = useMemo(() => {
    if (available) return currentTime;
    return Math.min(displayDuration, ttsCharIndex / 15);
  }, [available, currentTime, ttsCharIndex, displayDuration]);

  const progressPct = displayDuration
    ? (displayCurrent / displayDuration) * 100
    : 0;

  const transcriptTokens = useMemo(() => {
    if (!transcript) return [] as string[];
    return transcript.split(/(\s+|[.,!?;:]+)/g).filter(Boolean);
  }, [transcript]);

  const wordTimings = useMemo(() => {
    if (!transcriptTokens.length)
      return {
        totalWeight: 0,
        wordWeights: [] as number[],
        wordIndexes: [] as number[],
      };

    let cumulativeChars = 0;
    const wordWeights: number[] = [];
    const wordIndexes: number[] = [];

    for (let i = 0; i < transcriptTokens.length; i++) {
      const token = transcriptTokens[i];
      const isWord = token.trim() !== "" && !/^[.,!?;:]+$/.test(token);

      if (isWord) {
        cumulativeChars += token.length;
        wordWeights.push(cumulativeChars);
        wordIndexes.push(i);
      } else {
        if (token.includes(".")) cumulativeChars += 12;
        else if (token.includes("?")) cumulativeChars += 12;
        else if (token.includes("!")) cumulativeChars += 12;
        else if (token.includes(",")) cumulativeChars += 6;
        else if (token.includes(";")) cumulativeChars += 8;
        else if (token.includes(":")) cumulativeChars += 8;
        else if (token.includes("\n\n")) cumulativeChars += 20;
        else if (token.includes("\n")) cumulativeChars += 10;
        else cumulativeChars += token.length;
      }
    }

    const START_SILENCE_CHARS = 10;
    const totalWeight = cumulativeChars + START_SILENCE_CHARS + 15;

    const shiftedWeights = wordWeights.map((w) => w + START_SILENCE_CHARS);

    return { totalWeight, wordWeights: shiftedWeights, wordIndexes };
  }, [transcriptTokens]);

  const { activeWordIdx, activeWordSet, activeTokenStart, activeTokenEnd } =
    useMemo(() => {
      if (
        !transcript ||
        !displayDuration ||
        wordTimings.wordIndexes.length === 0 ||
        displayCurrent < 0
      ) {
        return {
          activeWordIdx: -1,
          activeWordSet: new Set<number>(),
          activeTokenStart: -1,
          activeTokenEnd: -1,
        };
      }

      const clampedTime = Math.min(displayCurrent, displayDuration);
      const progress = clampedTime / displayDuration;

      const targetWeight = progress * wordTimings.totalWeight;

      let wordIdx = 0;
      for (let i = 0; i < wordTimings.wordWeights.length; i++) {
        if (wordTimings.wordWeights[i] >= targetWeight) {
          wordIdx = i;
          break;
        }
      }

      const t1 = wordTimings.wordIndexes[Math.max(0, wordIdx)];
      const t2 =
        wordTimings.wordIndexes[
          Math.min(wordIdx + 1, wordTimings.wordIndexes.length - 1)
        ];
      const t3 =
        wordTimings.wordIndexes[
          Math.min(wordIdx + 2, wordTimings.wordIndexes.length - 1)
        ];
      const startToken = Math.min(t1, t2, t3);
      const endToken = Math.max(t1, t2, t3);

      return {
        activeWordIdx: wordIdx,
        activeWordSet: new Set([t1, t2, t3].filter((x) => x !== undefined)),
        activeTokenStart: startToken,
        activeTokenEnd: endToken,
      };
    }, [transcript, displayDuration, displayCurrent, wordTimings]);

  useEffect(() => {
    if (!transcriptBoxRef.current || !transcriptRef.current) return;

    let targetElement: HTMLElement | null = null;

    const phraseActive = transcriptBoxRef.current.querySelector(
      ".transcript-phrase-active"
    );
    if (phraseActive) {
      targetElement = phraseActive as HTMLElement;
    } else {
      const activeWords = transcriptBoxRef.current.querySelectorAll(
        ".transcript-word.active"
      );
      if (activeWords.length > 0) {
        targetElement = activeWords[0] as HTMLElement;
      }
    }

    if (targetElement) {
      const container = transcriptRef.current;
      const containerTop = container.getBoundingClientRect().top;
      const targetTop = targetElement.getBoundingClientRect().top;
      const relativeTop = targetTop - containerTop;
      const targetHeight = targetElement.offsetHeight;
      const containerHeight = container.offsetHeight;

      const newScrollTop =
        container.scrollTop +
        relativeTop -
        containerHeight / 2 +
        targetHeight / 2;

      container.scrollTo({
        top: newScrollTop,
        behavior: "smooth",
      });
    }
  }, [activeWordIdx, activeTokenStart]);

  const chapterPad = String(chapterNumber).padStart(2, "0");
  const subjectBaseUrl = getSubjectBaseUrl(subjectId);
  const basePath = `${subjectBaseUrl}/${chapterDir}/podcasts`;
  const lessonId = `${subjectId}_ch${chapterNumber}_${persona}_${selectedTrack}`;
  const userId = localStorage.getItem("app_user_id") || "anonymous";

  const metadata = useMemo(
    () => ({
      subjectId,
      chapterNumber,
      chapterName,
      persona,
      track: selectedTrack,
    }),
    [subjectId, chapterNumber, chapterName, persona, selectedTrack]
  );

  useAudioProgress(
    userId,
    lessonId,
    audioRef,
    available === true,
    metadata,
    setCurrentTime
  );

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || available !== true) return;

    const savedData = localStorage.getItem(
      `audio_progress_${userId}_${lessonId}`
    );
    if (!savedData) return;

    try {
      const parsed = JSON.parse(savedData) as AudioProgress;
      if (parsed.currentTime > 0) {
        const seekAudio = () => {
          if (!audio) return;
          audio.currentTime = parsed.currentTime;
          setCurrentTime(parsed.currentTime);
        };

        if (audio.readyState >= 1) {
          seekAudio();
        } else {
          audio.addEventListener("loadedmetadata", seekAudio, { once: true });
        }
      }
    } catch (error) {
      console.warn("Failed to restore local audio progress:", error);
    }
  }, [available, lessonId, userId]);

  const getFileNames = (track: "long" | "short") => {
    if (subjectId.startsWith("neb_") || subjectId === "management") {
      const base = `${subjectBaseUrl}/${chapterDir}/${persona}/${track}_podcast`;
      return { audio: `${base}.mp3`, transcript: `${base}.md` };
    }
    if (subjectId === "advanced_financial_management") {
      const trackLabel = track === "long" ? "long" : "short";
      const base = `${subjectBaseUrl}/${chapterDir}/${persona}/${trackLabel}_podcast`;
      return { audio: `${base}.mp3`, transcript: `${base}.md` };
    }
    if (subjectId === "pubadm_ur") {
      return {
        audio:
          track === "long"
            ? `${basePath}/podcast_long.m4a`
            : `${basePath}/podcast_short.mp3`,
        transcript: `${basePath}/transcript_${track}.md`,
      };
    }
    if (subjectId === "science") {
      if (chapterNumber <= 3) {
        const personaLabel: Record<string, string> = {
          beginner: "Beginner",
          intermediate: "Moderate",
          advanced: "Advanced",
        };
        const label = personaLabel[persona] ?? "Moderate";
        const trackLabel = track === "long" ? "Long" : "Short";
        const base = `${basePath}/${persona}/Science_Chapter${chapterNumber}_${label}_${trackLabel}`;
        return { audio: `${base}.mp3`, transcript: `${base}.txt` };
      }
      const base = `${basePath}/Science_Chapter_${chapterPad}_${track}`;
      return { audio: `${base}.m4a`, transcript: `${base}.txt` };
    }
    if (subjectId === "english") {
      if (chapterNumber <= 3) {
        const personaLabel: Record<string, string> = {
          beginner: "Beginner",
          intermediate: "Moderate",
          advanced: "Advanced",
        };
        const label = personaLabel[persona] ?? "Moderate";
        const trackLabel = track === "long" ? "Long" : "Short";
        const base = `${basePath}/${persona}/English_Chapter_${chapterNumber}_${label}_${trackLabel}`;
        return { audio: `${base}.mp3`, transcript: `${base}.txt` };
      }
      const base = `${basePath}/ch${chapterNumber}-${track}`;
      return { audio: `${base}.m4a`, transcript: `${base}.txt` };
    }
    if (subjectId === "maths") {
      const base = `${basePath}/ch${chapterNumber}-${track}-${persona}`;
      return { audio: `${base}.mp3`, transcript: `${base}.txt` };
    }
    const base = `${basePath}/ch${chapterNumber}-${track}`;
    return { audio: `${base}.m4a`, transcript: `${base}.txt` };
  };

  const tracks = {
    long: { label: "Long Podcast", desc: "In-depth Chapter Coverage" },
    short: { label: "Short Podcast", desc: "Brief Recap of Key Points" },
  };

  useEffect(() => {
    const NEB_TTS_SUBJECTS = ["advanced_financial_management"];
    if (NEB_TTS_SUBJECTS.includes(subjectId)) {
      setAvailable(false);
      return;
    }
    setAvailable(null);
    const { audio } = getFileNames(selectedTrack);
    fetch(audio, { method: "HEAD" })
      .then((res) => {
        const ct = res.headers.get("content-type") || "";
        const hasAudio = res.ok && !ct.includes("text/html");
        setAvailable(hasAudio);
      })
      .catch(() => {
        setAvailable(false);
      });
  }, [subjectId, chapterNumber, persona, selectedTrack, chapterDir]);

  const isTrackMount = useRef(true);
  useEffect(() => {
    if (isTrackMount.current) {
      isTrackMount.current = false;
      return;
    }
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      setIsPlaying(false);
      onPlayingChange?.(false);
      setAudioDuration(0);
      audio.load();
    }
  }, [selectedTrack]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      setIsPlaying(false);
      onPlayingChange?.(false);
      setCurrentTime(0);
      setAudioDuration(0);
    }
  }, [persona]);

  useEffect(() => {
    if (!subjectId || (!subjectId.startsWith("neb_") && subjectId !== "management"))
      return;
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    setIsPlaying(false);
    onPlayingChange?.(false);
    setCurrentTime(0);
    setAudioDuration(0);
  }, [subjectId, chapterNumber, persona, selectedTrack]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => {
      if (autoPlay) {
        audio.play().catch((e) => console.warn("Auto-play prevented:", e));
      }
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("seeked", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("seeked", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
    };
  }, [selectedTrack, autoPlay, available]);

  useEffect(() => {
    if (!subjectId) return;
    setTranscript(null);

    const { transcript: tFile } = getFileNames(selectedTrack);
    fetch(tFile)
      .then((r) => {
        const ct = r.headers.get("content-type") || "";
        if (!r.ok || ct.includes("text/html")) throw new Error();
        return r.text();
      })
      .then((t) => setTranscript(t))
      .catch(() => {
        getResourceContent(
          subjectId,
          chapterNumber,
          selectedTrack === "long" ? "long_podcast.md" : "short_podcast.md",
          persona as DifficultyLevel
        ).then((script) => {
          if (script && !script.includes("Content not available")) {
            setTranscript(script);
          } else {
            setTranscript("Content not available.");
          }
        });
      });
  }, [selectedTrack, subjectId, chapterNumber, persona, chapterDir]);

  const handlePlay = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.play().catch((e) => console.warn("Play failed:", e));
    }
  };
  const handlePause = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onPlay = () => {
      setIsPlaying(true);
      onPlayingChange?.(true);
    };
    const onPause = () => {
      setIsPlaying(false);
      onPlayingChange?.(false);
    };
    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      onPlayingChange?.(false);
    };
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
    };
  }, [onPlayingChange, available]);

  const handleTtsPlay = () => {
    if (subjectId === "management") return;
    if (ttsPlaybackState === "paused") {
      googleTtsResume();
      setTtsPlaybackState("playing");
      onPlayingChange?.(true);
    } else {
      const clean = cleanText;
      if (!clean) return;
      const startChar = ttsCharIndex;
      googleTtsSpeak(
        clean.slice(startChar),
        SUBJECT_LANG[subjectId] ?? "en-IN",
        () => {
          setTtsPlaybackState("playing");
          onPlayingChange?.(true);
        },
        () => {
          setTtsPlaybackState("idle");
          setTtsCharIndex(0);
          onPlayingChange?.(false);
        },
        (localIndex) => {
          setTtsCharIndex(startChar + localIndex);
        }
      );
    }
  };

  const handleTtsPause = () => {
    if (subjectId === "management") return;
    googleTtsPause();
    setTtsPlaybackState("paused");
    onPlayingChange?.(false);
  };

  const handleTtsStop = () => {
    if (subjectId === "management") return;
    googleTtsStop();
    setTtsPlaybackState("idle");
    setTtsCharIndex(0);
    onPlayingChange?.(false);
  };

  const cleanTextRef2 = useRef(cleanText);
  const ttsCharIndexRef = useRef(ttsCharIndex);
  const ttsPlaybackStateRef = useRef(ttsPlaybackState);
  useEffect(() => {
    cleanTextRef2.current = cleanText;
  }, [cleanText]);
  useEffect(() => {
    ttsCharIndexRef.current = ttsCharIndex;
  }, [ttsCharIndex]);
  useEffect(() => {
    ttsPlaybackStateRef.current = ttsPlaybackState;
  }, [ttsPlaybackState]);

  useEffect(() => {
    if (!playTrigger) return;
    if (available) {
      handlePlay();
    } else {
      if (subjectId === "management") return;
      const state = ttsPlaybackStateRef.current;
      const clean = cleanTextRef2.current;
      const startChar = ttsCharIndexRef.current;
      if (state === "paused") {
        googleTtsResume();
        setTtsPlaybackState("playing");
        onPlayingChange?.(true);
      } else {
        if (!clean) return;
        googleTtsSpeak(
          clean.slice(startChar),
          SUBJECT_LANG[subjectId] ?? "en-IN",
          () => {
            setTtsPlaybackState("playing");
            onPlayingChange?.(true);
          },
          () => {
            setTtsPlaybackState("idle");
            setTtsCharIndex(0);
            onPlayingChange?.(false);
          },
          (localIndex) => {
            setTtsCharIndex(startChar + localIndex);
          }
        );
      }
    }
  }, [playTrigger, available]);

  useEffect(() => {
    if (!pauseTrigger) return;
    if (available) {
      handlePause();
    } else {
      if (subjectId === "management") return;
      handleTtsPause();
    }
  }, [pauseTrigger, available]);

  useEffect(() => {
    if (!stopTrigger) return;
    if (available) {
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
        setCurrentTime(0);

        if (subjectId.startsWith("neb_") || subjectId === "management") {
          saveProgress(userId, lessonId, 0, audio.duration || 0, false, metadata);
        }
      }
    } else {
      if (subjectId === "management") return;
      handleTtsStop();
    }
  }, [stopTrigger, available, subjectId, lessonId, userId, metadata]);

  useEffect(() => {
    return () => {
      googleTtsStop();
    };
  }, [selectedTrack, persona, subjectId, chapterNumber]);

  useEffect(() => {
    setTtsPlaybackState("idle");
    setTtsCharIndex(0);
  }, [selectedTrack, persona, subjectId, chapterNumber]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = parseFloat(e.target.value);
    if (available) {
      if (audioRef.current) {
        audioRef.current.currentTime = t;
        setCurrentTime(t);
      }
    } else {
      if (subjectId === "management") return;
      const newCharIdx = Math.floor(t * 15);
      setTtsCharIndex(newCharIdx);
      if (ttsPlaybackState === "playing") {
        const clean = cleanText;
        googleTtsSpeak(
          clean.slice(newCharIdx),
          SUBJECT_LANG[subjectId] ?? "en-IN",
          () => {
            setTtsPlaybackState("playing");
            onPlayingChange?.(true);
          },
          () => {
            setTtsPlaybackState("idle");
            setTtsCharIndex(0);
            onPlayingChange?.(false);
          },
          (localIndex) => {
            setTtsCharIndex(newCharIdx + localIndex);
          }
        );
      }
    }
  };

  const fmtTime = (s: number, fallback = "0:00") => {
    if (s === undefined || s === null || isNaN(s) || !isFinite(s))
      return fallback;
    const m = Math.floor(s / 60);
    const sec = String(Math.floor(s % 60)).padStart(2, "0");
    return `${m}:${sec}`;
  };

  if (available === null || transcript === null) {
    return (
      <div className="podcasts-view">
        <p className="loading-state">Checking podcast availability…</p>
      </div>
    );
  }

  if (
    available === false &&
    (transcript === "Content not available." || subjectId === "management")
  ) {
    return (
      <div className="podcasts-view">
        <div className="podcast-track-selector">
          {(["short", "long"] as const).map((t) => (
            <div
              key={t}
              className={`podcast-track-card card ${
                selectedTrack === t ? "active" : ""
              }`}
              onClick={() => setSelectedTrack(t)}
            >
              <span className="track-icon">
                {t === "short" ? "⚡" : "📖"}
              </span>
              <div className="track-info">
                <strong>{tracks[t].label}</strong>
                <span className="track-desc">{tracks[t].desc}</span>
              </div>
            </div>
          ))}
        </div>
        <div
          className="card"
          style={{ padding: "48px", textAlign: "center", marginTop: "20px" }}
        >
          <span style={{ fontSize: "3.5rem" }}>🎧</span>
          <h3 style={{ margin: "16px 0 8px", color: "var(--text)" }}>
            Coming Soon
          </h3>
          <p style={{ color: "var(--text-secondary)" }}>
            Podcasts for <strong>{chapterName}</strong> haven't been uploaded
            yet.
            <br />
            Check back soon!
          </p>
        </div>
      </div>
    );
  }

  const currentFiles = getFileNames(selectedTrack);

  return (
    <div className="podcasts-view">
      <div className="podcast-sticky-top">
        <div className="podcast-track-selector">
          {(["short", "long"] as const).map((t) => (
            <div
              key={t}
              className={`podcast-track-card card ${
                selectedTrack === t ? "active" : ""
              }`}
              onClick={() => setSelectedTrack(t)}
            >
              <span className="track-icon">
                {t === "short" ? "⚡" : "📖"}
              </span>
              <div className="track-info">
                <strong>{tracks[t].label}</strong>
                <span className="track-desc">{tracks[t].desc}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="podcast-player-real">
          {available && (
            <audio
              ref={audioRef}
              src={currentFiles.audio}
              preload="auto"
              onLoadedMetadata={(e) => {
                const d = (e.target as HTMLAudioElement).duration;
                if (d && isFinite(d)) setAudioDuration(d);
              }}
              onDurationChange={(e) => {
                const d = (e.target as HTMLAudioElement).duration;
                if (d && isFinite(d)) setAudioDuration(d);
              }}
            />
          )}

          <div
            className="player-row"
            style={{ display: "flex", alignItems: "center", gap: "16px", width: "100%" }}
          >
            <button
              onClick={() => {
                if (available) {
                  isPlaying ? handlePause() : handlePlay();
                } else {
                  ttsPlaybackState === "playing"
                    ? handleTtsPause()
                    : handleTtsPlay();
                }
              }}
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                background: "#7C3AED",
                color: "#fff",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                boxShadow: "0 4px 10px rgba(124, 58, 237, 0.3)",
                flexShrink: 0,
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#6D28D9";
                e.currentTarget.style.transform = "scale(1.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#7C3AED";
                e.currentTarget.style.transform = "scale(1)";
              }}
              title={
                (available ? isPlaying : ttsPlaybackState === "playing")
                  ? "Pause"
                  : "Play"
              }
            >
              {(available ? isPlaying : ttsPlaybackState === "playing") ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: "2px" }}>
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            <span className="player-time current">{fmtTime(displayCurrent)}</span>

            <div className="player-bar-wrap">
              <div
                className="player-bar-fill"
                style={{ width: `${progressPct}%` }}
              />
              <input
                type="range"
                min={0}
                max={displayDuration || 0}
                step={0.5}
                value={displayCurrent}
                onChange={handleSeek}
                className="seek-slider"
                aria-label="Seek"
              />
            </div>

            <span className="player-time total">
              {displayDuration ? fmtTime(displayDuration) : "--:--"}
            </span>
          </div>
        </div>
      </div>

      <div className="podcast-transcript-scroll" ref={transcriptRef}>
        <div className="transcript-toggle">
          <h4>Transcript</h4>
        </div>
        {transcript ? (
          <div
            className="transcript-box transcript-body"
            ref={transcriptBoxRef}
          >
            {transcriptTokens.map((token, idx) => {
              if (activeTokenStart >= 0 && idx === activeTokenStart) {
                const grouped = transcriptTokens
                  .slice(activeTokenStart, activeTokenEnd + 1)
                  .join("");
                return (
                  <span key={`grp-${idx}`} className="transcript-phrase-active">
                    {grouped}
                  </span>
                );
              }
              if (
                activeTokenStart >= 0 &&
                idx > activeTokenStart &&
                idx <= activeTokenEnd
              )
                return null;
              const isWord = token.trim() !== "" && !/^[.,!?;:]+$/.test(token);
              return (
                <span
                  key={idx}
                  className={
                    isWord && activeWordSet.has(idx)
                      ? "transcript-word active"
                      : undefined
                  }
                >
                  {token}
                </span>
              );
            })}
          </div>
        ) : (
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            Loading transcript…
          </p>
        )}
      </div>
    </div>
  );
}

export default PodcastsView;

