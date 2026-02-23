/**
 * App Version Utility
 * Uses expo-application on native; falls back to package.json on web or when unavailable.
 */

import { Platform } from 'react-native';

let nativeApplicationVersion: string | null = null;
let nativeBuildVersion: string | null = null;

if (Platform.OS !== 'web') {
  try {
    const Application = require('expo-application');
    nativeApplicationVersion = Application.nativeApplicationVersion ?? null;
    nativeBuildVersion = Application.nativeBuildVersion ?? null;
  } catch {
    // expo-application not available
  }
}

function getPackageVersion(): string {
  try {
    const packageJson = require('../../../../package.json');
    if (packageJson?.version) return packageJson.version;
  } catch {
    try {
      const packageJson = require('../../../package.json');
      if (packageJson?.version) return packageJson.version;
    } catch {
      // ignore
    }
  }
  return '1.0.0';
}

/**
 * Get app version (sync). Prefer expo-application on native.
 */
export const getAppVersion = (): string => {
  if (nativeApplicationVersion) return nativeApplicationVersion;
  return getPackageVersion();
};

/**
 * Get app version asynchronously. Use in useEffect or async functions.
 */
export const getAppVersionAsync = async (): Promise<string> => {
  if (nativeApplicationVersion) return nativeApplicationVersion;
  if (Platform.OS !== 'web') {
    try {
      const Application = require('expo-application');
      const v = Application.nativeApplicationVersion;
      if (v) return v;
    } catch {
      // ignore
    }
  }
  return getPackageVersion();
};

/**
 * Get build number (sync).
 */
export const getBuildNumber = (): string => {
  if (nativeBuildVersion) return nativeBuildVersion;
  return '1';
};

/**
 * Get build number asynchronously.
 */
export const getBuildNumberAsync = async (): Promise<string> => {
  if (nativeBuildVersion) return nativeBuildVersion;
  if (Platform.OS !== 'web') {
    try {
      const Application = require('expo-application');
      const b = Application.nativeBuildVersion;
      if (b) return b;
    } catch {
      // ignore
    }
  }
  return '1';
};

/**
 * Get full version string: "version (build)" or "version"
 */
export const getFullVersion = (): string => {
  const version = getAppVersion();
  const buildNumber = getBuildNumber();
  if (buildNumber && buildNumber !== version && buildNumber !== '1') {
    return `${version} (${buildNumber})`;
  }
  return version;
};
