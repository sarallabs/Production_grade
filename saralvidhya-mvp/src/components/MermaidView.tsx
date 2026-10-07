import { useCallback, useRef, useState, useEffect } from 'react';

export interface NodeIcons {
  [label: string]: { hasRead?: boolean; hasVideo?: boolean; hasPodcast?: boolean };
}

interface Props {
  content: string;
  onTopicClick?: (topicLabel: string, action?: 'read' | 'podcast') => void;
  nodeIcons?: NodeIcons;
}

// ─── Mermaid lazy-load ────────────────────────────────────────────────────────
let mermaidReady = false;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mermaidLib: any = null;
async function getMermaid() {
  if (mermaidLib) return mermaidLib;
  try {
    const mod = await import('mermaid');
    mermaidLib = mod.default ?? mod;
    if (!mermaidReady) {
      mermaidLib.initialize({
        startOnLoad: false,
        theme: 'default',
        securityLevel: 'loose',
        logLevel: 5,
        flowchart: {
          useMaxWidth: true,
          htmlLabels: true,      // keep native HTML labels (default) — node size is normal
          nodeSpacing: 50,
          rankSpacing: 70,
          curve: 'basis',
          wrappingWidth: 200,   // auto-wrap long labels so they don't overflow the box
        },
        sequence: { useMaxWidth: true },
      });
      mermaidReady = true;
    }
    return mermaidLib;
  } catch { return null; }
}
void getMermaid();

// ─── Text helpers ─────────────────────────────────────────────────────────────
function stripFences(raw: string) {
  return raw.replace(/^```mermaid\s*/i, '').replace(/^```\s*/m, '').replace(/```\s*$/m, '')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').trim();
}
function cleanLabel(s: string) {
  s = s.trim()
    .replace(/^root\(\((.+?)\)\)$/i, '$1').replace(/^root\((.+?)\)$/i, '$1')
    .replace(/^root\[(.+?)\]$/i, '$1').replace(/^root$/i, '')
    .replace(/^\(\((.+?)\)\)$/, '$1').replace(/^\((.+?)\)$/, '$1')
    .replace(/^\[\[(.+?)\]\]$/, '$1').replace(/^\[(.+?)\]$/, '$1')
    .replace(/^\{(.+?)\}$/, '$1').replace(/^"(.+?)"$/, '$1')
    .replace(/^[-*+]\s+/, '');
  return s.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"').trim();
}

// ─── Tree ─────────────────────────────────────────────────────────────────────
export interface TNode { id: string; label: string; children: TNode[] }

export function buildTree(raw: string): TNode | null {
  const lines = stripFences(raw).split('\n');
  const flat: { depth: number; label: string }[] = [];
  for (const line of lines) {
    const t = line.trim();
    if (!t || /^mindmap$/i.test(t)) continue;
    const depth = Math.floor((line.match(/^(\s*)/)?.[1]?.length ?? 0) / 2);
    const label = cleanLabel(t);
    if (label && depth <= 4) flat.push({ depth, label });
  }
  if (!flat.length) return null;
  const minD = Math.min(...flat.map(n => n.depth));
  let id = 0;
  const mk = (label: string): TNode => ({ id: String(id++), label, children: [] });
  const root = mk(flat[0].label);
  const stack: { node: TNode; depth: number }[] = [{ node: root, depth: minD }];
  for (let i = 1; i < flat.length; i++) {
    const { depth, label } = flat[i];
    const node = mk(label);
    while (stack.length > 1 && stack[stack.length - 1].depth >= depth) stack.pop();
    stack[stack.length - 1].node.children.push(node);
    stack.push({ node, depth });
  }
  return root;
}

// ─── Design tokens — Forest & Sage Palette (matches design) ──────────────────
const ACCENT = '#4F7B64'; // medium forest green
const ACCENT_DIM = '#7BA88B'; // sage green

// Palette matched directly to reference:
// Root: #2D3E36 | Depth 1: #4F7B64 | Depth 2+: #7BA88B
const STYLE = {
  root: { fill: '#2D3E36', stroke: '#23322B', txt: '#FFFFFF', rx: 10, fw: 700, fs: 14 },
  d1: { fill: '#4F7B64', stroke: '#436A55', txt: '#FFFFFF', rx: 10, fw: 600, fs: 12.5 },
  d2: { fill: '#7BA88B', stroke: '#6B977B', txt: '#FFFFFF', rx: 8, fw: 600, fs: 11.5 },
};

const CHAR_W = 7.5;
const LINE_H = 16;
const PAD_X = 20;   // wider horizontal padding for stretched nodes
const PAD_Y = 12;
const ICON_SZ = 16;
const ICON_OFF = 30;   // gap between node right edge and icon
const X_STEP = 480;
const LEAF_H = 80;
const Y_STEP = 260;
const LEAF_W = 250; // Increased to accommodate wider sibling nodes

// ─── Layout types ─────────────────────────────────────────────────────────────
interface LNode {
  id: string; label: string; lines: string[];
  x: number; y: number; w: number; h: number;
  depth: number; children: LNode[];
  hasRead: boolean;
  hasVideo: boolean;
  hasPodcast: boolean;
}

function wrapText(label: string, maxW: number): string[] {
  const maxChars = Math.floor((maxW - PAD_X * 2) / CHAR_W);
  if (label.length <= maxChars) return [label];
  const words = label.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const test = cur ? cur + ' ' + w : w;
    if (test.length <= maxChars) { cur = test; }
    else { if (cur) lines.push(cur); cur = w.length > maxChars ? w.slice(0, maxChars - 1) + '…' : w; }
  }
  if (cur) lines.push(cur);
  return lines.slice(0, 3);
}

function leafCount(n: TNode): number {
  return n.children.length ? n.children.reduce((s, c) => s + leafCount(c), 0) : 1;
}
function maxDepth(n: TNode, d = 0): number {
  return n.children.length ? Math.max(...n.children.map(c => maxDepth(c, d + 1))) : d;
}

function layoutNode(n: TNode, depth: number, xBase: number, yTop: number, nodeIcons: NodeIcons): LNode {
  const hasRead = !!(nodeIcons[n.label]?.hasRead);
  const hasVideo = !!(nodeIcons[n.label]?.hasVideo);
  const hasPodcast = !!(nodeIcons[n.label]?.hasPodcast);

  // Wider node boxes
  const baseMaxW = depth === 0 ? 220 : depth === 1 ? 200 : 160;
  const lines = wrapText(n.label, baseMaxW);
  const textW = Math.max(...lines.map(l => l.length)) * CHAR_W + PAD_X * 2;
  const w = Math.min(baseMaxW, Math.max(textW, depth === 0 ? 160 : depth === 1 ? 140 : 120));
  const h = lines.length * LINE_H + PAD_Y * 2;

  const leaves = leafCount(n);
  const cy = yTop + leaves * LEAF_H / 2;
  const cx = xBase + w / 2;

  let childY = yTop;
  const children = n.children.map(c => {
    const child = layoutNode(c, depth + 1, xBase + X_STEP, childY, nodeIcons);
    childY += leafCount(c) * LEAF_H;
    return child;
  });

  return { id: n.id, label: n.label, lines, x: cx, y: cy, w, h, depth, children, hasRead, hasVideo, hasPodcast };
}

function allNodes(n: LNode): LNode[] { return [n, ...n.children.flatMap(allNodes)]; }
function allEdges(n: LNode): { from: LNode; to: LNode }[] {
  return n.children.flatMap(c => [{ from: n, to: c }, ...allEdges(c)]);
}

function bezier(from: LNode, to: LNode) {
  const x1 = from.x + from.w / 2, y1 = from.y;
  const x2 = to.x - from.w / 2, y2 = to.y;
  const mx = (x1 + x2) / 2;
  return `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`;
}

// ─── Icons ──────────────────────────────────────────────────────────────────
function EyeIcon({ cx, cy, c }: { cx: number; cy: number; c: string }) {
  return (
    <svg x={cx - 7} y={cy - 7} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>
  );
}

function EarIcon({ cx, cy, c }: { cx: number; cy: number; c: string }) {
  return (
    <svg x={cx - 8} y={cy - 8} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 14a9 9 0 0 1 18 0" />
      <rect x="2" y="14" width="4" height="6" rx="2" />
      <rect x="18" y="14" width="4" height="6" rx="2" />
      <path d="M22 17v1a4 4 0 0 1-4 4H12" />
      <circle cx="12" cy="22" r="1" />
    </svg>
  );
}

// ─── Core SVG renderer ────────────────────────────────────────────────────────
function MindMapSVG({ root, onTopicClick, nodeIcons }: {
  root: TNode;
  onTopicClick?: (label: string, action?: 'read' | 'podcast' | 'video') => void;
  nodeIcons: NodeIcons;
}) {
  const PAD = 28;
  const svgW = (maxDepth(root) + 1) * X_STEP + 200 + PAD * 2;
  const svgH = leafCount(root) * LEAF_H + PAD * 2;

  const layoutRoot = layoutNode(root, 0, PAD, PAD, nodeIcons);
  const nodes = allNodes(layoutRoot);
  const edges = allEdges(layoutRoot);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${svgW} ${svgH}`}
      style={{ display: 'block', overflow: 'visible', fontFamily: "'Inter','SF Pro Display',system-ui,sans-serif" }}
    >
      {/* ── Edges ── */}
      {edges.map(({ from, to }) => {
        const edgeColor = to.depth === 1 ? '#4F5D55' : '#68776D';
        const sw = to.depth === 1 ? 1.6 : 1.2;
        return (
          <path
            key={`e${from.id}-${to.id}`}
            d={bezier(from, to)}
            fill="none"
            stroke={edgeColor}
            strokeWidth={sw}
            strokeOpacity={0.8}
          />
        );
      })}

      {/* ── Nodes ── */}
      {nodes.map(node => {
        const isRoot = node.depth === 0;
        const isClickable = !isRoot && !!onTopicClick;
        const isHovered = hoveredId === node.id;
        const st = isRoot ? STYLE.root : node.depth === 1 ? STYLE.d1 : STYLE.d2;

        const totalTxtH = node.lines.length * LINE_H;
        const txtStartY = node.y - totalTxtH / 2 + LINE_H * 0.78;

          const earY = node.y - node.h / 2 + 14;
          const rightEdge = node.x + node.w / 2;
          const earX = rightEdge;
          const eyeX = rightEdge + 16;
          const iconY = node.y;

        const iconFill = '#4F7B64';
        const iconBg = '#FFFFFF';

        const hoverFill = isRoot ? '#23322B' : node.depth === 1 ? '#436A55' : '#6A967A';
        const hoverStroke = isRoot ? '#18241E' : node.depth === 1 ? '#365544' : '#578267';

        return (
          <g key={`node-${node.id}`}>
            {/* Background */}
            <rect
              x={node.x - node.w / 2}
              y={node.y - node.h / 2}
              width={node.w}
              height={node.h}
              rx={st.rx}
              fill={isHovered && isClickable ? hoverFill : st.fill}
              stroke={isHovered && isClickable ? hoverStroke : st.stroke}
              strokeWidth={isHovered ? 2 : 1}
              cursor={isClickable ? 'pointer' : 'default'}
              onClick={() => isClickable && onTopicClick?.(node.label, 'read')}
              onMouseEnter={() => setHoveredId(node.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                transition: 'all 0.2s ease-in-out',
                filter: isHovered
                  ? 'drop-shadow(0 6px 12px rgba(45, 62, 54, 0.22))'
                  : 'drop-shadow(0 2px 5px rgba(45, 62, 54, 0.12))',
              }}
            />

            {/* Text */}
            {node.lines.map((l, i) => (
              <text
                key={i}
                x={node.x}
                y={txtStartY + i * LINE_H}
                fill={st.txt}
                fontSize={st.fs}
                fontWeight={st.fw}
                textAnchor="middle"
                pointerEvents="none"
              >
                {l}
              </text>
            ))}

            {/* Icons */}
            {isClickable && (node.hasVideo || node.hasPodcast) && (
              <g>
                {node.hasVideo && (
                  <g onClick={(e) => { e.stopPropagation(); onTopicClick?.(node.label, 'video'); }} style={{ cursor: 'pointer' }}>
                    <circle cx={eyeX} cy={iconY} r={10} fill={iconBg} />
                    <EyeIcon cx={eyeX} cy={iconY} c={iconFill} />
                  </g>
                )}
                {node.hasPodcast && (
                  <g onClick={(e) => { e.stopPropagation(); onTopicClick?.(node.label, 'podcast'); }} style={{ cursor: 'pointer' }}>
                    <circle cx={earX} cy={earY} r={12} fill={iconBg} stroke={iconFill} strokeWidth={1.5} />
                    <EarIcon cx={earX} cy={earY} c={iconFill} />
                  </g>
                )}
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ─── Zoom / wrapper ───────────────────────────────────────────────────────────
const MIN_Z = 0.3, MAX_Z = 3, STEP = 0.15;

export default function MermaidView({ content, onTopicClick, nodeIcons = {} }: Props) {
  const _ref = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(0.85);
  const [svgHtml, setSvgHtml] = useState<string | null>(null);

  const zoomIn = useCallback(() => setZoom(z => Math.min(MAX_Z, +(z + STEP).toFixed(2))), []);
  const zoomOut = useCallback(() => setZoom(z => Math.max(MIN_Z, +(z - STEP).toFixed(2))), []);
  const reset = useCallback(() => setZoom(1), []);
  const onWheel = useCallback((e: React.WheelEvent) => {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    setZoom(z => e.deltaY < 0 ? Math.min(MAX_Z, +(z + STEP).toFixed(2)) : Math.max(MIN_Z, +(z - STEP).toFixed(2)));
  }, []);

  const isRealMermaid = !!content && /^(graph|flowchart|sequenceDiagram|gantt|classDiagram|stateDiagram|pie|journey|gitGraph)/i.test(content.trim());

  useEffect(() => {
    if (!isRealMermaid || !content) return;
    getMermaid().then(m => {
      if (!m) return;
      const id = 'mm-' + Math.random().toString(36).slice(2, 9);
      m.render(id, content.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&'))
        .then((r: any) => {
          let svg = r.svg as string;
          // Fix: graph TD diagrams get width="100%" from Mermaid.
          // With a tall viewBox (e.g. 0 0 500 1200) that makes the SVG
          // scale to container-width × aspect-ratio → enormous height.
          // Solution: use the viewBox natural pixel dimensions explicitly,
          // then CSS max-width:100%;height:auto handles responsiveness.
          const vbMatch = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
          if (vbMatch) {
            const natW = Math.round(parseFloat(vbMatch[1]));
            const natH = Math.round(parseFloat(vbMatch[2]));
            svg = svg.replace(/\bwidth="[^"]*"/, `width="${natW}"`);
            svg = svg.replace(/\bheight="[^"]*"/, `height="${natH}"`);
          }
          setSvgHtml(svg);
        }).catch(console.error);
    });
  }, [content, isRealMermaid]);

  if (!content) return null;

  let tree: TNode | null = null;
  if (!isRealMermaid) {
    tree = buildTree(content);
    if (!tree) return <p style={{ padding: 24, color: '#94a3b8', fontSize: 13 }}>Diagram unavailable.</p>;
  }

  return (
    <div style={{
      border: '1px solid #EFE4DC',
      borderRadius: 12,
      overflow: 'hidden',
      background: '#FFF6F1',
      fontFamily: "'Inter','SF Pro Display',system-ui,sans-serif",
    }}>
      {/* ── Toolbar ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 16px',
        borderBottom: '1px solid #EFE4DC',
        background: '#FAF1EB',
      }}>
        {/* Left: label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{
            width: 7, height: 7, borderRadius: 2,
            background: ACCENT, flexShrink: 0,
          }} />
          <span style={{
            fontSize: '0.72rem', fontWeight: 600,
            color: '#4F7B64', letterSpacing: '0.04em', textTransform: 'uppercase',
          }}>
            Mind Map
          </span>
          <span style={{ fontSize: '0.68rem', color: '#8A7F77', marginLeft: 4 }}>
            · Ctrl+scroll to zoom · click to read
          </span>
        </div>

        {/* Right: zoom controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {[
            { l: '−', a: zoomOut, off: zoom <= MIN_Z },
            { l: `${Math.round(zoom * 100)}%`, a: reset, off: false },
            { l: '+', a: zoomIn, off: zoom >= MAX_Z },
          ].map(b => (
            <button
              key={b.l}
              onClick={b.a}
              disabled={b.off}
              style={{
                minWidth: 28, height: 24, borderRadius: 5,
                border: '1px solid #E2D5CC',
                background: '#FFFFFF',
                cursor: b.off ? 'not-allowed' : 'pointer',
                fontSize: '0.75rem', fontWeight: 600,
                color: b.off ? '#CBBFB6' : '#45584E',
                fontFamily: 'inherit',
              }}
            >{b.l}</button>
          ))}
        </div>
      </div>

      {/* ── Canvas ── */}
      <div
        ref={_ref}
        onWheel={onWheel}
        style={{
          overflowX: 'auto',
          background: '#FFF6F1',
          padding: '24px 20px 28px',
          cursor: zoom > 1 ? 'grab' : 'default',
          // subtle warm dot grid
          backgroundImage: 'radial-gradient(circle, #EBDDD4 1.2px, transparent 1.2px)',
          backgroundSize: '24px 24px',
          textAlign: 'center',
        }}
      >
        <div style={{
          transform: `scale(${zoom})`,
          transformOrigin: 'top left',
          display: 'inline-block',
          minWidth: '100%',
        }}>
          {isRealMermaid
            ? (svgHtml
              ? <div className="mermaid-clean-render" style={{ overflowX: 'auto', width: '100%' }} dangerouslySetInnerHTML={{ __html: svgHtml }} />
              : <div style={{ padding: 24, color: '#94a3b8', fontSize: 13 }}>Rendering…</div>)
            : (tree && <MindMapSVG root={tree} onTopicClick={onTopicClick} nodeIcons={nodeIcons} />)
          }
        </div>
      </div>
    </div>
  );
}
