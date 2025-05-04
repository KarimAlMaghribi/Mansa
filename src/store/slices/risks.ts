import {createAsyncThunk, createSlice, PayloadAction} from "@reduxjs/toolkit";
import {Risk} from "../../models/Risk";
import {FetchStatus} from "../../types/FetchStatus";
import {RiskOverviewSort} from "../../models/RiskOverviewSort";
import {RiskOverviewHeaderEnum} from "../../enums/RiskOverviewHeader.enum";
import {SortDirectionEnum} from "../../enums/SortDirection.enum";
import {RiskOverviewFilterType} from "../../models/RiskOverviewFilterType";
import {FetchStatusEnum} from "../../enums/FetchStatus.enum";
import {RiskStatusEnum} from "../../enums/RiskStatus.enum";
import {addDoc, collection, deleteDoc, getDocs, onSnapshot, query, where} from "firebase/firestore";
import {auth, db} from "../../firebase_config";
import {FirestoreCollectionEnum} from "../../enums/FirestoreCollectionEnum";
import {RootState} from "../store";

enum ActionTypes {
    FETCH_RISKS = "risks/fetchRisks",
    ADD_RISK = "risks/addRisk",
    DELETE_RISK = "risk/deleteRisk",
    FETCH_RISK_TYPES = "risks/fetchRiskTypes",
    ADD_RISK_TYPE = "risks/addRiskType"
}

export interface RiskOverviewState {
    risks: Risk[];
    filteredRisks: Risk[];
    types: string[];
    filters: RiskOverviewFilterType;
    sorts: RiskOverviewSort[];
    status: FetchStatus;
    error?: string;
}

const initialState: RiskOverviewState = {
    risks: [],
    filteredRisks: [],
    types: [],
    filters: {
        types: [],
        value: [0, 200000],
        remainingTerm: [0, 24] // months
    },
    sorts: [
        {
            name: RiskOverviewHeaderEnum.TYPE,
            direction: SortDirectionEnum.ASC
        },
        {
            name: RiskOverviewHeaderEnum.VALUE,
            direction: SortDirectionEnum.ASC
        },
        {
            name: RiskOverviewHeaderEnum.DECLINATION_DATE,
            direction: SortDirectionEnum.ASC
        },
        {
            name: RiskOverviewHeaderEnum.PUBLISHER,
            direction: SortDirectionEnum.ASC
        }
    ],
    status: FetchStatusEnum.IDLE
};

export const fetchRisks = createAsyncThunk(
    ActionTypes.FETCH_RISKS,
    async (_, thunkAPI) => {
        try {
            const risksCollection = collection(db, FirestoreCollectionEnum.RISKS);

            const publishedRisksQuery = query(
                risksCollection,
                where("status", "==", RiskStatusEnum.PUBLISHED)
            );

            return new Promise<Risk[]>((resolve, reject) => {
                const unsubscribe = onSnapshot(
                    publishedRisksQuery,
                    (snapshot) => {
                        const risks: Risk[] = snapshot.docs.map((doc) => ({
                            id: doc.id,
                            ...doc.data(),
                        })) as Risk[];

                        resolve(risks);
                    },
                    (error) => {
                        console.error("Error fetching risks:", error);
                        reject(error);
                    }
                );

                return () => unsubscribe();
            });
        } catch (error) {
            console.error("Error in fetchRisks:", error);
            throw error;
        }
    }
);

export const fetchRiskTypes = createAsyncThunk(
    ActionTypes.FETCH_RISK_TYPES,
    async (_, thunkAPI) => {
        try {
            const riskTypesCollection = collection(db, FirestoreCollectionEnum.RISK_TYPES);

            return new Promise<string[]>((resolve, reject) => {
                const unsubscribe = onSnapshot(
                    riskTypesCollection,
                    (snapshot) => {
                        const riskTypes = snapshot.docs.map((doc) => doc.data().name as string);
                        const uniqueRiskTypes = Array.from(new Set(riskTypes));
                        resolve(uniqueRiskTypes); // Rückgabe der aktuellen Typen
                    },
                    (error) => {
                        console.error("Error fetching risk-overview types:", error);
                        reject(error);
                    }
                );

                return () => unsubscribe();
            });
        } catch (error) {
            console.error("Error in fetchRiskTypesWithListener:", error);
            throw error;
        }
    }
);

export const addRiskType = createAsyncThunk(
    ActionTypes.ADD_RISK_TYPE,
    async (newType: string, thunkAPI) => {
        try {
            const uid = auth.currentUser?.uid;
            const riskTypesCollection = collection(db, FirestoreCollectionEnum.RISK_TYPES);

            const docRef = await addDoc(riskTypesCollection, {
                name: newType,
                createdAt: new Date().toISOString(),
                creator: uid || undefined
            });

            console.log("Added risk-overview type:", docRef.id);
            return newType; // Rückgabe des neuen Typs
        } catch (error) {
            console.error("Error adding risk-overview type:", error);
            return thunkAPI.rejectWithValue("Failed to add risk-overview type");
        }
    }
);

export const addRisk = createAsyncThunk(
    ActionTypes.ADD_RISK,
    async (riskToPublish: Omit<Risk, "id">, {rejectWithValue}) => {
        try {
            const user = auth.currentUser;
            if (!user) {
                return rejectWithValue("User not authenticated")
            }

            const risksCollection = collection(db, FirestoreCollectionEnum.RISKS);
            const docRef = await addDoc(risksCollection, {
                ...riskToPublish,
                publishedAt: new Date().toISOString(),
                uid: user.uid
            });

            return {id: docRef.id, ...riskToPublish} as Risk;

        } catch (error) {
            console.error("Error adding risk-overview: ", error);
            return rejectWithValue(error);
        }
    }
)

export const deleteRisk = createAsyncThunk(
    ActionTypes.DELETE_RISK,
    async (riskId: string, {rejectWithValue}) => {
        try {
            const user = auth.currentUser;

            if (!user) {
                return rejectWithValue("User not authenticated");
            }

            const risksCollection = collection(db, FirestoreCollectionEnum.RISKS);
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

            console.log("here");

            await deleteDoc(riskDocRef);

            console.log("Deleted risk-overview:", riskId);

            return riskId;
        } catch (error) {
            console.error("Error deleting risk-overview:", error);
            return rejectWithValue("Failed to delete risk-overview due to permissions or other error");
        }
    }
);

export const riskOverviewSlice = createSlice({
    name: FirestoreCollectionEnum.RISKS,
    initialState: initialState,
    reducers: {
        sortRisks: (state, action: PayloadAction<RiskOverviewHeaderEnum>) => {
            const sort = state.sorts.find(s => s.name === action.payload);

            if (sort) {
                sort.direction = sort.direction === SortDirectionEnum.ASC ? SortDirectionEnum.DESC : SortDirectionEnum.ASC;
            }

            state.filteredRisks.sort((a, b) => {
                if (!sort) return 0;

                if (sort.name === RiskOverviewHeaderEnum.PUBLISHER) {
                    if (!a.publisher || !b.publisher) return 0;
                    return a.publisher.name > b.publisher.name ? 1 : -1;
                } else {
                    if (sort.direction === SortDirectionEnum.ASC) {
                        // @ts-ignore
                        return a[sort.name] > b[sort.name] ? 1 : -1;
                    } else {
                        // @ts-ignore
                        return a[sort.name] < b[sort.name] ? 1 : -1;
                    }
                }
            });
        },
        setFilterType: (state, action: PayloadAction<string[]>) => {
            state.filters.types = action.payload;

            state.filteredRisks = state.risks.filter(risk => {
                return action.payload.every(type => risk.type.includes(type));
            });
        },
        changeFilterValue: (state, action: PayloadAction<number[]>) => {
            state.filters.value = action.payload;

            state.filteredRisks = state.risks.filter(risk => {
                return risk.value >= action.payload[0] && risk.value <= action.payload[1];
            });
        },
        changeRemainingTerm: (state, action: PayloadAction<number[]>) => {
            state.filters.remainingTerm = action.payload;

            state.filteredRisks = state.risks.filter(risk => {
                const declinationDate = new Date(risk.declinationDate);
                const currentDate = new Date();
                const remainingMonths = (declinationDate.getFullYear() - currentDate.getFullYear()) * 12 + declinationDate.getMonth() - currentDate.getMonth();
                return remainingMonths >= action.payload[0] && remainingMonths <= action.payload[1];
            });
        },
        clearFilters: (state) => {
            state.filters.types = [];
            state.filters.value = [0, 1];
            state.filters.remainingTerm = [3, 6];
            state.filteredRisks = state.risks;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchRisks.pending, (state) => {
                state.status = FetchStatusEnum.PENDING;
            })
            .addCase(fetchRisks.fulfilled, (state, action) => {
                state.risks = action.payload;
                state.filteredRisks = action.payload;
                state.status = FetchStatusEnum.SUCCEEDED;
            })
            .addCase(fetchRisks.rejected, (state, action) => {
                state.error = action.error.message;
                state.status = FetchStatusEnum.FAILED;
            })
            .addCase(addRisk.pending, (state) => {
                state.error = undefined;
                state.status = FetchStatusEnum.PENDING;
            })
            .addCase(addRisk.fulfilled, (state, action) => {
                if (state.risks.some(risk => risk.id === action.payload.id)) {
                    return;
                }

                state.risks.push(action.payload);
                state.status = FetchStatusEnum.SUCCEEDED;
            })
            .addCase(addRisk.rejected, (state, action) => {
                state.error = action.error.message;
                state.status = FetchStatusEnum.FAILED;
            })
            .addCase(deleteRisk.pending, (state) => {
                state.error = undefined;
                state.status = FetchStatusEnum.PENDING;
            })
            .addCase(deleteRisk.fulfilled, (state, action) => {
                const newRisks = state.risks.filter(risk => risk.id !== action.payload);
                state.risks = newRisks;
                state.filteredRisks = newRisks;
                state.status = FetchStatusEnum.SUCCEEDED;
            })
            .addCase(deleteRisk.rejected, (state, action) => {
                state.error = action.error.message;
                state.status = FetchStatusEnum.FAILED;
            })
            .addCase(fetchRiskTypes.pending, (state, action) => {
                state.error = undefined;
                state.status = FetchStatusEnum.PENDING;
            })
            .addCase(fetchRiskTypes.fulfilled, (state, action) => {
                state.types = action.payload;
                state.status = FetchStatusEnum.SUCCEEDED;
            })
            .addCase(fetchRiskTypes.rejected, (state, action) => {
                state.error = action.error.message;
                state.status = FetchStatusEnum.FAILED;
            })
            .addCase(addRiskType.pending, (state, action) => {
                state.error = undefined;
                state.status = FetchStatusEnum.PENDING;
            })
            .addCase(addRiskType.fulfilled, (state, action) => {
                state.types.push(action.payload);
                state.status = FetchStatusEnum.SUCCEEDED;
            })
            .addCase(addRiskType.rejected, (state, action) => {
                state.error = action.error.message;
                state.status = FetchStatusEnum.FAILED;
            });
    }
});

export const selectRisks = (state: { risks: RiskOverviewState }) => state.risks.risks;
export const selectFilteredRisks = (state: { risks: RiskOverviewState }) => state.risks.filteredRisks;
export const selectStatus = (state: { risks: RiskOverviewState }) => state.risks.status;
export const selectSorts = (state: { risks: RiskOverviewState }) => state.risks.sorts;
export const selectFilterTypes = (state: { risks: RiskOverviewState }) => state.risks.filters.types;
export const selectFilterValue = (state: { risks: RiskOverviewState }) => state.risks.filters.value;
export const selectRemainingTerm = (state: { risks: RiskOverviewState }) => state.risks.filters.remainingTerm;
export const selectTypes = (state: { risks: RiskOverviewState }) => state.risks.types;
export const selectRiskById = (state: RootState, id: string) => {
    return state.risks.risks.find(risk => risk.id === id) || null;
};

export const {
    sortRisks,
    setFilterType,
    changeFilterValue,
    changeRemainingTerm,
    clearFilters
} = riskOverviewSlice.actions;

export default riskOverviewSlice.reducer;
