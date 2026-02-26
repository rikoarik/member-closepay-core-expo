/**
 * AddressSection
 * Bagian alamat pengiriman di checkout: tampilkan alamat terpilih atau CTA pilih/tambah alamat
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Location, ArrowRight2 } from 'iconsax-react-nativejs';
import { scale, getHorizontalPadding, FontFamily } from '@core/config';
import { useTheme } from '@core/theme';
import { useTranslation } from '@core/i18n';
import type { Address } from '../../models/Address';
import { getAddressDisplayLabel } from '../../models/Address';

export interface AddressSectionProps {
  selectedAddress: Address | null;
  onPress: () => void;
}

export const AddressSection: React.FC<AddressSectionProps> = ({ selectedAddress, onPress }) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <TouchableOpacity
      style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.sectionHeader}>
        <Location size={scale(20)} color={colors.primary} variant="Bold" />
        <Text style={[styles.sectionTitle, { color: colors.text, marginLeft: scale(8) }]}>
          {t('marketplace.shippingAddress')}
        </Text>
      </View>
      {selectedAddress ? (
        <>
          <View style={styles.badgeRow}>
            <Text style={[styles.labelBadge, { color: colors.primary, backgroundColor: colors.primaryLight }]}>
              {getAddressDisplayLabel(selectedAddress.label, selectedAddress.customLabel)}
            </Text>
            {selectedAddress.isDefault && (
              <Text style={[styles.defaultBadge, { color: colors.primary }]}>{t('marketplace.defaultAddress')}</Text>
            )}
          </View>
          <Text style={[styles.recipientName, { color: colors.text }]}>{selectedAddress.recipientName}</Text>
          <Text style={[styles.addressLine, { color: colors.textSecondary }]} numberOfLines={2}>
            {selectedAddress.fullAddress}
          </Text>
          <Text style={[styles.areaLine, { color: colors.textSecondary }]}>
            {[selectedAddress.district, selectedAddress.city, selectedAddress.province].filter(Boolean).join(', ')}
          </Text>
          <View style={[styles.chevronRow, { borderTopColor: colors.border }]}>
            <Text style={[styles.changeText, { color: colors.primary }]}>{t('marketplace.selectAddress')}</Text>
            <ArrowRight2 size={scale(18)} color={colors.primary} variant="Linear" />
          </View>
        </>
      ) : (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('marketplace.noAddressYet')}</Text>
          <Text style={[styles.ctaText, { color: colors.primary }]}>{t('marketplace.selectAddress')} →</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  section: {
    borderRadius: scale(12),
    padding: scale(16),
    marginBottom: scale(16),
    borderWidth: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scale(12),
  },
  sectionTitle: {
    fontSize: scale(16),
    fontFamily: FontFamily.monasans.bold,
  },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: scale(8), marginBottom: scale(6) },
  labelBadge: {
    fontSize: scale(12),
    fontFamily: FontFamily.monasans.semiBold,
    paddingHorizontal: scale(8),
    paddingVertical: scale(4),
    borderRadius: scale(6),
  },
  defaultBadge: { fontSize: scale(12), fontFamily: FontFamily.monasans.medium },
  recipientName: {
    fontSize: scale(15),
    fontFamily: FontFamily.monasans.semiBold,
    marginBottom: scale(4),
  },
  addressLine: { fontSize: scale(14), fontFamily: FontFamily.monasans.regular, marginBottom: scale(2) },
  areaLine: { fontSize: scale(13), fontFamily: FontFamily.monasans.regular, marginBottom: scale(8) },
  chevronRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: scale(4),
    paddingTop: scale(8),
    borderTopWidth: 1,
  },
  changeText: { fontSize: scale(13), fontFamily: FontFamily.monasans.semiBold },
  emptyState: { paddingVertical: scale(8) },
  emptyText: { fontSize: scale(14), fontFamily: FontFamily.monasans.regular, marginBottom: scale(4) },
  ctaText: { fontSize: scale(14), fontFamily: FontFamily.monasans.semiBold },
});
