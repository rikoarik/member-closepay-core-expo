/**
 * useCurrentLocation
 * Ambil posisi GPS saat ini via expo-location (untuk map pick point)
 */

import { useCallback, useState } from 'react';
import { Platform, Alert } from 'react-native';
import * as ExpoLocation from 'expo-location';

export interface Coords {
  latitude: number;
  longitude: number;
}

export function useCurrentLocation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCurrentPosition = useCallback(async (): Promise<Coords | null> => {
    if (Platform.OS === 'web') {
      setError('Lokasi tidak tersedia di web.');
      return null;
    }
    setLoading(true);
    setError(null);
    try {
      const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        const msg = 'Aktifkan akses lokasi untuk menggunakan fitur peta.';
        setError(msg);
        return null;
      }
      const position = await ExpoLocation.getCurrentPositionAsync({
        accuracy: ExpoLocation.Accuracy.Balanced,
      });
      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
    } catch {
      const msg = 'Tidak dapat mengambil lokasi. Pastikan GPS aktif.';
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const requestAndGetPosition = useCallback(
    async (onDenied?: () => void): Promise<Coords | null> => {
      const coords = await getCurrentPosition();
      if (!coords && onDenied) onDenied();
      return coords;
    },
    [getCurrentPosition]
  );

  return {
    getCurrentPosition: requestAndGetPosition,
    loading,
    error,
    clearError: () => setError(null),
  };
}
