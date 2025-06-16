import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { ROUTES } from "./routes";
import { Box, CircularProgress } from "@mui/material";
import { useAuth } from "../context/AuthContext";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase_config";

export const PrivateRoute = ({ children }: { children: JSX.Element }) => {
    const { user, loading } = useAuth();
    const [checking, setChecking] = useState(true);
    const [hasProfile, setHasProfile] = useState(false);

    useEffect(() => {
        const checkProfile = async () => {
            if (user) {
                const q = query(collection(db, "userProfiles"), where("uid", "==", user.uid));
                const snapshot = await getDocs(q);
                setHasProfile(!snapshot.empty);
            }
            setChecking(false);
        };
        if (!loading) {
            checkProfile();
        }
    }, [user, loading]);

    if (loading || checking) {
        return (
            <Box display="flex" justifyContent="center" mt={4}>
                <CircularProgress />
            </Box>
        );
    }

    if (!user) return <Navigate to={`/${ROUTES.SIGN_IN}`} />;
    if (!hasProfile) return <Navigate to={`/${ROUTES.COMPLETE_PROFILE}`} />;
    return children;
};
