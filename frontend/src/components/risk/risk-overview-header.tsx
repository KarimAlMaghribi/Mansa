import React from "react";
import Grid from "@mui/material/Grid2";
import {Typography} from "@mui/material";
import SwapVertIcon from '@mui/icons-material/SwapVert';
import Tooltip from "@mui/material/Tooltip";
import {AppDispatch} from "../../store/store";
import {useDispatch, useSelector} from "react-redux";
import {selectSorts, sortRisks} from "../../store/slices/risks";
import {RiskOverviewSort} from "../../models/RiskOverviewSort";
import {RiskOverviewHeaderEnum} from "../../enums/RiskOverviewHeader.enum";
import {SortDirectionEnum} from "../../enums/SortDirection.enum";

export const RiskOverviewHeader = () => {
    const dispatch: AppDispatch = useDispatch();
    const backgroundColor = "#f1f6f1";
    const sorts: RiskOverviewSort[] = useSelector(selectSorts);

    const sortCol = (colName: RiskOverviewHeaderEnum) => {
        dispatch(sortRisks(colName))
    }

    return (
        <Grid container size={12} style={{backgroundColor: backgroundColor, paddingTop: "20px", paddingBottom: "20px", marginBottom: "10px"}}>
            <Grid size={2} sx={{display: 'flex', alignItems: 'center'}}>
                <Typography sx={{ cursor: 'pointer', marginLeft: "10px" }} variant="button">Name</Typography>
            </Grid>
            <Grid size={3} sx={{ display: 'flex', alignItems: 'center', marginLeft: "5px" }}>
                <Tooltip title="Zugeordneter Typ des Risikos">
                    <Typography sx={{ cursor: 'pointer', marginLeft: "10px" }} variant="button">Risikoart</Typography>
                </Tooltip>
                <SwapVertIcon sx={{cursor: 'pointer', transition: 'transform 0.5s', transform: sorts.find(sort => sort.name === RiskOverviewHeaderEnum.TYPE)?.direction === SortDirectionEnum.ASC ?'rotate(180deg)' : 'rotate(0deg)'}} onClick={() => sortCol(RiskOverviewHeaderEnum.TYPE)}/>
            </Grid>
            <Grid size={3} sx={{display: 'flex', alignItems: 'center'}}>
                <Tooltip title="Die Höhe, mit der das Risiko...">
                    <Typography style={{cursor: "pointer"}} variant="button">Absicherungssumme</Typography>
                </Tooltip>
                <SwapVertIcon sx={{cursor: 'pointer', transition: 'transform 0.5s', transform: sorts.find(sort => sort.name === RiskOverviewHeaderEnum.VALUE)?.direction === SortDirectionEnum.ASC ? 'rotate(180deg)' : 'rotate(0deg)'}} onClick={() => sortCol(RiskOverviewHeaderEnum.VALUE)}/>
            </Grid>
            <Grid size={2} sx={{display: 'flex', alignItems: 'center'}}>
                <Tooltip title="Zeitpunkt, an dem das Risiko...">
                    <Typography style={{cursor: "pointer"}} variant="button">Fällig am</Typography>
                </Tooltip>
                <SwapVertIcon  sx={{cursor: 'pointer', transition: 'transform 0.5s', transform: sorts.find(sort => sort.name === RiskOverviewHeaderEnum.DECLINATION_DATE)?.direction === SortDirectionEnum.ASC ? 'rotate(180deg)' : 'rotate(0deg)'}} onClick={() => sortCol(RiskOverviewHeaderEnum.DECLINATION_DATE)}/>
            </Grid>
            <Grid size={1} sx={{display: 'flex', alignItems: 'center'}}>
                <Tooltip title="Person, die das Risiko erstellt und veröffentlicht hat">
                    <Typography style={{cursor: "pointer"}} variant="button">Anbieter</Typography>
                </Tooltip>
                <SwapVertIcon  sx={{cursor: 'pointer', transition: 'transform 0.5s', transform: sorts.find(sort => sort.name === RiskOverviewHeaderEnum.PUBLISHER)?.direction === SortDirectionEnum.ASC ? 'rotate(180deg)' : 'rotate(0deg)'}} onClick={() => sortCol(RiskOverviewHeaderEnum.PUBLISHER)}/>
            </Grid>
        </Grid>
    )
}
