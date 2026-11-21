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

export interface ReadingHighlightViewProps {
  content: string;
  active: boolean;
  startWord: number;
  endWord: number;
}

/**
 * Highlights the word currently being read aloud using the readAloudDom pub/sub
 * bus, CSS Custom Highlight API, and a GPU-composited overlay without mutating DOM
 * text nodes or re-rendering parent React trees.
 */
function ReadingHighlightViewInner({
  content,
  active,
  startWord,
  endWord,
}: ReadingHighlightViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const lastScrollTimeRef = useRef<number>(0);
  const lastScrollWordRef = useRef<number>(-1);
  const userScrollPauseUntilRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    return registerReadRoot(el);
  }, []);

  useEffect(() => {
    invalidateReadMap();
    const t = setTimeout(invalidateReadMap, 100);
    const el = containerRef.current;
    const onImgLoad = () => invalidateReadMap();
    el?.addEventListener("load", onImgLoad, true);
    return () => {
      clearTimeout(t);
      el?.removeEventListener("load", onImgLoad, true);
    };
  }, [content]);

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
    const HighlightCtor = (window as any).Highlight;
    const cssHighlights = typeof CSS !== "undefined" ? (CSS as any).highlights : null;
    const hide = () => {
      if (overlay) overlay.style.display = "none";
    };

    if (!state.active || state.startWord < 0) {
      hide();
      if (cssHighlights) {
        cssHighlights.delete("reading-active-word");
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
    if (entry && !entry.node.isConnected) {
      invalidateReadMap();
      snap = getReadSnapshot();
      entry = snap.words[Math.min(state.startWord, snap.words.length - 1)];
    }
    if (!entry || !container.contains(entry.node)) {
      hide();
      return;
    }

    try {
      const range = document.createRange();
      range.setStart(entry.node, Math.min(entry.offset, entry.node.length));
      range.setEnd(entry.node, Math.min(entry.offset + entry.length, entry.node.length));

      if (HighlightCtor && cssHighlights) {
        cssHighlights.set("reading-active-word", new HighlightCtor(range));
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

      // Auto-scroll active word into view
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
      /* Next tick recovers cleanly if range spans transient DOM updates */
    }
  }, []);

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
        className="reading-highlight-overlay"
        style={{
          display: "none",
          willChange: "transform, width, height",
          transition: "transform 65ms linear, width 65ms linear, height 65ms linear",
        }}
        aria-hidden="true"
      />
      <MarkdownView content={content} />
    </div>
  );
}

const ReadingHighlightView = React.memo(ReadingHighlightViewInner);
export default ReadingHighlightView;
