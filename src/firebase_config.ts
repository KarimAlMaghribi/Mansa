import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserSessionPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { GoogleAuthProvider } from "firebase/auth";
import firebase from "firebase/compat";


const firebaseConfig = {
    apiKey: process.env.REACT_APP_API_KEY,
    authDomain: process.env.REACT_APP_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_PROJECT_ID,
    storageBucket: process.env.REACT_APP_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_APP_ID,
    measurementId:  process.env.REACT_APP_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);



export const auth = getAuth(app);

setPersistence(auth, browserSessionPersistence)
    .then(() => {
        console.log("Persistence auf SESSION gesetzt.");
    })
    .catch((error) => {
        console.error("Fehler beim Setzen der Persistence:", error);
    });

export const db = getFirestore(app);
export const googleAuthProvider = new GoogleAuthProvider();

