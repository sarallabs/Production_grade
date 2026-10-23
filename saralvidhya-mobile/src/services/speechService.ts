/**
 * speechService.ts
 *
 * Production-Grade Text-to-Speech (TTS) Engine for Mobile (Android & iOS) and Web.
 *
 * Designed specifically for ANGRAU Agricultural Education:
 * 1. Safe voice fallback: uses OS-default speech engine with language 'en'
 *    avoiding Android -1 network voice failures.
 * 2. Conversational Message TTS (`speakMessage`): Speaks full chat answers in a single,
 *    fluid utterance with a robust watchdog timer to eliminate Android `onDone` callback stalls.
 * 3. Long-form Chapter Reader TTS (`speak`): Paragraph & sentence chunking for
 *    lengthy textbook chapters in StudyGuideReader & ReadAloudBar.
 * 4. Comprehensive Markdown Phonetic Sanitizer: Converts Markdown headings, bold terms,
 *    and bullet markers into natural auditory pauses.
 * 5. Reactive Observable State: Publishes real-time `isSpeaking`, `isPaused`, and
 *    `activeMessageId` updates across all subscribed components.
 */

import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

export type SpeechListener = (
  isSpeaking: boolean,
  isPaused: boolean,
  currentChunk?: number,
  totalChunks?: number,
  activeMessageId?: string | null,
) => void;

/**
 * Phonetically sanitizes markdown text into natural spoken English
 */
export function sanitizeMarkdownForSpeech(raw: string): string {
  if (!raw) return '';
  let t = raw;

  // 1. Remove HTML tags
  t = t.replace(/<[^>]*>/g, ' ');

  // 2. Remove images and URLs
  t = t.replace(/!\[[\s\S]*?\]\([\s\S]*?\)/g, ' ');
  t = t.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

  // 3. Remove code blocks
  t = t.replace(/```[\s\S]*?```/g, ' ');
  t = t.replace(/`([^`]+)`/g, '$1');

  // 4. Convert headings: ### Title -> Title.
  t = t.replace(/#{1,6}\s+([^\n]+)/g, '$1. ');

  // 5. Clean bullet markers at start of lines: * **Term:** -> **Term:**
  t = t.replace(/^[\s*•\-–—]+\s*/gm, '');

  // 6. Remove bold & italic markdown tokens
  t = t.replace(/\*\*([^*]+)\*\*/g, '$1');
  t = t.replace(/\*([^*]+)\*/g, '$1');
  t = t.replace(/__([^_]+)__/g, '$1');
  t = t.replace(/_([^_]+)_/g, '$1');

  // 7. Clean numbered lists: "1. Term" -> "Term"
  t = t.replace(/^\s*\d+\.\s+/gm, '');

  // 8. Strip non-auditory symbols and emojis
  t = t.replace(/[>*~|#^]/g, ' ');
  t = t.replace(/---+/g, ' ');
  t = t.replace(/⚠️|📖|📚|💙|🚫|🙏|👋|✦|🎙️|•/g, ' ');

  // 9. Add natural speech pauses on colons: "Term:" -> "Term. "
  t = t.replace(/:\s+/g, '. ');

  // 10. Clean duplicate spaces and multiple periods
  t = t.replace(/\n+/g, '. ');
  t = t.replace(/\s+/g, ' ');
  t = t.replace(/\.{2,}/g, '.');
  t = t.replace(/\s+\./g, '.');

  return t.trim();
}

class SpeechService {
  private _isSpeaking = false;
  private _isPaused = false;
  private _currentRate = 1.0;
  private _activeMessageId: string | null = null;
  private _listeners: Set<SpeechListener> = new Set();

  private _chunks: string[] = [];
  private _currentChunkIndex = 0;
  private _activeSessionId = 0;
  private _onAllDone?: () => void;
  private _watchdogTimer: any = null;

  get isSpeaking(): boolean {
    return this._isSpeaking;
  }

  get isPaused(): boolean {
    return this._isPaused;
  }

  get currentRate(): number {
    return this._currentRate;
  }

  get currentChunkIndex(): number {
    return this._currentChunkIndex;
  }

  get totalChunks(): number {
    return this._chunks.length;
  }

  get activeMessageId(): string | null {
    return this._activeMessageId;
  }

  subscribe(listener: SpeechListener): () => void {
    this._listeners.add(listener);
    listener(
      this._isSpeaking,
      this._isPaused,
      this._currentChunkIndex,
      this._chunks.length,
      this._activeMessageId,
    );
    return () => {
      this._listeners.delete(listener);
    };
  }

  private notify() {
    this._listeners.forEach((fn) =>
      fn(
        this._isSpeaking,
        this._isPaused,
        this._currentChunkIndex,
        this._chunks.length,
        this._activeMessageId,
      ),
    );
  }

  private clearWatchdog() {
    if (this._watchdogTimer) {
      clearInterval(this._watchdogTimer);
      this._watchdogTimer = null;
    }
  }

  /**
   * Dedicated Chat Message TTS.
   * Speaks the entire answer in a single, natural utterance with automated watchdog recovery.
   */
  async speakMessage(
    messageId: string,
    rawText: string,
    rate: number = 1.0,
    onDone?: () => void,
  ) {
    // 1. Stop any ongoing speech
    await this.stop();

    const cleanText = sanitizeMarkdownForSpeech(rawText);
    if (!cleanText) {
      onDone?.();
      return;
    }

    const sessionId = ++this._activeSessionId;
    this._activeMessageId = messageId;
    this._isSpeaking = true;
    this._isPaused = false;
    this._currentRate = rate;
    this._chunks = [cleanText];
    this._currentChunkIndex = 0;
    this._onAllDone = onDone;
    this.notify();

    // 2. Setup Watchdog to detect Android dropped onDone callbacks
    const wordCount = cleanText.split(/\s+/).length;
    // Average speech is ~140 words per minute at 1.0x rate
    const estimatedDurationMs = Math.max(
      4000,
      Math.ceil((wordCount / (140 * rate)) * 60 * 1000) + 4000,
    );
    const startTime = Date.now();

    this.clearWatchdog();
    this._watchdogTimer = setInterval(async () => {
      if (sessionId !== this._activeSessionId || !this._isSpeaking) {
        this.clearWatchdog();
        return;
      }

      // Check if native engine has stopped speaking
      try {
        const stillSpeaking = await Speech.isSpeakingAsync();
        const elapsed = Date.now() - startTime;

        if (!stillSpeaking && elapsed > 2000) {
          // Native engine finished, but onDone wasn't received
          this.clearWatchdog();
          this.finishSpeaking(sessionId);
        } else if (elapsed > estimatedDurationMs) {
          // Hard safety limit reached
          this.clearWatchdog();
          this.finishSpeaking(sessionId);
        }
      } catch {
        // Fallback on error
        if (Date.now() - startTime > estimatedDurationMs) {
          this.clearWatchdog();
          this.finishSpeaking(sessionId);
        }
      }
    }, 1500);

    // 3. Web speech synthesis background fix
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
      } catch {}
    }

    // 4. Native Speak with safe language defaults
    const speakOptions: Speech.SpeechOptions = {
      language: 'en',
      pitch: 1.0,
      rate: Math.max(0.75, Math.min(rate, 1.5)),
      onDone: () => {
        if (sessionId !== this._activeSessionId) return;
        this.clearWatchdog();
        this.finishSpeaking(sessionId);
      },
      onError: (err) => {
        console.log('[SpeechService] Message speak error:', err);
        if (sessionId !== this._activeSessionId) return;
        this.clearWatchdog();
        this.finishSpeaking(sessionId);
      },
      onStopped: () => {
        if (sessionId !== this._activeSessionId) return;
        this.clearWatchdog();
        this.finishSpeaking(sessionId);
      },
    };

    try {
      Speech.speak(cleanText, speakOptions);
    } catch (e) {
      console.log('[SpeechService] Speech.speak threw:', e);
      this.clearWatchdog();
      this.finishSpeaking(sessionId);
    }
  }

  private finishSpeaking(sessionId: number) {
    if (sessionId !== this._activeSessionId) return;
    this.clearWatchdog();
    this._isSpeaking = false;
    this._isPaused = false;
    this._activeMessageId = null;
    this._chunks = [];
    this._currentChunkIndex = 0;
    const callback = this._onAllDone;
    this._onAllDone = undefined;
    this.notify();
    callback?.();
  }

  /**
   * Splits long multi-page chapter text into chunks for the Textbook Study Reader
   */
  private splitIntoChunks(text: string, maxLen: number = 400): string[] {
    const clean = sanitizeMarkdownForSpeech(text);
    if (!clean) return [];

    // Split on sentence terminators (. ! ?)
    const sentences = clean.split(/(?<=[.!?])\s+/);
    const chunks: string[] = [];
    let current = '';

    for (const sentence of sentences) {
      if (!sentence.trim()) continue;

      if ((current + ' ' + sentence).length <= maxLen) {
        current = current ? `${current} ${sentence}` : sentence;
      } else {
        if (current) chunks.push(current.trim());
        if (sentence.length > maxLen) {
          const parts = sentence.split(/,\s+/);
          let sub = '';
          for (const p of parts) {
            if ((sub + ', ' + p).length <= maxLen) {
              sub = sub ? `${sub}, ${p}` : p;
            } else {
              if (sub) chunks.push(sub.trim());
              sub = p;
            }
          }
          if (sub) chunks.push(sub.trim());
          current = '';
        } else {
          current = sentence;
        }
      }
    }

    if (current.trim()) {
      chunks.push(current.trim());
    }

    return chunks;
  }

  /**
   * Speaks long chapter text chunk-by-chunk (Used by ReadAloudBar)
   */
  async speak(text: string, rate: number = 1.0, onDone?: () => void) {
    await this.stop();
    if (!text || text.trim().length === 0) {
      onDone?.();
      return;
    }

    const sessionId = ++this._activeSessionId;
    this._chunks = this.splitIntoChunks(text);
    if (this._chunks.length === 0) {
      onDone?.();
      return;
    }

    this._activeMessageId = null;
    this._currentChunkIndex = 0;
    this._currentRate = rate;
    this._isSpeaking = true;
    this._isPaused = false;
    this._onAllDone = onDone;
    this.notify();

    await this.playChunk(sessionId, 0);
  }

  private async playChunk(sessionId: number, chunkIndex: number) {
    if (sessionId !== this._activeSessionId || !this._isSpeaking) return;

    if (chunkIndex >= this._chunks.length) {
      this.finishSpeaking(sessionId);
      return;
    }

    this._currentChunkIndex = chunkIndex;
    this.notify();

    const chunkText = this._chunks[chunkIndex];

    const speakOptions: Speech.SpeechOptions = {
      language: 'en',
      pitch: 1.0,
      rate: this._currentRate,
      onDone: () => {
        if (sessionId !== this._activeSessionId) return;
        setTimeout(() => {
          this.playChunk(sessionId, chunkIndex + 1);
        }, 80);
      },
      onError: (err) => {
        console.log(`[SpeechService] Chunk ${chunkIndex} error:`, err);
        if (sessionId !== this._activeSessionId) return;
        setTimeout(() => {
          this.playChunk(sessionId, chunkIndex + 1);
        }, 100);
      },
      onStopped: () => {
        // Stopped cleanly
      },
    };

    try {
      Speech.speak(chunkText, speakOptions);
    } catch (e) {
      console.log('[SpeechService] playChunk threw:', e);
      setTimeout(() => {
        this.playChunk(sessionId, chunkIndex + 1);
      }, 100);
    }
  }

  async pause() {
    try {
      await Speech.pause();
      this._isPaused = true;
      this.notify();
    } catch {
      await this.stop();
    }
  }

  async resume() {
    try {
      await Speech.resume();
      this._isPaused = false;
      this.notify();
    } catch {
      if (this._isSpeaking && this._currentChunkIndex < this._chunks.length) {
        this._isPaused = false;
        await this.playChunk(this._activeSessionId, this._currentChunkIndex);
      }
    }
  }

  async setRate(newRate: number) {
    if (this._currentRate === newRate) return;
    this._currentRate = newRate;
    if (this._isSpeaking && !this._isPaused) {
      const currentIdx = this._currentChunkIndex;
      const sessionId = ++this._activeSessionId;
      try {
        await Speech.stop();
      } catch {}
      this._isSpeaking = true;
      this._isPaused = false;
      this.notify();
      await this.playChunk(sessionId, currentIdx);
    }
  }

  async stop() {
    this._activeSessionId++;
    this.clearWatchdog();
    try {
      await Speech.stop();
    } catch {}
    this._isSpeaking = false;
    this._isPaused = false;
    this._activeMessageId = null;
    this._chunks = [];
    this._currentChunkIndex = 0;
    this._onAllDone = undefined;
    this.notify();
  }
}

export const speechService = new SpeechService();
