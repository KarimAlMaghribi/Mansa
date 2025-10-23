import { API_BASE_URL } from '../constants/api';

export type JoinRequestStatus = 'pending' | 'accepted' | 'rejected' | 'none';

export interface JoinStatusResult {
  status: JoinRequestStatus;
  rawStatus?: string | null;
  motivation?: string;
}

const mapStatus = (status?: string | null): JoinRequestStatus => {
  switch (status) {
    case 'PENDING':
      return 'pending';
    case 'APPROVED':
      return 'accepted';
    case 'REJECTED':
      return 'rejected';
    default:
      return 'none';
  }
};

/**
 * Fetch the join status for the given Jamiah and user uid.
 */
export const fetchJoinStatus = async (
  jamiahId: string,
  uid: string
): Promise<JoinStatusResult> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/jamiahs/${jamiahId}/join-public/status?uid=${encodeURIComponent(uid)}`
    );
    if (!response.ok) {
      throw new Error(`Join status request failed with ${response.status}`);
    }
    const data = await response.json();
    const status = mapStatus(data?.status);
    return {
      status,
      rawStatus: data?.status ?? null,
      motivation: data?.motivation,
    };
  } catch (error) {
    console.warn('[join-status] Failed to fetch join status', error);
    return { status: 'none' };
  }
};

export const normalizeAcceptedStatus = (status: JoinRequestStatus): JoinRequestStatus =>
  status === 'none' ? 'accepted' : status;

