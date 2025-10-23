import React, { useMemo } from 'react';
import {
  Badge,
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  IconButton,
  CssBaseline,
  useTheme,
  Typography,
  Chip,
  Divider,
  Stack,
  Button,
  Tooltip,
  ChipProps,
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import DashboardIcon from '@mui/icons-material/SpaceDashboard';
import SettingsIcon from '@mui/icons-material/BuildCircle';
import GroupIcon from '@mui/icons-material/Groups';
import PaymentsIcon from '@mui/icons-material/Payments';
import VotesIcon from '@mui/icons-material/HowToVote';
import DocumentsIcon from '@mui/icons-material/Description';
import ReportsIcon from '@mui/icons-material/BarChart';
import { Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import { JamiahProvider, useJamiahContext } from '../../context/JamiahContext';

interface MenuBadge {
  label: string;
  color?: ChipProps['color'];
  count?: number;
}

interface MenuItem {
  text: string;
  path: string;
  icon: React.ReactNode;
  badge?: MenuBadge;
}

export const JamiahLayout: React.FC = () => {
  const { groupId } = useParams();
  return (
    <JamiahProvider groupId={groupId}>
      <JamiahLayoutShell />
    </JamiahProvider>
  );
};

const JamiahLayoutShell: React.FC = () => {
  const [open, setOpen] = React.useState(false);
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { jamiah, roles, status } = useJamiahContext();

  const drawerWidth = open ? 260 : 72;
  const toolbarHeight = theme.mixins.toolbar.minHeight ?? 64;
  const [footerHeight, setFooterHeight] = React.useState(0);

  React.useEffect(() => {
    const handleResize = () => {
      const footer = document.getElementById('footer');
      setFooterHeight(footer ? footer.offsetHeight : 0);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const shortcuts = useMemo(() => {
    const items: { label: string; target: string }[] = [];
    if (status.needsSetup) {
      items.push({ label: 'Setup abschließen', target: 'setup' });
    }
    if (status.pendingJoinRequests > 0) {
      items.push({ label: `${status.pendingJoinRequests} Bewerbungen`, target: 'members' });
    }
    if (status.nextPaymentLabel) {
      items.push({ label: status.nextPaymentLabel, target: 'payments' });
    }
    return items;
  }, [status]);

  const menuItems = useMemo<MenuItem[]>(() => {
    const items: MenuItem[] = [
      {
        text: 'Dashboard',
        path: 'dashboard',
        icon: <DashboardIcon fontSize="small" />,
      },
    ];

    if (roles.isOwner) {
      items.push({
        text: 'Setup',
        path: 'setup',
        icon: <SettingsIcon fontSize="small" />,
        badge: status.needsSetup ? { label: 'Offen', color: 'warning' } : undefined,
      });
    }

    items.push(
      {
        text: 'Mitglieder',
        path: 'members',
        icon: <GroupIcon fontSize="small" />,
        badge:
          status.pendingJoinRequests > 0
            ? { label: `${status.pendingJoinRequests}`, color: 'secondary', count: status.pendingJoinRequests }
            : undefined,
      },
      {
        text: 'Zahlungen',
        path: 'payments',
        icon: <PaymentsIcon fontSize="small" />,
        badge: status.nextPaymentLabel
          ? { label: status.nextPaymentLabel, color: 'error' }
          : undefined,
      },
      {
        text: 'Abstimmungen',
        path: 'votes',
        icon: <VotesIcon fontSize="small" />,
      },
      {
        text: 'Dokumente',
        path: 'documents',
        icon: <DocumentsIcon fontSize="small" />,
      },
      {
        text: 'Berichte',
        path: 'reports',
        icon: <ReportsIcon fontSize="small" />,
      }
    );

    return items;
  }, [roles.isOwner, status]);

  const toggleDrawer = () => setOpen(!open);

  const segments = location.pathname.split('/').filter(Boolean);
  const activeSegment = segments[2];

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <Drawer
        variant="permanent"
        anchor="left"
        open
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            overflowX: 'hidden',
            transition: 'width 0.3s',
            top: toolbarHeight,
            height: `calc(100% - ${toolbarHeight}px - ${footerHeight}px)`,
          },
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: open ? 'flex-end' : 'center', p: 1 }}>
          <IconButton onClick={toggleDrawer} size="small">
            {open ? <ChevronLeftIcon /> : <ChevronRightIcon />}
          </IconButton>
        </Box>

        <Box px={open ? 2 : 1} pb={2}>
          <Tooltip title={jamiah?.name ?? 'Jamiah'} disableHoverListener={open} placement="right">
            <Typography variant="subtitle1" fontWeight={600} noWrap>
              {jamiah?.name ?? 'Jamiah'}
            </Typography>
          </Tooltip>
          {open && (
            <Stack direction="row" spacing={1} mt={1} flexWrap="wrap">
              {roles.isOwner && <Chip label="Owner" size="small" color="primary" />}
              {roles.isPayer && <Chip label="Zahler" size="small" color="secondary" />}
              {roles.isRecipient && <Chip label="Empfänger" size="small" color="success" />}
            </Stack>
          )}
        </Box>

        <Divider />

        <List sx={{ flexGrow: 1 }}>
          {menuItems.map((item) => {
            const isActive = activeSegment ? activeSegment.startsWith(item.path) : item.path === 'dashboard';
            const iconWrapper = (
              <Box component="span" sx={{ display: 'flex' }}>
                {item.icon}
              </Box>
            );
            const iconWithBadge = item.badge?.count ? (
              <Badge color={item.badge.color ?? 'secondary'} badgeContent={item.badge.count} overlap="circular">
                {iconWrapper}
              </Badge>
            ) : (
              iconWrapper
            );
            return (
              <Tooltip key={item.path} title={open ? undefined : item.text} placement="right">
                <ListItemButton
                  onClick={() => handleNavigate(item.path)}
                  selected={isActive}
                  sx={{ justifyContent: open ? 'flex-start' : 'center', px: open ? 2 : 1 }}
                >
                  <ListItemIcon sx={{ minWidth: open ? 36 : 'auto' }}>{iconWithBadge}</ListItemIcon>
                  {!open && item.badge && !item.badge.count && (
                    <Chip
                      label={item.badge.label}
                      color={item.badge.color ?? 'default'}
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  )}
                  {open && (
                    <Box display="flex" alignItems="center" justifyContent="space-between" flexGrow={1}>
                      <Typography variant="body2" fontWeight={isActive ? 600 : 500} noWrap>
                        {item.text}
                      </Typography>
                      {item.badge && (
                        <Chip
                          label={item.badge.label}
                          color={item.badge.color ?? 'default'}
                          size="small"
                        />
                      )}
                    </Box>
                  )}
                </ListItemButton>
              </Tooltip>
            );
          })}
        </List>

        {open && shortcuts.length > 0 && (
          <Box px={2} pb={2}>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
              Shortcuts
            </Typography>
            <Stack spacing={1}>
              {shortcuts.map((shortcut) => (
                <Button
                  key={shortcut.label}
                  size="small"
                  variant="outlined"
                  onClick={() => handleNavigate(shortcut.target)}
                >
                  {shortcut.label}
                </Button>
              ))}
            </Stack>
          </Box>
        )}
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Outlet />
      </Box>
    </Box>
  );
};

export default JamiahLayout;

