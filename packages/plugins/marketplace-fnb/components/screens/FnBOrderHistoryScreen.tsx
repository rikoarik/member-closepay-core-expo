/**
 * FnBOrderHistoryScreen
 * Layar riwayat pesanan F&B (dipanggil dari header FnBScreen "Riwayat Order").
 */

import React from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft2 } from 'iconsax-react-nativejs';
import {
  scale,
  moderateVerticalScale,
  getHorizontalPadding,
  FontFamily,
} from '@core/config';
import { useTheme } from '@core/theme';
import { useTranslation } from '@core/i18n';

const MOCK_ORDERS = [
  { id: 'ORD-001', items: '2x Nasi Goreng, 1x Es Teh', total: 85000, date: 'Hari ini, 12:30', status: 'Selesai' },
  { id: 'ORD-002', items: '1x Kopi Susu Gula Aren', total: 22000, date: 'Kemarin, 09:15', status: 'Selesai' },
];

const formatPrice = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;

export const FnBOrderHistoryScreen: React.FC = () => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const horizontalPadding = getHorizontalPadding();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + moderateVerticalScale(8),
            paddingBottom: scale(12),
            paddingHorizontal: horizontalPadding,
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft2 size={scale(24)} color={colors.text} variant="Linear" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {t('fnb.riwayatOrder') || 'Riwayat Order'}
        </Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingHorizontal: horizontalPadding, paddingBottom: insets.bottom + scale(24) }}
        showsVerticalScrollIndicator={false}
      >
        {MOCK_ORDERS.map((ord) => (
          <View key={ord.id} style={[styles.card, { backgroundColor: colors.surface }]}>
            <View style={styles.topRow}>
              <Text style={[styles.orderId, { color: colors.text }]}>{ord.id}</Text>
              <View style={[styles.badge, { backgroundColor: '#10B98120' }]}>
                <Text style={styles.badgeText}>{ord.status}</Text>
              </View>
            </View>
            <Text style={[styles.items, { color: colors.textSecondary }]}>{ord.items}</Text>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.bottomRow}>
              <Text style={[styles.date, { color: colors.textSecondary }]}>{ord.date}</Text>
              <Text style={[styles.total, { color: colors.primary }]}>{formatPrice(ord.total)}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  backBtn: {
    width: scale(40),
    height: scale(40),
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: scale(18),
    fontFamily: FontFamily.monasans.bold,
  },
  scroll: { flex: 1 },
  card: {
    padding: scale(16),
    borderRadius: scale(12),
    marginTop: scale(12),
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(8),
  },
  orderId: {
    fontFamily: FontFamily.monasans.bold,
    fontSize: scale(14),
  },
  badge: {
    paddingHorizontal: scale(8),
    paddingVertical: scale(4),
    borderRadius: scale(6),
  },
  badgeText: {
    color: '#10B981',
    fontSize: scale(12),
    fontFamily: FontFamily.monasans.semiBold,
  },
  items: {
    fontFamily: FontFamily.monasans.regular,
    fontSize: scale(14),
    marginBottom: scale(12),
  },
  divider: {
    height: 1,
    marginBottom: scale(12),
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    fontSize: scale(12),
    fontFamily: FontFamily.monasans.regular,
  },
  total: {
    fontFamily: FontFamily.monasans.bold,
    fontSize: scale(14),
  },
});

export default FnBOrderHistoryScreen;
