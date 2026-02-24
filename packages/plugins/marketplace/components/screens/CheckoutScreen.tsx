/**
 * CheckoutScreen Component
 * Handles checkout: single product (Buy Now) or cart (selected items)
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackActions } from '@react-navigation/native';
import { ArrowLeft2, Location, Wallet3, TickCircle } from 'iconsax-react-nativejs';
import { scale, moderateVerticalScale, getHorizontalPadding, FontFamily } from '@core/config';
import { useTheme } from '@core/theme';
import { useTranslation } from '@core/i18n';
import { paymentService } from '@plugins/payment';
import { useMarketplaceCart } from '../../hooks/useMarketplaceCart';
import { useMarketplaceOrders } from '../../context/MarketplaceOrderContext';
import type { Product } from '../shared/ProductCard';
import type { MarketplaceOrder, MarketplaceOrderItem } from '../../models/MarketplaceOrder';
import type { MarketplaceInstallment } from '../../models/MarketplaceInstallment';

type CheckoutRouteParams = {
  Checkout: {
    product?: Product;
    quantity?: number;
    fromCart?: boolean;
  };
};

const formatPrice = (price: number): string => {
  return `Rp ${price.toLocaleString('id-ID')}`;
};

const SHIPPING_FEE = 15000;

const PAYMENT_METHODS = [
  { id: 'cod', name: 'Cash on Delivery (COD)', icon: '💵' },
  { id: 'transfer', name: 'Transfer Bank', icon: '🏦' },
  { id: 'ewallet', name: 'E-Wallet', icon: '📱' },
];

export const CheckoutScreen: React.FC = () => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<CheckoutRouteParams, 'Checkout'>>();
  const insets = useSafeAreaInsets();
  const horizontalPadding = getHorizontalPadding();
  const { cartItems, removeSelected } = useMarketplaceCart();
  const { addOrder } = useMarketplaceOrders();

  const params = route.params || {};
  const { product, quantity = 1, fromCart } = params as CheckoutRouteParams['Checkout'];

  const isCartMode = fromCart === true || (!product && cartItems.some((i) => i.selected));
  const selectedCartItems = useMemo(
    () => cartItems.filter((i) => i.selected),
    [cartItems]
  );

  const orderItems: MarketplaceOrderItem[] = useMemo(() => {
    if (product && quantity) {
      return [
        {
          product,
          quantity,
          subtotal: product.price * quantity,
        },
      ];
    }
    return selectedCartItems.map(({ product: p, quantity: q, subtotal: s }) => ({
      product: p,
      quantity: q,
      subtotal: s,
    }));
  }, [product, quantity, selectedCartItems]);

  const subtotal = useMemo(
    () => orderItems.reduce((sum, i) => sum + i.subtotal, 0),
    [orderItems]
  );
  const total = subtotal + SHIPPING_FEE;

  const [address, setAddress] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<string>('cod');
  const [allowInstallment, setAllowInstallment] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasItems = orderItems.length > 0;

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handlePlaceOrder = useCallback(async () => {
    if (!hasItems) {
      Alert.alert(
        t('common.error') || 'Error',
        t('marketplace.selectItemToCheckout') || 'Pilih minimal satu produk.'
      );
      return;
    }
    if (!address.trim()) {
      Alert.alert(
        t('common.error') || 'Error',
        t('marketplace.enterAddress') || 'Masukkan alamat pengiriman.'
      );
      return;
    }

    setIsSubmitting(true);
    const orderId = `MP-${Date.now()}`;
    const orderNumber = `INV/MP/${new Date().toISOString().slice(0, 10).replace(/-/g, '')}/${String(Date.now()).slice(-6)}`;

    try {
      await paymentService.payWithBalance(total, orderId, {
        storeName: 'Marketplace',
        itemCount: orderItems.length,
      });

      const installments: MarketplaceInstallment[] | undefined = allowInstallment
        ? (() => {
            const half = Math.round(total / 2);
            const now = new Date();
            return [
              {
                id: `${orderId}-inst-1`,
                orderId,
                amount: half,
                dueDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                status: 'unpaid',
              },
              {
                id: `${orderId}-inst-2`,
                orderId,
                amount: total - half,
                dueDate: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString(),
                status: 'unpaid',
              },
            ];
          })()
        : undefined;

      const order: MarketplaceOrder = {
        id: orderId,
        orderNumber,
        items: orderItems,
        subtotal,
        shippingFee: SHIPPING_FEE,
        total,
        address: address.trim(),
        paymentMethod: selectedPayment,
        status: 'dipesan',
        createdAt: new Date().toISOString(),
        allowInstallment: !!allowInstallment,
        installments,
      };

      await addOrder(order);
      if (isCartMode) removeSelected();

      navigation.dispatch(
        StackActions.replace('MarketplaceOrderDetail', { orderId: order.id })
      );
    } catch (err) {
      const msg =
        err instanceof Error && err.message.toLowerCase().includes('insufficient')
          ? t('marketplace.insufficientBalance') || 'Saldo tidak mencukupi.'
          : t('marketplace.orderFailed') || 'Gagal memproses pesanan.';
      Alert.alert(t('common.error') || 'Error', msg);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    hasItems,
    address,
    orderItems,
    subtotal,
    total,
    selectedPayment,
    allowInstallment,
    isCartMode,
    addOrder,
    removeSelected,
    navigation,
    t,
  ]);

  if (!hasItems && !product) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },
        ]}
      >
        <Text style={{ color: colors.text }}>
          {t('marketplace.productNotFound') || 'Produk tidak ditemukan'}
        </Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 20 }}>
          <Text style={{ color: colors.primary }}>{t('common.back') || 'Kembali'}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.surface,
            paddingTop: insets.top + moderateVerticalScale(8),
            paddingHorizontal: horizontalPadding,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft2 size={scale(24)} color={colors.text} variant="Linear" />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {t('marketplace.checkout')}
        </Text>

        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: horizontalPadding,
            paddingBottom: insets.bottom + moderateVerticalScale(100),
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Order Summary */}
        <View
          style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('marketplace.orderSummary')}
          </Text>

          {orderItems.map((item, index) => (
            <View key={`${item.product.id}-${index}`} style={styles.productRow}>
              <Image
                source={{
                  uri:
                    item.product.imageUrl ||
                    'data:image/svg+xml,' +
                      encodeURIComponent(
                        '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect fill="#CCCCCC" width="100" height="100"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#666" font-size="12" font-family="sans-serif">Product</text></svg>'
                      ),
                }}
                style={styles.productImage}
                resizeMode="cover"
              />
              <View style={styles.productInfo}>
                <Text style={[styles.productName, { color: colors.text }]} numberOfLines={2}>
                  {item.product.name}
                </Text>
                <Text style={[styles.productPrice, { color: colors.primary }]}>
                  {formatPrice(item.product.price)}
                </Text>
                <Text style={[styles.quantityText, { color: colors.textSecondary }]}>
                  {t('marketplace.quantity')}: {item.quantity}
                </Text>
              </View>
            </View>
          ))}

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Subtotal</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              {formatPrice(subtotal)}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
              {t('marketplace.shippingFee')}
            </Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              {formatPrice(SHIPPING_FEE)}
            </Text>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.summaryRow}>
            <Text style={[styles.totalLabel, { color: colors.text }]}>
              {t('marketplace.total')}
            </Text>
            <Text style={[styles.totalValue, { color: colors.primary }]}>{formatPrice(total)}</Text>
          </View>
        </View>

        {/* Shipping Address */}
        <View
          style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <View style={styles.sectionHeader}>
            <Location size={scale(20)} color={colors.primary} variant="Bold" />
            <Text style={[styles.sectionTitle, { color: colors.text, marginLeft: scale(8) }]}>
              {t('marketplace.shippingAddress')}
            </Text>
          </View>

          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            placeholder={t('marketplace.enterAddress')}
            placeholderTextColor={colors.textSecondary}
            value={address}
            onChangeText={setAddress}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Payment Method */}
        <View
          style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <View style={styles.sectionHeader}>
            <Wallet3 size={scale(20)} color={colors.primary} variant="Bold" />
            <Text style={[styles.sectionTitle, { color: colors.text, marginLeft: scale(8) }]}>
              {t('marketplace.paymentMethod')}
            </Text>
          </View>

          {PAYMENT_METHODS.map((method) => (
            <TouchableOpacity
              key={method.id}
              style={[
                styles.paymentOption,
                {
                  borderColor: selectedPayment === method.id ? colors.primary : colors.border,
                  backgroundColor:
                    selectedPayment === method.id ? colors.primaryLight : 'transparent',
                },
              ]}
              onPress={() => setSelectedPayment(method.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.paymentIcon}>{method.icon}</Text>
              <Text
                style={[
                  styles.paymentName,
                  {
                    color: selectedPayment === method.id ? colors.primary : colors.text,
                  },
                ]}
              >
                {method.name}
              </Text>
              {selectedPayment === method.id && (
                <TickCircle size={scale(20)} color={colors.primary} variant="Bold" />
              )}
            </TouchableOpacity>
          ))}

        {/* Cicilan option */}
        <View style={[styles.installmentRow, { borderTopColor: colors.border }]}>
          <Text style={[styles.installmentLabel, { color: colors.text }]}>
            {t('marketplace.payWithInstallment') || 'Bayar dengan cicilan (2x)'}
          </Text>
          <Switch
            value={allowInstallment}
            onValueChange={setAllowInstallment}
            trackColor={{ false: colors.border, true: colors.primaryLight }}
            thumbColor={allowInstallment ? colors.primary : colors.textSecondary}
          />
        </View>
        </View>
      </ScrollView>

      {/* Bottom Bar */}
      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: colors.surface,
            paddingBottom: insets.bottom + moderateVerticalScale(12),
            paddingHorizontal: horizontalPadding,
          },
        ]}
      >
        <View style={styles.totalContainer}>
          <Text style={[styles.bottomTotalLabel, { color: colors.textSecondary }]}>
            {t('marketplace.total')}
          </Text>
          <Text style={[styles.bottomTotalValue, { color: colors.primary }]}>
            {formatPrice(total)}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.placeOrderButton,
            { backgroundColor: colors.primary, opacity: isSubmitting ? 0.7 : 1 },
          ]}
          onPress={handlePlaceOrder}
          activeOpacity={0.8}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.placeOrderButtonText}>{t('marketplace.placeOrder')}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: moderateVerticalScale(12),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    padding: scale(4),
  },
  headerTitle: {
    flex: 1,
    fontSize: scale(20),
    fontFamily: FontFamily.monasans.bold,
    textAlign: 'center',
  },
  headerSpacer: {
    width: scale(32),
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: moderateVerticalScale(16),
  },
  section: {
    borderRadius: scale(12),
    padding: scale(16),
    marginBottom: moderateVerticalScale(16),
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
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
  productRow: {
    flexDirection: 'row',
    marginBottom: scale(12),
  },
  productImage: {
    width: scale(80),
    height: scale(80),
    borderRadius: scale(8),
  },
  productInfo: {
    flex: 1,
    marginLeft: scale(12),
    justifyContent: 'center',
  },
  productName: {
    fontSize: scale(14),
    fontFamily: FontFamily.monasans.semiBold,
    marginBottom: scale(4),
  },
  productPrice: {
    fontSize: scale(15),
    fontFamily: FontFamily.monasans.bold,
    marginBottom: scale(2),
  },
  quantityText: {
    fontSize: scale(12),
    fontFamily: FontFamily.monasans.regular,
  },
  divider: {
    height: 1,
    marginVertical: scale(12),
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(8),
  },
  summaryLabel: {
    fontSize: scale(14),
    fontFamily: FontFamily.monasans.regular,
  },
  summaryValue: {
    fontSize: scale(14),
    fontFamily: FontFamily.monasans.semiBold,
  },
  totalLabel: {
    fontSize: scale(16),
    fontFamily: FontFamily.monasans.bold,
  },
  totalValue: {
    fontSize: scale(18),
    fontFamily: FontFamily.monasans.bold,
  },
  input: {
    borderRadius: scale(8),
    borderWidth: 1,
    padding: scale(12),
    fontSize: scale(14),
    fontFamily: FontFamily.monasans.regular,
    minHeight: scale(80),
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: scale(12),
    borderRadius: scale(8),
    borderWidth: 2,
    marginBottom: scale(8),
  },
  paymentIcon: {
    fontSize: scale(24),
    marginRight: scale(12),
  },
  paymentName: {
    flex: 1,
    fontSize: scale(14),
    fontFamily: FontFamily.monasans.medium,
  },
  installmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: scale(12),
    paddingTop: scale(12),
    borderTopWidth: 1,
  },
  installmentLabel: {
    fontSize: scale(14),
    fontFamily: FontFamily.monasans.medium,
  },
  bottomBar: {
    paddingTop: moderateVerticalScale(12),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateVerticalScale(12),
  },
  bottomTotalLabel: {
    fontSize: scale(14),
    fontFamily: FontFamily.monasans.regular,
  },
  bottomTotalValue: {
    fontSize: scale(20),
    fontFamily: FontFamily.monasans.bold,
  },
  placeOrderButton: {
    paddingVertical: moderateVerticalScale(14),
    borderRadius: scale(12),
    alignItems: 'center',
  },
  placeOrderButtonText: {
    fontSize: scale(16),
    fontFamily: FontFamily.monasans.bold,
    color: '#FFFFFF',
  },
});

export default CheckoutScreen;
