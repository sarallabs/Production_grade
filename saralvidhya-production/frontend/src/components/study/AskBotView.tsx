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

const ASK_LANGUAGES = [
  { code: "ur-PK", label: "اردو", flag: "IN" },
  { code: "en-IN", label: "English", flag: "🇬🇧" },
  { code: "hi-IN", label: "हिन्दी", flag: "🇮🇳" },
  { code: "te-IN", label: "తెలుగు", flag: "🇮🇳" },
  { code: "or-IN", label: "ଓଡ଼ିଆ", flag: "🇮🇳" },
];

/**
 * AskBotView allows users to interact with an AI assistant to ask questions
 * about the study material, using text or voice input.
 */
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
  const draftStorageKey = useMemo(
    () => `ask_draft_${subjectId}_${_chapterNumber}_${_difficulty}`,
    [subjectId, _chapterNumber, _difficulty],
  );
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
  const [input, setInput] = useState(
    () => localStorage.getItem(draftStorageKey) || "",
  );
  const [isSending, setIsSending] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [speakingIdx, setSpeakingIdx] = useState<number | null>(null);
  const [selectedLang, setSelectedLang] = useState(
    subjectId === "pubadm_ur" ? "ur-PK" : "en-IN",
  );
  const [, setMicError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const speechSessionRef = useRef<SpeechSession | null>(null);
  const askedViaMicRef = useRef(false);
  const isStartingMicRef = useRef(false);
  const [isHoldingMic, setIsHoldingMic] = useState(false);
  const [showWave, setShowWave] = useState(false);
  const [showClickWave, setShowClickWave] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [barHeights, setBarHeights] = useState<number[]>(new Array(13).fill(4));
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const waveBarRefs = useRef<(HTMLDivElement | null)[]>([]);

  // We track latest input so stopMic can grab it cleanly
  const currentInputRef = useRef("");
  useEffect(() => {
    currentInputRef.current = input;
  }, [input]);

  const isStreamingMic = hasWebSpeechSupport();

  useEffect(() => {
    // Persist chat so transient remounts don't wipe conversation.
    const cleaned = messages.filter((m) => !m.loading).slice(-30);
    localStorage.setItem(chatStorageKey, JSON.stringify(cleaned));
  }, [messages, chatStorageKey]);

  useEffect(() => {
    localStorage.setItem(draftStorageKey, input);
  }, [input, draftStorageKey]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Cleanup speech session + TTS on unmount
  useEffect(() => {
    return () => {
      if (speechSessionRef.current) {
        speechSessionRef.current.stop().catch(() => { });
        speechSessionRef.current = null;
      }
      googleTtsStop();
    };
  }, []);

  const isHoldingMicRef = useRef(false);

  // ── Mic: Universal Speech-to-Text (Web Speech API + MediaRecorder fallback) ──
  const handleMicMouseDown = async (e: React.MouseEvent | React.TouchEvent) => {
    if (isTranscribing) return;
    e.preventDefault();
    isHoldingMicRef.current = true;
    setIsHoldingMic(true);
    setShowWave(true);
    setInput(""); // Clear text input immediately when mic is pressed

    isStartingMicRef.current = true;
    // Open analyser stream for waveform (separate from speech recognition stream)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });
      // If user already released mic before stream opened, stop immediately
      if (!isHoldingMicRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      streamRef.current = stream;
      const AudioCtx =
        window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      analyserRef.current = analyser;
      const data = new Uint8Array(analyser.frequencyBinCount);
      const bases = [
        0.4, 0.6, 0.8, 1.0, 0.9, 0.7, 1.0, 0.7, 0.9, 1.0, 0.8, 0.6, 0.4,
      ];
      const tick = () => {
        if (!analyserRef.current) return;
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
            h = Math.max(4, Math.min(60, base * (bandAvg / 100) * 60));
          } else {
            h = Math.round(base * 6);
          }
          el.style.height = `${h}px`;
        });
        animFrameRef.current = requestAnimationFrame(tick);
      };
      animFrameRef.current = requestAnimationFrame(tick);
    } catch {
      // Mic permission denied — show static bars
    }

    try {
      if (isHoldingMicRef.current) {
        await startMic();
      }
    } finally {
      isStartingMicRef.current = false;
    }
  };

  const handleMicMouseUp = async () => {
    if (!isHoldingMicRef.current) return;
    isHoldingMicRef.current = false;
    setIsHoldingMic(false);
    setShowWave(false);

    // Stop analyser
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    analyserRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    // Wait for speech session to be ready if startMic hasn't completed yet
    let waited = 0;
    while (isStartingMicRef.current && waited < 3000) {
      await new Promise((r) => setTimeout(r, 50));
      waited += 50;
    }

    await stopMic(true);
  };

  const handleAskClick = () => {
    setShowClickWave(true);
    setTimeout(() => setShowClickWave(false), 600);
    handleSendText();
  };

  const startMic = async () => {
    setMicError(null);
    try {
      console.log("Starting microphone for language:", selectedLang);
      const session = await startSpeechSession({
        language: selectedLang,
        onInterim: (text) => {
          if (speechSessionRef.current === session) {
            setInput(text);
            setMicError(null); // Clear error when receiving input
          }
        },
        onError: (err) => {
          if (speechSessionRef.current === session) {
            console.warn("Speech session error:", err);
            setMicError(err);
            setIsListening(false);
          }
        },
        onEnd: () => {
          if (speechSessionRef.current === session) {
            console.log("Speech session ended");
            setIsListening(false);
          }
        },
      });
      speechSessionRef.current = session;
      setIsListening(true);
      console.log(
        "Microphone started successfully, streaming:",
        session.isStreaming,
      );
    } catch (e: any) {
      console.error("Could not start speech session:", e);
      const errMsg =
        e.message ||
        "Could not start microphone. Please check permissions and try again.";
      setMicError(errMsg);
      setIsListening(false);
      setIsTranscribing(false);

      // Show error in chat as a bot message
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: errMsg,
        },
      ]);
    }
  };

  const stopMic = async (autoSend = false) => {
    if (!speechSessionRef.current) return;
    setIsListening(false);

    if (!isStreamingMic) {
      // MediaRecorder path: transcription happens on stop — show spinner
      setIsTranscribing(true);
    }

    let transcript = "";
    try {
      console.log("Stopping microphone and transcribing...");
      transcript = await speechSessionRef.current.stop();
      console.log("Transcription successful:", transcript);
      setMicError(null);
    } catch (e: any) {
      console.error("Transcription error:", e);
      const errMsg =
        e.message || "Could not transcribe audio. Please try again.";
      setMicError(errMsg);

      // Show error in chat
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: errMsg,
        },
      ]);
    }
    speechSessionRef.current = null;

    setIsTranscribing(false);

    // Web Speech API often misses the final word in its return string. We fall back to the live input ref safely.
    const finalTranscript =
      transcript || (isStreamingMic ? currentInputRef.current : "");

    if (finalTranscript) {
      setInput(finalTranscript);
      if (autoSend) {
        askedViaMicRef.current = true;
        handleSend(finalTranscript);
      }
    } else if (!finalTranscript && !isStreamingMic) {
      setInput("");
    }
  };

  // ── TTS: Google Translate TTS for bot answers ──
  const cleanForSpeech = (text: string): string => {
    return text
      .replace(/#{1,6}\s*/g, "")
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/\*([^*]+)\*/g, "$1")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/```[\s\S]*?```/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/[>*_~`#]/g, "")
      .replace(/⚠️|📖|📚|💙|🚫|🙏|👋/g, "")
      .replace(/---+/g, "")
      .trim();
  };

  const speakText = (text: string, msgIndex: number) => {
    const cleanText = cleanForSpeech(text);
    if (!cleanText) return;

    // Toggle off if already speaking this message
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

  const stopSpeech = () => {
    googleTtsStop();
    setSpeakingIdx(null);
  };

  // Auto-read bot response when question was asked via mic
  useEffect(() => {
    if (!askedViaMicRef.current) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && lastMsg.role === "bot" && !lastMsg.loading && lastMsg.text) {
      askedViaMicRef.current = false;
      const idx = messages.length - 1;
      setTimeout(() => speakText(lastMsg.text, idx), 300);
    }
  }, [messages]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Send question ──
  const handleSend = async (question: string) => {
    if (!question.trim() || isSending) return;

    // Stop mic if listening
    if (isListening && speechSessionRef.current) {
      speechSessionRef.current.stop().catch(() => { });
      speechSessionRef.current = null;
      setIsListening(false);
    }

    const userMsg = question.trim();
    setIsSending(true);
    setInput("");

    // Add user message + bot loading placeholder
    setMessages((prev) => [
      ...prev,
      { role: "user", text: userMsg },
      { role: "bot", text: "", loading: true },
    ]);

    try {
      const result = await askGemini(
        userMsg,
        subjectId,
        chapterName,
        _chapterNumber,
        _difficulty,
        selectedLang,
        _className,
      );
      // Replace the loading placeholder with the real answer
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "bot", text: result.answer };
        return updated;
      });
    } catch (err: any) {
      const errMsg = err?.message || "";
      const isQuota = errMsg.includes("429") || errMsg.toLowerCase().includes("quota") || errMsg.toLowerCase().includes("rate limit");
      const userFriendlyMsg = isQuota
        ? "⚠️ Gemini free-tier rate limit reached. Please wait a few seconds and try again."
        : `⚠️ Sorry, I could not connect to the AI. ${errMsg.replace(/\[GoogleGenerativeAI Error\]:\s*/i, "").slice(0, 200) || "Please check your connection and try again."}`;

      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "bot",
          text: userFriendlyMsg,
        };
        return updated;
      });
      console.error("Ask Gemini failed:", err);
    } finally {
      setIsSending(false);
    }
  };

  const handleSendText = () => handleSend(input);

  return (
    <div
      className="ask-bot-view"
      role="region"
      aria-label="Ask AI Assistant"
      style={{ position: "relative" }}
    >
      {/* Voice wave overlay — covers the whole ask view when mic held */}
      {showWave && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(255,255,255,0.92)",
            backdropFilter: "blur(10px)",
            zIndex: 20,
            borderRadius: "12px",
            gap: "16px",
            pointerEvents: "none",
          }}
        >
          <div className="voice-wave-container">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((_, i) => (
              <div
                key={i}
                className="voice-wave-bar"
                ref={(el) => {
                  waveBarRefs.current[i] = el;
                }}
                style={{ height: "4px" }}
              />
            ))}
          </div>
          <span
            style={{ fontSize: "0.95rem", color: "#7c3aed", fontWeight: 700 }}
          >
            🎙️ Listening… speak now
          </span>
        </div>
      )}
      <div className="ask-header">
        <div className="ask-header-row">
          <div>
            {!isStreamingMic && (
              <p
                style={{ fontSize: "0.85em", color: "#666", marginTop: "4px" }}
              >
                🦊 Firefox Mode: Audio will be transcribed when you stop
                recording
              </p>
            )}
          </div>
          <div className="mic-top-center">
            <button
              className={`btn-mic-top ${isListening ? "recording" : ""} ${isTranscribing ? "transcribing" : ""} ${isHoldingMic ? "holding" : ""}`}
              onPointerDown={(e) => {
                e.preventDefault();
                handleMicMouseDown(e as any);
              }}
              onPointerUp={() => handleMicMouseUp()}
              onPointerLeave={() => {
                if (isHoldingMicRef.current) handleMicMouseUp();
              }}
              disabled={isSending || isTranscribing}
              title={
                isListening
                  ? "Stop and send"
                  : isTranscribing
                    ? "Transcribing…"
                    : "Start voice input (press and hold)"
              }
              aria-label={
                isListening
                  ? "Stop listening and send"
                  : isTranscribing
                    ? "Transcribing audio"
                    : "Start voice input (press and hold)"
              }
            >
              {isTranscribing ? "⏳" : isListening ? "⏹️" : "🎙️"}
            </button>
          </div>
          <div className="lang-selector">
            <label htmlFor="ask-lang">🌐</label>
            <select
              id="ask-lang"
              value={selectedLang}
              onChange={(e) => setSelectedLang(e.target.value)}
            >
              {ASK_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.flag} {l.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      <div
        className="ask-chat-window"
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
      >
        {messages.length === 0 && (
          <div className="chat-placeholder">
            <p>
              👋 Hi there! I'm Saral Vidhya, your academic tutor for {_className}{" "}
              {subjectName}. We're currently looking at "{chapterName}."
            </p>
            <p
              style={{ fontSize: "0.85em", opacity: 0.7, marginTop: "0.5rem" }}
            >
              How can I help you today? Do you have any questions about the
              chapter, its themes, characters, or anything else related to your
              studies? Feel free to ask! 😊
            </p>
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`chat-bubble ${m.role}`}
            role="article"
            aria-label={m.role === "user" ? "Your question" : "AI response"}
          >
            {m.loading ? (
              <div
                className="chat-text"
                style={{
                  fontSize: "1.2rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
                aria-label="AI is thinking"
              >
                <span
                  className="gear-spin"
                  style={{ display: "inline-block", fontSize: "1.8rem" }}
                >
                  ⚙️
                </span>{" "}
                <span style={{ opacity: 0.8 }}>Generating answer...</span>
              </div>
            ) : m.role === "bot" ? (
              <>
                <div className="chat-text bot-markdown" dir="auto">
                  <MarkdownView content={m.text} />
                </div>
                <div className="tts-controls">
                  {speakingIdx !== i ? (
                    <button
                      className="btn-tts"
                      onClick={() => speakText(m.text, i)}
                      title="Read aloud"
                      aria-label="Read this answer aloud"
                    >
                      ▶
                    </button>
                  ) : (
                    <button
                      className="btn-tts speaking"
                      onClick={stopSpeech}
                      title="Stop reading"
                      aria-label="Stop reading"
                    >
                      ⏹
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div className="chat-text" dir="auto">
                {m.text}
              </div>
            )}
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>
      <div className="ask-input-area">
        <input
          type="text"
          className="ask-question-input"
          placeholder={
            isTranscribing
              ? "Transcribing your speech…"
              : isListening
                ? isStreamingMic
                  ? "Listening… click ⏹ to stop and send"
                  : "Recording… click ⏹ to stop and transcribe"
                : "Type your question…"
          }
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSendText();
            }
          }}
          disabled={isSending}
          aria-label="Question input"
        />
        <button
          className={`btn-send ${showClickWave ? "wave-active" : ""}`}
          onClick={handleAskClick}
          disabled={isSending || !input.trim()}
          aria-label="Send question"
        >
          {isSending ? "..." : "Ask"}
        </button>
      </div>
      {(isListening || isTranscribing) && (
        <div className="listening-indicator" aria-live="assertive">
          {isTranscribing ? (
            <>
              <span className="pulse-dot transcribing"></span> Transcribing your
              speech… please wait
            </>
          ) : isStreamingMic ? (
            <>
              <span className="pulse-dot"></span> Listening… speak now, then
              click ⏹ to stop &amp; send
            </>
          ) : (
            <>
              <span className="pulse-dot recording"></span> Recording… click ⏹
              to stop and transcribe (works in all browsers)
            </>
          )}
        </div>
      )}
    </div>
  );
}
