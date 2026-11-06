import { useEffect, useRef } from 'react';
import 'jsmind/style/jsmind.css';
// @ts-ignore
import jsMind from 'jsmind';

interface Props {
  content: string;
  onTopicClick?: (topicId: string, topicName: string) => void;
  toolbarHint?: string;
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
    return { id, topic, children: [] };
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

    const result: JmNode = { id, topic };

    if (node.children && Array.isArray(node.children)) {
      result.children = node.children.map(c => traverse(c, depth + 1));
    }

    return result;
  }

  return traverse(data, 0);
}

export default function JsMindView({ content, onTopicClick, toolbarHint }: Props) {
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
    if (target.tagName.toLowerCase() === 'jmnode') {
      const nodeid = target.getAttribute('nodeid');
      const topic = target.textContent;
      
      // Only prevent clicks on the root node
      if (nodeid && jmRef.current) {
        const node = jmRef.current.get_node(nodeid);
        if (node && node.isroot) {
          return;
        }
      }

      if (nodeid && topic && onTopicClick) {
        onTopicClick(nodeid, topic);
      }
    }
  };

  if (!content) return null;

  return (
    <div style={{ userSelect: 'none', height: '600px', width: '100%', border: '1px solid var(--border)', borderRadius: '8px' }}>
      {/* Toolbar */}
      <div style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'8px 16px',
        borderBottom:'1px solid var(--border)',
        background:'var(--surface)',
        borderRadius:'8px 8px 0 0',
      }}>
        <span style={{fontSize:'0.78rem',color:'var(--text-secondary)'}}>
          {toolbarHint ?? '🗺️ Mindmap · Click a topic for Quick Study'}
        </span>
      </div>

      {/* Canvas */}
      <style>{`
        jmnode[nodeid="root"] {
          cursor: default !important;
        }
        jmnode:not([nodeid="root"]) {
          cursor: pointer !important;
        }
      `}</style>
      <div
        ref={containerRef}
        onClick={handleContainerClick}
        style={{
          width: '100%',
          height: 'calc(100% - 40px)',
          background:'#FAFBFF',
          borderRadius:'0 0 8px 8px',
        }}
      />
    </div>
  );
}
