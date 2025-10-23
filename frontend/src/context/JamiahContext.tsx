import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { auth } from '../firebase_config';
import { useAuth } from './AuthContext';
import { API_BASE_URL } from '../constants/api';
import { Jamiah } from '../models/Jamiah';

export interface JamiahMember {
  id: number;
  uid?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
}

export interface JamiahJoinRequest {
  id: number;
  userUid: string;
  motivation?: string;
  status: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  profileId?: number;
}

export interface JamiahCycle {
  id: string;
  cycleNumber?: number;
  memberOrder?: string[];
  recipient?: {
    uid?: string;
    username?: string;
    firstName?: string;
    lastName?: string;
  };
  status?: string;
  startDate?: string;
  endDate?: string;
}

export interface JamiahPayment {
  id: string;
  status?: string;
  createdAt?: string;
  amount?: number;
  user?: {
    uid?: string;
    username?: string;
    firstName?: string;
    lastName?: string;
  };
}

interface JamiahRoles {
  isOwner: boolean;
  isPayer: boolean;
  isRecipient: boolean;
  hasOpenPayment: boolean;
}

interface JamiahStatus {
  pendingJoinRequests: number;
  needsSetup: boolean;
  nextPaymentLabel?: string;
}

interface JamiahContextValue {
  jamiah: Jamiah | null;
  members: JamiahMember[];
  cycle: JamiahCycle | null;
  payments: JamiahPayment[];
  joinRequests: JamiahJoinRequest[];
  pendingRequests: JamiahJoinRequest[];
  roles: JamiahRoles;
  status: JamiahStatus;
  currentUid: string | null;
  loading: boolean;
  refresh: () => Promise<void>;
  respondToJoinRequest: (requestId: number, accept: boolean) => Promise<boolean>;
}

const JamiahContext = createContext<JamiahContextValue | undefined>(undefined);

export const useJamiahContext = () => {
  const ctx = useContext(JamiahContext);
  if (!ctx) {
    throw new Error('useJamiahContext must be used within a JamiahProvider');
  }
  return ctx;
};

interface JamiahProviderProps {
  groupId?: string;
  children: React.ReactNode;
}

export const JamiahProvider: React.FC<JamiahProviderProps> = ({ groupId, children }) => {
  const { user } = useAuth();
  const currentUid = user?.uid ?? auth.currentUser?.uid ?? null;
  const [jamiah, setJamiah] = useState<Jamiah | null>(null);
  const [members, setMembers] = useState<JamiahMember[]>([]);
  const [cycle, setCycle] = useState<JamiahCycle | null>(null);
  const [payments, setPayments] = useState<JamiahPayment[]>([]);
  const [joinRequests, setJoinRequests] = useState<JamiahJoinRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchJoinRequests = useCallback(
    async (ownerUid: string, jamiahId: string) => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/jamiahs/${jamiahId}/join-requests?uid=${ownerUid}`
        );
        if (!response.ok) {
          throw new Error('Failed to load join requests');
        }
        const data: JamiahJoinRequest[] = await response.json();
        const enriched = await Promise.all(
          data.map(async (request) => {
            try {
              const profileResponse = await fetch(
                `${API_BASE_URL}/api/userProfiles/uid/${request.userUid}`
              );
              if (!profileResponse.ok) {
                throw new Error('profile not found');
              }
              const profile = await profileResponse.json();
              const { id: profileId, ...profileData } = profile ?? {};
              return { ...request, ...profileData, profileId };
            } catch (error) {
              console.warn(
                `[jamiah-context] Profil konnte nicht geladen werden für ${request.userUid}`,
                error
              );
              return request;
            }
          })
        );
        setJoinRequests(enriched);
      } catch (error) {
        console.error('[jamiah-context] Fehler beim Laden der Bewerbungen', error);
        setJoinRequests([]);
      }
    },
    []
  );

  const refresh = useCallback(async () => {
    if (!groupId) return;
    setLoading(true);
    try {
      const jamiahResponse = await fetch(`${API_BASE_URL}/api/jamiahs/${groupId}`);
      if (jamiahResponse.ok) {
        const jamiahData = await jamiahResponse.json();
        setJamiah(jamiahData);
        if (currentUid && jamiahData.ownerId === currentUid) {
          await fetchJoinRequests(currentUid, groupId);
        } else {
          setJoinRequests([]);
        }
      } else {
        setJamiah(null);
        setJoinRequests([]);
      }

      const membersResponse = await fetch(`${API_BASE_URL}/api/jamiahs/${groupId}/members`);
      if (membersResponse.ok) {
        const data = await membersResponse.json();
        setMembers(Array.isArray(data) ? data : []);
      } else {
        setMembers([]);
      }

      const cyclesResponse = await fetch(`${API_BASE_URL}/api/jamiahs/${groupId}/cycles`);
      if (cyclesResponse.ok) {
        const data = await cyclesResponse.json();
        if (Array.isArray(data) && data.length > 0) {
          const activeCycle = data[data.length - 1];
          setCycle(activeCycle);
          if (activeCycle?.id) {
            const paymentsResponse = await fetch(
              `${API_BASE_URL}/api/jamiahs/${groupId}/cycles/${activeCycle.id}/payments`
            );
            if (paymentsResponse.ok) {
              const paymentsData = await paymentsResponse.json();
              setPayments(Array.isArray(paymentsData) ? paymentsData : []);
            } else {
              setPayments([]);
            }
          } else {
            setPayments([]);
          }
        } else {
          setCycle(null);
          setPayments([]);
        }
      } else {
        setCycle(null);
        setPayments([]);
      }
    } catch (error) {
      console.error('[jamiah-context] Fehler beim Laden der Jamiah-Daten', error);
      setJamiah(null);
      setMembers([]);
      setCycle(null);
      setPayments([]);
      setJoinRequests([]);
    } finally {
      setLoading(false);
    }
  }, [groupId, currentUid, fetchJoinRequests]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const respondToJoinRequest = useCallback(
    async (requestId: number, accept: boolean) => {
      if (!groupId || !currentUid) return false;
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/jamiahs/${groupId}/join-requests/${requestId}?uid=${currentUid}&accept=${accept}`,
          { method: 'POST' }
        );
        if (!response.ok) {
          throw new Error('decision failed');
        }
        await refresh();
        return true;
      } catch (error) {
        console.error('[jamiah-context] Entscheidung für Beitrittsanfrage fehlgeschlagen', error);
        return false;
      }
    },
    [groupId, currentUid, refresh]
  );

  const roles: JamiahRoles = useMemo(() => {
    const isOwner = Boolean(jamiah && currentUid && jamiah.ownerId === currentUid);
    const memberUids = cycle?.memberOrder ?? members.map((m) => m.uid).filter(Boolean) as string[];
    const isMember = Boolean(currentUid && memberUids?.includes(currentUid));
    const isRecipient = Boolean(currentUid && cycle?.recipient?.uid === currentUid);
    const hasPaid = Boolean(currentUid && payments.some((p) => p.user?.uid === currentUid));
    const hasOpenPayment = Boolean(isMember && !hasPaid);

    return {
      isOwner,
      isPayer: isMember,
      isRecipient,
      hasOpenPayment,
    };
  }, [jamiah, currentUid, cycle, members, payments]);

  const pendingRequests = useMemo(
    () => joinRequests.filter((request) => request.status === 'PENDING'),
    [joinRequests]
  );

  const status: JamiahStatus = useMemo(() => {
    const needsSetup = Boolean(roles.isOwner && (!cycle || (cycle.memberOrder?.length ?? 0) === 0));
    const nextPaymentLabel = roles.hasOpenPayment ? 'Zahlung offen' : undefined;
    return {
      pendingJoinRequests: pendingRequests.length,
      needsSetup,
      nextPaymentLabel,
    };
  }, [pendingRequests.length, roles, cycle]);

  const value = useMemo(
    () => ({
      jamiah,
      members,
      cycle,
      payments,
      joinRequests,
      pendingRequests,
      roles,
      status,
      currentUid,
      loading,
      refresh,
      respondToJoinRequest,
    }),
    [jamiah, members, cycle, payments, joinRequests, pendingRequests, roles, status, currentUid, loading, refresh, respondToJoinRequest]
  );

  return <JamiahContext.Provider value={value}>{children}</JamiahContext.Provider>;
};

