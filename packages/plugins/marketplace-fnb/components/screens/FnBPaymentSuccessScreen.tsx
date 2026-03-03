/**
 * FnBPaymentSuccessScreen
 * Payment Success – design: celebration gradient, success icon, Order No & Table No card,
 * transaction details (Restaurant, Total Paid, Payment Method), View E-Receipt,
 * Back to Home / Order More Items.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, StackActions } from '@react-navigation/native';
import { TickCircle, ReceiptItem, Card } from 'iconsax-react-nativejs';
import {
  scale,
  moderateVerticalScale,
  getHorizontalPadding,
  FontFamily,
} from '@core/config';
import { useTheme } from '@core/theme';
import { useTranslation } from '@core/i18n';

const formatPrice = (price: number): string =>
  `Rp ${price.toLocaleString('id-ID')}`;

export const FnBPaymentSuccessScreen: React.FC = () => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const horizontalPadding = getHorizontalPadding();

  const params = route.params as {
    orderId?: string;
    storeId?: string;
    storeName?: string;
    total?: number;
    tableNumber?: string;
    orderType?: 'dine-in' | 'take-away' | 'delivery';
    pickupTime?: string;
    deliveryAddress?: string;
  } | undefined;

  const orderType = params?.orderType || 'dine-in';
  const deliveryAddress = (params?.deliveryAddress?.trim() || '') || '—';
  const pickupTimeDisplay =
    (params?.pickupTime?.trim() || '') || (t('fnb.pickupTimeAsOrder') || 'Sesuai pesanan');
  const orderIdShort = params?.orderId
    ? params.orderId.replace(/^ORD-FNB-/i, '').slice(-4)
    : '—';
  const storeName = params?.storeName || (t('fnb.merchantName') as string) || 'Merchant';
  const total = params?.total ?? 0;
  const tableNumber = params?.tableNumber || '—';

  const handleBackToHome = () => {
    (navigation as any).navigate('FnB');
  };

  const handleOrderMore = () => {
    if (params?.storeId) {
      (navigation as any).navigate('FnBMerchantDetail', {
        storeId: params.storeId,
        entryPoint: 'browse',
      });
    } else {
      (navigation as any).navigate('FnB');
    }
  };

  const handleViewReceipt = () => {
    if (params?.orderId) {
      navigation.dispatch(
        StackActions.replace('FnBOrderStatus', { orderId: params.orderId })
      );
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.gradientDecoration, { backgroundColor: colors.primary + '15' }]} />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + scale(64),
            paddingBottom: insets.bottom + scale(24),
            paddingHorizontal: horizontalPadding,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={[styles.iconWrap, { backgroundColor: colors.primary + '20' }]}>
            <TickCircle size={scale(64)} color={colors.primary} variant="Bold" />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>
            {t('fnb.paymentSuccessful') || 'Payment Successful!'}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {orderType === 'dine-in'
              ? (t('fnb.paymentSuccessThankYouDineIn') || 'Terima kasih telah makan di tempat kami. Pesanan Anda telah dikonfirmasi.')
              : orderType === 'take-away'
                ? (t('fnb.paymentSuccessThankYouTakeAway') || 'Terima kasih telah memesan. Pesanan take away Anda telah dikonfirmasi.')
                : (t('fnb.paymentSuccessThankYouDelivery') || 'Terima kasih telah memesan. Pesanan delivery Anda telah dikonfirmasi.')}
          </Text>

          {/* Key info card: Order No + second field by order type */}
          <View style={[styles.infoCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
            {orderType === 'dine-in' ? (
              <View style={styles.infoCardGrid}>
                <View style={styles.infoCardCell}>
                  <Text style={[styles.infoCardLabel, { color: colors.textSecondary }]}>
                    {t('fnb.orderNo') || 'Pesanan'}
                  </Text>
                  <Text style={[styles.infoCardValue, { color: colors.text }]}>#{orderIdShort}</Text>
                </View>
                <View style={[styles.infoCardDivider, { borderColor: colors.border }]} />
                <View style={styles.infoCardCell}>
                  <Text style={[styles.infoCardLabel, { color: colors.textSecondary }]}>
                    {t('fnb.tableNo') || 'Meja No'}
                  </Text>
                  <Text style={[styles.infoCardValue, { color: colors.text }]}>{tableNumber}</Text>
                </View>
              </View>
            ) : (
              <View style={styles.infoCardStack}>
                <View style={styles.infoCardRow}>
                  <Text style={[styles.infoCardLabel, { color: colors.textSecondary }]}>
                    {t('fnb.orderNo') || 'Pesanan'}
                  </Text>
                  <Text style={[styles.infoCardValue, styles.infoCardValueSmall, { color: colors.text }]}>
                    #{orderIdShort}
                  </Text>
                </View>
                <View style={[styles.infoCardRowDivider, { borderColor: colors.border }]} />
                <View style={styles.infoCardRow}>
                  <Text style={[styles.infoCardLabel, { color: colors.textSecondary }]}>
                    {orderType === 'take-away'
                      ? (t('fnb.pickupTime') || 'Waktu Pengambilan')
                      : (t('fnb.deliveryAddress') || 'Alamat')}
                  </Text>
                  <Text
                    style={[styles.infoCardValue, styles.infoCardValueSmall, { color: colors.text }]}
                    numberOfLines={3}
                  >
                    {orderType === 'take-away' ? pickupTimeDisplay : deliveryAddress}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Transaction details */}
          <View style={styles.details}>
            <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                {t('fnb.restaurant') || 'Restaurant'}
              </Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{storeName}</Text>
            </View>
            <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                {t('fnb.totalPaid') || 'Total Paid'}
              </Text>
              <Text style={[styles.detailValue, styles.detailValueTotal, { color: colors.primary }]}>
                {formatPrice(total)}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                {t('fnb.paymentMethod') || 'Payment Method'}
              </Text>
              <View style={styles.detailValueRow}>
                <Card size={scale(18)} color={colors.textSecondary} variant="Linear" />
                <Text style={[styles.detailValue, { color: colors.text }]}>•••• Balance</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.receiptButton, { borderColor: colors.primary }]}
            onPress={handleViewReceipt}
          >
            <ReceiptItem size={scale(20)} color={colors.primary} variant="Bold" />
            <Text style={[styles.receiptButtonText, { color: colors.primary }]}>
              {t('fnb.viewOrderStatus') || 'Lihat Status Pesanan'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Footer actions */}
      <View
        style={[
          styles.footer,
          {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            paddingBottom: insets.bottom + scale(24),
            paddingHorizontal: horizontalPadding,
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: colors.primary }]}
          onPress={handleBackToHome}
        >
          <Text style={[styles.primaryButtonText, { color: '#102222' }]}>
            {t('fnb.backToHome') || 'Back to Home'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.secondaryButton, { borderColor: colors.border }]}
          onPress={handleOrderMore}
        >
          <Text style={[styles.secondaryButtonText, { color: colors.text }]}>
            {t('fnb.orderMoreItems') || 'Order More Items'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientDecoration: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: scale(256),
    pointerEvents: 'none',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: scale(16),
  },
  iconWrap: {
    width: scale(96),
    height: scale(96),
    borderRadius: scale(48),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: scale(24),
  },
  title: {
    fontSize: scale(24),
    fontFamily: FontFamily.monasans.bold,
    marginBottom: scale(8),
    textAlign: 'center',
  },
  subtitle: {
    fontSize: scale(14),
    fontFamily: FontFamily.monasans.regular,
    textAlign: 'center',
    maxWidth: scale(260),
    lineHeight: scale(22),
    marginBottom: scale(32),
  },
  infoCard: {
    width: '100%',
    borderRadius: scale(20),
    padding: scale(24),
    borderWidth: 1,
  },
  infoCardGrid: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  infoCardCell: {
    flex: 1,
    alignItems: 'center',
  },
  infoCardLabel: {
    fontSize: scale(11),
    fontFamily: FontFamily.monasans.semiBold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: scale(4),
  },
  infoCardValue: {
    fontSize: scale(20),
    fontFamily: FontFamily.monasans.bold,
  },
  infoCardDivider: {
    width: 1,
    borderLeftWidth: 1,
    marginVertical: scale(-8),
  },
  infoCardStack: {
    width: '100%',
  },
  infoCardRow: {
    width: '100%',
  },
  infoCardRowDivider: {
    height: 1,
    borderTopWidth: 1,
    marginVertical: scale(12),
  },
  infoCardValueSmall: {
    fontSize: scale(16),
    marginTop: scale(2),
  },
  details: {
    width: '100%',
    marginTop: scale(24),
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: scale(12),
    borderBottomWidth: 1,
  },
  detailLabel: {
    fontSize: scale(14),
    fontFamily: FontFamily.monasans.medium,
  },
  detailValue: {
    fontSize: scale(14),
    fontFamily: FontFamily.monasans.bold,
  },
  detailValueTotal: {
    fontSize: scale(18),
  },
  detailValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
  },
  receiptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(8),
    marginTop: scale(24),
    paddingVertical: scale(12),
    paddingHorizontal: scale(16),
    borderRadius: scale(12),
  },
  receiptButtonText: {
    fontSize: scale(14),
    fontFamily: FontFamily.monasans.bold,
  },
  footer: {
    paddingTop: scale(24),
    borderTopWidth: 1,
    gap: scale(12),
  },
  primaryButton: {
    height: scale(48),
    borderRadius: scale(12),
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: { shadowRadius: 6, shadowOpacity: 0.2 },
      android: { elevation: 3 },
    }),
  },
  primaryButtonText: {
    fontSize: scale(16),
    fontFamily: FontFamily.monasans.bold,
  },
  secondaryButton: {
    height: scale(48),
    borderRadius: scale(12),
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: scale(16),
    fontFamily: FontFamily.monasans.bold,
  },
});

export default FnBPaymentSuccessScreen;
