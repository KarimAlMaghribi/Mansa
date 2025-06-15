import React from "react";
import {Navigate} from "react-router-dom";
import {ROUTES} from "./routes";
import { Box, CircularProgress } from "@mui/material";
import { useAuth } from "../context/AuthContext";

export const PrivateRoute = ({ children }: { children: JSX.Element }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" mt={4}>
                <CircularProgress />
            </Box>
        );
    }

    return user ? children : <Navigate to={`/${ROUTES.SIGN_IN}`} />;
};
