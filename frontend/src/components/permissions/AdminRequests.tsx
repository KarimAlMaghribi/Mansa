import React from 'react';
import { Button, List, ListItem, ListItemText } from '@mui/material';
import { Can } from './Can';
import { PermissionKeyEnum } from '../../enums/PermissionKey.enum';

interface Request {
  id: string;
  user: string;
}

interface AdminRequestsProps {
  requests: Request[];
}

export const AdminRequests: React.FC<AdminRequestsProps> = ({ requests }) => {
  return (
    <List>
      {requests.map(r => (
        <ListItem key={r.id} divider>
          <ListItemText primary={r.user} />
          <Can permission={PermissionKeyEnum.APPROVE_REQUEST}>
            <Button size="small">Genehmigen</Button>
          </Can>
          <Can permission={PermissionKeyEnum.REJECT_REQUEST}>
            <Button size="small" color="error">Ablehnen</Button>
          </Can>
        </ListItem>
      ))}
    </List>
  );
};
