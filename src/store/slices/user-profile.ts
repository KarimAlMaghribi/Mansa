import {createAsyncThunk, createSlice} from "@reduxjs/toolkit";
import {auth, db} from "../../firebase_config";
import {addDoc, collection, getDocs, query, updateDoc, where} from "firebase/firestore";
import {FetchStatus} from "../../types/FetchStatus";
import {FetchStatusEnum} from "../../enums/FetchStatus.enum";
import {FirestoreCollectionEnum} from "../../enums/FirestoreCollectionEnum";

enum ActionTypes {
    FETCH_PROFILE = "userProfile/fetchProfile",
    ADD_PROFILE = "userProfile/addProfile",
    UPDATE_PROFILE = "userProfile/updateProfile",
}

export interface Address {
    country: string;
    street: string;
    number: string;
    city: string;
    zip: string;
}

export interface ProfileInformation {
    name: string;
    gender?: string;
    address?: Address;
    birthdate?: string;
    birthplace?: Address;
    email: string;
    phone?: string;
    image?: any;
    socialEconomics?: {
        income?: number;
        occupation?: string;
        education?: string;
    };
    receiveUpdates?: boolean;
}

export interface UserProfile {
    id: string | null;
    profile: ProfileInformation;
    createdAt?: string;
    updatedAt?: string;
    error?: string;
    status?: FetchStatus;
}

const initialState: UserProfile = {
    id: null,
    profile: {
        name: "",
        email: ""
    },
    error: undefined,
    status: FetchStatusEnum.IDLE
};

export const fetchUserProfile = createAsyncThunk(
    ActionTypes.FETCH_PROFILE,
    async (_, {rejectWithValue}) => {
        try {
            const user = auth.currentUser;

            if (!user) {
                return rejectWithValue("User not authenticated");
            }

            const userProfilesCollection = collection(db, FirestoreCollectionEnum.USER_PROFILES);
            const userProfileQuery = query(userProfilesCollection, where("uid", "==", user.uid));

            const userProfileDocs = await getDocs(userProfileQuery);

            if (userProfileDocs.empty) {
                return rejectWithValue("Profile not found");
            }

            const userProfileDoc = userProfileDocs.docs[0];
            return userProfileDoc.data();
        } catch (error) {
            console.error("Error fetching profile:", error);
            return rejectWithValue(error);
        }
    }
);

export const addProfile = createAsyncThunk(
    ActionTypes.ADD_PROFILE,
    async (profile: ProfileInformation, {rejectWithValue}) => {
        try {
            const user = auth.currentUser;

            if (!user) {
                throw new Error("User not authenticated");
            }

            const userProfilesCollection = collection(db, FirestoreCollectionEnum.USER_PROFILES);
            await addDoc(userProfilesCollection, {
                id: user.uid,
                profile: profile,
                createdAt: new Date().toISOString(),
                uid: user.uid
            });

            return {
                id: user.uid,
                profile: profile,
                createdAt: new Date().toISOString()
            };
        } catch (error) {
            console.error("Error adding document: ", error);
            return rejectWithValue(error);
        }
    }
)

export const updateProfile = createAsyncThunk(
    ActionTypes.UPDATE_PROFILE,
    async (profile: ProfileInformation, {rejectWithValue}) => {
        try {
            const user = auth.currentUser;

            if (!user) {
                return rejectWithValue("User not authenticated");
            }

            const userProfilesCollection = collection(db, FirestoreCollectionEnum.USER_PROFILES);
            const userProfileQuery = query(userProfilesCollection, where("uid", "==", user.uid));

            const userProfileDocs = await getDocs(userProfileQuery);

            if (userProfileDocs.empty) {
                return rejectWithValue("Risk not found");
            }

            const userProfileDocRef = userProfileDocs.docs[0].ref;
            await updateDoc(userProfileDocRef, {
                    id: user.uid,
                    profile: profile,
                    uid: user.uid,
                    updatedAt: new Date().toISOString()
                }
            );

            return {
                id: user.uid,
                profile: profile,
                updatedAt: new Date().toISOString()
            };
        } catch (error) {
            console.error("Error updating risk-overview:", error);
            return rejectWithValue(error);
        }
    }
);

export const userProfileSlice = createSlice({
        name: "userProfile",
        initialState: initialState,
        reducers: {},
        extraReducers: (builder) => {
            builder
                .addCase(addProfile.pending, (state) => {
                    state.profile = {name: "", email: ""};
                    state.error = undefined;
                    state.status = FetchStatusEnum.PENDING;
                })
                .addCase(addProfile.fulfilled, (state, action) => {
                    state.id = action.payload.id;
                    state.profile = action.payload.profile;
                    state.createdAt = action.payload.createdAt;
                    state.status = FetchStatusEnum.SUCCEEDED;
                })
                .addCase(addProfile.rejected, (state, action) => {
                    state.profile = {name: "", email: ""};
                    state.error = action.payload as string;
                    state.status = FetchStatusEnum.FAILED;
                })
                .addCase(updateProfile.pending, (state) => {
                    state.error = undefined;
                    state.status = FetchStatusEnum.PENDING;
                })
                .addCase(updateProfile.fulfilled, (state, action) => {
                    state.profile = action.payload.profile;
                    state.updatedAt = action.payload.updatedAt;
                    state.status = FetchStatusEnum.SUCCEEDED;
                })
                .addCase(updateProfile.rejected, (state, action) => {
                    state.profile = {name: "", email: ""};
                    state.error = action.payload as string;
                    state.status = FetchStatusEnum.FAILED;
                })
                .addCase(fetchUserProfile.pending, (state) => {
                    state.profile = {name: "", email: ""};
                    state.error = undefined;
                    state.status = FetchStatusEnum.PENDING;
                })
                .addCase(fetchUserProfile.fulfilled, (state, action) => {
                    state.profile = action.payload.profile;
                    state.id = action.payload.id;
                    state.createdAt = action.payload.createdAt;
                    state.updatedAt = action.payload.updatedAt ? action.payload.updatedAt : undefined;
                    state.status = FetchStatusEnum.SUCCEEDED;
                })
                .addCase(fetchUserProfile.rejected, (state, action) => {
                    state.profile = {name: "", email: ""};
                    state.error = action.payload as string;
                    state.status = FetchStatusEnum.FAILED;
                })
        }
    }
);

export const selectName = (state: { userProfile: UserProfile }) => state?.userProfile?.profile?.name;
export const selectMail = (state: { userProfile: UserProfile }) => state?.userProfile?.profile?.email;
export const selectStatus = (state: { userProfile: UserProfile }) => state?.userProfile?.status;
export const selectUserProfile = (state: { userProfile: UserProfile }) => state?.userProfile;
export const selectProfileInformation = (state: { userProfile: UserProfile }) => state.userProfile.profile;

export default userProfileSlice.reducer;
