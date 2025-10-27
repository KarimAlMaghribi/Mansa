import React, {useEffect} from "react";
import {Card} from "@mui/material";
import Container from "@mui/material/Container";
import {ChatSidebar} from "../../components/chat/chat-sidebar";
import Box from "@mui/material/Box";
import {ChatHeader} from "../../components/chat/chat-header";
import {ChatMessages} from "../../components/chat/chat-messages";
import {clearChatsSubscription, selectActiveChatId, setActiveChat, setChats, subscribeToMyChats} from "../../store/slices/my-bids";
import {AppDispatch} from "../../store/store";
import {useDispatch, useSelector} from "react-redux";
import {ChatSender} from "../../components/chat/chat-sender";
import {useParams} from "react-router-dom";
import {useAuth} from "../../context/AuthContext";


export const Chat = () => {
    const dispatch: AppDispatch = useDispatch();
    const activeChatId = useSelector(selectActiveChatId);
    const { chatId } = useParams<{ chatId?: string }>();
    const { user } = useAuth();

    useEffect(() => {
        if (!user?.uid) {
            clearChatsSubscription();
            dispatch(setChats([]));
            return;
        }

        dispatch(subscribeToMyChats());

        return () => {
            clearChatsSubscription();
        };
    }, [dispatch, user?.uid])

    useEffect(() => {
        if (chatId && chatId !== activeChatId) {
            dispatch(setActiveChat(chatId));
        }
    }, [chatId, dispatch, activeChatId]);

    return (
        <Container maxWidth={false}>
            <Card elevation={2} sx={{ display: 'flex', margin: "0 5% 0 5%"}}>
                <ChatSidebar/>
                <Box flexGrow={1}>
                    <ChatHeader />
                    <ChatMessages />
                    <ChatSender />
                </Box>
            </Card>
        </Container>

    )
}
