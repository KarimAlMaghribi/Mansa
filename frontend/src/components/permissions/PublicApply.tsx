import React from 'react';
import { Button } from '@mui/material';
import { Can } from './Can';
import { PermissionKeyEnum } from '../../enums/PermissionKey.enum';

interface PublicApplyProps {
  onApply: () => void;
}

export const PublicApply: React.FC<PublicApplyProps> = ({ onApply }) => {
  return (
    <Can permission={PermissionKeyEnum.APPLY_PUBLIC}>
      <Button variant="contained" onClick={onApply}>Antrag stellen</Button>
    </Can>
  );
};
