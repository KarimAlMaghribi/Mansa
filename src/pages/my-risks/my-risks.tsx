import React, {useEffect} from "react";
import Grid from "@mui/material/Grid2";
import {Typography} from "@mui/material";
import {Risk} from "../../models/Risk";
import {useDispatch, useSelector} from "react-redux";
import {fetchMyRisks, selectMyRisks} from "../../store/slices/my-risks";
import Button from "@mui/material/Button";
import {MyRiskCreationDialog} from "../../components/my-risks/my-risk-creation-dialog";
import AddIcon from '@mui/icons-material/Add';
import {AppDispatch} from "../../store/store";
import {MyRiskElement} from "../../components/my-risks/my-risk-element";


export const MyRisks = () => {
    const dispatch: AppDispatch = useDispatch();
    const myRisks: Risk[] = useSelector(selectMyRisks);
    const [openRiskCreationDialog, setOpenRiskCreationDialog] = React.useState(false);

    useEffect(() => {
        dispatch(fetchMyRisks());
    }, []);

    const handleCloseDialog = () => {
        setOpenRiskCreationDialog(false);
    }

    return (
        <React.Fragment>
            <Grid container>
                <Grid size={2}
                      style={{display: 'flex', alignItems: 'center', justifyContent: 'center', padding: "10px"}}>
                    <Button
                        onClick={() => setOpenRiskCreationDialog(true)}
                        style={{borderRadius: "4px"}}
                        fullWidth
                        variant="outlined"
                        startIcon={<AddIcon/>}>
                        Risiko definieren
                    </Button>
                </Grid>
                <Grid size={10}>
                    <Typography>Filtern und Sortieren</Typography>
                </Grid>
                {
                    myRisks && myRisks.map((risk: Risk) => (
                        <MyRiskElement key={risk.id} risk={risk}/>
                    ))
                }
            </Grid>
            <MyRiskCreationDialog
                open={openRiskCreationDialog}
                handleClose={handleCloseDialog}
            />
        </React.Fragment>
    );
}
