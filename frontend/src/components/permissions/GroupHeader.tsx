import React from 'react';
import { Button, Stack } from '@mui/material';
import { Can } from './Can';
import { PermissionKeyEnum } from '../../enums/PermissionKey.enum';

export const GroupHeader: React.FC = () => {
  return (
    <Stack direction="row" spacing={1}>
      <Can permission={PermissionKeyEnum.EDIT_GROUP}>
        <Button variant="outlined">Gruppe bearbeiten</Button>
      </Can>
      <Can permission={PermissionKeyEnum.DELETE_GROUP}>
        <Button variant="outlined" color="error">Gruppe löschen</Button>
      </Can>
      <Can permission={PermissionKeyEnum.GENERATE_LINK}>
        <Button variant="outlined">Einladungs-Link</Button>
      </Can>
      <Can permission={PermissionKeyEnum.VIEW_INVITES}>
        <Button variant="outlined">Einladungen verwalten</Button>
      </Can>
    </Stack>
  );
};
