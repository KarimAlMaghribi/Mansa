import React from 'react';
import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  IconButton,
  CssBaseline,
  useTheme,
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { Outlet, Link } from 'react-router-dom';

export const JamiahLayout: React.FC = () => {
  const [open, setOpen] = React.useState(false);
  const theme = useTheme();
  const drawerWidth = open ? 220 : 60;
  const toolbarHeight = theme.mixins.toolbar.minHeight;
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

  const menu = [
    { text: 'Dashboard', path: `dashboard`, emoji: '📊' },
    { text: 'Mitglieder', path: `members`, emoji: '👥' },
    { text: 'Beiträge', path: `payments`, emoji: '💰' },
    { text: 'Abstimmungen', path: `votes`, emoji: '🗳️' },
    { text: 'Dokumente', path: `documents`, emoji: '📄' },
    { text: 'Berichte', path: `reports`, emoji: '📈' },
  ];

  const toggleDrawer = () => setOpen(!open);

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
          <IconButton onClick={toggleDrawer}>
            {open ? <ChevronLeftIcon /> : <ChevronRightIcon />}
          </IconButton>
        </Box>
        <List>
          {menu.map(item => (
            <ListItemButton
              key={item.text}
              component={Link}
              to={item.path}
              sx={{ justifyContent: open ? 'flex-start' : 'center', px: 2 }}
            >
              <span role="img" aria-label={item.text} style={{ fontSize: 20 }}>
                {item.emoji}
              </span>
              {open && <ListItemText primary={item.text} sx={{ pl: 1 }} />}
            </ListItemButton>
          ))}
        </List>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Outlet />
      </Box>
    </Box>
  );
};

export default JamiahLayout;
