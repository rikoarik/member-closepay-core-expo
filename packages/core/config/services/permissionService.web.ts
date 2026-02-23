/**
 * Permission Service - Web stub
 */
export type PermissionStatus = 'granted' | 'denied' | 'blocked' | 'unavailable';

export interface PermissionResult {
  status: PermissionStatus;
  message?: string;
}

const stubResult: PermissionResult = { status: 'unavailable' };

const permissionService = {
  checkNotificationPermission: async (): Promise<PermissionStatus> => 'unavailable',
  requestNotificationPermission: async (): Promise<PermissionResult> => stubResult,
  requestCameraPermission: async (): Promise<PermissionResult> => stubResult,
  checkCameraPermission: async (): Promise<PermissionStatus> => 'unavailable',
  requestLocationPermission: async (): Promise<PermissionResult> => stubResult,
  checkLocationPermission: async (): Promise<PermissionStatus> => 'unavailable',
  openSettings: async (): Promise<void> => {},
};

export { permissionService };
