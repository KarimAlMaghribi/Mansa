import React, {useState} from "react";
import {Paper, Typography} from "@mui/material";
import Slider from '@mui/material/Slider';
import {RiskOverviewFilterType} from "../../models/RiskOverviewFilterType";
import {AppDispatch} from "../../store/store";
import {
    changeFilterValue,
    changeRemainingTerm,
    clearFilters,
    selectFilterTypes,
    setFilterType
} from "../../store/slices/risks";
import {useDispatch, useSelector} from "react-redux";
import Button from "@mui/material/Button";
import {RiskTypeSelector} from "../my-risks/risk-type-selector";


export const RiskOverviewFilter = (props: RiskOverviewFilterType) => {
    const dispatch: AppDispatch = useDispatch();
    const [sliderValue, setSliderValue] = useState<number | number[]>(props.value);
    const [termValue, setTermValue] = useState<number | number[]>(props.remainingTerm);
    const filterTypes: string[] = useSelector(selectFilterTypes);

    const handleTypeChange = (type: string[]) => {
        dispatch(setFilterType(type));
    };

    const handleValueChange = (event: any, newValue: number | number[]) => {
        if (Array.isArray(newValue)) {
            setSliderValue(newValue);
        }
    };

    const handleValueChangeCommitted = (event: any, newValue: number | number[]) => {
        if (Array.isArray(newValue)) {
            dispatch(changeFilterValue(newValue));
        }
    };

    const handleTermChange = (event: any, newValue: number | number[]) => {
        if (Array.isArray(newValue)) {
            setTermValue(newValue);
        }
    };

    const handleTermChangeCommitted = (event: any, newValue: number | number[]) => {
        if (Array.isArray(newValue)) {
            dispatch(changeRemainingTerm(newValue));
        }
    };

    return (
        <Paper square={false} style={{margin: "5px", padding: "30px", marginTop: "10px"}} elevation={2}>
            <Typography variant="h6">Filter</Typography>
            <RiskTypeSelector value={filterTypes} setValue={handleTypeChange} textFieldVariant="standard" label="Risikoart"/>
            <Typography variant="button">Nennwert</Typography>
            <Slider
                value={sliderValue}
                onChange={handleValueChange}
                onChangeCommitted={handleValueChangeCommitted}
                min={0}
                max={200000}
                step={1}
                marks={[
                    {value: 0, label: '0€'},
                    {value: 75000, label: '75.000€'},
                    {value: 135000, label: '135.000€'},
                    {value: 200000, label: '200.000€'}
                ]}
                valueLabelDisplay="auto"
            />
            <Typography variant="button">Restlaufzeit</Typography>
            <Slider
                value={termValue}
                onChange={handleTermChange}
                onChangeCommitted={handleTermChangeCommitted}
                valueLabelDisplay="auto"
                min={1}
                max={24}
                marks={[
                    {value: 1, label: '< 1 Monat'},
                    {value: 12, label: '1 Jahr'},
                    {value: 24, label: '> 2 Jahre'},
                ]}
            />
            <Button variant="outlined" fullWidth onClick={() => dispatch(clearFilters())}>Zurücksetzen</Button>
        </Paper>
    )
}
