# Prompt 04 — Subjects home

## Goal
Multi-column subject grid on tablets.

## Files
- `src/app/(tabs)/index.tsx`
- `src/app/subjects/index.tsx`
- `src/components/study/SubjectUnitCard.tsx`
- `src/components/study/CourseOverviewCard.tsx`
- `src/components/study/EntomologyMenuCard.tsx`

## Tablet design
- Subject/course cards in a grid: `columns` from `useDeviceLayout()` (2 portrait, 3 landscape).
- Header (greeting/progress) spans the full width above the grid.
- Cards keep the same content; allow slightly larger padding/typography on tablet.
- Content centered with `ResponsiveContainer` (max 1100).

## Tasks
1. Replace single-column `ScrollView` lists with `FlatList` using `numColumns={columns}` (set `key={columns}` so it re-renders when columns change) or a flex-wrap grid, only when `isTablet`. Keep the phone list code path as is.
2. Card widths must be computed from the container width and gap, not hardcoded.
3. Keep press handlers, navigation targets (`/study?subjectId=...`), and data loading as is.

## Do NOT change
`contentService`, manifest loading, route params.

## Acceptance
- 390 px: identical single-column list.
- 800 px: 2 columns; 1280 px: 3 columns; equal card heights per row; no overflow.
- Tapping a card opens the same study route as before.
