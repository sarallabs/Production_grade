# Prompt 05 — Study Table (master-detail workspace)

## Goal
The biggest tablet win: chapters on the left, study content on the right, at the same time.

## Files
- `src/app/(tabs)/study.tsx` (739 lines)
- `src/components/study/ChapterCard.tsx`
- Uses `MasterDetail` from prompt 01.

## Tablet design
- **Left pane (~340 dp):** subject header, chapter list (ChapterCard rows), scrollable on its own.
- **Right pane (rest):** the active chapter's content area with its mode tabs (reader, videos, mindmap, podcasts, PYQ, assessment, flashcards, AskBot), exactly the modes the phone offers.
- Selecting a chapter updates the right pane without leaving the screen. Selected chapter is highlighted.
- If no chapter is selected, show a friendly empty state ("Select a chapter").

## Tasks
1. First read `study.tsx` fully and list its states (selected subject/chapter, mode, loading) in a comment-free summary in your reply before editing.
2. Add an `isTablet` branch that renders `MasterDetail`; keep the existing phone flow (list → chapter view) untouched.
3. Reuse the existing mode components as the detail content; do not fork them. If a component assumes full-screen width, give it a `width`/`compact` prop only when needed.
4. Keep URL params (`subjectId`, `chapter`) in sync with selection so deep links like `/study?subjectId=ento_131&chapter=2` still work.
5. Persist nothing new; reuse existing storage utilities.

## Do NOT change
Content fetching, progress/watched tracking, route params.

## Acceptance
- 390 px: same behaviour as before.
- 800 px portrait: master (narrow) + detail both visible and usable.
- 1280 px landscape: comfortable reading width in the detail pane.
- Deep link opens the correct chapter selected in the left pane.
