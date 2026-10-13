import React, { useRef, useCallback, useEffect } from "react";
import MarkdownView from "@/components/MarkdownView";

/**
 * High-performance component to highlight currently read words when using text-to-speech.
 * Uses a non-destructive floating overlay and CSS Custom Highlight API.
 * Never destroys text nodes or runs TreeWalker repeatedly, eliminating freezing and layout thrashing.
 */
export default function ReadingHighlightView({
  content,
  active,
  startWord,
  endWord,
}: {
  content: string;
  active: boolean;
  startWord: number;
  endWord: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const lastScrolledWordRef = useRef<number>(-1);

  // Pre-built map: wordIndex → { node, offset, length }
  const wordMapRef = useRef<
    Array<{ node: Text; offset: number; length: number }>
  >([]);
  const mapBuiltRef = useRef(false);

  // Build the word map ONCE when content renders
  const buildWordMap = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    wordMapRef.current = [];
    mapBuiltRef.current = false;

    // Collect all text nodes in document order
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const textNodes: Text[] = [];
    let n: Text | null;
    while ((n = walker.nextNode() as Text | null)) {
      if (n.textContent && n.textContent.trim().length > 0) {
        textNodes.push(n);
      }
    }

    // Split each text node into words, recording exact character boundaries
    const wordRegex = /\S+/g;
    for (const node of textNodes) {
      const text = node.textContent || "";
      let m: RegExpExecArray | null;
      wordRegex.lastIndex = 0;
      while ((m = wordRegex.exec(text)) !== null) {
        wordMapRef.current.push({ node, offset: m.index, length: m[0].length });
      }
    }
    mapBuiltRef.current = true;
  }, []);

  // Build map immediately when content changes
  useEffect(() => {
    buildWordMap();
  }, [content, buildWordMap]);

  const userScrollPauseUntilRef = useRef<number>(0);
  const lastScrollTimeRef = useRef<number>(0);

  // Attach passive scroll/touch listener to detect user intervention
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const scrollParent = (container.closest('.st-mainview') as HTMLElement | null) || window;

    const onUserInteraction = () => {
      userScrollPauseUntilRef.current = Date.now() + 3500;
    };

    scrollParent.addEventListener('wheel', onUserInteraction, { passive: true });
    scrollParent.addEventListener('touchmove', onUserInteraction, { passive: true });
    return () => {
      scrollParent.removeEventListener('wheel', onUserInteraction);
      scrollParent.removeEventListener('touchmove', onUserInteraction);
    };
  }, []);

  // Update highlight position without DOM destruction
  useEffect(() => {
    const overlay = overlayRef.current;
    const container = containerRef.current;

    if (!active || startWord < 0) {
      if (overlay) overlay.style.display = "none";
      if (typeof Highlight !== "undefined" && CSS.highlights) {
        CSS.highlights.delete("reading-active-word");
      }
      return;
    }

    if (!mapBuiltRef.current) {
      buildWordMap();
    }

    const map = wordMapRef.current;
    if (!map.length || !container) return;

    const idx = Math.min(startWord, map.length - 1);
    if (idx < 0 || idx >= map.length) return;

    const startEntry = map[idx];
    if (!startEntry || !startEntry.node.parentNode) return;

    const endIdx = Math.max(idx, Math.min(endWord, map.length - 1));
    const endEntry = endIdx === idx ? startEntry : map[endIdx];

    try {
      const range = document.createRange();
      range.setStart(startEntry.node, Math.min(startEntry.offset, startEntry.node.length));
      range.setEnd(
        endEntry.node,
        Math.min(endEntry.offset + endEntry.length, endEntry.node.length)
      );

      // 1. Native CSS Custom Highlight API (zero layout recalculation)
      if (typeof Highlight !== "undefined" && CSS.highlights) {
        CSS.highlights.set("reading-active-word", new Highlight(range));
      }

      // 2. High-performance non-destructive floating overlay box
      const rect = range.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0 && overlay) {
        const containerRect = container.getBoundingClientRect();
        const top = rect.top - containerRect.top;
        const left = rect.left - containerRect.left;

        overlay.style.display = "block";
        overlay.style.top = `${top - 1}px`;
        overlay.style.left = `${left - 2}px`;
        overlay.style.width = `${rect.width + 4}px`;
        overlay.style.height = `${rect.height + 2}px`;

        // 3. Smooth scroll within actual scroll parent only when word drifts significantly
        const now = Date.now();
        const userIsScrolling = now < userScrollPauseUntilRef.current;
        const timeSinceLastScroll = now - lastScrollTimeRef.current;
        const wordDelta = Math.abs(startWord - lastScrolledWordRef.current);

        // Only consider auto-scrolling if user isn't manually scrolling, at least 3 seconds have passed,
        // and we have advanced at least 10 words
        if (!userIsScrolling && timeSinceLastScroll >= 3000 && wordDelta >= 10) {
          let scrollParent: HTMLElement | null = container.closest('.st-mainview') as HTMLElement | null;
          if (!scrollParent) {
            let p: HTMLElement | null = container.parentElement;
            while (p && p !== document.body && p !== document.documentElement) {
              const style = window.getComputedStyle(p);
              if (style.overflowY === "auto" || style.overflowY === "scroll") {
                scrollParent = p;
                break;
              }
              p = p.parentElement;
            }
          }

          if (scrollParent) {
            const sRect = scrollParent.getBoundingClientRect();
            const relY = rect.top - sRect.top;

            // Only scroll if:
            // 1. Word is past 78% of the viewport (approaching bottom of container)
            // 2. Word is scrolled above top of viewport (< 30px)
            // NEVER scroll if the word is comfortably in view (between 30px and 78% height)!
            if (relY > sRect.height * 0.78) {
              lastScrolledWordRef.current = startWord;
              lastScrollTimeRef.current = now;
              const targetScroll = scrollParent.scrollTop + relY - sRect.height * 0.35;
              scrollParent.scrollTo({ top: targetScroll, behavior: "smooth" });
            } else if (relY < 30 && scrollParent.scrollTop > 10) {
              lastScrolledWordRef.current = startWord;
              lastScrollTimeRef.current = now;
              const targetScroll = Math.max(0, scrollParent.scrollTop + relY - sRect.height * 0.25);
              scrollParent.scrollTo({ top: targetScroll, behavior: "smooth" });
            }
          }
        }
      }
    } catch {
      // Range calculation fallback
    }
  }, [active, startWord, endWord, buildWordMap]);

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <div
        ref={overlayRef}
        className="reading-highlight-overlay"
        style={{ display: "none" }}
        aria-hidden="true"
      />
      <MarkdownView content={content} />
    </div>
  );
}
