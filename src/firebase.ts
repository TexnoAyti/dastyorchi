import { getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import firebaseConfigFallback from "../firebase-applet-config.json";

const configuredProjectId =
  import.meta.env.VITE_FIREBASE_PROJECT_ID ||
  firebaseConfigFallback.projectId;

const firebaseConfig = {
  apiKey:
    import.meta.env.VITE_FIREBASE_API_KEY ||
    firebaseConfigFallback.apiKey,

  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ||
    firebaseConfigFallback.authDomain,

  projectId:
    configuredProjectId,

  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ||
    firebaseConfigFallback.storageBucket,

  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ||
    firebaseConfigFallback.messagingSenderId,

  appId:
    import.meta.env.VITE_FIREBASE_APP_ID ||
    firebaseConfigFallback.appId,
};

const existingApp = getApps()[0];

if (
  existingApp &&
  existingApp.options.projectId !== firebaseConfig.projectId
) {
  throw new Error(
    `Firebase project mismatch: existing=${existingApp.options.projectId}, configured=${firebaseConfig.projectId}`
  );
}

export const app =
  existingApp || initializeApp(firebaseConfig);

console.log(`[Firebase Client] projectId=${app.options.projectId}`);

export const auth = getAuth(app);
export const db = getFirestore(app);

console.log(`[Firestore] app projectId=${app.options.projectId}`);

export const storage = getStorage(app);

export default app;
