import React, {useEffect, useRef} from "react";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import {ListItemAvatar} from "@mui/material";
import Avatar from "@mui/material/Avatar";
import {formatLastActivity} from "./utils";
import {
    ChatMessage, messagesUnsubscribe, selectActiveChatId,
    selectActiveMessages,
    selectOtherChatMemberName, subscribeToMessages
} from "../../store/slices/my-bids";
import {useDispatch, useSelector} from "react-redux";
import {auth} from "../../firebase_config";
import {AppDispatch, RootState} from "../../store/store";
import {MessageTypeEnum} from "../../enums/MessageTypeEnum";
import {Timestamp} from "firebase/firestore";

const toIsoString = (value?: string | Timestamp): string | undefined => {
    if (!value) {
        return undefined;
    }

    if (typeof value === "string") {
        return value;
    }

    if (value instanceof Date) {
        return value.toISOString();
    }

    try {
        return value.toDate().toISOString();
    } catch (error) {
        return undefined;
    }
};

export const ChatMessages = () => {
    const dispatch: AppDispatch = useDispatch();
    const activeChatId: string | null = useSelector(selectActiveChatId);
    const uid: string | undefined = auth.currentUser?.uid;
    const messages: ChatMessage[] = useSelector(selectActiveMessages);
    const otherChatMemberName: string = useSelector((state: RootState) => selectOtherChatMemberName(state, uid));
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (activeChatId) {
            dispatch(subscribeToMessages(activeChatId));
        }

        return () => {
            if (messagesUnsubscribe) {
                messagesUnsubscribe();
            }
        };
    }, [activeChatId, dispatch]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const hasMessages = messages.length > 0;
    const sortedMessages = hasMessages ? [...messages].reverse() : [];

    return (
        <>
            {hasMessages ? (
                <Box width="100%">
                    <Box sx={{height: '650px', overflow: 'auto', maxHeight: '800px'}} ref={scrollRef}>
                        <Box p={3}>
                            {sortedMessages.map((message) => {
                                const createdIso = toIsoString(message.created);
                                const createdLabel = createdIso ? formatLastActivity(createdIso) : undefined;
                                const key = `${message.id}_${createdIso ?? ''}`;
                                const isSystemMessage = message.type === MessageTypeEnum.SYSTEM;
                                const textContent = typeof message.content === 'string' ? message.content : '';
                                const imageSrc = typeof message.content === 'string' ? message.content : undefined;

                                if (isSystemMessage) {
                                    return (
                                        <Box key={key} display="flex" justifyContent="center" my={2}>
                                            <Typography variant="body2" color="text.secondary" textAlign="center">
                                                {textContent}
                                                {createdLabel ? ` · ${createdLabel}` : ''}
                                            </Typography>
                                        </Box>
                                    );
                                }

                                const isOwnMessage = message.uid === uid;

                                if (!isOwnMessage) {
                                    return (
                                        <Box key={key}>
                                            <Box display="flex">
                                                <ListItemAvatar>
                                                    <Avatar
                                                        alt={otherChatMemberName}
                                                        sx={{width: 40, height: 40}}
                                                    >
                                                        {otherChatMemberName?.[0] || ''}
                                                    </Avatar>
                                                </ListItemAvatar>
                                                <Box>
                                                    {createdLabel ? (
                                                        <Typography variant="body2" color="grey.400" mb={1}>
                                                            {otherChatMemberName}, {createdLabel}
                                                        </Typography>
                                                    ) : null}
                                                    {message.type === MessageTypeEnum.TEXT ? (
                                                        <Box
                                                            mb={2}
                                                            sx={{
                                                                borderRadius: "5px",
                                                                p: 1,
                                                                backgroundColor: 'grey.100',
                                                                mr: 'auto',
                                                                maxWidth: '320px',
                                                                fontFamily: 'Roboto'
                                                            }}>
                                                            {textContent}
                                                        </Box>
                                                    ) : null}
                                                    {message.type === MessageTypeEnum.IMAGE ? (
                                                        <Box mb={1} sx={{overflow: 'hidden', lineHeight: '0px'}}>
                                                            {imageSrc ? <img src={imageSrc} alt="attach" width="150"/> : null}
                                                        </Box>
                                                    ) : null}
                                                </Box>
                                            </Box>
                                        </Box>
                                    );
                                }

                                return (
                                    <Box key={key}
                                         mb={1}
                                         display="flex"
                                         alignItems="flex-end"
                                         flexDirection="row-reverse">
                                        <Box alignItems="flex-end" display="flex" flexDirection={'column'}>
                                            {createdLabel ? (
                                                <Typography variant="body2" color="grey.400" mb={1}>
                                                    Du, {createdLabel}
                                                </Typography>
                                            ) : null}
                                            {message.type === MessageTypeEnum.TEXT ? (
                                                <Box
                                                    mb={1}
                                                    sx={{
                                                        borderRadius: "5px",
                                                        p: 1,
                                                        backgroundColor: 'grey.200',
                                                        ml: 'auto',
                                                        maxWidth: '320px',
                                                        fontFamily: 'Roboto'
                                                    }}>
                                                    {textContent}
                                                </Box>
                                            ) : null}
                                            {message.type === MessageTypeEnum.IMAGE ? (
                                                <Box mb={1} sx={{overflow: 'hidden', lineHeight: '0px'}}>
                                                    {imageSrc ? <img src={imageSrc} alt="attach" width="250"/> : null}
                                                </Box>
                                            ) : null}
                                        </Box>
                                    </Box>
                                );
                            })}
                        </Box>
                    </Box>
                </Box>
            ) : (
                <Box display="flex" alignItems="center" p={2} pb={1} pt={1}>
                    <Typography variant="h4">Wähle einen Chat</Typography>
                </Box>
            )}
        </>
    );
}
