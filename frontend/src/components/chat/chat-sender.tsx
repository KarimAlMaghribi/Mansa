import React from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import {InputBase, Popover} from "@mui/material";
import SendIcon from '@mui/icons-material/Send';
import PhotoIcon from '@mui/icons-material/Photo';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import Picker from 'emoji-picker-react';
import SentimentSatisfiedAltIcon from '@mui/icons-material/SentimentSatisfiedAlt';
import {AppDispatch} from "../../store/store";
import {useDispatch, useSelector} from "react-redux";
import {selectActiveChatId, sendMessage} from "../../store/slices/my-bids";
import {MessageTypeEnum} from "../../enums/MessageTypeEnum";
import {auth} from "../../firebase_config";

export const ChatSender = () => {
    const dispatch: AppDispatch = useDispatch();
    const activeChatId: string | null = useSelector(selectActiveChatId);
    const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null);
    const [chosenEmoji, setChosenEmoji] = React.useState<any>();
    const [msg, setMsg] = React.useState<string>('');
    const msgType = MessageTypeEnum.TEXT;

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

    const onChatMsgSubmit = (e: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>) => {
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

        const trimmed = msg.trim();

        if (!trimmed) {
            setMsg('');
            return;
        }

        dispatch(sendMessage({
            chatId: activeChatId,
            message: {
                type: msgType,
                uid,
                content: trimmed,
                read: true,
            }
        }));
        setMsg('');
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            const uid = auth?.currentUser?.uid;
            if (!activeChatId || !uid) {
                return;
            }
            const trimmed = msg.trim();
            if (!trimmed) {
                setMsg('');
                return;
            }
            dispatch(sendMessage({
                chatId: activeChatId,
                message: {
                    type: msgType,
                    uid,
                    content: trimmed,
                    read: true,
                }
            }));
            setMsg('');
        }
    };

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
                    onChange={handleChatMsgChange}
                    onKeyDown={handleKeyDown}/>
                <IconButton
                    onClick={(event) => onChatMsgSubmit(event)}
                    disabled={!msg.trim()}
                    color="primary">
                    <SendIcon/>
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
