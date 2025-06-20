import {Card, CardActions, CardContent, Typography} from "@mui/material";
import Grid from "@mui/material/Grid2";
import {RiskStatusEnum} from "../../enums/RiskStatus.enum";
import Button from "@mui/material/Button";
import UndoIcon from "@mui/icons-material/Undo";
import SendIcon from "@mui/icons-material/Send";
import EditIcon from "@mui/icons-material/Edit";
import {deleteMyRisk, updateMyRisk} from "../../store/slices/my-risks";
import DeleteIcon from "@mui/icons-material/Delete";
import React from "react";
import {Risk} from "../../models/Risk";
import {AppDispatch} from "../../store/store";
import {useDispatch, useSelector} from "react-redux";
import {MyRiskEditDialog} from "./edit-dialog/my-risk-edit-dialog";
import {addRisk, deleteRisk} from "../../store/slices/risks";
import {auth} from "../../firebase_config";
import {selectProfileInformation} from "../../store/slices/user-profile";

export interface MyRiskElementProps {
    risk: Risk;
}

export const MyRiskElement = (props: MyRiskElementProps) => {
    const user = auth.currentUser;
    const profileInfos = useSelector(selectProfileInformation);
    const dispatch: AppDispatch = useDispatch();
    const [openRiskEditDialog, setOpenRiskEditDialog] = React.useState(false);

    const handlePublish = (): void => {
        if (!user || !user.uid) {
            console.error("User not authenticated or UID missing:", user);
            alert("Konnte Risiko nicht veröffentlichen, es gab Probleme mit der Authentifizierung.");
            return;
        }

        if (props.risk.status !== RiskStatusEnum.PUBLISHED) {
            const riskToPublish: Risk = {
                ...props.risk,
                publisher: {
                    name: user.displayName ? user.displayName : profileInfos.name,
                    uid: user.uid
                },
                status: RiskStatusEnum.PUBLISHED,
                publishedAt: new Date().toISOString()
            }

            dispatch(updateMyRisk(riskToPublish))
            dispatch(addRisk(riskToPublish))
        }
    }

    const handleWithdraw = (): void => {
        if (props.risk.status === RiskStatusEnum.PUBLISHED) {
            const riskToWithdraw: Risk = {
                ...props.risk,
                status: RiskStatusEnum.WITHDRAWN,
                withdrawnAt: new Date().toISOString()
            }

            dispatch(updateMyRisk(riskToWithdraw));
            dispatch(deleteRisk(riskToWithdraw.id));
        }
    }

    const handleDelete = (): void => {
        dispatch(deleteMyRisk(props.risk.id))
        dispatch(deleteRisk(props.risk.id))
    }

    return (
        <Grid size={{xs: 12, sm: 6, md: 3, lg: 2, xl: 2}} margin="10px">
            <Card elevation={2}>
                <CardContent>
                    <Grid container>
                        <Grid size={7}>
                            <Typography gutterBottom sx={{color: 'text.secondary', fontSize: 14}}>
                                {props.risk.createdAt && new Date(props.risk.createdAt).toLocaleDateString()}
                            </Typography>
                        </Grid>
                        <Grid size={5}>
                            {   // TODO: Enhance correct status check and button display
                                props.risk.status === RiskStatusEnum.PUBLISHED ? (
                                    <Button
                                        onClick={handleWithdraw}
                                        style={{borderRadius: "4px"}}
                                        variant="outlined"
                                        size="small"
                                        color="warning"
                                        startIcon={<UndoIcon/>}>
                                        Zurückziehen
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={handlePublish}
                                        style={{borderRadius: "4px"}}
                                        variant="outlined"
                                        size="small"
                                        color="success"
                                        startIcon={<SendIcon/>}>
                                        Veröffentlichen
                                    </Button>
                                )
                            }
                        </Grid>
                    </Grid>
                    <Typography variant="h5" component="div">
                        {props.risk.name}
                    </Typography>
                    <Typography sx={{color: 'text.secondary', mb: 1.5}}>
                        {props.risk.value} €
                    </Typography>
                    <Typography variant="body2">
                        {props.risk.description}
                    </Typography>
                </CardContent>
                <CardActions>
                    <Button
                        disabled={props.risk.status === RiskStatusEnum.PUBLISHED}
                        onClick={() => setOpenRiskEditDialog(true)}
                        size="small"
                        startIcon={<EditIcon/>}>
                        Bearbeiten
                    </Button>
                    <Button
                        disabled={props.risk.status === RiskStatusEnum.PUBLISHED}
                        onClick={handleDelete}
                        size="small"
                        color="error"
                        startIcon={<DeleteIcon/>}>
                        Löschen
                    </Button>
                </CardActions>
            </Card>
            <MyRiskEditDialog
                open={openRiskEditDialog}
                setOpen={setOpenRiskEditDialog}
                risk={props.risk}
            />
        </Grid>
    )
}
