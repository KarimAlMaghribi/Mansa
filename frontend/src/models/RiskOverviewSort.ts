import {RiskOverviewHeaderEnum} from "../enums/RiskOverviewHeader.enum";
import {SortDirectionEnum} from "../enums/SortDirection.enum";

export interface RiskOverviewSort {
    name: RiskOverviewHeaderEnum;
    direction: SortDirectionEnum;
}
