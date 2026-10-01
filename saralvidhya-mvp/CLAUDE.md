# saralvidhya-mvp

## Brain-first rule
Before exploring any files for a task, always call `projectbrain_query` first with the task description. Only read specific files after the brain returns candidates. Never start with Glob or Grep to orient yourself — the brain already has the full index.

well not strictly of a file can be searched directly then there is no use of projectbrain_query so use it only when needed

For a known file, use `projectbrain_get_context` to get its imports and dependents in one call instead of tracing them manually.

## Stack
- React + TypeScript (Vite)
- Firebase (auth, firestore, storage)
- Gemini AI for the AskBot feature
- Google TTS + STT for audio
- Express server at `server/index.js` for local resource editing

## Project structure
- `src/pages/` — all route-level pages
- `src/components/` — shared UI components
- `src/services/` — Firebase, Gemini, TTS, Drive integrations
- `src/data/` — static data and content repository
- `src/utils/` — analytics, credentials, parsers
- `src/hooks/` — custom React hooks
- `scripts/` — build and upload utilities
- `server/` — local Express API for resource file management
- `public/` — static content served by Vite
