import {RiskStatusEnum} from "../enums/RiskStatus.enum";

export type RiskStatus =
    RiskStatusEnum.DRAFT |
    RiskStatusEnum.PUBLISHED |
    RiskStatusEnum.WITHDRAWN |
    RiskStatusEnum.DEAL |
    RiskStatusEnum.AGREEMENT ;
