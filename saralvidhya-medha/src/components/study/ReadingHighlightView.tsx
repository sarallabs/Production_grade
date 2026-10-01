import React, { useRef, useEffect, useCallback } from "react";
import MarkdownView from "@/components/MarkdownView";

export interface ReadingHighlightViewProps {
  content: string;
  active: boolean;
  startWord: number;
  endWord: number;
}

export default function ReadingHighlightView({
  content,
  active,
  startWord,
  endWord,
}: ReadingHighlightViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lastMarkRef = useRef<HTMLElement | null>(null);
  // Pre-built map: wordIndex → { node, nodeOffset, length }
  const wordMapRef = useRef<
    Array<{ node: Text; offset: number; length: number }>
  >([]);
  const mapBuiltRef = useRef(false);

  // Build the word map once after content renders
  const buildWordMap = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    wordMapRef.current = [];
    mapBuiltRef.current = false;

    // Collect all text nodes in document order
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const textNodes: Text[] = [];
    let n: Text | null;
    while ((n = walker.nextNode() as Text | null)) textNodes.push(n);

    // Walk through text nodes and split into words, recording exact position
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

  // Rebuild map when content changes (after MarkdownView re-renders)
  useEffect(() => {
    // Small delay to let MarkdownView finish rendering
    const timer = setTimeout(buildWordMap, 50);
    return () => clearTimeout(timer);
  }, [content, buildWordMap]);

  // Highlight the current word range
  useEffect(() => {
    if (!active) return;
    if (!mapBuiltRef.current) {
      buildWordMap();
    }

    const map = wordMapRef.current;
    if (!map.length || startWord < 0) return;

    // Remove previous mark
    if (lastMarkRef.current) {
      const m = lastMarkRef.current;
      const parent = m.parentNode;
      if (parent) {
        // Restore original text node
        const textNode = document.createTextNode(m.textContent || "");
        parent.replaceChild(textNode, m);
        parent.normalize();
        // After normalize, the map is stale — rebuild on next call
        mapBuiltRef.current = false;
      }
      lastMarkRef.current = null;
    }

    // Rebuild map if stale (after previous mark removal)
    if (!mapBuiltRef.current) buildWordMap();

    const freshMap = wordMapRef.current;
    const idx = Math.min(startWord, freshMap.length - 1);
    if (idx < 0 || idx >= freshMap.length) return;

    const startEntry = freshMap[idx];
    if (!startEntry || !startEntry.node.parentNode) return;

    // Span up to 3 words
    const endIdx = Math.min(idx + 2, freshMap.length - 1);
    const endEntry = freshMap[endIdx];

    try {
      // If all words are in the same text node, wrap them all in one mark
      if (startEntry.node === endEntry.node) {
        const range = document.createRange();
        range.setStart(startEntry.node, startEntry.offset);
        range.setEnd(endEntry.node, endEntry.offset + endEntry.length);
        const mark = document.createElement("mark");
        mark.className = "reading-mark reading-phrase-active";
        range.surroundContents(mark);
        lastMarkRef.current = mark;
        mapBuiltRef.current = false;
        mark.scrollIntoView({ behavior: "smooth", block: "nearest" });
      } else {
        // Words span different nodes — wrap just the first word
        const range = document.createRange();
        range.setStart(startEntry.node, startEntry.offset);
        range.setEnd(startEntry.node, startEntry.offset + startEntry.length);
        const mark = document.createElement("mark");
        mark.className = "reading-mark reading-phrase-active";
        range.surroundContents(mark);
        lastMarkRef.current = mark;
        mapBuiltRef.current = false;
        mark.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    } catch {
      // surroundContents can fail if range crosses element boundaries — skip
    }
  }, [active, startWord, endWord, buildWordMap]);

  // Cleanup when inactive
  useEffect(() => {
    if (active) return;
    if (lastMarkRef.current) {
      const m = lastMarkRef.current;
      const parent = m.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(m.textContent || ""), m);
        parent.normalize();
      }
      lastMarkRef.current = null;
      mapBuiltRef.current = false;
    }
  }, [active]);

  return (
    <div ref={containerRef}>
      <MarkdownView content={content} />
    </div>
  );
}
