import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { ROUTES } from "./routes";
import { Box, CircularProgress } from "@mui/material";
import { useAuth } from "../context/AuthContext";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase_config";

export const PrivateRoute = ({ children }: { children: JSX.Element }) => {
    const { user, loading } = useAuth();
    const [checking, setChecking] = useState(true);
    const [profileComplete, setProfileComplete] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const checkProfile = async () => {
            if (user) {
                const q = query(collection(db, "userProfiles"), where("uid", "==", user.uid));
                const snapshot = await getDocs(q);
                if (!snapshot.empty) {
                    const data = snapshot.docs[0].data().profile || {};
                    const required = ["firstName","lastName","birthDate","gender","nationality","address","phone","username","language"];
                    const complete = required.every(f => data[f]);
                    setProfileComplete(complete);
                } else {
                    setProfileComplete(false);
                }
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
    const allowed = [`/${ROUTES.COMPLETE_PROFILE}`];
    if (!profileComplete && !allowed.includes(location.pathname)) {
        return <Navigate to={`/${ROUTES.COMPLETE_PROFILE}`} />;
    }
    return children;
};
