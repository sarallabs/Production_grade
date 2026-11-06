# 🔐 CREDENTIALS_PRIVATE — SV-Medha Project

> ⚠️ **NEVER commit this folder to GitHub or any public repo.**
> Share ONLY via encrypted channels (WhatsApp, Signal, Google Drive private link, etc.)

---

## What's in here

### `saralvidhya-mvp/`

| File | Purpose |
|------|---------|
| `.env` | Main environment variables — Firebase config, API keys, GCP keys |
| `.env.local` | Local overrides (may differ per machine) |
| `.env.angrau` | Env config specific to ANGRAU deployment |
| `.env.example` | Template showing what keys are needed (safe to share) |
| `firebase-service-account.json` | 🔑 **Firebase Admin SDK** service account — gives full Firebase access |
| `.firebaserc` | Firebase project ID config |
| `firebase.json` | Firebase hosting/deploy config (not secret, but kept here for completeness) |

### `saralvidhya-medha/`

| File | Purpose |
|------|---------|
| `.env` | Environment variables for the medha app |
| `firebase-service-account.json` | 🔑 **Firebase Admin SDK** service account for medha |

---

## How to use (for collaborators)

1. Clone the repo from GitHub
2. Place these files back in their correct locations:
   - `CREDENTIALS_PRIVATE/saralvidhya-mvp/.env` → `saralvidhya-mvp/.env`
   - `CREDENTIALS_PRIVATE/saralvidhya-mvp/firebase-service-account.json` → `saralvidhya-mvp/firebase-service-account.json`
   - `CREDENTIALS_PRIVATE/saralvidhya-medha/.env` → `saralvidhya-medha/.env`
   - `CREDENTIALS_PRIVATE/saralvidhya-medha/firebase-service-account.json` → `saralvidhya-medha/firebase-service-account.json`
3. Run `npm install` in `saralvidhya-mvp/`
4. Run `npm run dev` to start

---

## ⚠️ Security Reminders

- The GCP API key that was previously hardcoded in tests should be **rotated** in Google Cloud Console
- These keys give access to live Firebase — treat like passwords
- Do NOT share via email or Slack DM
