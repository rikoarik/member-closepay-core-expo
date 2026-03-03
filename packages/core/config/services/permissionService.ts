/**
 * Permission Service
 * Menggunakan hanya Expo APIs untuk permissions (notifications, camera, location).
 * Tidak memakai react-native-permissions; kompatibel dengan Expo Go dan development/standalone builds.
 * Di Android Expo Go (SDK 53+), expo-notifications tidak tersedia — pakai hanya PermissionsAndroid.
 * Lihat: https://docs.expo.dev/guides/permissions/
 */

import { Platform, PermissionsAndroid, Alert, Linking } from 'react-native';
import Constants from 'expo-constants';

/** Android di Expo Go: push notifications dihapus dari Expo Go (SDK 53+), jangan panggil expo-notifications. */
const isExpoGoAndroid =
  Platform.OS === 'android' && Constants?.appOwnership === 'expo';

export type PermissionStatus = 'granted' | 'denied' | 'blocked' | 'unavailable';

export interface PermissionResult {
  status: PermissionStatus;
  message?: string;
}

function mapExpoStatus(status: string | undefined): PermissionStatus {
  if (status === 'granted') return 'granted';
  if (status === 'denied') return 'denied';
  if (status === 'undetermined') return 'denied';
  return 'unavailable';
}

class PermissionService {
  private getPostNotificationsPermission(): string {
    return (
      (PermissionsAndroid as any).PERMISSIONS?.POST_NOTIFICATIONS ||
      'android.permission.POST_NOTIFICATIONS'
    );
  }

  async checkNotificationPermission(): Promise<PermissionStatus> {
    if (Platform.OS === 'web') return 'unavailable';
    if (isExpoGoAndroid) {
      if (Number(Platform.Version) >= 33) {
        try {
          const permission = this.getPostNotificationsPermission();
          const ok = await PermissionsAndroid.check(permission as any);
          return ok ? 'granted' : 'denied';
        } catch {
          return 'unavailable';
        }
      }
      return 'granted';
    }
    try {
      const Notifications = require('expo-notifications');
      const res = await Notifications.getPermissionsAsync();
      const status = res?.status ?? (res?.granted ? 'granted' : 'denied');
      return mapExpoStatus(status);
    } catch (e) {
      if (Platform.OS === 'android' && Number(Platform.Version) >= 33) {
        try {
          const permission = this.getPostNotificationsPermission();
          const ok = await PermissionsAndroid.check(permission as any);
          return ok ? 'granted' : 'denied';
        } catch {
          return 'unavailable';
        }
      }
      if (Platform.OS === 'android' && Number(Platform.Version) < 33) return 'granted';
      return 'unavailable';
    }
  }

  async requestNotificationPermission(): Promise<PermissionResult> {
    if (Platform.OS === 'web') {
      return { status: 'unavailable', message: 'Not supported on web' };
    }
    if (isExpoGoAndroid) {
      if (Number(Platform.Version) >= 33) {
        try {
          const current = await this.checkNotificationPermission();
          if (current === 'granted') return { status: 'granted' };
          const permission = this.getPostNotificationsPermission();
          const granted = await PermissionsAndroid.request(permission as any);
          if (granted === PermissionsAndroid.RESULTS.GRANTED) return { status: 'granted' };
          if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) return { status: 'blocked' };
          return { status: 'denied' };
        } catch (err: unknown) {
          return { status: 'denied', message: err instanceof Error ? err.message : undefined };
        }
      }
      return { status: 'granted' };
    }
    try {
      const Notifications = require('expo-notifications');
      const res = await Notifications.requestPermissionsAsync({
        ios: { allowAlert: true, allowBadge: true, allowSound: true },
      });
      const status = res?.status ?? (res?.granted ? 'granted' : 'denied');
      return { status: mapExpoStatus(status) };
    } catch (e) {
      if (Platform.OS === 'android' && Number(Platform.Version) >= 33) {
        try {
          const current = await this.checkNotificationPermission();
          if (current === 'granted') return { status: 'granted' };
          const permission = this.getPostNotificationsPermission();
          const granted = await PermissionsAndroid.request(permission as any);
          if (granted === PermissionsAndroid.RESULTS.GRANTED) return { status: 'granted' };
          if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) return { status: 'blocked' };
          return { status: 'denied' };
        } catch (err: unknown) {
          return { status: 'denied', message: err instanceof Error ? err.message : undefined };
        }
      }
      if (Platform.OS === 'android' && Number(Platform.Version) < 33) {
        return { status: 'granted' };
      }
      return { status: 'unavailable', message: 'Notification permission not available' };
    }
  }

  async requestCameraPermission(): Promise<PermissionResult> {
    try {
      if (Platform.OS === 'web') {
        return { status: 'unavailable', message: 'Not supported on web' };
      }
      const { requestCameraPermissionsAsync } = require('expo-image-picker');
      const { status } = await requestCameraPermissionsAsync();
      return { status: mapExpoStatus(status) };
    } catch (e) {
      if (Platform.OS === 'android') {
        try {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.CAMERA
          );
          if (granted === PermissionsAndroid.RESULTS.GRANTED) return { status: 'granted' };
          if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) return { status: 'blocked' };
          return { status: 'denied' };
        } catch {
          return { status: 'unavailable', message: 'Camera permission not available' };
        }
      }
      return { status: 'unavailable', message: 'Camera permission not available' };
    }
  }

  async checkCameraPermission(): Promise<PermissionStatus> {
    try {
      if (Platform.OS === 'web') return 'unavailable';
      const { getCameraPermissionsAsync } = require('expo-image-picker');
      const { status } = await getCameraPermissionsAsync();
      return mapExpoStatus(status);
    } catch (e) {
      if (Platform.OS === 'android') {
        try {
          const ok = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA);
          return ok ? 'granted' : 'denied';
        } catch {
          return 'unavailable';
        }
      }
      return 'unavailable';
    }
  }

  async requestLocationPermission(): Promise<PermissionResult> {
    try {
      if (Platform.OS === 'web') {
        return { status: 'unavailable', message: 'Not supported on web' };
      }
      const Location = require('expo-location');
      const { status } = await Location.requestForegroundPermissionsAsync();
      return { status: mapExpoStatus(status) };
    } catch (e) {
      if (Platform.OS === 'android') {
        try {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
          );
          if (granted === PermissionsAndroid.RESULTS.GRANTED) return { status: 'granted' };
          if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) return { status: 'blocked' };
          return { status: 'denied' };
        } catch {
          return { status: 'unavailable', message: 'Location permission not available' };
        }
      }
      return { status: 'unavailable', message: 'Location permission not available' };
    }
  }

  async checkLocationPermission(): Promise<PermissionStatus> {
    try {
      if (Platform.OS === 'web') return 'unavailable';
      const Location = require('expo-location');
      const { status } = await Location.getForegroundPermissionsAsync();
      return mapExpoStatus(status);
    } catch (e) {
      if (Platform.OS === 'android') {
        try {
          const ok = await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
          );
          return ok ? 'granted' : 'denied';
        } catch {
          return 'unavailable';
        }
      }
      return 'unavailable';
    }
  }

  async openSettings(): Promise<void> {
    try {
      await Linking.openSettings();
    } catch (e) {
      console.warn('Error opening settings:', e);
    }
  }

  showPermissionBlockedAlert(
    permissionName: string,
    onOpenSettings?: () => void
  ): void {
    Alert.alert(
      'Izin Diperlukan',
      `Akses ${permissionName} diperlukan untuk menggunakan fitur ini. Silakan aktifkan di Pengaturan.`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Buka Pengaturan',
          onPress: () => (onOpenSettings ? onOpenSettings() : this.openSettings()),
        },
      ]
    );
  }
}

export const permissionService = new PermissionService();
