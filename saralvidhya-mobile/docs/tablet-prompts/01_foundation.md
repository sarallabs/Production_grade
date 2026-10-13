# Prompt 01 — Foundation (device layout hook + helpers)

## Goal
Create the shared building blocks every tablet screen will use. No screen changes yet.

## Read first
`00_MASTER_PLAN.md` (global rules), `src/constants/theme.ts`, `src/hooks/use-theme.ts`.

## Tasks
1. Create `src/hooks/use-device-layout.ts` exporting `useDeviceLayout()` that returns:
   `{ width, height, isTablet, isLandscape, columns, contentMaxWidth, scale }`
   - `isTablet = width >= TABLET_MIN_WIDTH` (768).
   - `columns`: 1 below 768, 2 for 768–1023, 3 for >= 1024.
   - `contentMaxWidth`: `undefined` on phone, 1100 on tablet.
   - `scale`: 1 on phone, 1.15 on tablet (for font/spacing multipliers).
   - Must use `useWindowDimensions()` so it updates on rotation/resize.
2. Add to `src/constants/theme.ts`: `TABLET_MIN_WIDTH`, `TABLET_CONTENT_MAX_WIDTH`, `TabletSpacing` (larger spacing scale), `TabletFontSize`. Do not modify existing exports.
3. Create `src/components/common/ResponsiveContainer.tsx`: on tablet, centers children with `maxWidth: contentMaxWidth` and horizontal padding; on phone renders children with no wrapper styling (pass-through `View` with `flex: 1`).
4. Create `src/components/common/MasterDetail.tsx`: props `master`, `detail`, `masterWidth` (default 340). On tablet renders them side by side with a divider; on phone renders only `master` (the screen decides navigation for detail).

## Do NOT change
Any existing screen or component.

## Acceptance
- Hook returns correct values at 390, 800, 1280 px widths (verify by temporarily logging, then remove the logs).
- `npx tsc --noEmit` clean.
- App looks and behaves exactly the same as before.
