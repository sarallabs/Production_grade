# Prompt 07 — Assessment, results and AskBot

## Goal
Tablet layouts for the quiz flow and the chat assistant.

## Files
- `src/components/study/AssessmentView.tsx`
- `src/components/study/AssessmentCompleteView.tsx`
- `src/components/study/AskBotView.tsx`

## Tablet design
- **AssessmentView:** question centered, max width ~820. In landscape, split: question left, options right. Larger option buttons (min height 56). Progress bar full width of the pane.
- **AssessmentCompleteView:** score summary left, breakdown/review list right (two columns in landscape); stacked in portrait. Larger score visual.
- **AskBotView:** chat messages centered, max width ~820; message bubbles up to 70% of that width; input bar stays docked at the bottom with a larger text size. Make sure the keyboard behaviour is unchanged.

## Tasks
1. Add `isTablet`/pane-width branches for layout and sizing only.
2. Keep `assessmentService` calls, scoring, and bot request logic exactly as they are.

## Do NOT change
Scoring, answer-state logic, API endpoints.

## Acceptance
- Complete a quiz at 390 px (unchanged) and 800/1280 px (tablet layout) with correct score.
- AskBot send/receive works; long messages wrap properly; scroll-to-bottom still works.
