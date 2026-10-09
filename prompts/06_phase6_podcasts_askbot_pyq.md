# Phase 6 Implementation Plan: Background Podcasts, Gemini Ask Bot & PYQs

## Objective
Implement native background audio podcast playback with transcripts, conversational AI tutor (Ask Bot) grounded in curriculum context via Gemini API, and Previous Year Questions (PYQs) repository.

---

## 1. Native Podcast Player (`src/components/study/PodcastsView.tsx`)
Port functionality from `saralvidhya-mvp/src/components/study/PodcastsView.tsx`:
- **Audio Engine using `expo-av`**:
  ```typescript
  import { Audio } from 'expo-av';

  await Audio.setAudioModeAsync({
    staysActiveInBackground: true,
    playsInSilentModeIOS: true,
    shouldDuckAndroid: true,
  });
  ```
- **Player Interface**:
  - Chapter cover art / hero banner.
  - Episode title, speaker name, and duration.
  - Seek slider with elapsed and remaining timestamps.
  - Controls: 15s rewind, Play/Pause toggle, 15s forward, Playback rate (`1.0x`, `1.25x`, `1.5x`).
- **Interactive Transcript**:
  - Scrollable transcript pane.
  - Tapping on a timestamp jumps audio directly to that mark.

---

## 2. Gemini AI Ask Bot (`src/components/study/AskBotView.tsx`)
Port functionality from `saralvidhya-mvp/src/components/study/AskBotView.tsx`:
- **Gemini API Integration**:
  - Secure API client calling Gemini 1.5 Flash.
  - Context Injection: System prompt automatically receives:
    - Subject Name (e.g., `ENTO 131: Fundamentals of Entomology`)
    - Current Chapter Number & Title
    - Student Persona (e.g., `Beginner` or `Advanced`)
- **Chat UI**:
  - Message bubble list (User right-aligned emerald bubble, AI left-aligned slate card).
  - Suggested quick questions at the top (e.g., "Explain key insect orders", "What are the common 5-mark questions?").
  - Text input bar with send button and loading indicator.
  - Copy answer to clipboard button.

---

## 3. Previous Year Questions Repository (`src/components/study/PYQView.tsx`)
Port functionality from `saralvidhya-mvp/src/components/study/PYQView.tsx`:
- Filter tabs: `All` | `2 Marks` | `5 Marks` | `10 Marks`.
- Accordion Question Cards:
  - Header: Question text + Mark allocation badge.
  - Expanded Content:
    - Model answer with key points and diagram recommendations.
    - Year & semester appearance tags (e.g., `ANGRAU 2023 Semester 1`).

---

## 4. Verification Checklist
- [x] Podcasts play audio in background and lock screen controls stay active.
- [x] Seek slider moves smoothly and syncs with playback position.
- [x] Ask Bot responds with contextually accurate answers for the active chapter.
- [x] PYQ questions expand and collapse smoothly with model answers formatted.
