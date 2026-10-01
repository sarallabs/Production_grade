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
  const safeBack = (currentCard?.back || (currentCard as any)?.answer || '')
    .replace(/(?:^|\n)\s*>?\s*\*\*Infographic Prompt:\*\*[\s\S]*/gi, '')
    .trim();
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
      // currently playing → pause (toggle off)
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
    <div className="flashcards-rich flashcards-fast" style={{ width: "100%", maxWidth: "100%", alignSelf: "stretch", display: "flex", flexDirection: "column" }}>
      {currentIndex === totalCards - 1 && levelControls && (
        <div style={{ marginBottom: "20px", display: "flex", justifyContent: "center" }}>
          {levelControls}
        </div>
      )}
      <div className="flashcards-stage" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "24px", width: "100%", maxWidth: "1500px", margin: "0 auto", padding: "0 16px" }}>
        {/* Left Navigation Button */}
        <button
          type="button"
          className="flashcard-nav-button"
          onClick={prevCard}
          disabled={currentIndex === 0}
          aria-label="Previous card"
          style={{
            width: "48px",
            height: "48px",
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
          ‹
        </button>

        {/* Single-Page Flashcard Container */}
        <div
          className={`flashcard-card-container ${animationDirection ? `flashcard-animate-slide-${animationDirection}` : ''}`}
          key={currentIndex}
          style={{
            flex: 1,
            width: "100%",
            height: "75vh",
            maxHeight: "800px",
            minHeight: "500px",
            marginTop: "16px",
            borderRadius: "20px",
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
                ? "#CB30E04D"
                : (cards[currentIndex]?.level || persona) === "advanced"
                  ? "#CB30E066"
                  : "#CB30E033"
              : persona === "intermediate"
                ? "#0088FF4D"
                : persona === "advanced"
                  ? "#0088FF66"
                  : "#0088FF33",
            boxShadow: isPurpleTheme
              ? "0 16px 44px rgba(203, 48, 224, 0.20)"
              : "0 16px 44px rgba(0, 136, 255, 0.20)",
            padding: "36px 42px 36px 42px",
            display: "flex",
            flexDirection: "row",
            justifyContent: "flex-start",
            alignItems: "stretch",
            gap: "32px",
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

          {/* Left Text Column (35%) */}
          <div style={{ flex: "0 0 35%", display: "flex", flexDirection: "column", minWidth: 0 }}>
            {/* Question Title */}
            <div
            style={{
              fontSize: "22px",
              fontWeight: "800",
              color: "#0f172a",
              lineHeight: "1.32",
              width: "100%",
              marginTop: "16px",
              marginBottom: "14px",
            }}
          >
            <MarkdownView content={cleanTitle} />
          </div>

          <div
            style={{
              fontSize: "15px",
              lineHeight: "1.55",
              color: "#334155",
              width: "100%",
              marginBottom: "12px",
              minHeight: 0,
              flex: 1,
              overflowY: "auto",
              overflowX: "auto",
            }}
          >
            <MarkdownView content={safeBack} />
          </div>
          </div>

          {/* Right Image Column (65%) */}
          <div style={{ 
            flex: "1", 
            display: "flex", 
            alignItems: "stretch", 
            justifyContent: "center", 
            minWidth: 0
          }}>
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

            let finalUrl = currentCard?.infographicUrl;
            if (isPhysics) {
              const urlLower = (finalUrl || '').toLowerCase();
              if (!finalUrl || urlLower.includes('placeholder') || urlLower.includes('generated_infographics') || urlLower.includes('infographic_card') || urlLower.includes('dummy')) {
                finalUrl = PHYSICS_REAL_INFOGRAPHICS[currentIndex % PHYSICS_REAL_INFOGRAPHICS.length];
              }
            }

            const isMarketing = subjectId.includes('marketing') || subjectId.includes('mba') || subjectId.includes('management');
            const MARKETING_REAL_INFOGRAPHICS = [
              `${import.meta.env.BASE_URL || '/'}generated_resources/Nagarjuna_University/MBA/chapter_5/Learn/Flashcards/images/infographic_1.webp`.replace(/\/\//g, '/'),
              `${import.meta.env.BASE_URL || '/'}generated_resources/Nagarjuna_University/MBA/chapter_5/Learn/Flashcards/images/infographic_2.webp`.replace(/\/\//g, '/'),
              `${import.meta.env.BASE_URL || '/'}generated_resources/Nagarjuna_University/MBA/chapter_5/Learn/Flashcards/images/infographic_3.webp`.replace(/\/\//g, '/'),
              `${import.meta.env.BASE_URL || '/'}generated_resources/Nagarjuna_University/MBA/chapter_5/Learn/Flashcards/images/infographic_4.webp`.replace(/\/\//g, '/'),
              `${import.meta.env.BASE_URL || '/'}generated_resources/Nagarjuna_University/MBA/chapter_5/Learn/Flashcards/images/infographic_5.webp`.replace(/\/\//g, '/'),
              `${import.meta.env.BASE_URL || '/'}generated_resources/Nagarjuna_University/MBA/chapter_5/Learn/Flashcards/images/infographic_6.webp`.replace(/\/\//g, '/'),
              `${import.meta.env.BASE_URL || '/'}generated_resources/Nagarjuna_University/MBA/chapter_5/Learn/Flashcards/images/infographic_7.webp`.replace(/\/\//g, '/'),
              `${import.meta.env.BASE_URL || '/'}generated_resources/Nagarjuna_University/MBA/chapter_5/Learn/Flashcards/images/infographic_8.webp`.replace(/\/\//g, '/'),
            ];

            if (isMarketing) {
              const urlLower = (finalUrl || '').toLowerCase();
              if (!finalUrl || urlLower.includes('placeholder') || urlLower.includes('dummy')) {
                finalUrl = MARKETING_REAL_INFOGRAPHICS[currentIndex % MARKETING_REAL_INFOGRAPHICS.length];
              }
            }

            if (!finalUrl || imgFailed) {
              return (
                <div style={{
                  width: "100%",
                  height: "100%",
                  border: "2px dashed #94a3b8",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#64748b",
                  backgroundColor: "#f8fafc",
                  fontSize: "14px",
                }}>
                  <div style={{ textAlign: "center" }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginBottom: "8px", opacity: 0.5 }}>
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                      <circle cx="8.5" cy="8.5" r="1.5"></circle>
                      <polyline points="21 15 16 10 5 21"></polyline>
                    </svg>
                    <div>Infographic Placeholder</div>
                  </div>
                </div>
              );
            }

            return (
              <img
                src={finalUrl}
                alt="Infographic"
                onClick={() => setIsZoomed(true)}
                onError={() => setImgFailed(true)}
                title="Click to expand full screen"
                style={{
                  width: "100%",
                  height: "100%",
                  display: "block",
                  objectFit: "contain",
                  backgroundColor: "#ffffff",
                  padding: "16px",
                  borderRadius: "12px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  cursor: "zoom-in",
                  transition: "transform 0.2s ease",
                }}
              />
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
              width: "48px",
              height: "48px",
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
            ›
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
            {/* 1. Level Up Button */}
            <button
              type="button"
              onClick={() => onLevelUpPersona?.()}
              title={`Current Level: ${persona}. Click to Level Up`}
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "50%",
                background: "#ffffff",
                border: "1.5px solid #0f172a",
                boxShadow: "0 4px 12px rgba(15, 23, 42, 0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                padding: "5px",
                boxSizing: "border-box",
                transition: "transform 0.2s ease, boxShadow 0.2s ease",
              }}
            >
              <img
                src={`${import.meta.env.BASE_URL}icon-level-up.png`}
                alt="Level Up"
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
            </button>

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
              <img
                src={`${import.meta.env.BASE_URL}icon-quick-study.png`}
                alt="Quick Study"
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
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
              <img
                src={`${import.meta.env.BASE_URL}icon-detailed-study.png`}
                alt="Detailed Study"
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
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

        let finalUrl = currentCard?.infographicUrl;
        if (isPhysics) {
          const urlLower = (finalUrl || '').toLowerCase();
          if (!finalUrl || urlLower.includes('placeholder') || urlLower.includes('generated_infographics') || urlLower.includes('infographic_card') || urlLower.includes('dummy')) {
            finalUrl = PHYSICS_REAL_INFOGRAPHICS[currentIndex % PHYSICS_REAL_INFOGRAPHICS.length];
          }
        }

        const isMarketing = subjectId.includes('marketing') || subjectId.includes('mba') || subjectId.includes('management');
        const MARKETING_REAL_INFOGRAPHICS = [
          `${import.meta.env.BASE_URL || '/'}generated_resources/Nagarjuna_University/MBA/chapter_5/Learn/Flashcards/images/infographic_1.webp`.replace(/\/\//g, '/'),
          `${import.meta.env.BASE_URL || '/'}generated_resources/Nagarjuna_University/MBA/chapter_5/Learn/Flashcards/images/infographic_2.webp`.replace(/\/\//g, '/'),
          `${import.meta.env.BASE_URL || '/'}generated_resources/Nagarjuna_University/MBA/chapter_5/Learn/Flashcards/images/infographic_3.webp`.replace(/\/\//g, '/'),
          `${import.meta.env.BASE_URL || '/'}generated_resources/Nagarjuna_University/MBA/chapter_5/Learn/Flashcards/images/infographic_4.webp`.replace(/\/\//g, '/'),
          `${import.meta.env.BASE_URL || '/'}generated_resources/Nagarjuna_University/MBA/chapter_5/Learn/Flashcards/images/infographic_5.webp`.replace(/\/\//g, '/'),
          `${import.meta.env.BASE_URL || '/'}generated_resources/Nagarjuna_University/MBA/chapter_5/Learn/Flashcards/images/infographic_6.webp`.replace(/\/\//g, '/'),
          `${import.meta.env.BASE_URL || '/'}generated_resources/Nagarjuna_University/MBA/chapter_5/Learn/Flashcards/images/infographic_7.webp`.replace(/\/\//g, '/'),
          `${import.meta.env.BASE_URL || '/'}generated_resources/Nagarjuna_University/MBA/chapter_5/Learn/Flashcards/images/infographic_8.webp`.replace(/\/\//g, '/'),
        ];

        if (isMarketing) {
          const urlLower = (finalUrl || '').toLowerCase();
          if (!finalUrl || urlLower.includes('placeholder') || urlLower.includes('dummy')) {
            finalUrl = MARKETING_REAL_INFOGRAPHICS[currentIndex % MARKETING_REAL_INFOGRAPHICS.length];
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
                ✕
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
