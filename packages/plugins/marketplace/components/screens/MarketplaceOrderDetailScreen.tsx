/**
 * MarketplaceOrderDetailScreen
 * Detail pesanan marketplace: items, status, total, aksi
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { ArrowLeft2, Location, Wallet3, DocumentText } from 'iconsax-react-nativejs';
import {
  scale,
  moderateVerticalScale,
  getHorizontalPadding,
  FontFamily,
  getResponsiveFontSize,
} from '@core/config';
import { useTheme } from '@core/theme';
import { useTranslation } from '@core/i18n';
import { useMarketplaceOrders } from '../../context/MarketplaceOrderContext';
import type { MarketplaceOrderStatus } from '../../models/MarketplaceOrder';

type RouteParams = {
  MarketplaceOrderDetail: { orderId: string };
};

const formatPrice = (price: number): string =>
  `Rp ${price.toLocaleString('id-ID')}`;

const formatDate = (iso: string): string => {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
};

const ORDER_STATUS_I18N_MAP: Record<MarketplaceOrderStatus, string> = {
  belum_dibayar: 'marketplace.orderStatusUnpaid',
  dipesan: 'marketplace.orderStatusOrdered',
  diproses: 'marketplace.orderStatusProcessing',
  dikirim: 'marketplace.orderStatusShipped',
  at_pickup_point: 'marketplace.orderStatusAtPickupPoint',
  selesai: 'marketplace.orderStatusCompleted',
  dibatalkan: 'marketplace.orderStatusCancelled',
  ditolak: 'marketplace.orderStatusRejected',
  ditinjau: 'marketplace.orderStatusReviewed',
};

function getStatusColor(
  status: MarketplaceOrderStatus,
  colors: { success: string; error: string; warning: string; primary: string }
): string {
  switch (status) {
    case 'selesai':
    case 'ditinjau':
      return colors.success;
    case 'dibatalkan':
    case 'ditolak':
      return colors.error;
    case 'belum_dibayar':
      return colors.warning;
    default:
      return colors.primary;
  }
}

const PLACEHOLDER_IMAGE =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect fill="#ddd" width="80" height="80"/></svg>'
  );

export const MarketplaceOrderDetailScreen: React.FC = () => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RouteParams, 'MarketplaceOrderDetail'>>();
  const insets = useSafeAreaInsets();
  const paddingH = getHorizontalPadding();
  const { getOrderById, updateOrderStatus } = useMarketplaceOrders();

  const orderId = route.params?.orderId;
  const order = orderId ? getOrderById(orderId) : undefined;

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleCancel = useCallback(() => {
    if (!orderId) return;
    updateOrderStatus(orderId, 'dibatalkan');
    navigation.goBack();
  }, [orderId, updateOrderStatus, navigation]);

  if (!order) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: colors.background, paddingTop: insets.top + 60 },
        ]}
      >
        <TouchableOpacity onPress={handleBack} style={{ padding: scale(16) }}>
          <ArrowLeft2 size={scale(24)} color={colors.text} variant="Linear" />
        </TouchableOpacity>
        <Text
          style={[
            styles.emptyText,
            { color: colors.textSecondary, textAlign: 'center', paddingHorizontal: paddingH },
          ]}
        >
          {t('marketplace.orderNotFound') || 'Pesanan tidak ditemukan.'}
        </Text>
      </View>
    );
  }

  const statusColor = getStatusColor(order.status, colors);
  const canCancel =
    order.status === 'belum_dibayar' || order.status === 'dipesan';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.surface,
            paddingTop: insets.top + moderateVerticalScale(8),
            paddingHorizontal: paddingH,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft2 size={scale(24)} color={colors.text} variant="Linear" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {t('marketplace.orderDetail') || 'Detail Pesanan'}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: paddingH, paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.cardRow}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              {t('marketplace.orderNumber') || 'No. Pesanan'}
            </Text>
            <Text style={[styles.statusBadge, { color: statusColor }]}>
              {t(ORDER_STATUS_I18N_MAP[order.status])}
            </Text>
          </View>
          <Text style={[styles.orderNumber, { color: colors.text }]}>
            {order.orderNumber}
          </Text>
          <Text style={[styles.date, { color: colors.textSecondary }]}>
            {formatDate(order.createdAt)}
          </Text>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {t('marketplace.orderItems') || 'Produk'}
        </Text>
        {order.items.map((item, index) => (
          <View
            key={`${item.product.id}-${index}`}
            style={[styles.itemRow, { backgroundColor: colors.surface }]}
          >
            <Image
              source={{
                uri: item.product.imageUrl || PLACEHOLDER_IMAGE,
              }}
              style={styles.itemImage}
              resizeMode="cover"
            />
            <View style={styles.itemInfo}>
              <Text
                style={[styles.itemName, { color: colors.text }]}
                numberOfLines={2}
              >
                {item.product.name}
              </Text>
              <Text style={[styles.itemQty, { color: colors.textSecondary }]}>
                {item.quantity} x {formatPrice(item.product.price)}
              </Text>
              <Text style={[styles.itemSubtotal, { color: colors.text }]}>
                {formatPrice(item.subtotal)}
              </Text>
            </View>
          </View>
        ))}

        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
              Subtotal
            </Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              {formatPrice(order.subtotal)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
              Ongkos kirim
            </Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              {formatPrice(order.shippingFee)}
            </Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={[styles.totalLabel, { color: colors.text }]}>
              Total
            </Text>
            <Text style={[styles.totalValue, { color: colors.primary }]}>
              {formatPrice(order.total)}
            </Text>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.infoRow}>
            <Location size={scale(20)} color={colors.textSecondary} variant="Linear" />
            <Text style={[styles.infoText, { color: colors.text }]}>
              {order.address || '-'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Wallet3 size={scale(20)} color={colors.textSecondary} variant="Linear" />
            <Text style={[styles.infoText, { color: colors.text }]}>
              {order.paymentMethod}
            </Text>
          </View>
        </View>

        {order.allowInstallment && order.installments && order.installments.length > 0 && (
          <TouchableOpacity
            style={[styles.card, styles.cicilanCard, { backgroundColor: colors.surface }]}
            onPress={() => {
              (navigation as any).navigate('MarketplaceExplore');
              // Tab Cicilan is inside Marketplace; user can switch tab
            }}
          >
            <DocumentText size={scale(20)} color={colors.primary} variant="Linear" />
            <Text style={[styles.cicilanText, { color: colors.primary }]}>
              {t('marketplace.viewInstallments') || 'Lihat cicilan'}
            </Text>
          </TouchableOpacity>
        )}

        {canCancel && (
          <TouchableOpacity
            style={[styles.cancelButton, { borderColor: colors.error }]}
            onPress={handleCancel}
          >
            <Text style={[styles.cancelButtonText, { color: colors.error }]}>
              {t('marketplace.cancelOrder') || 'Batalkan pesanan'}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: moderateVerticalScale(12),
    borderBottomWidth: 1,
  },
  backButton: { padding: scale(4) },
  headerTitle: {
    fontFamily: FontFamily?.monasans?.semiBold ?? 'System',
    fontSize: getResponsiveFontSize('large'),
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: { width: scale(32) },
  scroll: { flex: 1 },
  scrollContent: { paddingTop: moderateVerticalScale(16), gap: moderateVerticalScale(16) },
  card: {
    padding: scale(16),
    borderRadius: 12,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(4),
  },
  label: {
    fontFamily: FontFamily?.monasans?.regular ?? 'System',
    fontSize: getResponsiveFontSize('small'),
  },
  statusBadge: {
    fontFamily: FontFamily?.monasans?.semiBold ?? 'System',
    fontSize: getResponsiveFontSize('small'),
  },
  orderNumber: {
    fontFamily: FontFamily?.monasans?.bold ?? 'System',
    fontSize: getResponsiveFontSize('medium'),
  },
  date: {
    fontFamily: FontFamily?.monasans?.regular ?? 'System',
    fontSize: getResponsiveFontSize('small'),
    marginTop: scale(4),
  },
  sectionTitle: {
    fontFamily: FontFamily?.monasans?.bold ?? 'System',
    fontSize: getResponsiveFontSize('medium'),
    marginTop: scale(4),
  },
  itemRow: {
    flexDirection: 'row',
    padding: scale(12),
    borderRadius: 12,
    gap: scale(12),
  },
  itemImage: { width: scale(72), height: scale(72), borderRadius: 8 },
  itemInfo: { flex: 1 },
  itemName: {
    fontFamily: FontFamily?.monasans?.semiBold ?? 'System',
    fontSize: getResponsiveFontSize('medium'),
  },
  itemQty: {
    fontFamily: FontFamily?.monasans?.regular ?? 'System',
    fontSize: getResponsiveFontSize('small'),
    marginTop: scale(4),
  },
  itemSubtotal: {
    fontFamily: FontFamily?.monasans?.semiBold ?? 'System',
    fontSize: getResponsiveFontSize('small'),
    marginTop: scale(4),
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: scale(8),
  },
  totalRow: { marginTop: scale(8), marginBottom: 0, paddingTop: scale(8), borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.06)' },
  summaryLabel: {
    fontFamily: FontFamily?.monasans?.regular ?? 'System',
    fontSize: getResponsiveFontSize('medium'),
  },
  summaryValue: {
    fontFamily: FontFamily?.monasans?.regular ?? 'System',
    fontSize: getResponsiveFontSize('medium'),
  },
  totalLabel: {
    fontFamily: FontFamily?.monasans?.bold ?? 'System',
    fontSize: getResponsiveFontSize('medium'),
  },
  totalValue: {
    fontFamily: FontFamily?.monasans?.bold ?? 'System',
    fontSize: getResponsiveFontSize('medium'),
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(12),
    marginBottom: scale(12),
  },
  infoText: {
    flex: 1,
    fontFamily: FontFamily?.monasans?.regular ?? 'System',
    fontSize: getResponsiveFontSize('medium'),
  },
  cicilanCard: { flexDirection: 'row', alignItems: 'center', gap: scale(12) },
  cicilanText: {
    fontFamily: FontFamily?.monasans?.semiBold ?? 'System',
    fontSize: getResponsiveFontSize('medium'),
  },
  cancelButton: {
    padding: scale(16),
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontFamily: FontFamily?.monasans?.semiBold ?? 'System',
    fontSize: getResponsiveFontSize('medium'),
  },
  emptyText: {
    fontFamily: FontFamily?.monasans?.regular ?? 'System',
    fontSize: getResponsiveFontSize('medium'),
  },
});

export default MarketplaceOrderDetailScreen;
