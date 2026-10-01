# Upload Audio Files to Firebase Storage

Follow these steps to upload your 73 audio files to Firebase Storage:

## Prerequisites

1. **Node.js** already installed ✓
2. **Firebase project** (`ekam-expert-prod`) already set up ✓

## Instructions

### 1. Get Firebase Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `ekam-expert-prod`
3. Click **⚙️ Project Settings** (top left)
4. Go to **Service Accounts** tab
5. Click **Generate New Private Key** button
6. A JSON file will download automatically
7. **Save it in your project root as `firebase-service-account.json`**

> ⚠️ **Keep this file secret!** Add it to `.gitignore` (already done)

### 2. Install Firebase Admin SDK

```powershell
npm install firebase-admin
```

### 3. Upload Audio Files

```powershell
node scripts/upload-audio-to-firebase.cjs
```

The script will:
- ✓ Connect to your Firebase Storage
- ✓ Upload all 73 audio files
- ✓ Preserve folder structure
- ✓ Set proper content types (audio/mpeg, etc.)
- ✓ Add caching headers (24 hours)

### 4. Verify in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select `ekam-expert-prod`
3. Go to **Storage**
4. You should see an `audio-resources/` folder with all your files

---

## Using Audio Files in Your App

Once uploaded, use the service in your components:

```tsx
import { getAudioStreamUrl } from '../services/firebaseAudioService';

export function AudioPlayer({ filePath }: { filePath: string }) {
  const [audioUrl, setAudioUrl] = useState<string>(null);

  useEffect(() => {
    getAudioStreamUrl(filePath).then(setAudioUrl);
  }, [filePath]);

  if (!audioUrl) return <div>Loading...</div>;

  return (
    <audio controls>
      <source src={audioUrl} type="audio/mpeg" />
      Your browser does not support the audio element.
    </audio>
  );
}
```

---

## Troubleshooting

### "firebase-service-account.json not found"
- Make sure you downloaded and saved the service account key correctly
- File should be in the project root: `C:\Users\Abhi\saralvidhya-mvp\firebase-service-account.json`

### "Permission denied" errors
- Make sure your Firebase Storage rules allow uploads
- Default rules should work, but check Firebase Console → Storage → Rules

### Upload is slow
- Normal! 73 files × ~10MB average = ~730MB total
- Uploads might take 10-20 minutes depending on internet speed

---

## After Upload

1. Update your audio components to use `firebaseAudioService`
2. Remove the old `googleDriveService` code
3. Deploy to Cloudflare: `npm run deploy:cloudflare`

---

## Cost

- **Storage**: ~$0.02/month for 878MB
- **Bandwidth**: ~$0.12 per GB downloaded
  - Example: 1000 streams × 5MB = $0.60/month

---

Questions? Check the Firebase Console logs for errors.
