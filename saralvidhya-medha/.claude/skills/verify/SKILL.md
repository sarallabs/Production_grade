---
name: verify
description: Build, launch, and drive this Vite/React app headlessly to verify UI changes at the browser surface.
---

# Verifying saralvidhya-moocs changes

## Launch
- Dev server: `npm run dev` (background, no output pipe — piping through `head` kills it via SIGPIPE). Serves at http://localhost:5173.
- Build check: `npm run build` (also regenerates `public/large-files-manifest.json` + `dist/` copies — expected diff noise).

## Headless browser
- Playwright is NOT a project dep, but browsers are cached at `%LOCALAPPDATA%/ms-playwright` (chromium-1228). Install `playwright` in the session scratchpad (`npm init -y && npm i playwright`) and drive from there — no browser download needed.

## Gates to seed before the app boots (page.addInitScript)
```js
localStorage.setItem('app_authenticated', 'true');          // AuthGuard
localStorage.setItem('username', 'verifier');               // ProtectedRoute onboarding
localStorage.setItem('saral_student_profile', '{}');        // profile gate
localStorage.setItem('questionnaire_completed', 'true');    // questionnaire gate
localStorage.setItem('registered_<subjectId>', 'true');     // StudyTable payment gate
sessionStorage.setItem('sv_moocs_mode', 'true');            // MOOC mode (App defaults it true anyway)
```
- Guided-flow progress lives in `localStorage['sv_guided_progress']` as `{ "<subjectId>_<chapter>": ToolId[] }` (e.g. `{ management_1: ["videos","flashcards"] }`). A chapter counts complete once it includes `"popquiz"`.

## Content
- Subjects come from `public/generated_resources/manifest.json`. Known ids: `management` (2 chapters), `anu_physics` (1), `anu_characterization` (1).
- Study page URL (all query-string, no path params):
  `/study-table?className=ANU&subjectName=Management&sId=management&chapter=1&chapterName=<title-cased name>&persona=beginner[&tool=<ToolId>]`

## Gotchas
- Dev-only pre-existing pageerror: `Cannot convert a Symbol value to a number` from `src/context/FocusModeContext.tsx:23` × react-refresh proxy. Ignore; not present in prod builds.
- Locked `?tool=`/`?chapter=` values are bounced by effects a moment after load — wait ~500ms before reading the URL.
- Test responsive at 1280 / 768 / 375; the MOOC nav has breakpoints at 992/900/768/576.
