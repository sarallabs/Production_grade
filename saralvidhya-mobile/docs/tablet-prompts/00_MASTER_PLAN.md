# MASTER IMPLEMENTATION PLAN — Tablet Layouts

Project: `saralvidhya-mobile` (Expo Router, React Native 0.86, TypeScript)
Goal: Phones keep the exact current UI. Tablets (>= 768 dp wide) get a tablet-optimised UI.

## Decisions (defaults, change here if needed)
- Breakpoint: `TABLET_MIN_WIDTH = 768` dp, using live `useWindowDimensions()`.
- Orientation: tablets may rotate; phones stay portrait (via `expo-screen-orientation`, prompt 10).
- Tablet navigation: left side rail. Phone navigation: bottom tabs (unchanged).
- Max content width on tablet: 1100 dp, centered.

## Global rules (every prompt must follow)
1. **Phone path is frozen.** When `isTablet === false`, behaviour and visuals must be identical to before. Do not edit phone styles.
2. Prefer new `*.tablet.tsx` components or `isTablet` branches. Do not duplicate services/contexts/data logic.
3. Use the shared hook `useDeviceLayout()` (created in prompt 01). Do not call `Dimensions.get` directly.
4. Keep the existing theme (`useAppTheme`, `constants/theme.ts`). No hardcoded new palettes.
5. Touch targets >= 48 dp on tablet. Larger type scale on tablet.
6. No new dependencies, except `expo-screen-orientation` in prompt 10.
7. Do not remove existing comments or docstrings.

## Execution order
Run strictly one after another. After each prompt: run the QA checklist below, then ask the user to approve before continuing.

| Step | File | Depends on |
|---|---|---|
| 1 | `01_foundation.md` | – |
| 2 | `02_navigation_shell.md` | 01 |
| 3 | `03_landing_and_auth.md` | 01 |
| 4 | `04_subjects_home.md` | 01, 02 |
| 5 | `05_study_table.md` | 01, 02 |
| 6 | `06_study_content_views.md` | 05 |
| 7 | `07_assessment_and_askbot.md` | 05 |
| 8 | `08_flashcards.md` | 01 |
| 9 | `09_leaderboard_profile.md` | 01, 02 |
| 10 | `10_orientation_polish_qa.md` | 01–09 |

## QA checklist (after every prompt)
- [x] `npx tsc --noEmit` passes with no new errors.
- [x] Viewport 390x844 (phone): screen looks identical to before.
- [ ] Viewport 800x1280 (tablet portrait): tablet layout shows, nothing overflows.
- [x] Viewport 1280x800 (tablet landscape): layout uses the width well.
- [ ] Dark and light themes both fine.
- [ ] Resizing the browser across 768 px switches layouts without a reload crash.

## Status tracker
- [x] 01 Foundation
- [x] 02 Navigation shell
- [x] 03 Landing and auth
- [x] 04 Subjects home
- [x] 05 Study table
- [x] 06 Study content views
- [x] 07 Assessment and AskBot
- [x] 08 Flashcards
- [x] 09 Leaderboard and profile
- [x] 10 Orientation, polish, QA
