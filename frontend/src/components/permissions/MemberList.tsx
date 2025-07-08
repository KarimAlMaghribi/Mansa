import React from 'react';
import { IconButton, List, ListItem, ListItemText, MenuItem, Select } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { Can } from './Can';
import { PermissionKeyEnum } from '../../enums/PermissionKey.enum';

interface Member {
  id: string;
  name: string;
  role: string;
}

interface MemberListProps {
  members: Member[];
}

export const MemberList: React.FC<MemberListProps> = ({ members }) => {
  return (
    <List>
      {members.map(m => (
        <ListItem key={m.id} divider>
          <ListItemText primary={m.name} secondary={m.role} />
          <Can permission={PermissionKeyEnum.CHANGE_ROLE}>
            <Select value={m.role} size="small" sx={{ mr: 1 }}>
              <MenuItem value="ADMIN">Admin</MenuItem>
              <MenuItem value="MEMBER">Member</MenuItem>
            </Select>
          </Can>
          <Can permission={PermissionKeyEnum.REMOVE_MEMBER}>
            <IconButton edge="end" aria-label="remove">
              <DeleteIcon />
            </IconButton>
          </Can>
        </ListItem>
      ))}
    </List>
  );
};
