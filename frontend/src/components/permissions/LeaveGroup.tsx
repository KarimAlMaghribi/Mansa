import React from 'react';
import { Button } from '@mui/material';
import { Can } from './Can';
import { PermissionKeyEnum } from '../../enums/PermissionKey.enum';

interface LeaveGroupProps {
  group: { isStarted: boolean };
  onLeave: () => void;
}

export const LeaveGroup: React.FC<LeaveGroupProps> = ({ group, onLeave }) => {
  return (
    <Can permission={PermissionKeyEnum.SELF_LEAVE}>
      {!group.isStarted && (
        <Button color="error" onClick={onLeave}>Gruppe verlassen</Button>
      )}
    </Can>
  );
};
