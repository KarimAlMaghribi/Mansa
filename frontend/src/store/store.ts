import { configureStore,  } from "@reduxjs/toolkit";
import myRisksReducer from "./slices/my-risks";
import myBidsReducer from "./slices/my-bids";
import riskOverviewReducer from "./slices/risks";
import userProfilesReducer from "./slices/user-profile";
import notificationReducer from "./slices/notifications"

export const store = configureStore({
    reducer: {
        myRisks: myRisksReducer,
        myBids: myBidsReducer,
        risks: riskOverviewReducer,
        userProfile: userProfilesReducer,
        notifications: notificationReducer
    },
    devTools: true
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
