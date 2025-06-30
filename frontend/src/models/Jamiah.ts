export interface Jamiah {
  id?: string;
  name: string;
  monthlyContribution?: number;
  isPublic: boolean;
  maxGroupSize?: number;
  cycleCount?: number;
  rateAmount?: number;
  rateInterval?: 'WEEKLY' | 'MONTHLY';
  startDate?: string;
}
