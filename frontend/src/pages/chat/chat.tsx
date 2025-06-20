import React, {useEffect} from "react";
import {Card} from "@mui/material";
import Container from "@mui/material/Container";
import {ChatSidebar} from "../../components/chat/chat-sidebar";
import Box from "@mui/material/Box";
import {ChatHeader} from "../../components/chat/chat-header";
import {ChatMessages} from "../../components/chat/chat-messages";
import {fetchMyChats} from "../../store/slices/my-bids";
import {AppDispatch} from "../../store/store";
import {useDispatch} from "react-redux";
import {ChatSender} from "../../components/chat/chat-sender";


export const Chat = () => {
    const dispatch: AppDispatch = useDispatch();

    useEffect(() => {
        dispatch(fetchMyChats());
    }, [dispatch])

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
