/**
 * QR/Barcode scan screen using expo-camera (works in Expo Go on iOS & Android).
 * Used when react-native-vision-camera is not available (Expo Go).
 */
import React, { useCallback, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Gallery, Flash } from 'iconsax-react-nativejs';
import { scale, FontFamily } from '@core/config';
import { useTheme } from '@core/theme';
import { useTranslation } from '@core/i18n';
import * as ImagePicker from 'expo-image-picker';

interface QrScanScreenExpoProps {
  isActive: boolean;
  onScanned?: (value: string, type: 'qr' | 'barcode') => void;
  onHeaderActionsReady?: (actions: React.ReactNode | null) => void;
}

export const QrScanScreenExpo: React.FC<QrScanScreenExpoProps> = ({
  isActive,
  onScanned,
  onHeaderActionsReady,
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [scanned, setScanned] = useState(false);
  const lastScannedRef = useRef<string | null>(null);
  const lastScannedTimeRef = useRef(0);

  const handleBarcodeScanned = useCallback(
    ({ data, type }: { data: string; type: string }) => {
      if (!onScanned || !data) return;
      const now = Date.now();
      if (data === lastScannedRef.current && now - lastScannedTimeRef.current < 2000) return;
      lastScannedRef.current = data;
      lastScannedTimeRef.current = now;
      setScanned(true);
      const scanType: 'qr' | 'barcode' = type?.toLowerCase()?.includes('qr') ? 'qr' : 'barcode';
      onScanned(data, scanType);
      setTimeout(() => setScanned(false), 1500);
    },
    [onScanned]
  );

  const handlePickFromGallery = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 1,
    });
    if (result.canceled || !result.assets?.[0]?.uri) return;
    // TODO: decode QR from image (expo-barcode-image or similar)
  }, []);

  React.useEffect(() => {
    if (!onHeaderActionsReady) return;
    onHeaderActionsReady(
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: scale(8) }}>
        <TouchableOpacity onPress={handlePickFromGallery}>
          <Gallery size={scale(24)} color="white" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setFlashEnabled((v) => !v)}>
          <Flash size={scale(24)} color={flashEnabled ? '#FFD700' : 'white'} variant={flashEnabled ? 'Bold' : 'Linear'} />
        </TouchableOpacity>
      </View>
    );
    return () => onHeaderActionsReady(null);
  }, [onHeaderActionsReady, flashEnabled, handlePickFromGallery]);

  if (!permission) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.surface }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.message, { color: colors.text }]}>{t('qr.cameraLoading') || 'Memuat kamera...'}</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.surface }]}>
        <Text style={[styles.message, { color: colors.text, textAlign: 'center', marginBottom: 16 }]}>
          {t('qr.cameraPermissionRequired') || 'Izin kamera diperlukan untuk scan QR.'}
        </Text>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={() => requestPermission()}
        >
          <Text style={[styles.buttonText, { color: colors.surface }]}>{t('qr.grantPermission') || 'Izinkan'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: 'transparent', marginTop: 8 }]}
          onPress={() => Linking.openSettings()}
        >
          <Text style={[styles.buttonText, { color: colors.primary }]}>{t('qr.openSettings') || 'Buka Pengaturan'}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={StyleSheet.absoluteFill}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        enableTorch={flashEnabled}
        barcodeScannerSettings={{ barcodeTypes: ['qr', 'code128', 'code39', 'ean13'] }}
        onBarcodeScanned={isActive && !scanned ? handleBarcodeScanned : undefined}
      />
      <View style={[styles.overlay, { paddingBottom: insets.bottom + 80 }]} pointerEvents="box-none">
        <View style={[styles.scanHint, { borderColor: colors.primary }]}>
          <Text style={[styles.scanHintText, { color: 'white' }]}>
            {t('qr.pointAtQr') || 'Arahkan kamera ke QR code'}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    fontFamily: FontFamily.monasans.medium,
    fontSize: scale(14),
  },
  button: {
    paddingHorizontal: scale(24),
    paddingVertical: scale(12),
    borderRadius: scale(8),
  },
  buttonText: {
    fontFamily: FontFamily.monasans.semiBold,
    fontSize: scale(14),
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  scanHint: {
    paddingHorizontal: scale(16),
    paddingVertical: scale(10),
    borderRadius: scale(8),
    borderWidth: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  scanHintText: {
    fontFamily: FontFamily.monasans.medium,
    fontSize: scale(13),
  },
});
