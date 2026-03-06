/**
 * FnBScanScreenExpo – QR/Barcode scan with expo-camera (works in Expo Go).
 * Used when react-native-vision-camera is not available.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Flash, Gallery, ScanBarcode } from 'iconsax-react-nativejs';
import { scale, moderateVerticalScale, getHorizontalPadding, FontFamily, ScreenHeader } from '@core/config';
import { useTheme } from '@core/theme';
import { useTranslation } from '@core/i18n';
import { parseFnBQRCode } from '../../models';

const SCAN_WINDOW_SIZE = scale(260);

export const FnBScanScreenExpo: React.FC = () => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const horizontalPadding = getHorizontalPadding();

  const [permission, requestPermission] = useCameraPermissions();
  const [flashOn, setFlashOn] = useState(false);
  const [isScanning, setIsScanning] = useState(true);
  const lastScannedRef = useRef<string | null>(null);
  const lastScannedTimeRef = useRef(0);
  const scanAnim = useRef(new Animated.Value(0)).current;

  const handleBarcodeScanned = useCallback(
    ({ data }: { data: string }) => {
      if (!data || !isScanning) return;
      const now = Date.now();
      if (data === lastScannedRef.current && now - lastScannedTimeRef.current < 2000) return;
      lastScannedRef.current = data;
      lastScannedTimeRef.current = now;
      setIsScanning(false);

      const fnbData = parseFnBQRCode(data);
      if (fnbData) {
        (navigation as any).navigate('FnBMerchantDetail', {
          storeId: fnbData.storeId,
          entryPoint: 'scan-qr',
          tableNumber: fnbData.tableNumber,
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

  useEffect(() => {
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
  }, [scanAnim]);

  if (!permission) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={[styles.permissionText, { color: colors.textSecondary }]}>
          Memuat kamera...
        </Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}>
        <Text style={[styles.permissionText, { color: colors.textSecondary }]}>
          Izin kamera diperlukan untuk scan barcode toko
        </Text>
        <TouchableOpacity
          style={[styles.permissionButton, { backgroundColor: colors.primary }]}
          onPress={() => requestPermission()}
        >
          <Text style={[styles.permissionButtonText, { color: colors.surface }]}>Izinkan</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.backButton, { borderColor: colors.border }]}
          onPress={() => Linking.openSettings()}
        >
          <Text style={[styles.backButtonText, { color: colors.text }]}>Buka Pengaturan</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.backButton, { borderColor: colors.border, marginTop: scale(12) }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.backButtonText, { color: colors.text }]}>Kembali</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        enableTorch={flashOn}
        barcodeScannerSettings={{ barcodeTypes: ['qr', 'code128', 'code39', 'ean13'] }}
        onBarcodeScanned={isScanning ? handleBarcodeScanned : undefined}
      />
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
                  transform: [{
                    translateY: scanAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, scale(200)],
                    }),
                  }],
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
      <ScreenHeader
        title={t('fnb.scanStore') || 'Scan Toko FnB'}
        onBackPress={() => navigation.goBack()}
        textColor="#FFFFFF"
        rightComponent={
          <TouchableOpacity
            onPress={() => setFlashOn((v) => !v)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={{ width: scale(44), height: scale(44), borderRadius: scale(22), backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}
          >
            <Flash
              size={scale(24)}
              color={flashOn ? '#FFD700' : '#FFFFFF'}
              variant={flashOn ? 'Bold' : 'Linear'}
            />
          </TouchableOpacity>
        }
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          paddingTop: insets.top + moderateVerticalScale(8),
          zIndex: 20,
        }}
        paddingHorizontal={horizontalPadding}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  centerContent: { justifyContent: 'center', alignItems: 'center' },
  overlayContainer: { ...StyleSheet.absoluteFillObject, zIndex: 1, pointerEvents: 'box-none' },
  overlayTop: { flex: 0.7, backgroundColor: 'rgba(0, 0, 0, 0.6)' },
  overlayMiddle: { flexDirection: 'row', height: SCAN_WINDOW_SIZE },
  overlaySide: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)' },
  scanWindow: { width: SCAN_WINDOW_SIZE, height: SCAN_WINDOW_SIZE },
  overlayBottom: {
    flex: 1.3,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'space-between',
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

export default FnBScanScreenExpo;
