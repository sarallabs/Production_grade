import React, { useState, useRef, useMemo, useEffect } from "react";
import MarkdownView from "@/components/MarkdownView";
import { askGemini } from "@/services/askService";
import { googleTtsSpeak, googleTtsStop } from "@/services/googleTtsService";
import {
  startSpeechSession,
  hasWebSpeechSupport,
  type SpeechSession,
} from "@/services/speechService";
import type { DifficultyLevel } from "@/data/contentRepository";
import "./AskBotView.css";

const ASK_LANGUAGES = [
  { code: "en-IN", label: "English", flag: "🇬🇧" },
  { code: "hi-IN", label: "हिन्दी", flag: "🇮🇳" },
  { code: "te-IN", label: "తెలుగు", flag: "🇮🇳" },
  { code: "ur-PK", label: "اردو", flag: "🇵🇰" },
  { code: "or-IN", label: "ଓଡ଼ିଆ", flag: "🇮🇳" },
];

const DEFAULT_HISTORY_ITEMS = [
  "How to kill cockroach?",
  "How long can a cockroach live without food or water?",
  "What is the life cycle of a cockroach?",
  "Explain respiratory system of Periplaneta americana",
  "How do cockroaches breathe?",
  "What are the mouthparts of cockroach?",
  "Economic importance of insect pests",
  "Difference between male and female cockroach",
];

export default function AskBotView({
  chapterName,
  subjectId,
  chapterNumber: _chapterNumber,
  difficulty: _difficulty,
  className: _className,
  subjectName,
}: {
  chapterName: string;
  subjectId: string;
  chapterNumber: number;
  difficulty: DifficultyLevel;
  className: string;
  subjectName: string;
}) {
  const chatStorageKey = useMemo(
    () => `ask_chat_${subjectId}_${_chapterNumber}_${_difficulty}`,
    [subjectId, _chapterNumber, _difficulty],
  );
  const historyStorageKey = useMemo(
    () => `ask_history_${subjectId}_${_chapterNumber}`,
    [subjectId, _chapterNumber],
  );

  // Sidebar Open/Closed state (Screen 3 vs Screens 1 & 2)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // History questions list
  const [historyItems, setHistoryItems] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(historyStorageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return DEFAULT_HISTORY_ITEMS;
  });

  const [messages, setMessages] = useState<
    { role: "user" | "bot"; text: string; loading?: boolean }[]
  >(() => {
    try {
      const raw = localStorage.getItem(chatStorageKey);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed)
        ? parsed
            .filter(
              (m: any) =>
                m &&
                typeof m.text === "string" &&
                (m.role === "user" || m.role === "bot"),
            )
            .slice(-30)
        : [];
    } catch {
      return [];
    }
  });

  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [speakingIdx, setSpeakingIdx] = useState<number | null>(null);
  const [selectedLang, setSelectedLang] = useState(
    subjectId === "pubadm_ur" ? "ur-PK" : "en-IN",
  );
  const [micError, setMicError] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const lastBotMsgRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const speechSessionRef = useRef<SpeechSession | null>(null);
  const sessionStartingPromiseRef = useRef<Promise<SpeechSession> | null>(null);
  const isListeningRef = useRef(false);
  const askedViaMicRef = useRef(false);
  const pointerDownTimeRef = useRef(0);
  const listeningStartedAtRef = useRef(0);
  const isHoldingMicRef = useRef(false);
  const [showWave, setShowWave] = useState(false);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const waveBarRefs = useRef<(HTMLDivElement | null)[]>([]);
  const currentInputRef = useRef("");

  useEffect(() => {
    currentInputRef.current = input;
  }, [input]);

  const isStreamingMic = hasWebSpeechSupport();

  // Persist chat
  useEffect(() => {
    const cleaned = messages.filter((m) => !m.loading).slice(-30);
    localStorage.setItem(chatStorageKey, JSON.stringify(cleaned));
  }, [messages, chatStorageKey]);

  // Persist history
  useEffect(() => {
    localStorage.setItem(historyStorageKey, JSON.stringify(historyItems));
  }, [historyItems, historyStorageKey]);

  // Auto-scroll: show the loading dots / user question at the bottom, but once a
  // bot answer has arrived, keep the view at the TOP of that answer so long
  // answers can be read from the start.
  useEffect(() => {
    if (messages.length === 0) return;
    const last = messages[messages.length - 1];
    if (last.role === "bot" && !last.loading && lastBotMsgRef.current) {
      lastBotMsgRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Cleanup speech session + TTS on unmount
  useEffect(() => {
    return () => {
      isListeningRef.current = false;
      cleanupAnalyser();
      if (speechSessionRef.current) {
        speechSessionRef.current.stop().catch(() => {});
        speechSessionRef.current = null;
      }
      googleTtsStop();
    };
  }, []);

  // ── Speech Recording & Visualizer ───────────────────────────────────────────
  const cleanupAnalyser = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    analyserRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  const startAnalyserStream = async () => {
    if (!navigator.mediaDevices?.getUserMedia) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });
      if (!isListeningRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      streamRef.current = stream;
      const AudioCtx =
        window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      analyserRef.current = analyser;
      const data = new Uint8Array(analyser.frequencyBinCount);
      const bases = [0.4, 0.6, 0.8, 1.0, 0.9, 0.7, 1.0, 0.7, 0.9, 1.0, 0.8, 0.6, 0.4];

      const tick = () => {
        if (!analyserRef.current || !isListeningRef.current) return;
        analyser.getByteFrequencyData(data);
        const voiceData = Array.from(data.slice(2, 30));
        const avg = voiceData.reduce((a, b) => a + b, 0) / voiceData.length;
        const level = Math.min(1, avg / 50);
        const step = Math.max(1, Math.floor(data.length / 13));
        bases.forEach((base, i) => {
          const el = waveBarRefs.current[i];
          if (!el) return;
          let h: number;
          if (level > 0.05) {
            const slice = Array.from(data.slice(i * step, (i + 1) * step));
            const bandAvg = slice.reduce((a, b) => a + b, 0) / slice.length;
            h = Math.max(6, Math.min(55, base * (bandAvg / 100) * 55));
          } else {
            h = Math.round(base * 6);
          }
          el.style.height = `${h}px`;
        });
        animFrameRef.current = requestAnimationFrame(tick);
      };
      animFrameRef.current = requestAnimationFrame(tick);
    } catch {
      // Visualizer stream error is non-fatal for speech recognition
    }
  };

  const startMic = async () => {
    if (isListeningRef.current || isTranscribing) return;
    setMicError(null);
    isListeningRef.current = true;
    listeningStartedAtRef.current = Date.now();
    setIsListening(true);
    setShowWave(true);
    setInput("");
    currentInputRef.current = "";

    // Start background audio visualizer without blocking speech recognition
    startAnalyserStream();

    try {
      const sessionPromise = startSpeechSession({
        language: selectedLang,
        onInterim: (text) => {
          currentInputRef.current = text;
          setInput(text);
        },
        onError: (err) => {
          console.warn("Speech recognition error:", err);
          if (err === "not-allowed" || err === "permission-denied") {
            setMicError("Microphone access denied. Please click the microphone/lock icon in your browser address bar to allow microphone access.");
          } else if (err !== "no-speech" && err !== "aborted") {
            setMicError(`Microphone error: ${err}`);
          }
          isListeningRef.current = false;
          setIsListening(false);
          setShowWave(false);
          cleanupAnalyser();
        },
        onEnd: () => {
          if (isListeningRef.current && !isHoldingMicRef.current) {
            stopMic(true);
          }
        },
      });

      sessionStartingPromiseRef.current = sessionPromise;
      const session = await sessionPromise;
      speechSessionRef.current = session;
      sessionStartingPromiseRef.current = null;
    } catch (e: any) {
      console.error("Failed to start speech session:", e);
      const errMsg = e.message || "Could not start microphone.";
      setMicError(errMsg);
      isListeningRef.current = false;
      setIsListening(false);
      setShowWave(false);
      cleanupAnalyser();
      sessionStartingPromiseRef.current = null;
      speechSessionRef.current = null;
    }
  };

  const stopMic = async (autoSend = false) => {
    if (!isListeningRef.current && !speechSessionRef.current && !sessionStartingPromiseRef.current) return;
    isListeningRef.current = false;
    setIsListening(false);
    setShowWave(false);
    cleanupAnalyser();

    if (!isStreamingMic) {
      setIsTranscribing(true);
    }

    let session = speechSessionRef.current;
    if (!session && sessionStartingPromiseRef.current) {
      try {
        session = await sessionStartingPromiseRef.current;
      } catch {
        session = null;
      }
    }
    speechSessionRef.current = null;
    sessionStartingPromiseRef.current = null;

    let transcript = "";
    if (session) {
      try {
        transcript = await session.stop();
      } catch (e: any) {
        console.error("Transcription error:", e);
      }
    }
    setIsTranscribing(false);

    const finalTranscript = (transcript || currentInputRef.current || input).trim();

    if (finalTranscript) {
      setInput(finalTranscript);
      if (autoSend) {
        askedViaMicRef.current = true;
        handleSend(finalTranscript);
      }
    }
  };

  const handleMicPointerDown = (e: React.PointerEvent) => {
    if (isSending || isTranscribing) return;
    e.preventDefault();

    if (isListeningRef.current) {
      // If already recording and tapped after 300ms, stop & send
      if (Date.now() - listeningStartedAtRef.current > 300) {
        stopMic(true);
      }
      return;
    }

    pointerDownTimeRef.current = Date.now();
    isHoldingMicRef.current = true;
    startMic();
  };

  const handleMicPointerUp = (e: React.PointerEvent) => {
    if (isSending || isTranscribing) return;
    e.preventDefault();

    if (isHoldingMicRef.current) {
      isHoldingMicRef.current = false;
      const elapsed = Date.now() - pointerDownTimeRef.current;
      if (elapsed > 450) {
        // User held down to speak: Stop & send on release
        stopMic(true);
      }
      // If elapsed <= 450ms, this was a tap to toggle on: keep recording!
    }
  };

  const handleMicPointerLeave = () => {
    if (isHoldingMicRef.current) {
      isHoldingMicRef.current = false;
      const elapsed = Date.now() - pointerDownTimeRef.current;
      if (elapsed > 450) {
        stopMic(true);
      }
    }
  };

  // ── TTS: Text-to-Speech ────────────────────────────────────────────────────
  const cleanForSpeech = (text: string): string => {
    return text
      .replace(/#{1,6}\s*/g, "")
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/\*([^*]+)\*/g, "$1")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/```[\s\S]*?```/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/[>*_~`#]/g, "")
      .trim();
  };

  const speakText = (text: string, msgIndex: number) => {
    const cleanText = cleanForSpeech(text);
    if (!cleanText) return;

    if (speakingIdx === msgIndex) {
      googleTtsStop();
      setSpeakingIdx(null);
      return;
    }

    googleTtsSpeak(
      cleanText,
      selectedLang,
      () => setSpeakingIdx(msgIndex),
      () => setSpeakingIdx(null),
    );
  };

  // Auto-speak answer if user asked via mic
  useEffect(() => {
    if (!askedViaMicRef.current) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && lastMsg.role === "bot" && !lastMsg.loading && lastMsg.text) {
      askedViaMicRef.current = false;
      const idx = messages.length - 1;
      setTimeout(() => speakText(lastMsg.text, idx), 300);
    }
  }, [messages]);

  // ── Send Question ─────────────────────────────────────────────────────────
  const handleSend = async (questionText: string) => {
    const textToSend = questionText.trim();
    if (!textToSend || isSending) return;

    if (isListening && speechSessionRef.current) {
      speechSessionRef.current.stop().catch(() => {});
      speechSessionRef.current = null;
      setIsListening(false);
    }

    // Add to history if not present
    setHistoryItems((prev) => {
      const filtered = prev.filter((item) => item !== textToSend);
      return [textToSend, ...filtered].slice(0, 15);
    });

    setIsSending(true);
    setInput("");

    setMessages((prev) => [
      ...prev,
      { role: "user", text: textToSend },
      { role: "bot", text: "", loading: true },
    ]);

    try {
      const result = await askGemini(
        textToSend,
        subjectId,
        chapterName,
        _chapterNumber,
        _difficulty,
        selectedLang,
        _className,
      );
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "bot", text: result.answer };
        return updated;
      });
    } catch (err: any) {
      const errMsg = err?.message || "";
      const isQuota =
        errMsg.includes("429") ||
        errMsg.toLowerCase().includes("quota") ||
        errMsg.toLowerCase().includes("rate limit");
      const userFriendlyMsg = isQuota
        ? "⚠️ Rate limit reached. Please wait a moment and ask again."
        : "⚠️ Sorry, I could not connect to Saral AI. Please try again.";

      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "bot",
          text: userFriendlyMsg,
        };
        return updated;
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleSelectHistoryItem = (itemText: string) => {
    // If the conversation already has this question, scroll to it, or ask it directly
    handleSend(itemText);
  };

  const handleNewChat = () => {
    setMessages([]);
    localStorage.removeItem(chatStorageKey);
    setInput("");
  };

  return (
    <div className="saral-ai-container" role="region" aria-label="Saral AI Assistant">
      {/* ── Left History Sidebar (Screen 3) ─────────────────────────────────── */}
      <aside
        className={`saral-history-sidebar ${!isHistoryOpen ? "collapsed" : ""}`}
        aria-hidden={!isHistoryOpen}
      >
        <div className="saral-history-header">
          <h2 className="saral-history-title">History</h2>
          <button
            className="saral-history-new-btn"
            onClick={handleNewChat}
            title="Start new conversation"
          >
            + New
          </button>
        </div>

        <div className="saral-history-list">
          {historyItems.map((item, idx) => (
            <button
              key={`${item}-${idx}`}
              className="saral-history-item"
              onClick={() => handleSelectHistoryItem(item)}
              title={item}
            >
              {item}
            </button>
          ))}
        </div>

        {/* Decorative concentric quarter circles in bottom left */}
        <svg
          className="saral-sidebar-decor-rings"
          viewBox="0 0 160 160"
          aria-hidden="true"
        >
          <path
            d="M 0,25 A 135,135 0 0,1 135,160 L 110,160 A 110,110 0 0,0 0,50 Z"
            fill="#E2EBE5"
            opacity="0.8"
          />
          <path
            d="M 0,60 A 100,100 0 0,1 100,160 L 76,160 A 76,76 0 0,0 0,84 Z"
            fill="#D4E2D9"
            opacity="0.75"
          />
          <path
            d="M 0,95 A 65,65 0 0,1 65,160 L 44,160 A 44,44 0 0,0 0,116 Z"
            fill="#C5D7CC"
            opacity="0.7"
          />
          <path
            d="M 0,126 A 34,34 0 0,1 34,160 L 0,160 Z"
            fill="#B5CCBE"
            opacity="0.6"
          />
        </svg>
      </aside>

      {/* ── Sidebar Toggle Tab (◀ / ▶) ──────────────────────────────────────── */}
      <button
        className={`saral-sidebar-toggle-btn ${
          isHistoryOpen ? "sidebar-open" : "pinned-edge"
        }`}
        onClick={() => setIsHistoryOpen(!isHistoryOpen)}
        title={isHistoryOpen ? "Hide history" : "Show history"}
        aria-label={isHistoryOpen ? "Close history sidebar" : "Open history sidebar"}
      >
        {isHistoryOpen ? (
          <svg width="8" height="12" viewBox="0 0 8 12" fill="currentColor">
            <path d="M6.5 12L8 10.5L3.5 6L8 1.5L6.5 0L0.5 6L6.5 12Z" />
          </svg>
        ) : (
          <svg width="8" height="12" viewBox="0 0 8 12" fill="currentColor">
            <path d="M1.5 0L0 1.5L4.5 6L0 10.5L1.5 12L7.5 6L1.5 0Z" />
          </svg>
        )}
      </button>

      {/* ── Main Chat Area (Gradient Pane) ──────────────────────────────────── */}
      <main className="saral-chat-main">
        {/* Voice recording wave animation overlay */}
        {showWave && (
          <div
            className="saral-voice-overlay"
            aria-live="assertive"
            onClick={() => stopMic(true)}
            style={{ cursor: "pointer" }}
            title="Click anywhere to stop & send"
          >
            <div className="saral-wave-bars">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((_, i) => (
                <div
                  key={i}
                  className="saral-wave-bar"
                  ref={(el) => {
                    waveBarRefs.current[i] = el;
                  }}
                />
              ))}
            </div>
            <span style={{ fontSize: "1.05rem", color: "#2B483A", fontWeight: 700 }}>
              🎙️ Listening… Speak your question
            </span>
            <span style={{ fontSize: "0.85rem", color: "#4F7B64", fontWeight: 500 }}>
              Click anywhere or click ⏹ to stop & send
            </span>
          </div>
        )}

        {/* ── Center Welcome Card: Screen 1 & Screen 3 (Empty State) ────────── */}
        {messages.length === 0 && (
          <div className="saral-welcome-card-wrapper">
            <div className="saral-welcome-card">
              <img
                src={`${import.meta.env.BASE_URL}logo-clean.png`}
                alt="Saral Vidhya"
                className="saral-welcome-logo"
              />
              <div className="saral-welcome-text">
                <h3 className="saral-welcome-title">Hi there! I'm Saral,</h3>
                <p className="saral-welcome-subtitle">
                  Let's explore...!
                </p>
                <div className="saral-welcome-actions">
                  <button
                    type="button"
                    className="saral-welcome-action-btn"
                    onClick={() => {
                      inputRef.current?.focus();
                    }}
                    title="Ask Questions"
                  >
                    <div className="saral-welcome-action-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
                        <path d="M9 18h6" />
                        <path d="M10 21h4" />
                        <path d="M19 3v3" />
                        <path d="M20.5 4.5h-3" />
                      </svg>
                    </div>
                    <span>Ask Questions</span>
                  </button>

                  <button
                    type="button"
                    className="saral-welcome-action-btn"
                    onClick={() => {
                      handleSend(`Can you explain the key concepts of ${chapterName}?`);
                    }}
                    title="Get Explanations"
                  >
                    <div className="saral-welcome-action-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 4a5 5 0 0 0-5 5v3a5 5 0 0 0 2 4v2a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-2a5 5 0 0 0 2-4V9a5 5 0 0 0-4-5z" />
                        <path d="M20 4v3" />
                        <path d="M21.5 5.5h-3" />
                      </svg>
                    </div>
                    <span>Get Explanations</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Chat Messages Flow: Screen 2 (Active State) ────────────────────── */}
        {messages.length > 0 && (
          <div
            className="saral-messages-scroll"
            role="log"
            aria-live="polite"
            aria-label="Chat messages"
          >
            {messages.map((m, i) => (
              <React.Fragment key={i}>
                {m.role === "user" ? (
                  <div
                    className="saral-msg-user"
                    role="article"
                    aria-label="Your question"
                  >
                    {m.text}
                  </div>
                ) : (
                  <div
                    ref={i === messages.length - 1 ? lastBotMsgRef : undefined}
                    className="saral-msg-bot"
                    role="article"
                    aria-label="Saral response"
                  >
                    {m.loading ? (
                      <div className="saral-loading-bubble" aria-label="Thinking">
                        <div className="saral-loading-dot"></div>
                        <div className="saral-loading-dot"></div>
                        <div className="saral-loading-dot"></div>
                      </div>
                    ) : (
                      <>
                        <div className="saral-bot-content" dir="auto">
                          <MarkdownView content={m.text} />
                        </div>
                        <button
                          className={`saral-bot-tts-btn ${
                            speakingIdx === i ? "speaking" : ""
                          }`}
                          onClick={() => speakText(m.text, i)}
                          title={speakingIdx === i ? "Stop reading" : "Read aloud"}
                          aria-label={
                            speakingIdx === i ? "Stop reading" : "Read response aloud"
                          }
                        >
                          {speakingIdx === i ? "⏹" : "▶"}
                        </button>
                      </>
                    )}
                  </div>
                )}
              </React.Fragment>
            ))}
            <div ref={chatEndRef} />
          </div>
        )}

        {/* ── Bottom Input Bar: Screens 1, 2, 3 ─────────────────────────────── */}
        <div className="saral-input-bar-wrapper">
          {micError && (
            <div
              style={{
                marginBottom: "10px",
                padding: "8px 14px",
                background: "#FEF2F2",
                border: "1px solid #F87171",
                borderRadius: "12px",
                color: "#991B1B",
                fontSize: "13px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "8px",
              }}
            >
              <span>⚠️ {micError}</span>
              <button
                type="button"
                onClick={() => setMicError(null)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#991B1B",
                  cursor: "pointer",
                  fontSize: "16px",
                  lineHeight: 1,
                  padding: "0 4px",
                }}
                title="Dismiss"
              >
                ✕
              </button>
            </div>
          )}
          <div className="saral-input-bar">
            {/* Left Sparkle Badge */}
            <div className="saral-sparkle-badge" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path
                  d="M10 2C10 6.5 6.5 10 2 10C6.5 10 10 13.5 10 18C10 13.5 13.5 10 18 10C13.5 10 10 6.5 10 2Z"
                  fill="#FFFFFF"
                />
                <path
                  d="M17 11C17 13.5 15 15 13 15C15 15 17 16.5 17 19C17 16.5 19 15 21 15C19 15 17 13.5 17 11Z"
                  fill="#FFFFFF"
                />
              </svg>
            </div>

            {/* Input field */}
            <input
              ref={inputRef}
              type="text"
              className="saral-text-input"
              placeholder={
                isTranscribing
                  ? "Transcribing your voice…"
                  : isListening
                  ? "Listening… speak now (click ⏹ to stop & send)"
                  : "Type your question here..."
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(input);
                }
              }}
              disabled={isSending}
              aria-label="Type your question here"
            />

            {/* Action buttons (Mic + Send) */}
            <div className="saral-input-actions">
              {/* Mic Button */}
              <button
                type="button"
                className={`saral-action-btn ${isListening ? "recording" : ""}`}
                onPointerDown={handleMicPointerDown}
                onPointerUp={handleMicPointerUp}
                onPointerLeave={handleMicPointerLeave}
                disabled={isSending || isTranscribing}
                title={
                  isListening
                    ? "Click or release to stop and send"
                    : "Click or hold to speak"
                }
                aria-label={isListening ? "Stop listening and send" : "Voice input"}
              >
                {isListening ? (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="#FFFFFF">
                    <rect x="4" y="4" width="16" height="16" rx="3" ry="3" />
                  </svg>
                ) : (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#FFFFFF"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                    <line x1="12" y1="19" x2="12" y2="23"></line>
                    <line x1="8" y1="23" x2="16" y2="23"></line>
                  </svg>
                )}
              </button>

              {/* Send Button */}
              <button
                type="button"
                className="saral-action-btn"
                onClick={() => handleSend(input)}
                disabled={isSending || !input.trim()}
                title="Send question"
                aria-label="Send question"
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="#FFFFFF">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
