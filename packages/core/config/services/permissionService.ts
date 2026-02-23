/**
 * Permission Service
 * Service untuk handle permissions (notifications, camera, location)
 * Uses react-native-permissions when the native module is linked; otherwise falls back
 * to React Native built-ins (Android) or returns unavailable (e.g. Expo Go).
 */

import { Platform, PermissionsAndroid, Alert, Linking } from 'react-native';

export type PermissionStatus = 'granted' | 'denied' | 'blocked' | 'unavailable';

export interface PermissionResult {
  status: PermissionStatus;
  message?: string;
}

/** Lazy-loaded react-native-permissions; null when native module is not linked (e.g. Expo Go) */
let rnPermissions: {
  check: (p: string) => Promise<string>;
  request: (p: string) => Promise<string>;
  PERMISSIONS: { IOS: { CAMERA: string; LOCATION_WHEN_IN_USE: string } };
  RESULTS: Record<string, string>;
  openSettings: () => Promise<void>;
  requestNotifications: (opts: string[]) => Promise<{ status: string }>;
  checkNotifications: () => Promise<{ status: string }>;
} | null = undefined as any;

function getRNPermissions(): typeof rnPermissions {
  if (rnPermissions === undefined) {
    try {
      rnPermissions = require('react-native-permissions');
    } catch {
      rnPermissions = null;
    }
  }
  return rnPermissions;
}

/**
 * Convert react-native-permissions result to our PermissionStatus
 */
function convertResult(result: string, RESULTS?: Record<string, string>): PermissionStatus {
  const R = RESULTS || { GRANTED: 'granted', LIMITED: 'limited', DENIED: 'denied', BLOCKED: 'blocked', UNAVAILABLE: 'unavailable' };
  switch (result) {
    case R.GRANTED:
    case R.LIMITED:
      return 'granted';
    case R.DENIED:
      return 'denied';
    case R.BLOCKED:
      return 'blocked';
    case R.UNAVAILABLE:
    default:
      return 'unavailable';
  }
}

class PermissionService {
  /**
   * Get POST_NOTIFICATIONS permission constant
   * Fallback to string literal if constant not available
   */
  private getPostNotificationsPermission(): any {
    return (
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS ||
      'android.permission.POST_NOTIFICATIONS'
    );
  }

  /**
   * Check notification permission status
   */
  async checkNotificationPermission(): Promise<PermissionStatus> {
    try {
      if (Platform.OS === 'ios') {
        const lib = getRNPermissions();
        if (!lib) return 'unavailable';
        const { status } = await lib.checkNotifications();
        return convertResult(status, lib.RESULTS);
      }

      if (Platform.OS === 'android') {
        // Android 13+ (API 33+): Check notification permission
        if (Number(Platform.Version) >= 33) {
          try {
            const permission = this.getPostNotificationsPermission();
            const checkResult = await PermissionsAndroid.check(permission);
            return checkResult ? 'granted' : 'denied';
          } catch (error) {
            console.warn('Error checking notification permission:', error);
            return 'unavailable';
          }
        }
        // Android < 13: Notifications granted by default
        return 'granted';
      }

      return 'unavailable';
    } catch (error) {
      console.error('Error checking notification permission:', error);
      return 'unavailable';
    }
  }

  /**
   * Request notification permission
   */
  async requestNotificationPermission(): Promise<PermissionResult> {
    try {
      // iOS: Request notification permission
      if (Platform.OS === 'ios') {
        const lib = getRNPermissions();
        if (!lib) return { status: 'unavailable', message: 'Permission module not available (e.g. Expo Go)' };
        const { status } = await lib.requestNotifications(['alert', 'badge', 'sound']);
        return { status: convertResult(status, lib.RESULTS) };
      }

      // Android: Request notification permission (Android 13+)
      if (Platform.OS === 'android') {
        const androidVersion = Number(Platform.Version);

        // Android 13+ (API 33+): Need to request permission
        if (androidVersion >= 33) {
          try {
            // Check current permission status first
            const currentStatus = await this.checkNotificationPermission();
            if (currentStatus === 'granted') {
              return { status: 'granted' };
            }

            // Get permission constant (with fallback)
            const permission = this.getPostNotificationsPermission();

            // Request permission
            const granted = await PermissionsAndroid.request(permission);

            if (granted === PermissionsAndroid.RESULTS.GRANTED) {
              return { status: 'granted' };
            } else if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
              return { status: 'blocked' };
            } else {
              return { status: 'denied' };
            }
          } catch (error: any) {
            console.error('Error requesting notification permission:', error);
            // Return denied instead of unavailable to allow retry
            return {
              status: 'denied',
              message: error?.message || 'Failed to request notification permission'
            };
          }
        }

        // Android < 13: Notifications granted by default
        return { status: 'granted' };
      }

      return { status: 'unavailable', message: 'Platform not supported' };
    } catch (error: any) {
      console.error('Error requesting notification permission:', error);
      return {
        status: 'unavailable',
        message: error?.message || 'Failed to request notification permission'
      };
    }
  }

  /**
   * Request camera permission
   */
  async requestCameraPermission(): Promise<PermissionResult> {
    try {
      if (Platform.OS === 'ios') {
        const lib = getRNPermissions();
        if (!lib) return { status: 'unavailable', message: 'Permission module not available (e.g. Expo Go)' };
        const result = await lib.request(lib.PERMISSIONS.IOS.CAMERA);
        return { status: convertResult(result, lib.RESULTS) };
      }

      if (Platform.OS === 'android') {
        // Always request permission (will show dialog if not granted)
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          return { status: 'granted' };
        } else if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
          return { status: 'blocked' };
        } else {
          return { status: 'denied' };
        }
      }

      return { status: 'unavailable', message: 'Platform not supported' };
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      return { status: 'unavailable', message: 'Failed to request camera permission' };
    }
  }

  /**
   * Check camera permission status
   */
  async checkCameraPermission(): Promise<PermissionStatus> {
    try {
      if (Platform.OS === 'ios') {
        const lib = getRNPermissions();
        if (!lib) return 'unavailable';
        const result = await lib.check(lib.PERMISSIONS.IOS.CAMERA);
        return convertResult(result, lib.RESULTS);
      }

      if (Platform.OS === 'android') {
        const result = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.CAMERA,
        );
        return result ? 'granted' : 'denied';
      }

      return 'unavailable';
    } catch (error) {
      console.error('Error checking camera permission:', error);
      return 'unavailable';
    }
  }

  /**
   * Request location permission
   */
  async requestLocationPermission(): Promise<PermissionResult> {
    try {
      if (Platform.OS === 'ios') {
        const lib = getRNPermissions();
        if (!lib) return { status: 'unavailable', message: 'Permission module not available (e.g. Expo Go)' };
        const result = await lib.request(lib.PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
        return { status: convertResult(result, lib.RESULTS) };
      }

      if (Platform.OS === 'android') {
        // Always request permission (will show dialog if not granted)
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          return { status: 'granted' };
        } else if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
          return { status: 'blocked' };
        } else {
          return { status: 'denied' };
        }
      }

      return { status: 'unavailable', message: 'Platform not supported' };
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return { status: 'unavailable', message: 'Failed to request location permission' };
    }
  }

  /**
   * Check location permission status
   */
  async checkLocationPermission(): Promise<PermissionStatus> {
    try {
      if (Platform.OS === 'ios') {
        const lib = getRNPermissions();
        if (!lib) return 'unavailable';
        const result = await lib.check(lib.PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
        return convertResult(result, lib.RESULTS);
      }

      if (Platform.OS === 'android') {
        const result = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );
        return result ? 'granted' : 'denied';
      }

      return 'unavailable';
    } catch (error) {
      console.error('Error checking location permission:', error);
      return 'unavailable';
    }
  }

  /**
   * Open app settings
   */
  async openSettings(): Promise<void> {
    try {
      const lib = getRNPermissions();
      if (lib) {
        await lib.openSettings();
        return;
      }
    } catch (error) {
      console.error('Error opening settings:', error);
    }
    try {
      await Linking.openSettings();
    } catch (fallbackError) {
      console.error('Error opening settings via Linking:', fallbackError);
    }
  }

  /**
   * Show alert for blocked permission
   */
  showPermissionBlockedAlert(
    permissionName: string,
    onOpenSettings?: () => void,
  ): void {
    Alert.alert(
      'Izin Diperlukan',
      `Akses ${permissionName} diperlukan untuk menggunakan fitur ini. Silakan aktifkan di Pengaturan.`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Buka Pengaturan',
          onPress: () => {
            if (onOpenSettings) {
              onOpenSettings();
            } else {
              this.openSettings();
            }
          },
        },
      ],
    );
  }
}

export const permissionService = new PermissionService();
