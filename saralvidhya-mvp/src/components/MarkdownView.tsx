import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import katex from 'katex';
import MermaidView from './MermaidView';
import { getTermDefinition, GLOSSARY_DEFINITIONS } from '@/data/glossaryTerms';
import { GCS_API_BASE } from '@/data/manifestService';
import {
  extractInlineDataImages,
  resolveInlineImageUrl,
} from '@/utils/inlineImageStore';
import 'katex/dist/katex.min.css';

interface Props {
  content: string;
  isPurpleTheme?: boolean;
}

const REMARK_PLUGINS: any[] = [remarkGfm, remarkMath];
const REHYPE_PLUGINS: any[] = [rehypeRaw];

const KATEX_CACHE_MAX = 2000;
const katexHtmlCache = new Map<string, string>();

function renderKatexCached(tex: string, displayMode: boolean): string {
  const key = `${displayMode ? 'D' : 'I'}:${tex}`;
  const cached = katexHtmlCache.get(key);
  if (cached !== undefined) return cached;

  let html = '';
  try {
    html = katex.renderToString(tex, {
      displayMode,
      throwOnError: false,
      strict: false,
      output: 'html',
    });
  } catch {
    html = `<span class="katex-error">${tex.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</span>`;
  }

  if (katexHtmlCache.size >= KATEX_CACHE_MAX) {
    const oldest = katexHtmlCache.keys().next().value;
    if (oldest) katexHtmlCache.delete(oldest);
  }
  katexHtmlCache.set(key, html);
  return html;
}

const COMPILED_PHRASE_REGEX = (() => {
  const keys = Object.keys(GLOSSARY_DEFINITIONS)
    .filter((k) => k.length >= 4)
    .sort((a, b) => b.length - a.length);
  const escaped = keys.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return new RegExp(`\\b(${escaped.join('|')})\\b`, 'gi');
})();

function safeUrlTransform(value: string): string {
  if (!value) return '';
  const trimmed = value.trim();
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('data:text/html') ||
    lower.startsWith('data:application/')
  ) {
    return '';
  }
  return trimmed;
}

function fixMathSymbols(mathStr: string): string {
  let m = mathStr;
  m = m.replace(/[\x0c\u000c]rac/g, '\\frac');
  m = m.replace(
    /(?<![A-Za-z\\])(sum|int|langle|rangle|alpha|beta|gamma|delta|theta|phi|psi|omega|sigma|mu|nu|pi|lambda|partial|infty|approx|propto|equiv|times|cdot|dagger|Rightarrow|rightarrow)(?![A-Za-z])/g,
    '\\$1'
  );
  m = m.replace(/(?<![A-Za-z\\])angle(?![A-Za-z])/g, '\\rangle');
  return m;
}

const PREPROCESS_CACHE_MAX = 40;
const preprocessCache = new Map<string, string>();

function preprocessMathContent(text: string): string {
  if (!text) return text;
  const cached = preprocessCache.get(text);
  if (cached !== undefined) return cached;

  // 1. Extract any embedded multiline base64 images before running regexes or AST parsers
  let processed = extractInlineDataImages(text);

  processed = processed.replace(/^.*Word count:.*Persona:.*$/gim, '');
  processed = processed.replace(/\\\(/g, () => '$').replace(/\\\)/g, () => '$');
  processed = processed.replace(/\\\[/g, () => '$$').replace(/\\\]/g, () => '$$');
  processed = processed.replace(/\bn\*lambda\s*=\s*2d\*sin\(theta\)/gi, '$$n\\lambda = 2d \\sin(\\theta)$$');
  processed = processed.replace(/(?<!\$)\bn\*lambda\b(?!\$)/gi, '$n\\lambda$');
  processed = processed.replace(/(?<![\\$])\bsin\(theta\)(?!\$)/gi, '$\\sin(\\theta)$');
  processed = processed.replace(/\$\$[ \t]*([A-Z][^\\$\n]{10,})[ \t]*\$\$/g, (_, inner) => inner);
  processed = processed.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => `$$${fixMathSymbols(math)}$$`);
  // Single-dollar math must NOT use /s (dotAll) so stray $ signs never match across lines
  processed = processed.replace(/(?<!\$)\$([^$\n]+?)\$(?!\$)/g, (_, math) => `$${fixMathSymbols(math)}$`);

  if (preprocessCache.size >= PREPROCESS_CACHE_MAX) {
    const oldest = preprocessCache.keys().next().value;
    if (oldest) preprocessCache.delete(oldest);
  }
  preprocessCache.set(text, processed);
  return processed;
}

function extractRawText(node: any): string {
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return String(node);
  if (!node) return '';
  if (Array.isArray(node)) return node.map(extractRawText).join('');
  if (node.props) return extractRawText(node.props.children);
  return '';
}

function MarkdownViewInner({ content, isPurpleTheme = true }: Props) {
  const processedContent = useMemo(() => preprocessMathContent(content), [content]);

  const accentDotted = isPurpleTheme ? '#7c3aed' : '#16a34a';
  const popoverBorder = isPurpleTheme ? '#c084fc' : '#86efac';

  // Single event-delegated popover state for all glossary terms in this MarkdownView
  const [activePopover, setActivePopover] = useState<{
    definition: string;
    x: number;
    y: number;
    isAbove: boolean;
    triggerEl: HTMLElement;
  } | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!activePopover) return;

    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (
        popoverRef.current &&
        !popoverRef.current.contains(target) &&
        !activePopover.triggerEl.contains(target)
      ) {
        setActivePopover(null);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActivePopover(null);
    };

    const handleScrollOrResize = () => setActivePopover(null);

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick, { passive: true });
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleScrollOrResize, { passive: true });

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [activePopover]);

  const openTermPopover = useCallback((el: HTMLElement, definition: string) => {
    setActivePopover((prev) => {
      if (prev && prev.triggerEl === el) return null;
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const clampedX = Math.max(160, Math.min(window.innerWidth - 160, centerX));
      const isAbove = rect.top > 150;
      const y = isAbove ? rect.top - 8 : rect.bottom + 8;
      return { definition, x: clampedX, y, isAbove, triggerEl: el };
    });
  }, []);

  const handleContainerClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const target = (e.target as HTMLElement | null)?.closest?.('[data-term-def]') as HTMLElement | null;
      if (!target) return;
      const def = target.getAttribute('data-term-def');
      if (!def) return;
      e.preventDefault();
      e.stopPropagation();
      openTermPopover(target, def);
    },
    [openTermPopover]
  );

  const handleContainerKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const target = (e.target as HTMLElement | null)?.closest?.('[data-term-def]') as HTMLElement | null;
      if (!target) return;
      const def = target.getAttribute('data-term-def');
      if (!def) return;
      e.preventDefault();
      e.stopPropagation();
      openTermPopover(target, def);
    },
    [openTermPopover]
  );

  const dottedStyle = useMemo<React.CSSProperties>(
    () => ({
      borderBottom: `2.2px dotted ${accentDotted}`,
      cursor: 'pointer',
      display: 'inline',
      paddingBottom: '1px',
      borderRadius: '2px',
    }),
    [accentDotted]
  );

  const markdownComponents = useMemo(() => {
    const renderTextWithTerms = (
      text: string,
      keyPrefix: string,
      seenTerms: Set<string>
    ): React.ReactNode => {
      if (!text || typeof text !== 'string' || text.length < 4) return text;
      const parts = text.split(COMPILED_PHRASE_REGEX);
      if (parts.length <= 1) return text;

      return parts.map((part, i) => {
        // With a single capturing group in split(), odd indices are regex matches
        if (i % 2 === 1) {
          const norm = part.toLowerCase();
          if (!seenTerms.has(norm)) {
            const def = getTermDefinition(norm);
            if (def) {
              seenTerms.add(norm);
              return (
                <span
                  key={`${keyPrefix}-${i}`}
                  className="sv-dotted-term"
                  data-term-def={def}
                  role="button"
                  tabIndex={0}
                  title="Tap for definition"
                  style={dottedStyle}
                >
                  {part}
                </span>
              );
            }
          }
        }
        return part;
      });
    };

    return {
      strong({ children, ...props }: any) {
        const raw = extractRawText(children).trim();
        const def = raw.length >= 3 ? getTermDefinition(raw) : undefined;
        if (def) {
          return (
            <strong {...props}>
              <span
                className="sv-dotted-term"
                data-term-def={def}
                role="button"
                tabIndex={0}
                title="Tap for definition"
                style={dottedStyle}
              >
                {children}
              </span>
            </strong>
          );
        }
        return <strong {...props}>{children}</strong>;
      },
      em({ children, ...props }: any) {
        const raw = extractRawText(children).trim();
        const def = raw.length >= 3 ? getTermDefinition(raw) : undefined;
        if (def) {
          return (
            <em {...props}>
              <span
                className="sv-dotted-term"
                data-term-def={def}
                role="button"
                tabIndex={0}
                title="Tap for definition"
                style={dottedStyle}
              >
                {children}
              </span>
            </em>
          );
        }
        return <em {...props}>{children}</em>;
      },
      p({ children, ...props }: any) {
        const seen = new Set<string>();
        if (Array.isArray(children)) {
          return (
            <p {...props}>
              {children.map((child, idx) => {
                if (typeof child === 'string') {
                  return <React.Fragment key={idx}>{renderTextWithTerms(child, `p-${idx}`, seen)}</React.Fragment>;
                }
                return child;
              })}
            </p>
          );
        } else if (typeof children === 'string') {
          return <p {...props}>{renderTextWithTerms(children, 'p-single', seen)}</p>;
        }
        return <p {...props}>{children}</p>;
      },
      li({ children, ...props }: any) {
        const seen = new Set<string>();
        if (Array.isArray(children)) {
          return (
            <li {...props}>
              {children.map((child, idx) => {
                if (typeof child === 'string') {
                  return <React.Fragment key={idx}>{renderTextWithTerms(child, `li-${idx}`, seen)}</React.Fragment>;
                }
                return child;
              })}
            </li>
          );
        } else if (typeof children === 'string') {
          return <li {...props}>{renderTextWithTerms(children, 'li-single', seen)}</li>;
        }
        return <li {...props}>{children}</li>;
      },
      img(props: any) {
        let cleanSrc = resolveInlineImageUrl(props.src);
        if (cleanSrc && !cleanSrc.startsWith('http://') && !cleanSrc.startsWith('https://') && !cleanSrc.startsWith('data:') && !cleanSrc.startsWith('blob:')) {
          if (cleanSrc.startsWith('/api/')) {
            cleanSrc = `${GCS_API_BASE}${cleanSrc}`;
          }
        }
        return (
          <span style={{ display: 'flex', justifyContent: 'center', margin: '24px 0' }}>
            <img
              {...props}
              src={cleanSrc}
              loading="lazy"
              decoding="async"
              style={{ maxWidth: '100%', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              onError={(e) => {
                const el = e.currentTarget as HTMLImageElement;
                el.style.display = 'none';
                const parent = el.parentElement;
                if (parent) parent.style.display = 'none';
              }}
            />
          </span>
        );
      },
      a(props: any) {
        const resolvedHref = resolveInlineImageUrl(props.href);
        if (resolvedHref && resolvedHref.startsWith('data:image')) {
          return (
            <div style={{ display: 'flex', justifyContent: 'center', margin: '24px 0' }}>
              <img
                src={resolvedHref}
                alt="Infographic"
                loading="lazy"
                decoding="async"
                style={{ maxWidth: '100%', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              />
            </div>
          );
        }
        return <a {...props} rel="noopener noreferrer" />;
      },
      pre({ children, ...props }: any) {
        const child = Array.isArray(children) ? children[0] : children;
        const childClass = child?.props?.className || '';
        if (
          typeof childClass === 'string' &&
          (childClass.includes('katex-math-block') ||
            childClass.includes('language-math') ||
            childClass.includes('math-display'))
        ) {
          return <>{children}</>;
        }
        return <pre {...props}>{children}</pre>;
      },
      code({ className, children, ...props }: any) {
        const cls = className || '';
        if (
          cls.includes('language-math') ||
          cls.includes('math-inline') ||
          cls.includes('math-display')
        ) {
          const isDisplay = cls.includes('math-display');
          const tex = extractRawText(children).replace(/\n$/, '');
          const html = renderKatexCached(tex, isDisplay);
          return (
            <span
              className={isDisplay ? 'katex-math-block' : 'katex-math-inline'}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        }

        const match = /language-(\w+)/.exec(cls);
        if (match && match[1] === 'mermaid') {
          const extractText = (node: any): string => {
            if (typeof node === 'string') return node;
            if (typeof node === 'number') return String(node);
            if (!node) return '';
            if (Array.isArray(node)) return node.map(extractText).join('');
            if (node.props) {
              if (node.type === 'br') return '<br/>';
              return extractText(node.props.children);
            }
            return '';
          };
          const mermaidContent = extractText(children).replace(/\n$/, '');
          return <MermaidView content={mermaidContent} />;
        }
        return (
          <code className={className} {...props}>
            {children}
          </code>
        );
      },
    };
  }, [dottedStyle]);

  return (
    <div
      className="markdown-body markdown-view"
      style={{ width: '100%' }}
      onClick={handleContainerClick}
      onKeyDown={handleContainerKeyDown}
    >
      <ReactMarkdown
        remarkPlugins={REMARK_PLUGINS}
        rehypePlugins={REHYPE_PLUGINS}
        urlTransform={safeUrlTransform}
        components={markdownComponents}
      >
        {processedContent}
      </ReactMarkdown>

      {activePopover &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={popoverRef}
            className="sv-definition-popover"
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'fixed',
              left: `${activePopover.x}px`,
              top: `${activePopover.y}px`,
              transform: activePopover.isAbove ? 'translate(-50%, -100%)' : 'translate(-50%, 0)',
              zIndex: 999999,
              width: 'max-content',
              maxWidth: '310px',
              minWidth: '180px',
              background: '#ffffff',
              border: `1.5px solid ${popoverBorder}`,
              borderRadius: '12px',
              padding: '12px 16px',
              boxShadow: '0 12px 28px -4px rgba(0, 0, 0, 0.14), 0 6px 12px -2px rgba(0, 0, 0, 0.08)',
              color: '#1e293b',
              fontSize: '13px',
              lineHeight: '1.55',
              fontWeight: 500,
              textAlign: 'left',
              cursor: 'default',
              pointerEvents: 'auto',
            }}
          >
            <div
              style={{
                position: 'absolute',
                [activePopover.isAbove ? 'bottom' : 'top']: '-6px',
                left: '50%',
                transform: 'translateX(-50%) rotate(45deg)',
                width: '10px',
                height: '10px',
                background: '#ffffff',
                borderRight: activePopover.isAbove ? `1.5px solid ${popoverBorder}` : 'none',
                borderBottom: activePopover.isAbove ? `1.5px solid ${popoverBorder}` : 'none',
                borderLeft: !activePopover.isAbove ? `1.5px solid ${popoverBorder}` : 'none',
                borderTop: !activePopover.isAbove ? `1.5px solid ${popoverBorder}` : 'none',
              }}
            />
            <div style={{ position: 'relative', zIndex: 1 }}>
              {activePopover.definition}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

const MarkdownView = React.memo(MarkdownViewInner);
export default MarkdownView;
