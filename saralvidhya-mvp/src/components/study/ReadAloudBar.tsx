import React, { useState, useRef, useMemo, useEffect } from "react";
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

/**
 * Preprocesses summary text before reading aloud.
 */
export function preprocessSummaryText(md: string): string {
  if (!md) return "";
  let processed = md;
  // Remove " — Chapter Name" from "Quick Summary — Chapter Name"
  processed = processed.replace(/^(#*\s*(?:Quick|Detailed)\s+Summary)\s*—[^\n]*/im, "$1");
  // Remove Persona line and the following horizontal rule
  processed = processed.replace(/Persona:\s*[^|]*\|[^|]*D_target:[^\n]*\n*(-{3,})?\n*/ig, "");
  return processed;
}

/**
 * Strips markdown from text for reading aloud.
 */
export function stripMarkdown(md: string): string {
  if (!md) return "";
  let t = md;

  // 1. Remove HTML img tags and all HTML tags (including huge base64 data URIs) BEFORE stripping '>'
  t = t.replace(/<img\b[^>]*>/gi, "");
  t = t.replace(/<[^>]+>/g, " ");

  // 2. Remove markdown images: ![alt](url)
  t = t.replace(/!\[[\s\S]*?\]\([\s\S]*?\)/g, "");

  // 3. Remove standalone base64 data URIs if any leaked
  t = t.replace(/data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+/g, "");

  // 4. Drop list bullets / ordered-list numbers — the rendered page doesn't show
  //    them as text, so keeping them would shift the word highlight.
  t = t.replace(/^[ \t]*[-*+][ \t]+/gm, "").replace(/^[ \t]*\d+[.)][ \t]+/gm, "");

  // 5. Standard markdown stripping
  return t
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

/**
 * ReadAloudBar component for text-to-speech functionality.
 */
export default function ReadAloudBar({
  text,
  subjectId,
  persona,
  onPlay,
  onHighlightChange,
  activeTool,
  onSwitchTool,
  isPurpleTheme,
}: {
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
  isPurpleTheme?: boolean;
}) {
  const [playbackState, setPlaybackState] = useState<
    "idle" | "playing" | "paused"
  >("idle");
  const isPurple = isPurpleTheme ?? (subjectId === "dbms" || subjectId.includes("dbms") || subjectId.includes("mlrit"));
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
  const lastSavedTsRef = useRef(0);
  const latestGlobalCharRef = useRef(0);
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
        endWord: Math.max(0, lastHighlightRef.current.startWord),
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
      setPlayback("playing");
      onPlay?.();
      onHighlightChange?.({
        active: true,
        startWord: Math.max(0, startWordIdx),
        endWord: Math.max(0, startWordIdx),
      });
      lastHighlightRef.current = {
        startWord: Math.max(0, startWordIdx),
        endWord: Math.max(0, startWordIdx),
      };
      googleTtsSpeak(
        clean.slice(startChar),
        lang,
        () => {
          setPlayback("playing");
          onPlay?.();
          onHighlightChange?.({
            active: true,
            startWord: Math.max(0, startWordIdx),
            endWord: Math.max(0, startWordIdx),
          });
          lastHighlightRef.current = {
            startWord: Math.max(0, startWordIdx),
            endWord: Math.max(0, startWordIdx),
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
          latestGlobalCharRef.current = globalCharIndex;

          // Throttle synchronous localStorage writes to avoid main-thread jank
          const now = Date.now();
          if (now - lastSavedTsRef.current > 1200) {
            lastSavedTsRef.current = now;
            try {
              localStorage.setItem(progressStorageKey, String(globalCharIndex));
            } catch {}
          }

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

          // Single active word — only notify parent when the active word actually changes
          const windowStart = Math.max(0, idx);
          if (lastHighlightRef.current.startWord !== windowStart) {
            lastHighlightRef.current = {
              startWord: windowStart,
              endWord: windowStart,
            };
            onHighlightChange?.({
              active: true,
              startWord: windowStart,
              endWord: windowStart,
            });
          }
        },
        { raw: true },
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
      // Flush any pending progress before unmount
      if (latestGlobalCharRef.current > 0) {
        try {
          localStorage.setItem(progressStorageKey, String(latestGlobalCharRef.current));
        } catch {}
      }
      // Mark as externally stopped so onEnd doesn't clear saved progress
      stoppedExternallyRef.current = true;
      googleTtsStop();
    };
  }, [progressStorageKey]);

  const durationString = useMemo(() => {
    if (!text) return "3:42";
    const clean = stripMarkdown(text);
    const words = clean.split(/\s+/).filter(Boolean).length;
    if (words === 0) return "3:42";
    // Average speech rate: ~140 words per minute
    const totalSeconds = Math.max(30, Math.round((words / 140) * 60));
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }, [text]);

  if (!text) return null;

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
      }}
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
      <button
        onClick={handlePlayPause}
        type="button"
        className="sv-read-aloud-pill-btn"
        aria-label={playbackState === "playing" ? "Pause reading" : "Read aloud"}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          padding: "6px 16px",
          borderRadius: "999px",
          border: `1.5px solid ${isPurple ? "#8b5cf6" : "#16a34a"}`,
          background: playbackState === "playing"
            ? (isPurple ? "#7c3aed" : "#16a34a")
            : (isPurple ? "rgba(139, 92, 246, 0.04)" : "rgba(22, 163, 74, 0.04)"),
          color: playbackState === "playing"
            ? "#ffffff"
            : (isPurple ? "#7c3aed" : "#16a34a"),
          fontSize: "13px",
          fontWeight: 700,
          cursor: "pointer",
          transition: "all 0.18s ease",
          whiteSpace: "nowrap",
          lineHeight: 1,
          boxShadow: playbackState === "playing"
            ? (isPurple ? "0 2px 10px rgba(124, 58, 237, 0.35)" : "0 2px 10px rgba(22, 163, 74, 0.35)")
            : "none",
        }}
      >
        {/* Headphone icon */}
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ flexShrink: 0 }}
        >
          <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
          <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
        </svg>

        <span>
          {playbackState === "playing"
            ? `Pause · ${durationString}`
            : playbackState === "paused"
            ? `Resume · ${durationString}`
            : `Read Aloud · ${durationString}`}
        </span>
      </button>

      {playbackState !== "idle" && (
        <button
          onClick={handleStop}
          type="button"
          title="Stop reading"
          aria-label="Stop reading"
          style={{
            width: "28px",
            height: "28px",
            borderRadius: "50%",
            border: `1px solid ${isPurple ? "#ddd6fe" : "#bbf7d0"}`,
            background: "#ffffff",
            color: isPurple ? "#7c3aed" : "#16a34a",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            transition: "all 0.15s ease",
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 6h12v12H6z" />
          </svg>
        </button>
      )}
    </div>
  );
}
