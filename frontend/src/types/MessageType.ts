import {MessageTypeEnum} from "../enums/MessageTypeEnum";

export type MessageType =
    | MessageTypeEnum.TEXT
    | MessageTypeEnum.AUDIO
    | MessageTypeEnum.VIDEO
    | MessageTypeEnum.IMAGE
    | MessageTypeEnum.SYSTEM;
