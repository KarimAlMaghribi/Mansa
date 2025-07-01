export interface Jamiah {
  id?: string;
  name: string;
  description?: string;
  language?: string;
  isPublic: boolean;
  maxGroupSize?: number;
  cycleCount?: number;
  rateAmount?: number;
  rateInterval?: 'WEEKLY' | 'MONTHLY';
  startDate?: string;
}
