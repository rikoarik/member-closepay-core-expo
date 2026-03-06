/**
 * Modal to scan table QR only (for dine-in order from browse).
 * On success returns table number and closes.
 */
import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { scale, FontFamily, getHorizontalPadding } from '@core/config';
import { useTheme } from '@core/theme';
import { useTranslation } from '@core/i18n';
import { parseFnBTableQRCode } from '../../models';

interface FnBScanTableModalProps {
  visible: boolean;
  onClose: () => void;
  onTableScanned: (tableNumber: string) => void;
}

export const FnBScanTableModal: React.FC<FnBScanTableModalProps> = ({
  visible,
  onClose,
  onTableScanned,
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(true);
  const lastScannedRef = useRef<string | null>(null);
  const lastScannedTimeRef = useRef(0);

  const handleBarcodeScanned = useCallback(
    ({ data }: { data: string }) => {
      if (!data || !isScanning) return;
      const now = Date.now();
      if (data === lastScannedRef.current && now - lastScannedTimeRef.current < 2000) return;
      lastScannedRef.current = data;
      lastScannedTimeRef.current = now;
      setIsScanning(false);

      const tableNum = parseFnBTableQRCode(data);
      if (tableNum) {
        onTableScanned(tableNum);
        onClose();
      } else {
        Alert.alert(
          t('fnb.scanTableInvalidTitle') || 'QR Tidak Valid',
          t('fnb.scanTableInvalidMessage') || 'Bukan QR nomor meja. Silakan scan QR di meja.',
          [{ text: t('common.ok') || 'OK', onPress: () => setIsScanning(true) }]
        );
      }
    },
    [isScanning, onTableScanned, onClose, t]
  );

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {!permission ? (
          <View style={styles.centerContent}>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={[styles.message, { color: colors.textSecondary }]}>
              {t('fnb.loadingCamera') || 'Memuat kamera...'}
            </Text>
          </View>
        ) : !permission.granted ? (
          <View style={styles.centerContent}>
            <Text style={[styles.message, { color: colors.textSecondary }]}>
              {t('fnb.scanTablePermission') || 'Izin kamera diperlukan untuk scan nomor meja'}
            </Text>
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
              onPress={() => requestPermission()}
            >
              <Text style={[styles.primaryBtnText, { color: colors.surface }]}>
                {t('common.allow') || 'Izinkan'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.secondaryBtn, { borderColor: colors.border }]} onPress={onClose}>
              <Text style={[styles.secondaryBtnText, { color: colors.text }]}>
                {t('common.cancel') || 'Batal'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <CameraView
              style={StyleSheet.absoluteFill}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={isScanning ? handleBarcodeScanned : undefined}
            />
            <View style={styles.overlay} pointerEvents="box-none">
              <View style={[styles.header, { paddingTop: scale(16), paddingHorizontal: getHorizontalPadding() }]}>
                <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                  <Text style={[styles.cancelText, { color: colors.surface }]}>
                    {t('common.cancel') || 'Batal'}
                  </Text>
                </TouchableOpacity>
                <Text style={[styles.title, { color: colors.surface }]}>
                  {t('fnb.scanTableTitle') || 'Scan Nomor Meja'}
                </Text>
                <View style={{ width: scale(50) }} />
              </View>
              <View style={styles.footer}>
                <Text style={[styles.hint, { color: 'rgba(255,255,255,0.9)' }]}>
                  {t('fnb.scanTableHint') || 'Arahkan kamera ke QR code di meja'}
                </Text>
              </View>
            </View>
          </>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scale(24),
  },
  message: {
    fontSize: scale(15),
    fontFamily: FontFamily.monasans.regular,
    marginBottom: scale(24),
    textAlign: 'center',
  },
  primaryBtn: {
    paddingVertical: scale(12),
    paddingHorizontal: scale(24),
    borderRadius: scale(12),
    marginBottom: scale(12),
  },
  primaryBtnText: {
    fontSize: scale(15),
    fontFamily: FontFamily.monasans.semiBold,
  },
  secondaryBtn: {
    paddingVertical: scale(12),
    paddingHorizontal: scale(24),
    borderRadius: scale(12),
    borderWidth: 1,
  },
  secondaryBtnText: {
    fontSize: scale(15),
    fontFamily: FontFamily.monasans.medium,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cancelText: {
    fontSize: scale(16),
    fontFamily: FontFamily.monasans.medium,
  },
  title: {
    fontSize: scale(17),
    fontFamily: FontFamily.monasans.semiBold,
  },
  footer: {
    paddingHorizontal: getHorizontalPadding(),
    paddingBottom: scale(32),
    alignItems: 'center',
  },
  hint: {
    fontSize: scale(14),
    fontFamily: FontFamily.monasans.regular,
  },
});
