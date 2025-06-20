import { auth, googleAuthProvider, storage } from '../firebase_config';
import {
    signInWithPopup,
    signOut,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,

} from "firebase/auth";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

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

export const uploadProfileImage = async (uid: string, file: File): Promise<string | null> => {
    try {
        const imageRef = ref(storage, `profile_images/${uid}`);
        await uploadBytes(imageRef, file);
        const url = await getDownloadURL(imageRef);
        return url;
    } catch (error) {
        console.error('Error uploading profile image:', error);
        return null;
    }
};

export const deleteProfileImage = async (uid: string): Promise<boolean> => {
    try {
        const imageRef = ref(storage, `profile_images/${uid}`);
        await deleteObject(imageRef);
        return true;
    } catch (error) {
        console.error('Error deleting profile image:', error);
        return false;
    }
};
