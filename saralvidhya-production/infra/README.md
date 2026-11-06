# GCP Infrastructure Notes

## Services Used

| Service | Purpose |
|---|---|
| Cloud Run | Backend API (auto-scales, scales to zero) |
| Google Cloud Storage | All content files (MP3, MD, JSON) |
| Cloud CDN | Fast delivery of GCS content worldwide |
| Firebase Hosting | Frontend React app |
| Firebase Auth | User authentication |
| Firestore | User profiles, progress, assessment scores |
| Secret Manager | API keys (Gemini, etc.) |

## GCS Bucket Structure

```
gs://saralvidhya-content/
└── {university}/
    └── {subject}/
        └── chapter_{nn}/
            ├── metadata.json
            ├── beginner/
            │   ├── summary.md
            │   ├── flashcards.json
            │   ├── mindmap.json
            │   ├── quiz.json
            │   └── podcast.mp3
            ├── intermediate/
            │   └── (same files)
            └── advanced/
                └── (same files)
```

## Cloud Run Deployment

```bash
# Build and push image
gcloud builds submit --tag gcr.io/PROJECT_ID/saralvidhya-backend

# Deploy to Cloud Run
gcloud run deploy saralvidhya-backend \
  --image gcr.io/PROJECT_ID/saralvidhya-backend \
  --platform managed \
  --region asia-south1 \
  --allow-unauthenticated \
  --set-env-vars FIREBASE_PROJECT_ID=xxx,GCS_BUCKET_NAME=saralvidhya-content \
  --set-secrets GEMINI_API_KEY=gemini-api-key:latest
```

## Firebase Hosting Deployment

```bash
cd frontend
npm run build
firebase deploy --only hosting
```

## Environment Variables (Cloud Run)

Set via Secret Manager — never hardcoded:
- `GEMINI_API_KEY` — from Secret Manager
- `FIREBASE_PROJECT_ID` — project ID
- `GCS_BUCKET_NAME` — `saralvidhya-content`
- `ALLOWED_ORIGIN` — Firebase Hosting URL

## Notes

- Cloud Run uses Application Default Credentials (ADC) automatically on GCP — no service account JSON file needed in production
- MP3 podcast streaming uses HTTP byte-range — works up to GCS's 5TB limit per object
- No Cloudflare — Firebase Hosting + Cloud CDN replaces it entirely
