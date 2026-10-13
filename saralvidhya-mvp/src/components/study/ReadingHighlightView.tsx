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
  const lastScrolledWordRef = useRef<number>(-1);

  // Pre-built map: wordIndex → { node, offset, length }
  const wordMapRef = useRef<
    Array<{ node: Text; offset: number; length: number }>
  >([]);
  const mapBuiltRef = useRef(false);

  // Build the word map when content renders
  const buildWordMap = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const newMap: Array<{ node: Text; offset: number; length: number }> = [];

    // Collect all text nodes in document order (excluding overlay if any)
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) => {
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        if (parent.classList.contains('reading-highlight-overlay')) {
          return NodeFilter.FILTER_REJECT;
        }
        // Skip content that TTS never speaks (math, code, diagrams, figures, scripts)
        if (parent.closest('.katex, .katex-display, pre, svg, figure, script, style, .mermaid')) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    });

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
        newMap.push({ node, offset: m.index, length: m[0].length });
      }
    }

    if (newMap.length > 0) {
      wordMapRef.current = newMap;
      mapBuiltRef.current = true;
    }
  }, []);

  // Build map when content changes, with a quick follow-up to catch Markdown render passes
  useEffect(() => {
    mapBuiltRef.current = false;
    buildWordMap();
    const timer = setTimeout(buildWordMap, 70);
    return () => clearTimeout(timer);
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

    if (!mapBuiltRef.current || wordMapRef.current.length === 0) {
      buildWordMap();
    }

    const map = wordMapRef.current;
    if (!map.length || !container) return;

    const idx = Math.min(startWord, map.length - 1);
    if (idx < 0 || idx >= map.length) return;

    const startEntry = map[idx];
    if (!startEntry || !startEntry.node.parentNode) {
      buildWordMap();
      return;
    }

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

      // 2. High-performance non-destructive floating overlay box (GPU transform)
      let rect = range.getBoundingClientRect();
      if ((rect.width <= 0 || rect.height <= 0) && startEntry.node.parentElement) {
        rect = startEntry.node.parentElement.getBoundingClientRect();
      }
      if (rect.width > 0 && rect.height > 0 && overlay) {
        const containerRect = container.getBoundingClientRect();
        const top = rect.top - containerRect.top;
        const left = rect.left - containerRect.left;

        overlay.style.display = "block";
        overlay.style.transform = `translate3d(${left - 2}px, ${top - 1}px, 0)`;
        overlay.style.width = `${rect.width + 4}px`;
        overlay.style.height = `${rect.height + 2}px`;

        // Check if current word is inside a table element
        let isInTable = false;
        let parentEl: HTMLElement | null = startEntry.node.parentElement;
        while (parentEl && parentEl !== container) {
          const tag = parentEl.tagName.toUpperCase();
          if (tag === "TABLE" || tag === "TBODY" || tag === "THEAD" || tag === "TR" || tag === "TD" || tag === "TH") {
            isInTable = true;
            break;
          }
          parentEl = parentEl.parentElement;
        }

        // 3. Smooth scroll ONLY when reading progresses past 82% of viewport (reading forward)
        // Suppress auto-scroll while reading inside tables to prevent any coordinate jumps
        const now = Date.now();
        const userIsScrolling = now < userScrollPauseUntilRef.current;
        const timeSinceLastScroll = now - lastScrollTimeRef.current;
        const wordDelta = Math.abs(startWord - lastScrolledWordRef.current);

        if (!isInTable && !userIsScrolling && timeSinceLastScroll >= 3500 && wordDelta >= 10 && startWord >= 12) {
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

            // Only scroll forward if the word has truly reached the bottom area of the viewport
            if (relY > sRect.height * 0.82) {
              const targetScroll = scrollParent.scrollTop + relY - sRect.height * 0.35;
              // Strictly forward/downward scrolling
              if (targetScroll > scrollParent.scrollTop + 10) {
                lastScrolledWordRef.current = startWord;
                lastScrollTimeRef.current = now;
                scrollParent.scrollTo({ top: targetScroll, behavior: "smooth" });
              }
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
        className={`reading-highlight-overlay${isPurpleTheme ? " is-purple" : ""}`}
        style={{ display: "none" }}
        aria-hidden="true"
      />
      <MarkdownView content={content} isPurpleTheme={isPurpleTheme} />
    </div>
  );
}
