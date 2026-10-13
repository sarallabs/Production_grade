# Prompt 08 — Flashcards

## Goal
Bigger, more comfortable flashcard experience on tablets.

## File
- `src/components/flashcards/FlashcardDeck.tsx` (534 lines)

## Tablet design
- Card larger but bounded (max ~720 x 480), centered; text scaled up.
- Controls (know / don't know / flip / next) move beside or below the card with larger touch targets; in landscape, controls can sit in a right-side column.
- Deck progress and counters shown in a header strip with more breathing room.
- Keep flip animation and swipe gestures working at the larger size.

## Tasks
1. Compute card size from `useDeviceLayout()` instead of fixed numbers, only on tablet.
2. Verify gesture/animation values (swipe thresholds) scale with card width so swipes still feel right.

## Do NOT change
Spaced-repetition or deck state logic, data source.

## Acceptance
- 390 px unchanged. 800/1280 px: card centered, swipe and button actions both work.
