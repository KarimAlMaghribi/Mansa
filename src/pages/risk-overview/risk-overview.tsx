import Grid from "@mui/material/Grid2";
import {RiskOverviewHeader} from "../../components/risk/risk-overview-header";
import {RiskOverviewElement} from "../../components/risk/risk-overview-element";
import React, {useEffect} from "react";
import {RiskOverviewFilter} from "../../components/risk/risk-overview-filter";
import {
    fetchRisks,
    selectFilteredRisks,
    selectFilterTypes,
    selectFilterValue,
    selectRemainingTerm,
    selectStatus
} from "../../store/slices/risks";
import {Risk} from "../../models/Risk";
import {useDispatch, useSelector} from "react-redux";
import {FetchStatus} from "../../types/FetchStatus";
import Button from "@mui/material/Button";
import {MyRiskCreationDialog} from "../../components/my-risks/my-risk-creation-dialog";
import {Divider} from "@mui/material";
import {AppDispatch} from "../../store/store";
import {fetchProviderChats} from "../../store/slices/my-bids";

export const RiskOverview = () => {
    const dispatch : AppDispatch = useDispatch();
    const filteredRisks: Risk[] = useSelector(selectFilteredRisks);
    const status: FetchStatus = useSelector(selectStatus);
    const filterTypes: string[] = useSelector(selectFilterTypes);
    const filterValue: number | number[] = useSelector(selectFilterValue);
    const filterRemainingTerm: number | number[]  = useSelector(selectRemainingTerm);
    const [openRiskCreationDialog, setOpenRiskCreationDialog] = React.useState(false);

    useEffect(() => {
        dispatch(fetchRisks());
        dispatch(fetchProviderChats());
    }, [dispatch]);

    const handleClose = () => {
        setOpenRiskCreationDialog(false);
    }

    return (
        <React.Fragment>
            <Grid container>
                <Grid size={{xs: 12, md: 2}}>
                    <Grid style={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: "63px", margin: '5px'}}>
                        <Button variant="contained" onClick={() => setOpenRiskCreationDialog(true)}>
                            RISIKO DEFINIEREN!
                        </Button>
                    </Grid>

                    <Divider style={{margin: "0 25px 0 25px"}}/>

                    <RiskOverviewFilter
                        types={filterTypes}
                        value={filterValue}
                        remainingTerm={filterRemainingTerm}
                    />
                </Grid>
                <Grid size={{xs: 10}}>
                    <RiskOverviewHeader />
                    <RiskOverviewElement
                        risks={filteredRisks}
                        status={status}/>
                </Grid>
            </Grid>
            <MyRiskCreationDialog
                open={openRiskCreationDialog}
                handleClose={handleClose} />
        </React.Fragment>
    )
}
