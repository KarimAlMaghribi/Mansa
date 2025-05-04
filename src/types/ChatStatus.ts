import {ChatStatusEnum} from "../enums/ChatStatus.enum";

export type ChatStatus = ChatStatusEnum.ONLINE | ChatStatusEnum.BUSY | ChatStatusEnum.AWAY;
