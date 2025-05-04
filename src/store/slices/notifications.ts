import {createAsyncThunk, createSlice} from "@reduxjs/toolkit";
import {FetchStatus} from "../../types/FetchStatus";
import {collection, onSnapshot} from "firebase/firestore";
import {db} from "../../firebase_config";
import {FirestoreCollectionEnum} from "../../enums/FirestoreCollectionEnum";
import {FetchStatusEnum} from "../../enums/FetchStatus.enum";

enum ActionTypes {
    FETCH_NOTIFICATIONS = "notifications/fetchNotifications",
}

export interface NotificationsState {
    items: string[];
    status: FetchStatus;
    error?: string;
}

const initialState: NotificationsState = {
    items: [],
    status: FetchStatusEnum.IDLE,
    error: undefined
};

export const fetchNotifications = createAsyncThunk(
    ActionTypes.FETCH_NOTIFICATIONS,
    async (_, thunkAPI) => {
        // try {
        //     const riskTypesCollection = collection(db, FirestoreCollectionEnum.RISK_TYPES);
        //
        //     return new Promise<string[]>((resolve, reject) => {
        //         const unsubscribe = onSnapshot(
        //             riskTypesCollection,
        //             (snapshot) => {
        //                 const riskTypes = snapshot.docs.map((doc) => doc.data().name as string);
        //                 const uniqueRiskTypes = Array.from(new Set(riskTypes));
        //                 resolve(uniqueRiskTypes); // Rückgabe der aktuellen Typen
        //             },
        //             (error) => {
        //                 console.error("Error fetching risk-overview types:", error);
        //                 reject(error);
        //             }
        //         );
        //
        //         return () => unsubscribe();
        //     });
        // } catch (error) {
        //     console.error("Error in fetchRiskTypesWithListener:", error);
        //     throw error;
        // }
        return ["Notification 1", "Notification 2", "Notification 3"];
    }
);

export const myBisSlice = createSlice({
    name: "notifications",
    initialState: initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchNotifications.pending, (state) => {
                state.status = FetchStatusEnum.PENDING;
                state.error = undefined;
            })
            .addCase(fetchNotifications.fulfilled, (state, action) => {
                state.items = action.payload;
                state.status = FetchStatusEnum.SUCCEEDED;
            })
            .addCase(fetchNotifications.rejected, (state, action) => {
                state.items = [];
                state.error = action.payload as string;
                state.status = FetchStatusEnum.FAILED;
            });
    }
});

export const selectNotifications = (state: { notifications: NotificationsState }) => state.notifications.items;
export const selectNotificationCount = (state: {notifications: NotificationsState }) => state.notifications.items.length;

export const {  } = myBisSlice.actions;

export default myBisSlice.reducer;
