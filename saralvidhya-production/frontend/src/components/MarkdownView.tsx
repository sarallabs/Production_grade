import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import MermaidView from './MermaidView';
import 'katex/dist/katex.min.css';

interface Props {
  content: string;
}

export default function MarkdownView({ content }: Props) {
  const preprocessMathContent = (text: string): string => {
    if (!text) return text;
    // 1. Fix invalid base64 image URIs that contain a space after the comma
    let processed = text.replace(/base64,\s+/g, 'base64,');
    
    // Remove AI output metadata lines (e.g. "Word count: ~782 | D_max = 8 | D_target = 2 (30%) | Persona: Beginner")
    processed = processed.replace(/^.*Word count:.*Persona:.*$/gmi, '');

    // Convert inline math delimiters \( ... \) to $ ... $
    processed = processed.replace(/\\\(/g, () => '$').replace(/\\\)/g, () => '$');
    
    // Convert block math delimiters \[ ... \] to $$ ... $$
    processed = processed.replace(/\\\[/g, () => '$$').replace(/\\\]/g, () => '$$');

    // Only fix genuinely raw-text formulas that are NOT already inside LaTeX.
    // Pattern: literal text like "n*lambda = 2d*sin(theta)" outside of $ delimiters
    processed = processed.replace(/\bn\*lambda\s*=\s*2d\*sin\(theta\)/gi, "$$n\\lambda = 2d \\sin(\\theta)$$");
    processed = processed.replace(/(?<!\$)\bn\*lambda\b(?!\$)/gi, "$n\\lambda$");
    
    // Fix raw "sin(theta)" only when it appears OUTSIDE of any $ math context
    // (i.e. not already preceded by a backslash and not inside dollar signs)
    processed = processed.replace(/(?<![\\$])\bsin\(theta\)(?!\$)/gi, "$\\sin(\\theta)$");

    // Fix for AI wrapping plain text sentences in $$ (e.g. $$The transition probability...$$)
    // Matches $$ followed by an uppercase letter, containing spaces, and NO backslashes or newlines (no actual LaTeX commands)
    // Uses [ \t]* instead of \s* to prevent matching across newlines
    processed = processed.replace(/\$\$[ \t]*([A-Z][^\\$\n]{10,})[ \t]*\$\$/g, (match, content) => {
      return content;
    });
    // Clean up math blocks by adding missing backslashes and fixing form-feed `\frac` corruption
    const fixMathSymbols = (mathStr: string) => {
      let m = mathStr;
      m = m.replace(/[\x0c\u000c]rac/g, '\\frac');
      // Add missing backslashes to common LaTeX commands inside the math block
      m = m.replace(/(?<![A-Za-z\\])(sum|int|langle|rangle|alpha|beta|gamma|delta|theta|phi|psi|omega|sigma|mu|nu|pi|lambda|partial|infty|approx|propto|equiv|times|cdot|dagger|Rightarrow|rightarrow)(?![A-Za-z])/g, '\\$1');
      m = m.replace(/(?<![A-Za-z\\])angle(?![A-Za-z])/g, '\\rangle');
      return m;
    };

    processed = processed.replace(/\$\$(.*?)\$\$/gs, (_, math) => `$$${fixMathSymbols(math)}$$`);
    processed = processed.replace(/\$(.*?)\$/gs, (_, math) => `$${fixMathSymbols(math)}$`);
    
    return processed;
  };

  return (
    <div className="markdown-body markdown-view" style={{ width: '100%' }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeRaw, [rehypeKatex, { strict: false, throwOnError: false }]]}
        urlTransform={(value: string) => value}
        components={{
          img(props) {
            const cleanSrc = props.src ? props.src.replace(/base64,\s+/g, 'base64,') : props.src;
            return (
              <div style={{ display: 'flex', justifyContent: 'center', margin: '24px 0' }}>
                <img
                  {...props}
                  src={cleanSrc}
                  style={{ maxWidth: '100%', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  onError={(e) => {
                    // Hide broken images (missing extracted_images etc.) silently — no ugly alt text
                    const el = e.currentTarget as HTMLImageElement;
                    el.style.display = 'none';
                    const parent = el.parentElement;
                    if (parent) parent.style.display = 'none';
                  }}
                />
              </div>
            );
          },
          a(props) {
            if (props.href && props.href.startsWith('data:image')) {
              const cleanSrc = props.href.replace(/base64,\s+/g, 'base64,');
              return (
                <div style={{ display: 'flex', justifyContent: 'center', margin: '24px 0' }}>
                  <img src={cleanSrc} alt="Infographic" style={{ maxWidth: '100%', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                </div>
              );
            }
            return <a {...props} />;
          },
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            if (match && match[1] === 'mermaid') {
              return <MermaidView content={String(children).replace(/\n$/, '')} />;
            }
            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          }
        }}
      >
        {preprocessMathContent(content)}
      </ReactMarkdown>
    </div>
  );
}
