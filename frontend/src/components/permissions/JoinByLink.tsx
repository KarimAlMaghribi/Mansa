import React from 'react';
import { Button } from '@mui/material';
import { Can } from './Can';
import { PermissionKeyEnum } from '../../enums/PermissionKey.enum';

interface JoinByLinkProps {
  onJoin: () => void;
}

export const JoinByLink: React.FC<JoinByLinkProps> = ({ onJoin }) => {
  return (
    <Can permission={PermissionKeyEnum.JOIN_VIA_LINK}>
      <Button variant="contained" onClick={onJoin}>Gruppe beitreten</Button>
    </Can>
  );
};
