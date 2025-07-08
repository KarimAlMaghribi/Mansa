export interface Jamiah {
  id?: string;
  /** UID of the user who created the Jamiah. */
  ownerId?: string;
  name: string;
  description?: string;
  language?: string;
  isPublic: boolean;
  maxGroupSize?: number;
  maxMembers?: number;
  currentMembers?: number;
  cycleCount?: number;
  rateAmount?: number;
  rateInterval?: 'WEEKLY' | 'MONTHLY';
  startDate?: string;
}
