import React, { useMemo } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  Grid,
  List,
  ListItem,
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
import { useNavigate } from 'react-router-dom';
import { selectName } from '../../store/slices/user-profile';
import {
  JamiahMember,
  JamiahPayment,
  JamiahCycle,
  useJamiahContext,
} from '../../context/JamiahContext';

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
  const userName = useSelector(selectName);
  const { jamiah, cycle, members, payments, pendingRequests, roles, status, currentUid } = useJamiahContext();

  const stats = useMemo(
    () => [
      {
        label: 'Mitglieder',
        value: members.length,
        tooltip: 'Alle aktiven Mitglieder dieser Jamiah anzeigen.',
        action: () => navigate('members'),
      },
      {
        label: 'Bestätigte Zahlungen',
        value: payments.length,
        tooltip: 'Anzahl der bestätigten Zahlungen im aktuellen Zyklus.',
        action: () => navigate('payments'),
      },
      {
        label: 'Dein Beitragsstatus',
        value: roles.hasOpenPayment ? 'Zahlung offen' : 'Alles bezahlt',
        tooltip: roles.hasOpenPayment
          ? 'Begleiche deinen ausstehenden Beitrag.'
          : 'Es liegen keine offenen Zahlungen vor.',
        action: () => navigate('payments'),
      },
      {
        label: 'Offene Anfragen',
        value: pendingRequests.length,
        tooltip: 'Noch zu prüfende Beitrittsanfragen.',
        action: () => navigate('members'),
      },
    ],
    [members.length, navigate, payments.length, pendingRequests.length, roles.hasOpenPayment]
  );

  const showNotificationBar =
    (roles.isOwner && pendingRequests.length > 0) || status.needsSetup || roles.hasOpenPayment;

  const recentVotes = [
    { title: 'Neuer Vorstand ab Juli', status: 'Läuft' },
    { title: 'Ramadan-Spendenaktion', status: 'Abgeschlossen' },
  ];

  const recentPayments = [
    { month: 'April 2025', amount: '50€', status: 'Bezahlt' },
    { month: 'Mai 2025', amount: '50€', status: 'Ausstehend' },
  ];

  const personalDocs = [
    { name: 'Mitgliedsbestätigung.pdf' },
    { name: 'Beitragsquittung_April.pdf' },
  ];

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
              onClick={() => navigate('members')}
              sx={{ cursor: 'pointer' }}
            />
          )}
          {roles.isOwner && status.needsSetup && (
            <Chip
              icon={<SettingsSuggestIcon />}
              color="warning"
              label="Setup erforderlich"
              onClick={() => navigate('setup')}
              sx={{ cursor: 'pointer' }}
            />
          )}
          {roles.hasOpenPayment && (
            <Chip
              icon={<PaymentsIcon />}
              color="error"
              label="Zahlung offen"
              onClick={() => navigate('payments')}
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
              onSetup={() => navigate('setup')}
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
            onMembersClick={() => navigate('members')}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Letzte Abstimmungen
            </Typography>
            <Stack spacing={1}>
              {recentVotes.map((vote, index) => (
                <Box key={vote.title}>
                  <Typography>
                    {vote.title} – <i>{vote.status}</i>
                  </Typography>
                  {index < recentVotes.length - 1 && <Divider sx={{ my: 1 }} />}
                </Box>
              ))}
            </Stack>
            <Button size="small" sx={{ mt: 2 }} onClick={() => navigate('votes')}>
              Zu den Abstimmungen
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Meine Zahlungen
            </Typography>
            <List>
              {recentPayments.map((payment) => (
                <ListItem key={payment.month} disableGutters>
                  <Box flexGrow={1}>
                    <Typography>{`${payment.month} – ${payment.amount}`}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {payment.status}
                    </Typography>
                  </Box>
                </ListItem>
              ))}
            </List>
            <Button size="small" onClick={() => navigate('payments')}>
              Zahlungen verwalten
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Meine Dokumente
            </Typography>
            <List>
              {personalDocs.map((doc) => (
                <ListItem key={doc.name} disableGutters>
                  <Typography>{doc.name}</Typography>
                </ListItem>
              ))}
            </List>
            <Button size="small" onClick={() => navigate('documents')}>
              Alle Dokumente anzeigen
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

