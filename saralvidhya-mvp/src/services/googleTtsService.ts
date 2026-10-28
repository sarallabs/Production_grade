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

import {
  cloudStorage,
  CLOUD_API_BASE,
  getCloudAuthHeaders,
} from '@/context/CloudStateContext';
import { detectTenantId } from '@/tenant/TenantProvider';
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

const CHUNK_SIZE = 820; // Keep SSML with <mark> tags strictly under Google Cloud TTS 5000-byte limit

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

// ── Chunk splitter (preserves exact character offsets in the source text) ───────
interface TextChunkMeta {
  text: string;
  start: number;
}

function splitIntoChunksWithOffsets(text: string, maxLen: number): TextChunkMeta[] {
  const chunks: TextChunkMeta[] = [];
  const n = text.length;
  let pos = 0;

  while (pos < n) {
    // Skip leading whitespace while keeping exact offset `pos`
    while (pos < n && /\s/.test(text[pos])) pos++;
    if (pos >= n) break;

    let end = Math.min(n, pos + maxLen);
    if (end < n) {
      const slice = text.slice(pos, end);
      // Prefer splitting after sentence-ending punctuation (. ! ? । ؟ or newline)
      let splitRel = -1;
      const sentenceRe = /[.!?।؟\n]\s+/g;
      let m: RegExpExecArray | null;
      while ((m = sentenceRe.exec(slice)) !== null) {
        if (m.index + m[0].length >= 120) {
          splitRel = m.index + 1;
        }
      }
      // Next preference: split after comma/semicolon/colon/dash
      if (splitRel === -1) {
        const clauseRe = /[,;:—–-]\s+/g;
        while ((m = clauseRe.exec(slice)) !== null) {
          if (m.index + m[0].length >= 160) {
            splitRel = m.index + 1;
          }
        }
      }
      // Fallback: last whitespace before `end`
      if (splitRel === -1) {
        const lastSpace = slice.lastIndexOf(' ');
        const lastNl = slice.lastIndexOf('\n');
        const wsIdx = Math.max(lastSpace, lastNl);
        if (wsIdx > 0) splitRel = wsIdx;
      }
      if (splitRel > 0) {
        end = pos + splitRel;
      }
    }

    // Also cap word count to <= 115 words so SSML <mark> overhead never approaches 5000 bytes
    const rawSlice = text.slice(pos, end);
    const wordMatches = Array.from(rawSlice.matchAll(/\S+/g));
    if (wordMatches.length > 115) {
      const capWord = wordMatches[114];
      if (capWord && capWord.index !== undefined) {
        end = pos + capWord.index + capWord[0].length;
      }
    }

    const chunkText = text.slice(pos, end);
    if (chunkText.trim().length > 0) {
      chunks.push({ text: chunkText, start: pos });
    }
    pos = end;
  }

  return chunks;
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

  const activeTenantId = detectTenantId() || cloudStorage.getItem('current_tenant_id');

  const escapeXml = (s: string) =>
    s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');

  // Build SSML with <mark> tags before each word for timepoint tracking
  const words = text.split(/(\s+)/);
  let charCursor = 0;
  let ssmlParts = '<speak>';
  const markMap: Record<string, number> = {}; // markName → charIndex

  for (const part of words) {
    if (part.trim()) {
      const markName = `w${charCursor}`;
      markMap[markName] = charCursor;
      ssmlParts += `<mark name="${markName}"/>${escapeXml(part)}`;
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

  let res: Response | null = null;

  // 1. Primary: Cloud Run server-side TTS proxy (/v2/t/:tenant/ai/tts) with GCS caching + SSML timepoints
  if (activeTenantId) {
    try {
      const controller = new AbortController();
      inflightControllers.add(controller);
      const timeout = setTimeout(() => controller.abort(), 12000);
      const cloudRes = await fetch(`${CLOUD_API_BASE}/v2/t/${activeTenantId}/ai/tts`, {
        method: 'POST',
        headers: getCloudAuthHeaders(activeTenantId),
        credentials: 'include',
        body: JSON.stringify({
          ssml: ssmlParts,
          languageCode: voice.languageCode,
          voiceName: selectedVoiceName,
          ssmlGender: gender,
          speakingRate: 1.0,
          enableTimePointing: true,
        }),
        signal: controller.signal,
      }).finally(() => {
        clearTimeout(timeout);
        inflightControllers.delete(controller);
      });
      if (cloudRes.ok) {
        res = cloudRes;
      }
    } catch {
      // fall through to direct TTS if key configured
    }
  }

  // 2. Fallback: Direct Google Cloud TTS REST endpoint if VITE_GOOGLE_API_KEY is present
  if (!res) {
    if (!GOOGLE_API_KEY) {
      throw new Error('Cloud Run TTS unavailable and no local VITE_GOOGLE_API_KEY configured');
    }
    const controller = new AbortController();
    inflightControllers.add(controller);
    const timeout = setTimeout(() => controller.abort(), 12000);
    res = await fetch(TTS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    }).finally(() => {
      clearTimeout(timeout);
      inflightControllers.delete(controller);
    });
  }

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Cloud TTS error ${res.status}: ${err}`);
  }
  const data = await res.json();
  const base64Audio: string = data.audioContent;
  if (!base64Audio) throw new Error('No audioContent in response');

  const wordTimings: WordTiming[] = [];
  if (Array.isArray(data.timepoints)) {
    for (const tp of data.timepoints) {
      const charIdx = markMap[tp.markName];
      if (charIdx !== undefined) {
        wordTimings.push({ charIndex: charIdx, timeSeconds: tp.timeSeconds });
      }
    }
  }

  const binary = atob(base64Audio);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const blob = new Blob([bytes], { type: 'audio/mp3' });
  return { blobUrl: URL.createObjectURL(blob), wordTimings };
}

// ── Player state ───────────────────────────────────────────────────────────────
let currentAudio: HTMLAudioElement | null = null;
let pendingBlobUrls: string[] = [];        // object URLs to revoke after playback
let chunkQueue: TextChunkMeta[] = [];
let prefetchCache = new Map<number, Promise<{ blobUrl: string; wordTimings: WordTiming[] }>>();
let currentVoice: VoiceConfig = DEFAULT_VOICE;
let isPlaying = false;
let isStopped = false;
let onDoneCallback: (() => void) | null = null;
let onProgressCallback: ((globalCharIndex: number) => void) | null = null;
let onStartCallback: (() => void) | null = null;
let didFireStart = false;
let fallbackProgressTimer: number | null = null;
let audioRafId: number | null = null;
let runId = 0;
let chunkProgressTimers = new Set<number>();
let isPaused = false;
let liveUtterance: SpeechSynthesisUtterance | null = null;

function stopAudioRaf() {
  if (audioRafId !== null) {
    cancelAnimationFrame(audioRafId);
    audioRafId = null;
  }
}

function cleanup() {
  stopAudioRaf();
  prefetchCache.clear();
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
  const preferredGender = cloudStorage.getItem('user_voice') === 'male' ? 'male' : 'female';
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

    // Weighted word starts inside this piece for smooth monotonic fallback estimation
    const wordStarts: number[] = [];
    { const wr = /\S+/g; let w: RegExpExecArray | null; while ((w = wr.exec(piece)) !== null) wordStarts.push(w.index); }
    let highestWordChar = 0;

    const emitMonotonic = (charOffsetInPiece: number) => {
      if (!onProgress) return;
      let wi = 0;
      while (wi + 1 < wordStarts.length && wordStarts[wi + 1] <= charOffsetInPiece) wi++;
      const snapped = wordStarts[wi] ?? 0;
      if (snapped >= highestWordChar) {
        highestWordChar = snapped;
        onProgress(base + snapped);
      }
    };

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
        spokenMs += d;
        // If native onboundary is actively firing within 550ms, let native events drive
        if (lastBoundaryTime > 0 && now - lastBoundaryTime < 550) return;
        const ch = Math.min(piece.length - 1, Math.floor(spokenMs / msPerChar));
        emitMonotonic(ch);
      }, 45);
    };

    const finish = () => {
      if (done) return;
      done = true;
      stopEstimator();
      if (watchdog != null) { window.clearTimeout(watchdog); watchdog = null; }
      if (myRun !== runId || isStopped) return;
      if (startedAt && piece.length > 25) {
        const actual = (Date.now() - startedAt - pausedMs) / piece.length;
        if (actual > 30 && actual < 200) msPerChar = msPerChar * 0.5 + actual * 0.5;
      }
      onProgress?.(base + piece.length);
      idx += 1;
      window.setTimeout(speakNext, 0);
    };
    const armWatchdog = () => {
      if (watchdog != null) window.clearTimeout(watchdog);
      watchdog = window.setTimeout(() => {
        watchdog = null;
        if (done || myRun !== runId) return;
        if (isPaused) { armWatchdog(); return; }
        if (window.speechSynthesis.speaking && extensions < 2) {
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
      emitMonotonic(0);
      startEstimator();
    };
    u.onboundary = (e: SpeechSynthesisEvent) => {
      if (e.name === 'word' && onProgress) {
        lastBoundaryTime = Date.now();
        spokenMs = e.charIndex * msPerChar;
        emitMonotonic(e.charIndex);
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

/** Build cadence-weighted word fractions [0..1] when SSML mark timepoints are absent */
function buildWeightedWordFractions(chunk: string): { charIndex: number; frac: number }[] {
  const items: { charIndex: number; weight: number }[] = [];
  const re = /\S+/g;
  let m: RegExpExecArray | null;
  let totalWeight = 0;
  while ((m = re.exec(chunk)) !== null) {
    const w = m[0];
    // Weight by spoken syllable approximation + trailing punctuation pause
    let weight = Math.max(2, w.length);
    if (/[.!?।؟]["')\]}]*$/.test(w)) weight += 5.5;
    else if (/[,;:—–]["')\]}]*$/.test(w)) weight += 2.8;
    items.push({ charIndex: m.index, weight });
    totalWeight += weight;
  }
  if (totalWeight <= 0) return [];
  let acc = 0;
  return items.map((it) => {
    const frac = acc / totalWeight;
    acc += it.weight;
    return { charIndex: it.charIndex, frac };
  });
}

function getSynthesizedChunkWithPrefetch(
  meta: TextChunkMeta,
  voice: VoiceConfig,
): Promise<{ blobUrl: string; wordTimings: WordTiming[] }> {
  const existing = prefetchCache.get(meta.start);
  if (existing) {
    prefetchCache.delete(meta.start);
    return existing;
  }
  // Retry once on transient network/cold-start glitch before failing
  return synthesizeChunk(meta.text, voice).catch(() => synthesizeChunk(meta.text, voice));
}

function warmNextChunk(voice: VoiceConfig) {
  if (isStopped || chunkQueue.length === 0) return;
  const nextMeta = chunkQueue[0];
  if (!prefetchCache.has(nextMeta.start)) {
    const p = synthesizeChunk(nextMeta.text, voice).catch(() =>
      synthesizeChunk(nextMeta.text, voice),
    );
    // Attach no-op catch so unhandled rejection never logs if stopped early
    p.catch(() => {});
    prefetchCache.set(nextMeta.start, p);
  }
}

// ── Sequential chunk player ────────────────────────────────────────────────────
async function playNextChunk() {
  const localRunId = runId;
  stopAudioRaf();
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

  // Immediately start prefetching the following chunk in parallel
  warmNextChunk(currentVoice);

  try {
    const { blobUrl, wordTimings } = await getSynthesizedChunkWithPrefetch(chunkMeta, currentVoice);
    if (isStopped || localRunId !== runId) { URL.revokeObjectURL(blobUrl); return; }

    // Ensure the next chunk after this one is also warming
    warmNextChunk(currentVoice);

    const weightedFractions = wordTimings.length === 0 ? buildWeightedWordFractions(chunk) : [];
    const audio = new Audio(blobUrl);
    audio.preload = 'auto';
    currentAudio = audio;
    pendingBlobUrls.push(blobUrl);

    let lastEmittedChar = -1;
    const emitProgressAtTime = (t: number) => {
      if (!onProgressCallback || localRunId !== runId || isStopped) return;

      if (wordTimings.length > 0) {
        // ── Exact SSML <mark> timepoints from Google Cloud Wavenet TTS ──
        // 25ms visual lead so highlight lands right as the phoneme begins
        const targetTime = t + 0.025;
        let lo = 0, hi = wordTimings.length - 1, best = 0;
        while (lo <= hi) {
          const mid = (lo + hi) >> 1;
          if (wordTimings[mid].timeSeconds <= targetTime) { best = mid; lo = mid + 1; }
          else { hi = mid - 1; }
        }
        const globalChar = chunkMeta.start + wordTimings[best].charIndex;
        if (globalChar !== lastEmittedChar) {
          lastEmittedChar = globalChar;
          onProgressCallback(globalChar);
        }
      } else if (audio.duration && isFinite(audio.duration) && audio.duration > 0 && weightedFractions.length > 0) {
        // ── Cadence-weighted interpolation locked to audio.currentTime / audio.duration ──
        const ratio = Math.max(0, Math.min(1, t / audio.duration));
        let lo = 0, hi = weightedFractions.length - 1, best = 0;
        while (lo <= hi) {
          const mid = (lo + hi) >> 1;
          if (weightedFractions[mid].frac <= ratio) { best = mid; lo = mid + 1; }
          else { hi = mid - 1; }
        }
        const globalChar = chunkMeta.start + weightedFractions[best].charIndex;
        if (globalChar !== lastEmittedChar) {
          lastEmittedChar = globalChar;
          onProgressCallback(globalChar);
        }
      } else {
        const approxChars = Math.min(chunk.length - 1, Math.max(0, Math.floor(t * 14.5)));
        const globalChar = chunkMeta.start + approxChars;
        if (globalChar !== lastEmittedChar) {
          lastEmittedChar = globalChar;
          onProgressCallback(globalChar);
        }
      }
    };

    const tickRaf = () => {
      if (localRunId !== runId || isStopped || currentAudio !== audio) {
        audioRafId = null;
        return;
      }
      if (!isPaused && !audio.paused) {
        emitProgressAtTime(audio.currentTime);
      }
      audioRafId = requestAnimationFrame(tickRaf);
    };

    audio.ontimeupdate = () => {
      if (!isPaused) emitProgressAtTime(audio.currentTime);
    };

    audio.onended = () => {
      if (localRunId !== runId) return;
      stopAudioRaf();
      if (onProgressCallback) onProgressCallback(chunkMeta.start + chunk.length);
      URL.revokeObjectURL(blobUrl);
      pendingBlobUrls = pendingBlobUrls.filter(u => u !== blobUrl);
      currentAudio = null;
      playNextChunk();
    };

    audio.onerror = () => {
      if (localRunId !== runId) return;
      console.warn('[CloudTTS] audio playback error — skipping chunk');
      stopAudioRaf();
      URL.revokeObjectURL(blobUrl);
      currentAudio = null;
      playNextChunk();
    };

    audio.onplay = () => {
      if (localRunId !== runId) return;
      emitProgressAtTime(audio.currentTime);
      stopAudioRaf();
      audioRafId = requestAnimationFrame(tickRaf);
      if (!didFireStart) { onStartCallback?.(); didFireStart = true; }
    };

    audio.play().catch(() => {
      console.warn('[CloudTTS] play() rejected — falling back to speechSynthesis');
      stopAudioRaf();
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
  opts?: { raw?: boolean; startCharIndex?: number },
) {
  googleTtsStop();
  runId += 1;
  isPaused = false;

  // raw: caller already produced speakable text and needs progress indices
  // that map 1:1 onto it (read-aloud highlighting).
  const clean = opts?.raw ? (text.trim() ? text : '') : sanitizeForTts(text);
  if (!clean) { onEnd?.(); return; }

  const startOffset = Math.max(0, Math.min(clean.length - 1, opts?.startCharIndex ?? 0));
  const targetText = startOffset > 0 ? clean.slice(startOffset) : clean;
  if (!targetText.trim()) { onEnd?.(); return; }

  // Auto-detect language from script if content gives a clearer signal
  const detectedBcp47 = detectLangCode(targetText, bcp47Lang);
  const preferMale = cloudStorage.getItem('user_voice') === 'male';
  const selectedVoice = VOICE_MAP[detectedBcp47] ?? DEFAULT_VOICE;
  currentVoice = {
    ...selectedVoice,
    name: getVoiceNameForGender(selectedVoice, preferMale),
    ssmlGender: preferMale ? 'MALE' : 'FEMALE',
  };

  const isGcpKey = GOOGLE_API_KEY.trim().startsWith('AIzaSy') || GOOGLE_API_KEY.trim().startsWith('AQ.');
  const hasCloudTenant = Boolean(detectTenantId() || cloudStorage.getItem('current_tenant_id'));
  if (!isGcpKey && !hasCloudTenant) {
    isPlaying = true;
    onDoneCallback = null;
    onProgressCallback = null;
    onStartCallback = onStart ?? null;
    didFireStart = false;
    fallbackSpeak(
      targetText,
      currentVoice.languageCode,
      onEnd,
      onProgress ? (idx) => onProgress(startOffset + idx) : undefined,
    );
    return;
  }

  const rawChunks = splitIntoChunksWithOffsets(targetText, CHUNK_SIZE);
  if (rawChunks.length === 0) { onEnd?.(); return; }
  chunkQueue = rawChunks.map((c) => ({
    text: c.text,
    start: startOffset + c.start,
  }));

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
