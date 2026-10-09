import * as Speech from 'expo-speech';

type SpeechListener = (isSpeaking: boolean, isPaused: boolean) => void;

class SpeechService {
  private _isSpeaking = false;
  private _isPaused = false;
  private _currentRate = 1.0;
  private _listeners: Set<SpeechListener> = new Set();

  get isSpeaking(): boolean {
    return this._isSpeaking;
  }

  get isPaused(): boolean {
    return this._isPaused;
  }

  get currentRate(): number {
    return this._currentRate;
  }

  subscribe(listener: SpeechListener): () => void {
    this._listeners.add(listener);
    listener(this._isSpeaking, this._isPaused);
    return () => {
      this._listeners.delete(listener);
    };
  }

  private notify() {
    this._listeners.forEach((fn) => fn(this._isSpeaking, this._isPaused));
  }

  async speak(text: string, rate: number = 1.0, onDone?: () => void) {
    await this.stop();
    if (!text || text.trim().length === 0) return;

    this._currentRate = rate;
    this._isSpeaking = true;
    this._isPaused = false;
    this.notify();

    // Strip markdown formatting for clear spoken output
    const cleanText = text
      .replace(/[#*_`~>-]/g, ' ')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/\s+/g, ' ')
      .trim();

    Speech.speak(cleanText, {
      language: 'en-IN',
      pitch: 1.0,
      rate: rate,
      onDone: () => {
        this._isSpeaking = false;
        this._isPaused = false;
        this.notify();
        onDone?.();
      },
      onError: (err) => {
        console.warn('Speech error:', err);
        this._isSpeaking = false;
        this._isPaused = false;
        this.notify();
      },
      onStopped: () => {
        this._isSpeaking = false;
        this._isPaused = false;
        this.notify();
      },
    });
  }

  async pause() {
    try {
      await Speech.pause();
      this._isPaused = true;
      this.notify();
    } catch {
      // pause not supported on some engines, fallback to stop
      await this.stop();
    }
  }

  async resume() {
    try {
      await Speech.resume();
      this._isPaused = false;
      this.notify();
    } catch {
      // Ignore
    }
  }

  async stop() {
    try {
      await Speech.stop();
    } catch {
      // Ignore
    } finally {
      this._isSpeaking = false;
      this._isPaused = false;
      this.notify();
    }
  }
}

export const speechService = new SpeechService();
