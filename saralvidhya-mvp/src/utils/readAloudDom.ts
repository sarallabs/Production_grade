/**
 * Read-aloud DOM source.
 *
 * Why this exists: previously the spoken text came from stripping markdown while the
 * highlighter mapped word indices onto the rendered DOM. Any difference between the two
 * (tables, figures, captions, numbering, math, entities...) shifted every later word, so
 * the highlight froze or jumped. Here BOTH the text handed to speech synthesis and the
 * word -> DOM position map are produced by the same single walk over the rendered DOM,
 * so word N in the speech is, by construction, word N on screen.
 */

export interface SpeakWord {
  node: Text;
  offset: number;
  length: number;
  root: HTMLElement;
  word: string;
  charStart: number;
  charEnd: number;
}

export interface ReadHighlightState {
  active: boolean;
  startWord: number;
  endWord: number;
}

interface Snapshot {
  version: number;
  words: SpeakWord[];
  text: string;
}

const roots = new Set<HTMLElement>();
let version = 0;
let cache: Snapshot | null = null;

let currentHighlight: ReadHighlightState = {
  active: false,
  startWord: -1,
  endWord: -1,
};
const highlightListeners = new Set<(state: ReadHighlightState) => void>();

export function emitReadHighlight(next: ReadHighlightState): void {
  if (
    currentHighlight.active === next.active &&
    currentHighlight.startWord === next.startWord &&
    currentHighlight.endWord === next.endWord
  ) {
    return;
  }
  currentHighlight = next;
  highlightListeners.forEach((fn) => {
    try {
      fn(currentHighlight);
    } catch {
      // ignore listener errors
    }
  });
}

export function getCurrentReadHighlight(): ReadHighlightState {
  return currentHighlight;
}

export function subscribeReadHighlight(
  fn: (state: ReadHighlightState) => void,
): () => void {
  highlightListeners.add(fn);
  return () => {
    highlightListeners.delete(fn);
  };
}

const SKIP_SELECTOR =
  '.katex, .katex-display, pre, svg, script, style, button, noscript, [aria-hidden="true"], .reading-highlight-overlay, .sv-no-read, .mermaid';

const BLOCK_TAGS = new Set([
  'P', 'LI', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'TD', 'TH', 'TR', 'DIV', 'FIGCAPTION',
  'BLOCKQUOTE', 'SECTION', 'ARTICLE', 'UL', 'OL', 'TABLE', 'FIGURE', 'DT', 'DD', 'SUMMARY',
]);

/** Register a rendered content container as a read-aloud source. Returns an unregister fn. */
export function registerReadRoot(el: HTMLElement): () => void {
  roots.add(el);
  version++;
  return () => {
    roots.delete(el);
    version++;
  };
}

/** Call when a registered container's rendered content changed. */
export function invalidateReadMap(): void {
  version++;
}

function blockOf(node: Node, root: HTMLElement): Element {
  let el: Element | null = node.parentElement;
  while (el && el !== root && !BLOCK_TAGS.has(el.tagName)) el = el.parentElement;
  return el || root;
}

function build(): Snapshot {
  const ordered = Array.from(roots)
    .filter((r) => r.isConnected)
    .sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));

  const words: SpeakWord[] = [];
  let text = '';
  let lastBlock: Element | null = null;

  for (const root of ordered) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => {
        const parent = n.parentElement;
        if (!parent || !n.nodeValue || !n.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        if (parent.closest(SKIP_SELECTOR)) return NodeFilter.FILTER_REJECT;
        // Not rendered (display:none / collapsed) -> never spoken
        if (parent.getClientRects().length === 0) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });

    let n: Text | null;
    while ((n = walker.nextNode() as Text | null)) {
      const block = blockOf(n, root);
      const re = /\S+/g;
      let m: RegExpExecArray | null;
      const value = n.nodeValue || '';
      while ((m = re.exec(value)) !== null) {
        if (words.length) text += block !== lastBlock ? '\n' : ' ';
        const charStart = text.length;
        const wordStr = m[0];
        text += wordStr;
        const charEnd = text.length;
        words.push({
          node: n,
          offset: m.index,
          length: wordStr.length,
          root,
          word: wordStr,
          charStart,
          charEnd,
        });
        lastBlock = block;
      }
    }
  }

  return { version, words, text };
}

export function getReadSnapshot(): Snapshot {
  if (!cache || cache.version !== version) cache = build();
  return cache;
}

/**
 * Text to hand to speech synthesis, or null when no registered DOM source exists
 * (callers then fall back to markdown stripping).
 */
export function getSpeakableDomText(): string | null {
  if (!roots.size) return null;
  version++; // always re-read the DOM at play time
  const snap = getReadSnapshot();
  return snap.words.length ? snap.text : null;
}
