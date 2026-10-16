import React, { useRef, useEffect } from "react";
import MarkdownView from "@/components/MarkdownView";
import {
  registerReadRoot,
  invalidateReadMap,
  getReadSnapshot,
} from "@/utils/readAloudDom";

/**
 * Highlights the word currently being read aloud.
 *
 * `startWord` / `endWord` are GLOBAL word indices into the read-aloud DOM snapshot
 * (see utils/readAloudDom). The speech text is generated from the very same snapshot,
 * so the index always lands on the word being spoken. Several instances (one per
 * section) can coexist; only the instance that contains the target word draws.
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

  // Register this container as a read-aloud source (document order handled by the util)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    return registerReadRoot(el);
  }, []);

  // Markdown may finish rendering a tick after mount (images, tables) — refresh the map
  useEffect(() => {
    invalidateReadMap();
    const t = setTimeout(invalidateReadMap, 120);
    return () => clearTimeout(t);
  }, [content]);

  // Pause auto-scroll while the user is scrolling/touching
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const scrollParent =
      (container.closest(".st-mainview") as HTMLElement | null) || window;
    const onUser = () => {
      userScrollPauseUntilRef.current = Date.now() + 3500;
    };
    scrollParent.addEventListener("wheel", onUser, { passive: true });
    scrollParent.addEventListener("touchmove", onUser, { passive: true });
    return () => {
      scrollParent.removeEventListener("wheel", onUser);
      scrollParent.removeEventListener("touchmove", onUser);
    };
  }, []);

  useEffect(() => {
    const overlay = overlayRef.current;
    const container = containerRef.current;
    const hide = () => {
      if (overlay) overlay.style.display = "none";
    };

    if (!active || startWord < 0) {
      hide();
      if (typeof Highlight !== "undefined" && CSS.highlights) {
        CSS.highlights.delete("reading-active-word");
      }
      return;
    }
    if (!container || !overlay) return;

    let snap = getReadSnapshot();
    let entry = snap.words[Math.min(startWord, snap.words.length - 1)];
    // Stale snapshot (content re-rendered): rebuild once
    if (entry && !entry.node.isConnected) {
      invalidateReadMap();
      snap = getReadSnapshot();
      entry = snap.words[Math.min(startWord, snap.words.length - 1)];
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
      overlay.style.transform = `translate3d(${rect.left - cRect.left - 2}px, ${rect.top - cRect.top - 1}px, 0)`;
      overlay.style.width = `${rect.width + 4}px`;
      overlay.style.height = `${rect.height + 2}px`;

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
      const nearBottom = relY > sRect.height * 0.8;
      const offTop = relY < 0;
      // Throttle, and ignore tiny index changes so table rows never cause twitching
      if (
        (nearBottom || offTop) &&
        now - lastScrollTimeRef.current > 1200 &&
        startWord !== lastScrollWordRef.current
      ) {
        lastScrollTimeRef.current = now;
        lastScrollWordRef.current = startWord;
        scrollParent.scrollTo({
          top: scrollParent.scrollTop + relY - sRect.height * 0.3,
          behavior: "smooth",
        });
      }
    } catch {
      /* range may be invalid mid re-render; next tick recovers */
    }
  }, [active, startWord, endWord]);

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <div
        ref={overlayRef}
        className={`reading-highlight-overlay${isPurpleTheme ? " is-purple" : ""}`}
        style={{ display: "none" }}
        aria-hidden="true"
      />
      <MarkdownView content={content} isPurpleTheme={isPurpleTheme} />
    </div>
  );
}

const ReadingHighlightView = React.memo(ReadingHighlightViewInner);
export default ReadingHighlightView;
