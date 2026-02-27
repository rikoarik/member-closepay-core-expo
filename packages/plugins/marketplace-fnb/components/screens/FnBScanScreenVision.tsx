/**
 * FnBScanScreenVision – QR/Barcode scan with react-native-vision-camera.
 * Used in dev client / prebuild. Not used in Expo Go (use FnBScanScreenExpo).
 */

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
  Alert,
  Easing,
  PermissionsAndroid,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { ArrowLeft2, Flash, Gallery, ScanBarcode } from 'iconsax-react-nativejs';
import {
  Camera,
  useCameraDevice,
  useCodeScanner,
  useCameraPermission,
} from 'react-native-vision-camera';
import { scale, moderateVerticalScale, getHorizontalPadding, FontFamily } from '@core/config';
import { useTheme } from '@core/theme';
import { useTranslation } from '@core/i18n';
import { parseFnBQRCode } from '../../models';

export const FnBScanScreenVision: React.FC = () => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const horizontalPadding = getHorizontalPadding();

  const { hasPermission: hasCameraPermission, requestPermission: requestCameraPermission } = useCameraPermission();
  const [permissionDeniedByUser, setPermissionDeniedByUser] = useState(false);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [isScanning, setIsScanning] = useState(true);
  const [isCameraInitializing, setIsCameraInitializing] = useState(true);
  const [zoom, setZoom] = useState(1);

  const scanLineAnim = useRef(new Animated.Value(0)).current;

  const device = useCameraDevice('back');
  const format = useMemo(() => {
    return (
      device?.formats.find(
        (f: { videoWidth: number; videoHeight: number; maxFps: number }) =>
          f.videoWidth === 1920 && f.videoHeight === 1080 && f.maxFps >= 60
      ) || device?.formats[0]
    );
  }, [device]);

  useEffect(() => {
    if (device) {
      setIsCameraInitializing(false);
    } else {
      const timer = setTimeout(() => {
        setIsCameraInitializing(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [device]);

  useEffect(() => {
    if (hasCameraPermission) return;
    const run = async () => {
      setIsRequestingPermission(true);
      try {
        const granted = await requestCameraPermission();
        if (!granted) setPermissionDeniedByUser(true);
      } finally {
        setIsRequestingPermission(false);
      }
    };
    run();
  }, [hasCameraPermission, requestCameraPermission]);

  useFocusEffect(
    useCallback(() => {
      setIsScanning(true);
      return () => {};
    }, [])
  );


  useEffect(() => {
    const startAnimation = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineAnim, {
            toValue: 1,
            duration: 2000,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(scanLineAnim, {
            toValue: 0,
            duration: 2000,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      ).start();
    };
    startAnimation();
  }, [scanLineAnim]);

  const handleCodeScanned = useCallback(
    (code: string) => {
      if (!isScanning) return;
      setIsScanning(false);
      const fnbData = parseFnBQRCode(code);
      if (fnbData) {
        (navigation as any).navigate('FnB', {
          storeId: fnbData.storeId,
          storeName: fnbData.storeName,
          entryPoint: 'scan-qr',
        });
      } else {
        Alert.alert(
          'QR Tidak Valid',
          'Kode QR ini bukan kode toko FnB yang valid. Silakan scan kode QR toko yang benar.',
          [
            { text: 'Scan Lagi', onPress: () => setIsScanning(true) },
            { text: 'Kembali', onPress: () => navigation.goBack(), style: 'cancel' as const },
          ]
        );
      }
    },
    [isScanning, navigation]
  );

  const codeScanner = useCodeScanner({
    codeTypes: ['qr', 'ean-13', 'ean-8', 'code-128', 'code-39'],
    onCodeScanned: (codes) => {
      if (codes.length > 0 && codes[0].value) {
        handleCodeScanned(codes[0].value);
      }
    },
  });

  const toggleFlash = useCallback(() => {
    setIsFlashOn((prev) => !prev);
  }, []);

  const scanLineTranslateY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, scale(200)],
  });

  const permissionDenied = !hasCameraPermission && permissionDeniedByUser;
  const canShowCamera = !isCameraInitializing && device && hasCameraPermission;

  if (isRequestingPermission) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={[styles.permissionText, { color: colors.textSecondary }]}>
          Meminta izin kamera...
        </Text>
      </View>
    );
  }

  if (permissionDenied) {
    return (
      <View
        style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}
      >
        <Text style={[styles.permissionText, { color: colors.textSecondary }]}>
          Izin kamera diperlukan untuk scan barcode toko
        </Text>
        <TouchableOpacity
          style={[styles.permissionButton, { backgroundColor: colors.primary }]}
          onPress={() => Linking.openSettings()}
        >
          <Text style={[styles.permissionButtonText, { color: colors.surface }]}>
            Buka Pengaturan
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.backButton, { borderColor: colors.border }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.backButtonText, { color: colors.text }]}>Kembali</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!device) {
    return (
      <View
        style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}
      >
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={[styles.permissionText, { color: colors.textSecondary }]}>
          {isCameraInitializing ? 'Memuat kamera...' : 'Kamera tidak tersedia'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {canShowCamera && (
        <Camera
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={isScanning}
          codeScanner={codeScanner}
          torch={isFlashOn ? 'on' : 'off'}
          zoom={zoom}
          format={format}
        />
      )}
      <View style={styles.overlayContainer} pointerEvents="box-none">
        <View style={styles.overlayTop} pointerEvents="none" />
        <View style={styles.overlayMiddle} pointerEvents="none">
          <View style={styles.overlaySide} pointerEvents="none" />
          <View style={styles.scanWindow} pointerEvents="none">
            <View style={[styles.corner, styles.cornerTopLeft, { borderColor: colors.primary }]} />
            <View style={[styles.corner, styles.cornerTopRight, { borderColor: colors.primary }]} />
            <View style={[styles.corner, styles.cornerBottomLeft, { borderColor: colors.primary }]} />
            <View style={[styles.corner, styles.cornerBottomRight, { borderColor: colors.primary }]} />
            <Animated.View
              style={[
                styles.scanLine,
                {
                  backgroundColor: colors.primary,
                  transform: [{ translateY: scanLineTranslateY }],
                },
              ]}
            />
          </View>
          <View style={styles.overlaySide} pointerEvents="none" />
        </View>
        <View style={styles.overlayBottom} pointerEvents="box-none">
          <View style={[styles.instructions, { paddingHorizontal: horizontalPadding }]}>
            <Text style={styles.instructionTitle}>Arahkan kamera ke QR Code Toko</Text>
            <Text style={styles.instructionSubtitle}>
              Scan QR code di meja atau banner toko untuk langsung memesan
            </Text>
          </View>
          <View
            style={[
              styles.bottomActions,
              {
                paddingBottom: insets.bottom + moderateVerticalScale(20),
                paddingHorizontal: horizontalPadding,
              },
            ]}
          >
            <TouchableOpacity style={styles.actionButton}>
              <View style={[styles.actionIconContainer, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                <Gallery size={scale(24)} color="#FFFFFF" variant="Linear" />
              </View>
              <Text style={styles.actionText}>{t('common.gallery') || 'Galeri'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <View
        style={[
          styles.header,
          {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            paddingTop: insets.top + moderateVerticalScale(8),
            paddingHorizontal: horizontalPadding,
            zIndex: 20,
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.headerButton, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft2 size={scale(24)} color="#FFFFFF" variant="Linear" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <ScanBarcode size={scale(24)} color="#FFFFFF" variant="Bold" />
          <Text style={styles.headerTitle}>{t('fnb.scanStore') || 'Scan Toko FnB'}</Text>
        </View>
        <TouchableOpacity
          style={[styles.headerButton, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
          onPress={toggleFlash}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Flash
            size={scale(24)}
            color={isFlashOn ? '#FFD700' : '#FFFFFF'}
            variant={isFlashOn ? 'Bold' : 'Linear'}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  centerContent: { justifyContent: 'center', alignItems: 'center' },
  overlayContainer: { ...StyleSheet.absoluteFillObject, zIndex: 1, pointerEvents: 'box-none' },
  overlayTop: { flex: 0.7, backgroundColor: 'rgba(0, 0, 0, 0.6)' },
  overlayMiddle: { flexDirection: 'row', height: scale(260) },
  overlaySide: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)' },
  scanWindow: { width: scale(260), height: scale(260) },
  overlayBottom: {
    flex: 1.3,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'space-between',
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerButton: {
    width: scale(44),
    height: scale(44),
    borderRadius: scale(22),
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: scale(18),
    fontFamily: FontFamily?.monasans?.bold ?? 'System',
    marginLeft: scale(8),
  },
  corner: {
    position: 'absolute',
    width: scale(30),
    height: scale(30),
    borderWidth: 3,
  },
  cornerTopLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  cornerTopRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  cornerBottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  cornerBottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  scanLine: {
    position: 'absolute',
    left: scale(10),
    right: scale(10),
    height: 2,
    borderRadius: 1,
  },
  instructions: { alignItems: 'center', paddingVertical: moderateVerticalScale(24) },
  instructionTitle: {
    color: '#FFFFFF',
    fontSize: scale(16),
    fontFamily: FontFamily?.monasans?.semiBold ?? 'System',
    textAlign: 'center',
    marginBottom: scale(8),
  },
  instructionSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: scale(13),
    fontFamily: FontFamily?.monasans?.regular ?? 'System',
    textAlign: 'center',
  },
  bottomActions: { flexDirection: 'row', justifyContent: 'center' },
  actionButton: { alignItems: 'center' },
  actionIconContainer: {
    width: scale(56),
    height: scale(56),
    borderRadius: scale(28),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scale(8),
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: scale(12),
    fontFamily: FontFamily?.monasans?.regular ?? 'System',
  },
  permissionText: {
    fontSize: scale(14),
    fontFamily: FontFamily?.monasans?.regular ?? 'System',
    textAlign: 'center',
    marginTop: moderateVerticalScale(16),
    marginBottom: moderateVerticalScale(16),
    paddingHorizontal: scale(32),
  },
  permissionButton: {
    paddingHorizontal: scale(24),
    paddingVertical: scale(12),
    borderRadius: scale(8),
    marginBottom: scale(12),
  },
  permissionButtonText: {
    fontSize: scale(14),
    fontFamily: FontFamily?.monasans?.semiBold ?? 'System',
  },
  backButton: {
    paddingHorizontal: scale(24),
    paddingVertical: scale(12),
    borderRadius: scale(8),
    borderWidth: 1,
  },
  backButtonText: {
    fontSize: scale(14),
    fontFamily: FontFamily?.monasans?.regular ?? 'System',
  },
});

export default FnBScanScreenVision;
