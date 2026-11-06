import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider, Auth } from "firebase/auth";
import { getStorage, FirebaseStorage } from "firebase/storage";

// Web app's Firebase configuration - loaded exclusively via environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY?.trim() || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN?.trim() || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID?.trim() || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET?.trim() || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID?.trim() || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID?.trim() || '',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID?.trim() || '',
};

let app: FirebaseApp | undefined;
let db: Firestore | undefined;
let auth: Auth | undefined;
let googleProvider: GoogleAuthProvider | undefined;
let storage: FirebaseStorage | undefined;

const hasValidConfig = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.apiKey.length > 5 &&
  firebaseConfig.projectId
);

if (hasValidConfig) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
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
  console.warn("[Firebase] API key/Project ID missing. Operating in offline/local storage fallback mode.");
}

export { app, db, auth, googleProvider, storage, hasValidConfig };

