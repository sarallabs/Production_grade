import React, { useState } from 'react';
import { SectionPayload, ReadMode, Persona, DottedTerm } from '../../api/client';
import './ReadingCanvas.css';

interface ReadingCanvasProps {
  section: SectionPayload;
  sectionNumber: number;
  totalSections: number;
  activeMode: ReadMode;
  activePersona: Persona;
  onChangeMode: (mode: ReadMode) => void;
  onChangePersona: (persona: Persona) => void;
  onOpenQuickCheck: () => void;
  onPlayAudio?: () => void;
  isPlayingAudio?: boolean;
}

export const ReadingCanvas: React.FC<ReadingCanvasProps> = ({
  section,
  sectionNumber,
  totalSections,
  activeMode,
  activePersona,
  onChangeMode,
  onChangePersona,
  onOpenQuickCheck,
  onPlayAudio,
  isPlayingAudio = false,
}) => {
  const [activeDottedTerm, setActiveDottedTerm] = useState<DottedTerm | null>(null);
  const [selectedHotspot, setSelectedHotspot] = useState<number | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);

  // Render markdown with dotted terms highlighted
  const renderHighlightedContent = (text: string) => {
    if (!section.dottedTerms || section.dottedTerms.length === 0) {
      return <p className="reader-paragraph">{text}</p>;
    }

    // Split text into paragraphs
    const paragraphs = text.split('\n\n').filter(p => !p.startsWith('#') && !p.startsWith('<'));

    return paragraphs.map((p, pIdx) => {
      // For each paragraph, highlight recognized terms
      let elements: React.ReactNode[] = [p];

      section.dottedTerms.forEach((dt, dtIdx) => {
        const regex = new RegExp(`(${dt.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        const nextElements: React.ReactNode[] = [];

        elements.forEach((el, elIdx) => {
          if (typeof el === 'string') {
            const parts = el.split(regex);
            parts.forEach((part, partIdx) => {
              if (part.toLowerCase() === dt.term.toLowerCase()) {
                const colorClass = dtIdx % 3 === 0 ? 'dotted-green' : dtIdx % 3 === 1 ? 'dotted-blue' : 'dotted-orange';
                nextElements.push(
                  <span
                    key={`term-${pIdx}-${dtIdx}-${elIdx}-${partIdx}`}
                    className={`dotted-term-interactive ${colorClass}`}
                    onClick={() => setActiveDottedTerm(dt)}
                    title="Tap for definition"
                  >
                    {part}
                  </span>
                );
              } else if (part) {
                nextElements.push(part);
              }
            });
          } else {
            nextElements.push(el);
          }
        });
        elements = nextElements;
      });

      return (
        <p key={`p-${pIdx}`} className="reader-paragraph">
          {elements}
          {pIdx === 0 && (
            <span className="dotted-guidance"> · tap any dotted term for its definition</span>
          )}
        </p>
      );
    });
  };

  return (
    <main className="reading-canvas">
      {/* ── Sub-header Controls Bar ────────────────────────────────────────── */}
      <div className="reading-controls-bar">
        {/* 3D Book Tier Selector (Beginner / Intermediate / Advanced) */}
        <div className="persona-book-selector" title="Switch Knowledge Persona">
          <button
            className={`book-tier-btn ${activePersona === 'beginner' ? 'active' : ''}`}
            onClick={() => onChangePersona('beginner')}
            title="Beginner Tier"
          >
            <span className="book-emoji">📖</span>
            <span className="book-tier-label">1</span>
          </button>
          <button
            className={`book-tier-btn ${activePersona === 'intermediate' ? 'active' : ''}`}
            onClick={() => onChangePersona('intermediate')}
            title="Intermediate Tier"
          >
            <span className="book-emoji">📚</span>
            <span className="book-tier-label">2</span>
          </button>
          <button
            className={`book-tier-btn ${activePersona === 'advanced' ? 'active' : ''}`}
            onClick={() => onChangePersona('advanced')}
            title="Advanced Tier"
          >
            <span className="book-emoji">🎓</span>
            <span className="book-tier-label">3</span>
          </button>
        </div>

        {/* Mode Toggle: Essentials vs In-depth */}
        <div className="mode-toggle-pill">
          <button
            className={`toggle-option ${activeMode === 'essentials' ? 'active' : ''}`}
            onClick={() => onChangeMode('essentials')}
          >
            Essentials
          </button>
          <button
            className={`toggle-option ${activeMode === 'indepth' ? 'active' : ''}`}
            onClick={() => onChangeMode('indepth')}
          >
            In-depth
          </button>
        </div>

        {/* Audio Read Aloud Stream Button */}
        <button
          className={`audio-stream-btn ${isPlayingAudio ? 'playing' : ''}`}
          onClick={onPlayAudio}
          title={isPlayingAudio ? 'Pause Narration' : `Read Aloud · ${section.audio?.duration || '3:42'}`}
        >
          {isPlayingAudio ? (
            <svg viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          )}
        </button>
      </div>

      {/* ── Section Title & Metadata ──────────────────────────────────────── */}
      <div className="section-header-block">
        <span className="section-step-badge">
          SECTION {sectionNumber} OF {totalSections}
        </span>
        <h1 className="section-main-title">{section.title}</h1>
        {section.subtitle && (
          <p className="section-subtitle-text">{section.subtitle}</p>
        )}

        <div className="section-metadata-pills">
          <span className="meta-pill">
            <svg className="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            {section.estimatedMinutes} min read
          </span>

          {section.quickCheck && (
            <button className="meta-pill quick-check-pill" onClick={onOpenQuickCheck} title="Open formative check">
              <svg className="meta-icon check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              1 quick check
            </button>
          )}
        </div>
      </div>

      {/* ── Main Reading Content ──────────────────────────────────────────── */}
      <article className="section-article-content">
        {renderHighlightedContent(section.contentMarkdown || (section as any).markdownContent || '')}
      </article>

      {/* ── Interactive Figure Container (From Image 1) ────────────────────── */}
      <section className="interactive-figure-container">
        <div className="figure-top-bar">
          <button
            className="zoom-hotspot-badge"
            onClick={() => setIsZoomed(true)}
            title="Click to zoom in"
          >
            <svg className="zoom-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
              <line x1="11" y1="8" x2="11" y2="14" />
              <line x1="8" y1="11" x2="14" y2="11" />
            </svg>
            <span>Click to zoom · tap ①②③</span>
          </button>
        </div>

        {/* Diagram Graphic with Hotspots */}
        <div className="figure-canvas">
          <svg className="diagram-svg" viewBox="0 0 800 240" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Insect Head Silhouette */}
            <ellipse cx="140" cy="130" rx="55" ry="65" fill="#EEF2F6" stroke="#CBD5E1" strokeWidth="2"/>
            <circle cx="115" cy="105" r="9" fill="#1E293B"/>
            <path d="M100 170 C90 190 85 205 80 220" stroke="#94A3B8" strokeWidth="3" strokeLinecap="round"/>
            <path d="M130 180 C125 195 120 210 115 220" stroke="#94A3B8" strokeWidth="3" strokeLinecap="round"/>

            {/* Chamber 1: Foregut (Blue) */}
            <path d="M190 130 H250 V115 C250 115 290 115 320 115 C335 115 345 120 350 130 C345 140 335 145 320 145 H250 V130" fill="#60A5FA"/>
            <text x="300" y="80" textAnchor="middle" fill="#2563EB" fontWeight="bold" fontSize="15">Foregut</text>
            <text x="300" y="98" textAnchor="middle" fill="#3B82F6" fontSize="11">Stomodaeum · ingest</text>

            {/* Chamber 2: Midgut (Green) */}
            <rect x="350" y="105" width="220" height="50" rx="10" fill="#4ADE80"/>
            <text x="460" y="80" textAnchor="middle" fill="#059669" fontWeight="bold" fontSize="15">Midgut</text>
            <text x="460" y="98" textAnchor="middle" fill="#10B981" fontSize="11">Mesenteron · digest + absorb</text>

            {/* Chamber 3: Hindgut (Orange) */}
            <path d="M570 115 C600 110 635 115 650 130 C650 160 620 190 620 220 H660 C660 170 690 140 670 115 C640 100 590 105 570 115 Z" fill="#FB923C"/>
            <text x="630" y="80" textAnchor="middle" fill="#D97706" fontWeight="bold" fontSize="15">Hindgut</text>
            <text x="630" y="98" textAnchor="middle" fill="#EA580C" fontSize="11">Proctodaeum · reclaim + eliminate</text>

            {/* Malpighian Tubules (Purple fibers) */}
            <path d="M570 140 Q 580 180 575 200" stroke="#A855F7" strokeWidth="2.5" fill="none"/>
            <path d="M575 145 Q 595 175 600 195" stroke="#A855F7" strokeWidth="2.5" fill="none"/>

            {/* Hotspot 1 (Blue) */}
            <g className="hotspot-pin" onClick={() => setSelectedHotspot(1)} style={{ cursor: 'pointer' }}>
              <circle cx="230" cy="75" r="14" fill="#FFFFFF" stroke="#3B82F6" strokeWidth="2.5" />
              <text x="230" y="80" textAnchor="middle" fill="#2563EB" fontWeight="bold" fontSize="12">1</text>
            </g>

            {/* Hotspot 2 (Green) */}
            <g className="hotspot-pin" onClick={() => setSelectedHotspot(2)} style={{ cursor: 'pointer' }}>
              <circle cx="460" cy="190" r="14" fill="#FFFFFF" stroke="#10B981" strokeWidth="2.5" />
              <text x="460" y="195" textAnchor="middle" fill="#059669" fontWeight="bold" fontSize="12">2</text>
            </g>

            {/* Hotspot 3 (Orange) */}
            <g className="hotspot-pin" onClick={() => setSelectedHotspot(3)} style={{ cursor: 'pointer' }}>
              <circle cx="600" cy="75" r="14" fill="#FFFFFF" stroke="#F97316" strokeWidth="2.5" />
              <text x="600" y="80" textAnchor="middle" fill="#EA580C" fontWeight="bold" fontSize="12">3</text>
            </g>
          </svg>
        </div>

        {/* Hotspot Callout Toast if selected */}
        {selectedHotspot && (
          <div className="hotspot-callout-toast">
            <span className="hotspot-badge-mini">Detail {selectedHotspot}</span>
            <p>
              {selectedHotspot === 1 && 'Foregut: Ectodermal origin with cuticular lining. Includes pharynx, esophagus, crop, and proventriculus.'}
              {selectedHotspot === 2 && 'Midgut: Endodermal origin, not lined with cuticle. Major site of chemical digestion, enzyme secretion, and absorption.'}
              {selectedHotspot === 3 && 'Hindgut: Ectodermal origin with cuticle. Recovers water, electrolytes, and directs uric acid waste to the anus.'}
            </p>
            <button className="close-callout-btn" onClick={() => setSelectedHotspot(null)}>✕</button>
          </div>
        )}

        {/* Caption */}
        <footer className="figure-caption-footer">
          <strong className="fig-number">Fig 1.1</strong>
          <span className="fig-text">
            The tripartite alimentary canal. Colours mark the three embryonic regions; numbers mark exam-favourite details. Diagram simplified for clarity — the full version appears in In-depth mode.
          </span>
        </footer>
      </section>

      {/* ── Dotted Term Popover Modal ─────────────────────────────────────── */}
      {activeDottedTerm && (
        <div className="term-popover-overlay" onClick={() => setActiveDottedTerm(null)}>
          <div className="term-popover-card" onClick={(e) => e.stopPropagation()}>
            <div className="term-popover-header">
              <h3>{activeDottedTerm.term}</h3>
              <button className="close-term-btn" onClick={() => setActiveDottedTerm(null)}>✕</button>
            </div>
            <p className="term-definition-text">{activeDottedTerm.definition}</p>
            {activeDottedTerm.examTip && (
              <div className="term-exam-tip">
                <span className="exam-tip-badge">EXAM TIP</span>
                <span>{activeDottedTerm.examTip}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Zoom Lightbox Modal ───────────────────────────────────────────── */}
      {isZoomed && (
        <div className="zoom-lightbox-overlay" onClick={() => setIsZoomed(false)}>
          <div className="zoom-lightbox-card" onClick={(e) => e.stopPropagation()}>
            <button className="close-zoom-btn" onClick={() => setIsZoomed(false)}>✕ Close</button>
            <h3>Fig 1.1: Tripartite Alimentary Canal (High Resolution)</h3>
            <div className="zoom-graphic-wrapper">
              <svg viewBox="0 0 800 240" fill="none" style={{ width: '100%', height: 'auto' }}>
                <rect width="800" height="240" fill="#F8FAFC" rx="12"/>
                {/* Scaled diagram */}
                <ellipse cx="140" cy="130" rx="55" ry="65" fill="#EEF2F6" stroke="#CBD5E1" strokeWidth="2"/>
                <path d="M190 130 H250 V115 C250 115 290 115 320 115 C335 115 345 120 350 130 C345 140 335 145 320 145 H250 V130" fill="#60A5FA"/>
                <rect x="350" y="105" width="220" height="50" rx="10" fill="#4ADE80"/>
                <path d="M570 115 C600 110 635 115 650 130 C650 160 620 190 620 220 H660 C660 170 690 140 670 115 C640 100 590 105 570 115 Z" fill="#FB923C"/>
                <path d="M570 140 Q 580 180 575 200" stroke="#A855F7" strokeWidth="2.5" fill="none"/>
                <path d="M575 145 Q 595 175 600 195" stroke="#A855F7" strokeWidth="2.5" fill="none"/>
              </svg>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
