# Prompt 09 — Leaderboard and Profile

## Goal
Use tablet width well on the two remaining tab screens.

## Files
- `src/app/(tabs)/leaderboard.tsx`
- `src/app/(tabs)/profile.tsx`

## Tablet design
- **Leaderboard:** top-3 podium panel on the left (or top in portrait), full ranked list on the right. List rows wider with larger avatars/text; current user row highlighted.
- **Profile:** two columns. Left: avatar, name, persona, key stats. Right: settings/preferences, theme toggle, logout. Centered with max width ~1000.

## Tasks
1. Add `isTablet` branches for layout only. Reuse existing data and handlers (logout, theme toggle, etc.).
2. Ensure scroll areas work independently per column on tablet.

## Do NOT change
Auth context, leaderboard data fetching, persisted settings.

## Acceptance
- 390 px unchanged. 800/1280 px: two-column layout, no stretched rows, logout and theme toggle still work.
