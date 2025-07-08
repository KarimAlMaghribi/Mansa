import React, { createContext, useContext } from 'react';
import { PermissionKey } from '../types/PermissionKey';

interface PermissionsContextProps {
  permissions: PermissionKey[];
}

const PermissionsContext = createContext<PermissionsContextProps>({ permissions: [] });

export const usePermissions = () => useContext(PermissionsContext);

interface PermissionsProviderProps {
  permissions: PermissionKey[];
  children: React.ReactNode;
}

export const PermissionsProvider: React.FC<PermissionsProviderProps> = ({ permissions, children }) => (
  <PermissionsContext.Provider value={{ permissions }}>
    {children}
  </PermissionsContext.Provider>
);
