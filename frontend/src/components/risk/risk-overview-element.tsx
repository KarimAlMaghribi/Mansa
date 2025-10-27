import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {Accordion, AccordionDetails, AccordionSummary, Typography} from "@mui/material";
import Grid from "@mui/material/Grid2";
import React from "react";
import {Risk} from "../../models/Risk";
import {FetchStatus} from "../../types/FetchStatus";
import Avatar from "@mui/material/Avatar";
import Tooltip from "@mui/material/Tooltip";
import Button from "@mui/material/Button";
import ModeIcon from '@mui/icons-material/Mode';
import {AppDispatch} from "../../store/store";
import {useDispatch, useSelector} from "react-redux";
import {Chat, createChat, selectChats, setActiveChat} from "../../store/slices/my-bids";
import {ChatStatusEnum} from "../../enums/ChatStatus.enum";
import {auth} from "../../firebase_config";
import {useNavigate} from "react-router-dom";

export interface RiskOverviewElementProps {
    risks: Risk[];
    status: FetchStatus;
}

export const RiskOverviewElement = (props: RiskOverviewElementProps) => {
    const user = auth.currentUser;
    const dispatch: AppDispatch = useDispatch();
    const navigate = useNavigate();
    const [expanded, setExpanded] = React.useState<string | false>(false);
    const chats: Chat[] = useSelector(selectChats);

    const handleChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
        setExpanded(isExpanded ? panel : false);
    };

    const openBid = (riskIndex: number) => {
        if (!user || !user.uid) {
            console.error("User not authenticated or UID missing:", user);
            alert("Konnte Verhandlung nicht starten, es gab Probleme mit der Authentifizierung.");
            return;
        }

        const selectedRisk = props.risks[riskIndex];

        if (!selectedRisk) {
            console.error("Selected risk not found:", selectedRisk);
            alert("Konnte Verhandlung nicht starten, das ausgewählte Risiko wurde nicht gefunden.");
            return;
        }

        if (selectedRisk.publisher?.uid === user.uid) {
            console.error("User tried to bid on his own risk:", selectedRisk, user);
            alert("Konnte Verhandlung nicht starten, du kannst nicht auf dein eigenes Risiko bieten.");
            return;
        }

        const chatAlreadyExists = chats.some((chat) => chat.riskId === selectedRisk.id && chat.riskTaker.uid === user.uid);

        if (chatAlreadyExists) {
            const existingChat = chats.find((chat) => chat.riskId === selectedRisk.id && chat.riskTaker.uid === user.uid);

            if (!existingChat) {
                console.error("Chat already exists but could not be found:", selectedRisk, user);
                return;
            }

            dispatch(setActiveChat(existingChat.id));
            navigate(`/chat`);
            return;
        }

        const newChat: Omit<Chat, "id"> = {
            riskId: selectedRisk.id,
            context: "risk",
            contextId: selectedRisk.id,
            created: new Date().toISOString(),
            lastActivity: new Date().toISOString(),
            topic: selectedRisk.name,
            status: ChatStatusEnum.ONLINE,
            participants: [
                selectedRisk.publisher?.uid || "",
                user?.uid || "",
            ].filter(Boolean) as string[],
            riskProvider: {
                name: selectedRisk.publisher?.name || "Unknown Provider",
                uid: selectedRisk.publisher?.uid || "unknown_provider_uid",
            },
            riskTaker: {
                name: user?.displayName || "Unknown Taker",
                uid: user.uid
            },
        };

        dispatch(createChat(newChat));
        navigate(`/chat`);
    }

    return (
        <React.Fragment>
            {
                props.risks && props.risks.map((risk: Risk, index) => (
                    <Accordion
                        key={risk.id ? risk.id : index}
                        expanded={expanded === risk.id}
                        onChange={handleChange(risk.id)}
                        sx={{ marginBottom: 2, width: '100%' }}>
                        <AccordionSummary
                            expandIcon={<ExpandMoreIcon />}
                            id={`panel-header-${risk.id}`}>
                            <Grid container size={12} spacing={2} alignItems="center">
                                <Grid size={2}>
                                    <Typography variant="body1" sx={{ cursor: 'pointer'}}>
                                        <b>{risk.name}</b>
                                    </Typography>
                                </Grid>

                                <Grid size={3}>
                                    <Typography variant="body1" sx={{ cursor: 'pointer'}}>
                                        <b>{risk.type}</b>
                                    </Typography>
                                </Grid>
                                <Grid size={3} sx={{marginLeft: "20px"}}>
                                    <Typography variant="body1" sx={{ cursor: 'pointer' }}>
                                        <b>{risk.value.toLocaleString()}€</b>
                                    </Typography>
                                </Grid>
                                <Grid size={2}>
                                    <Typography variant="body1" sx={{ cursor: 'pointer' }}>
                                        <b>{new Date(risk.declinationDate).toLocaleDateString()}</b>
                                    </Typography>
                                </Grid>
                                <Grid display="flex" justifyContent="center" alignItems="center" size={1}>
                                    {/* src wird durch eine Service funktion ersetzt, die das Bild des nutzers aus der
                                    Nutzerdatenbank lädt */}
                                    <Tooltip title={risk.publisher && risk.publisher.name}>
                                        <Avatar src=""/>
                                    </Tooltip>
                                </Grid>
                            </Grid>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Grid container>
                                <Grid size={8}>
                                    <Typography>
                                        <b>Kurzbeschreibung: </b>{risk.description}
                                    </Typography>
                                    {
                                        risk.createdAt &&
                                        <Grid container>
                                            <Grid size={6}>
                                                <Typography>
                                                    <b>Verfügbar seit: </b> {new Date(risk.createdAt).toLocaleDateString()}
                                                </Typography>
                                            </Grid>
                                            <Grid>
                                                <Typography>
                                                    <b>Verfügbar bis: </b> {new Date(risk.declinationDate).toLocaleDateString()}
                                                </Typography>
                                            </Grid>
                                        </Grid>
                                    }
                                    <Typography>
                                        <b>Anbieter: </b> {risk.publisher && risk.publisher.name}
                                    </Typography>
                                    <Typography>
                                        <b>Wohnort: </b> {risk.publisher && risk.publisher.address}
                                    </Typography>
                                </Grid>
                                <Grid size={4} style={{ display: 'flex', justifyContent: 'flex-end', paddingRight: "20px" }}>
                                    <Button
                                        disabled={risk.publisher?.uid === user?.uid}
                                        onClick={() => openBid(index)}
                                        variant="contained"
                                        endIcon={<ModeIcon />}
                                        style={{maxHeight: "40px", height: "40px"}}>
                                        Jetzt verhandeln
                                    </Button>
                                </Grid>
                            </Grid>

                        </AccordionDetails>
                    </Accordion>
                ))
            }
        </React.Fragment>
    );
};
