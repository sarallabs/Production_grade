import { useEffect, useCallback, useState, useRef } from 'react';
import { googleTtsSpeak, googleTtsStop } from '@/services/googleTtsService';
import MarkdownView from '@/components/MarkdownView';
import type { ToolId } from '@/components/ToolsMenu';

interface Card {
  front?: string;
  back?: string;
  question?: string;
  answer?: string;
  infographicUrl?: string;
  level?: "beginner" | "intermediate" | "advanced";
}

interface Props {
  cards: Card[];
  subjectId?: string;
  persona?: string;
  /** Called whenever speaking state changes â€” true = currently speaking */
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
  // 'out' = card turning edge-on, 'in' = turning back to face the user
  const [flipPhase, setFlipPhase] = useState<'out' | 'in' | null>(null);
  const flipTimers = useRef<number[]>([]);
  const flipCard = (target?: boolean) => {
    if (flipPhase) return;
    flipTimers.current.forEach((t) => window.clearTimeout(t));
    setFlipPhase('out');
    flipTimers.current = [
      window.setTimeout(() => {
        setIsFlipped((prev) => (typeof target === 'boolean' ? target : !prev));
        setFlipPhase('in');
      }, 170),
      window.setTimeout(() => setFlipPhase(null), 360),
    ];
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
    <div className="flashcards-rich flashcards-fast" style={{ width: "100%", height: "100%", flex: 1, display: "flex", flexDirection: "column", alignItems: "stretch" }}>
      {currentIndex === totalCards - 1 && levelControls && (
        <div style={{ marginBottom: "20px", display: "flex", justifyContent: "center" }}>
          {levelControls}
        </div>
      )}
      <div className="flashcards-stage" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "16px", width: "100%", maxWidth: "min(98%, 1320px)", margin: "0 auto", padding: "8px 12px", flex: 1, minHeight: 0 }}>
        {/* Left Navigation Button */}
        <button
          type="button"
          className="flashcard-nav-button"
          onClick={prevCard}
          disabled={currentIndex === 0}
          aria-label="Previous card"
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            border: "none",
            background: "#ffffff",
            color: "#0f172a",
            fontWeight: "800",
            fontSize: "20px",
            boxShadow: "0 6px 18px rgba(0, 0, 0, 0.1)",
            cursor: currentIndex === 0 ? "default" : "pointer",
            opacity: currentIndex === 0 ? 0.4 : 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            transition: "all 0.2s ease",
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <div
          className={`flashcard-card-container ${animationDirection ? `flashcard-animate-slide-${animationDirection}` : ''}`}
          key={currentIndex}
          style={{
            width: "100%",
            maxWidth: "min(96%, 1240px)",
            flex: 1,
            height: "calc((100vh - 120px) * 0.9)",
            maxHeight: "738px",
            minHeight: "396px",
            borderRadius: "24px",
            border: isPurpleTheme
              ? (cards[currentIndex]?.level || persona) === "intermediate"
                ? "2px solid #CB30E080"
                : (cards[currentIndex]?.level || persona) === "advanced"
                  ? "2px solid #CB30E0A0"
                  : "1.5px solid #CB30E04D"
              : (cards[currentIndex]?.level || persona) === "intermediate"
                ? "2px solid rgba(111, 154, 127, 0.70)"
                : (cards[currentIndex]?.level || persona) === "advanced"
                  ? "2px solid rgba(111, 154, 127, 0.95)"
                  : "1.5px solid rgba(111, 154, 127, 0.45)",
            background: isPurpleTheme
              ? (cards[currentIndex]?.level || persona) === "intermediate"
                ? "#CB30E033"
                : (cards[currentIndex]?.level || persona) === "advanced"
                  ? "#CB30E04D"
                  : "#CB30E01A"
              : (cards[currentIndex]?.level || persona) === "intermediate"
                ? "rgba(111, 154, 127, 0.36)"
                : (cards[currentIndex]?.level || persona) === "advanced"
                  ? "rgba(111, 154, 127, 0.55)"
                  : "rgba(111, 154, 127, 0.18)",
            boxShadow: isPurpleTheme
              ? "0 16px 44px rgba(203, 48, 224, 0.20)"
              : (cards[currentIndex]?.level || persona) === "intermediate"
                ? "0 16px 44px rgba(45, 62, 54, 0.20)"
                : (cards[currentIndex]?.level || persona) === "advanced"
                  ? "0 16px 44px rgba(45, 62, 54, 0.28)"
                  : "0 16px 44px rgba(45, 62, 54, 0.14)",
            padding: "18px 24px 14px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            alignItems: "stretch",
            boxSizing: "border-box",
            position: "relative",
            overflow: "hidden",
            transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease",
          }}
        >
          {/* Top-Left Corner Floating Progress Badge (e.g. 3/20) */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              background: isPurpleTheme
                ? "linear-gradient(135deg, #f5d0fe 0%, #e9d5ff 100%)"
                : "linear-gradient(135deg, #dcf0e4 0%, #c1dfcd 100%)",
              borderRight: isPurpleTheme ? "2px solid #c026d3" : "2px solid #6F9A7F",
              borderBottom: isPurpleTheme ? "2px solid #c026d3" : "2px solid #6F9A7F",
              borderTopLeftRadius: "18px",
              borderBottomRightRadius: "12px",
              color: isPurpleTheme ? "#0f172a" : "#2D3E36",
              fontWeight: "800",
              fontSize: "15px",
              padding: "6px 16px",
              zIndex: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: isPurpleTheme
                ? "0 4px 12px rgba(192, 38, 211, 0.15)"
                : "0 4px 12px rgba(45, 62, 54, 0.15)",
              pointerEvents: "none",
            }}
          >
            {currentIndex + 1}/{totalCards}
          </div>

          {/* Progress badge */}

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              minHeight: 0,
              transformOrigin: 'center center',
              transform: flipPhase === 'out' ? 'perspective(1400px) rotateY(90deg)' : 'perspective(1400px) rotateY(0deg)',
              transition: flipPhase === 'out'
                ? 'transform 0.17s cubic-bezier(0.55, 0, 0.9, 0.5)'
                : flipPhase === 'in'
                  ? 'transform 0.19s cubic-bezier(0.1, 0.5, 0.45, 1)'
                  : 'none',
              ...(flipPhase === 'in' ? { animation: 'sv-fc-flip-in 0.19s cubic-bezier(0.1, 0.5, 0.45, 1)' } : {}),
            }}
          >
          <style>{`@keyframes sv-fc-flip-in { from { transform: perspective(1400px) rotateY(-90deg); } to { transform: perspective(1400px) rotateY(0deg); } }`}</style>
          {(() => {
            const isPhysics = subjectId === 'anu_physics' || subjectId.includes('physics');
            const PHYSICS_REAL_INFOGRAPHICS = [
              `${import.meta.env.BASE_URL || '/'}generated_resources/Nagarjuna_University/physics/chapter_01/Learn/MindMaps/AQM%20Infographics%20VD-1/AQM_Overview.png`.replace(/\/\//g, '/'),
              `${import.meta.env.BASE_URL || '/'}generated_resources/Nagarjuna_University/physics/chapter_01/Learn/MindMaps/AQM%20Infographics%20VD-1/1.%20Klein-Gordon%20Equation/klein_gordon_infographic.png`.replace(/\/\//g, '/'),
              `${import.meta.env.BASE_URL || '/'}generated_resources/Nagarjuna_University/physics/chapter_01/Learn/MindMaps/AQM%20Infographics%20VD-1/2.%20Difficulties%20of%20K-G/difficulties_infographic.png`.replace(/\/\//g, '/'),
              `${import.meta.env.BASE_URL || '/'}generated_resources/Nagarjuna_University/physics/chapter_01/Learn/MindMaps/AQM%20Infographics%20VD-1/3.%20Dirac%20Equation/dirac_equation_infographic.png`.replace(/\/\//g, '/'),
              `${import.meta.env.BASE_URL || '/'}generated_resources/Nagarjuna_University/physics/chapter_01/Learn/MindMaps/AQM%20Infographics%20VD-1/4.%20Hydrogen%20Atom/hydrogen_atom_infographic.png`.replace(/\/\//g, '/'),
              `${import.meta.env.BASE_URL || '/'}generated_resources/Nagarjuna_University/physics/chapter_01/Learn/MindMaps/AQM%20Infographics%20VD-1/AQM_Mind_Map.png`.replace(/\/\//g, '/'),
            ];

            let finalUrl = currentCard?.infographicUrl || extractedImgUrl;
            if (finalUrl && !finalUrl.startsWith('http://') && !finalUrl.startsWith('https://') && !finalUrl.startsWith('data:')) {
              const imgBase = import.meta.env.VITE_GCS_API_BASE
                ? `${import.meta.env.VITE_GCS_API_BASE}/api/content/angrau/entomology`
                : '/generated_resources/angrau';
              if (finalUrl.startsWith('../Mindmaps/')) {
                finalUrl = `${imgBase}/chapter_01/${finalUrl.replace('../Mindmaps/', 'Mindmaps/')}`;
              } else if (finalUrl.startsWith('/api/') && import.meta.env.VITE_GCS_API_BASE) {
                finalUrl = `${import.meta.env.VITE_GCS_API_BASE}${finalUrl}`;
              }
            }
            if (isPhysics) {
              const urlLower = (finalUrl || '').toLowerCase();
              if (!finalUrl || urlLower.includes('placeholder') || urlLower.includes('generated_infographics') || urlLower.includes('infographic_card') || urlLower.includes('dummy')) {
                finalUrl = PHYSICS_REAL_INFOGRAPHICS[currentIndex % PHYSICS_REAL_INFOGRAPHICS.length];
              }
            }

            const hasImage = !!finalUrl && !imgFailed;

            if (!isFlipped) {
              // ── FRONT FACE: Question only ─────────────────────────────────
              return (
                <div
                  style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center', alignItems: 'center', gap: '32px', cursor: 'pointer' }}
                  onClick={() => flipCard(true)}
                >
                  <div style={{
                    fontSize: '26px',
                    fontWeight: '800',
                    color: '#0f172a',
                    lineHeight: '1.35',
                    textAlign: 'center',
                    maxWidth: '82%',
                  }}>
                    <MarkdownView content={cleanTitle} />
                  </div>

                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); flipCard(true); }}
                    style={{
                      background: 'rgba(255,255,255,0.4)',
                      border: `1.5px solid ${isPurpleTheme ? 'rgba(203,48,224,0.4)' : 'rgba(111,154,127,0.6)'}`,
                      borderRadius: '999px',
                      padding: '10px 28px',
                      fontSize: '15px',
                      fontWeight: 600,
                      color: isPurpleTheme ? '#7e22ce' : '#2D3E36',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      backdropFilter: 'blur(4px)',
                      transition: 'all 0.18s ease',
                    }}
                  >
                    Click to reveal Answer
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                </div>
              );
            }

            // ── BACK FACE: Answer on Top (Centered) + Infographic Below (Centered) ──
            return (
              <div
                title="Click to flip back to the question"
                onClick={() => flipCard(false)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: hasImage ? 'flex-start' : 'center',
                  gap: hasImage ? '8px' : '16px',
                  flex: 1,
                  height: '100%',
                  minHeight: 0,
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  cursor: 'pointer',
                  paddingTop: hasImage ? '4px' : '16px',
                  boxSizing: 'border-box',
                }}
              >
                {/* Answer text: Top center div (no "Answer." heading) */}
                <div
                  style={{
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    fontSize: hasImage ? '16px' : '22px',
                    lineHeight: '1.45',
                    color: '#1e293b',
                    fontWeight: 500,
                    padding: hasImage ? '0 16px 4px' : '20px 32px',
                    boxSizing: 'border-box',
                    overflowY: 'auto',
                    flexShrink: 0,
                    maxHeight: hasImage ? '35%' : '100%',
                  }}
                >
                  <style>{`
                    .flashcard-answer-text p, .flashcard-answer-text div, .flashcard-answer-text span {
                      text-align: center !important;
                      margin: 0 !important;
                    }
                  `}</style>
                  <div className="flashcard-answer-text" style={{ maxWidth: '1080px', width: '100%', textAlign: 'center' }}>
                    <MarkdownView content={safeBack} />
                  </div>
                </div>

                {/* Infographic: Bottom center div — clear, generously sized and NEVER cut off */}
                {hasImage && (
                  <div
                    style={{
                      width: '100%',
                      flex: 1,
                      minHeight: 0,
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      padding: '2px 8px 6px',
                      boxSizing: 'border-box',
                      position: 'relative',
                    }}
                  >
                    <img
                      src={finalUrl}
                      alt="Infographic"
                      onClick={(e) => { e.stopPropagation(); setIsZoomed(true); }}
                      onError={() => setImgFailed(true)}
                      title="Click to view full screen"
                      style={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                        width: 'auto',
                        height: 'auto',
                        objectFit: 'contain',
                        borderRadius: '12px',
                        backgroundColor: '#ffffff',
                        padding: '6px',
                        border: '1px solid rgba(111, 154, 127, 0.35)',
                        boxShadow: '0 4px 18px rgba(45, 62, 54, 0.10)',
                        cursor: 'zoom-in',
                        boxSizing: 'border-box',
                        display: 'block',
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })()}
          </div>
        </div>

        {/* Right Navigation Button OR Action Icons on Last Card */}
        {currentIndex < totalCards - 1 ? (
          <button
            type="button"
            className="flashcard-nav-button"
            onClick={nextCard}
            aria-label="Next card"
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              border: "none",
              background: "#ffffff",
              color: "#0f172a",
              fontWeight: "800",
              fontSize: "20px",
              boxShadow: "0 6px 18px rgba(0, 0, 0, 0.1)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              transition: "all 0.2s ease",
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        ) : (
          /* On the last flashcard, replace the greyed-out right arrow with the action icons on the same horizontal axis */
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "10px",
              flexShrink: 0,
            }}
          >
            {/* 1a. Level Down Button */}
            {onLevelDownPersona && persona !== 'beginner' && (
              <button
                type="button"
                onClick={() => onLevelDownPersona?.()}
                title={`Level Down to ${persona === 'intermediate' ? 'Beginner' : 'Intermediate'}`}
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "50%",
                  background: "#ffffff",
                  border: `1.5px solid ${isPurpleTheme ? "#9333ea" : "#6F9A7F"}`,
                  boxShadow: isPurpleTheme
                    ? "0 4px 12px rgba(147,51,234,0.15)"
                    : "0 4px 12px rgba(45,62,54,0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={isPurpleTheme ? "#9333ea" : "#4F7B64"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
            )}

            {/* 1b. Level Up Button */}
            {onLevelUpPersona && (
              <button
                type="button"
                onClick={() => onLevelUpPersona?.()}
                title={`Level Up to ${persona === 'beginner' ? 'Intermediate' : persona === 'intermediate' ? 'Advanced' : 'Beginner'}`}
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "50%",
                  background: isPurpleTheme
                    ? "linear-gradient(135deg, #9333ea, #cb30e0)"
                    : "linear-gradient(135deg, #4F7B64, #2D3E36)",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  boxShadow: isPurpleTheme
                    ? "0 4px 14px rgba(147,51,234,0.4)"
                    : "0 4px 14px rgba(45,62,54,0.35)",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="18 15 12 9 6 15" />
                </svg>
              </button>
            )}


            {/* 2. Quick Study Button */}
            <button
              type="button"
              onClick={() => onSelectTool?.("summary")}
              title="Quick Study"
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "50%",
                background: "#ffffff",
                border: "1.5px solid #fdba74",
                boxShadow: "0 4px 12px rgba(249, 115, 22, 0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                padding: "4px",
                boxSizing: "border-box",
                transition: "transform 0.2s ease, boxShadow 0.2s ease",
              }}
            >
              {/* Lightning bolt = Quick Summary */}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </button>

            {/* 3. Detailed Study Button */}
            <button
              type="button"
              onClick={() => onSelectTool?.("detailed")}
              title="Detailed Study"
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "50%",
                background: "#ffffff",
                border: "1.5px solid #fdba74",
                boxShadow: "0 4px 12px rgba(249, 115, 22, 0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                padding: "4px",
                boxSizing: "border-box",
                transition: "transform 0.2s ease, boxShadow 0.2s ease",
              }}
            >
              {/* Open book = Detailed Study */}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
            </button>

            {/* 4. Home / Video Player Button */}
            <button
              type="button"
              onClick={() => onSelectTool?.("videos")}
              title="Home (Videos)"
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "50%",
                background: "#ffffff",
                border: "2px solid #f97316",
                boxShadow: "0 4px 12px rgba(249, 115, 22, 0.16)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "transform 0.2s ease, boxShadow 0.2s ease",
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M3 10.5L12 3L21 10.5V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V10.5Z" stroke="#f97316" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M9 21V14H15V21" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Full-Screen Infographic Lightbox Modal */}
      {(() => {
        if (!isZoomed) return null;
        const isPhysics = subjectId === 'anu_physics' || subjectId.includes('physics');
        const PHYSICS_REAL_INFOGRAPHICS = [
          `${import.meta.env.BASE_URL || '/'}generated_resources/Nagarjuna_University/physics/chapter_01/Learn/MindMaps/AQM%20Infographics%20VD-1/AQM_Overview.png`.replace(/\/\//g, '/'),
          `${import.meta.env.BASE_URL || '/'}generated_resources/Nagarjuna_University/physics/chapter_01/Learn/MindMaps/AQM%20Infographics%20VD-1/1.%20Klein-Gordon%20Equation/klein_gordon_infographic.png`.replace(/\/\//g, '/'),
          `${import.meta.env.BASE_URL || '/'}generated_resources/Nagarjuna_University/physics/chapter_01/Learn/MindMaps/AQM%20Infographics%20VD-1/2.%20Difficulties%20of%20K-G/difficulties_infographic.png`.replace(/\/\//g, '/'),
          `${import.meta.env.BASE_URL || '/'}generated_resources/Nagarjuna_University/physics/chapter_01/Learn/MindMaps/AQM%20Infographics%20VD-1/3.%20Dirac%20Equation/dirac_equation_infographic.png`.replace(/\/\//g, '/'),
          `${import.meta.env.BASE_URL || '/'}generated_resources/Nagarjuna_University/physics/chapter_01/Learn/MindMaps/AQM%20Infographics%20VD-1/4.%20Hydrogen%20Atom/hydrogen_atom_infographic.png`.replace(/\/\//g, '/'),
          `${import.meta.env.BASE_URL || '/'}generated_resources/Nagarjuna_University/physics/chapter_01/Learn/MindMaps/AQM%20Infographics%20VD-1/AQM_Mind_Map.png`.replace(/\/\//g, '/'),
        ];

        let finalUrl = currentCard?.infographicUrl || extractedImgUrl;
        if (isPhysics) {
          const urlLower = (finalUrl || '').toLowerCase();
          if (!finalUrl || urlLower.includes('placeholder') || urlLower.includes('generated_infographics') || urlLower.includes('infographic_card') || urlLower.includes('dummy')) {
            finalUrl = PHYSICS_REAL_INFOGRAPHICS[currentIndex % PHYSICS_REAL_INFOGRAPHICS.length];
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
