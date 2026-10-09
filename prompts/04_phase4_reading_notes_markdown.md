# Phase 4 Implementation Plan: Quick & Detailed Notes Reader with Read Aloud TTS

## Objective
Build high-performance native reading views for Quick Study summaries, Detailed Notes, and Key Takeaways, supporting formatted Markdown, scientific notation, tables, and an integrated native Text-to-Speech (TTS) Read Aloud bar.

---

## 1. Required Packages
```bash
cd "c:\Users\Aditya\Desktop\Saral Vidhya product Angrau\Production_grade\saralvidhya-mobile"
npx expo install react-native-markdown-display expo-speech
```

---

## 2. Markdown Reader Component (`src/components/study/MarkdownReader.tsx`)
Port the markdown rendering logic from `saralvidhya-mvp/src/components/MarkdownView.tsx`:
- Clean custom styling for Android:
  - `h1`: 22px bold `#0f172a`, bottom border `#22c55e`.
  - `h2`: 18px bold `#1e293b`.
  - `h3`: 16px semibold `#334155`.
  - `body`: 15px line height 24px `#334155`.
  - `blockquote`: Emerald green left border (`#22c55e`, 4px), light green tint background (`#f0fdf4`), italic text.
  - `table`: Scrollable horizontal wrapper with alternating row colors.
  - `code_inline`: `#f1f5f9` background, rounded corners.
- Automatic cleaning of raw HTML tags or unsupported markdown artifacts.

---

## 3. Read Aloud Speech Service (`src/services/speechService.ts`)
Create a native speech wrapper using `expo-speech`:
```typescript
import * as Speech from 'expo-speech';

export const speechService = {
  isSpeaking: false,
  isPaused: false,

  speak(text: string, rate: number = 1.0, onDone?: () => void) {
    Speech.stop();
    Speech.speak(text, {
      language: 'en-IN',
      pitch: 1.0,
      rate: rate,
      onDone: () => {
        this.isSpeaking = false;
        onDone?.();
      },
      onError: () => {
        this.isSpeaking = false;
      },
    });
    this.isSpeaking = true;
  },

  pause() {
    Speech.pause();
    this.isPaused = true;
  },

  resume() {
    Speech.resume();
    this.isPaused = false;
  },

  stop() {
    Speech.stop();
    this.isSpeaking = false;
    this.isPaused = false;
  },
};
```

---

## 4. Read Aloud Floating Bottom Bar (`src/components/study/ReadAloudBar.tsx`)
A bottom bar that docks above the tab bar when reading notes:
- Play / Pause button with animated waveform or speaker icon.
- Speed toggle pill (`0.75x`, `1.0x`, `1.25x`, `1.5x`).
- Stop / Dismiss button.
- Progress indicator showing read progress through the chapter text.

---

## 5. Verification Checklist
- [x] Markdown notes render with clean typography, tables, and callout blocks.
- [x] Read Aloud speaks chapter text cleanly in English (Indian English voice if available).
- [x] Speed modifier changes playback rate dynamically.
- [x] Stopping or leaving the screen halts speech immediately.
