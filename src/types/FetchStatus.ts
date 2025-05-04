import {FetchStatusEnum} from "../enums/FetchStatus.enum";

export type FetchStatus = FetchStatusEnum.IDLE | FetchStatusEnum.PENDING | FetchStatusEnum.SUCCEEDED | FetchStatusEnum.FAILED;
