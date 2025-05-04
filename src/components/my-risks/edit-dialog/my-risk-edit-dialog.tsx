import React, {useEffect, useState} from "react";
import {Dialog, DialogActions, DialogContent, DialogTitle, TextField} from "@mui/material";
import Button from "@mui/material/Button";
import {AppDispatch} from "../../../store/store";
import {useDispatch} from "react-redux";
import {updateMyRisk} from "../../../store/slices/my-risks";
import {Risk} from "../../../models/Risk";
import {LocalizationProvider} from "@mui/x-date-pickers";
import {AdapterDayjs} from "@mui/x-date-pickers/AdapterDayjs";
import {DatePicker} from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import {RiskTypeSelector} from "../risk-type-selector";

export interface MyRiskEditDialogProps {
    risk: Risk;
    open: boolean;
    setOpen: (visible: boolean) => void;
}

export const MyRiskEditDialog = (props: MyRiskEditDialogProps) => {
    const [riskType, setRiskType] = useState<string[]>(props.risk.type || []);
    const [risk, setRisk] = useState<Risk>(props.risk);
    const dispatch: AppDispatch = useDispatch();

    useEffect(() => {
        setRisk(props.risk);
        setRiskType(props.risk.type || []);
    }, [props.risk]);

    const handleSave = () => {
        const updatedRisk: Risk = {
            ...risk,
            type: riskType,
        };

        dispatch(updateMyRisk(updatedRisk));
        props.setOpen(false);
    };

    return (
        <Dialog
            fullWidth
            open={props.open}
            onClose={() => props.setOpen(false)}>
            <DialogTitle>Risiko bearbeiten</DialogTitle>
            <DialogContent style={{padding: "10px", margin: "10px"}}>
                <TextField
                    disabled
                    fullWidth
                    label="ID"
                    defaultValue={risk.id}
                    slotProps={{input: {readOnly: true}}}
                />
                <TextField
                    sx={{marginTop: "10px"}}
                    fullWidth
                    label="Kurzbeschreibung"
                    value={risk.description}
                    multiline
                    rows={5}
                    onChange={(event) => setRisk({...risk, description: event.target.value})}
                />
                <TextField
                    sx={{marginTop: "10px"}}
                    fullWidth
                    label="Name"
                    value={risk.name}
                    onChange={(event) => setRisk({...risk, name: event.target.value})}
                />
                <RiskTypeSelector value={riskType} setValue={setRiskType}/>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                        sx={{marginTop: "10px", width: "100%"}}
                        format="DD.MM.YYYY"
                        label="Laufzeitende"
                        value={dayjs(risk.declinationDate, "DD.MM.YYYY")}
                        onChange={(newValue) => {
                            if (newValue) {
                                if (!newValue.isAfter(dayjs())) {
                                    // date is older than today or today
                                    return;
                                }
                                setRisk({
                                    ...risk,
                                    declinationDate: dayjs(newValue).format("DD.MM.YYYY"),
                                });
                            }
                        }}
                        minDate={dayjs().add(1, "day")}
                    />
                </LocalizationProvider>
            </DialogContent>
            <DialogActions>
                <Button variant="contained" onClick={handleSave}>
                    Speichern
                </Button>
                <Button onClick={() => props.setOpen(false)} variant="outlined">
                    Abbrechen
                </Button>
            </DialogActions>
        </Dialog>
    );
};
