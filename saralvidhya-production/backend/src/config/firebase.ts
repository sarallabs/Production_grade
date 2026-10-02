import admin from 'firebase-admin';

// Initialize Firebase Admin SDK once
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(), // uses GOOGLE_APPLICATION_CREDENTIALS env var
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
}

export const getAuth = () => admin.auth();
export const getFirestore = () => admin.firestore();
export default admin;
