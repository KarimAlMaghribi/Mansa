export interface Jamiah {
  id: number;
  name: string;
  monthlyContribution?: number;
  isPublic?: boolean;
  maxGroupSize?: number;
  cycles?: number;
  rate?: number;
  rateInterval?: 'WEEKLY' | 'MONTHLY';
  plannedStartDate?: string;
}
