# Prompt 03 — Landing and Auth screens

## Goal
Tablet layouts for the entry flow. Phone layouts untouched.

## Files
- `src/app/landing.tsx`
- `src/app/(auth)/login.tsx`
- `src/app/(auth)/onboarding.tsx`
- `src/app/(auth)/persona.tsx`
- `src/app/(auth)/questionnaire.tsx`

## Tablet design
- **Landing:** hero content centered, max width ~700, larger logo and title (use `TabletFontSize`).
- **Login:** two-pane split. Left ~45%: brand panel (logo, tagline, illustration/gradient using the existing theme). Right ~55%: the existing form, centered, max width ~480.
- **Onboarding:** slides become a centered card (max width ~720) with larger imagery and text; keep the existing pager/next logic.
- **Persona:** persona cards in a 2-column grid (3 in landscape >= 1024).
- **Questionnaire:** centered card (max width ~720); answer options in 2 columns where there are 4+ options. Keep existing state and validation.

## Tasks
1. Wrap each screen's content with `ResponsiveContainer` / `isTablet` branches. Do not alter handlers, validation, or navigation.
2. Extract the existing form JSX into a local component if needed so phone and tablet render the same form.
3. Make sure the keyboard does not cover inputs on tablet (reuse existing KeyboardAvoidingView approach).

## Do NOT change
Auth context, API calls, route names, text content/translations.

## Acceptance
- Login, onboarding, persona, questionnaire complete end to end at 390 and 800 px.
- Landscape 1280x800 looks balanced, nothing stretched edge to edge.
