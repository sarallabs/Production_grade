import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import MermaidView, { buildTree, type NodeIcons, type TNode } from './MermaidView';

/**
 * Read-only MindMeister-style mind map.
 * Port of the engine in src/incoming/mindmap.js (balanced left/right branches,
 * coloured bezier edges, pan/zoom, fit, collapse) — editing features removed.
 */

interface Props {
  content: string;
  onTopicClick?: (topicLabel: string, action?: 'read' | 'podcast' | 'video') => void;
  nodeIcons?: NodeIcons;
}

// Brand node levels palette
const LEVEL_0_BG = '#2D3E36';
const LEVEL_1_BG = '#4F7B64';
const LEVEL_2_BG = '#7BA88B';

const ROOT_BG = LEVEL_0_BG;
const H_GAP = 96;
const V_GAP = 36;
const UNIFORM_NODE_W = 236;
const UNIFORM_NODE_H = 56;
const MAX_LABEL_W = 204;
const MIN_Z = 0.2, MAX_Z = 3;
const FONT = "'Inter','SF Pro Display',system-ui,sans-serif";
const ICON_W = 22;

interface LNode {
  id: string; label: string; lines: string[];
  depth: number; side: 'l' | 'r'; color: string;
  w: number; h: number; x: number; y: number; sub: number;
  parentId: string | null; hasKids: boolean; collapsed: boolean; kidCount: number;
  hasVideo: boolean; hasPodcast: boolean;
}

let _ctx: CanvasRenderingContext2D | null = null;
function measure(text: string, font: string): number {
  if (!_ctx) _ctx = document.createElement('canvas').getContext('2d');
  if (!_ctx) return text.length * 7;
  _ctx.font = font;
  return _ctx.measureText(text).width;
}

function styleFor(depth: number) {
  if (depth === 0) return { font: `700 16px ${FONT}`, px: 24, py: 12, extra: 0 };
  if (depth === 1) return { font: `600 13.5px ${FONT}`, px: 16, py: 8, extra: 0 };
  return { font: `500 13px ${FONT}`, px: 14, py: 8, extra: 2 };
}

function wrap(label: string, font: string, maxW: number): string[] {
  const words = label.split(/\s+/);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const t = cur ? cur + ' ' + w : w;
    if (cur && measure(t, font) > maxW) { lines.push(cur); cur = w; } else cur = t;
  }
  if (cur) lines.push(cur);
  return lines;
}

function weight(n: TNode, collapsed: Set<string>): number {
  return 1 + (collapsed.has(n.id) ? 0 : n.children.reduce((a, c) => a + weight(c, collapsed), 0));
}

function computeLayout(root: TNode, collapsed: Set<string>, icons: NodeIcons) {
  const map = new Map<string, LNode>();
  const kidsOf = new Map<string, LNode[]>();

  // balance first-level branches left/right by size
  let r = 0, l = 0;
  const sideOf = new Map<string, 'l' | 'r'>();
  root.children.forEach(c => {
    const s: 'l' | 'r' = r <= l ? 'r' : 'l';
    sideOf.set(c.id, s);
    if (s === 'r') r += weight(c, collapsed); else l += weight(c, collapsed);
  });

  const walk = (n: TNode, parentId: string | null, depth: number, side: 'l' | 'r', color: string, idx: number) => {
    if (depth === 1) {
      side = sideOf.get(n.id) || 'r';
      color = LEVEL_1_BG;
    } else if (depth >= 2) {
      color = LEVEL_2_BG;
    }
    const st = styleFor(depth);
    const maxW = depth === 1 ? UNIFORM_NODE_W - st.px * 2 : MAX_LABEL_W;
    const lines = wrap(n.label, st.font, maxW);
    const textW = Math.max(...lines.map(s => measure(s, st.font)));
    const ic = icons[n.label] || icons[n.label.toLowerCase()] || {};
    const hasVideo = depth > 0 && !!ic.hasVideo, hasPodcast = depth > 0 && !!ic.hasPodcast;
    // For depth 1: uniform size! Icons sit outside the box so they do not add to w.
    const w = depth === 1 ? UNIFORM_NODE_W : depth === 0 ? Math.max(190, Math.ceil(textW) + st.px * 2) : Math.ceil(textW) + st.px * 2;
    const h = depth === 1 ? UNIFORM_NODE_H : Math.ceil(lines.length * (st.font.includes('16px') ? 22 : 18)) + st.py * 2 + st.extra;
    const isCol = collapsed.has(n.id);
    map.set(n.id, {
      id: n.id, label: n.label, lines, depth, side, color, w, h, x: 0, y: 0, sub: 0, parentId,
      hasKids: n.children.length > 0, collapsed: isCol, kidCount: n.children.length, hasVideo, hasPodcast,
    });
    const ks: LNode[] = [];
    if (!isCol) n.children.forEach((c, i) => { walk(c, n.id, depth + 1, side, color, i); ks.push(map.get(c.id)!); });
    kidsOf.set(n.id, ks);
  };
  walk(root, null, 0, 'r', ROOT_BG, 0);

  const sumH = (ks: LNode[]) => ks.reduce((a, k) => a + k.sub, 0) + V_GAP * Math.max(0, ks.length - 1);
  const sub = (m: LNode): number => {
    const ks = kidsOf.get(m.id)!;
    ks.forEach(sub);
    m.sub = Math.max(m.h, sumH(ks));
    return m.sub;
  };
  const place = (m: LNode, edge: number, cy: number, side: 'l' | 'r') => {
    m.x = side === 'r' ? edge : edge - m.w;
    m.y = cy - m.h / 2;
    const ks = kidsOf.get(m.id)!;
    let y = cy - sumH(ks) / 2;
    ks.forEach(k => {
      place(k, side === 'r' ? m.x + m.w + H_GAP : m.x - H_GAP, y + k.sub / 2, side);
      y += k.sub + V_GAP;
    });
  };
  const rm = map.get(root.id)!;
  rm.x = -rm.w / 2; rm.y = -rm.h / 2;
  for (const side of ['r', 'l'] as const) {
    const ks = kidsOf.get(root.id)!.filter(k => k.side === side);
    ks.forEach(sub);
    let y = -sumH(ks) / 2;
    ks.forEach(k => {
      place(k, side === 'r' ? rm.x + rm.w + H_GAP : rm.x - H_GAP, y + k.sub / 2, side);
      y += k.sub + V_GAP;
    });
  }

  const nodes = Array.from(map.values());
  const edges = nodes.filter(m => m.parentId).map(m => {
    const p = map.get(m.parentId!)!;
    const rt = m.side === 'r';
    const x1 = rt ? p.x + p.w : p.x;
    const y1 = p.y + p.h / 2;
    const x2 = rt ? m.x : m.x + m.w;
    const y2 = m.y + m.h / 2;
    const mx = (x1 + x2) / 2;
    return {
      id: m.id, color: m.color, sw: m.depth === 1 ? 4 : 2.5,
      d: `M${x1} ${y1}C${mx} ${y1} ${mx} ${y2} ${x2} ${y2}`,
    };
  });
  return { nodes, edges };
}

const EyeSvg = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" /><circle cx="12" cy="12" r="3" />
  </svg>
);
const EarSvg = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 18v-6a9 9 0 0 1 18 0v6" /><path d="M21 19a2 2 0 0 1-2 2h-1v-6h3zM3 19a2 2 0 0 0 2 2h1v-6H3z" />
  </svg>
);

export default function MindMapView({ content, onTopicClick, nodeIcons = {} }: Props) {
  const isRealMermaid = !!content && /^(graph|flowchart|sequenceDiagram|gantt|classDiagram|stateDiagram|pie|journey|gitGraph)/i.test(content.trim());
  const tree = useMemo(() => (!content || isRealMermaid ? null : buildTree(content)), [content, isRealMermaid]);

  const boxRef = useRef<HTMLDivElement>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [view, setView] = useState({ x: 0, y: 0, k: 1 });
  const viewRef = useRef(view);
  viewRef.current = view;
  const pan = useRef<{ sx: number; sy: number; vx: number; vy: number; moved: boolean } | null>(null);
  const [panning, setPanning] = useState(false);
  const [hover, setHover] = useState<string | null>(null);

  const layout = useMemo(() => (tree ? computeLayout(tree, collapsed, nodeIcons) : null), [tree, collapsed, nodeIcons]);

  const fit = useCallback(() => {
    const el = boxRef.current;
    if (!el || !layout) return;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    layout.nodes.forEach(m => {
      const extraLeft = (!m.depth ? 0 : (m.side === 'l' && (m.hasVideo || m.hasPodcast) ? 44 : 0));
      const extraRight = (!m.depth ? 0 : (m.side === 'r' && (m.hasVideo || m.hasPodcast) ? 44 : 0));
      x0 = Math.min(x0, m.x - extraLeft); y0 = Math.min(y0, m.y);
      x1 = Math.max(x1, m.x + m.w + extraRight); y1 = Math.max(y1, m.y + m.h);
    });
    const r = el.getBoundingClientRect();
    const pad = 48;
    const k = Math.max(MIN_Z, Math.min(1, (r.width - pad * 2) / (x1 - x0), (r.height - pad * 2) / (y1 - y0)));
    setView({ k, x: r.width / 2 - ((x0 + x1) / 2) * k, y: r.height / 2 - ((y0 + y1) / 2) * k });
  }, [layout]);

  // Fit when the tree itself changes (not on every collapse toggle)
  useLayoutEffect(() => { setCollapsed(new Set()); }, [tree]);
  useLayoutEffect(() => { fit(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [tree]);

  const zoomBy = useCallback((f: number, cx?: number, cy?: number) => {
    const el = boxRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = cx ?? r.width / 2, py = cy ?? r.height / 2;
    setView(v => {
      const k = Math.min(MAX_Z, Math.max(MIN_Z, v.k * f));
      const s = k / v.k;
      return { k, x: px - (px - v.x) * s, y: py - (py - v.y) * s };
    });
  }, []);

  // Non-passive wheel: ctrl/cmd = zoom, plain wheel = pan
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      if (e.ctrlKey || e.metaKey) {
        zoomBy(Math.exp(-e.deltaY * 0.01), e.clientX - r.left, e.clientY - r.top);
      } else {
        setView(v => ({ ...v, x: v.x - e.deltaX, y: v.y - e.deltaY }));
      }
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [zoomBy, tree]);

  const onDown = (e: React.PointerEvent) => {
    if (e.button !== 0 || (e.target as HTMLElement).closest('[data-node]')) return;
    pan.current = { sx: e.clientX, sy: e.clientY, vx: viewRef.current.x, vy: viewRef.current.y, moved: false };
    setPanning(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    const p = pan.current;
    if (!p) return;
    p.moved = true;
    setView(v => ({ ...v, x: p.vx + e.clientX - p.sx, y: p.vy + e.clientY - p.sy }));
  };
  const onUp = () => { pan.current = null; setPanning(false); };

  const toggle = (id: string) => setCollapsed(prev => {
    const n = new Set(prev);
    if (n.has(id)) n.delete(id); else n.add(id);
    return n;
  });

  if (!content) return null;
  if (isRealMermaid) return <MermaidView content={content} onTopicClick={onTopicClick} nodeIcons={nodeIcons} />;
  if (!tree || !layout) return <p style={{ padding: 24, color: '#94a3b8', fontSize: 13 }}>Diagram unavailable.</p>;

  const tbBtn: React.CSSProperties = {
    minWidth: 28, height: 26, borderRadius: 6, border: '1px solid #E2D5CC', background: '#FFFFFF',
    cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, color: '#45584E', fontFamily: 'inherit', padding: '0 8px',
  };

  return (
    <div style={{ border: '1px solid #EFE4DC', borderRadius: 12, overflow: 'hidden', background: '#FFF6F1', fontFamily: FONT }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', borderBottom: '1px solid #EFE4DC', background: '#FAF1EB' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{ width: 7, height: 7, borderRadius: 2, background: '#4F7B64' }} />
          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#4F7B64', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Mind Map</span>
          <span style={{ fontSize: '0.68rem', color: '#8A7F77', marginLeft: 4 }}>· drag to pan · scroll to move · Ctrl+scroll to zoom · click to read</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button style={tbBtn} onClick={() => zoomBy(1 / 1.25)} aria-label="Zoom out">−</button>
          <button style={tbBtn} onClick={fit} aria-label="Fit to screen">{Math.round(view.k * 100)}% · Fit</button>
          <button style={tbBtn} onClick={() => zoomBy(1.25)} aria-label="Zoom in">+</button>
        </div>
      </div>

      <div
        ref={boxRef}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        style={{
          position: 'relative', height: 'min(72vh, 680px)', minHeight: 440, overflow: 'hidden', touchAction: 'none',
          userSelect: 'none', cursor: panning ? 'grabbing' : 'grab',
          backgroundImage: 'radial-gradient(circle, #EBDDD4 1.2px, transparent 1.2px)',
          backgroundSize: `${24 * view.k}px ${24 * view.k}px`,
          backgroundPosition: `${view.x}px ${view.y}px`,
        }}
      >
        <div style={{ position: 'absolute', left: 0, top: 0, transformOrigin: '0 0', transform: `translate(${view.x}px, ${view.y}px) scale(${view.k})` }}>
          <svg width="1" height="1" style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none' }}>
            {layout.edges.map(e => (
              <path key={e.id} d={e.d} stroke={e.color} strokeWidth={e.sw} fill="none" strokeLinecap="round" opacity={0.85} />
            ))}
          </svg>

          {layout.nodes.map(m => {
            const isRoot = m.depth === 0;
            const clickable = !isRoot && !!onTopicClick;
            const st = styleFor(m.depth);
            const hov = hover === m.id && clickable;
            const base: React.CSSProperties = {
              position: 'absolute', left: m.x, top: m.y, width: m.w, height: m.h, boxSizing: 'border-box',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              font: st.font, lineHeight: '18px',
              cursor: clickable ? 'pointer' : 'default', transition: 'box-shadow .2s ease, filter .2s ease, transform .2s ease',
            };
            if (isRoot) Object.assign(base, {
              background: LEVEL_0_BG, color: '#fff', borderRadius: 16, padding: `0 ${st.px}px`,
              boxShadow: '0 6px 16px rgba(45,62,54,.28)',
            });
            else if (m.depth === 1) Object.assign(base, {
              background: LEVEL_1_BG, color: '#fff', borderRadius: 14, padding: `0 ${st.px}px`,
              boxShadow: hov ? '0 8px 20px rgba(45,62,54,.32)' : '0 3px 10px rgba(45,62,54,.18)',
              filter: hov ? 'brightness(.93)' : 'none',
              transform: hov ? 'scale(1.02)' : 'none',
            });
            else Object.assign(base, {
              background: LEVEL_2_BG, color: '#fff', borderRadius: 10, padding: `0 ${st.px}px`,
              boxShadow: hov ? '0 6px 16px rgba(45,62,54,.25)' : '0 2px 8px rgba(45,62,54,.14)',
              filter: hov ? 'brightness(.95)' : 'none',
              transform: hov ? 'scale(1.02)' : 'none',
            });

            const isRightSide = m.side === 'r';
            const toggleOnRight = isRightSide;
            return (
              <div
                key={m.id}
                data-node
                style={base}
                onMouseEnter={() => setHover(m.id)}
                onMouseLeave={() => setHover(null)}
                onClick={() => { if (clickable && !pan.current?.moved) onTopicClick?.(m.label, 'read'); }}
              >
                <span
                  style={{
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    textAlign: 'center',
                    width: '100%',
                    lineHeight: '18px',
                    userSelect: 'none',
                  }}
                >
                  {m.lines.join('\n')}
                </span>

                {/* Action icon: earphone tab as seamless extension of the node */}
                {m.hasPodcast && (
                  <span
                    style={{
                      position: 'absolute',
                      top: 4,
                      [isRightSide ? 'right' : 'left']: -20,
                      display: 'inline-flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4,
                      zIndex: 5,
                    }}
                  >
                    <button
                      type="button"
                      title="Listen to podcast"
                      aria-label="Listen to podcast"
                      onClick={(e) => { e.stopPropagation(); onTopicClick?.(m.label, 'podcast'); }}
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: isRightSide ? '0 12px 12px 0' : '12px 0 0 12px',
                        border: 'none',
                        background: m.color,
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        padding: 0,
                        boxShadow: isRightSide ? '2px 2px 6px rgba(45,62,54,.25)' : '-2px 2px 6px rgba(45,62,54,.25)',
                        transition: 'all .2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.filter = 'brightness(1.18)';
                        e.currentTarget.style.transform = isRightSide ? 'translateX(2px)' : 'translateX(-2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.filter = 'none';
                        e.currentTarget.style.transform = 'none';
                      }}
                    >
                      <EarSvg />
                    </button>
                  </span>
                )}

                {!isRoot && m.hasKids && (
                  <button
                    type="button"
                    aria-label={m.collapsed ? 'Expand' : 'Collapse'}
                    onClick={(e) => { e.stopPropagation(); toggle(m.id); }}
                    style={{
                      position: 'absolute',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      [toggleOnRight ? 'right' : 'left']: -22,
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      border: '1px solid #CFC3BA',
                      background: '#fff',
                      fontSize: 10,
                      fontWeight: 700,
                      lineHeight: 1,
                      color: '#45584E',
                      cursor: 'pointer',
                      padding: 0,
                      boxShadow: '0 1px 2px rgba(0,0,0,.12)',
                      opacity: m.collapsed || hov ? 1 : 0.55,
                    } as React.CSSProperties}
                  >
                    {m.collapsed ? m.kidCount : '−'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
