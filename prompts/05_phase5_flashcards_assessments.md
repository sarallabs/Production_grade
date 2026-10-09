# Phase 5 Implementation Plan: Interactive Flashcards & Assessment Engine

## Objective
Implement native, fluid 3D flippable flashcards with gesture swiping, and a complete MCQ/MSQ assessment engine with instant explanations and score reports.

---

## 1. 3D Flippable Flashcards (`src/components/flashcards/FlashcardDeck.tsx`)
Port functionality from `saralvidhya-mvp/src/components/FlashcardsView.tsx`:
- **Smooth 3D Flip Animation**:
  - Uses `react-native-reanimated` with `perspective: 1000` and `rotateY` interpolation.
  - Tap anywhere on card to flip between Front (Question / Term) and Back (Definition / Explanation).
- **Gesture Swiping**:
  - Swipe Right: "Mastered" (accent green indicator + haptic feedback `expo-haptics`).
  - Swipe Left: "Needs Review" (accent amber/red indicator).
- **Deck Status Bar**:
  - Progress bar: `Card 4 of 18`.
  - Mastered count vs Review count counters.
  - Reset / Shuffle deck button.

---

## 2. Assessment Parser & Service (`src/services/assessmentService.ts`)
Port logic from `saralvidhya-mvp/src/utils/quizParser.ts` and `assessmentService.ts`:
- Loads chapter quiz files from Cloud Run API or local assets.
- Parses:
  - **Single Choice (MCQ)**: Circular radio buttons.
  - **Multiple Select (MSQ)**: Square check boxes with "Select all that apply" badge.
  - **Explanations**: Comprehensive breakdown of why the answer is correct.

---

## 3. Assessment Quiz Screen (`src/components/study/AssessmentView.tsx`)
- **Question Card**:
  - Question number badge, question text with optional bold/code formatting.
  - Question type indicator (`MCQ` or `MSQ`).
- **Interactive Option Cards**:
  - Unselected: White background, subtle border `#e2e8f0`.
  - Selected: Emerald border `#22c55e`, soft green tint `#f0fdf4`.
  - Post-Submission Correct: Emerald background, checkmark badge.
  - Post-Submission Incorrect: Rose background `#fef2f2`, red border, cross badge.
- **Action Buttons**:
  - "Check Answer" -> Reveals explanation and updates score.
  - "Next Question" -> Advances to next item.

---

## 4. Assessment Complete Screen (`src/app/study/assessment-complete.tsx`)
Port `saralvidhya-mvp/src/pages/AssessmentComplete.tsx`:
- Celebratory header with trophy/star icon.
- Score percentage: e.g. `85% (17 / 20 Correct)`.
- Performance tier badge:
  - `> 80%`: "Mastery 🌟"
  - `60% - 80%`: "Proficient 👍"
  - `< 60%`: "Needs Revision 📚"
- Review Mode: Scrollable list of all questions showing chosen answers vs correct answers.
- "Return to Study Table" & "Retake Quiz" buttons.

---

## 5. Verification Checklist
- [x] Flashcards flip cleanly with 3D rotation and swipe gestures work smoothly.
- [x] Quizzes properly distinguish between single-choice radio and multi-select checkboxes.
- [x] Instant explanations display accurately after submitting an answer.
- [x] Final score screen calculates percentage and displays question review correctly.
