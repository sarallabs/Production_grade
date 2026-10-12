import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider, Auth } from "firebase/auth";
import { getStorage, FirebaseStorage } from "firebase/storage";

// Web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || '',
};

let app: FirebaseApp | undefined;
let db: Firestore | undefined;
let auth: Auth | undefined;
let googleProvider: GoogleAuthProvider | undefined;
let storage: FirebaseStorage | undefined;

const hasValidApiKey = Boolean(firebaseConfig.apiKey && firebaseConfig.apiKey.trim().length > 5);

if (hasValidApiKey) {
  try {
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    db = getFirestore(app);
    try {
      auth = getAuth(app);
      googleProvider = new GoogleAuthProvider();
    } catch (authErr) {
      console.warn("[Firebase] Auth initialization skipped:", authErr);
    }
    try {
      storage = getStorage(app);
    } catch (storageErr) {
      console.warn("[Firebase] Storage initialization skipped:", storageErr);
    }
  } catch (initErr) {
    console.warn("[Firebase] App initialization skipped/failed:", initErr);
  }
} else {
  console.warn("[Firebase] API key missing. Operating in offline/local storage fallback mode.");
}

export { app, db, auth, googleProvider, storage };
