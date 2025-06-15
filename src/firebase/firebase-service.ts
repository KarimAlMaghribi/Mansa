import { auth, googleAuthProvider } from '../firebase_config';
import {
    signInWithPopup,
    signOut,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,

} from "firebase/auth";

export const signInWithGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, googleAuthProvider);
        return result.user;
    } catch (error: any) {
        if (
            error.code !== 'auth/cancelled-popup-request' &&
            error.code !== 'auth/popup-closed-by-user'
        ) {
            console.error(error);
        }
        return null;
    }
};

export const signOutUser = async () => {
    try {
        const signOutObject = await signOut(auth);
        return signOutObject;
    } catch (error) {
        console.error(error);
        return null;
    }
};

export const signUpWithEmail = async (email: string, password: string) => {
    try {
        await createUserWithEmailAndPassword(auth, email, password);
        return false;
    } catch (error) {
        console.error(error);
        return true;
    }

};

export const signInWithEmail = async (email: string, password: string) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return userCredential.user;
    } catch (error) {
        console.error(error);
        return null;
    }
};
