import {RiskStatus} from "../types/RiskStatus";
import {Publisher} from "./Publisher";

export interface Risk {
    id: string;
    name: string; // title
    description: string;
    type: string[];
    value: number;
    publisher?: Publisher;
    declinationDate: string;
    createdAt?: string;
    updatedAt?: string;
    publishedAt?: string;
    withdrawnAt?: string;
    status?: RiskStatus;
    riskCategory?: string;
    riskProbability?: number;
}
