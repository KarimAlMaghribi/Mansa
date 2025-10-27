import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import SettingsSuggestIcon from '@mui/icons-material/SettingsSuggest';
import PaymentsIcon from '@mui/icons-material/Payments';
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { selectName } from '../../store/slices/user-profile';
import {
  JamiahMember,
  JamiahPayment,
  JamiahCycle,
  useJamiahContext,
} from '../../context/JamiahContext';
import dayjs from 'dayjs';
import { API_BASE_URL } from '../../constants/api';

interface VotePreview {
  id: number;
  title: string;
  closed?: boolean;
  result?: string;
  expiresAt?: string;
  createdAt?: string;
}

interface CommunityPreviewItem {
  primary: string;
  secondary?: string;
}

interface CommunityPreviewBlock {
  title: string;
  description: string;
  items: CommunityPreviewItem[];
  actionLabel: string;
  actionTarget: string;
}

const formatDate = (value?: string) => {
  if (!value) return undefined;
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format('DD.MM.YYYY') : undefined;
};

const formatCurrency = (amount?: number) => {
  if (typeof amount !== 'number') return undefined;
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 2,
  }).format(amount);
};

const getDisplayName = (
  person?: Pick<JamiahMember, 'firstName' | 'lastName' | 'username' | 'uid'> & { userUid?: string }
) => {
  if (!person) return undefined;
  const fullName = `${person.firstName ?? ''} ${person.lastName ?? ''}`.trim();
  return fullName || person.username || person.uid || person.userUid;
};

const OwnerCycleCard: React.FC<{
  cycle: JamiahCycle | null;
  members: JamiahMember[];
  statusNeedsSetup: boolean;
  onSetup: () => void;
}> = ({ cycle, members, statusNeedsSetup, onSetup }) => (
  <Paper sx={{ p: 3, height: '100%' }}>
    <Typography variant="h6" gutterBottom>
      Zyklusstart & Übersicht
    </Typography>
    {cycle ? (
      <Stack spacing={2}>
        <Typography variant="body2" color="text.secondary">
          Aktiver Zyklus <b>{cycle.cycleNumber ?? '-'}</b> mit {cycle.memberOrder?.length ?? members.length}{' '}
          Teilnehmenden.
        </Typography>
        {cycle.recipient && (
          <Typography variant="body2">
            Aktueller Empfänger: <b>{getDisplayName(cycle.recipient)}</b>
          </Typography>
        )}
        <Typography variant="body2" color="text.secondary">
          Status: {cycle.status ?? 'Laufend'}
        </Typography>
      </Stack>
    ) : (
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Es ist noch kein Zyklus gestartet. Bitte schließe das Setup ab, um den ersten Zyklus zu planen.
      </Typography>
    )}
    {statusNeedsSetup && (
      <Button sx={{ mt: 2 }} variant="contained" onClick={onSetup}>
        Setup öffnen
      </Button>
    )}
  </Paper>
);

const PaymentStatusWidget: React.FC<{
  cycle: JamiahCycle | null;
  members: JamiahMember[];
  payments: JamiahPayment[];
  currentUid: string | null;
}> = ({ cycle, members, payments, currentUid }) => {
  const orderedMembers = cycle?.memberOrder ?? members.map((member) => member.uid ?? String(member.id));

  return (
    <Paper sx={{ p: 3, height: '100%' }}>
      <Typography variant="h6" gutterBottom>
        Zahlungsstatus
      </Typography>
      {cycle ? (
        <>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Runde {cycle.cycleNumber ?? '-'} – {payments.length}/{orderedMembers.length} Zahlungen bestätigt.
          </Typography>
          <List disablePadding>
            {orderedMembers.map((uid) => {
              const member = members.find((m) => m.uid === uid);
              const displayName = getDisplayName(member) ?? uid;
              const hasPaid = payments.some((payment) => payment.user?.uid === uid);
              const isRecipient = cycle.recipient?.uid === uid;
              const isCurrentUser = currentUid === uid;

              return (
                <ListItem key={uid} disableGutters sx={{ py: 1 }}>
                  <Box flexGrow={1}>
                    <Typography variant="body2" fontWeight={isCurrentUser ? 600 : 500}>
                      {displayName}
                      {isCurrentUser ? ' (Du)' : ''}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={1} alignItems="center">
                    {isRecipient && <Chip label="Empfänger" size="small" color="primary" />}
                    {hasPaid ? (
                      <CheckIcon color="success" fontSize="small" />
                    ) : (
                      <Chip label="Offen" size="small" color="warning" />
                    )}
                  </Stack>
                </ListItem>
              );
            })}
          </List>
        </>
      ) : (
        <Typography variant="body2" color="text.secondary">
          Noch kein aktiver Zyklus vorhanden.
        </Typography>
      )}
    </Paper>
  );
};

const PersonalNotesWidget: React.FC<{
  roles: ReturnType<typeof useJamiahContext>['roles'];
  statusNeedsSetup: boolean;
  pendingJoinRequests: number;
  jamiahName?: string;
  onMembersClick: () => void;
}> = ({ roles, statusNeedsSetup, pendingJoinRequests, jamiahName, onMembersClick }) => {
  const notes: React.ReactNode[] = [];

  if (roles.isOwner && pendingJoinRequests > 0) {
    notes.push(
      <Alert
        key="applications"
        severity="warning"
        variant="outlined"
        action={
          <Button size="small" color="warning" onClick={onMembersClick}>
            Prüfen
          </Button>
        }
      >
        {pendingJoinRequests === 1
          ? 'Eine offene Bewerbung wartet auf deine Entscheidung.'
          : `${pendingJoinRequests} offene Bewerbungen warten auf deine Entscheidung.`}
      </Alert>
    );
  }

  if (statusNeedsSetup && roles.isOwner) {
    notes.push(
      <Alert key="setup" severity="info" variant="outlined">
        {jamiahName ? `${jamiahName} benötigt noch ein Setup.` : 'Die Jamiah benötigt noch ein Setup.'}
      </Alert>
    );
  }

  if (roles.hasOpenPayment) {
    notes.push(
      <Alert key="payment" severity="warning" variant="outlined">
        Deine nächste Zahlung ist noch offen. Bitte begleiche sie zeitnah.
      </Alert>
    );
  }

  if (roles.isRecipient) {
    notes.push(
      <Alert key="recipient" severity="success" variant="outlined">
        Du bist aktueller Empfänger des Zyklus. Prüfe deine Kontoangaben.
      </Alert>
    );
  }

  if (notes.length === 0) {
    notes.push(
      <Alert key="all-good" severity="success" variant="outlined">
        Alles erledigt! Es liegen derzeit keine offenen Aufgaben vor.
      </Alert>
    );
  }

  return (
    <Paper sx={{ p: 3, height: '100%' }}>
      <Typography variant="h6" gutterBottom>
        Persönliche Hinweise
      </Typography>
      <Stack spacing={2}>{notes}</Stack>
    </Paper>
  );
};

export const Dashboard = () => {
  const navigate = useNavigate();
  const { groupId } = useParams<{ groupId: string }>();
  const userName = useSelector(selectName);
  const { jamiah, cycle, members, payments, pendingRequests, roles, status, currentUid } = useJamiahContext();

  const [votes, setVotes] = useState<VotePreview[]>([]);
  const [votesLoading, setVotesLoading] = useState(false);
  const [votesError, setVotesError] = useState<string | null>(null);

  const navigateWithinJamiah = useCallback(
    (path: string) => {
      if (!groupId) return;
      navigate(`/jamiah/${groupId}/${path}`);
    },
    [groupId, navigate]
  );

  useEffect(() => {
    let isMounted = true;
    const loadVotes = async () => {
      setVotesLoading(true);
      setVotesError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/api/votes`);
        if (!response.ok) {
          throw new Error('failed to load votes');
        }
        const data: VotePreview[] = await response.json();
        if (isMounted) {
          setVotes(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error('[dashboard] Failed to load votes', error);
        if (isMounted) {
          setVotes([]);
          setVotesError('Abstimmungen konnten nicht geladen werden.');
        }
      } finally {
        if (isMounted) {
          setVotesLoading(false);
        }
      }
    };

    void loadVotes();

    return () => {
      isMounted = false;
    };
  }, []);

  const stats = useMemo(
    () => [
      {
        label: 'Mitglieder',
        value: members.length,
        tooltip: 'Alle aktiven Mitglieder dieser Jamiah anzeigen.',
        action: () => navigateWithinJamiah('members'),
      },
      {
        label: 'Bestätigte Zahlungen',
        value: payments.length,
        tooltip: 'Anzahl der bestätigten Zahlungen im aktuellen Zyklus.',
        action: () => navigateWithinJamiah('payments'),
      },
      {
        label: 'Dein Beitragsstatus',
        value: roles.hasOpenPayment ? 'Zahlung offen' : 'Alles bezahlt',
        tooltip: roles.hasOpenPayment
          ? 'Begleiche deinen ausstehenden Beitrag.'
          : 'Es liegen keine offenen Zahlungen vor.',
        action: () => navigateWithinJamiah('payments'),
      },
      {
        label: 'Offene Anfragen',
        value: pendingRequests.length,
        tooltip: 'Noch zu prüfende Beitrittsanfragen.',
        action: () => navigateWithinJamiah('members'),
      },
    ],
    [members.length, navigateWithinJamiah, payments.length, pendingRequests.length, roles.hasOpenPayment]
  );

  const showNotificationBar =
    (roles.isOwner && pendingRequests.length > 0) || status.needsSetup || roles.hasOpenPayment;

  const voteItems = useMemo(() => {
    const toStatus = (vote: VotePreview) => {
      if (vote.closed) {
        return vote.result ? `Ergebnis: ${vote.result}` : 'Abgeschlossen';
      }
      const dateLabel = formatDate(vote.expiresAt);
      return dateLabel ? `Läuft bis ${dateLabel}` : 'Läuft';
    };

    return votes
      .slice()
      .sort((a, b) => {
        const dateB = dayjs(b.expiresAt ?? b.createdAt ?? 0);
        const dateA = dayjs(a.expiresAt ?? a.createdAt ?? 0);
        return dateB.valueOf() - dateA.valueOf();
      })
      .slice(0, 3)
      .map((vote) => ({
        id: vote.id,
        title: vote.title,
        status: toStatus(vote),
      }));
  }, [votes]);

  const paymentHistory = useMemo(() => {
    const statusLabel = (status?: string) => {
      switch (status) {
        case 'PAID_SELF_CONFIRMED':
          return 'Selbst bestätigt';
        case 'RECEIPT_CONFIRMED':
          return 'Empfang bestätigt';
        case 'INITIATED':
          return 'Initiiert';
        case 'UNPAID':
          return 'Offen';
        default:
          return status ?? 'Unbekannt';
      }
    };

    return payments
      .slice()
      .sort((a, b) => {
        const dateB = dayjs(b.paidAt ?? b.createdAt ?? 0);
        const dateA = dayjs(a.paidAt ?? a.createdAt ?? 0);
        return dateB.valueOf() - dateA.valueOf();
      })
      .slice(0, 5)
      .map((payment) => {
        const amountValue =
          typeof payment.amount === 'number'
            ? payment.amount
            : Number.isFinite(Number(payment.amount))
            ? Number(payment.amount)
            : undefined;
        const dateLabel = formatDate(payment.paidAt ?? payment.createdAt);
        const payerName = getDisplayName({
          firstName: payment.user?.firstName,
          lastName: payment.user?.lastName,
          username: payment.user?.username,
          uid: payment.user?.uid,
        });

        const id =
          payment.id ??
          `${payment.user?.uid ?? 'payment'}-${payment.paidAt ?? payment.createdAt ?? payment.status ?? 'unknown'}`;

        return {
          id,
          payerName,
          dateLabel,
          amount: formatCurrency(amountValue),
          status: statusLabel(payment.status),
          isCurrentUser: payment.user?.uid === currentUid,
        };
      });
  }, [payments, currentUid]);

  const communityPreview: CommunityPreviewBlock = useMemo(() => {
    if (roles.isOwner && pendingRequests.length > 0) {
      return {
        title: 'Offene Beitrittsanfragen',
        description: 'Triff Entscheidungen für neue Mitglieder.',
        items: pendingRequests.slice(0, 4).map((request) => ({
          primary:
            getDisplayName({
              firstName: request.firstName,
              lastName: request.lastName,
              username: request.username,
              uid: request.userUid,
              userUid: request.userUid,
            }) ?? request.userUid,
          secondary: request.motivation ? `Motivation: ${request.motivation}` : 'Wartet auf Entscheidung',
        })),
        actionLabel: 'Anfragen verwalten',
        actionTarget: 'members',
      };
    }

    return {
      title: 'Mitgliederübersicht',
      description:
        members.length > 0
          ? 'Ein Blick auf einige aktive Mitglieder deiner Jamiah.'
          : 'Noch keine Mitglieder hinzugefügt.',
      items: members.slice(0, 5).map((member) => ({
        primary: getDisplayName(member) ?? member.uid ?? String(member.id),
        secondary:
          member.uid === currentUid
            ? 'Das bist du'
            : member.uid === jamiah?.ownerId
            ? 'Leitung'
            : undefined,
      })),
      actionLabel: 'Mitgliederliste öffnen',
      actionTarget: 'members',
    };
  }, [roles.isOwner, pendingRequests, members, currentUid, jamiah?.ownerId]);

  const showPaymentWidget = roles.isPayer || roles.isRecipient;
  const paymentCols = roles.isOwner ? 6 : 8;
  const personalCols = showPaymentWidget ? (roles.isOwner ? 6 : 4) : 12;

  return (
    <Box p={4}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Willkommen zurück{userName ? `, ${userName}` : ''} 👋
      </Typography>

      {showNotificationBar && (
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          mb={3}
          useFlexGap
          flexWrap="wrap"
        >
          {roles.isOwner && pendingRequests.length > 0 && (
            <Chip
              icon={<GroupAddIcon />}
              color="secondary"
              label={`${pendingRequests.length} offene Bewerbungen`}
              onClick={() => navigateWithinJamiah('members')}
              sx={{ cursor: 'pointer' }}
            />
          )}
          {roles.isOwner && status.needsSetup && (
            <Chip
              icon={<SettingsSuggestIcon />}
              color="warning"
              label="Setup erforderlich"
              onClick={() => navigateWithinJamiah('setup')}
              sx={{ cursor: 'pointer' }}
            />
          )}
          {roles.hasOpenPayment && (
            <Chip
              icon={<PaymentsIcon />}
              color="error"
              label="Zahlung offen"
              onClick={() => navigateWithinJamiah('payments')}
              sx={{ cursor: 'pointer' }}
            />
          )}
        </Stack>
      )}

      <Grid container spacing={3} mb={4}>
        {stats.map((stat) => (
          <Grid item xs={12} sm={6} md={3} key={stat.label}>
            <Tooltip title={stat.tooltip} arrow>
              <Paper
                sx={{
                  p: 2,
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: '0.2s',
                  '&:hover': {
                    backgroundColor: '#f5f5f5',
                    transform: 'scale(1.02)',
                  },
                }}
                onClick={stat.action}
              >
                <Typography variant="subtitle2" color="text.secondary">
                  {stat.label}
                </Typography>
                <Typography variant="h5" fontWeight="bold">
                  {stat.value}
                </Typography>
              </Paper>
            </Tooltip>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3} mb={4}>
        {roles.isOwner && (
          <Grid item xs={12} md={6}>
            <OwnerCycleCard
              cycle={cycle}
              members={members}
              statusNeedsSetup={status.needsSetup}
              onSetup={() => navigateWithinJamiah('setup')}
            />
          </Grid>
        )}
        {showPaymentWidget && (
          <Grid item xs={12} md={paymentCols}>
            <PaymentStatusWidget cycle={cycle} members={members} payments={payments} currentUid={currentUid} />
          </Grid>
        )}
        <Grid item xs={12} md={personalCols}>
          <PersonalNotesWidget
            roles={roles}
            statusNeedsSetup={status.needsSetup}
            pendingJoinRequests={pendingRequests.length}
            jamiahName={jamiah?.name}
            onMembersClick={() => navigateWithinJamiah('members')}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6} lg={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="h6">Aktuelle Abstimmungen</Typography>
              <Chip size="small" label={votes.length} color="default" />
            </Stack>
            <Stack spacing={1}>
              {votesLoading && <Typography color="text.secondary">Lade Abstimmungen...</Typography>}
              {!votesLoading && votesError && (
                <Typography color="error" variant="body2">
                  {votesError}
                </Typography>
              )}
              {!votesLoading && !votesError && voteItems.length === 0 && (
                <Typography color="text.secondary">Es liegen keine Abstimmungen vor.</Typography>
              )}
              {!votesLoading && !votesError &&
                voteItems.map((vote, index) => (
                  <Box key={vote.id}>
                    <Typography fontWeight={600}>{vote.title}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {vote.status}
                    </Typography>
                    {index < voteItems.length - 1 && <Divider sx={{ my: 1 }} />}
                  </Box>
                ))}
            </Stack>
            <Button size="small" sx={{ mt: 2 }} onClick={() => navigateWithinJamiah('votes')}>
              Abstimmungen öffnen
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6} lg={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Zahlungsverlauf
            </Typography>
            <List>
              {paymentHistory.length === 0 && (
                <ListItem disableGutters>
                  <ListItemText
                    primary="Noch keine Zahlungen erfasst."
                    primaryTypographyProps={{ color: 'text.secondary' }}
                  />
                </ListItem>
              )}
              {paymentHistory.map((payment) => (
                <ListItem key={payment.id} disableGutters sx={{ alignItems: 'flex-start' }}>
                  <Box flexGrow={1}>
                    <Typography fontWeight={payment.isCurrentUser ? 600 : 500}>
                      {payment.payerName ?? 'Unbekanntes Mitglied'}
                      {payment.isCurrentUser ? ' (Du)' : ''}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {payment.dateLabel ?? 'Datum unbekannt'}
                    </Typography>
                  </Box>
                  <Stack spacing={1} alignItems="flex-end">
                    {payment.amount && (
                      <Typography variant="body2" fontWeight={600}>
                        {payment.amount}
                      </Typography>
                    )}
                    <Chip label={payment.status} size="small" variant="outlined" />
                  </Stack>
                </ListItem>
              ))}
            </List>
            <Button size="small" onClick={() => navigateWithinJamiah('payments')}>
              Zahlungen verwalten
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6} lg={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              {communityPreview.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              {communityPreview.description}
            </Typography>
            <List>
              {communityPreview.items.length === 0 && (
                <ListItem disableGutters>
                  <ListItemText
                    primary="Keine Einträge vorhanden."
                    primaryTypographyProps={{ color: 'text.secondary' }}
                  />
                </ListItem>
              )}
              {communityPreview.items.map((item, index) => (
                <React.Fragment key={`${item.primary}-${index}`}>
                  <ListItem disableGutters>
                    <ListItemText
                      primary={item.primary}
                      secondary={item.secondary}
                      primaryTypographyProps={{ fontWeight: 500 }}
                    />
                  </ListItem>
                  {index < communityPreview.items.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
            <Button size="small" onClick={() => navigateWithinJamiah(communityPreview.actionTarget)}>
              {communityPreview.actionLabel}
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

