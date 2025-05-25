import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Dein Firebase Config-Objekt
const firebaseConfig = {
  apiKey: "AIzaSyBxna9F7QMNol-kwDzhg5_BRrtKHDUPNQI",
  authDomain: "mansa-8fa80.firebaseapp.com",
  projectId: "mansa-8fa80",
  storageBucket: "mansa-8fa80.appspot.com",
  messagingSenderId: "378871440542",
  appId: "1:378871440542:web:21f0b3d374714f727e078f",
  measurementId: "G-0CNESYXRBS"
};

// Initialisiere Firebase
const app = initializeApp(firebaseConfig);
getAnalytics(app); // optional

// Exporte für Nutzung im Projekt
export const auth = getAuth(app);
export const googleAuthProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
