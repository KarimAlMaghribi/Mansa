import React, {useState} from "react";
import {Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, TextField} from "@mui/material";
import Button from "@mui/material/Button";
import {NumericFormat} from 'react-number-format';
import {useDispatch} from "react-redux";
import {AppDispatch} from "../../store/store";
import {v4 as uuidv4} from 'uuid';
import {addMyRiskAgreement} from "../../store/slices/my-risk-agreements";
import {useNavigate} from "react-router-dom";
import {ROUTES} from "../../routing/routes";

import { RiskAgreement } from "../../models/RiskAgreement";

export interface RiskAgreementDialogProps {
    open: boolean;
    handleClose: () => void;
}

const EuroNumberFormat = React.forwardRef(function EuroNumberFormat(props: any, ref) {
    const {onChange, ...other} = props;
    return (
        <NumericFormat
            {...other}
            getInputRef={ref}
            onValueChange={(values: any) => {
                onChange({
                    target: {
                        value: values.value,
                        name: props.name
                    }
                });
            }}
            thousandSeparator="."
            decimalSeparator=","
            prefix="€ "
        />
    );
});

export const MyRiskAgreementDialog = (props: RiskAgreementDialogProps) => {
    const navigate = useNavigate();
    const dispatch: AppDispatch = useDispatch();
    //const [date, setDate] = useState<Dayjs | null>(dayjs());
    const [riskType] = useState<string>("");
    const [costs, setCosts] = useState<number>(0);
    const [evidence] = useState<string>('');
    const [insuranceSum, setInsuranceSum] = useState<number>(0);
    //const [nameRequiredError, setNameRequiredError] = useState<boolean>(false);
    const [insuranceSumRequiredError] = useState<boolean>(false);
    const [costsRequiredError] = useState<boolean>(false);

    //useEffect(() => {
    //    if (!title && !nameRequiredError) {
    //        setNameRequiredError(true);
    //    }
//
    //    if (title && nameRequiredError) {
    //        setNameRequiredError(false);
    //    }
    //}, [title]);

    const handleCostsChange = (newCosts: number) => {
        if (!isNaN(newCosts)) {
            setCosts(newCosts);
        }
    }

    const handleInsuranceSumChange = (newInsuranceSum: number) => {
        if (!isNaN(newInsuranceSum)) {
            setInsuranceSum(newInsuranceSum);
        }
    }

    const handleClose = () => {
        //setTitle('');
        //setDescription('');
        //setRiskType([]);
        //setCosts(0);
        //setDate(dayjs());
        props.handleClose();
    }

    const handleCreateRiskAgreement = () => {
        //if (!title) {
        //    setNameRequiredError(true);
        //    return;
        //}

        const newRiskAgreement: RiskAgreement = {
            id: uuidv4(),
            //createdAt: new Date().toISOString(),
            //name: title,
            riskId: 0,
            riskTaker: NaN,
            riskGiver: NaN,
            chatroomId: NaN,
            chatId: "",
            typeOfRisk: riskType,
            insuranceSum: insuranceSum,
            costs: costs,
            timeFrame: "",
            evidence:evidence
            //status: RiskStatusEnum.DRAFT,
            //type: riskType,
            //value: value,
            //declinationDate: date?.toISOString() || 'kein Ablaufdatum',
        }

        dispatch(addMyRiskAgreement(newRiskAgreement));
        navigate(`/${ROUTES.MY_RISKS}`);
        handleClose();
    }

    return (
        <Dialog
            open={props.open}
            onClose={props.handleClose}>
            <DialogTitle>Risikovereinbarung</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Haltet nochmal fest, was vereinbart wurde!
                </DialogContentText>

                <br/>
                <TextField
                    margin="dense"
                    fullWidth
                    label="Risikogeber"
                    value={"Risikogeber XY"}
                    disabled={true}
                    name="riskGiver"
                    id="riskGiver"
                />
                <TextField
                    margin="dense"
                    fullWidth
                    label="Risikonehmer"
                    value={"Risikonehmer XY"}
                    disabled={true}
                    name="riskTaker"
                    id="riskTaker"
                />
                <TextField
                    margin="dense"
                    fullWidth
                    label="Zeitspanne"
                    value={"Zeitspanne XY"}
                    disabled={true}
                    name="timeFrame"
                    id="timeFrame"
                />
                <TextField
                    margin="dense"
                    fullWidth
                    label="Beweismittel"
                    value={"Beweismittel XY"}
                    disabled={true}
                    name="evidence"
                    id="evidence"
                />
                <TextField
                    margin="dense"
                    fullWidth
                    label="Kosten"
                    value={costs}
                    onChange={(event) => handleCostsChange(Number(event.target.value.replace(/€\s?|(,*)/g, '')))}
                    name="costs"
                    id="costs"
                    InputProps={{
                        inputComponent: EuroNumberFormat,
                    }}
                />
                <TextField
                    margin="dense"
                    fullWidth
                    label="Absicherungssumme"
                    value={insuranceSum}
                    onChange={(event) => handleInsuranceSumChange(Number(event.target.value.replace(/€\s?|(,*)/g, '')))}
                    name="insuranceSum"
                    id="insuranceSum"
                    InputProps={{
                        inputComponent: EuroNumberFormat,
                    }}
                />
            </DialogContent>
            <DialogActions>
                <Button
                    disabled={insuranceSumRequiredError || costsRequiredError}
                    variant="contained"
                    onClick={handleCreateRiskAgreement}>
                    Vereinbaren
                </Button>
                <Button
                    onClick={handleClose}
                    variant="outlined">
                    Abbrechen
                </Button>
            </DialogActions>
        </Dialog>
    )

}
