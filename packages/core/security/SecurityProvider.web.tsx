/**
 * SecurityProvider - Web stub (no FreeRASP)
 */
import React, { createContext, useContext } from 'react';

const SecurityContext = createContext({ isSecure: true, securityStatus: 'Secure' });

export const useSecurity = () => useContext(SecurityContext);

export const SecurityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <SecurityContext.Provider value={{ isSecure: true, securityStatus: 'Secure' }}>
    {children}
  </SecurityContext.Provider>
);
