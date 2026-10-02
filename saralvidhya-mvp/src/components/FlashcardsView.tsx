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
      <div className="flashcards-stage" style={{ display: "flex", alignItems: "center", paddingTop: "24px", justifyContent: "center", gap: "8px", width: "100%", padding: "24px 4px 0" }}>
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
            flex: 1,
            minHeight: "65vh",
            maxHeight: "calc(100vh - 80px)",
            borderRadius: "24px",
            border: isPurpleTheme
              ? (cards[currentIndex]?.level || persona) === "intermediate"
                ? "2px solid #CB30E080"
                : (cards[currentIndex]?.level || persona) === "advanced"
                  ? "2px solid #CB30E0A0"
                  : "1.5px solid #CB30E04D"
              : persona === "intermediate"
                ? "2px solid #0088FF80"
                : persona === "advanced"
                  ? "2px solid #0088FFA0"
                  : "1.5px solid #0088FF4D",
            background: isPurpleTheme
              ? (cards[currentIndex]?.level || persona) === "intermediate"
                ? "#CB30E033"
                : (cards[currentIndex]?.level || persona) === "advanced"
                  ? "#CB30E04D"
                  : "#CB30E01A"
              : persona === "intermediate"
                ? "#0088FF33"
                : persona === "advanced"
                  ? "#0088FF4D"
                  : "#0088FF1A",
            boxShadow: isPurpleTheme
              ? "0 16px 44px rgba(203, 48, 224, 0.20)"
              : "0 16px 44px rgba(0, 136, 255, 0.20)",
            padding: "24px",
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
                : "linear-gradient(135deg, #bfdbfe 0%, #93c5fd 100%)",
              borderRight: isPurpleTheme ? "2px solid #c026d3" : "2px solid #3b82f6",
              borderBottom: isPurpleTheme ? "2px solid #c026d3" : "2px solid #3b82f6",
              borderTopLeftRadius: "18px",
              borderBottomRightRadius: "12px",
              color: "#0f172a",
              fontWeight: "800",
              fontSize: "15px",
              padding: "6px 16px",
              zIndex: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: isPurpleTheme
                ? "0 4px 12px rgba(192, 38, 211, 0.15)"
                : "0 4px 12px rgba(59, 130, 246, 0.15)",
              pointerEvents: "none",
            }}
          >
            {currentIndex + 1}/{totalCards}
          </div>

          {/* Question title moved inside flex container */}

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
              if (finalUrl.startsWith('../Mindmaps/')) {
                finalUrl = `https://saralvidhya-api-193782571555.asia-south1.run.app/api/content/angrau/entomology/chapter_01/${finalUrl.replace('../Mindmaps/', 'Mindmaps/')}`;
              } else if (finalUrl.startsWith('/api/')) {
                finalUrl = `https://saralvidhya-api-193782571555.asia-south1.run.app${finalUrl}`;
              }
            }
            if (isPhysics) {
              const urlLower = (finalUrl || '').toLowerCase();
              if (!finalUrl || urlLower.includes('placeholder') || urlLower.includes('generated_infographics') || urlLower.includes('infographic_card') || urlLower.includes('dummy')) {
                finalUrl = PHYSICS_REAL_INFOGRAPHICS[currentIndex % PHYSICS_REAL_INFOGRAPHICS.length];
              }
            }

            const hasImage = !!finalUrl && !imgFailed;

            return (
              <div style={{ display: 'flex', flexDirection: hasImage ? 'row' : 'column', gap: '24px', flex: 1, overflow: 'hidden' }}>
                {/* Text Content */}
                <div
                  style={{
                    fontSize: "19px",
                    lineHeight: "1.65",
                    color: "#334155",
                    width: hasImage ? "calc(42% - 12px)" : "100%",
                    flexShrink: 0,
                    marginBottom: "12px",
                    overflowY: "auto",
                    paddingRight: hasImage ? "16px" : "0",
                  }}
                >
                  <div
                    style={{
                      fontSize: "24px",
                      fontWeight: "800",
                      color: "#0f172a",
                      lineHeight: "1.32",
                      marginBottom: "16px",
                      marginTop: "4px"
                    }}
                  >
                    <MarkdownView content={cleanTitle} />
                  </div>
                  <MarkdownView content={safeBack} />
                </div>
                
                {/* Infographic */}
                {hasImage && (
                  <div style={{ width: "calc(58% - 12px)", flexShrink: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', overflowY: 'auto' }}>
                    <img
                      src={finalUrl}
                      alt="Infographic"
                      onClick={() => setIsZoomed(true)}
                      onError={() => setImgFailed(true)}
                      title="Click to expand full screen"
                      style={{
                        width: "100%",
                        height: "auto",
                        maxHeight: "100%",
                        objectFit: "contain",
                        borderRadius: "12px",
                        backgroundColor: "#ffffff",
                        padding: "12px",
                        border: "1px solid #cbd5e1",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                        cursor: "zoom-in",
                        flexShrink: 0,
                        transition: "transform 0.2s ease",
                      }}
                    />
                  </div>
                )}
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
                  border: `1.5px solid ${isPurpleTheme ? "#9333ea" : "#0088ff"}`,
                  boxShadow: isPurpleTheme
                    ? "0 4px 12px rgba(147,51,234,0.15)"
                    : "0 4px 12px rgba(0,136,255,0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={isPurpleTheme ? "#9333ea" : "#0088ff"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
                    : "linear-gradient(135deg, #0088ff, #0066cc)",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  boxShadow: isPurpleTheme
                    ? "0 4px 14px rgba(147,51,234,0.4)"
                    : "0 4px 14px rgba(0,136,255,0.4)",
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
