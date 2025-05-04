import {createAsyncThunk, createSlice, PayloadAction} from "@reduxjs/toolkit";
import {MessageType} from "../../types/MessageType";
import {FetchStatusEnum} from "../../enums/FetchStatus.enum";
import {FetchStatus} from "../../types/FetchStatus";
import {collection, doc, getDocs, limit, onSnapshot, orderBy, query, setDoc, where} from "firebase/firestore";
import {auth, db} from "../../firebase_config";
import {ChatStatus} from "../../types/ChatStatus";
import {FirestoreCollectionEnum} from "../../enums/FirestoreCollectionEnum";


export interface ChatMessage {
    id: string;
    created: string;
    type: MessageType;
    uid: string;
    attachments?: any[];
    content: any; // string | audio | video | image
    read: boolean;
    prompt?: string;
}

export interface Chat {
    id: string;
    riskId: string;
    created: string;
    topic: string;
    riskProvider: {
        name?: string;
        uid?: string;
    };
    riskTaker: {
        name?: string;
        uid?: string;
    };
    lastMessage?: string;
    lastActivity: string;
    status?: ChatStatus;
}

export interface MyBidsState {
    chats: Chat[];
    chatSearch: string;
    activeChatId: string | null;
    loading: FetchStatus;
    error?: string | null;
    activeMessages: ChatMessage[];
}

const initialState: MyBidsState = {
    chats: [],
    chatSearch: "",
    activeChatId: null,
    loading: FetchStatusEnum.IDLE,
    activeMessages: [],
};

export let messagesUnsubscribe: (() => void) | null = null;

export const subscribeToMessages = createAsyncThunk<void, string, { rejectValue: string }>(
    "myBids/subscribeToMessages",
    async (chatId, {dispatch, rejectWithValue}) => {
        try {
            if (messagesUnsubscribe) {
                messagesUnsubscribe();
                messagesUnsubscribe = null;
            }
            const messagesRef = collection(db, FirestoreCollectionEnum.CHATS, chatId, FirestoreCollectionEnum.MESSAGES);
            const q = query(messagesRef, orderBy("created", "desc"));

            messagesUnsubscribe = onSnapshot(q, (snapshot) => {
                const messages = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                })) as ChatMessage[];
                dispatch(setMessages(messages));
            });
        } catch (error) {
            return rejectWithValue("Error subscribing to messages");
        }
    }
);

export const createChat = createAsyncThunk<Chat, Omit<Chat, "id">, { rejectValue: string }>(
    "myBids/createChat",
    async (chatData, {rejectWithValue}) => {
        try {
            const chatRef = doc(collection(db, FirestoreCollectionEnum.CHATS));

            const newChat: Chat = {
                ...chatData,
                id: chatRef.id,
            };

            console.log(newChat);

            await setDoc(chatRef, newChat);

            return newChat;
        } catch (error) {
            console.error("Error in createChat:", error);
            return rejectWithValue("Error creating chat");
        }
    }
);

export const fetchProviderChats = createAsyncThunk<
    Chat[],
    void,
    { rejectValue: string }
>(
    "myBids/fetchChats",
    async (_, {rejectWithValue, getState}) => {
        try {
            const userUid = auth.currentUser?.uid;
            if (!userUid) throw new Error("User not authenticated");

            const chatsRef = collection(db, "chats");

            const q = query(chatsRef, where("riskTaker.uid", "==", userUid));
            const querySnapshot = await getDocs(q);

            const chats = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Chat[];

            return chats;
        } catch (error) {
            console.error("Error fetching chats:", error);
            return rejectWithValue("Error fetching chats");
        }
    }
);

export const fetchMyChats = createAsyncThunk<Chat[], void, { rejectValue: string }>(
    "myBids/fetchMyChats",
    async (_, {rejectWithValue}) => {
        try {
            const userUid = auth.currentUser?.uid;
            if (!userUid) throw new Error("User not authenticated");

            const chatsRef = collection(db, "chats");

            const providerQuery = query(chatsRef, where("riskProvider.uid", "==", userUid));
            const providerSnapshot = await getDocs(providerQuery);

            const takerQuery = query(chatsRef, where("riskTaker.uid", "==", userUid));
            const takerSnapshot = await getDocs(takerQuery);

            const myChats = [
                ...providerSnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                })),
                ...takerSnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                })),
            ] as Chat[];

            return myChats;
        } catch (error) {
            console.error("Error fetching chats:", error);
            return rejectWithValue("Error fetching chats");
        }
    }
);

export const sendMessage = createAsyncThunk<
    void,
    { chatId: string; message: Omit<ChatMessage, "id" | "created"> },
    { rejectValue: string }
>(
    "myBids/sendMessage",
    async ({chatId, message}, {rejectWithValue}) => {
        try {
            const messageRef = doc(collection(db, FirestoreCollectionEnum.CHATS, chatId, FirestoreCollectionEnum.MESSAGES));
            const newMessage: ChatMessage = {
                ...message,
                id: messageRef.id,
                created: new Date().toISOString(),
            };
            await setDoc(messageRef, newMessage);
        } catch (error) {
            console.error("Error sending message:", error);
            return rejectWithValue("Error sending message");
        }
    }
);

export const fetchMessages = createAsyncThunk<ChatMessage[], string, { rejectValue: string }>(
    "myBids/fetchMessages",
    async (chatId, { rejectWithValue }) => {
        try {
            const messagesRef = collection(db, FirestoreCollectionEnum.CHATS, chatId, FirestoreCollectionEnum.MESSAGES);
            const q = query(messagesRef, orderBy("created", "desc"));
            // const q = query(messagesRef, orderBy("created", "desc"), limit(50));
            const querySnapshot = await getDocs(q);

            return querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as ChatMessage[];
        } catch (error) {
            console.error("Error fetching messages:", error);
            return rejectWithValue("Error fetching messages");
        }
    }
);

const myBidsSlice = createSlice({
        name: "myBids",
        initialState,
        reducers: {
            setChats(state, action: PayloadAction<Chat[]>) {
                state.chats = action.payload;
            },
            searchChats(state, action: PayloadAction<string>) {
                state.chats = state.chats.filter((chat) => chat.topic.includes(action.payload));
            },
            setActiveChat(state, action: PayloadAction<string>) {
                state.activeChatId = action.payload;
                state.activeMessages = [];
            },
            setChatStatus(state, action: PayloadAction<{ chatId: string, status: ChatStatus }>) {
                const chat = state.chats.find((chat) => chat.id === action.payload.chatId);
                if (chat) {
                    chat.status = action.payload.status;
                }
            },
            setMessages(state, action: PayloadAction<ChatMessage[]>) {
                state.activeMessages = action.payload;
            }
        },
        extraReducers: (builder) => {
            builder
                .addCase(subscribeToMessages.pending, (state) => {
                    state.loading = FetchStatusEnum.PENDING;
                    state.error = null;
                })
                .addCase(subscribeToMessages.fulfilled, (state) => {
                    state.loading = FetchStatusEnum.SUCCEEDED;
                })
                .addCase(subscribeToMessages.rejected, (state, action) => {
                    state.loading = FetchStatusEnum.FAILED;
                    state.error = action.payload as string;
                })
                .addCase(createChat.pending, (state) => {
                    state.loading = FetchStatusEnum.PENDING;
                    state.error = null;
                })
                .addCase(createChat.fulfilled, (state, action) => {
                    state.loading = FetchStatusEnum.SUCCEEDED;
                    if (!state.chats.find((chat) => chat.id === action.payload.id)) {
                        state.chats.push(action.payload);
                    }
                    state.activeChatId = action.payload.id;
                })
                .addCase(createChat.rejected, (state, action) => {
                    state.loading = FetchStatusEnum.FAILED;
                    state.error = action.payload as string;
                })
                .addCase(fetchProviderChats.pending, (state) => {
                    state.loading = FetchStatusEnum.PENDING;
                    state.error = null;
                })
                .addCase(fetchProviderChats.fulfilled, (state, action) => {
                    state.loading = FetchStatusEnum.SUCCEEDED;
                    state.chats = action.payload;
                })
                .addCase(fetchProviderChats.rejected, (state, action) => {
                    state.loading = FetchStatusEnum.FAILED;
                    state.error = action.payload as string;
                })
                .addCase(fetchMyChats.pending, (state) => {
                    state.loading = FetchStatusEnum.PENDING;
                    state.error = null;
                })
                .addCase(fetchMyChats.fulfilled, (state, action) => {
                    state.loading = FetchStatusEnum.SUCCEEDED;
                    state.chats = action.payload;
                })
                .addCase(fetchMyChats.rejected, (state, action) => {
                    state.loading = FetchStatusEnum.FAILED;
                    state.error = action.payload as string;
                });
        }
    }
);

export const selectChats = (state: { myBids: MyBidsState }) => state.myBids.chats;
export const selectActiveChat = (state: { myBids: MyBidsState }) => {
    return state.myBids.chats.find((chat) => chat.id === state.myBids.activeChatId);
}
export const selectActiveChatId = (state: { myBids: MyBidsState }) => state.myBids.activeChatId;
export const selectActiveMessages = (state: { myBids: MyBidsState }) => state.myBids.activeMessages;
export const selectOtherChatMemberName = (
    state: { myBids: MyBidsState },
    uid: string | undefined
): string => {
    if (!uid) {
        return "";
    }

    const activeChat: Chat | undefined = selectActiveChat(state);

    if (!activeChat) {
        return "";
    }

    const {riskProvider, riskTaker} = activeChat;

    if (riskProvider?.uid === uid) {
        return riskTaker?.name || "";
    } else if (riskTaker?.uid === uid) {
        return riskProvider?.name || "";
    }

    return "";
};

export const selectRiskId = (state: { myBids: MyBidsState }) => {
    const activeChat = selectActiveChat(state);
    return activeChat?.riskId;
}

export const {setChats, searchChats, setActiveChat, setChatStatus, setMessages} = myBidsSlice.actions;
export default myBidsSlice.reducer;
