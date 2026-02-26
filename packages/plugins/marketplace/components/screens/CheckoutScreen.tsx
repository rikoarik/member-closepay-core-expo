/**
 * CheckoutScreen Component
 * Handles checkout: single product (Buy Now) or cart (selected items)
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Switch,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackActions } from '@react-navigation/native';
import { Wallet3, TickCircle, Truck, TicketDiscount, Card, ArrowDown2, ArrowUp2 } from 'iconsax-react-nativejs';
import { scale, moderateVerticalScale, getHorizontalPadding, FontFamily, ScreenHeader, BottomSheet } from '@core/config';
import { PaymentMethodSheet } from '../checkout/PaymentMethodSheet';
import { InstallmentConfigSheet } from '../checkout/InstallmentConfigSheet';
import { useTheme } from '@core/theme';
import { useTranslation } from '@core/i18n';
import { useBalance } from '@core/config/plugins/contracts';
import { paymentService } from '@plugins/payment';
import { useMarketplaceCart } from '../../hooks/useMarketplaceCart';
import { useMarketplaceOrders } from '../../context/MarketplaceOrderContext';
import { useAddressBook } from '../../hooks/useAddressBook';
import { AddressSection } from '../checkout/AddressSection';
import type { Product } from '../shared/ProductCard';
import type { MarketplaceOrder, MarketplaceOrderItem, MarketplacePaymentMethod } from '../../models/MarketplaceOrder';
import type { MarketplaceInstallment } from '../../models/MarketplaceInstallment';
import type { InstallmentSelection } from '../../models/MarketplaceInstallment';

type CheckoutRouteParams = {
  Checkout: {
    product?: Product;
    quantity?: number;
    fromCart?: boolean;
    selectedAddressId?: string;
  };
};

type CheckoutPaymentOptionId = MarketplacePaymentMethod | 'installment';

const formatPrice = (price: number): string => {
  return `Rp ${price.toLocaleString('id-ID')}`;
};

const SHIPPING_OPTIONS = [
  { id: 'jne-reg', name: 'JNE Reguler', fee: 12000, eta: '2-3 hari' },
  { id: 'jne-exp', name: 'JNE Express', fee: 20000, eta: '1-2 hari' },
  { id: 'jt', name: 'J&T Regular', fee: 15000, eta: '2-3 hari' },
  { id: 'sicepat', name: 'SiCepat', fee: 18000, eta: '1-2 hari' },
];
const INSURANCE_FEE = 5000;

export const CheckoutScreen: React.FC = () => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { balance } = useBalance();
  const paymentMethods = useMemo(
    () => [
      {
        id: 'balance' as const satisfies CheckoutPaymentOptionId,
        paymentMethod: 'balance' as const,
        useInstallment: false,
        name: t('marketplace.paymentBalance'),
        description: t('marketplace.paymentBalanceDesc') || 'Bayar instan dari saldo akun',
        Icon: Wallet3,
      },
      {
        id: 'co_link' as const satisfies CheckoutPaymentOptionId,
        paymentMethod: 'co_link' as const,
        useInstallment: false,
        name: t('marketplace.paymentCoLink'),
        description: t('marketplace.paymentCoLinkDesc') || 'Lanjut bayar lewat checkout link',
        Icon: Card,
      },
      {
        id: 'installment' as const satisfies CheckoutPaymentOptionId,
        paymentMethod: 'co_link' as const,
        useInstallment: true,
        name: t('marketplace.bayarCicilan'),
        description: t('marketplace.paymentInstallmentDesc') || 'Atur DP & jumlah cicilan, bayar via checkout link',
        Icon: Card,
      },
    ],
    [t]
  );
  const navigation = useNavigation();
  const route = useRoute<RouteProp<CheckoutRouteParams, 'Checkout'>>();
  const insets = useSafeAreaInsets();
  const horizontalPadding = getHorizontalPadding();
  const { cartItems, removeSelected } = useMarketplaceCart();
  const { addOrder } = useMarketplaceOrders();
  const { defaultAddress, getById } = useAddressBook();

  const params = route.params || {};
  const { product, quantity = 1, fromCart, selectedAddressId } = params as CheckoutRouteParams['Checkout'];
  const selectedAddress = useMemo(
    () => (selectedAddressId ? getById(selectedAddressId) : defaultAddress),
    [selectedAddressId, defaultAddress, getById]
  );

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

  const [selectedShippingId, setSelectedShippingId] = useState<string>(SHIPPING_OPTIONS[0].id);
  const [shippingSheetVisible, setShippingSheetVisible] = useState(false);
  const [paymentSheetVisible, setPaymentSheetVisible] = useState(false);
  const [shippingInsurance, setShippingInsurance] = useState(false);
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherDiscount, setVoucherDiscount] = useState(0);
  const [voucherApplied, setVoucherApplied] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<MarketplacePaymentMethod>('balance');
  const [useInstallment, setUseInstallment] = useState(false);
  const [installmentSelection, setInstallmentSelection] = useState<InstallmentSelection | null>(null);
  const [showInstallmentSheet, setShowInstallmentSheet] = useState(false);
  const [showFooterBreakdown, setShowFooterBreakdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const shippingFee = useMemo(
    () => SHIPPING_OPTIONS.find((o) => o.id === selectedShippingId)?.fee ?? SHIPPING_OPTIONS[0].fee,
    [selectedShippingId]
  );
  const insuranceFee = shippingInsurance ? INSURANCE_FEE : 0;
  const amountBeforeInstallment = subtotal + shippingFee - voucherDiscount + insuranceFee;
  const total = useInstallment && installmentSelection ? installmentSelection.totalPayment : amountBeforeInstallment;
  const availableBalance = balance?.balance ?? 0;
  const effectivePaymentMethod: MarketplacePaymentMethod = useInstallment ? 'co_link' : selectedPayment;
  const isBalanceMethod = effectivePaymentMethod === 'balance';
  const hasEnoughBalanceForOrder = availableBalance >= total;
  const canPlaceOrder =
    (!useInstallment || !!installmentSelection) &&
    (!isBalanceMethod || useInstallment || hasEnoughBalanceForOrder);
  const selectedPaymentOptionId: CheckoutPaymentOptionId = useInstallment ? 'installment' : selectedPayment;
  const selectedPaymentOption =
    paymentMethods.find((m) => m.id === selectedPaymentOptionId) ?? paymentMethods[0];
  const SelectedPaymentIcon = selectedPaymentOption.Icon;
  const balanceInfoText = `${t('marketplace.availableBalance') || 'Saldo tersedia'}: ${formatPrice(availableBalance)}`;
  const selectedPaymentDescription =
    selectedPaymentOption.id === 'balance'
      ? `${selectedPaymentOption.description} · ${balanceInfoText}`
      : selectedPaymentOption.description;

  const orderItemsByStore = useMemo(() => {
    const map = new Map<string, MarketplaceOrderItem[]>();
    for (const item of orderItems) {
      const store = item.product.storeName || t('marketplace.storeName');
      if (!map.has(store)) map.set(store, []);
      map.get(store)!.push(item);
    }
    return Array.from(map.entries());
  }, [orderItems, t]);

  const hasItems = orderItems.length > 0;
  const addressDisplayText = selectedAddress
    ? [selectedAddress.recipientName, selectedAddress.fullAddress, selectedAddress.district, selectedAddress.city].filter(Boolean).join(', ')
    : '';

  useEffect(() => {
    if (useInstallment && selectedPayment !== 'co_link') {
      setSelectedPayment('co_link');
    }
  }, [useInstallment, selectedPayment]);

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleAddressPress = useCallback(() => {
    (navigation as any).navigate('AddressList', { forCheckout: true });
  }, [navigation]);

  const handleApplyVoucher = useCallback(() => {
    const code = voucherCode.trim().toUpperCase();
    if (!code) return;
    if (code === 'DISKON10' || code === 'PROMO10') {
      const discount = Math.min(10000, Math.floor(subtotal * 0.1));
      setVoucherDiscount(discount);
      setVoucherApplied(true);
    } else {
      setVoucherDiscount(0);
      setVoucherApplied(false);
      Alert.alert(t('common.error') || 'Error', 'Kode voucher tidak valid atau sudah kadaluarsa.');
    }
  }, [voucherCode, subtotal, t]);

  const handleRemoveVoucher = useCallback(() => {
    setVoucherCode('');
    setVoucherDiscount(0);
    setVoucherApplied(false);
  }, []);

  const buildInstallmentSchedule = useCallback(
    (orderId: string, sel: InstallmentSelection): MarketplaceInstallment[] => {
      const schedule: MarketplaceInstallment[] = [];
      const start = new Date();
      for (let i = 0; i < sel.installmentCount; i++) {
        const due = new Date(start);
        due.setMonth(due.getMonth() + i + 1);
        const isLast = i === sel.installmentCount - 1;
        const amount = isLast
          ? sel.totalPayment - sel.downPayment - sel.monthlyAmount * (sel.installmentCount - 1)
          : sel.monthlyAmount;
        schedule.push({
          id: `${orderId}-inst-${i + 1}`,
          orderId,
          amount: Math.round(amount),
          dueDate: due.toISOString(),
          status: 'unpaid',
          sequenceNumber: i + 1,
        });
      }
      return schedule;
    },
    []
  );

  const handlePlaceOrder = useCallback(async () => {
    if (!hasItems) {
      Alert.alert(t('common.error'), t('marketplace.selectItemToCheckout'));
      return;
    }
    if (!selectedAddress) {
      Alert.alert(t('common.error'), t('marketplace.enterAddress'));
      return;
    }
    if (useInstallment && !installmentSelection) {
      Alert.alert(t('common.error'), t('marketplace.aturCicilanDulu'));
      return;
    }
    if (effectivePaymentMethod === 'balance' && availableBalance < total) {
      Alert.alert(t('common.error'), t('marketplace.insufficientBalance'));
      return;
    }

    setIsSubmitting(true);
    const orderId = `MP-${Date.now()}`;
    const orderNumber = `INV/MP/${new Date().toISOString().slice(0, 10).replace(/-/g, '')}/${String(Date.now()).slice(-6)}`;

    try {
      if (effectivePaymentMethod === 'balance') {
        await paymentService.payWithBalance(total, orderId, {
          storeName: t('marketplace.storeName'),
          itemCount: orderItems.length,
        });
      }
      const checkoutLink =
        effectivePaymentMethod === 'co_link'
          ? useInstallment
            ? `https://mock-payment.example.com/dp?tx=${encodeURIComponent(orderId)}`
            : `https://mock-payment.example.com/checkout?tx=${encodeURIComponent(orderId)}`
          : undefined;

      const withInstallment = useInstallment && !!installmentSelection;
      const installments: MarketplaceInstallment[] | undefined = withInstallment
        ? buildInstallmentSchedule(orderId, installmentSelection!)
        : undefined;

      const initialStatus =
        effectivePaymentMethod === 'balance' ? 'dipesan' : 'belum_dibayar';
      const order: MarketplaceOrder = {
        id: orderId,
        orderNumber,
        items: orderItems,
        subtotal,
        shippingFee,
        total,
        address: addressDisplayText,
        shippingAddressId: selectedAddress.id,
        shippingAddress: selectedAddress,
        paymentMethod: effectivePaymentMethod,
        status: initialStatus,
        createdAt: new Date().toISOString(),
        allowInstallment: withInstallment,
        installments,
        ...(checkoutLink && { checkoutLink }),
        ...(withInstallment && installmentSelection && { installmentSelection }),
        ...(voucherApplied && voucherDiscount > 0 && { voucherCode: voucherCode.trim(), voucherDiscount }),
        ...(shippingInsurance && { shippingInsuranceFee: INSURANCE_FEE }),
      };

      await addOrder(order);
      if (isCartMode) removeSelected();

      navigation.dispatch(
        StackActions.replace('MarketplaceOrderDetail', { orderId: order.id })
      );
    } catch (err) {
      const msg =
        err instanceof Error && err.message.toLowerCase().includes('insufficient')
          ? t('marketplace.insufficientBalance')
          : t('marketplace.orderFailed');
      Alert.alert(t('common.error'), msg);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    hasItems,
    selectedAddress,
    addressDisplayText,
    orderItems,
    subtotal,
    shippingFee,
    voucherDiscount,
    voucherApplied,
    voucherCode,
    shippingInsurance,
    total,
    availableBalance,
    effectivePaymentMethod,
    useInstallment,
    installmentSelection,
    buildInstallmentSchedule,
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
          {t('marketplace.productNotFound')}
        </Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 20 }}>
          <Text style={{ color: colors.primary }}>{t('common.back')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title={t('marketplace.checkout')}
        onBackPress={handleBack}
        style={{ paddingTop: insets.top + moderateVerticalScale(8), backgroundColor: colors.surface }}
        paddingHorizontal={horizontalPadding}
      />

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

          {orderItemsByStore.map(([storeName, items]) => (
            <View key={storeName} style={styles.storeGroup}>
              <Text style={[styles.storeGroupTitle, { color: colors.primary }]}>{storeName}</Text>
              {items.map((item, index) => (
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
            </View>
          ))}

        </View>

        {/* Shipping Address — pilih dari daftar alamat */}
        <AddressSection selectedAddress={selectedAddress ?? null} onPress={handleAddressPress} />

        {/* Shipping Options — tap buka bottom sheet */}
        <TouchableOpacity
          style={[styles.section, styles.shippingSummaryRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => setShippingSheetVisible(true)}
          activeOpacity={0.8}
        >
          <View style={styles.shippingSummaryLeft}>
            <View style={styles.sectionHeader}>
              <Truck size={scale(20)} color={colors.primary} variant="Bold" />
              <Text style={[styles.sectionTitle, { color: colors.text, marginLeft: scale(8) }]}>
                {t('marketplace.shippingOptions')}
              </Text>
            </View>
            <View style={styles.shippingSummaryContent}>
              <Text style={[styles.shippingSummaryName, { color: colors.text }]}>
                {SHIPPING_OPTIONS.find((o) => o.id === selectedShippingId)?.name ?? SHIPPING_OPTIONS[0].name}
              </Text>
              <Text style={[styles.shippingSummaryMeta, { color: colors.textSecondary }]}>
                {SHIPPING_OPTIONS.find((o) => o.id === selectedShippingId)?.eta ?? SHIPPING_OPTIONS[0].eta}
                {shippingInsurance ? ` · +${formatPrice(INSURANCE_FEE)} asuransi` : ''}
              </Text>
              <Text style={[styles.shippingSummaryFee, { color: colors.primary }]}>
                {formatPrice(shippingFee + (shippingInsurance ? INSURANCE_FEE : 0))}
              </Text>
            </View>
          </View>
          <View style={{ marginLeft: scale(8) }}>
            <TickCircle size={scale(20)} color={colors.primary} variant="Bold" />
          </View>
        </TouchableOpacity>

        {/* Bottom Sheet: Pilih Pengiriman + Asuransi */}
        <BottomSheet
          visible={shippingSheetVisible}
          onClose={() => setShippingSheetVisible(false)}
          snapPoints={[100]}
          initialSnapPoint={0}
        >
          <View style={[styles.sheetContent, { paddingHorizontal: horizontalPadding }]}>
            <Text style={[styles.sheetTitle, { color: colors.text }]}>
              {t('marketplace.shippingOptions')}
            </Text>
            {SHIPPING_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.id}
                style={[
                  styles.sheetOption,
                  {
                    borderColor: selectedShippingId === opt.id ? colors.primary : colors.border,
                    backgroundColor: selectedShippingId === opt.id ? colors.primaryLight : colors.background,
                  },
                ]}
                onPress={() => {
                  setSelectedShippingId(opt.id);
                  setShippingSheetVisible(false);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.sheetOptionLeft}>
                  <Text
                    style={[
                      styles.sheetOptionName,
                      { color: selectedShippingId === opt.id ? colors.primary : colors.text },
                    ]}
                  >
                    {opt.name}
                  </Text>
                  <Text style={[styles.sheetOptionEta, { color: colors.textSecondary }]}>{opt.eta}</Text>
                </View>
                <Text style={[styles.sheetOptionFee, { color: colors.primary }]}>{formatPrice(opt.fee)}</Text>
                {selectedShippingId === opt.id && (
                  <TickCircle size={scale(20)} color={colors.primary} variant="Bold" />
                )}
              </TouchableOpacity>
            ))}
            <View style={[styles.sheetInsuranceRow, { borderTopColor: colors.border }]}>
              <Text style={[styles.sheetInsuranceLabel, { color: colors.text }]}>
                {t('marketplace.shippingInsurance')}
              </Text>
              <Switch
                value={shippingInsurance}
                onValueChange={setShippingInsurance}
                trackColor={{ false: colors.border, true: colors.primaryLight }}
                thumbColor={shippingInsurance ? colors.primary : colors.textSecondary}
              />
            </View>
            {shippingInsurance && (
              <Text style={[styles.insuranceHint, { color: colors.textSecondary }]}>
                +{formatPrice(INSURANCE_FEE)} — proteksi kerusakan/hilang
              </Text>
            )}
            <TouchableOpacity
              style={[styles.sheetCancelButton, { backgroundColor: colors.background, borderColor: colors.border }]}
              onPress={() => setShippingSheetVisible(false)}
            >
              <Text style={[styles.sheetCancelText, { color: colors.text }]}>{t('common.close') || 'Tutup'}</Text>
            </TouchableOpacity>
          </View>
        </BottomSheet>

        {/* Voucher */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <TicketDiscount size={scale(20)} color={colors.primary} variant="Bold" />
            <Text style={[styles.sectionTitle, { color: colors.text, marginLeft: scale(8) }]}>
              {t('marketplace.voucherCode')}
            </Text>
          </View>
          <View style={styles.voucherRow}>
            <TextInput
              style={[
                styles.voucherInput,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              placeholder={t('marketplace.voucherCode')}
              placeholderTextColor={colors.textSecondary}
              value={voucherCode}
              onChangeText={(text) => {
                setVoucherCode(text);
                if (voucherApplied) {
                  setVoucherApplied(false);
                  setVoucherDiscount(0);
                }
              }}
              editable={!voucherApplied}
            />
            <TouchableOpacity
              style={[
                styles.voucherButton,
                {
                  backgroundColor: voucherApplied ? colors.border : colors.primary,
                  opacity: voucherCode.trim() ? 1 : 0.6,
                },
              ]}
              onPress={voucherApplied ? handleRemoveVoucher : handleApplyVoucher}
              disabled={!voucherApplied && !voucherCode.trim()}
            >
              <Text
                style={[
                  styles.voucherButtonText,
                  { color: voucherApplied ? colors.textSecondary : '#FFF' },
                ]}
              >
                {voucherApplied ? t('marketplace.removeVoucher') : t('marketplace.applyVoucher')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Payment Method — tap buka bottom sheet (Saldo / Checkout Link / Cicilan) */}
        <TouchableOpacity
          style={[styles.section, styles.shippingSummaryRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => setPaymentSheetVisible(true)}
          activeOpacity={0.8}
        >
          <View style={styles.shippingSummaryLeft}>
            <View style={styles.sectionHeader}>
              <SelectedPaymentIcon size={scale(20)} color={colors.primary} variant="Bold" />
              <Text style={[styles.sectionTitle, { color: colors.text, marginLeft: scale(8) }]}>
                {t('marketplace.paymentMethod')}
              </Text>
            </View>
            <View style={styles.shippingSummaryContent}>
              <Text style={[styles.shippingSummaryName, { color: colors.text }]}>
                {selectedPaymentOption.name}
                {useInstallment && installmentSelection
                  ? ` · DP ${formatPrice(installmentSelection.downPayment)} | ${installmentSelection.installmentCount}x @ ${formatPrice(installmentSelection.monthlyAmount)}`
                  : ''}
              </Text>
              <Text style={[styles.shippingSummaryMeta, { color: colors.textSecondary }]}>
                {selectedPaymentDescription}
              </Text>
              {useInstallment && installmentSelection && (
                <Text style={[styles.shippingSummaryFee, { color: colors.primary }]}>
                  {formatPrice(installmentSelection.totalPayment)}
                </Text>
              )}
            </View>
          </View>
          <View style={{ marginLeft: scale(8) }}>
            <TickCircle size={scale(20)} color={colors.primary} variant="Bold" />
          </View>
        </TouchableOpacity>

        {/* Modal: Metode Pembayaran (Saldo / Checkout Link / Cicilan) */}
        <PaymentMethodSheet
          visible={paymentSheetVisible}
          onClose={() => setPaymentSheetVisible(false)}
          expandForInstallment={false}
        >
          <View style={[styles.sheetContent, { paddingHorizontal: horizontalPadding }]}>
            <Text style={[styles.sheetTitle, { color: colors.text }]}>
              {t('marketplace.paymentMethod')}
            </Text>
            {paymentMethods.map((method) => {
              const selected = selectedPaymentOptionId === method.id;
              const MethodIcon = method.Icon;
              return (
                <TouchableOpacity
                  key={method.id}
                  style={[
                    styles.sheetOption,
                    {
                      borderColor: selected ? colors.primary : colors.border,
                      backgroundColor: selected ? colors.primaryLight : colors.background,
                    },
                  ]}
                  onPress={() => {
                    if (method.useInstallment) {
                      setSelectedPayment(method.paymentMethod);
                      setUseInstallment(true);
                      setPaymentSheetVisible(false);
                      setShowInstallmentSheet(true);
                      return;
                    }
                    setSelectedPayment(method.paymentMethod);
                    setUseInstallment(false);
                    setPaymentSheetVisible(false);
                  }}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.paymentIconBadge,
                      { backgroundColor: selected ? colors.primaryLight : colors.surface, borderColor: colors.border },
                    ]}
                  >
                    <MethodIcon
                      size={scale(18)}
                      color={selected ? colors.primary : colors.textSecondary}
                      variant={selected ? 'Bold' : 'Linear'}
                    />
                  </View>
                  <View style={styles.paymentLabelGroup}>
                    <Text
                      style={[
                        styles.sheetOptionName,
                        { color: selected ? colors.primary : colors.text },
                      ]}
                    >
                      {method.name}
                    </Text>
                    <Text style={[styles.paymentMethodDescription, { color: colors.textSecondary }]}>
                      {method.id === 'balance' ? `${method.description} · ${balanceInfoText}` : method.description}
                    </Text>
                  </View>
                  {selected && <TickCircle size={scale(20)} color={colors.primary} variant="Bold" />}
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              style={[styles.sheetCancelButton, { backgroundColor: colors.background, borderColor: colors.border }]}
              onPress={() => setPaymentSheetVisible(false)}
            >
              <Text style={[styles.sheetCancelText, { color: colors.text }]}>{t('common.close') || 'Tutup'}</Text>
            </TouchableOpacity>
          </View>
        </PaymentMethodSheet>

        {/* Bottom Sheet: Config Cicilan (DP, tenor/count, preview) */}
        <InstallmentConfigSheet
          visible={showInstallmentSheet}
          onClose={() => setShowInstallmentSheet(false)}
          totalAmount={amountBeforeInstallment}
          initialSelection={installmentSelection}
          onApply={setInstallmentSelection}
        />
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
        <TouchableOpacity
          style={[styles.footerDetailToggle, { borderBottomColor: colors.border }]}
          onPress={() => setShowFooterBreakdown((prev) => !prev)}
          activeOpacity={0.8}
        >
          <Text style={[styles.footerDetailToggleText, { color: colors.text }]}>
            {t('marketplace.rincian') || 'Rincian'}
          </Text>
          {showFooterBreakdown ? (
            <ArrowUp2 size={scale(18)} color={colors.textSecondary} variant="Linear" />
          ) : (
            <ArrowDown2 size={scale(18)} color={colors.textSecondary} variant="Linear" />
          )}
        </TouchableOpacity>

        {showFooterBreakdown && (
          <View style={styles.footerBreakdown}>
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
                {formatPrice(shippingFee)}
              </Text>
            </View>
            {voucherApplied && voucherDiscount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                  {t('marketplace.discount')}
                </Text>
                <Text style={[styles.summaryValue, { color: colors.primary }]}>
                  -{formatPrice(voucherDiscount)}
                </Text>
              </View>
            )}
            {shippingInsurance && (
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                  {t('marketplace.shippingInsurance')}
                </Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>
                  {formatPrice(INSURANCE_FEE)}
                </Text>
              </View>
            )}
          </View>
        )}

        {!showFooterBreakdown && voucherApplied && voucherDiscount > 0 && (
          <View style={styles.footerDiscountRow}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
              {t('marketplace.discount')}
            </Text>
            <Text style={[styles.summaryValue, { color: colors.primary }]}>
              -{formatPrice(voucherDiscount)}
            </Text>
          </View>
        )}

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
            {
              backgroundColor: colors.primary,
              opacity: isSubmitting ? 0.7 : canPlaceOrder ? 1 : 0.5,
            },
          ]}
          onPress={handlePlaceOrder}
          activeOpacity={0.8}
          disabled={isSubmitting || !canPlaceOrder}
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
  shippingSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  shippingSummaryLeft: { flex: 1 },
  shippingSummaryContent: { marginTop: scale(4) },
  shippingSummaryName: {
    fontSize: scale(14),
    fontFamily: FontFamily.monasans.semiBold,
  },
  shippingSummaryMeta: { fontSize: scale(12), fontFamily: FontFamily.monasans.regular, marginTop: scale(2) },
  shippingSummaryFee: { fontSize: scale(14), fontFamily: FontFamily.monasans.semiBold, marginTop: scale(2) },
  sheetContent: { paddingBottom: scale(24) },
  sheetTitle: {
    fontSize: scale(18),
    fontFamily: FontFamily.monasans.bold,
    marginTop: scale(16),
    marginBottom: scale(16),
  },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: scale(12),
    borderRadius: scale(8),
    borderWidth: 2,
    marginBottom: scale(8),
  },
  sheetOptionLeft: { flex: 1 },
  sheetOptionName: { fontSize: scale(14), fontFamily: FontFamily.monasans.semiBold },
  paymentIconBadge: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scale(10),
  },
  paymentLabelGroup: { flex: 1 },
  paymentMethodDescription: {
    fontSize: scale(12),
    fontFamily: FontFamily.monasans.regular,
    marginTop: scale(2),
  },
  sheetOptionEta: { fontSize: scale(12), fontFamily: FontFamily.monasans.regular, marginTop: scale(2) },
  sheetOptionFee: { fontSize: scale(14), fontFamily: FontFamily.monasans.semiBold, marginRight: scale(8) },
  sheetInsuranceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: scale(16),
    paddingTop: scale(16),
    borderTopWidth: 1,
  },
  sheetInsuranceLabel: { fontSize: scale(14), fontFamily: FontFamily.monasans.medium },
  sheetCancelButton: {
    marginTop: scale(16),
    paddingVertical: scale(12),
    borderRadius: scale(8),
    borderWidth: 1,
    alignItems: 'center',
  },
  sheetCancelText: { fontSize: scale(14), fontFamily: FontFamily.monasans.semiBold },
  storeGroup: { marginBottom: scale(16) },
  storeGroupTitle: {
    fontSize: scale(13),
    fontFamily: FontFamily.monasans.semiBold,
    marginBottom: scale(8),
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
  input: {
    borderRadius: scale(8),
    borderWidth: 1,
    padding: scale(12),
    fontSize: scale(14),
    fontFamily: FontFamily.monasans.regular,
    minHeight: scale(80),
  },
  shippingOptionContent: { flex: 1 },
  shippingEta: { fontSize: scale(12), fontFamily: FontFamily.monasans.regular, marginTop: scale(2) },
  shippingFee: { fontSize: scale(14), fontFamily: FontFamily.monasans.semiBold, marginRight: scale(8) },
  voucherRow: { flexDirection: 'row', gap: scale(8), alignItems: 'center' },
  voucherInput: {
    flex: 1,
    borderRadius: scale(8),
    borderWidth: 1,
    padding: scale(12),
    fontSize: scale(14),
    fontFamily: FontFamily.monasans.regular,
  },
  voucherButton: {
    paddingHorizontal: scale(16),
    paddingVertical: scale(12),
    borderRadius: scale(8),
  },
  voucherButtonText: { fontSize: scale(14), fontFamily: FontFamily.monasans.semiBold },
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
  installmentSimulation: {
    marginTop: scale(12),
    paddingTop: scale(12),
    borderTopWidth: 1,
  },
  installmentSimulationTitle: {
    fontSize: scale(14),
    fontFamily: FontFamily.monasans.bold,
    marginBottom: scale(8),
  },
  tenorRow: { flexDirection: 'row', gap: scale(8), flexWrap: 'wrap', marginBottom: scale(12) },
  tenorChip: {
    paddingHorizontal: scale(14),
    paddingVertical: scale(8),
    borderRadius: scale(20),
    borderWidth: 1,
  },
  tenorChipText: { fontSize: scale(13), fontFamily: FontFamily.monasans.semiBold },
  tenorSubtext: { fontSize: scale(11), fontFamily: FontFamily.monasans.medium, marginTop: scale(2) },
  simRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: scale(6),
    borderTopWidth: 1,
  },
  simLabel: { fontSize: scale(14), fontFamily: FontFamily.monasans.regular },
  simValue: { fontSize: scale(14), fontFamily: FontFamily.monasans.semiBold },
  scheduleTitle: {
    fontSize: scale(13),
    fontFamily: FontFamily.monasans.semiBold,
    marginTop: scale(12),
    marginBottom: scale(6),
  },
  scheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: scale(4),
  },
  scheduleDate: { fontSize: scale(13), fontFamily: FontFamily.monasans.regular },
  scheduleAmount: { fontSize: scale(13), fontFamily: FontFamily.monasans.semiBold },
  insuranceHint: { fontSize: scale(12), fontFamily: FontFamily.monasans.regular, marginTop: scale(4) },
  bottomBar: {
    paddingTop: moderateVerticalScale(12),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  footerDetailToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: scale(10),
    borderBottomWidth: 1,
    marginBottom: scale(10),
  },
  footerDetailToggleText: {
    fontSize: scale(13),
    fontFamily: FontFamily.monasans.semiBold,
  },
  footerBreakdown: {
    marginBottom: scale(8),
  },
  footerDiscountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(8),
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
