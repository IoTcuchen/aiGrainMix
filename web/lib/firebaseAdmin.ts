import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { Firestore, getFirestore } from 'firebase-admin/firestore';

type FirebaseConfig = {
  projectId: string;
  clientEmail: string;
  privateKey: string;
};

let cachedFirestore: Firestore | null = null;

const getConfig = (): FirebaseConfig | null => {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process
    .env
    .FIREBASE_PRIVATE_KEY
    ?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    return null;
  }

  return { projectId, clientEmail, privateKey };
};

const initApp = () => {
  if (cachedFirestore) return cachedFirestore;
  const config = getConfig();
  if (!config) return null;

  if (!getApps().length) {
    initializeApp({
      credential: cert(config),
      projectId: config.projectId,
    });
  }

  cachedFirestore = getFirestore();
  return cachedFirestore;
};

export const getFirebaseFirestore = (): Firestore | null => {
  return cachedFirestore ?? initApp();
};

export const isFirestoreEnabled = (): boolean => {
  return Boolean(getFirebaseFirestore());
};
