/**
 * Google Cloud Text-to-Speech Service
 *
 * Synthesizes speech via the Cloud Run multi-tenant TTS proxy
 * (`/v2/t/:tenant/ai/tts` with server-side GCS caching & SSML word timepoints,
 * falling back to `/api/gemini/tts`, optional AIzaSy direct key, and hardened
 * chunked `window.speechSynthesis`).
 */

import { CLOUD_API_BASE, MOOCS_TENANT_ID } from '@/data/manifestService';

const GOOGLE_API_KEY: string =
  (import.meta as any).env?.VITE_GOOGLE_API_KEY ??
  (import.meta as any).env?.VITE_GEMINI_API_KEY ??
  '';
const TTS_ENDPOINT = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_API_KEY}`;

// ── Language / voice mapping ───────────────────────────────────────────────────
interface VoiceConfig {
  languageCode: string;
  male: string;
  female: string;
  name?: string;
  ssmlGender?: 'MALE' | 'FEMALE';
}

const VOICE_MAP: Record<string, VoiceConfig> = {
  'en-IN': { languageCode: 'en-IN', male: 'en-IN-Wavenet-A', female: 'en-IN-Wavenet-D' },
  'hi-IN': { languageCode: 'hi-IN', male: 'hi-IN-Wavenet-A', female: 'hi-IN-Wavenet-D' },
  'te-IN': { languageCode: 'te-IN', male: 'te-IN-Wavenet-A', female: 'te-IN-Wavenet-D' },
  'ur-PK': { languageCode: 'ur-PK', male: 'ur-PK-Wavenet-A', female: 'ur-PK-Wavenet-D' },
  'ur-IN': { languageCode: 'ur-PK', male: 'ur-PK-Wavenet-A', female: 'ur-PK-Wavenet-D' },
  'or-IN': { languageCode: 'en-IN', male: 'en-IN-Wavenet-A', female: 'en-IN-Wavenet-D' },
};

const DEFAULT_VOICE: VoiceConfig = {
  languageCode: 'en-IN',
  male: 'en-IN-Wavenet-A',
  female: 'en-IN-Wavenet-D',
};

function getVoiceNameForGender(voice: VoiceConfig, isMale: boolean): string {
  return isMale ? voice.male : voice.female;
}

const FIRST_CHUNK_SIZE = 380; // Small first chunk so playback starts quickly (<1s cold, <150ms cached)
const CHUNK_SIZE = 820;       // Subsequent chunks stay strictly under Cloud TTS 5000-byte SSML limit
const MAX_CHUNK_WORDS_FIRST = 55;
const MAX_CHUNK_WORDS = 115;

// ── Script detection ───────────────────────────────────────────────────────────
export function detectLangCode(text: string, fallbackBcp47: string): string {
  if (/[\u0600-\u06FF]/.test(text)) return 'ur-PK';
  if (/[\u0900-\u097F]/.test(text)) return 'hi-IN';
  if (/[\u0C00-\u0C7F]/.test(text)) return 'te-IN';
  return fallbackBcp47;
}

// ── Text sanitisation ─────────────────────────────────────────────────────────
export function sanitizeForTts(raw: string): string {
  if (!raw) return '';
  let t = raw;

  // 1. Remove YAML frontmatter and authoring metadata lines before stripping markup
  t = t.replace(/^---[\s\S]*?---\n*/m, ' ');
  t = t.replace(/^[#*\s]*(?:Persona|D_target|Word count|Bloom|Alteration)[^\n]*$/gmi, ' ');
  t = t.replace(/\*+(?:Persona|Word count|D_target|D_max)[^*\n]+\*+/gi, ' ');
  t = t.replace(/Persona:\s*[^|]*\|[^|]*D_target:[^\n]*/gi, ' ');

  // 2. Remove fenced code / Mermaid blocks & inline code before touching HTML/math
  t = t.replace(/```mermaid[\s\S]*?```/gi, ' ');
  t = t.replace(/```[\s\S]*?```/g, ' ');
  t = t.replace(/`[^`]+`/g, ' ');

  // 3. Strip HTML figures, images, and tags BEFORE stripping angle brackets/markdown
  t = t.replace(/<figure\b[\s\S]*?<\/figure>/gi, ' ');
  t = t.replace(/<img\b[^>]*>/gi, ' ');
  t = t.replace(/<[^>]+>/g, ' ');

  // 4. Strip markdown images and data URIs BEFORE markdown links
  t = t.replace(/!\[[^\]]*\]\([^)]*\)/g, ' ');
  t = t.replace(/data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+/g, ' ');

  // 5. Decode HTML entities
  try {
    const el = document.createElement('textarea');
    el.innerHTML = t;
    t = el.value;
  } catch {
    /* non-browser */
  }
  t = t
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");

  // 6. Strip GFM table delimiter rows and pipe characters
  t = t.replace(/^[ \t]*\|?[ \t:|-]*---+[ \t:|-]*\|?[ \t]*$/gm, ' ');
  t = t.replace(/^[ \t]*\|/gm, ' ').replace(/\|[ \t]*$/gm, ' ').replace(/\|/g, ' ');

  // 7. Strip LaTeX math formulas
  t = t
    .replace(/\$\$[\s\S]*?\$\$/g, ' ')
    .replace(/\$[^$\n]+\$/g, ' ')
    .replace(/\\[a-zA-Z]+/g, ' ')
    .replace(/[{}]/g, ' ');

  // 8. Strip remaining Markdown formatting
  t = t
    .replace(/#{1,6}\s+/g, ' ')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^[ \t]*[-*+][ \t]+/gm, ' ')
    .replace(/^[ \t]*\d+[.)][ \t]+/gm, ' ')
    .replace(/^>\s*/gm, ' ')
    .replace(/---+/g, ' ')
    .replace(/==(.+?)==/g, '$1')
    .replace(/[*_`~^\\#<>]/g, ' ');

  // 9. Normalise whitespace
  t = t
    .replace(/\r?\n+/g, '. ')
    .replace(/\.(\s*\.)+/g, '.')
    .replace(/\s{2,}/g, ' ')
    .trim();

  return t;
}

// ── Cloud Run Session Token Helper ─────────────────────────────────────────────
let tokenRefreshPromise: Promise<string | null> | null = null;
let lastTokenRefreshFailedAt = 0;
const TOKEN_REFRESH_COOLDOWN_MS = 60_000;

async function getOrRefreshMoocsToken(forceRefresh = false): Promise<string | null> {
  try {
    if (!forceRefresh) {
      const existing = localStorage.getItem('sv_moocs_token');
      if (existing && existing.trim()) return existing.trim();
    }
    if (localStorage.getItem('app_authenticated') !== 'true') {
      return null;
    }
  } catch {
    return null;
  }

  if (Date.now() - lastTokenRefreshFailedAt < TOKEN_REFRESH_COOLDOWN_MS) {
    return null;
  }

  if (tokenRefreshPromise) return tokenRefreshPromise;

  tokenRefreshPromise = (async () => {
    try {
      const defaultPass = (import.meta as any).env?.VITE_DEFAULT_PASSWORD || 'Ekam@2026';
      const res = await fetch(`${CLOUD_API_BASE}/v2/t/${MOOCS_TENANT_ID}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: defaultPass }),
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) {
        lastTokenRefreshFailedAt = Date.now();
        return null;
      }
      const data = await res.json();
      if (data?.token && typeof data.token === 'string') {
        try {
          localStorage.setItem('sv_moocs_token', data.token);
        } catch {
          /* ignore storage quota */
        }
        lastTokenRefreshFailedAt = 0;
        return data.token;
      }
      lastTokenRefreshFailedAt = Date.now();
      return null;
    } catch {
      lastTokenRefreshFailedAt = Date.now();
      return null;
    } finally {
      tokenRefreshPromise = null;
    }
  })();

  return tokenRefreshPromise;
}

// ── Chunk splitter (preserves exact character offsets in the source text) ───────
interface TextChunkMeta {
  text: string;
  start: number;
}

function splitIntoChunksWithOffsets(
  text: string,
  maxLen: number,
  firstChunkMaxLen = FIRST_CHUNK_SIZE,
): TextChunkMeta[] {
  const chunks: TextChunkMeta[] = [];
  const n = text.length;
  let pos = 0;
  const utf8Encoder = typeof TextEncoder !== 'undefined' ? new TextEncoder() : null;

  while (pos < n) {
    // Skip leading whitespace while keeping exact offset `pos`
    while (pos < n && /\s/.test(text[pos])) pos++;
    if (pos >= n) break;

    const isFirst = chunks.length === 0;
    const chunkMaxLen = isFirst ? Math.min(maxLen, firstChunkMaxLen) : maxLen;
    const chunkMaxWords = isFirst ? MAX_CHUNK_WORDS_FIRST : MAX_CHUNK_WORDS;
    const minSentenceOffset = isFirst ? 80 : 120;

    let end = Math.min(n, pos + chunkMaxLen);
    if (end < n) {
      const slice = text.slice(pos, end);
      let splitRel = -1;
      const sentenceRe = /[.!?।؟\n]\s+/g;
      let m: RegExpExecArray | null;
      while ((m = sentenceRe.exec(slice)) !== null) {
        if (m.index + m[0].length >= minSentenceOffset) {
          splitRel = m.index + 1;
        }
      }
      if (splitRel === -1) {
        const clauseRe = /[,;:—–-]\s+/g;
        while ((m = clauseRe.exec(slice)) !== null) {
          if (m.index + m[0].length >= minSentenceOffset) {
            splitRel = m.index + 1;
          }
        }
      }
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

    // Cap word count so SSML <mark> tags stay comfortably under Google Cloud TTS 5000-byte limit
    const rawSlice = text.slice(pos, end);
    const wordMatches = Array.from(rawSlice.matchAll(/\S+/g));
    if (wordMatches.length > chunkMaxWords) {
      const capWord = wordMatches[chunkMaxWords - 1];
      if (capWord && capWord.index !== undefined) {
        end = pos + capWord.index + capWord[0].length;
      }
    }

    // Guard UTF-8 byte length (important for multi-byte Indic / Urdu scripts)
    if (utf8Encoder) {
      while (end > pos + 60) {
        const candidate = text.slice(pos, end);
        const wordsCount = (candidate.match(/\S+/g) || []).length;
        const estimatedSsmlBytes =
          utf8Encoder.encode(candidate).length + wordsCount * 24 + 32;
        if (estimatedSsmlBytes <= 4600) break;
        const halfWs = candidate.lastIndexOf(' ', Math.floor(candidate.length * 0.72));
        if (halfWs <= 40) break;
        end = pos + halfWs;
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
interface WordTiming {
  charIndex: number;
  timeSeconds: number;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs = 15000,
): Promise<Response> {
  if (isStopped) {
    throw new DOMException('TTS stopped', 'AbortError');
  }
  const controller = new AbortController();
  inflightControllers.add(controller);
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
    inflightControllers.delete(controller);
  }
}

async function synthesizeChunk(
  text: string,
  voice: VoiceConfig,
): Promise<{ blobUrl: string; wordTimings: WordTiming[] }> {
  const gender = voice.ssmlGender ?? 'FEMALE';
  const selectedVoiceName = voice.name ?? getVoiceNameForGender(voice, gender === 'MALE');

  // Build XML-safe SSML with <mark> tags before each word for timepoint tracking
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

  const proxyPayload = JSON.stringify({
    ssml: ssmlParts,
    languageCode: voice.languageCode,
    voiceName: selectedVoiceName,
    ssmlGender: gender,
    speakingRate: 1.0,
    enableTimePointing: true,
  });

  let data: any = null;

  // 1. Primary: Cloud Run v2 TTS endpoint (/v2/t/:tenant/ai/tts) with GCS + LRU caching
  try {
    let token = await getOrRefreshMoocsToken();
    if (token && !isStopped) {
      let v2Res = await fetchWithTimeout(`${CLOUD_API_BASE}/v2/t/${MOOCS_TENANT_ID}/ai/tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: proxyPayload,
      });

      if (v2Res.status === 401 && !isStopped) {
        try {
          localStorage.removeItem('sv_moocs_token');
        } catch {
          /* ignore */
        }
        token = await getOrRefreshMoocsToken(true);
        if (token && !isStopped) {
          v2Res = await fetchWithTimeout(`${CLOUD_API_BASE}/v2/t/${MOOCS_TENANT_ID}/ai/tts`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            credentials: 'include',
            body: proxyPayload,
          });
        }
      }

      if (v2Res.ok) {
        data = await v2Res.json();
      }
    }
  } catch (v2Err) {
    if (isStopped) throw v2Err;
    console.warn('[CloudTTS] Cached v2 TTS proxy attempt failed, trying fallback:', v2Err);
  }

  // 2. Secondary: Public Cloud Run TTS proxy (/api/gemini/tts)
  if (!data?.audioContent && !isStopped) {
    try {
      const publicRes = await fetchWithTimeout(`${CLOUD_API_BASE}/api/gemini/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: proxyPayload,
      });
      if (publicRes.ok) {
        data = await publicRes.json();
      }
    } catch (proxyErr) {
      if (isStopped) throw proxyErr;
      console.warn('[CloudTTS] Backend /api/gemini/tts proxy failed:', proxyErr);
    }
  }

  // 3. Direct client fallback ONLY if an actual GCP REST API key (AIzaSy...) is present
  const hasDirectGcpKey = GOOGLE_API_KEY.trim().startsWith('AIzaSy');
  if (!data?.audioContent && hasDirectGcpKey && !isStopped) {
    try {
      const directRes = await fetchWithTimeout(TTS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
        }),
      });
      if (directRes.ok) {
        data = await directRes.json();
      }
    } catch (directErr) {
      if (isStopped) throw directErr;
      console.warn('[CloudTTS] Direct synthesis failed:', directErr);
    }
  }

  if (!data || !data.audioContent) {
    throw new Error('Cloud TTS synthesis unavailable');
  }

  const base64Audio: string = data.audioContent;

  // Parse timepoints into sorted word timings
  const wordTimings: WordTiming[] = [];
  if (Array.isArray(data.timepoints)) {
    for (const tp of data.timepoints) {
      const charIdx = markMap[tp.markName];
      if (charIdx !== undefined) {
        wordTimings.push({ charIndex: charIdx, timeSeconds: tp.timeSeconds });
      }
    }
    wordTimings.sort((a, b) => a.timeSeconds - b.timeSeconds);
  }

  // Decode base64 → Blob → Object URL
  const binary = atob(base64Audio);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const blob = new Blob([bytes], { type: 'audio/mp3' });
  return { blobUrl: URL.createObjectURL(blob), wordTimings };
}

// ── Player state ───────────────────────────────────────────────────────────────
const SILENT_WAV_DATA_URI =
  'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
let masterAudio: HTMLAudioElement | null = null;
let audioUnlocked = false;
let currentAudio: HTMLAudioElement | null = null;
let pendingBlobUrls: string[] = []; // object URLs to revoke after playback
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

function getMasterAudio(): HTMLAudioElement {
  if (!masterAudio) {
    masterAudio = new Audio();
    masterAudio.preload = 'auto';
  }
  return masterAudio;
}

function detachAudioHandlers(audio: HTMLAudioElement | null) {
  if (!audio) return;
  audio.onplay = null;
  audio.ontimeupdate = null;
  audio.onended = null;
  audio.onerror = null;
}

/** Synchronously prime/unlock masterAudio within the user click gesture before async TTS fetches. */
function unlockAudioForGesture() {
  try {
    const a = getMasterAudio();
    if (audioUnlocked) return;
    detachAudioHandlers(a);
    a.muted = true;
    a.src = SILENT_WAV_DATA_URI;
    const p = a.play();
    if (p && typeof p.then === 'function') {
      p.then(() => {
        audioUnlocked = true;
        if (currentAudio !== a && a.src === SILENT_WAV_DATA_URI) {
          a.pause();
          a.muted = false;
        }
      }).catch(() => {
        a.muted = false;
      });
    }
  } catch {
    /* ignore */
  }
}

function stopAudioRaf() {
  if (audioRafId !== null) {
    cancelAnimationFrame(audioRafId);
    audioRafId = null;
  }
}

function cleanup() {
  stopAudioRaf();
  prefetchCache.clear();
  if (currentAudio) {
    detachAudioHandlers(currentAudio);
    currentAudio.pause();
    currentAudio.removeAttribute('src');
    currentAudio = null;
  }
  pendingBlobUrls.forEach((u) => URL.revokeObjectURL(u));
  pendingBlobUrls = [];
  if (fallbackProgressTimer != null) {
    window.clearInterval(fallbackProgressTimer);
    fallbackProgressTimer = null;
  }
  chunkProgressTimers.forEach((t) => window.clearInterval(t));
  chunkProgressTimers.clear();
  liveUtterance = null;
}

function waitForSpeechSynthesisVoices(timeoutMs = 200): Promise<SpeechSynthesisVoice[]> {
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

function findSpeechSynthesisVoice(
  voices: SpeechSynthesisVoice[],
  preferredGender: 'male' | 'female',
  desiredLang: string,
): SpeechSynthesisVoice | null {
  const genderPattern = VOICE_NAME_PATTERNS[preferredGender];
  const rank = (list: SpeechSynthesisVoice[]) =>
    [...list].sort((a, b) => {
      const g = (v: SpeechSynthesisVoice) =>
        genderPattern.test(v.name) || genderPattern.test(v.voiceURI) ? 10 : 0;
      const accent = (v: SpeechSynthesisVoice) => {
        const l = v.lang.toLowerCase().replace('_', '-');
        if (l.endsWith('-in')) return 200;
        if (l === 'en-us') return 120;
        if (/-(gb|au|ie|nz|za)$/.test(l) || /\buk\b|british/i.test(v.name)) return -200;
        return 0;
      };
      return naturalnessScore(b) + g(b) + accent(b) - (naturalnessScore(a) + g(a) + accent(a));
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
  if (!window.speechSynthesis) {
    isPlaying = false;
    onDone?.();
    return;
  }
  window.speechSynthesis.cancel();
  const preferredGender = localStorage.getItem('user_voice') === 'male' ? 'male' : 'female';
  const desiredLang = bcp47.toLowerCase().split('-')[0];
  const immediateVoices = window.speechSynthesis.getVoices();
  const availableVoices = immediateVoices.length
    ? immediateVoices
    : await waitForSpeechSynthesisVoices(250);

  const matchingVoice = findSpeechSynthesisVoice(availableVoices, preferredGender, desiredLang);

  // Split into sentence-sized pieces <= 220 chars so Chrome/Edge online voices don't stall
  const pieces: { text: string; start: number }[] = [];
  {
    const re = /[^\n]+/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const lineStart = m.index;
      const line = m[0];
      const sentRe = /[^.!?।؟]+[.!?।؟]*\s*/g;
      let s: RegExpExecArray | null;
      let cur = '';
      let curStart = lineStart;
      while ((s = sentRe.exec(line)) !== null) {
        if (!s[0]) {
          sentRe.lastIndex++;
          continue;
        }
        if (cur && (cur + s[0]).length > 220) {
          if (cur.trim()) pieces.push({ text: cur, start: curStart });
          cur = '';
          curStart = lineStart + s.index;
        }
        if (!cur) curStart = lineStart + s.index;
        cur += s[0];
      }
      if (cur.trim()) pieces.push({ text: cur, start: curStart });
    }
  }

  const myRun = runId;
  let idx = 0;
  let msPerChar = 68;
  let consecutiveErrors = 0;
  let disablePreferredVoice = false;

  if (!didFireStart) {
    onStartCallback?.();
    didFireStart = true;
  }

  const stopEstimator = () => {
    if (fallbackProgressTimer != null) {
      window.clearInterval(fallbackProgressTimer);
      fallbackProgressTimer = null;
    }
  };

  const speakNext = () => {
    if (myRun !== runId || isStopped) return;
    if (idx >= pieces.length) {
      stopEstimator();
      onProgress?.(text.length);
      isPlaying = false;
      liveUtterance = null;
      onDone?.();
      return;
    }

    const { text: piece, start: base } = pieces[idx];
    const u = new SpeechSynthesisUtterance(piece);
    liveUtterance = u; // Keep GC reference so Chrome doesn't drop onend
    u.lang = bcp47;
    if (matchingVoice && !disablePreferredVoice) u.voice = matchingVoice;
    u.rate = 0.95;

    let done = false;
    let watchdog: number | null = null;
    let extensions = 0;
    let lastBoundaryTime = 0;
    let spokenMs = 0;
    let lastTick = 0;
    let startedAt = 0;
    let queuedAt = Date.now();
    let pausedMs = 0;

    const wordStarts: number[] = [];
    {
      const wr = /\S+/g;
      let w: RegExpExecArray | null;
      while ((w = wr.exec(piece)) !== null) wordStarts.push(w.index);
    }
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

    const startEstimator = () => {
      stopEstimator();
      lastTick = Date.now();
      fallbackProgressTimer = window.setInterval(() => {
        const now = Date.now();
        const d = now - lastTick;
        lastTick = now;
        if (isPaused) {
          pausedMs += d;
          return;
        }
        if (!onProgress) return;
        spokenMs += d;
        if (lastBoundaryTime > 0 && now - lastBoundaryTime < 550) return;
        const ch = Math.min(Math.max(0, piece.length - 1), Math.floor(spokenMs / msPerChar));
        emitMonotonic(ch);
      }, 45);
    };

    const finish = () => {
      if (done) return;
      done = true;
      consecutiveErrors = 0;
      stopEstimator();
      if (watchdog != null) {
        window.clearTimeout(watchdog);
        watchdog = null;
      }
      if (myRun !== runId || isStopped) return;
      if (startedAt && piece.length > 25) {
        const actual = (Date.now() - startedAt - pausedMs) / piece.length;
        if (actual > 30 && actual < 200) msPerChar = msPerChar * 0.5 + actual * 0.5;
      }
      onProgress?.(base + piece.length);
      idx += 1;
      window.setTimeout(speakNext, 0);
    };

    const handleError = (e: SpeechSynthesisErrorEvent) => {
      if (done) return;
      done = true;
      stopEstimator();
      if (watchdog != null) {
        window.clearTimeout(watchdog);
        watchdog = null;
      }
      if (myRun !== runId || isStopped) return;
      if (e?.error === 'canceled' || e?.error === 'interrupted') return;

      consecutiveErrors += 1;
      // Retry current piece once with default OS voice if preferred voice failed immediately
      if (!disablePreferredVoice && matchingVoice && consecutiveErrors === 1 && Date.now() - queuedAt < 500) {
        disablePreferredVoice = true;
        window.setTimeout(speakNext, 20);
        return;
      }
      // Abort cleanly rather than cascading across every remaining piece to EOF
      if (consecutiveErrors >= 2 || e?.error === 'not-allowed') {
        isPlaying = false;
        liveUtterance = null;
        onDone?.();
        return;
      }
      idx += 1;
      window.setTimeout(speakNext, 0);
    };

    const armWatchdog = () => {
      if (watchdog != null) window.clearTimeout(watchdog);
      watchdog = window.setTimeout(() => {
        watchdog = null;
        if (done || myRun !== runId) return;
        if (isPaused) {
          armWatchdog();
          return;
        }
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
      consecutiveErrors = 0;
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
    u.onerror = handleError;

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
  return synthesizeChunk(meta.text, voice).catch((err) => {
    if (isStopped) throw err;
    return synthesizeChunk(meta.text, voice);
  });
}

function warmNextChunk(voice: VoiceConfig) {
  if (isStopped || chunkQueue.length === 0) return;
  const nextMeta = chunkQueue[0];
  if (!prefetchCache.has(nextMeta.start)) {
    const p = synthesizeChunk(nextMeta.text, voice).catch((err) => {
      if (isStopped) throw err;
      return synthesizeChunk(nextMeta.text, voice);
    });
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

  // Warm the following chunk concurrently
  warmNextChunk(currentVoice);

  try {
    const { blobUrl, wordTimings } = await getSynthesizedChunkWithPrefetch(chunkMeta, currentVoice);
    if (isStopped || localRunId !== runId) {
      URL.revokeObjectURL(blobUrl);
      return;
    }

    warmNextChunk(currentVoice);

    const weightedFractions = wordTimings.length === 0 ? buildWeightedWordFractions(chunk) : [];
    const audio = getMasterAudio();
    detachAudioHandlers(audio);
    audio.pause();
    audio.muted = false;
    audio.src = blobUrl;
    audio.preload = 'auto';
    audio.load();
    currentAudio = audio;
    pendingBlobUrls.push(blobUrl);

    let lastEmittedChar = -1;
    const emitProgressAtTime = (t: number) => {
      if (!onProgressCallback || localRunId !== runId || isStopped) return;

      if (wordTimings.length > 0) {
        const targetTime = t + 0.025; // Slight visual lead so highlight aligns with onset
        let lo = 0;
        let hi = wordTimings.length - 1;
        let best = 0;
        while (lo <= hi) {
          const mid = (lo + hi) >> 1;
          if (wordTimings[mid].timeSeconds <= targetTime) {
            best = mid;
            lo = mid + 1;
          } else {
            hi = mid - 1;
          }
        }
        const globalChar = chunkMeta.start + wordTimings[best].charIndex;
        if (globalChar !== lastEmittedChar) {
          lastEmittedChar = globalChar;
          onProgressCallback(globalChar);
        }
      } else if (
        audio.duration &&
        isFinite(audio.duration) &&
        audio.duration > 0 &&
        weightedFractions.length > 0
      ) {
        const ratio = Math.max(0, Math.min(1, t / audio.duration));
        let lo = 0;
        let hi = weightedFractions.length - 1;
        let best = 0;
        while (lo <= hi) {
          const mid = (lo + hi) >> 1;
          if (weightedFractions[mid].frac <= ratio) {
            best = mid;
            lo = mid + 1;
          } else {
            hi = mid - 1;
          }
        }
        const globalChar = chunkMeta.start + weightedFractions[best].charIndex;
        if (globalChar !== lastEmittedChar) {
          lastEmittedChar = globalChar;
          onProgressCallback(globalChar);
        }
      } else {
        const approxChars = Math.min(Math.max(0, chunk.length - 1), Math.max(0, Math.floor(t * 14.5)));
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
      detachAudioHandlers(audio);
      if (onProgressCallback) onProgressCallback(chunkMeta.start + chunk.length);
      audio.removeAttribute('src');
      URL.revokeObjectURL(blobUrl);
      pendingBlobUrls = pendingBlobUrls.filter((u) => u !== blobUrl);
      currentAudio = null;
      playNextChunk();
    };

    audio.onerror = () => {
      if (localRunId !== runId) return;
      console.warn('[CloudTTS] audio playback error — skipping chunk');
      stopAudioRaf();
      detachAudioHandlers(audio);
      audio.removeAttribute('src');
      URL.revokeObjectURL(blobUrl);
      pendingBlobUrls = pendingBlobUrls.filter((u) => u !== blobUrl);
      currentAudio = null;
      playNextChunk();
    };

    audio.onplay = () => {
      if (localRunId !== runId) return;
      audioUnlocked = true;
      emitProgressAtTime(audio.currentTime);
      stopAudioRaf();
      audioRafId = requestAnimationFrame(tickRaf);
      if (!didFireStart) {
        onStartCallback?.();
        didFireStart = true;
      }
    };

    audio.play().catch(() => {
      console.warn('[CloudTTS] play() rejected — falling back to speechSynthesis');
      stopAudioRaf();
      detachAudioHandlers(audio);
      audio.removeAttribute('src');
      URL.revokeObjectURL(blobUrl);
      pendingBlobUrls = pendingBlobUrls.filter((u) => u !== blobUrl);
      currentAudio = null;
      if (isStopped || localRunId !== runId) return;
      const remaining = [chunkMeta.text, ...chunkQueue.map((c) => c.text)].join(' ');
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
    if (isStopped || localRunId !== runId) return;
    console.warn('[CloudTTS] synthesis failed:', err, '— falling back to speechSynthesis');
    const remaining = [chunkMeta.text, ...chunkQueue.map((c) => c.text)].join(' ');
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
  unlockAudioForGesture();

  // raw: caller already produced DOM-aligned speakable text and requires 1:1 char offsets
  const clean = opts?.raw ? (text.trim() ? text : '') : sanitizeForTts(text);
  if (!clean) {
    onEnd?.();
    return;
  }

  const startOffset = Math.max(0, Math.min(clean.length - 1, opts?.startCharIndex ?? 0));
  const targetText = startOffset > 0 ? clean.slice(startOffset) : clean;
  if (!targetText.trim()) {
    onEnd?.();
    return;
  }

  // Auto-detect language from script if content gives a clearer signal
  const detectedBcp47 = detectLangCode(targetText, bcp47Lang);
  const preferMale = localStorage.getItem('user_voice') === 'male';
  const selectedVoice = VOICE_MAP[detectedBcp47] ?? DEFAULT_VOICE;
  currentVoice = {
    ...selectedVoice,
    name: getVoiceNameForGender(selectedVoice, preferMale),
    ssmlGender: preferMale ? 'MALE' : 'FEMALE',
  };

  const rawChunks = splitIntoChunksWithOffsets(targetText, CHUNK_SIZE, FIRST_CHUNK_SIZE);
  if (rawChunks.length === 0) {
    onEnd?.();
    return;
  }
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
    currentAudio.play().catch((e) => console.warn('Resume failed:', e));
  }
  window.speechSynthesis?.resume();
}

export function googleTtsIsPlaying(): boolean {
  return isPlaying;
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && isPlaying && !isPaused) {
      if (typeof window !== 'undefined' && window.speechSynthesis?.paused) {
        window.speechSynthesis.resume();
      }
    }
  });
}
