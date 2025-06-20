import {createAsyncThunk, createSlice} from "@reduxjs/toolkit";
import {Risk} from "../../models/Risk";
import {addDoc, collection, deleteDoc, getDocs, query, updateDoc, where} from "firebase/firestore";
import {FetchStatus} from "../../types/FetchStatus";
import {FetchStatusEnum} from "../../enums/FetchStatus.enum";
import {auth, db} from "../../firebase_config";
import {FirestoreCollectionEnum} from "../../enums/FirestoreCollectionEnum";

enum ActionTypes {
    FETCH_MY_RISKS = "myRisks/fetchMyRisks",
    ADD_MY_RISK = "myRisks/addRisk",
    DELETE_MY_RISK = "myRisks/deleteRisk",
    UPDATE_MY_RISK = "myRisks/updateRisk"
}

export interface MyRisksState {
    risks: Risk[];
    error?: string;
    status: FetchStatus;
}

const initialState: MyRisksState = {
    risks: [],
    error: undefined,
    status: FetchStatusEnum.IDLE
};

export const fetchMyRisks = createAsyncThunk(
    ActionTypes.FETCH_MY_RISKS,
    async (_, {rejectWithValue}) => {
        try {
            const user = auth.currentUser;

            if (!user) {
                return rejectWithValue("User not authenticated");
            }

            const risksCollection = collection(db, FirestoreCollectionEnum.MY_RISKS);
            const risksQuery = query(risksCollection, where("uid", "==", user.uid));
            const riskDocs = await getDocs(risksQuery);

            const risks = riskDocs.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Risk[];

            return risks;
        } catch (error) {
            console.error("Error fetching risks: ", error);
            return rejectWithValue("Failed to fetch risks");
        }
    }
);

export const addMyRisk = createAsyncThunk(
    ActionTypes.ADD_MY_RISK,
    async (newRisk: Omit<Risk, "id">, {rejectWithValue}) => {
        try {
            const user = auth.currentUser;
            if (!user) {
                return rejectWithValue("User not authenticated");
            }

            const myRisksCollection = collection(db, FirestoreCollectionEnum.MY_RISKS);
            const docRef = await addDoc(myRisksCollection, {
                ...newRisk,
                uid: user.uid,
                createdAt: new Date().toISOString()
            });

            return {id: docRef.id, ...newRisk} as Risk;
        } catch (error) {
            console.error("Error adding myRisk: ", error);
            return rejectWithValue(error);
        }
    }
);

export const updateMyRisk = createAsyncThunk(
    ActionTypes.UPDATE_MY_RISK,
    async (risk: Risk, {rejectWithValue}) => {
        try {
            const user = auth.currentUser;

            if (!user) {
                return rejectWithValue("User not authenticated");
            }

            const risksCollection = collection(db, FirestoreCollectionEnum.MY_RISKS);

            const riskQuery = query(
                risksCollection,
                where("uid", "==", user.uid),
                where("id", "==", risk.id)
            );

            const riskDocs = await getDocs(riskQuery);

            if (riskDocs.empty) {
                return rejectWithValue("Risk not found");
            }

            const riskDocRef = riskDocs.docs[0].ref;

            await updateDoc(riskDocRef, {
                ...risk,
                updatedAt: new Date().toISOString()
            });

            console.log("Updated risk-overview", risk.id)

            return {...risk, updatedAt: new Date().toISOString()};
        } catch (error) {
            console.error("Error updating risk-overview:", error);
            return rejectWithValue("Failed to update risk-overview due to permissions or other error");
        }
    }
);

export const deleteMyRisk = createAsyncThunk(
    ActionTypes.DELETE_MY_RISK,
    async (riskId: string, {rejectWithValue}) => {
        try {
            const user = auth.currentUser;

            if (!user) {
                return rejectWithValue("User not authenticated");
            }

            const risksCollection = collection(db, FirestoreCollectionEnum.MY_RISKS);
            const riskQuery = query(
                risksCollection,
                where("uid", "==", user.uid),
                where("id", "==", riskId)
            );

            const riskDocs = await getDocs(riskQuery);

            if (riskDocs.empty) {
                return rejectWithValue("Risk not found");
            }

            const riskDocRef = riskDocs.docs[0].ref;
            await deleteDoc(riskDocRef);

            console.log("Deleted risk-overview:", riskId);

            return riskId;
        } catch (error) {
            console.error("Error deleting risk-overview:", error);
            return rejectWithValue("Failed to delete risk-overview due to permissions or other error");
        }
    }
);

export const myRisksSlice = createSlice({
    name: FirestoreCollectionEnum.MY_RISKS,
    initialState: initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchMyRisks.pending, (state) => {
                state.risks = [];
                state.error = undefined;
                state.status = FetchStatusEnum.PENDING;
            })
            .addCase(fetchMyRisks.fulfilled, (state, action) => {
                state.risks = action.payload;
                state.status = FetchStatusEnum.SUCCEEDED;
            })
            .addCase(fetchMyRisks.rejected, (state, action) => {
                state.risks = [];
                state.error = action.error.message;
                state.status = FetchStatusEnum.FAILED;
            })
            .addCase(addMyRisk.pending, (state) => {
                state.error = undefined;
                state.status = FetchStatusEnum.PENDING;
            })
            .addCase(addMyRisk.fulfilled, (state, action) => {
                if (state.risks.some(risk => risk.id === action.payload.id)) {
                    return;
                }

                state.risks.push(action.payload);
                state.status = FetchStatusEnum.SUCCEEDED;
            })
            .addCase(addMyRisk.rejected, (state, action) => {
                state.error = action.error.message;
                state.status = FetchStatusEnum.FAILED;
            })
            .addCase(deleteMyRisk.pending, (state) => {
                state.error = undefined;
                state.status = FetchStatusEnum.PENDING;
            })
            .addCase(deleteMyRisk.fulfilled, (state, action) => {
                state.risks = state.risks.filter(risk => risk.id !== action.payload);
                state.status = FetchStatusEnum.SUCCEEDED;
            })
            .addCase(deleteMyRisk.rejected, (state, action) => {
                state.error = action.error.message;
                state.status = FetchStatusEnum.FAILED;
            })
            .addCase(updateMyRisk.pending, (state) => {
                state.error = undefined;
                state.status = FetchStatusEnum.PENDING;
            })
            .addCase(updateMyRisk.fulfilled, (state, action) => {
                state.risks = state.risks.map(risk =>
                    risk.id === action.payload.id ? {...risk, ...action.payload} : risk
                );
                state.status = FetchStatusEnum.SUCCEEDED;
            })
            .addCase(updateMyRisk.rejected, (state, action) => {
                state.error = action.error.message;
                state.status = FetchStatusEnum.FAILED;
            })
    }
});

export const selectMyRisks = (state: { myRisks: MyRisksState }) => state.myRisks.risks;

export default myRisksSlice.reducer;
