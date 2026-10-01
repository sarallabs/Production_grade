# SaralVidhya — Production Platform

Multi-university learning platform built for GCP.

## Structure

```
saralvidhya-production/
├── frontend/     React + Vite app (Firebase Hosting)
├── backend/      Node.js + Express API (Cloud Run)
└── infra/        GCP infrastructure configs
```

## Universities (tenants)
- ANGRAU
- NEB Nepal
- Master Minds
- CBSE
- Manuu
- _(add more via config — no code changes needed)_

## Content Schema (GCS)
Every chapter follows this exact structure — no exceptions:
```
{university}/{subject}/chapter_{nn}/metadata.json
{university}/{subject}/chapter_{nn}/{level}/summary.md
{university}/{subject}/chapter_{nn}/{level}/flashcards.json
{university}/{subject}/chapter_{nn}/{level}/mindmap.json
{university}/{subject}/chapter_{nn}/{level}/quiz.json
{university}/{subject}/chapter_{nn}/{level}/podcast.mp3
```
`{level}` = beginner | intermediate | advanced

## Setup
- Frontend: `cd frontend && npm install && npm run dev`
- Backend:  `cd backend && npm install && npm run dev`
