import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { detectLangCode, sanitizeForTts } from '../googleTtsService';
import { hasWebSpeechSupport } from '../speechService';

describe('Speech & TTS Service Logic Tests', () => {
  describe('detectLangCode', () => {
    it('should detect Urdu script and return ur-PK', () => {
      expect(detectLangCode('کیا آپ کی مدد کی ضرورت ہے؟', 'en-IN')).toBe('ur-PK');
    });

    it('should detect Hindi script and return hi-IN', () => {
      expect(detectLangCode('नमस्ते, आप कैसे हैं?', 'en-IN')).toBe('hi-IN');
    });

    it('should detect Telugu script and return te-IN', () => {
      expect(detectLangCode('నమస్కారం, ఎలా ఉన్నారు?', 'en-IN')).toBe('te-IN');
    });

    it('should fall back to default language code for English/other scripts', () => {
      expect(detectLangCode('Hello, how are you?', 'en-IN')).toBe('en-IN');
      expect(detectLangCode('Hello, how are you?', 'en-US')).toBe('en-US');
    });
  });

  describe('sanitizeForTts', () => {
    it('should strip HTML tags successfully', () => {
      expect(sanitizeForTts('<p>Hello <strong>World</strong>!</p>')).toBe('Hello World !');
    });

    it('should strip markdown bold and italic syntaxes', () => {
      expect(sanitizeForTts('This is **bold** and *italic* text.')).toBe('This is bold and italic text.');
    });

    it('should remove markdown code blocks completely', () => {
      expect(sanitizeForTts('Here is code:\n```js\nconsole.log(1);\n```\nEnd of code.')).toBe('Here is code:. End of code.');
    });

    it('should replace headers with clean text', () => {
      expect(sanitizeForTts('# Header 1\n## Header 2')).toBe('Header 1. Header 2');
    });

    it('should normalize multiple newlines and spaces', () => {
      expect(sanitizeForTts('Hello. \n\n   World.     Test.')).toBe('Hello. World. Test.');
    });
  });

  describe('hasWebSpeechSupport', () => {
    const originalWindow = { ...global.window };

    afterEach(() => {
      // Restore global window object
      global.window = originalWindow as any;
    });

    it('should return true if SpeechRecognition is defined in window', () => {
      global.window = { SpeechRecognition: {} } as any;
      expect(hasWebSpeechSupport()).toBe(true);
    });

    it('should return true if webkitSpeechRecognition is defined in window', () => {
      global.window = { webkitSpeechRecognition: {} } as any;
      expect(hasWebSpeechSupport()).toBe(true);
    });

    it('should return false if neither is defined in window', () => {
      global.window = {} as any;
      expect(hasWebSpeechSupport()).toBe(false);
    });
  });
});
