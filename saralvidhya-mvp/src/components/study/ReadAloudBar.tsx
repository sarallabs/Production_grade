import React, { useState, useRef, useMemo, useEffect } from "react";
import {
  googleTtsSpeak,
  googleTtsStop,
  googleTtsPause,
  googleTtsResume,
} from "@/services/googleTtsService";
import type { ToolId } from "@/components/ToolsMenu";
import { getSpeakableDomText } from "@/utils/readAloudDom";
import { cloudStorage } from "@/context/CloudStateContext";
import { stripInlineImageTokens } from "@/utils/inlineImageStore";

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
  let processed = stripInlineImageTokens(md);
  // Remove " — Chapter Name" from "Quick Summary — Chapter Name"
  processed = processed.replace(/^(#*\s*(?:Quick|Detailed)\s+Summary)\s*—[^\n]*/im, "$1");
  // Remove Persona line and the following horizontal rule
  processed = processed.replace(/^[#*\s]*Persona:\s*[^|]*\|[^|]*D_target:[^\n]*\n*(-{3,})?\n*/gim, "");
  processed = processed.replace(/\*+(?:Persona|Word count|D_target|D_max)[^*\n]+\*+/gi, "");
  return processed;
}

/**
 * Strips markdown and metadata from text for accurate text-to-speech reading and highlighting synchronization.
 */
export function stripMarkdown(md: string): string {
  if (!md) return "";
  let t = stripInlineImageTokens(md);

  // 1. Remove YAML frontmatter at document start
  t = t.replace(/^---[\s\S]*?---\n*/m, "");

  // 2. Remove Persona / D_target / Word count metadata lines
  t = t.replace(/^[#*\s]*(?:Persona|D_target|Word count|Bloom|Alteration)[^\n]*$/gmi, "");
  t = t.replace(/\*+(?:Persona|Word count|D_target|D_max)[^*\n]+\*+/gi, "");
  t = t.replace(/Persona:\s*[^|]*\|[^|]*D_target:[^\n]*/gi, "");

  // 3. Remove Mermaid diagrams and code blocks
  t = t.replace(/```mermaid[\s\S]*?```/gi, "");
  t = t.replace(/```[\s\S]*?```/g, "");

  // 4. Remove HTML figure tags, img tags, and all HTML tags
  t = t.replace(/<figure\b[\s\S]*?<\/figure>/gi, "");
  t = t.replace(/<img\b[^>]*>/gi, "");
  t = t.replace(/<[^>]+>/g, " ");

  // 5. Remove markdown images: ![alt](url)
  t = t.replace(/!\[[^\]]*\]\([^)]*\)/g, "");

  // 6. Remove Markdown table separator lines (linear-time per-line check, avoiding nested quantifier ReDoS)
  t = t.replace(/^[ \t]*\|?[ \t:|-]*---+[ \t:|-]*\|?[ \t]*$/gm, "");

  // 7. Clean Markdown table rows: strip outer pipes and turn internal pipes into spaces
  t = t.replace(/^[ \t]*\|/gm, "");
  t = t.replace(/\|[ \t]*$/gm, "");
  t = t.replace(/\|/g, " ");

  // 8. Clean LaTeX math formulas
  t = t.replace(/\$\$[\s\S]*?\$\$/g, " ");
  t = t.replace(/\$[^$\n]+\$/g, " ");
  t = t.replace(/\\[a-zA-Z]+/g, " ");
  t = t.replace(/[{}]/g, "");

  // 9. Drop list bullets / ordered-list numbers — the rendered page doesn't show
  // them as text, so keeping them would shift the word highlight.
  t = t.replace(/^[ \t]*[-*+][ \t]+/gm, "").replace(/^[ \t]*\d+[.)][ \t]+/gm, "");

  // 10. Standard markdown syntax stripping
  t = t
    .replace(/#{1,6}\s*/g, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[>*_~`#]/g, "")
    .replace(/---+/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return t;
}

/**
 * ReadAloudBar component for text-to-speech functionality.
 */
function ReadAloudBarInner({
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
  const isPurple = isPurpleTheme ?? (subjectId === "dbms" || subjectId.includes("dbms"));
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
    let hash = text.length;
    const step = Math.max(1, Math.floor(text.length / 64));
    for (let i = 0; i < text.length; i += step) {
      hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0;
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
      const clean = getSpeakableDomText() ?? stripMarkdown(text);
      if (!clean) {
        cooldownRef.current = false;
        return;
      }
      cleanTextRef.current = clean;
      const startChar = 0;
      resumeCharRef.current = 0;
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
            cloudStorage.removeItem(progressStorageKey);
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

          // Throttle cloudStorage writes to avoid network PATCH amplification during speech
          const now = Date.now();
          if (now - lastSavedTsRef.current > 15000) {
            lastSavedTsRef.current = now;
            try {
              cloudStorage.setItem(progressStorageKey, String(globalCharIndex));
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

          // Single active word. Ignore tiny backward jitter (<=2 words) but always
          // resync on larger corrections so the highlight can never get stuck ahead.
          const windowStart = Math.max(0, idx);
          const prevWord = lastHighlightRef.current.startWord;
          const isTinyBackJitter = windowStart < prevWord && prevWord - windowStart <= 2;
          if (!isTinyBackJitter && prevWord !== windowStart) {
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
    cloudStorage.removeItem(progressStorageKey);
    resumeCharRef.current = 0;
    onHighlightChange?.({ active: false, startWord: -1, endWord: -1 });
  };

  useEffect(() => {
    return () => {
      // Flush any pending progress before unmount
      if (latestGlobalCharRef.current > 0) {
        try {
          cloudStorage.setItem(progressStorageKey, String(latestGlobalCharRef.current));
        } catch {}
      }
      // Mark as externally stopped so onEnd doesn't clear saved progress
      stoppedExternallyRef.current = true;
      googleTtsStop();
    };
  }, [progressStorageKey]);

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
      <style>{`
        .sv-read-aloud-icon-wrap {
          position: relative;
          display: inline-flex;
          align-items: center;
        }
        .sv-read-aloud-tooltip {
          position: absolute;
          top: calc(100% + 6px);
          left: 50%;
          transform: translateX(-50%) translateY(-2px);
          background: #1e293b;
          color: #ffffff;
          font-size: 11.5px;
          font-weight: 600;
          padding: 4px 9px;
          border-radius: 6px;
          white-space: nowrap;
          pointer-events: none;
          opacity: 0;
           transition: opacity 0.15s ease, transform 0.15s ease;
          z-index: 50;
          box-shadow: 0 4px 10px rgba(15, 23, 42, 0.15);
        }
        .sv-read-aloud-icon-wrap:hover .sv-read-aloud-tooltip {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
      `}</style>
      <div className="sv-read-aloud-icon-wrap">
        <button
          onClick={handlePlayPause}
          type="button"
          className="sv-read-aloud-pill-btn"
          aria-label={playbackState === "playing" ? "Pause reading" : "Read Aloud"}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "32px",
            height: "32px",
            padding: 0,
            borderRadius: "50%",
            border: `1.5px solid ${isPurple ? "#8b5cf6" : "#16a34a"}`,
            background: playbackState === "playing"
              ? (isPurple ? "#7c3aed" : "#16a34a")
              : (isPurple ? "rgba(139, 92, 246, 0.06)" : "rgba(22, 163, 74, 0.06)"),
            color: playbackState === "playing"
              ? "#ffffff"
              : (isPurple ? "#7c3aed" : "#16a34a"),
            cursor: "pointer",
            transition: "all 0.18s ease",
            lineHeight: 1,
            boxShadow: playbackState === "playing"
              ? (isPurple ? "0 2px 10px rgba(124, 58, 237, 0.35)" : "0 2px 10px rgba(22, 163, 74, 0.35)")
              : "none",
          }}
        >
          {/* Speaker / Read Aloud symbol */}
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
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          </svg>
        </button>
        <span className="sv-read-aloud-tooltip">
          {playbackState === "playing"
            ? "Pause Read Aloud"
            : playbackState === "paused"
            ? "Resume Read Aloud"
            : "Read Aloud"}
        </span>
      </div>

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

const ReadAloudBar = React.memo(ReadAloudBarInner);
export default ReadAloudBar;
