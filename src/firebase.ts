import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore, getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import firebaseConfigFallback from "../firebase-applet-config.json";

// Startup consistency validation (Requirement 6)
const rawConfigProjectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
if (rawConfigProjectId && rawConfigProjectId !== "dastyorchi") {
  console.warn(
    `[Firebase] Configuration Warning: VITE_FIREBASE_PROJECT_ID is "${rawConfigProjectId}", expected "dastyorchi". Authentication or database operations may fail.`
  );
} else if (!rawConfigProjectId) {
  console.warn(
    '[Firebase] Configuration Warning: VITE_FIREBASE_PROJECT_ID is not set in environment. Falling back to default project "dastyorchi".'
  );
}

const resolvedProjectId = rawConfigProjectId || firebaseConfigFallback.projectId || "dastyorchi";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfigFallback.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || `${resolvedProjectId}.firebaseapp.com`,
  projectId: resolvedProjectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || `${resolvedProjectId}.firebasestorage.app`,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigFallback.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfigFallback.appId,
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);

// Initialize Firestore with long-polling to prevent WebSocket stream assertion crashes in sandboxed iframe environments
let dbInstance;
try {
  dbInstance = initializeFirestore(app, {
    experimentalForceLongPolling: true,
  });
} catch {
  dbInstance = getFirestore(app);
}

export const db = dbInstance;
export const storage = getStorage(app);

export default app;
