import { useEffect, useRef } from 'react';
import 'jsmind/style/jsmind.css';
// @ts-ignore
import jsMind from 'jsmind';

interface Props {
  content: string;
  onTopicClick?: (topicId: string, topicName: string) => void;
  onActionClick?: (action: 'video' | 'podcast', topicId: string, topicName: string) => void;
  toolbarHint?: string;
}

const EYE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>`;
const EAR_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8.5a6.5 6.5 0 1 1 13 0c0 6-6 6-6 10a3.5 3.5 0 1 1-7 0"/><path d="M15 8.5a2.5 2.5 0 0 0-5 0v1a2 2 0 1 1 0 4"/></svg>`;

function decorateTopic(label: string, depth: number) {
  if (depth === 0) return label; // no icons for root
  return `
    <div class="node-content">
      <span class="node-text">${label}</span>
      <div class="node-actions">
        <span class="action-icon" data-action="video" title="Watch Video">${EYE_SVG}</span>
        <span class="action-icon" data-action="podcast" title="Listen to Podcast">${EAR_SVG}</span>
      </div>
    </div>
  `;
}

interface JmNode {
  id: string;
  topic: string;
  children?: JmNode[];
}

function stripFences(raw: string) {
  return raw.replace(/^```mermaid\s*/i,'').replace(/^```\s*/m,'').replace(/```\s*$/m,'').trim();
}

function cleanLabel(s: string) {
  s = s.trim();
  s = s.replace(/^root\(\((.+?)\)\)$/i,'$1').replace(/^root\((.+?)\)$/i,'$1')
       .replace(/^root\[(.+?)\]$/i,'$1').replace(/^root$/i,'');
  s = s.replace(/^\(\((.+?)\)\)$/,'$1').replace(/^\((.+?)\)$/,'$1')
       .replace(/^\[\[(.+?)\]\]$/,'$1').replace(/^\[(.+?)\]$/,'$1')
       .replace(/^\{(.+?)\}$/,'$1').replace(/^"(.+?)"$/,'$1')
       .replace(/^[-*+]\s+/,'');
  return s.replace(/[\u2018\u2019]/g,"'").replace(/[\u201C\u201D]/g,'"').trim();
}

function parseMermaidToJmNode(raw: string): JmNode | null {
  const lines = stripFences(raw).split('\n');
  const flat: {depth:number;label:string}[] = [];
  for (const line of lines) {
    const t = line.trim();
    if (!t || /^mindmap$/i.test(t)) continue;
    const depth = Math.floor((line.match(/^(\s*)/)?.[1]?.length ?? 0) / 2);
    const label = cleanLabel(t);
    if (label) flat.push({ depth, label });
  }
  if (!flat.length) return null;
  const minD = Math.min(...flat.map(n => n.depth));
  let topicCounter = 1;
  let conceptCounter = 1;
  const mk = (topic: string, isLeaf: boolean, depth: number): JmNode => {
    let id;
    if (depth === 0) id = 'root';
    else if (isLeaf) id = `concept_${conceptCounter++}`;
    else if (depth === 1) id = `topic_${topicCounter++}`;
    else id = `node_${Math.random().toString(36).substring(7)}`;
    return { id, topic: decorateTopic(topic, depth), children: [] };
  };

  // We need to build the tree first to know which nodes are leaves
  const rootObj = { depth: minD, label: flat[0].label, children: [] as any[] };
  const stackObj = [rootObj];
  for (let i = 1; i < flat.length; i++) {
    const { depth, label } = flat[i];
    const obj = { depth, label, children: [] as any[] };
    while (stackObj.length > 1 && stackObj[stackObj.length-1].depth >= depth) stackObj.pop();
    stackObj[stackObj.length-1].children.push(obj);
    stackObj.push(obj);
  }

  // Pass depth parameter down to buildNode
  function buildNode(obj: any, currentDepth: number): JmNode {
    const isLeaf = obj.children.length === 0 && currentDepth >= 1;
    const node = mk(obj.label, isLeaf, currentDepth);
    node.children = obj.children.map((c: any) => buildNode(c, currentDepth + 1));
    return node;
  }
  
  return buildNode(rootObj, 0);
}

function convertToJson(data: any): JmNode {
  let topicCounter = 1;
  let conceptCounter = 1;

  function traverse(node: any, depth = 0): JmNode {
    const topic = node.name || node.label || node.topic || 'Topic';
    let id = node.id;
    
    if (!id) {
      if (depth === 0) {
        id = 'root';
      } else {
        const isLeaf = !node.children || node.children.length === 0;
        if (isLeaf && depth >= 1) {
          id = `concept_${conceptCounter++}`;
        } else if (depth === 1) {
          id = `topic_${topicCounter++}`;
        } else {
          id = `node_${Math.random().toString(36).substring(7)}`;
        }
      }
    }

    const result: JmNode = { id, topic: decorateTopic(topic, depth) };

    if (node.children && Array.isArray(node.children)) {
      result.children = node.children.map(c => traverse(c, depth + 1));
    }

    return result;
  }

  return traverse(data, 0);
}

export default function JsMindView({ content, onTopicClick, onActionClick, toolbarHint }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const jmRef = useRef<any>(null);

  useEffect(() => {
    if (!content || !containerRef.current) return;
    
    try {
      let mindmapData;
      const isMermaid = content.includes('```mermaid') || content.trim().startsWith('mindmap');
      
      if (isMermaid) {
        mindmapData = parseMermaidToJmNode(content);
        if (!mindmapData) throw new Error("Failed to parse mermaid");
      } else {
        const parsed = JSON.parse(content);
        mindmapData = convertToJson(parsed);
      }
      
      const options = {
        container: containerRef.current,
        theme: 'primary',
        editable: false,
      };
      
      // Cleanup previous instance if exists
      if (jmRef.current) {
        containerRef.current.innerHTML = '';
      }
      
      jmRef.current = new jsMind(options);
      jmRef.current.show({
        meta: { name: 'Mindmap', author: '', version: '1.0' },
        format: 'node_tree',
        data: mindmapData
      });
      
    } catch(e) {
      console.error("Failed to parse mindmap", e);
    }
    
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [content]);

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const actionEl = target.closest('.action-icon');
    const nodeEl = target.closest('jmnode');
    
    if (nodeEl) {
      const nodeid = nodeEl.getAttribute('nodeid');
      const textEl = nodeEl.querySelector('.node-text');
      const topic = textEl ? textEl.textContent : nodeEl.textContent;
      
      if (nodeid && jmRef.current) {
        const node = jmRef.current.get_node(nodeid);
        if (node && node.isroot) {
          return;
        }
      }

      if (actionEl) {
        e.stopPropagation();
        const action = actionEl.getAttribute('data-action') as 'video' | 'podcast';
        if (action && onActionClick && nodeid && topic) {
          onActionClick(action, nodeid, topic);
        }
      } else if (nodeid && topic && onTopicClick) {
        onTopicClick(nodeid, topic);
      }
    }
  };

  if (!content) return null;

  return (
    <div style={{ userSelect: 'none', height: '600px', width: '100%', border: '1px solid #EFE4DC', borderRadius: '12px', overflow: 'hidden' }}>
      {/* Toolbar */}
      <div style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'8px 16px',
        borderBottom:'1px solid #EFE4DC',
        background:'#FAF1EB',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{
            width: 7, height: 7, borderRadius: 2,
            background: '#4F7B64', flexShrink: 0,
          }} />
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#4F7B64', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {toolbarHint ?? 'Mindmap · Click a topic for Quick Study'}
          </span>
        </div>
      </div>

      {/* Canvas */}
      <style>{`
        jmnode {
          font-size: 13px !important;
          font-weight: 500 !important;
          padding: 10px 16px !important;
          border-radius: 8px !important;
          background-color: #7BA88B !important;
          color: #FFFFFF !important;
          border: 1px solid #6B977B !important;
          box-shadow: 0 2px 5px rgba(45, 62, 54, 0.12) !important;
          transition: all 0.2s ease !important;
        }
        jmnode:hover {
          box-shadow: 0 4px 10px rgba(45, 62, 54, 0.22) !important;
          transform: translateY(-1px);
        }
        jmnode[nodeid="root"] {
          background-color: #2D3E36 !important;
          color: #FFFFFF !important;
          font-size: 15px !important;
          font-weight: 700 !important;
          border-radius: 10px !important;
          border: 1px solid #23322B !important;
          cursor: default !important;
        }
        jmnode[nodeid^="topic_"] {
          background-color: #4F7B64 !important;
          color: #FFFFFF !important;
          font-size: 13.5px !important;
          font-weight: 600 !important;
          border-radius: 10px !important;
          border: 1px solid #436A55 !important;
        }
        jmnode[nodeid^="concept_"] {
          background-color: #7BA88B !important;
          color: #FFFFFF !important;
          font-size: 12.5px !important;
          font-weight: 500 !important;
          border-radius: 8px !important;
          border: 1px solid #6B977B !important;
        }
        jmnode:not([nodeid="root"]) {
          cursor: pointer !important;
        }
        jmnode.selected {
          background-color: #436A55 !important;
          border-color: #2D3E36 !important;
        }
        .node-content {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .node-actions {
          display: flex;
          align-items: center;
          gap: 4px;
          margin-left: 4px;
        }
        .action-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          border-radius: 6px;
          color: #FFFFFF;
          opacity: 0.6;
          cursor: pointer;
        }
        .action-icon:hover {
          opacity: 1;
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
      <div
        ref={containerRef}
        onClick={handleContainerClick}
        style={{
          width: '100%',
          height: 'calc(100% - 40px)',
          background: '#FFF6F1',
          borderRadius: '0 0 12px 12px',
        }}
      />
    </div>
  );
}
