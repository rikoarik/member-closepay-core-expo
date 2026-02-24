/**
 * FnBLocationPickerModal – Web stub (no react-native-maps)
 * Shows "Pick location not available on web" and close. Same props as native.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { CloseCircle } from 'iconsax-react-nativejs';
import { scale, FontFamily, getHorizontalPadding } from '@core/config';
import { useTheme } from '@core/theme';
import { useTranslation } from '@core/i18n';

export interface FnBLocationPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectAddress: (address: string) => void;
}

export const FnBLocationPickerModal: React.FC<FnBLocationPickerModalProps> = ({
  visible,
  onClose,
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>
            {t('fnb.locationPickerTitle') || 'Pilih lokasi'}
          </Text>
          <TouchableOpacity onPress={onClose} hitSlop={12} style={styles.closeBtn}>
            <CloseCircle size={scale(28)} color={colors.textSecondary} variant="Bold" />
          </TouchableOpacity>
        </View>
        <View style={styles.webPlaceholder}>
          <Text style={[styles.webText, { color: colors.textSecondary }]}>
            {t('fnb.locationNotSupportedWeb') || 'Pilih lokasi tidak tersedia di web.'}
          </Text>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            onPress={onClose}
          >
            <Text style={[styles.primaryButtonText, { color: colors.surface }]}>
              {t('common.close') || 'Tutup'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: getHorizontalPadding(),
    paddingVertical: scale(12),
    borderBottomWidth: 1,
  },
  title: {
    fontSize: scale(18),
    fontFamily: FontFamily.monasans.bold,
  },
  closeBtn: {
    padding: scale(4),
  },
  webPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: scale(24),
  },
  webText: {
    fontSize: scale(16),
    fontFamily: FontFamily.monasans.regular,
    textAlign: 'center',
    marginBottom: scale(24),
  },
  primaryButton: {
    paddingVertical: scale(14),
    borderRadius: scale(10),
    alignItems: 'center',
    minWidth: scale(160),
  },
  primaryButtonText: {
    fontSize: scale(15),
    fontFamily: FontFamily.monasans.semiBold,
  },
});
