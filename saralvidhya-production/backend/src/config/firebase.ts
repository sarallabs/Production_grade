import admin from 'firebase-admin';

// Initialize Firebase Admin SDK once
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
}

export const getAuth = (): ReturnType<typeof admin.auth> => admin.auth();
export const getFirestore = (): ReturnType<typeof admin.firestore> => admin.firestore();
export default admin;
