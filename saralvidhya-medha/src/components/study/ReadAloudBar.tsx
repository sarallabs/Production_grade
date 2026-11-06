import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  googleTtsSpeak,
  googleTtsStop,
  googleTtsPause,
  googleTtsResume,
} from "@/services/googleTtsService";
import type { ToolId } from "@/components/ToolsMenu";

const SUBJECT_LANG: Record<string, string> = {
  pubadm_ur: "ur-PK",
  hindi: "hi-IN",
  telugu: "te-IN",
};

export function stripMarkdown(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, "")
    .replace(/#{1,6}\s*/g, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[>*_~`#|]/g, "")
    .replace(/---+/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export interface ReadAloudBarProps {
  text: string;
  subjectId: string;
  persona?: string;
  onPlay?: () => void;
  onHighlightChange?: (payload: {
    active: boolean;
    startWord: number;
    endWord: number;
  }) => void;
  activeTool?: string;
  onSwitchTool?: (tool: ToolId) => void;
}

export default function ReadAloudBar({
  text,
  subjectId,
  persona,
  onPlay,
  onHighlightChange,
  activeTool,
  onSwitchTool,
}: ReadAloudBarProps) {
  const [playbackState, setPlaybackState] = useState<
    "idle" | "playing" | "paused"
  >("idle");
  const lang = SUBJECT_LANG[subjectId] ?? "en-IN";
  const playbackRef = useRef<"idle" | "playing" | "paused">("idle");
  const cooldownRef = useRef(false);
  const cleanTextRef = useRef("");
  const wordRangesRef = useRef<{ start: number; end: number }[]>([]);
  const resumeCharRef = useRef(0);
  const lastHighlightRef = useRef<{ startWord: number; endWord: number }>({
    startWord: 0,
    endWord: 2,
  });
  const stoppedExternallyRef = useRef(false); // true = stopped by persona switch, not natural end
  const progressStorageKey = useMemo(() => {
    if (!text)
      return `read_progress_${subjectId}_${persona ?? ""}_${activeTool ?? "summary"}_empty`;
    const clean = stripMarkdown(text);
    let hash = 0;
    for (let i = 0; i < clean.length; i++) {
      hash = ((hash << 5) - hash + clean.charCodeAt(i)) | 0;
    }
    return `read_progress_${subjectId}_${persona ?? ""}_${activeTool ?? "summary"}_${Math.abs(hash)}`;
  }, [text, subjectId, activeTool, persona]);

  const setPlayback = (state: "idle" | "playing" | "paused") => {
    playbackRef.current = state;
    setPlaybackState(state);
  };

  const handlePlayPause = () => {
    if (cooldownRef.current) return;
    cooldownRef.current = true;
    setTimeout(() => {
      cooldownRef.current = false;
    }, 400);

    if (playbackRef.current === "playing") {
      googleTtsPause();
      setPlayback("paused");
      onHighlightChange?.({ active: false, startWord: -1, endWord: -1 });
    } else if (playbackRef.current === "paused") {
      googleTtsResume();
      setPlayback("playing");
      onPlay?.();
      onHighlightChange?.({
        active: true,
        startWord: Math.max(0, lastHighlightRef.current.startWord),
        endWord: Math.max(0, lastHighlightRef.current.endWord),
      });
    } else {
      const clean = stripMarkdown(text);
      if (!clean) {
        cooldownRef.current = false;
        return;
      }
      cleanTextRef.current = clean;
      const savedProgress = Number(
        localStorage.getItem(progressStorageKey) || "0",
      );
      const startChar = Number.isFinite(savedProgress)
        ? Math.max(0, Math.min(clean.length - 1, savedProgress))
        : 0;
      resumeCharRef.current = startChar;
      const ranges: { start: number; end: number }[] = [];
      const re = /\S+/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(clean)) !== null) {
        ranges.push({ start: m.index, end: m.index + m[0].length });
      }
      wordRangesRef.current = ranges;
      const getWordIndexFromChar = (charIndex: number) => {
        if (!ranges.length) return 0;
        for (let i = 0; i < ranges.length; i++) {
          if (charIndex <= ranges[i].end) return i;
        }
        return ranges.length - 1;
      };
      const startWordIdx = getWordIndexFromChar(startChar);
      googleTtsSpeak(
        clean.slice(startChar),
        lang,
        () => {
          setPlayback("playing");
          onPlay?.();
          onHighlightChange?.({
            active: true,
            startWord: Math.max(0, startWordIdx),
            endWord: Math.min(ranges.length - 1, startWordIdx + 2),
          });
          lastHighlightRef.current = {
            startWord: Math.max(0, startWordIdx),
            endWord: Math.min(ranges.length - 1, startWordIdx + 2),
          };
        },
        () => {
          // Only clear saved progress if audio ended naturally (not stopped by persona switch)
          if (!stoppedExternallyRef.current) {
            setPlayback("idle");
            localStorage.removeItem(progressStorageKey);
            resumeCharRef.current = 0;
            onHighlightChange?.({ active: false, startWord: -1, endWord: -1 });
          }
          stoppedExternallyRef.current = false;
        },
        (localCharIndex) => {
          const rangesLocal = wordRangesRef.current;
          if (!rangesLocal.length) return;
          const globalCharIndex = Math.min(
            clean.length,
            resumeCharRef.current + Math.max(0, localCharIndex),
          );
          localStorage.setItem(progressStorageKey, String(globalCharIndex));

          // Find the word at this char position using binary search
          let lo = 0,
            hi = rangesLocal.length - 1,
            idx = 0;
          while (lo <= hi) {
            const mid = (lo + hi) >> 1;
            if (rangesLocal[mid].end < globalCharIndex) {
              lo = mid + 1;
              idx = mid;
            } else if (rangesLocal[mid].start > globalCharIndex) {
              hi = mid - 1;
            } else {
              idx = mid;
              break;
            }
          }

          // Highlight a window of 3 words centered on current position
          const windowStart = Math.max(0, idx);
          const windowEnd = Math.min(rangesLocal.length - 1, idx + 2);

          onHighlightChange?.({
            active: true,
            startWord: windowStart,
            endWord: windowEnd,
          });
          lastHighlightRef.current = {
            startWord: windowStart,
            endWord: windowEnd,
          };
        },
      );
    }
  };

  const handleStop = () => {
    if (cooldownRef.current) return;
    // Manual stop — clear saved progress so next play starts from beginning
    stoppedExternallyRef.current = false;
    googleTtsStop();
    setPlayback("idle");
    localStorage.removeItem(progressStorageKey);
    resumeCharRef.current = 0;
    onHighlightChange?.({ active: false, startWord: -1, endWord: -1 });
  };

  useEffect(() => {
    return () => {
      // Mark as externally stopped so onEnd doesn't clear saved progress
      stoppedExternallyRef.current = true;
      googleTtsStop();
    };
  }, []);

  if (!text) return null;

  return (
    <div className="read-aloud-toolbar-row">
      <div
        className="read-aloud-toolbar-split"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === " " || e.key === "Enter") {
            e.preventDefault();
            handlePlayPause();
          }
          if (e.key.toLowerCase() === "s") {
            e.preventDefault();
            handleStop();
          }
        }}
        aria-label="Read aloud controls"
      >
        {onSwitchTool &&
          (activeTool === "summary" || activeTool === "detailed") && (
            <div className="read-aloud-tool-pill read-aloud-tool-pill--view">
              <button
                type="button"
                className="read-aloud-view-toggle-btn"
                data-label={
                  activeTool === "summary" ? "Detailed view" : "Summary"
                }
                aria-label={
                  activeTool === "summary"
                    ? "Switch to detailed view"
                    : "Switch to summary"
                }
                onClick={() =>
                  onSwitchTool(
                    activeTool === "summary" ? "detailed" : "summary",
                  )
                }
              >
                {activeTool === "summary" ? (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M4 6h16M4 12h10M4 18h14" />
                  </svg>
                ) : (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          )}

        <div className="read-aloud-tool-pill read-aloud-tool-pill--transport">
          <div className="read-aloud-play-cluster">
            <button
              onClick={handlePlayPause}
              className="read-aloud-play-btn"
              type="button"
              aria-label={
                playbackState === "playing" ? "Pause reading" : "Play reading"
              }
              data-label={playbackState === "playing" ? "Pause" : "Read aloud"}
            >
              {playbackState === "playing" ? (
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
                  style={{
                    marginLeft: playbackState === "paused" ? "0" : "2px",
                  }}
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            {playbackState !== "idle" && (
              <button
                onClick={handleStop}
                className="read-aloud-action-btn"
                type="button"
                aria-label="Stop reading"
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
      </div>
    </div>
  );
}
