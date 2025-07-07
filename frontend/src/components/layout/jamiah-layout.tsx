import React from 'react';
import { Box, Drawer, List, ListItem, ListItemText, Toolbar } from '@mui/material';
import { Outlet, Link } from 'react-router-dom';

const drawerWidth = 220;

export const JamiahLayout: React.FC = () => {
  const menu = [
    { text: 'Dashboard', path: `dashboard` },
    { text: 'Mitglieder', path: `members` },
    { text: 'Beiträge', path: `payments` },
    { text: 'Abstimmungen', path: `votes` },
    { text: 'Dokumente', path: `documents` },
    { text: 'Berichte', path: `reports` },
  ];

  return (
    <Box sx={{ display: 'flex' }}>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
        }}
      >
        <Toolbar />
        <List>
          {menu.map(item => (
            <ListItem button key={item.text} component={Link} to={item.path}>
              <ListItemText primary={item.text} />
            </ListItem>
          ))}
        </List>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
};

export default JamiahLayout;
