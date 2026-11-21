import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  googleTtsSpeak,
  googleTtsStop,
  googleTtsPause,
  googleTtsResume,
} from "@/services/googleTtsService";
import type { ToolId } from "@/components/ToolsMenu";
import {
  getSpeakableDomText,
  getReadSnapshot,
  emitReadHighlight,
} from "@/utils/readAloudDom";

const SUBJECT_LANG: Record<string, string> = {
  pubadm_ur: "ur-PK",
  hindi: "hi-IN",
  telugu: "te-IN",
};

/**
 * Strips markdown, HTML blocks/tags, Mermaid blocks, LaTeX math, and GFM tables
 * in safe order for fallback text-to-speech when no DOM snapshot is mounted.
 */
export function stripMarkdown(md: string): string {
  if (!md) return "";
  let t = md;

  // 1. YAML frontmatter & authoring metadata lines
  t = t.replace(/^---[\s\S]*?---\n*/m, "");
  t = t.replace(/^[#*\s]*(?:Persona|D_target|Word count|Bloom|Alteration)[^\n]*$/gim, "");
  t = t.replace(/\*+(?:Persona|Word count|D_target|D_max)[^*\n]+\*+/gi, "");
  t = t.replace(/Persona:\s*[^|]*\|[^|]*D_target:[^\n]*/gi, "");

  // 2. Mermaid diagrams & fenced code blocks
  t = t.replace(/```mermaid[\s\S]*?```/gi, "");
  t = t.replace(/```[\s\S]*?```/g, "");

  // 3. HTML figures, images, and raw tags (must run before stripping `>` or `*`)
  t = t.replace(/<figure\b[\s\S]*?<\/figure>/gi, "");
  t = t.replace(/<img\b[^>]*>/gi, "");
  t = t.replace(/<[^>]+>/g, " ");

  // 4. Markdown images (must run before markdown links `[text](url)`)
  t = t.replace(/!\[[^\]]*\]\([^)]*\)/g, "");

  // 5. GFM table separator rows & pipes
  t = t.replace(/^[ \t]*\|?[ \t:|-]*---+[ \t:|-]*\|?[ \t]*$/gm, "");
  t = t.replace(/^[ \t]*\|/gm, "").replace(/\|[ \t]*$/gm, "").replace(/\|/g, " ");

  // 6. LaTeX math blocks & commands
  t = t.replace(/\$\$[\s\S]*?\$\$/g, " ");
  t = t.replace(/\$[^$\n]+\$/g, " ");
  t = t.replace(/\\[a-zA-Z]+/g, " ");
  t = t.replace(/[{}]/g, "");

  // 7. Drop list bullets / ordered-list numbers not rendered as text nodes
  t = t.replace(/^[ \t]*[-*+][ \t]+/gm, "").replace(/^[ \t]*\d+[.)][ \t]+/gm, "");

  // 8. Standard markdown syntax stripping
  return t
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
    endWord: 0,
  });
  const stoppedExternallyRef = useRef(false);
  const lastSavedTsRef = useRef(0);
  const latestGlobalCharRef = useRef(0);

  const progressStorageKey = useMemo(() => {
    return `sv_read_aloud_pos_${subjectId}_${persona ?? "intermediate"}_${activeTool ?? "summary"}`;
  }, [subjectId, activeTool, persona]);

  const setPlayback = (state: "idle" | "playing" | "paused") => {
    playbackRef.current = state;
    setPlaybackState(state);
  };

  const handlePlayPause = () => {
    if (cooldownRef.current) return;
    cooldownRef.current = true;
    setTimeout(() => {
      cooldownRef.current = false;
    }, 320);

    if (playbackRef.current === "playing") {
      googleTtsPause();
      setPlayback("paused");
      if (latestGlobalCharRef.current > 0) {
        try {
          localStorage.setItem(progressStorageKey, String(latestGlobalCharRef.current));
        } catch {
          /* ignore */
        }
      }
      emitReadHighlight({ active: false, startWord: -1, endWord: -1 });
      onHighlightChange?.({ active: false, startWord: -1, endWord: -1 });
    } else if (playbackRef.current === "paused") {
      googleTtsResume();
      setPlayback("playing");
      onPlay?.();
      const resumedWord = Math.max(0, lastHighlightRef.current.startWord);
      emitReadHighlight({
        active: true,
        startWord: resumedWord,
        endWord: resumedWord,
      });
      onHighlightChange?.({
        active: true,
        startWord: resumedWord,
        endWord: resumedWord,
      });
    } else {
      const domText = getSpeakableDomText();
      const snap = domText ? getReadSnapshot() : null;
      const clean =
        snap && snap.words.length > 0 ? snap.text : stripMarkdown(text);
      if (!clean) {
        cooldownRef.current = false;
        return;
      }
      cleanTextRef.current = clean;

      let ranges: { start: number; end: number }[] = [];
      if (snap && snap.words.length > 0 && snap.text === clean) {
        ranges = snap.words.map((w) => ({
          start: w.charStart,
          end: w.charEnd,
        }));
      } else {
        const re = /\S+/g;
        let m: RegExpExecArray | null;
        while ((m = re.exec(clean)) !== null) {
          ranges.push({ start: m.index, end: m.index + m[0].length });
        }
      }
      wordRangesRef.current = ranges;

      let startChar = 0;
      try {
        const savedRaw = localStorage.getItem(progressStorageKey);
        if (savedRaw) {
          const parsed = parseInt(savedRaw, 10);
          if (
            Number.isFinite(parsed) &&
            parsed > 0 &&
            parsed < clean.length * 0.92
          ) {
            for (let i = 0; i < ranges.length; i++) {
              if (ranges[i].end >= parsed) {
                startChar = ranges[i].start;
                break;
              }
            }
          }
        }
      } catch {
        /* ignore */
      }

      resumeCharRef.current = startChar;
      latestGlobalCharRef.current = startChar;

      const getWordIndexFromChar = (charIndex: number) => {
        if (!ranges.length) return 0;
        let lo = 0;
        let hi = ranges.length - 1;
        let best = 0;
        while (lo <= hi) {
          const mid = (lo + hi) >> 1;
          if (ranges[mid].end < charIndex) {
            lo = mid + 1;
            best = mid;
          } else if (ranges[mid].start > charIndex) {
            hi = mid - 1;
          } else {
            return mid;
          }
        }
        return Math.min(ranges.length - 1, Math.max(0, best));
      };

      const startWordIdx = getWordIndexFromChar(startChar);
      setPlayback("playing");
      onPlay?.();
      lastHighlightRef.current = {
        startWord: Math.max(0, startWordIdx),
        endWord: Math.max(0, startWordIdx),
      };
      emitReadHighlight({
        active: true,
        startWord: Math.max(0, startWordIdx),
        endWord: Math.max(0, startWordIdx),
      });
      onHighlightChange?.({
        active: true,
        startWord: Math.max(0, startWordIdx),
        endWord: Math.max(0, startWordIdx),
      });

      googleTtsSpeak(
        clean,
        lang,
        () => {
          setPlayback("playing");
          onPlay?.();
          const curWord = Math.max(0, lastHighlightRef.current.startWord);
          emitReadHighlight({
            active: true,
            startWord: curWord,
            endWord: curWord,
          });
        },
        () => {
          if (!stoppedExternallyRef.current) {
            setPlayback("idle");
            try {
              localStorage.removeItem(progressStorageKey);
            } catch {
              /* ignore */
            }
            resumeCharRef.current = 0;
            latestGlobalCharRef.current = 0;
            emitReadHighlight({ active: false, startWord: -1, endWord: -1 });
            onHighlightChange?.({ active: false, startWord: -1, endWord: -1 });
          }
          stoppedExternallyRef.current = false;
        },
        (globalCharIndexFromTts) => {
          const rangesLocal = wordRangesRef.current;
          if (!rangesLocal.length) return;
          const globalCharIndex = Math.min(
            clean.length,
            Math.max(0, globalCharIndexFromTts),
          );
          latestGlobalCharRef.current = globalCharIndex;

          const now = Date.now();
          if (now - lastSavedTsRef.current > 5000) {
            lastSavedTsRef.current = now;
            try {
              localStorage.setItem(progressStorageKey, String(globalCharIndex));
            } catch {
              /* ignore */
            }
          }

          let lo = 0;
          let hi = rangesLocal.length - 1;
          let idx = 0;
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

          const windowStart = Math.max(0, idx);
          const prevWord = lastHighlightRef.current.startWord;
          const isTinyBackJitter =
            windowStart < prevWord && prevWord - windowStart <= 2;
          if (!isTinyBackJitter && prevWord !== windowStart) {
            lastHighlightRef.current = {
              startWord: windowStart,
              endWord: windowStart,
            };
            emitReadHighlight({
              active: true,
              startWord: windowStart,
              endWord: windowStart,
            });
          }
        },
        { raw: true, startCharIndex: startChar },
      );
    }
  };

  const handleStop = () => {
    if (cooldownRef.current) return;
    stoppedExternallyRef.current = false;
    googleTtsStop();
    setPlayback("idle");
    try {
      localStorage.removeItem(progressStorageKey);
    } catch {
      /* ignore */
    }
    resumeCharRef.current = 0;
    latestGlobalCharRef.current = 0;
    emitReadHighlight({ active: false, startWord: -1, endWord: -1 });
    onHighlightChange?.({ active: false, startWord: -1, endWord: -1 });
  };

  useEffect(() => {
    return () => {
      if (latestGlobalCharRef.current > 0) {
        try {
          localStorage.setItem(
            progressStorageKey,
            String(latestGlobalCharRef.current),
          );
        } catch {
          /* ignore */
        }
      }
      stoppedExternallyRef.current = true;
      googleTtsStop();
      emitReadHighlight({ active: false, startWord: -1, endWord: -1 });
    };
  }, [progressStorageKey]);

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
                  activeTool === "summary" ? "In-Depth" : "Essentials"
                }
                aria-label={
                  activeTool === "summary"
                    ? "Switch to In-Depth"
                    : "Switch to Essentials"
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
