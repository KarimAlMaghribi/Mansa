import { auth, googleAuthProvider } from '../firebase_config';
import { API_BASE_URL } from '../constants/api';
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

export const uploadProfileImage = async (uid: string, file: File): Promise<string | null> => {
    try {
        const formData = new FormData();
        formData.append('file', file);
        const resp = await fetch(`${API_BASE_URL}/api/userProfiles/uid/${uid}/image`, {
            method: 'POST',
            body: formData
        });
        if (resp.ok) {
            return `${API_BASE_URL}/api/userProfiles/uid/${uid}/image`;
        }
        return null;
    } catch (error) {
        console.error('Error uploading profile image:', error);
        return null;
    }
};

export const deleteProfileImage = async (uid: string): Promise<boolean> => {
    try {
        const resp = await fetch(`${API_BASE_URL}/api/userProfiles/uid/${uid}/image`, {
            method: 'DELETE'
        });
        return resp.ok;
    } catch (error) {
        console.error('Error deleting profile image:', error);
        return false;
    }
};

export const fetchProfileImage = async (uid: string): Promise<string | null> => {
    try {
        const resp = await fetch(`${API_BASE_URL}/api/userProfiles/uid/${uid}/image?t=${Date.now()}`);
        if (resp.status === 204 || !resp.ok) {
            return null;
        }
        const blob = await resp.blob();
        return URL.createObjectURL(blob);
    } catch (error) {
        console.error('Error fetching profile image:', error);
        return null;
    }
};
