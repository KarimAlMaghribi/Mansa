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
import {CHATBOT_UID} from "../../constants/chatbot";
import Logo from "../../assests/imgs/jamiah_logo.png";

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
        console.log(scrollRef.current);
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    return (
        <>
            {
                messages ?
                    <Box width="100%">
                        <Box sx={{height: '650px', overflow: 'auto', maxHeight: '800px'}} ref={scrollRef}>
                            <Box p={3}>
                                {messages && [...messages].reverse().map((message) => {
                                    return (
                                        <Box key={message.id + "_" + message.created}>
                                            {message.uid !== uid ? (
                                                <>
                                                    <Box display="flex">
                                                        <ListItemAvatar>
                                                            <Avatar
                                                                alt={otherChatMemberName}
                                                                src={message.uid === CHATBOT_UID ? Logo : ''}
                                                                sx={{width: 40, height: 40}}
                                                            />
                                                        </ListItemAvatar>
                                                        <Box>
                                                            {message.created ? (
                                                                <Typography variant="body2" color="grey.400" mb={1}>
                                                                    {message.uid === CHATBOT_UID ? "XRisk-Chabot" : otherChatMemberName},{' '}
                                                                    {formatLastActivity(message.created)}
                                                                </Typography>
                                                            ) : null}
                                                            {message.type === MessageTypeEnum.TEXT ? (
                                                                <Box
                                                                    mb={2}
                                                                    sx={{
                                                                        borderRadius: "5px",
                                                                        p: 1,
                                                                        backgroundColor: message.uid === CHATBOT_UID ? 'primary.light' : 'grey.100',
                                                                        mr: 'auto',
                                                                        maxWidth: '320px',
                                                                        fontFamily: 'Roboto'
                                                                    }}>
                                                                    {message.content}
                                                                </Box>
                                                            ) : null}
                                                            {message.type === MessageTypeEnum.IMAGE ? (
                                                                <Box mb={1} sx={{overflow: 'hidden', lineHeight: '0px'}}>
                                                                    <img src={message.content} alt="attach" width="150"/>
                                                                </Box>
                                                            ) : null}
                                                        </Box>
                                                    </Box>
                                                </>
                                            ) : (
                                                <Box
                                                    mb={1}
                                                    display="flex"
                                                    alignItems="flex-end"
                                                    flexDirection="row-reverse">
                                                    <Box alignItems="flex-end" display="flex" flexDirection={'column'}>
                                                        {message.created ? (
                                                            <Typography variant="body2" color="grey.400" mb={1}>
                                                                Du, {formatLastActivity(message.created)}
                                                            </Typography>
                                                        ) : null}
                                                        {message.type === MessageTypeEnum.TEXT ? (
                                                            <Box
                                                                mb={1}
                                                                key={message.id}
                                                                sx={{
                                                                    borderRadius: "5px",
                                                                    p: 1,
                                                                    backgroundColor: 'grey.200',
                                                                    ml: 'auto',
                                                                    maxWidth: '320px',
                                                                    fontFamily: 'Roboto'
                                                                }}>
                                                                {message.content}
                                                            </Box>
                                                        ) : null}
                                                        {message.type === MessageTypeEnum.IMAGE ? (
                                                            <Box mb={1} sx={{overflow: 'hidden', lineHeight: '0px'}}>
                                                                <img src={message.content} alt="attach" width="250"/>
                                                            </Box>
                                                        ) : null}
                                                    </Box>
                                                </Box>
                                            )}
                                        </Box>
                                    );
                                })}
                            </Box>
                        </Box>
                    </Box> :
                    <Box display="flex" alignItems="center" p={2} pb={1} pt={1}>
                        <Typography variant="h4">Wähle einen Chat</Typography>
                    </Box>
            }
        </>
    )
}
