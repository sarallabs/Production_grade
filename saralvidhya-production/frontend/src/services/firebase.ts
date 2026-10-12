import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getStorage } from "firebase/storage";
// import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyABrvUpwTyWMzHh0tipdUQylWVPMapbmOo',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'ekam-expert-prod.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'ekam-expert-prod',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'ekam-expert-prod.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '437936113983',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:437936113983:web:85cbc4db75cd294346ab8a',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-TD37QT1MX1',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Optional: Initialize Analytics (Uncomment if needed)
// const analytics = getAnalytics(app);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Firebase Storage
export const storage = getStorage(app);
