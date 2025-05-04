import {Autocomplete, Chip, TextField} from "@mui/material";
import React, {useEffect} from "react";
import {AppDispatch} from "../../store/store";
import {useDispatch, useSelector} from "react-redux";
import {addRiskType, fetchRiskTypes, selectStatus, selectTypes} from "../../store/slices/risks";
import {FetchStatusEnum} from "../../enums/FetchStatus.enum";

export interface RiskTypeSelectorProps {
    value: string[];
    setValue: (value: any) => void;
    required?: boolean;
    textFieldVariant?: "standard" | "outlined" | "filled";
    label?: string;
}

export const RiskTypeSelector = (props: RiskTypeSelectorProps) => {
    const dispatch: AppDispatch = useDispatch();
    const types: string[] = useSelector(selectTypes);
    const status: FetchStatusEnum = useSelector(selectStatus);

    useEffect(() => {
        const unsubscribe: any = dispatch(fetchRiskTypes());
        return () => {
            if (typeof unsubscribe === "function") {
                unsubscribe();
            }
        };
    }, [dispatch]);

    const handleTagsChange = async (event: any, newValue: string[]) => {
        const uniqueTypes: string[] = newValue.filter((type) => !types.includes(type));
        if (uniqueTypes.length > 0) {
            for (const newType of uniqueTypes) {
                try {
                    await dispatch(addRiskType(newType));
                } catch (error) {
                    console.error(`Error saving new riskType: "${newType}":`, error);
                }
            }
        }
        props.setValue(newValue);
    };

    return (
        <Autocomplete
            sx={{marginTop: "10px"}}
            multiple
            freeSolo
            options={types}
            loading={status === FetchStatusEnum.PENDING}
            value={props.value} // Nutze props.value direkt
            onChange={handleTagsChange}
            getOptionLabel={(option: any) => (typeof option === "string" ? option : option?.label || "")}
            renderTags={(value: readonly string[], getTypeProps) =>
                value.map((option: string, index: number) => {
                    const {key, ...tagProps} = getTypeProps({index});
                    return (
                        <Chip
                            key={index}
                            variant="outlined"
                            label={option}
                            {...tagProps}
                        />
                    );
                })
            }
            renderInput={(params) => (
                <TextField
                    required={props.required}
                    {...params}
                    variant={props.textFieldVariant || "outlined"}
                    label={props.label || "Typ"}
                    placeholder="Risikotyp hinzufügen"
                />
            )}
        />
    );
};

