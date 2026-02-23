/**
 * QR/Barcode scan screen using expo-camera (works in Expo Go on iOS & Android).
 * Used when react-native-vision-camera is not available (Expo Go).
 * Overlay & scan line animation match the Vision Camera QR screen.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  Animated,
  Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Gallery, Flash } from 'iconsax-react-nativejs';
import { scale, FontFamily } from '@core/config';
import { useTheme } from '@core/theme';
import { useTranslation } from '@core/i18n';
import * as ImagePicker from 'expo-image-picker';

const SCAN_WINDOW_SIZE = scale(260);

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
  const scanAnim = useRef(new Animated.Value(0)).current;

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

  // Scan line animation loop
  useEffect(() => {
    if (!isActive) {
      scanAnim.setValue(0);
      return;
    }
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(scanAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [isActive, scanAnim]);

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
      {/* Dark overlay with scan window hole + corners + scan line (match Vision Camera screen) */}
      <View style={styles.overlayContainer} pointerEvents="box-none">
        <View style={styles.overlayTop} pointerEvents="none" />
        <View style={styles.overlayMiddle} pointerEvents="none">
          <View style={styles.overlaySide} pointerEvents="none" />
          <View style={[styles.scanWindow, { width: SCAN_WINDOW_SIZE, height: SCAN_WINDOW_SIZE }]} pointerEvents="none">
            <View style={[styles.corner, styles.topLeft, { borderColor: colors.primary }]} pointerEvents="none" />
            <View style={[styles.corner, styles.topRight, { borderColor: colors.primary }]} pointerEvents="none" />
            <View style={[styles.corner, styles.bottomLeft, { borderColor: colors.primary }]} pointerEvents="none" />
            <View style={[styles.corner, styles.bottomRight, { borderColor: colors.primary }]} pointerEvents="none" />
            <Animated.View
              style={[
                styles.scanLine,
                {
                  backgroundColor: colors.primary,
                  transform: [{
                    translateY: scanAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, SCAN_WINDOW_SIZE],
                    }),
                  }],
                },
              ]}
              pointerEvents="none"
            />
          </View>
          <View style={styles.overlaySide} pointerEvents="none" />
        </View>
        <View style={styles.overlayBottom} pointerEvents="none" />
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
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
    pointerEvents: 'box-none',
  },
  overlayTop: {
    flex: 0.7,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  overlayMiddle: {
    flexDirection: 'row',
    height: SCAN_WINDOW_SIZE,
  },
  overlayBottom: {
    flex: 1.3,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  overlaySide: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  scanWindow: {
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  corner: {
    position: 'absolute',
    width: scale(20),
    height: scale(20),
    borderWidth: 4,
    borderColor: 'white',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    width: '100%',
    height: 2,
    shadowColor: '#00ff00',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 4,
    shadowRadius: scale(10),
  },
});
