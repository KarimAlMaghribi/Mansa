import {createAsyncThunk, createSlice, PayloadAction} from "@reduxjs/toolkit";
import {MessageType} from "../../types/MessageType";
import {FetchStatusEnum} from "../../enums/FetchStatus.enum";
import {FetchStatus} from "../../types/FetchStatus";
import {
    Timestamp,
    collection,
    doc,
    getDocs,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    updateDoc,
    where,
} from "firebase/firestore";
import {auth, db} from "../../firebase_config";
import {ChatStatus} from "../../types/ChatStatus";
import {FirestoreCollectionEnum} from "../../enums/FirestoreCollectionEnum";


export interface ChatMessage {
    id: string;
    created?: string | Timestamp;
    type: MessageType;
    uid: string;
    attachments?: any[];
    content: any; // string | audio | video | image
    read: boolean;
}

export type ChatContext = "risk" | "jamiah_request" | "jamiah_member" | "jamiah_group";

export interface ChatParticipant {
    name?: string;
    uid?: string;
    photoUrl?: string;
}

export interface Chat {
    id: string;
    riskId?: string;
    context?: ChatContext;
    contextId?: string;
    created: string | Timestamp;
    topic: string;
    riskProvider: ChatParticipant;
    riskTaker: ChatParticipant;
    lastMessage?: string;
    lastActivity?: string | Timestamp;
    status?: ChatStatus;
    participants?: string[];
    participantsKey?: string;
    kind?: "direct" | "group";
}

export interface MyBidsState {
    allChats: Chat[];
    chats: Chat[];
    chatSearch: string;
    activeChatId: string | null;
    loading: FetchStatus;
    error?: string | null;
    activeMessages: ChatMessage[];
}

const initialState: MyBidsState = {
    allChats: [],
    chats: [],
    chatSearch: "",
    activeChatId: null,
    loading: FetchStatusEnum.IDLE,
    activeMessages: [],
};

export let messagesUnsubscribe: (() => void) | null = null;

export let chatsUnsubscribe: (() => void) | null = null;

export const clearChatsSubscription = () => {
    if (chatsUnsubscribe) {
        chatsUnsubscribe();
        chatsUnsubscribe = null;
    }
};

const activityToMillis = (value?: string | Timestamp): number => {
    if (!value) {
        return 0;
    }

    if (typeof value === "string") {
        const parsed = Date.parse(value);
        return Number.isNaN(parsed) ? 0 : parsed;
    }

    if (value instanceof Date) {
        return value.getTime();
    }

    try {
        return value.toMillis();
    } catch (error) {
        return 0;
    }
};

const sortChats = (chats: Chat[]): Chat[] => {
    return [...chats].sort((a, b) => activityToMillis(b.lastActivity) - activityToMillis(a.lastActivity));
};

const applyChatSearch = (chats: Chat[], term: string): Chat[] => {
    if (!term) {
        return sortChats(chats);
    }

    const lowerTerm = term.toLowerCase();
    return sortChats(
        chats.filter((chat) => {
            const topicMatches = chat.topic?.toLowerCase().includes(lowerTerm);
            const providerMatches = chat.riskProvider?.name?.toLowerCase().includes(lowerTerm);
            const takerMatches = chat.riskTaker?.name?.toLowerCase().includes(lowerTerm);
            return Boolean(topicMatches || providerMatches || takerMatches);
        })
    );
};

const combineChats = (...lists: Chat[][]): Chat[] => {
    const map = new Map<string, Chat>();
    lists.forEach((list) => {
        list.forEach((chat) => {
            map.set(chat.id, chat);
        });
    });
    return Array.from(map.values());
};

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
                const messages = snapshot.docs.map((doc) => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        ...data,
                        created: data?.created,
                    } as ChatMessage;
                });
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
            const chatsRef = collection(db, FirestoreCollectionEnum.CHATS);
            const participants = Array.from(
                new Set(
                    (chatData.participants && chatData.participants.length > 0
                        ? chatData.participants
                        : [chatData.riskProvider?.uid, chatData.riskTaker?.uid]
                    ).filter((uid): uid is string => Boolean(uid))
                )
            ).sort();

            const participantsKey = participants.join("__");

            const isGroupChat =
                chatData.kind === "group" ||
                chatData.context === "jamiah_group" ||
                participants.length > 2;

            const constraints = [];

            if (!isGroupChat && participantsKey) {
                constraints.push(where("participantsKey", "==", participantsKey));
            }

            if (chatData.contextId) {
                constraints.push(where("contextId", "==", chatData.contextId));
            }

            if (chatData.context) {
                constraints.push(where("context", "==", chatData.context));
            }

            if (constraints.length > 0) {
                const existingQuery = query(chatsRef, ...constraints);
                const existingSnapshot = await getDocs(existingQuery);
                if (!existingSnapshot.empty) {
                    const existing = existingSnapshot.docs[0];
                    return {id: existing.id, ...existing.data()} as Chat;
                }
            }

            const chatRef = doc(chatsRef);
            const createdAt = typeof chatData.created === "string" ? chatData.created : new Date().toISOString();
            const lastActivity = typeof chatData.lastActivity === "string" ? chatData.lastActivity : createdAt;

            const newChat: Chat = {
                ...chatData,
                id: chatRef.id,
                created: createdAt,
                lastActivity,
                participants,
                participantsKey: !isGroupChat && participantsKey ? participantsKey : undefined,
                kind: isGroupChat ? "group" : "direct",
            };

            await setDoc(chatRef, {
                ...newChat,
                participants,
                participantsKey: !isGroupChat && participantsKey ? participantsKey : undefined,
                updatedAt: serverTimestamp(),
            });

            return newChat;
        } catch (error) {
            console.error("Error in createChat:", error);
            return rejectWithValue("Error creating chat");
        }
    }
);

export const subscribeToMyChats = createAsyncThunk<void, void, { rejectValue: string }>(
    "myBids/subscribeToMyChats",
    async (_, {rejectWithValue, dispatch}) => {
        const userUid = auth.currentUser?.uid;

        if (!userUid) {
            clearChatsSubscription();
            dispatch(setChats([]));
            return;
        }

        try {
            clearChatsSubscription();

            const chatsRef = collection(db, FirestoreCollectionEnum.CHATS);
            const providerQuery = query(chatsRef, where("riskProvider.uid", "==", userUid));
            const takerQuery = query(chatsRef, where("riskTaker.uid", "==", userUid));
            const groupQuery = query(
                chatsRef,
                where("participants", "array-contains", userUid),
                where("kind", "==", "group")
            );

            let providerChats: Chat[] = [];
            let takerChats: Chat[] = [];
            let groupChats: Chat[] = [];

            const emit = () => {
                dispatch(setChats(combineChats(providerChats, takerChats, groupChats)));
            };

            const providerUnsub = onSnapshot(providerQuery, (snapshot) => {
                providerChats = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                })) as Chat[];
                emit();
            });

            const takerUnsub = onSnapshot(takerQuery, (snapshot) => {
                takerChats = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                })) as Chat[];
                emit();
            });

            const groupUnsub = onSnapshot(groupQuery, (snapshot) => {
                groupChats = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                })) as Chat[];
                emit();
            });

            chatsUnsubscribe = () => {
                providerUnsub();
                takerUnsub();
                groupUnsub();
                chatsUnsubscribe = null;
            };
        } catch (error) {
            console.error("Error subscribing to chats:", error);
            return rejectWithValue("Error subscribing to chats");
        }
    }
);

export const fetchProviderChats = createAsyncThunk<
    Chat[],
    void,
    { rejectValue: string }
>(
    "myBids/fetchChats",
    async (_, {rejectWithValue}) => {
        const userUid = auth.currentUser?.uid;

        if (!userUid) {
            return [];
        }

        try {
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
        const userUid = auth.currentUser?.uid;

        if (!userUid) {
            return [];
        }

        try {
            const chatsRef = collection(db, "chats");

            const providerQuery = query(chatsRef, where("riskProvider.uid", "==", userUid));
            const providerSnapshot = await getDocs(providerQuery);

            const takerQuery = query(chatsRef, where("riskTaker.uid", "==", userUid));
            const takerSnapshot = await getDocs(takerQuery);

            const providerChats = providerSnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Chat[];
            const takerChats = takerSnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Chat[];

            const myChats = combineChats(providerChats, takerChats);

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
            const now = new Date();
            const preview = typeof message.content === "string" ? message.content.slice(0, 280) : "Neue Nachricht";
            await setDoc(messageRef, {
                ...message,
                read: message.read ?? false,
                id: messageRef.id,
                created: serverTimestamp(),
            });

            try {
                await updateDoc(doc(db, FirestoreCollectionEnum.CHATS, chatId), {
                    lastMessage: preview,
                    lastActivity: now.toISOString(),
                    updatedAt: serverTimestamp(),
                });
            } catch (error) {
                console.warn("Failed to update chat metadata after sending message", error);
            }
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
                state.allChats = sortChats(action.payload);
                state.chats = applyChatSearch(state.allChats, state.chatSearch);
            },
            setChatSearch(state, action: PayloadAction<string>) {
                state.chatSearch = action.payload;
                state.chats = applyChatSearch(state.allChats, state.chatSearch);
            },
            setActiveChat(state, action: PayloadAction<string>) {
                state.activeChatId = action.payload;
                state.activeMessages = [];
            },
            setChatStatus(state, action: PayloadAction<{ chatId: string, status: ChatStatus }>) {
                const updateStatus = (chat: Chat | undefined) => {
                    if (chat) {
                        chat.status = action.payload.status;
                    }
                };

                updateStatus(state.allChats.find((chat) => chat.id === action.payload.chatId));
                updateStatus(state.chats.find((chat) => chat.id === action.payload.chatId));
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
                    const existingIndex = state.allChats.findIndex((chat) => chat.id === action.payload.id);
                    if (existingIndex === -1) {
                        state.allChats.push(action.payload);
                    } else {
                        state.allChats[existingIndex] = {
                            ...state.allChats[existingIndex],
                            ...action.payload,
                        };
                    }
                    state.chats = applyChatSearch(state.allChats, state.chatSearch);
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
                    state.allChats = sortChats(action.payload);
                    state.chats = applyChatSearch(state.allChats, state.chatSearch);
                })
                .addCase(fetchProviderChats.rejected, (state, action) => {
                    state.loading = FetchStatusEnum.FAILED;
                    state.error = action.payload as string;
                })
                .addCase(subscribeToMyChats.pending, (state) => {
                    state.loading = FetchStatusEnum.PENDING;
                    state.error = null;
                })
                .addCase(subscribeToMyChats.fulfilled, (state) => {
                    state.loading = FetchStatusEnum.SUCCEEDED;
                })
                .addCase(subscribeToMyChats.rejected, (state, action) => {
                    state.loading = FetchStatusEnum.FAILED;
                    state.error = action.payload as string;
                })
                .addCase(fetchMyChats.pending, (state) => {
                    state.loading = FetchStatusEnum.PENDING;
                    state.error = null;
                })
                .addCase(fetchMyChats.fulfilled, (state, action) => {
                    state.loading = FetchStatusEnum.SUCCEEDED;
                    state.allChats = sortChats(action.payload);
                    state.chats = applyChatSearch(state.allChats, state.chatSearch);
                })
                .addCase(fetchMyChats.rejected, (state, action) => {
                    state.loading = FetchStatusEnum.FAILED;
                    state.error = action.payload as string;
                });
        }
    }
);

export const selectAllChats = (state: { myBids: MyBidsState }) => state.myBids.allChats;
export const selectChats = (state: { myBids: MyBidsState }) => state.myBids.chats;
export const selectActiveChat = (state: { myBids: MyBidsState }) => {
    const activeId = state.myBids.activeChatId;
    if (!activeId) {
        return undefined;
    }

    return (
        state.myBids.allChats.find((chat) => chat.id === activeId) ||
        state.myBids.chats.find((chat) => chat.id === activeId)
    );
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

export const {setChats, setChatSearch, setActiveChat, setChatStatus, setMessages} = myBidsSlice.actions;
export default myBidsSlice.reducer;
