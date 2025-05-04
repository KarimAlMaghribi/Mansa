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
                    height: "70vh"
                }}>
                <Typography
                    variant="h2"
                    color="white"
                    style={{width: "40%", paddingTop: "200px", paddingLeft: "100px"}}>
                    <b>Wir machen Risiken handelbar!</b>
                </Typography>

                <Typography
                    variant="h4"
                    color="white"
                    style={{width: "40%", paddingLeft: "100px"}}>
                    Wir sind die intelligente Plattform für Partner-basierte Risiko-Transformation!
                </Typography>
            </Box>
        )


}
