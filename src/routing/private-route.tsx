import React from "react";
import {Navigate} from "react-router-dom";
import {ROUTES} from "./routes";
import {useAuthState} from "react-firebase-hooks/auth";
import {auth} from "../firebase_config";
import {CircularProgress} from "@mui/material";

export const PrivateRoute = ({ children }: { children: JSX.Element }) => {
    const [user, loading] = useAuthState(auth);

    if (loading) {
        <CircularProgress />
    }

    return user ? children : <Navigate to={`/${ROUTES.SIGN_IN}`} />;
};
