import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import MermaidView from './MermaidView';
import DottedTerm from './study/DottedTerm';
import { getTermDefinition, GLOSSARY_DEFINITIONS } from '@/data/glossaryTerms';
import { GCS_API_BASE } from '@/data/manifestService';
import 'katex/dist/katex.min.css';

interface Props {
  content: string;
  isPurpleTheme?: boolean;
}

const REMARK_PLUGINS: any[] = [remarkGfm, remarkMath];
const REHYPE_PLUGINS: any[] = [rehypeRaw, [rehypeKatex, { strict: false, throwOnError: false }]];

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

function preprocessMathContent(text: string): string {
  if (!text) return text;
  let processed = text.replace(/base64,\s+/g, 'base64,');
  processed = processed.replace(/^.*Word count:.*Persona:.*$/gim, '');
  processed = processed.replace(/\\\(/g, () => '$').replace(/\\\)/g, () => '$');
  processed = processed.replace(/\\\[/g, () => '$$').replace(/\\\]/g, () => '$$');
  processed = processed.replace(/\bn\*lambda\s*=\s*2d\*sin\(theta\)/gi, '$$n\\lambda = 2d \\sin(\\theta)$$');
  processed = processed.replace(/(?<!\$)\bn\*lambda\b(?!\$)/gi, '$n\\lambda$');
  processed = processed.replace(/(?<![\\$])\bsin\(theta\)(?!\$)/gi, '$\\sin(\\theta)$');
  processed = processed.replace(/\$\$[ \t]*([A-Z][^\\$\n]{10,})[ \t]*\$\$/g, (_, inner) => inner);
  processed = processed.replace(/\$\$(.*?)\$\$/gs, (_, math) => `$$${fixMathSymbols(math)}$$`);
  processed = processed.replace(/\$(.*?)\$/gs, (_, math) => `$${fixMathSymbols(math)}$`);
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

  const markdownComponents = useMemo(() => {
    const renderTextWithTerms = (text: string, keyPrefix: string): React.ReactNode => {
      if (!text || typeof text !== 'string') return text;
      const parts = text.split(COMPILED_PHRASE_REGEX);
      if (parts.length <= 1) return text;

      return parts.map((part, i) => {
        const def = getTermDefinition(part);
        if (def) {
          return (
            <DottedTerm key={`${keyPrefix}-${i}`} definition={def} isPurpleTheme={isPurpleTheme}>
              {part}
            </DottedTerm>
          );
        }
        return part;
      });
    };

    return {
      strong({ children, ...props }: any) {
        const raw = extractRawText(children).trim();
        const def = getTermDefinition(raw);
        if (def) {
          return (
            <strong {...props}>
              <DottedTerm definition={def} isPurpleTheme={isPurpleTheme}>
                {children}
              </DottedTerm>
            </strong>
          );
        }
        return <strong {...props}>{children}</strong>;
      },
      em({ children, ...props }: any) {
        const raw = extractRawText(children).trim();
        const def = getTermDefinition(raw);
        if (def) {
          return (
            <em {...props}>
              <DottedTerm definition={def} isPurpleTheme={isPurpleTheme}>
                {children}
              </DottedTerm>
            </em>
          );
        }
        return <em {...props}>{children}</em>;
      },
      p({ children, ...props }: any) {
        if (Array.isArray(children)) {
          return (
            <p {...props}>
              {children.map((child, idx) => {
                if (typeof child === 'string') {
                  return <React.Fragment key={idx}>{renderTextWithTerms(child, `p-${idx}`)}</React.Fragment>;
                }
                return child;
              })}
            </p>
          );
        } else if (typeof children === 'string') {
          return <p {...props}>{renderTextWithTerms(children, 'p-single')}</p>;
        }
        return <p {...props}>{children}</p>;
      },
      li({ children, ...props }: any) {
        if (Array.isArray(children)) {
          return (
            <li {...props}>
              {children.map((child, idx) => {
                if (typeof child === 'string') {
                  return <React.Fragment key={idx}>{renderTextWithTerms(child, `li-${idx}`)}</React.Fragment>;
                }
                return child;
              })}
            </li>
          );
        } else if (typeof children === 'string') {
          return <li {...props}>{renderTextWithTerms(children, 'li-single')}</li>;
        }
        return <li {...props}>{children}</li >;
      },
      img(props: any) {
        let cleanSrc = props.src ? props.src.replace(/base64,\s+/g, 'base64,') : props.src;
        if (cleanSrc && !cleanSrc.startsWith('http://') && !cleanSrc.startsWith('https://') && !cleanSrc.startsWith('data:')) {
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
        if (props.href && props.href.startsWith('data:image')) {
          const cleanSrc = props.href.replace(/base64,\s+/g, 'base64,');
          return (
            <div style={{ display: 'flex', justifyContent: 'center', margin: '24px 0' }}>
              <img src={cleanSrc} alt="Infographic" loading="lazy" style={{ maxWidth: '100%', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
            </div>
          );
        }
        return <a {...props} rel="noopener noreferrer" />;
      },
      code({ className, children, ...props }: any) {
        const match = /language-(\w+)/.exec(className || '');
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
  }, [isPurpleTheme]);

  return (
    <div className="markdown-body markdown-view" style={{ width: '100%' }}>
      <ReactMarkdown
        remarkPlugins={REMARK_PLUGINS}
        rehypePlugins={REHYPE_PLUGINS}
        urlTransform={safeUrlTransform}
        components={markdownComponents}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}

const MarkdownView = React.memo(MarkdownViewInner);
export default MarkdownView;
