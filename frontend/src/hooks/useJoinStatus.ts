import { useCallback, useEffect, useState } from 'react';
import { fetchJoinStatus, JoinRequestStatus } from '../api/jamiah-status';

interface UseJoinStatusResult {
  status: JoinRequestStatus;
  rawStatus: string | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

export const useJoinStatus = (
  jamiahId?: string | null,
  uid?: string | null
): UseJoinStatusResult => {
  const [status, setStatus] = useState<JoinRequestStatus>('none');
  const [rawStatus, setRawStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!jamiahId || !uid) {
      setStatus('none');
      setRawStatus(null);
      setError(null);
      return;
    }
    setLoading(true);
    try {
      const result = await fetchJoinStatus(jamiahId, uid);
      setStatus(result.status);
      setRawStatus(result.rawStatus ?? null);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [jamiahId, uid]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (cancelled) return;
      await refresh();
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  return { status, rawStatus, loading, error, refresh };
};

export default useJoinStatus;

