import React from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import {CircularProgress, InputBase, Popover} from "@mui/material";
import SendIcon from '@mui/icons-material/Send';
import PhotoIcon from '@mui/icons-material/Photo';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import Picker from 'emoji-picker-react';
import SentimentSatisfiedAltIcon from '@mui/icons-material/SentimentSatisfiedAlt';
import {AppDispatch} from "../../store/store";
import {useDispatch, useSelector} from "react-redux";
import {
    ChatMessage,
    selectActiveChatId,
    selectActiveMessages,
    selectRiskId,
    sendMessage
} from "../../store/slices/my-bids";
import {MessageTypeEnum} from "../../enums/MessageTypeEnum";
import {auth} from "../../firebase_config";
import AssistantIcon from '@mui/icons-material/Assistant';
import OpenAI from "openai";
import {Chatbot} from "./chatbot";
import {selectRiskById, selectRisks} from "../../store/slices/risks";
import {Risk} from "../../models/Risk";
import {CHATBOT_UID} from "../../constants/chatbot";

export const ChatSender = () => {
    const dispatch: AppDispatch = useDispatch();
    const activeChatId: string | null = useSelector(selectActiveChatId);
    const activeMessages: ChatMessage[] = useSelector(selectActiveMessages);
    const riskId = useSelector(selectRiskId);
    const risks = useSelector(selectRisks);
    const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null);
    const [chosenEmoji, setChosenEmoji] = React.useState<any>();
    const [msg, setMsg] = React.useState<any>('');
    const [aiLoading, setAILoading] = React.useState<boolean>(false);
    const [msgType, setMsgType] = React.useState<MessageTypeEnum>(MessageTypeEnum.TEXT);
    const openai = new OpenAI({apiKey: process.env.REACT_APP_OPENAI_API_KEY, dangerouslyAllowBrowser: true});

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    const onEmojiClick = (_event: any, emojiObject: any) => {
        setChosenEmoji(emojiObject);
        setMsg(msg + emojiObject.emoji);
    };

    const handleChatMsgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setMsg(e.target.value);
    };

    const onChatMsgSubmit = (e: any) => {
        const uid = auth?.currentUser?.uid;

        if (!activeChatId) {
            console.error("No active chat found:", activeChatId);
            return;
        }

        if (!uid) {
            console.error("User not authenticated or UID missing:", auth.currentUser);
            return;
        }

        e.preventDefault();
        e.stopPropagation();

        const newMessage: ChatMessage = {
            id: "1",
            created: new Date().toISOString(),
            type: msgType,
            uid: uid,
            content: msg,
            read: false
        }

        dispatch(sendMessage({chatId: activeChatId, message: newMessage}));
        setMsg('');
    };

    const onAIChatMsgSubmit = async (e: any) => {
        onChatMsgSubmit(e);
        setAILoading(true);

        const risk: Risk | undefined = risks.find(risk => risk.id === riskId)
        const chatbot = new Chatbot(risk, activeMessages);
        const prompt: string = chatbot.getPrompt();

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{role: "user", content: prompt}],
            stream: false,
        });

        const xRiskChatbotResponse: string = response.choices[0]?.message?.content || "";

        if (!xRiskChatbotResponse) {
            console.error("No response from OpenAI:", response);
            return;
        }

        const newMessage: ChatMessage = {
            id: CHATBOT_UID,
            created: new Date().toISOString(),
            type: MessageTypeEnum.TEXT,
            uid: CHATBOT_UID,
            content: xRiskChatbotResponse,
            read: false,
            prompt: prompt
        }

        if (!activeChatId) {
            console.error("No active chat found:", activeChatId);
            return;
        }

        dispatch(sendMessage({chatId: activeChatId, message: newMessage}));
        setAILoading(false);
    }

    return (
        <Box p={2}>
            <form
                onSubmit={onChatMsgSubmit}
                style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                <IconButton
                    aria-label="more"
                    id="long-button"
                    aria-controls="long-menu"
                    aria-expanded="true"
                    aria-haspopup="true"
                    onClick={handleClick}>
                    <SentimentSatisfiedAltIcon/>
                </IconButton>
                <Popover
                    id="long-menu"
                    anchorEl={anchorEl}
                    keepMounted
                    open={Boolean(anchorEl)}
                    onClose={handleClose}
                    anchorOrigin={{horizontal: 'right', vertical: 'bottom'}}
                    transformOrigin={{horizontal: 'right', vertical: 'bottom'}}>
                    <Picker onEmojiClick={onEmojiClick}/>
                    <Box p={2}>Selected: {chosenEmoji ? chosenEmoji.emoji : ''}</Box>
                </Popover>
                <InputBase
                    id="msg-sent"
                    fullWidth
                    value={msg}
                    placeholder="Gebe eine Nachricht ein..."
                    size="small"
                    type="text"
                    inputProps={{'aria-label': 'Type a Message'}}
                    onChange={handleChatMsgChange.bind(null)}/>
                <IconButton
                    onClick={onChatMsgSubmit}
                    disabled={!msg}
                    color="primary">
                    <SendIcon/>
                </IconButton>
                <IconButton
                    color="secondary"
                    onClick={onAIChatMsgSubmit}
                    disabled={!msg || aiLoading}>
                    {aiLoading ? <CircularProgress size={24} color="inherit" /> : <AssistantIcon />}
                </IconButton>
                <IconButton>
                    <PhotoIcon/>
                </IconButton>
                <IconButton>
                    <AttachFileIcon/>
                </IconButton>
            </form>
        </Box>
    )
}
