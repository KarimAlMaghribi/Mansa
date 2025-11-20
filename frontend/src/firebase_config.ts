import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
};

// Initialisiere Firebase
const app = initializeApp(firebaseConfig);

const analyticsMeasurementId = process.env.REACT_APP_FIREBASE_MEASUREMENT_ID;
const analyticsAllowedHosts = (process.env.REACT_APP_ANALYTICS_ALLOWED_HOSTS || "")
  .split(",")
  .map((host) => host.trim())
  .filter(Boolean);

const isApprovedAnalyticsHost =
  typeof window !== "undefined" &&
  analyticsAllowedHosts.some((host) => host === window.location.host);

if (analyticsMeasurementId && isApprovedAnalyticsHost) {
  import("firebase/analytics")
    .then(({ getAnalytics }) => getAnalytics(app))
    .catch(() => {
      // Ignore analytics initialization errors to avoid impacting the app in non-critical environments
    });
}

// Exporte für Nutzung im Projekt
export const auth = getAuth(app);
export const googleAuthProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);
