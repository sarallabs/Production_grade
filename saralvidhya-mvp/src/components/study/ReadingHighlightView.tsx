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

  // Build map when content changes
  useEffect(() => {
    mapBuiltRef.current = false;
    const timer = setTimeout(buildWordMap, 60);
    return () => clearTimeout(timer);
  }, [content, buildWordMap]);

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
        const top = rect.top - containerRect.top + container.scrollTop;
        const left = rect.left - containerRect.left + container.scrollLeft;

        overlay.style.display = "block";
        overlay.style.top = `${top - 1}px`;
        overlay.style.left = `${left - 2}px`;
        overlay.style.width = `${rect.width + 4}px`;
        overlay.style.height = `${rect.height + 2}px`;

        // 3. Smooth scroll when word drifts outside comfortable middle view (throttled)
        if (Math.abs(startWord - lastScrolledWordRef.current) >= 2) {
          const vh = window.innerHeight || 800;
          if (rect.top < vh * 0.25 || rect.bottom > vh * 0.75) {
            lastScrolledWordRef.current = startWord;
            const scrollTarget = window.scrollY + rect.top - vh * 0.45;
            window.scrollTo({ top: scrollTarget, behavior: "smooth" });
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
