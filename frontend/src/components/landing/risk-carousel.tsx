import React from "react";
import Grid from "@mui/material/Grid2";
import RouteIcon from '@mui/icons-material/Route';
import GavelIcon from '@mui/icons-material/Gavel';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import {Card, CardMedia, Typography} from "@mui/material";
import route from "../../assests/imgs/risk-examples/wings.jpg"
import process from "../../assests/imgs/risk-examples/process.jpg"
import event from "../../assests/imgs/risk-examples/event.jpg"
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import IconButton from "@mui/material/IconButton";
import { useTheme } from '@mui/material';

interface RiskExample {
    img: string;
    title: string;
    icon: any;
}

const iconSize = 50;
const riskExamples: RiskExample[] = [
    {
        title: "Weg absichern",
        img: route,
        icon: <RouteIcon sx={{fontSize: iconSize}}/>
    },
    {
        title: "Prozess absichern",
        img: process,
        icon: <GavelIcon sx={{fontSize: iconSize}} />
    },
    {
        title: "Event absichern",
        img: event,
        icon: <CalendarMonthIcon sx={{fontSize: iconSize}}/>
    }
];

export const RiskElement = (props: RiskExample) => {
    return (
        <Card sx={{textAlign: "center", cursor: "pointer"}} elevation={2}>
            <CardMedia
                sx={{height: 270}}
                title={props.title}
                image={props.img} />

            <div style={{margin: "60px"}}>
                {props.icon}
            </div>

            <Typography gutterBottom variant="h5" component="div">
                {props.title}
            </Typography>
        </Card>
    )

}

export const RiskCarousel = () => {
    const theme = useTheme();
    const orange = theme.palette.primary.main;




    return (
        <React.Fragment>
            <Typography variant="h5" color="grey" style={{textAlign: "center", marginTop: "50px"}}>
                MIT <span style={{ color: orange }}>X</span>RISK
            </Typography>
            <Typography variant="h3" style={{textAlign: "center", marginBottom: "50px"}}>
                <b>Jetzt <span style={{ color: orange }}>Deine Risiken anbieten.</span></b>
            </Typography>
            <Typography variant="h5" color="black" style={{textAlign: "center", marginBottom: "50px"}}>
                Sieh dir an, welche Risiken andere Nutzer abgesichert haben
            </Typography>


            <Grid
                container
                style={{margin: "0 40px 100px 40px"}}
                display="flex"
                justifyContent="center"
                alignItems="center">
                <Grid size={1} style={{textAlign: "right"}}>
                    <IconButton>
                        <KeyboardArrowLeftIcon sx={{fontSize: 40}}/>
                    </IconButton>
                </Grid>
                {
                    riskExamples.map((riskExample: RiskExample) => (
                        <Grid
                            size={{xs: 12, sm: 6, md: 4, lg: 3, xl: 2}}
                            key={riskExample.title}
                            style={{margin: "40px"}}>
                            <RiskElement
                                img={riskExample.img}
                                title={riskExample.title}
                                icon={riskExample.icon} />
                        </Grid>
                    ))
                }
                <Grid size={1}>
                    <IconButton>
                        <KeyboardArrowRightIcon sx={{fontSize: 40}}/>
                    </IconButton>
                </Grid>
            </Grid>
        </React.Fragment>

    )
}
