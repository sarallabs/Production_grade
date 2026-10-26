import { useEffect, useCallback, useState, useRef } from 'react';
import { googleTtsSpeak, googleTtsStop } from '@/services/googleTtsService';
import MarkdownView from '@/components/MarkdownView';
import { GCS_API_BASE } from '@/data/manifestService';
import type { ToolId } from '@/components/ToolsMenu';

interface Card {
  id?: string;
  front?: string;
  back?: string;
  question?: string;
  answer?: string;
  definition?: string;
  infographicUrl?: string;
  mermaidDiagram?: string;
  mermaid_diagram?: string;
  mermaid?: string;
  level?: "beginner" | "intermediate" | "advanced";
}

interface Props {
  cards: Card[];
  subjectId?: string;
  chapterNumber?: number;
  persona?: string;
  /** Called whenever speaking state changes — true = currently speaking */
  onSpeakingChange?: (speaking: boolean) => void;
  /** Incremented by parent to toggle play/pause */
  speakTrigger?: number;
  /** Incremented by parent to stop */
  stopTrigger?: number;
  onFlashcardsCompleted?: () => void;
  levelControls?: React.ReactNode;
  canLevelUp?: boolean;
  onLevelUp?: () => void;
  onSelectTool?: (tool: ToolId) => void;
  onLevelUpPersona?: () => void;
  onLevelDownPersona?: () => void;
  isPurpleTheme?: boolean;
}

const SUBJECT_LANG: Record<string, string> = {
  pubadm_ur: 'ur-PK',
  hindi: 'hi-IN',
  telugu: 'te-IN',
};

export default function FlashcardsView({
  cards,
  subjectId = 'english',
  chapterNumber = 1,
  persona = 'beginner',
  onSpeakingChange,
  speakTrigger,
  stopTrigger,
  onFlashcardsCompleted,
  levelControls,
  canLevelUp,
  onLevelUp,
  onSelectTool,
  onLevelUpPersona,
  onLevelDownPersona,
  isPurpleTheme = false
}: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [speakingIdx, setSpeakingIdx] = useState<number | null>(null);
  const [animationDirection, setAnimationDirection] = useState<'next' | 'prev' | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const flipCard = (target?: boolean) => {
    setIsFlipped((prev) => (typeof target === 'boolean' ? target : !prev));
  };
  const [imgFailed, setImgFailed] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const lang = SUBJECT_LANG[subjectId] ?? 'en-IN';

  // Reset to first card whenever cards array (persona) changes
  useEffect(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setImgFailed(false);
    setIsZoomed(false);
  }, [cards]);

  useEffect(() => {
    setIsFlipped(false);
    setImgFailed(false);
    setIsZoomed(false);
  }, [currentIndex]);

  const totalCards = cards?.length || 0;
  const currentCard = cards[currentIndex];
  const safeFront = currentCard?.front || (currentCard as any)?.question || '';
  const cleanTitle = typeof safeFront === 'string' ? safeFront.replace(/^(?:Flashcards|Flash Cards)\n*-\s*/i, '') : safeFront;

  // Build cleaned back text: strip infographic prompts, images, and mermaid code blocks
  let rawBack = (currentCard?.back || (currentCard as any)?.answer || (currentCard as any)?.definition || '');
  // Remove Infographic Prompt metadata
  rawBack = rawBack.replace(/(?:^|\n)\s*>?\s*\*\*Infographic Prompt:\*\*[\s\S]*/gi, '');
  // Strip mermaid code blocks (```mermaid ... ```) — flashcards should show images, not diagrams
  rawBack = rawBack.replace(/```mermaid[\s\S]*?```/gi, '');
  // Strip embedded base64 <img> tags (they'll be shown in the infographic panel instead)
  rawBack = rawBack.replace(/<img[^>]+src=["']data:image\/[^;]+;base64,[^"']+["'][^>]*>/gi, '');
  // Strip markdown images (![alt](url) or ![alt](data:image/...))
  rawBack = rawBack.replace(/!\[.*?\]\([^\)]+\)/gi, '');
  const safeBack = rawBack.trim();

  // If card has no infographicUrl, try to extract an embedded base64 <img> or markdown image
  let extractedImgUrl: string | undefined;
  if (!currentCard?.infographicUrl) {
    const rawImg = (currentCard as any)?.img || (currentCard as any)?.image;
    if (typeof rawImg === 'string' && rawImg.trim()) {
      const mdMatch = rawImg.match(/!\[.*?\]\((.+?)\)/);
      extractedImgUrl = mdMatch ? mdMatch[1].trim() : rawImg.trim();
    }
    if (!extractedImgUrl) {
      const origText = (currentCard?.back || (currentCard as any)?.answer || (currentCard as any)?.definition || '');
      const imgMatch = origText.match(/<img[^>]+src=["'](data:image\/[^;]+;base64,[^"']+)["'][^>]*>/i);
      if (imgMatch) {
        extractedImgUrl = imgMatch[1];
      } else {
        const mdMatch = origText.match(/!\[.*?\]\((data:image\/[^)]+)\)/i);
        if (mdMatch) {
          extractedImgUrl = mdMatch[1];
        }
      }
    }
  }

  const speakText = `${cleanTitle}. ${safeBack}`;

  const clampIndex = (nextIndex: number) => {
    if (nextIndex < 0) return 0;
    if (nextIndex >= totalCards) return totalCards - 1;
    return nextIndex;
  };

  const prevCard = useCallback(() => {
    if (currentIndex === 0 || isAnimating) return;
    setAnimationDirection('prev');
    setIsAnimating(true);
    setCurrentIndex((current) => clampIndex(current - 1));
    window.setTimeout(() => {
      setIsAnimating(false);
      setAnimationDirection(null);
    }, 600);
  }, [currentIndex, isAnimating]);

  const nextCard = useCallback(() => {
    if (currentIndex === totalCards - 1) {
      if (onFlashcardsCompleted) {
        onFlashcardsCompleted();
      }
      return;
    }
    if (isAnimating) return;
    setAnimationDirection('next');
    setIsAnimating(true);
    setCurrentIndex((current) => clampIndex(current + 1));
    window.setTimeout(() => {
      setIsAnimating(false);
      setAnimationDirection(null);
    }, 600);
  }, [currentIndex, isAnimating, totalCards, onFlashcardsCompleted]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.getAttribute('contenteditable') === 'true')
      ) {
        return;
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevCard();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        nextCard();
      } else if (e.key === ' ' || e.key === 'Spacebar' || e.key === 'Enter' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [prevCard, nextCard]);

  // Stop TTS on unmount
  useEffect(() => () => googleTtsStop(), []);

  // Stop speaking when card changes
  useEffect(() => {
    googleTtsStop();
    setSpeakingIdx(null);
    onSpeakingChange?.(false);
  }, [currentIndex]);

  const handleSpeak = useCallback(() => {
    if (speakingIdx === currentIndex) {
      // currently playing â†’ pause (toggle off)
      googleTtsStop();
      setSpeakingIdx(null);
      onSpeakingChange?.(false);
      return;
    }
    googleTtsStop();
    googleTtsSpeak(
      speakText,
      lang,
      () => { setSpeakingIdx(currentIndex); onSpeakingChange?.(true); },
      () => { setSpeakingIdx(null); onSpeakingChange?.(false); },
    );
  }, [speakingIdx, currentIndex, speakText, lang, onSpeakingChange]);

  const handleStop = useCallback(() => {
    googleTtsStop();
    setSpeakingIdx(null);
    onSpeakingChange?.(false);
  }, [onSpeakingChange]);

  const speakMountedRef = useRef(false);
  const stopMountedRef = useRef(false);

  // React to external speak trigger
  useEffect(() => {
    if (!speakMountedRef.current) {
      speakMountedRef.current = true;
      return;
    }
    if (!speakTrigger) return;
    handleSpeak();
  }, [speakTrigger]);

  // React to external stop trigger
  useEffect(() => {
    if (!stopMountedRef.current) {
      stopMountedRef.current = true;
      return;
    }
    if (!stopTrigger) return;
    handleStop();
  }, [stopTrigger]);

  if (!cards || !Array.isArray(cards) || cards.length === 0) {
    return <p>No flashcards available for this chapter.</p>;
  }

  return (
    <div className="flashcards-rich flashcards-fast" style={{ width: "100%", height: "100%", flex: 1, minHeight: 0, display: "flex", flexDirection: "column", alignItems: "stretch", overflow: "hidden" }}>
      {currentIndex === totalCards - 1 && levelControls && (
        <div style={{ marginBottom: "12px", display: "flex", justifyContent: "center", flexShrink: 0 }}>
          {levelControls}
        </div>
      )}
      <div className="flashcards-stage" style={{ display: "flex", alignItems: "stretch", justifyContent: "center", gap: "12px", width: "100%", maxWidth: "min(98%, 1320px)", margin: "0 auto", padding: "0 12px 2px", flex: 1, height: "100%", minHeight: 0, overflow: "hidden" }}>
        {/* Left Navigation Button */}
        <button
          type="button"
          className="flashcard-nav-button"
          onClick={prevCard}
          disabled={currentIndex === 0}
          aria-label="Previous card"
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            border: "none",
            background: "#ffffff",
            color: "#0f172a",
            fontWeight: "800",
            fontSize: "18px",
            boxShadow: "0 4px 14px rgba(0, 0, 0, 0.1)",
            cursor: currentIndex === 0 ? "default" : "pointer",
            opacity: currentIndex === 0 ? 0.4 : 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            alignSelf: "center",
            transition: "all 0.2s ease",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <div
          className={`flashcard-card-container ${animationDirection ? `flashcard-animate-slide-${animationDirection}` : ''}`}
          key={currentIndex}
          onClick={() => flipCard()}
          title={isFlipped ? "Click to slide answer down" : "Click to pull up answer & infographic"}
          style={{
            width: "100%",
            maxWidth: "min(96%, 1240px)",
            flex: 1,
            height: "100%",
            maxHeight: "100%",
            minHeight: 0,
            borderRadius: "20px",
            border: isPurpleTheme ? "1.5px solid #CB30E055" : "1.5px solid #D5DDD0",
            background: isPurpleTheme ? "#F6ECF9" : "#ECF0E8",
            boxShadow: isPurpleTheme
              ? "0 12px 36px rgba(203, 48, 224, 0.14)"
              : "0 10px 32px rgba(45, 62, 54, 0.08)",
            padding: "8px 22px 10px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            alignItems: "stretch",
            boxSizing: "border-box",
            position: "relative",
            overflow: "hidden",
            cursor: "pointer",
            userSelect: "none",
            transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease",
          }}
        >
          {/* Top-Left Corner Counter Pill (e.g. 1 / 10) */}
          <div
            style={{
              position: "absolute",
              top: "10px",
              left: "16px",
              background: "#FFFDF9",
              border: isPurpleTheme ? '1.5px solid #C026D3' : '1.5px solid #E7B864',
              borderRadius: '10px',
              color: isPurpleTheme ? '#86198F' : '#8A6218',
              fontWeight: 800,
              fontSize: "12.5px",
              padding: "4px 13px",
              zIndex: 12,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 6px rgba(158, 99, 50, 0.08)",
              pointerEvents: "none",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {`${currentIndex + 1} / ${totalCards}`}
          </div>

          {(() => {
            let finalUrl = currentCard?.infographicUrl || extractedImgUrl;
            if (finalUrl && !finalUrl.startsWith('http://') && !finalUrl.startsWith('https://') && !finalUrl.startsWith('data:')) {
              if (finalUrl.startsWith('/api/')) {
                finalUrl = `${GCS_API_BASE}${finalUrl}`;
              } else if (finalUrl.startsWith('/generated_resources/')) {
                finalUrl = `${import.meta.env.BASE_URL || '/'}${finalUrl.replace(/^\//, '')}`.replace(/\/\//g, '/');
              }
            }

            const hasValidImage = !!finalUrl && !imgFailed;
            const hasVisual = hasValidImage;

            return (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  flex: 1,
                  height: '100%',
                  maxHeight: '100%',
                  minHeight: 0,
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                <style>{`
                  .flashcard-question-text,
                  .flashcard-question-text .markdown-body,
                  .flashcard-question-text .markdown-view,
                  .flashcard-question-text p,
                  .flashcard-question-text span,
                  .flashcard-question-text strong,
                  .flashcard-question-text em,
                  .flashcard-question-text h1,
                  .flashcard-question-text h2,
                  .flashcard-question-text h3 {
                    margin: 0 !important;
                    text-align: center !important;
                    font-size: inherit !important;
                    line-height: inherit !important;
                  }
                  .flashcard-answer-text p,
                  .flashcard-answer-text div,
                  .flashcard-answer-text span {
                    text-align: center !important;
                    margin: 0 !important;
                  }
                  .flashcard-answer-text strong {
                    font-weight: 800 !important;
                    color: #1E2822 !important;
                    border-bottom: 2px dotted #C89B62;
                    padding-bottom: 1px;
                  }
                `}</style>

                {/* ── GPU-Accelerated Question Block (Fills card initially, smoothly shrinks & glides to top on click) ── */}
                <div
                  style={{
                    width: '100%',
                    minHeight: isFlipped ? '0%' : '92%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    zIndex: 5,
                    padding: isFlipped ? '2px 0 0' : '24px 32px',
                    boxSizing: 'border-box',
                    willChange: 'min-height, padding, transform',
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden',
                    transition:
                      'min-height 0.52s cubic-bezier(0.22, 1, 0.36, 1), padding 0.52s cubic-bezier(0.22, 1, 0.36, 1), transform 0.52s cubic-bezier(0.22, 1, 0.36, 1)',
                  }}
                >
                  {/* Question Text */}
                  <div
                    className='flashcard-question-text'
                    style={{
                      fontSize: isFlipped
                        ? (cleanTitle.length > 85 ? '16.5px' : '18px')
                        : (cleanTitle.length > 180
                            ? 'clamp(36px, 3.8vw, 52px)'
                            : cleanTitle.length > 120
                              ? 'clamp(42px, 4.5vw, 60px)'
                              : cleanTitle.length > 75
                                ? 'clamp(48px, 5.2vw, 68px)'
                                : 'clamp(54px, 6vw, 78px)'),
                      fontWeight: 800,
                      color: '#16201A',
                      lineHeight: isFlipped ? 1.26 : 1.24,
                      textAlign: 'center',
                      maxWidth: isFlipped ? '90%' : '94%',
                      width: '100%',
                      letterSpacing: isFlipped ? '-0.015em' : '-0.025em',
                      transition:
                        'font-size 0.48s cubic-bezier(0.22, 1, 0.36, 1), line-height 0.48s ease, max-width 0.48s ease, letter-spacing 0.48s ease',
                    }}
                  >
                    <MarkdownView content={cleanTitle} />
                  </div>
                </div>
                {/* ── GPU-Accelerated Answer + Infographic Section (Pulled up smoothly from below) ── */}
                <div
                  style={{
                    width: "100%",
                    flex: 1,
                    minHeight: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: hasVisual ? "flex-start" : "center",
                    gap: "6px",
                    marginTop: "6px",
                    willChange: "transform, opacity",
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                    transform: isFlipped
                      ? "translate3d(0, 0px, 0)"
                      : "translate3d(0, 42vh, 0)",
                    opacity: isFlipped ? 1 : 0,
                    pointerEvents: isFlipped ? "auto" : "none",
                    transition:
                      "transform 0.54s cubic-bezier(0.22, 1, 0.36, 1) 0.02s, opacity 0.42s cubic-bezier(0.22, 1, 0.36, 1) 0.04s",
                    overflow: "hidden",
                  }}
                >
                  {/* Answer Paragraph — natural height with flex-start so top/bottom lines never clip */}
                  <div
                    style={{
                      width: "100%",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "flex-start",
                      textAlign: "center",
                      fontSize: hasVisual
                        ? safeBack.length > 280
                          ? "12.8px"
                          : safeBack.length > 200
                          ? "13.4px"
                          : "14px"
                        : "16.5px",
                      lineHeight: 1.44,
                      color: "#2C3730",
                      fontWeight: 500,
                      padding: hasVisual ? "2px 24px 4px" : "12px 30px",
                      boxSizing: "border-box",
                      overflowY: "auto",
                      flexShrink: 0,
                      maxHeight: hasVisual ? "45%" : "100%",
                    }}
                  >
                    <div
                      className="flashcard-answer-text"
                      style={{ maxWidth: "1020px", width: "100%", textAlign: "center" }}
                    >
                      <MarkdownView content={safeBack} />
                    </div>
                  </div>

                  {/* Infographic Card Below Answer */}
                  {hasVisual && (
                    <div
                      style={{
                        width: "100%",
                        flex: 1,
                        minHeight: 0,
                        position: "relative",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        padding: "0 12px 4px",
                        boxSizing: "border-box",
                        overflow: "hidden",
                      }}
                    >
                      <img
                        src={finalUrl}
                        alt="Infographic"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsZoomed(true);
                        }}
                        onError={() => setImgFailed(true)}
                        title="Click to view full screen"
                        style={{
                          maxWidth: "calc(100% - 16px)",
                          maxHeight: "calc(100% - 4px)",
                          width: "auto",
                          height: "auto",
                          objectFit: "contain",
                          borderRadius: "14px",
                          backgroundColor: "#FFFFFF",
                          padding: "6px",
                          border: "1px solid #DFDDD4",
                          boxShadow: "0 6px 22px rgba(30, 40, 34, 0.08)",
                          cursor: "zoom-in",
                          boxSizing: "border-box",
                          display: "block",
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </div>

        {/* Right Navigation Button OR Action Icons on Last Card */}
        {currentIndex < totalCards - 1 ? (
          <button
            type="button"
            className="flashcard-nav-button"
            onClick={nextCard}
            aria-label="Next card"
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              border: "none",
              background: "#ffffff",
              color: "#0f172a",
              fontWeight: "800",
              fontSize: "18px",
              boxShadow: "0 4px 14px rgba(0, 0, 0, 0.1)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              alignSelf: "center",
              transition: "all 0.2s ease",
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        ) : (
          /* On the last flashcard, show the Up next: Assessment button */
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "8px",
              flexShrink: 0,
              alignSelf: "center",
            }}
          >
            <button
              type="button"
              onClick={() => onSelectTool ? onSelectTool("assessment") : onFlashcardsCompleted?.()}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 18px",
                borderRadius: "999px",
                background: '#E7B864',
                color: '#18221D',
                fontWeight: 700,
                fontSize: "13.5px",
                border: "none",
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(79, 123, 100, 0.35)",
                transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 6px 20px rgba(79, 123, 100, 0.45)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.boxShadow = "0 4px 14px rgba(79, 123, 100, 0.35)";
              }}
              title="Proceed to Assessment"
            >
              <span>Up next: Assessment</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Full-Screen Infographic Lightbox Modal */}
      {(() => {
        if (!isZoomed) return null;

        let finalUrl = currentCard?.infographicUrl || extractedImgUrl;
        if (finalUrl && !finalUrl.startsWith('http://') && !finalUrl.startsWith('https://') && !finalUrl.startsWith('data:')) {
          if (finalUrl.startsWith('/api/')) {
            finalUrl = `${GCS_API_BASE}${finalUrl}`;
          } else if (finalUrl.startsWith('/generated_resources/')) {
            finalUrl = `${import.meta.env.BASE_URL || '/'}${finalUrl.replace(/^\//, '')}`.replace(/\/\//g, '/');
          }
        }

        if (!finalUrl) return null;

        return (
          <div
            onClick={() => setIsZoomed(false)}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              backgroundColor: "rgba(15, 23, 42, 0.85)",
              backdropFilter: "blur(6px)",
              zIndex: 9999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "24px",
              boxSizing: "border-box",
              cursor: "zoom-out",
              animation: "fadeIn 0.2s ease-out",
            }}
          >
            <div
              style={{
                position: "relative",
                maxWidth: "92vw",
                maxHeight: "92vh",
                background: "#ffffff",
                borderRadius: "20px",
                padding: "16px",
                boxShadow: "0 24px 60px rgba(0, 0, 0, 0.4)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <button
                onClick={() => setIsZoomed(false)}
                style={{
                  position: "absolute",
                  top: "-16px",
                  right: "-16px",
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  background: "#ffffff",
                  border: "2px solid #0f172a",
                  color: "#0f172a",
                  fontWeight: "900",
                  fontSize: "18px",
                  cursor: "pointer",
                  boxShadow: "0 6px 18px rgba(0,0,0,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
              <img
                src={finalUrl}
                alt="Expanded Infographic"
                style={{
                  maxWidth: "88vw",
                  maxHeight: "85vh",
                  width: "auto",
                  height: "auto",
                  objectFit: "contain",
                  borderRadius: "12px",
                }}
              />
            </div>
          </div>
        );
      })()}
    </div>
  );
}
