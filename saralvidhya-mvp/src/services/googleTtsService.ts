/**
 * Google Cloud Text-to-Speech Service
 *
 * Uses the Cloud TTS REST API (texttospeech.googleapis.com) with the same
 * VITE_GOOGLE_API_KEY that powers the Gemini Ask feature.
 *
 * The API returns base64-encoded MP3 audio which we decode into a Blob URL
 * and play with the <audio> element — no proxy, no CORS issues.
 *
 * Falls back to window.speechSynthesis if the API call fails.
 */

const GOOGLE_API_KEY: string =
  (import.meta as any).env?.VITE_GOOGLE_API_KEY ??
  (import.meta as any).env?.VITE_GEMINI_API_KEY ??
  '';
const TTS_ENDPOINT = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_API_KEY}`;

// ── Language / voice mapping ───────────────────────────────────────────────────
interface VoiceConfig { languageCode: string; male: string; female: string; name?: string; ssmlGender?: 'MALE' | 'FEMALE'; }

const VOICE_MAP: Record<string, VoiceConfig> = {
  'en-IN': { languageCode: 'en-IN', male: 'en-IN-Wavenet-A', female: 'en-IN-Wavenet-D' },
  'hi-IN': { languageCode: 'hi-IN', male: 'hi-IN-Wavenet-A', female: 'hi-IN-Wavenet-D' },
  'te-IN': { languageCode: 'te-IN', male: 'te-IN-Wavenet-A', female: 'te-IN-Wavenet-D' },
  'ur-PK': { languageCode: 'ur-PK', male: 'ur-PK-Wavenet-A', female: 'ur-PK-Wavenet-D' },
  'ur-IN': { languageCode: 'ur-PK', male: 'ur-PK-Wavenet-A', female: 'ur-PK-Wavenet-D' },
  'or-IN': { languageCode: 'en-IN', male: 'en-IN-Wavenet-A', female: 'en-IN-Wavenet-D' },
};

const DEFAULT_VOICE: VoiceConfig = { languageCode: 'en-IN', male: 'en-IN-Wavenet-A', female: 'en-IN-Wavenet-D' };

function getVoiceNameForGender(voice: VoiceConfig, isMale: boolean): string {
  return isMale ? voice.male : voice.female;
}

const CHUNK_SIZE = 4500; // Cloud TTS allows up to 5000 chars per request

// ── Script detection ───────────────────────────────────────────────────────────
export function detectLangCode(text: string, fallbackBcp47: string): string {
  if (/[\u0600-\u06FF]/.test(text)) return 'ur-PK';
  if (/[\u0900-\u097F]/.test(text)) return 'hi-IN';
  if (/[\u0C00-\u0C7F]/.test(text)) return 'te-IN';
  return fallbackBcp47;
}

// ── Text sanitisation ─────────────────────────────────────────────────────────
export function sanitizeForTts(raw: string): string {
  let t = raw;

  // Strip HTML img tags and general tags first
  t = t.replace(/<img\b[^>]*>/gi, ' ');
  t = t.replace(/<[^>]*>/g, ' ');

  // Strip markdown images: ![alt](url)
  t = t.replace(/!\[[\s\S]*?\]\([\s\S]*?\)/g, ' ');

  // Strip base64 data URIs if any leaked
  t = t.replace(/data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+/g, ' ');

  // Decode HTML entities via DOM
  try {
    const el = document.createElement('textarea');
    el.innerHTML = t;
    t = el.value;
  } catch { /* non-browser */ }

  // Manual entity fallback
  t = t
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");

  // Strip markdown
  t = t
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]+`/g, ' ')
    .replace(/#{1,6}\s+/g, ' ')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    .replace(/!\[.*?\]\(.*?\)/g, ' ')
    .replace(/\[(.+?)\]\(.*?\)/g, '$1')
    .replace(/^[-*+]\s+/gm, ' ')
    .replace(/^\d+\.\s+/gm, ' ')
    .replace(/^>\s*/gm, ' ')
    .replace(/---+/g, ' ')
    .replace(/==(.+?)==/g, '$1')
    .replace(/[|^~\\]/g, ' ');

  // Normalise whitespace
  t = t
    .replace(/\r?\n+/g, '. ')
    .replace(/\.(\s*\.)+/g, '.')
    .replace(/\s{2,}/g, ' ')
    .trim();

  return t;
}

// ── Chunk splitter ─────────────────────────────────────────────────────────────
function splitIntoChunks(text: string, maxLen: number): string[] {
  if (text.length <= maxLen) return [text];

  const chunks: string[] = [];
  // Split on sentence boundaries first
  const sentences = text.split(/(?<=[.!?।؟])\s+/);
  let current = '';
  for (const s of sentences) {
    if ((current + ' ' + s).trim().length <= maxLen) {
      current = (current + ' ' + s).trim();
    } else {
      if (current) chunks.push(current);
      // If a single sentence exceeds limit, split by words
      if (s.length > maxLen) {
        const words = s.split(' ');
        let w = '';
        for (const word of words) {
          if ((w + ' ' + word).trim().length <= maxLen) {
            w = (w + ' ' + word).trim();
          } else {
            if (w) chunks.push(w);
            w = word;
          }
        }
        if (w) chunks.push(w);
        current = '';
      } else {
        current = s;
      }
    }
  }
  if (current) chunks.push(current);
  return chunks.filter(c => c.trim().length > 0);
}

// ── Google Cloud TTS API call ──────────────────────────────────────────────────
const inflightControllers = new Set<AbortController>();

/** Word timing entry returned from SSML mark timepoints */
interface WordTiming { charIndex: number; timeSeconds: number; }

async function synthesizeChunk(
  text: string,
  voice: VoiceConfig,
): Promise<{ blobUrl: string; wordTimings: WordTiming[] }> {
  const gender = voice.ssmlGender ?? 'FEMALE';
  const selectedVoiceName = voice.name ?? getVoiceNameForGender(voice, gender === 'MALE');

  // Build SSML with <mark> tags before each word for timepoint tracking
  const words = text.split(/(\s+)/);
  let charCursor = 0;
  let ssmlParts = '<speak>';
  const markMap: Record<string, number> = {}; // markName → charIndex

  for (const part of words) {
    if (part.trim()) {
      const markName = `w${charCursor}`;
      markMap[markName] = charCursor;
      ssmlParts += `<mark name="${markName}"/>${part}`;
    } else {
      ssmlParts += part;
    }
    charCursor += part.length;
  }
  ssmlParts += '</speak>';

  const body = {
    input: { ssml: ssmlParts },
    voice: {
      languageCode: voice.languageCode,
      name: selectedVoiceName,
      ssmlGender: gender,
    },
    audioConfig: {
      audioEncoding: 'MP3',
      speakingRate: 1.0,
      pitch: 0,
    },
    enableTimePointing: ['SSML_MARK'],
  };

  const controller = new AbortController();
  inflightControllers.add(controller);
  const timeout = setTimeout(() => controller.abort(), 12000);
  const res = await fetch(TTS_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: controller.signal,
  }).finally(() => {
    clearTimeout(timeout);
    inflightControllers.delete(controller);
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Cloud TTS error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const base64Audio: string = data.audioContent;
  if (!base64Audio) throw new Error('No audioContent in response');

  // Parse timepoints into word timings
  const wordTimings: WordTiming[] = [];
  if (Array.isArray(data.timepoints)) {
    for (const tp of data.timepoints) {
      const charIdx = markMap[tp.markName];
      if (charIdx !== undefined) {
        wordTimings.push({ charIndex: charIdx, timeSeconds: tp.timeSeconds });
      }
    }
  }

  // Decode base64 → Blob → Object URL
  const binary = atob(base64Audio);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const blob = new Blob([bytes], { type: 'audio/mp3' });
  return { blobUrl: URL.createObjectURL(blob), wordTimings };
}

// ── Player state ───────────────────────────────────────────────────────────────
let currentAudio: HTMLAudioElement | null = null;
let pendingBlobUrls: string[] = [];        // object URLs to revoke after playback
let textChunks: string[] = [];             // plain text chunks queued for synthesis
let chunkQueue: { text: string; start: number }[] = [];
let currentVoice: VoiceConfig = DEFAULT_VOICE;
let isPlaying = false;
let isStopped = false;
let onDoneCallback: (() => void) | null = null;
let onProgressCallback: ((globalCharIndex: number) => void) | null = null;
let onStartCallback: (() => void) | null = null;
let didFireStart = false;
let fallbackProgressTimer: number | null = null;
let runId = 0;
let chunkProgressTimers = new Set<number>();
let isPaused = false;
let liveUtterance: SpeechSynthesisUtterance | null = null;

function cleanup() {
  pendingBlobUrls.forEach(u => URL.revokeObjectURL(u));
  pendingBlobUrls = [];
  if (currentAudio) { currentAudio.pause(); currentAudio.src = ''; currentAudio = null; }
  if (fallbackProgressTimer != null) {
    window.clearInterval(fallbackProgressTimer);
    fallbackProgressTimer = null;
  }
  chunkProgressTimers.forEach((t) => window.clearInterval(t));
  chunkProgressTimers.clear();
}

function waitForSpeechSynthesisVoices(timeoutMs = 150): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    const voices = window.speechSynthesis.getVoices();
    if (voices.length) return resolve(voices);

    const onVoicesChanged = () => {
      cleanupVoiceListener();
      resolve(window.speechSynthesis.getVoices());
    };

    const timer = window.setTimeout(() => {
      cleanupVoiceListener();
      resolve(window.speechSynthesis.getVoices());
    }, timeoutMs);

    function cleanupVoiceListener() {
      window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged);
      window.clearTimeout(timer);
    }

    window.speechSynthesis.addEventListener('voiceschanged', onVoicesChanged);
  });
}

const VOICE_NAME_PATTERNS = {
  male: /male|man|boy|guy|david|james|mark|alex|fred|daniel|richard|ryan|george|raj|arjun/i,
  female: /female|woman|girl|zira|aria|hazel|samantha|victoria|alloy|maya|rita|neela|anya/i,
};

// Neural / cloud-backed browser voices sound far more human than the legacy OS
// voices (e.g. "Microsoft Zira Desktop"). Edge exposes "... Online (Natural)",
// Chrome exposes "Google ..." voices, Safari has "Premium"/"Enhanced" ones.
function naturalnessScore(v: SpeechSynthesisVoice): number {
  const n = `${v.name} ${v.voiceURI}`;
  let s = 0;
  if (/natural|neural/i.test(n)) s += 100;
  if (/online/i.test(n)) s += 40;
  if (/premium|enhanced/i.test(n)) s += 60;
  if (/^google\b/i.test(v.name)) s += 50;
  if (!v.localService) s += 20;
  if (/desktop|espeak|compact/i.test(n)) s -= 50;
  return s;
}

function findSpeechSynthesisVoice(voices: SpeechSynthesisVoice[], preferredGender: 'male' | 'female', desiredLang: string): SpeechSynthesisVoice | null {
  const genderPattern = VOICE_NAME_PATTERNS[preferredGender];
  const rank = (list: SpeechSynthesisVoice[]) =>
    [...list].sort((a, b) => {
      const g = (v: SpeechSynthesisVoice) => (genderPattern.test(v.name) || genderPattern.test(v.voiceURI) ? 10 : 0);
      // Accent outranks naturalness: Indian > US > others; avoid British/Australian
      const accent = (v: SpeechSynthesisVoice) => {
        const l = v.lang.toLowerCase().replace('_', '-');
        if (l.endsWith('-in')) return 200;
        if (l === 'en-us') return 120;
        if (/-(gb|au|ie|nz|za)$/.test(l) || /\buk\b|british/i.test(v.name)) return -200;
        return 0;
      };
      return (naturalnessScore(b) + g(b) + accent(b)) - (naturalnessScore(a) + g(a) + accent(a));
    });

  const languageMatches = voices.filter((v) => v.lang.toLowerCase().startsWith(desiredLang));
  if (languageMatches.length) return rank(languageMatches)[0];
  if (voices.length) return rank(voices)[0];
  return null;
}

// ── speechSynthesis fallback ───────────────────────────────────────────────────
async function fallbackSpeak(
  text: string,
  bcp47: string,
  onDone?: () => void,
  onProgress?: (charIndex: number) => void,
) {
  if (!window.speechSynthesis) { onDone?.(); return; }
  window.speechSynthesis.cancel();
  const preferredGender = localStorage.getItem('user_voice') === 'male' ? 'male' : 'female';
  const desiredLang = bcp47.toLowerCase().split('-')[0];
  const immediateVoices = window.speechSynthesis.getVoices();
  let availableVoices = immediateVoices.length ? immediateVoices : await waitForSpeechSynthesisVoices(120);

  const startFallbackProgress = () => {
    if (!onProgress || !text) return;
    let lastTs = Date.now();
    let spokenMs = 0;
    const approxMsPerChar = 67; // ~15 chars/sec at speakingRate 1.0
    if (fallbackProgressTimer != null) {
      window.clearInterval(fallbackProgressTimer);
    }
    fallbackProgressTimer = window.setInterval(() => {
      const now = Date.now();
      const delta = now - lastTs;
      lastTs = now;
      if (isPaused) return;
      spokenMs += delta;
      const idx = Math.min(text.length, Math.floor(spokenMs / approxMsPerChar));
      onProgress(idx);
      if (idx >= text.length && fallbackProgressTimer != null) {
        window.clearInterval(fallbackProgressTimer);
        fallbackProgressTimer = null;
      }
    }, 50);
  };
  const clearFallbackProgress = () => {
    if (fallbackProgressTimer != null) {
      window.clearInterval(fallbackProgressTimer);
      fallbackProgressTimer = null;
    }
  };

  const matchingVoice = findSpeechSynthesisVoice(availableVoices, preferredGender, desiredLang);

  // Online/neural browser voices stall on long utterances (Chrome stops after
  // ~15s without firing onend, Edge "Natural" voices hang). Speak short
  // sentence-sized pieces back to back, tracking each piece's exact offset.
  const pieces: { text: string; start: number }[] = [];
  {
    const re = /[^\n]+/g; // one line at a time (headings/bullets get a natural pause)
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const lineStart = m.index;
      const line = m[0];
      const sentRe = /[^.!?।؟]+[.!?।؟]*\s*/g;
      let s: RegExpExecArray | null;
      let cur = '', curStart = lineStart;
      while ((s = sentRe.exec(line)) !== null) {
        if (!s[0]) { sentRe.lastIndex++; continue; }
        if (cur && (cur + s[0]).length > 220) {
          if (cur.trim()) pieces.push({ text: cur, start: curStart });
          cur = ''; curStart = lineStart + s.index;
        }
        if (!cur) curStart = lineStart + s.index;
        cur += s[0];
      }
      if (cur.trim()) pieces.push({ text: cur, start: curStart });
    }
  }
  const myRun = runId;
  let idx = 0;
  // ms per character, refined after every piece from real timings
  let msPerChar = 68;

  if (!didFireStart) { onStartCallback?.(); didFireStart = true; }

  const speakNext = () => {
    if (myRun !== runId || isStopped) return;
    if (idx >= pieces.length) {
      clearFallbackProgress();
      onProgress?.(text.length);
      isPlaying = false;
      onDone?.();
      return;
    }
    const { text: piece, start: base } = pieces[idx];
    const u = new SpeechSynthesisUtterance(piece);
    // Chrome garbage-collects utterances that aren't referenced, and then
    // onend never fires — keep a live reference until it finishes.
    liveUtterance = u;
    u.lang = bcp47;
    if (matchingVoice) u.voice = matchingVoice;
    u.rate = 0.95;
    let done = false;
    let watchdog: number | null = null;
    let extensions = 0;
    let lastBoundaryTime = 0;
    let spokenMs = 0;
    let lastTick = 0;
    let startedAt = 0;
    let pausedMs = 0;

    // Word starts inside this piece, used by the time estimator
    const wordStarts: number[] = [];
    { const wr = /\S+/g; let w: RegExpExecArray | null; while ((w = wr.exec(piece)) !== null) wordStarts.push(w.index); }

    const stopEstimator = () => {
      if (fallbackProgressTimer != null) { window.clearInterval(fallbackProgressTimer); fallbackProgressTimer = null; }
    };
    const startEstimator = () => {
      stopEstimator();
      lastTick = Date.now();
      fallbackProgressTimer = window.setInterval(() => {
        const now = Date.now();
        const d = now - lastTick; lastTick = now;
        if (isPaused) { pausedMs += d; return; }
        if (!onProgress) return;
        // If real boundary events are actively firing (within 280ms), let them guide
        if (lastBoundaryTime > 0 && now - lastBoundaryTime < 280) return;
        spokenMs += d;
        const ch = Math.min(piece.length - 1, Math.floor(spokenMs / msPerChar));
        // snap to the start of the word containing ch
        let wi = 0;
        while (wi + 1 < wordStarts.length && wordStarts[wi + 1] <= ch) wi++;
        onProgress(base + (wordStarts[wi] ?? 0));
      }, 40);
    };

    const finish = () => {
      if (done) return;
      done = true;
      stopEstimator();
      if (watchdog != null) { window.clearTimeout(watchdog); watchdog = null; }
      if (myRun !== runId || isStopped) return;
      // Calibrate speaking speed from this piece (ignore tiny/odd pieces)
      if (startedAt && piece.length > 25) {
        const actual = (Date.now() - startedAt - pausedMs) / piece.length;
        if (actual > 30 && actual < 200) msPerChar = msPerChar * 0.5 + actual * 0.5;
      }
      onProgress?.(base + piece.length);
      idx += 1;
      // Let the engine settle before queuing the next utterance
      window.setTimeout(speakNext, 0);
    };
    // Watchdog: if a piece never ends (voice stalled), skip ahead ourselves
    const armWatchdog = () => {
      if (watchdog != null) window.clearTimeout(watchdog);
      watchdog = window.setTimeout(() => {
        watchdog = null;
        if (done || myRun !== runId) return;
        if (isPaused) { armWatchdog(); return; }
        if (window.speechSynthesis.speaking && extensions < 2) {
          // Still audibly speaking — give it a bit more time
          extensions += 1;
          armWatchdog();
          return;
        }
        window.speechSynthesis.cancel();
        finish();
      }, Math.max(4000, piece.length * 90));
    };
    u.onstart = () => {
      startedAt = Date.now();
      onProgress?.(base);
      startEstimator();
    };
    u.onboundary = (e: SpeechSynthesisEvent) => {
      if (e.name === 'word' && onProgress) {
        lastBoundaryTime = Date.now();
        onProgress(base + e.charIndex);
      }
    };
    u.onend = finish;
    u.onerror = finish;
    armWatchdog();
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
    window.speechSynthesis.speak(u);
  };
  speakNext();
}

// ── Sequential chunk player ────────────────────────────────────────────────────
async function playNextChunk() {
  const localRunId = runId;
  if (isStopped || chunkQueue.length === 0) {
    if (!isStopped) {
      isPlaying = false;
      onDoneCallback?.();
      onDoneCallback = null;
      onProgressCallback = null;
    }
    return;
  }

  const chunkMeta = chunkQueue.shift()!;
  const chunk = chunkMeta.text;

  try {
    const { blobUrl, wordTimings } = await synthesizeChunk(chunk, currentVoice);
    if (isStopped || localRunId !== runId) { URL.revokeObjectURL(blobUrl); return; }

    const audio = new Audio(blobUrl);
    currentAudio = audio;
    pendingBlobUrls.push(blobUrl);
    let chunkProgressTimer: number | null = null;
    const clearChunkProgressTimer = () => {
      if (chunkProgressTimer != null) {
        window.clearInterval(chunkProgressTimer);
        chunkProgressTimers.delete(chunkProgressTimer);
        chunkProgressTimer = null;
      }
    };
    const startChunkProgressTimer = () => {
      if (chunkProgressTimer != null) return;
      // Only use interval as fallback when duration metadata is unavailable
      chunkProgressTimer = window.setInterval(() => {
        if (isPaused || !onProgressCallback) return;
        if (audio.duration && isFinite(audio.duration) && audio.duration > 0) {
          // Duration is available — ontimeupdate handles it, clear this timer
          clearChunkProgressTimer();
          return;
        }
        // No duration metadata — estimate from elapsed time
        const approxChars = Math.floor(audio.currentTime * 15);
        onProgressCallback(chunkMeta.start + Math.min(chunk.length, Math.max(0, approxChars)));
      }, 80);
      chunkProgressTimers.add(chunkProgressTimer);
    };

    audio.ontimeupdate = () => {
      if (!onProgressCallback) return;
      const t = audio.currentTime;

      if (wordTimings.length > 0) {
        // ── Accurate: use SSML mark timepoints ──
        // Find the last mark whose timeSeconds <= current time
        let lo = 0, hi = wordTimings.length - 1, best = 0;
        while (lo <= hi) {
          const mid = (lo + hi) >> 1;
          if (wordTimings[mid].timeSeconds <= t) { best = mid; lo = mid + 1; }
          else { hi = mid - 1; }
        }
        onProgressCallback(chunkMeta.start + wordTimings[best].charIndex);
      } else if (audio.duration && isFinite(audio.duration) && audio.duration > 0) {
        // ── Fallback: linear interpolation ──
        const ratio = Math.max(0, Math.min(1, t / audio.duration));
        const spokenChars = Math.floor(ratio * chunk.length);
        onProgressCallback(chunkMeta.start + spokenChars);
      }
    };

    audio.onended = () => {
      if (localRunId !== runId) return;
      clearChunkProgressTimer();
      if (onProgressCallback) onProgressCallback(chunkMeta.start + chunk.length);
      URL.revokeObjectURL(blobUrl);
      pendingBlobUrls = pendingBlobUrls.filter(u => u !== blobUrl);
      currentAudio = null;
      playNextChunk();
    };

    audio.onerror = () => {
      if (localRunId !== runId) return;
      console.warn('[CloudTTS] audio playback error — skipping chunk');
      clearChunkProgressTimer();
      URL.revokeObjectURL(blobUrl);
      currentAudio = null;
      playNextChunk(); // skip and continue
    };

    audio.onplay = () => {
      if (localRunId !== runId) return;
      startChunkProgressTimer();
      if (!didFireStart) { onStartCallback?.(); didFireStart = true; }
    };

    audio.play().catch(() => {
      console.warn('[CloudTTS] play() rejected — falling back to speechSynthesis');
      clearChunkProgressTimer();
      URL.revokeObjectURL(blobUrl);
      currentAudio = null;
      if (localRunId !== runId) return;
      const remaining = [chunkMeta.text, ...chunkQueue.map(c => c.text)].join(' ');
      chunkQueue = [];
      const doneCb = onDoneCallback ?? undefined;
      const progressCb = onProgressCallback;
      fallbackSpeak(
        remaining,
        currentVoice.languageCode,
        doneCb,
        (fallbackIdx) => progressCb?.(chunkMeta.start + fallbackIdx),
      );
      onDoneCallback = null;
      onProgressCallback = null;
    });
  } catch (err) {
    if (localRunId !== runId) return;
    console.warn('[CloudTTS] synthesis failed:', err, '— falling back to speechSynthesis');
    const remaining = [chunkMeta.text, ...chunkQueue.map(c => c.text)].join(' ');
    chunkQueue = [];
    const doneCb = onDoneCallback ?? undefined;
    const progressCb = onProgressCallback;
    fallbackSpeak(
      remaining,
      currentVoice.languageCode,
      doneCb,
      (fallbackIdx) => progressCb?.(chunkMeta.start + fallbackIdx),
    );
    onDoneCallback = null;
    onProgressCallback = null;
  }
}

// ── Public API ─────────────────────────────────────────────────────────────────
export function googleTtsSpeak(
  text: string,
  bcp47Lang: string,
  onStart?: () => void,
  onEnd?: () => void,
  onProgress?: (globalCharIndex: number) => void,
  opts?: { raw?: boolean },
) {
  googleTtsStop();
  runId += 1;
  isPaused = false;

  // raw: caller already produced speakable text and needs progress indices
  // that map 1:1 onto it (read-aloud highlighting).
  const clean = opts?.raw ? text.trim() ? text : '' : sanitizeForTts(text);
  if (!clean) { onEnd?.(); return; }

  // Auto-detect language from script if content gives a clearer signal
  const detectedBcp47 = detectLangCode(clean, bcp47Lang);
  const preferMale = localStorage.getItem('user_voice') === 'male';
  const selectedVoice = VOICE_MAP[detectedBcp47] ?? DEFAULT_VOICE;
  currentVoice = {
    ...selectedVoice,
    name: getVoiceNameForGender(selectedVoice, preferMale),
    ssmlGender: preferMale ? 'MALE' : 'FEMALE',
  };

  const isGcpKey = GOOGLE_API_KEY.trim().startsWith('AIzaSy');
  // Raw mode needs exact char offsets; the Cloud path re-chunks/trims text
  // (and currently 401s with this API key), so use the browser engine.
  if (!isGcpKey || opts?.raw) {
    isStopped = false;
    isPlaying = true;
    onDoneCallback = null;
    onProgressCallback = null;
    onStartCallback = onStart ?? null;
    didFireStart = false;
    fallbackSpeak(clean, currentVoice.languageCode, onEnd, onProgress);
    return;
  }

  textChunks = splitIntoChunks(clean, CHUNK_SIZE);
  if (textChunks.length === 0) { onEnd?.(); return; }
  let cursor = 0;
  chunkQueue = textChunks.map((chunkText) => {
    const start = cursor;
    cursor += chunkText.length;
    return { text: chunkText, start };
  });

  isStopped = false;
  isPlaying = true;
  onDoneCallback = onEnd ?? null;
  onProgressCallback = onProgress ?? null;
  onStartCallback = onStart ?? null;
  didFireStart = false;
  playNextChunk();
}

export function googleTtsStop() {
  runId += 1;
  isStopped = true;
  isPlaying = false;
  isPaused = false;
  textChunks = [];
  chunkQueue = [];
  onDoneCallback = null;
  onProgressCallback = null;
  onStartCallback = null;
  didFireStart = false;
  inflightControllers.forEach((c) => c.abort());
  inflightControllers.clear();
  cleanup();
  window.speechSynthesis?.cancel();
}

export function googleTtsPause() {
  isPaused = true;
  if (currentAudio) {
    currentAudio.pause();
  }
  window.speechSynthesis?.pause();
}

export function googleTtsResume() {
  isPaused = false;
  if (currentAudio) {
    currentAudio.play().catch(e => console.warn('Resume failed:', e));
  }
  window.speechSynthesis?.resume();
}

export function googleTtsIsPlaying(): boolean {
  return isPlaying;
}

if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && isPlaying && !isPaused) {
      if (typeof window !== "undefined" && window.speechSynthesis && window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    }
  });
}
