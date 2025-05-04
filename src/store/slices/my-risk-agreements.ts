import {createAsyncThunk, createSlice} from "@reduxjs/toolkit";
import {Risk} from "../../models/Risk";
import {addDoc, collection, deleteDoc, getDocs, query, updateDoc, where} from "firebase/firestore";
import {FetchStatus} from "../../types/FetchStatus";
import {FetchStatusEnum} from "../../enums/FetchStatus.enum";
import {auth, db} from "../../firebase_config";
import {FirestoreCollectionEnum} from "../../enums/FirestoreCollectionEnum";
import { RiskAgreement } from "../../models/RiskAgreement";

enum ActionTypes {
    FETCH_MY_RISK_AGREEMENTS = "myRiskAgreements/fetchMyRiskAgreements",
    ADD_MY_RISK_AGREEMENTS = "myRiskAgreements/addRiskAgreements",
    DELETE_MY_RISK_AGREEMENTS = "myRiskAgreements/deleteRiskAgreements",
    UPDATE_MY_RISK_AGREEMENTS = "myRiskAgreements/updateRiskAgreements"
}

export interface MyRiskAgreementsState {
    riskAgreements: RiskAgreement[];
    error?: string;
    status: FetchStatus;
}

const initialState: MyRiskAgreementsState = {
    riskAgreements: [],
    error: undefined,
    status: FetchStatusEnum.IDLE
};

export const fetchMyRiskAgreements = createAsyncThunk(
    ActionTypes.FETCH_MY_RISK_AGREEMENTS,
    async (_, {rejectWithValue}) => {
        try {
            const user = auth.currentUser;

            if (!user) {
                return rejectWithValue("User not authenticated");
            }

            const riskAgreementsCollection = collection(db, FirestoreCollectionEnum.MY_RISK_AGREEMENTS);
            const riskAgreementsQuery = query(riskAgreementsCollection, where("uid", "==", user.uid));
            const riskAgreementDocs = await getDocs(riskAgreementsQuery);

            const riskAgreements = riskAgreementDocs.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as RiskAgreement[];

            return riskAgreements;
        } catch (error) {
            console.error("Error fetching risk agreements: ", error);
            return rejectWithValue("Failed to fetch risk agreements");
        }
    }
);

export const addMyRiskAgreement = createAsyncThunk(
    ActionTypes.ADD_MY_RISK_AGREEMENTS,
    async (newRiskAgreement: Omit<RiskAgreement, "id">, {rejectWithValue}) => {
        try {
            const user = auth.currentUser;
            if (!user) {
                return rejectWithValue("User not authenticated");
            }

            const myRiskAgreementsCollection = collection(db, FirestoreCollectionEnum.MY_RISK_AGREEMENTS);
            const docRef = await addDoc(myRiskAgreementsCollection, {
                ...newRiskAgreement,
                uid: user.uid,
                createdAt: new Date().toISOString()
            });

            return {id: docRef.id, ...newRiskAgreement} as RiskAgreement;
        } catch (error) {
            console.error("Error adding myRiskAgreement: ", error);
            return rejectWithValue(error);
        }
    }
);

export const updateMyRiskAgreement = createAsyncThunk(
    ActionTypes.UPDATE_MY_RISK_AGREEMENTS,
    async (riskAgreement: RiskAgreement, {rejectWithValue}) => {
        try {
            const user = auth.currentUser;

            if (!user) {
                return rejectWithValue("User not authenticated");
            }

            const riskAgreementsCollection = collection(db, FirestoreCollectionEnum.MY_RISK_AGREEMENTS);

            const riskAgreementQuery = query(
                riskAgreementsCollection,
                where("uid", "==", user.uid),
                where("id", "==", riskAgreement.id)
            );

            const riskAgreementDocs = await getDocs(riskAgreementQuery);

            if (riskAgreementDocs.empty) {
                return rejectWithValue("Risk Agreement not found");
            }

            const riskAgreementDocRef = riskAgreementDocs.docs[0].ref;

            await updateDoc(riskAgreementDocRef, {
                ...riskAgreement,
                updatedAt: new Date().toISOString()
            });

            console.log("Updated risk-agreement-overview", riskAgreement.id)

            return {...riskAgreement, updatedAt: new Date().toISOString()};
        } catch (error) {
            console.error("Error updating risk-agreement-overview:", error);
            return rejectWithValue("Failed to update risk-agreement-overview due to permissions or other error");
        }
    }
);

export const deleteMyRiskAgreement = createAsyncThunk(
    ActionTypes.DELETE_MY_RISK_AGREEMENTS,
    async (riskAgreementId: string, {rejectWithValue}) => {
        try {
            const user = auth.currentUser;

            if (!user) {
                return rejectWithValue("User not authenticated");
            }

            const riskAgreementsCollection = collection(db, FirestoreCollectionEnum.MY_RISK_AGREEMENTS);
            const riskAgreementQuery = query(
                riskAgreementsCollection,
                where("uid", "==", user.uid),
                where("id", "==", riskAgreementId)
            );

            const riskAgreementDocs = await getDocs(riskAgreementQuery);

            if (riskAgreementDocs.empty) {
                return rejectWithValue("Risk agreement not found");
            }

            const riskAgreementDocRef = riskAgreementDocs.docs[0].ref;
            await deleteDoc(riskAgreementDocRef);

            console.log("Deleted riskagreement-overview:", riskAgreementId);

            return riskAgreementId;
        } catch (error) {
            console.error("Error deleting risk-agreement-overview:", error);
            return rejectWithValue("Failed to delete risk-agreement-overview due to permissions or other error");
        }
    }
);

export const myRiskAgreementsSlice = createSlice({
    name: FirestoreCollectionEnum.MY_RISK_AGREEMENTS,
    initialState: initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchMyRiskAgreements.pending, (state) => {
                state.riskAgreements = [];
                state.error = undefined;
                state.status = FetchStatusEnum.PENDING;
            })
            .addCase(fetchMyRiskAgreements.fulfilled, (state, action) => {
                state.riskAgreements = action.payload;
                state.status = FetchStatusEnum.SUCCEEDED;
            })
            .addCase(fetchMyRiskAgreements.rejected, (state, action) => {
                state.riskAgreements = [];
                state.error = action.error.message;
                state.status = FetchStatusEnum.FAILED;
            })
            .addCase(addMyRiskAgreement.pending, (state) => {
                state.error = undefined;
                state.status = FetchStatusEnum.PENDING;
            })
            .addCase(addMyRiskAgreement.fulfilled, (state, action) => {
                if (state.riskAgreements.some(riskAgreement => riskAgreement.id === action.payload.id)) {
                    return;
                }

                state.riskAgreements.push(action.payload);
                state.status = FetchStatusEnum.SUCCEEDED;
            })
            .addCase(addMyRiskAgreement.rejected, (state, action) => {
                state.error = action.error.message;
                state.status = FetchStatusEnum.FAILED;
            })
            .addCase(deleteMyRiskAgreement.pending, (state) => {
                state.error = undefined;
                state.status = FetchStatusEnum.PENDING;
            })
            .addCase(deleteMyRiskAgreement.fulfilled, (state, action) => {
                state.riskAgreements = state.riskAgreements.filter(riskAgreement => riskAgreement.id !== action.payload);
                state.status = FetchStatusEnum.SUCCEEDED;
            })
            .addCase(deleteMyRiskAgreement.rejected, (state, action) => {
                state.error = action.error.message;
                state.status = FetchStatusEnum.FAILED;
            })
            .addCase(updateMyRiskAgreement.pending, (state) => {
                state.error = undefined;
                state.status = FetchStatusEnum.PENDING;
            })
            .addCase(updateMyRiskAgreement.fulfilled, (state, action) => {
                state.riskAgreements = state.riskAgreements.map(riskAgreement =>
                    riskAgreement.id === action.payload.id ? {...riskAgreement, ...action.payload} : riskAgreement
                );
                state.status = FetchStatusEnum.SUCCEEDED;
            })
            .addCase(updateMyRiskAgreement.rejected, (state, action) => {
                state.error = action.error.message;
                state.status = FetchStatusEnum.FAILED;
            })
    }
});

export const selectMyRisks = (state: { myRiskAgreements: MyRiskAgreementsState }) => state.myRiskAgreements.riskAgreements;

export default myRiskAgreementsSlice.reducer;
