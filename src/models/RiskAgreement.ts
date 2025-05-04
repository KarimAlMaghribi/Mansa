import {RiskStatus} from "../types/RiskStatus";
import {Publisher} from "./Publisher";

export interface RiskAgreement {
    id: string;
    riskId: number;
    riskTaker: number;
    riskGiver: number;
    chatroomId: number;
    chatId: string;
    typeOfRisk: string;
    insuranceSum: number;
    costs: number;
    timeFrame: string;
    evidence: string;
}
