import React, { useRef, useEffect, useCallback } from "react";
import MarkdownView from "@/components/MarkdownView";
import {
  registerReadRoot,
  invalidateReadMap,
  getReadSnapshot,
  subscribeReadHighlight,
  getCurrentReadHighlight,
  type ReadHighlightState,
} from "@/utils/readAloudDom";

/**
 * Highlights the word currently being read aloud.
 *
 * Subscribes directly to the zero-re-render `readAloudDom` pub/sub channel so word-by-word
 * progression updates the GPU-composited overlay and CSS Custom Highlight API at 60fps
 * without triggering parent React re-renders across StudyTable or MarkdownView.
 */
function ReadingHighlightViewInner({
  content,
  active,
  startWord,
  endWord,
  isPurpleTheme = false,
}: {
  content: string;
  active: boolean;
  startWord: number;
  endWord: number;
  isPurpleTheme?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const lastScrollTimeRef = useRef<number>(0);
  const lastScrollWordRef = useRef<number>(-1);
  const userScrollPauseUntilRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);

  // Register this container as a read-aloud source (document order handled by the util)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    return registerReadRoot(el);
  }, []);

  // Markdown may finish rendering a tick after mount (images, tables) — refresh the map
  useEffect(() => {
    invalidateReadMap();
    const t = setTimeout(invalidateReadMap, 100);
    return () => clearTimeout(t);
  }, [content]);

  // Pause auto-scroll while the user is manually scrolling/touching
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const scrollParent =
      (container.closest(".st-mainview") as HTMLElement | null) || window;
    const onUser = () => {
      userScrollPauseUntilRef.current = Date.now() + 3000;
    };
    scrollParent.addEventListener("wheel", onUser, { passive: true });
    scrollParent.addEventListener("touchmove", onUser, { passive: true });
    return () => {
      scrollParent.removeEventListener("wheel", onUser);
      scrollParent.removeEventListener("touchmove", onUser);
    };
  }, []);

  const drawHighlight = useCallback((state: ReadHighlightState) => {
    const overlay = overlayRef.current;
    const container = containerRef.current;
    const hide = () => {
      if (overlay) overlay.style.display = "none";
    };

    if (!state.active || state.startWord < 0) {
      hide();
      if (typeof Highlight !== "undefined" && CSS.highlights) {
        CSS.highlights.delete("reading-active-word");
      }
      return;
    }
    if (!container || !overlay) return;

    let snap = getReadSnapshot();
    if (!snap.words.length) {
      hide();
      return;
    }
    const targetIdx = Math.min(state.startWord, snap.words.length - 1);
    let entry = snap.words[targetIdx];
    // Stale snapshot (content re-rendered): rebuild once
    if (entry && !entry.node.isConnected) {
      invalidateReadMap();
      snap = getReadSnapshot();
      entry = snap.words[Math.min(state.startWord, snap.words.length - 1)];
    }
    // Word lives in another section's view — that view draws it
    if (!entry || !container.contains(entry.node)) {
      hide();
      return;
    }

    try {
      const range = document.createRange();
      range.setStart(entry.node, Math.min(entry.offset, entry.node.length));
      range.setEnd(entry.node, Math.min(entry.offset + entry.length, entry.node.length));

      if (typeof Highlight !== "undefined" && CSS.highlights) {
        CSS.highlights.set("reading-active-word", new Highlight(range));
      }

      let rect = range.getBoundingClientRect();
      if ((rect.width <= 0 || rect.height <= 0) && entry.node.parentElement) {
        rect = entry.node.parentElement.getBoundingClientRect();
      }
      if (rect.width <= 0 || rect.height <= 0) {
        hide();
        return;
      }

      const cRect = container.getBoundingClientRect();
      overlay.style.display = "block";
      overlay.style.transform = `translate3d(${(rect.left - cRect.left - 2).toFixed(1)}px, ${(rect.top - cRect.top - 1).toFixed(1)}px, 0)`;
      overlay.style.width = `${(rect.width + 4).toFixed(1)}px`;
      overlay.style.height = `${(rect.height + 2).toFixed(1)}px`;

      // ── Auto-scroll: keep the spoken word comfortably in view ──
      const now = Date.now();
      if (now < userScrollPauseUntilRef.current) return;

      let scrollParent: HTMLElement | null = container.closest(".st-mainview") as HTMLElement | null;
      if (!scrollParent) {
        let p: HTMLElement | null = container.parentElement;
        while (p && p !== document.body && p !== document.documentElement) {
          const oy = window.getComputedStyle(p).overflowY;
          if (oy === "auto" || oy === "scroll") {
            scrollParent = p;
            break;
          }
          p = p.parentElement;
        }
      }
      if (!scrollParent) return;

      const sRect = scrollParent.getBoundingClientRect();
      const relY = rect.top - sRect.top;
      const nearBottom = relY > sRect.height * 0.68;
      const offTop = relY < sRect.height * 0.12;
      if (
        (nearBottom || offTop) &&
        now - lastScrollTimeRef.current > 700 &&
        targetIdx !== lastScrollWordRef.current
      ) {
        lastScrollTimeRef.current = now;
        lastScrollWordRef.current = targetIdx;
        scrollParent.scrollTo({
          top: Math.max(0, scrollParent.scrollTop + relY - sRect.height * 0.32),
          behavior: "smooth",
        });
      }
    } catch {
      /* range may be invalid mid re-render; next tick recovers */
    }
  }, []);

  // Subscribe to direct DOM highlight broadcasts (zero React re-renders per word)
  useEffect(() => {
    const scheduleDraw = (state: ReadHighlightState) => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        drawHighlight(state);
      });
    };

    const initial = getCurrentReadHighlight();
    if (initial.active) {
      scheduleDraw(initial);
    }

    const unsubscribe = subscribeReadHighlight(scheduleDraw);
    return () => {
      unsubscribe();
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [drawHighlight]);

  // Also respond if parent passes explicit props
  useEffect(() => {
    const busState = getCurrentReadHighlight();
    if (busState.active) {
      drawHighlight(busState);
    } else {
      drawHighlight({ active, startWord, endWord });
    }
  }, [active, startWord, endWord, drawHighlight]);

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <div
        ref={overlayRef}
        className={`reading-highlight-overlay${isPurpleTheme ? " is-purple" : ""}`}
        style={{
          display: "none",
          willChange: "transform, width, height",
          transition: "transform 65ms linear, width 65ms linear, height 65ms linear",
        }}
        aria-hidden="true"
      />
      <MarkdownView content={content} isPurpleTheme={isPurpleTheme} disableGlossary={false} />
    </div>
  );
}

const ReadingHighlightView = React.memo(ReadingHighlightViewInner);
export default ReadingHighlightView;
