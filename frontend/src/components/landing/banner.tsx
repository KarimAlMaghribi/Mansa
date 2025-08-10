import cover from "../../assests/imgs/desert_1-min.png";
import React from "react";
import Box from "@mui/material/Box";
import {Typography} from "@mui/material";

export const Banner = () => {
        return (
            <Box
                sx={{
                    backgroundImage:`url(${cover})`,
                    backgroundRepeat: "no-repeat",
                    backgroundSize: "cover",
                    height: {xs: "40vh", md: "70vh"},
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    px: {xs: 2, md: 12}
                }}>
                <Typography
                    variant="h2"
                    color="white"
                    sx={{
                        width: {xs: "100%", md: "40%"},
                        fontSize: {xs: "2rem", md: "3rem"}
                    }}>
                    <b>Wir machen Risiken handelbar!</b>
                </Typography>

                <Typography
                    variant="h4"
                    color="white"
                    sx={{
                        width: {xs: "100%", md: "40%"},
                        mt: {xs: 2, md: 0}
                    }}>
                    Wir sind die intelligente Plattform für Partner-basierte Risiko-Transformation!
                </Typography>
            </Box>
        )


}
