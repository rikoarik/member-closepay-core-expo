import React from 'react';
import Constants from 'expo-constants';

/**
 * Wraps children with SecurityProvider only when NOT running in Expo Go.
 * In Expo Go, native modules used by FreeRASP (freerasp-react-native) are not
 * available, so we skip the security provider to avoid "native module doesn't exist" errors.
 */
let SecurityProviderComponent: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;

const isExpoGo = Constants.appOwnership === 'expo';

if (!isExpoGo) {
  try {
    const { SecurityProvider } = require('@core/security/SecurityProvider');
    SecurityProviderComponent = SecurityProvider;
  } catch {
    // If security module fails to load, keep no-op wrapper
  }
}

export const SecurityProviderWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <SecurityProviderComponent>{children}</SecurityProviderComponent>
);
