// firebase_config.ts (Mock-Version)

import type { Auth, User, UserInfo, IdTokenResult, UserMetadata } from "firebase/auth";
import type { Firestore } from "firebase/firestore";

// --- Auth-Mock ---
// Eintrag für providerData
const mockProviderData: UserInfo = {
  providerId: "google.com",
  uid: "mock-provider-uid",
  displayName: null,
  email: "mock@example.com",
  phoneNumber: null,
  photoURL: null
};

// Vollständiges Mock-User-Objekt
const mockUser: User = {
  providerId: "google.com",       // erforderlich auf User
  uid: "mock-uid",
  email: "mock@example.com",
  displayName: null,
  emailVerified: false,
  isAnonymous: false,
  metadata: {} as UserMetadata,
  phoneNumber: null,
  photoURL: null,
  providerData: [mockProviderData],
  refreshToken: "mock-refresh-token",
  tenantId: null,

  delete: async () => {},
  getIdToken: async () => "mock-token",
  getIdTokenResult: async () => ({ token: "mock-token" } as IdTokenResult),
  reload: async () => {},
  toJSON: () => ({})
};

// Auth-Stub mit onAuthStateChanged
export const auth = {
  currentUser: mockUser,
  onAuthStateChanged: (callback: (user: User | null) => void) => {
    // simuliere Initial-Callback
    callback(mockUser);
    // Rückgabe einer "unsubscribe"-Funktion
    return () => {};
  }
} as unknown as Auth;

// Simulierter Google-Provider
export const googleAuthProvider = {
  providerId: "google.com"
};

// --- Firestore-Mock ---
export const db = {
  collection: (name: string) => ({
    doc: (id: string) => ({
      get: async () => ({ exists: false, data: () => null }),
      set: async (data: any) => console.log(`Mock set in ${name}/${id}:`, data),
      update: async (data: any) => console.log(`Mock update in ${name}/${id}:`, data),
      delete: async () => console.log(`Mock delete ${name}/${id}`)
    })
  })
} as unknown as Firestore;
