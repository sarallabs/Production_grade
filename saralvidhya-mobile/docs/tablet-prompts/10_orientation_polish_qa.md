# Prompt 10 — Orientation, polish and final QA

## Goal
Allow tablet rotation, keep phones portrait, and run a full regression pass.

## Tasks
1. **Orientation**
   - In `app.json` change `"orientation"` from `"portrait"` to `"default"`.
   - Install `expo-screen-orientation` (`npx expo install expo-screen-orientation`).
   - In `src/app/_layout.tsx`, on mount: if the device is a phone (use `useDeviceLayout().isTablet` / `expo-device`), call `ScreenOrientation.lockAsync(PORTRAIT_UP)`; on tablets call `unlockAsync()`. Re-evaluate when the window size changes (split-screen).
2. **Splash/startup:** make sure the splash stays visible until the first layout measurement, so there is no phone-to-tablet flash.
3. **Polish pass:** consistent spacing scale, no text clipping, safe areas respected in landscape (notch/gesture bars), scroll indicators OK.
4. **Edge cases:** Android split-screen / floating window below 768 dp should show the phone UI; foldables switching between folded/unfolded should swap layouts live.
5. **Docs:** update `README.md` with a short "Tablet support" section (breakpoint, hook, how to add tablet layouts).

## Full QA matrix
Test every screen at: 390x844, 600x960 (large phone/small tablet), 800x1280, 1280x800.
- [ ] Landing, login, onboarding, persona, questionnaire
- [ ] Subjects home and subjects list
- [ ] Study table: every mode (reader, videos, mindmap, podcasts, PYQ, assessment, flashcards, AskBot)
- [ ] Leaderboard, profile
- [ ] Dark and light themes
- [ ] Offline banner still shows correctly
- [ ] `npx tsc --noEmit` and `npx expo lint` clean

## Build note
Orientation config and the new package require a new native build (`SaralVidhya.apk` must be rebuilt). Hot reload alone will not apply them.

## Acceptance
- Phones: portrait only, UI identical to the original.
- Tablets: rotate freely, all screens usable in both orientations.
