# Prompt 02 — Navigation shell (bottom tabs → side rail on tablet)

## Goal
On tablets, replace the bottom tab bar with a left navigation rail. Phones keep the bottom tabs exactly as they are.

## Read first
`00_MASTER_PLAN.md`, `src/app/(tabs)/_layout.tsx`, `src/hooks/use-device-layout.ts` (from prompt 01).

## Tasks
1. In `src/app/(tabs)/_layout.tsx`, keep the existing `<Tabs>` and 4 screens (index, study, leaderboard, profile).
2. When `isTablet`:
   - Hide the default bottom bar (`tabBarStyle: { display: 'none' }`).
   - Render a custom `SideRail` on the left (width ~96 dp collapsed, icons + labels stacked; ~220 dp in landscape with icon + label side by side).
   - Highlight the active route; use the same Ionicons and colors already used in the file.
3. Create `src/components/navigation/SideRail.tsx` with the logo/app name at the top, the 4 nav items, and the theme toggle/user avatar at the bottom if that exists elsewhere in the app (reuse its logic, don't invent new state).
4. Use `useRouter`/`usePathname` (expo-router) for navigation and active state.
5. Phone (`!isTablet`): zero changes to `tabBarStyle`, icons or labels.

## Do NOT change
The 4 tab screen files themselves. Tab names/routes. Auth logic.

## Acceptance
- 390 px: bottom tabs, identical to before.
- 800 px and 1280 px: side rail shown, no bottom bar, navigation works for all 4 tabs, active item highlighted.
- Resizing across 768 px swaps the navigation without losing the current route.
