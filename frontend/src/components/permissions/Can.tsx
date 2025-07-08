import React from 'react';
import { PermissionKey } from '../../types/PermissionKey';
import { usePermissions } from '../../context/PermissionsContext';

interface CanProps {
  permission: PermissionKey;
  children: React.ReactNode;
}

export const Can: React.FC<CanProps> = ({ permission, children }) => {
  const { permissions } = usePermissions();
  if (!permissions.includes(permission)) {
    return null;
  }
  return <>{children}</>;
};
