# Prompt 06 — Study content views

## Goal
Make each content view look good in the tablet detail pane.

## Files
- `src/components/study/MarkdownReader.tsx`
- `src/components/study/ReadAloudBar.tsx`
- `src/components/study/VideosView.tsx`
- `src/components/study/MindmapView.tsx`
- `src/components/study/PodcastsView.tsx`
- `src/components/study/PYQView.tsx`

## Tablet design
- **MarkdownReader:** readable line length (max ~760 dp, centered), body font ~18, headings scaled. ReadAloudBar docked at the bottom of the pane, wider with larger controls.
- **VideosView:** player on top (16:9, max ~900 dp wide) and the video list below; in landscape, player left (~65%) and playlist right (~35%). Keep the YouTube player logic and watched-tracking untouched.
- **MindmapView:** use the full pane; larger node text; make sure pan/zoom still works.
- **PodcastsView:** episodes in a 2-column grid; player controls larger.
- **PYQView:** question cards in 2 columns when pane width >= 900, else 1.

## Tasks
1. Use `useDeviceLayout()` (or the pane width via `onLayout`) for sizing. Pane width matters more than window width here, since the detail pane is narrower than the screen.
2. Branch only styling/layout. No changes to data, audio/speech, or video progress logic.

## Do NOT change
`contentService`, `speechService`, `react-native-youtube-iframe` usage and the watched threshold logic.

## Acceptance
- Each view works in the detail pane at 800 and 1280 px, with no horizontal overflow.
- Phone views unchanged at 390 px.
- Video playback, read-aloud, mindmap pan/zoom still function.
