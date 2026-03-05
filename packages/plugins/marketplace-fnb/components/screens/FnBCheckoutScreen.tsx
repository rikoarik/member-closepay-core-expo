/**
 * FnBCheckoutScreen Component
 * Checkout screen with order type selection based on entry point
 */

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, StackActions } from '@react-navigation/native';
import { Shop, Truck, Box, Location as LocationIcon, Reserve, Edit2, ArrowRight2, ArrowLeft2 } from 'iconsax-react-nativejs';
import Toast from 'react-native-toast-message';
import { scale, moderateVerticalScale, getHorizontalPadding, FontFamily, ScreenHeader } from '@core/config';
import { useTheme } from '@core/theme';
import { useTranslation } from '@core/i18n';
import { useAuth } from '@core/auth';
import { useBalance } from '@plugins/balance';
import { paymentService } from '@plugins/payment';
import { useFnBData, useFnBCart } from '../../hooks';
import { getAvailableOrderTypes } from '../../models';
import type { OrderType, EntryPoint, FnBOrder, FnBOrderItem } from '../../models';
import { useFnBActiveOrder } from '../../context/FnBActiveOrderContext';
import { useFnBLocation } from '../../context/FnBLocationContext';
import { getLastDelivery, setLastDelivery } from '../../utils/deliveryStorage';
import { FnBLocationPickerModal } from '../shared/FnBLocationPickerModal';
import { FnBLocationPickerSheet } from '../shared/FnBLocationPickerSheet';

const formatPrice = (price: number): string => {
  return `Rp ${price.toLocaleString('id-ID')}`;
};

interface OrderTypeOption {
  id: OrderType;
  label: string;
  description: string;
  icon: React.ReactNode;
}

export const FnBCheckoutScreen: React.FC = () => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const horizontalPadding = getHorizontalPadding();

  // Get entry point and storeId from route params
  const params = route.params as { entryPoint?: EntryPoint; storeId?: string } | undefined;
  const entryPoint: EntryPoint = params?.entryPoint || 'browse';
  const storeId = params?.storeId;

  // Hooks
  const { user } = useAuth();
  const { store } = useFnBData(entryPoint, storeId);
  const { cartItems, subtotal, itemCount, clearCart, getTotal } = useFnBCart(entryPoint);
  const { setActiveOrder } = useFnBActiveOrder();
  const { deliveryAddress: contextAddress, setDeliveryAddress: setContextAddress } = useFnBLocation();
  const { balance } = useBalance();

  // Empty cart guard: show message and back button if user landed without items
  const isCartEmpty = cartItems.length === 0;
  const availableBalance = balance?.balance ?? 0;
  const hasInsufficientBalance = subtotal > availableBalance;

  // Get available order types based on entry point
  const availableOrderTypes = useMemo(() => getAvailableOrderTypes(entryPoint), [entryPoint]);

  // Local state (typed as full OrderType so all conditionals type-check; runtime value is always in availableOrderTypes)
  const [selectedOrderType, setSelectedOrderType] = useState<OrderType>(
    availableOrderTypes[0] as OrderType
  );
  const orderType = selectedOrderType as OrderType;
  const [customerName, setCustomerName] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locationPickerVisible, setLocationPickerVisible] = useState(false);
  const [locationSheetVisible, setLocationSheetVisible] = useState(false);
  const [kitchenNotes, setKitchenNotes] = useState('');

  // Pre-fill: only run once per "delivery" session so we don't overwrite user edits
  const lastDeliveryLoadedRef = useRef(false);
  const hasPrefilledNameRef = useRef(false);

  // Pre-fill customer name from auth when delivery is selected
  useEffect(() => {
    if (selectedOrderType !== 'delivery' || !user?.name || hasPrefilledNameRef.current) return;
    setCustomerName(user.name);
    hasPrefilledNameRef.current = true;
  }, [selectedOrderType, user?.name]);

  // Load last delivery (phone + address) from storage or context when user selects delivery
  useEffect(() => {
    if (selectedOrderType !== 'delivery' || lastDeliveryLoadedRef.current) return;
    let cancelled = false;
    getLastDelivery().then((info) => {
      if (cancelled) return;
      if (info) {
        setPhoneNumber((prev) => (prev.trim() ? prev : info.phoneNumber));
      }
      setDeliveryAddress((prev) =>
        prev.trim() ? prev : (info?.deliveryAddress || contextAddress || '')
      );
      lastDeliveryLoadedRef.current = true;
    });
    return () => {
      cancelled = true;
    };
  }, [selectedOrderType, contextAddress]);

  // Order type options
  const orderTypeOptions: OrderTypeOption[] = useMemo(() => {
    const allOptions: OrderTypeOption[] = [
      {
        id: 'dine-in',
        label: t('fnb.dineIn') || 'Dine In',
        description: t('fnb.dineInDesc') || 'Makan di tempat',
        icon: (
          <Shop
            size={scale(24)}
            color={orderType === 'dine-in' ? colors.surface : colors.primary}
            variant="Bold"
          />
        ),
      },
      {
        id: 'take-away',
        label: t('fnb.takeAway') || 'Take Away',
        description: t('fnb.takeAwayDesc') || 'Ambil sendiri',
        icon: (
          <Box
            size={scale(24)}
            color={orderType === 'take-away' ? colors.surface : colors.primary}
            variant="Bold"
          />
        ),
      },
      {
        id: 'delivery',
        label: t('fnb.delivery') || 'Delivery',
        description: t('fnb.deliveryDesc') || 'Antar ke alamat',
        icon: (
          <Truck
            size={scale(24)}
            color={orderType === 'delivery' ? colors.surface : colors.primary}
            variant="Bold"
          />
        ),
      },
    ];

    return allOptions.filter((opt) => availableOrderTypes.includes(opt.id));
  }, [availableOrderTypes, selectedOrderType, colors, t]);

  // Calculate fees
  const serviceFeeRate = 0.1;
  const taxRate = 0.05;
  const serviceFee = orderType === 'dine-in' ? Math.round(subtotal * serviceFeeRate) : 2000;
  const taxAmount = orderType === 'dine-in' ? Math.round(subtotal * taxRate) : 0;
  const deliveryFee = orderType === 'delivery' && store?.delivery ? store.delivery.fee : 0;
  const total = orderType === 'dine-in'
    ? subtotal + serviceFee + taxAmount
    : getTotal(deliveryFee, serviceFee);

  // Validate form
  const isFormValid = useMemo(() => {
    // Check if store is open
    if (!store?.isOpen) return false;

    if (!customerName.trim()) return false;

    if (orderType === 'dine-in' && !tableNumber.trim()) return false;
    if (orderType === 'delivery' && (!phoneNumber.trim() || !deliveryAddress.trim()))
      return false;

    return true;
  }, [customerName, tableNumber, phoneNumber, deliveryAddress, selectedOrderType, store?.isOpen]);

  // Handle order with balance payment
  const handleOrder = useCallback(async () => {
    if (!store?.isOpen) {
      Alert.alert(
        t('fnb.storeClosed') || 'Toko Tutup',
        t('fnb.cannotOrderClosedStore') || 'Tidak dapat memesan dari toko yang sedang tutup.'
      );
      return;
    }

    if (!isFormValid) {
      Alert.alert(
        t('common.error') || 'Error',
        t('fnb.validationRequired') || 'Mohon lengkapi semua data yang diperlukan'
      );
      return;
    }

    if (hasInsufficientBalance) {
      Alert.alert(
        t('fnb.insufficientBalanceTitle') || 'Saldo tidak cukup',
        t('fnb.insufficientBalance') || 'Saldo Anda tidak mencukupi. Silakan top up atau kurangi item pesanan.'
      );
      return;
    }

    setIsSubmitting(true);

    const orderId = `ORD-FNB-${Date.now()}`;
    try {
      const result = await paymentService.payWithBalance(total, orderId, {
        storeId: storeId ?? store?.id,
        storeName: store?.name,
        entryPoint,
        itemCount,
      });

      if (result.status === 'success') {
        if (orderType === 'delivery' && phoneNumber.trim() && deliveryAddress.trim()) {
          setLastDelivery({ phoneNumber: phoneNumber.trim(), deliveryAddress: deliveryAddress.trim() }).catch(() => {});
        }
        const orderItems: FnBOrderItem[] = cartItems.map(({ item, quantity, variant, addons, notes, subtotal: itemSubtotal }) => ({
          item,
          quantity,
          variant,
          addons,
          notes,
          subtotal: itemSubtotal,
        }));
        const order: FnBOrder = {
          id: orderId,
          storeId: storeId ?? store?.id ?? '',
          storeName: store?.name,
          items: orderItems,
          orderType: selectedOrderType,
          entryPoint,
          customerName: customerName.trim(),
          tableNumber: orderType === 'dine-in' ? tableNumber.trim() || undefined : undefined,
          deliveryAddress: orderType === 'delivery' ? deliveryAddress.trim() || undefined : undefined,
          phoneNumber: orderType === 'delivery' ? phoneNumber.trim() || undefined : undefined,
          pickupTime: orderType === 'take-away' ? pickupTime.trim() || undefined : undefined,
          subtotal,
          deliveryFee: orderType === 'delivery' && store?.delivery ? store.delivery.fee : undefined,
          serviceFee,
          total,
          status: 'pending',
          createdAt: new Date().toISOString(),
        };
        await setActiveOrder(order);
        clearCart();
        Toast.show({
          type: 'success',
          text1: t('fnb.orderSuccess') || 'Pesanan Berhasil',
          text2: t('fnb.orderSuccessMessage') || 'Pesanan Anda sedang diproses.',
        });
        navigation.dispatch(
          StackActions.replace('FnBPaymentSuccess', {
            orderId: order.id,
            storeId: order.storeId,
            storeName: order.storeName,
            total: order.total,
            tableNumber: order.tableNumber,
            orderType: order.orderType,
            pickupTime: order.pickupTime,
            deliveryAddress: order.deliveryAddress,
          })
        );
      }
    } catch (error) {
      const message =
        error instanceof Error && error.message.toLowerCase().includes('insufficient')
          ? t('fnb.insufficientBalance') || 'Saldo tidak mencukupi. Silakan top up atau kurangi item.'
          : t('fnb.orderFailed') || 'Gagal memproses pesanan. Silakan coba lagi.';
      Alert.alert(t('common.error') || 'Error', message);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    isFormValid,
    total,
    clearCart,
    setActiveOrder,
    navigation,
    store?.isOpen,
    store?.id,
    store?.name,
    storeId,
    entryPoint,
    itemCount,
    hasInsufficientBalance,
    t,
    selectedOrderType,
    phoneNumber,
    deliveryAddress,
    customerName,
    tableNumber,
    pickupTime,
    subtotal,
    serviceFee,
    cartItems,
    deliveryAddress,
    store?.delivery,
  ]);

  // Empty cart: show message and back button only
  if (isCartEmpty) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScreenHeader
          title={t('fnb.checkout') || 'Checkout'}
          onBackPress={() => navigation.goBack()}
          showBorder
          style={{ paddingTop: insets.top, backgroundColor: colors.surface }}
          paddingHorizontal={horizontalPadding}
        />
        <View style={[styles.emptyCartContainer, { paddingHorizontal: horizontalPadding }]}>
          <Text style={[styles.emptyCartText, { color: colors.textSecondary }]}>
            {t('fnb.emptyCart') || 'Keranjang kosong'}
          </Text>
          <Text style={[styles.emptyCartHint, { color: colors.textSecondary }]}>
            {t('fnb.emptyCartCheckoutHint') || 'Tambahkan menu terlebih dahulu untuk checkout.'}
          </Text>
          <TouchableOpacity
            style={[styles.emptyCartButton, { backgroundColor: colors.primary }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={[styles.emptyCartButtonText, { color: colors.surface }]}>
              {t('common.back') || 'Kembali'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ---------- Dine-in layout (reference: Dine-in Checkout HTML) ----------
  if (orderType === 'dine-in') {
    const storeImageUrl = store?.imageUrl || 'https://lh3.googleusercontent.com/aida-public/AB6AXuB9-tChAXE6IXgKdAAgTPDdMFluVaahvUF-utstyU9cum83_wTzKL3rWzsUa7kFK0EN2Th2Xs_M0QB_bqCAuuoawfw1gc5J-GcovK6VPNWQv_KhkVwIydrltJ9JheRoQj-fCtDIIMM5ZmwMwm-QhwQCqAffkL9d_cTn-0FGgvUjFyafQEEFpSF03eSEKvi-W0jQtM_n7yn1elHNo2IcfZanYaCAMECHor1u4I99ZN_GOTQvXvOHS48GhrEBuYTxXgoAEONqmiKX7xDf';
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.dineInHeader, { paddingTop: insets.top + scale(12), paddingHorizontal: horizontalPadding, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.dineInHeaderBtn}>
            <ArrowLeft2 size={scale(24)} color={colors.text} variant="Linear" />
          </TouchableOpacity>
          <View style={styles.dineInHeaderCenter}>
            <Text style={[styles.dineInHeaderTitle, { color: colors.text }]}>{t('fnb.checkout') || 'Checkout'}</Text>
            <Text style={[styles.dineInHeaderSubtitle, { color: colors.primary }]}>{t('fnb.dineInOrder') || 'Dine-in Order'}</Text>
          </View>
          <View style={styles.dineInHeaderBtn} />
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={{ paddingHorizontal: horizontalPadding, paddingBottom: moderateVerticalScale(120) }}
          showsVerticalScrollIndicator={false}
        >
          {/* Restaurant & Table */}
          <View style={styles.dineInRestaurantSection}>
            <View style={[styles.dineInRestaurantLogoWrap, { backgroundColor: colors.background }]}>
              <Image source={{ uri: storeImageUrl }} style={styles.dineInRestaurantLogo} resizeMode="cover" />
            </View>
            <Text style={[styles.dineInStoreName, { color: colors.text }]}>{store?.name || t('fnb.merchantName') || 'The Burger Joint'}</Text>
            <Text style={[styles.dineInStoreBranch, { color: colors.textSecondary }]}>{t('fnb.downtownBranch') || 'Downtown Branch'}</Text>
            <View style={[styles.dineInTableCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.dineInTableRow}>
                <View style={[styles.dineInTableIconWrap, { backgroundColor: colors.primary + '20' }]}>
                  <Reserve size={scale(24)} color={colors.primary} variant="Bold" />
                </View>
                <View style={styles.dineInTableText}>
                  <Text style={[styles.dineInTableLabel, { color: colors.textSecondary }]}>{t('fnb.tableNumber') || 'Table Number'}</Text>
                  <Text style={[styles.dineInTableValue, { color: colors.text }]}>{tableNumber.trim() || '—'}</Text>
                </View>
                <TouchableOpacity onPress={() => {}}>
                  <Text style={[styles.dineInTableChange, { color: colors.primary }]}>{t('common.edit') || 'Change'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Your Order */}
          <View style={styles.dineInSection}>
            <Text style={[styles.dineInSectionTitle, { color: colors.text }]}>{t('fnb.yourOrder') || 'Your Order'}</Text>
            {cartItems.map((cartItem) => (
              <View key={cartItem.cartId} style={[styles.dineInOrderItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={[styles.dineInOrderItemThumb, { backgroundColor: colors.background }]}>
                  {cartItem.item.imageUrl ? (
                    <Image source={{ uri: cartItem.item.imageUrl }} style={styles.dineInOrderItemThumbImg} resizeMode="cover" />
                  ) : null}
                </View>
                <View style={styles.dineInOrderItemBody}>
                  <View style={styles.dineInOrderItemRow}>
                    <View style={styles.dineInOrderItemNames}>
                      <Text style={[styles.dineInOrderItemName, { color: colors.text }]}>{cartItem.item.name}</Text>
                      {cartItem.notes ? (
                        <Text style={[styles.dineInOrderItemNote, { color: colors.textSecondary }]} numberOfLines={1}>{cartItem.notes}</Text>
                      ) : null}
                    </View>
                    <Text style={[styles.dineInOrderItemPrice, { color: colors.text }]}>{formatPrice(cartItem.subtotal)}</Text>
                  </View>
                  <View style={[styles.dineInOrderQtyBadge, { backgroundColor: colors.background }]}>
                    <Text style={[styles.dineInOrderQtyText, { color: colors.text }]}>x{cartItem.quantity}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>

          {/* Kitchen Notes */}
          <View style={styles.dineInSection}>
            <Text style={[styles.dineInSectionTitle, { color: colors.text }]}>{t('fnb.kitchenNotes') || 'Kitchen Notes'}</Text>
            <View style={[styles.dineInKitchenNotes, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Edit2 size={scale(20)} color={colors.textSecondary} variant="Linear" style={styles.dineInKitchenNotesIcon} />
              <TextInput
                style={[styles.dineInKitchenNotesInput, { color: colors.text }]}
                placeholder={t('fnb.kitchenNotesPlaceholder') || 'Any allergies or special requests? e.g. Extra spicy, sauce on side...'}
                placeholderTextColor={colors.textSecondary}
                value={kitchenNotes}
                onChangeText={setKitchenNotes}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          {/* Payment Summary */}
          <View style={[styles.dineInSummaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.dineInSummaryRow}>
              <Text style={[styles.dineInSummaryLabel, { color: colors.textSecondary }]}>{t('fnb.subtotal') || 'Subtotal'}</Text>
              <Text style={[styles.dineInSummaryValue, { color: colors.text }]}>{formatPrice(subtotal)}</Text>
            </View>
            <View style={styles.dineInSummaryRow}>
              <Text style={[styles.dineInSummaryLabel, { color: colors.textSecondary }]}>{t('fnb.serviceCharge10') || 'Service Charge (10%)'}</Text>
              <Text style={[styles.dineInSummaryValue, { color: colors.text }]}>{formatPrice(serviceFee)}</Text>
            </View>
            <View style={styles.dineInSummaryRow}>
              <Text style={[styles.dineInSummaryLabel, { color: colors.textSecondary }]}>{t('fnb.tax5') || 'Tax (5%)'}</Text>
              <Text style={[styles.dineInSummaryValue, { color: colors.text }]}>{formatPrice(taxAmount)}</Text>
            </View>
            <View style={[styles.dineInSummaryDivider, { borderColor: colors.border }]} />
            <View style={styles.dineInSummaryRow}>
              <Text style={[styles.dineInSummaryTotalLabel, { color: colors.text }]}>{t('fnb.total') || 'Total'}</Text>
              <Text style={[styles.dineInSummaryTotalValue, { color: colors.text }]}>{formatPrice(total)}</Text>
            </View>
          </View>
        </ScrollView>

        <View style={[styles.dineInBottomBar, { backgroundColor: colors.surface, borderTopColor: colors.border, paddingBottom: insets.bottom + scale(24), paddingHorizontal: horizontalPadding }]}>
          <TouchableOpacity
            style={[styles.dineInConfirmButton, { backgroundColor: colors.primary }]}
            onPress={handleOrder}
            disabled={!isFormValid || isSubmitting || hasInsufficientBalance}
          >
            <Text style={[styles.dineInConfirmButtonText, { color: '#102222' }]}>
              {isSubmitting ? (t('fnb.processing') || 'Processing...') : (t('fnb.confirmAndPay') || 'Confirm & Pay')}
            </Text>
            <ArrowRight2 size={scale(22)} color="#102222" variant="Bold" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title={t('fnb.checkout') || 'Checkout'}
        onBackPress={() => navigation.goBack()}
        showBorder
        style={{ paddingTop: insets.top, backgroundColor: colors.surface }}
        paddingHorizontal={horizontalPadding}
      />

      {/* Store Closed Banner */}
      {store && !store.isOpen && (
        <View
          style={[
            styles.closedBanner,
            { backgroundColor: colors.error + '15', borderColor: colors.error },
          ]}
        >
          <Text style={[styles.closedBannerText, { color: colors.error }]}>
            {t('fnb.storeClosedMessage') ||
              'Toko ini sedang tutup dan tidak dapat menerima pesanan saat ini.'}
          </Text>
        </View>
      )}

      <ScrollView
        style={styles.content}
        contentContainerStyle={{
          paddingHorizontal: horizontalPadding,
          paddingBottom: moderateVerticalScale(100),
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Order Type Selection */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('fnb.orderType') || 'Tipe Pesanan'}
          </Text>


          <View style={[styles.orderTypeTabContainer, { backgroundColor: colors.border + '40' }]}>
            {orderTypeOptions.map((option) => {
              const isSelected = orderType === option.id;
              return (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.orderTypeTab,
                    {
                      backgroundColor: isSelected ? colors.primary : 'transparent',
                    },
                  ]}
                  onPress={() => setSelectedOrderType(option.id)}
                >
                  <Text
                    style={[
                      styles.orderTypeTabLabel,
                      { color: isSelected ? colors.surface : colors.text },
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Customer Info */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('fnb.customerInfo') || 'Informasi Pemesan'}
          </Text>

          <Text style={[styles.inputLabel, { color: colors.text }]}>Nama Pemesan *</Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border },
            ]}
            placeholder={t('fnb.namePlaceholder') || 'Masukkan nama Anda'}
            placeholderTextColor={colors.textSecondary}
            value={customerName}
            onChangeText={setCustomerName}
          />

          {/* Conditional fields based on order type (orderType asserted as OrderType for conditionals when entryPoint limits options) */}
          {(orderType as OrderType) === 'dine-in' && (
            <>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                {t('fnb.tableNumber') || 'Nomor Meja'} *
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surface,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                placeholder={t('fnb.tableNumberPlaceholder') || 'Contoh: 12'}
                placeholderTextColor={colors.textSecondary}
                value={tableNumber}
                onChangeText={setTableNumber}
                keyboardType="number-pad"
              />
            </>
          )}

          {orderType === 'take-away' && (
            <>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                {t('fnb.pickupTime') || 'Waktu Pengambilan'}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surface,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                placeholder={t('fnb.pickupTimePlaceholder') || 'Contoh: 15 menit lagi'}
                placeholderTextColor={colors.textSecondary}
                value={pickupTime}
                onChangeText={setPickupTime}
              />
            </>
          )}

          {orderType === 'delivery' && (
            <>
              <Text style={[styles.inputLabel, { color: colors.text }]}>No. Telepon *</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surface,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                placeholder="08xxxxxxxxxx"
                placeholderTextColor={colors.textSecondary}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
              />

              <Text style={[styles.inputLabel, { color: colors.text }]}>
                {t('fnb.deliveryAddress') || 'Alamat Pengiriman'} *
              </Text>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  {
                    backgroundColor: colors.surface,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                placeholder={t('fnb.addressPlaceholder') || 'Masukkan alamat lengkap'}
                placeholderTextColor={colors.textSecondary}
                value={deliveryAddress}
                onChangeText={setDeliveryAddress}
                multiline
                numberOfLines={3}
              />
              <TouchableOpacity
                style={[
                  styles.pickLocationButton,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => {
                  if (Platform.OS === 'web') {
                    Toast.show({ type: 'info', text1: t('fnb.locationNotSupportedWeb') });
                    return;
                  }
                  setLocationSheetVisible(true);
                }}
              >
                <LocationIcon size={scale(20)} color={colors.primary} variant="Bold" />
                <Text style={[styles.pickLocationLabel, { color: colors.primary }]}>
                  {t('fnb.locationPickerTitle') || 'Pilih lokasi'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('fnb.orderSummary') || 'Ringkasan Pesanan'}
          </Text>

          <View style={[styles.summaryCard, { backgroundColor: colors.surface }]}>
            {cartItems.map((cartItem) => (
              <View key={cartItem.cartId} style={styles.summaryItem}>
                <Text style={[styles.summaryItemQty, { color: colors.textSecondary }]}>
                  {cartItem.quantity}x
                </Text>
                <Text style={[styles.summaryItemName, { color: colors.text }]} numberOfLines={1}>
                  {cartItem.item.name}
                  {cartItem.variant && ` (${cartItem.variant.name})`}
                </Text>
                <Text style={[styles.summaryItemPrice, { color: colors.text }]}>
                  {formatPrice(cartItem.subtotal)}
                </Text>
              </View>
            ))}

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                {t('fnb.subtotal') || 'Subtotal'}
              </Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>
                {formatPrice(subtotal)}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                {t('fnb.serviceFee') || 'Biaya Layanan'}
              </Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>
                {formatPrice(serviceFee)}
              </Text>
            </View>

            {orderType === 'delivery' && (
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                  {t('fnb.deliveryFee') || 'Ongkos Kirim'}
                </Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>
                  {formatPrice(deliveryFee)}
                </Text>
              </View>
            )}

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                {t('fnb.availableBalance') || 'Saldo tersedia'}
              </Text>
              <Text
                style={[
                  styles.summaryValue,
                  { color: hasInsufficientBalance ? colors.error : colors.text },
                ]}
              >
                {formatPrice(availableBalance)}
              </Text>
            </View>
            {hasInsufficientBalance && (
              <Text style={[styles.insufficientHint, { color: colors.error }]}>
                {t('fnb.insufficientBalance') || 'Saldo tidak mencukupi'}
              </Text>
            )}

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.summaryRow}>
              <Text style={[styles.totalLabel, { color: colors.text }]}>
                {t('fnb.total') || 'Total'}
              </Text>
              <Text style={[styles.totalValue, { color: colors.primary }]}>
                {formatPrice(total)}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Button */}
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
          style={[
            styles.orderButton,
            {
              backgroundColor:
                isFormValid && !isSubmitting && !hasInsufficientBalance
                  ? colors.primary
                  : colors.border,
            },
          ]}
          onPress={handleOrder}
          disabled={!isFormValid || isSubmitting || hasInsufficientBalance}
        >
          <Text
            style={[
              styles.orderButtonText,
              {
                color:
                  isFormValid && !isSubmitting && !hasInsufficientBalance
                    ? colors.surface
                    : colors.textSecondary,
              },
            ]}
          >
            {isSubmitting
              ? t('fnb.processing') || 'Memproses...'
              : `${t('fnb.payNow') || 'Bayar Sekarang'} - ${formatPrice(total)}`}
          </Text>
        </TouchableOpacity>
      </View>
      <FnBLocationPickerSheet
        visible={locationSheetVisible}
        onClose={() => setLocationSheetVisible(false)}
        onSelectAddress={(addr) => {
          setDeliveryAddress(addr);
          setContextAddress(addr);
          setLocationSheetVisible(false);
        }}
        onRequestMapPicker={() => {
          setLocationSheetVisible(false);
          setLocationPickerVisible(true);
        }}
      />
      <FnBLocationPickerModal
        visible={locationPickerVisible}
        onClose={() => setLocationPickerVisible(false)}
        onSelectAddress={(addr) => {
          setDeliveryAddress(addr);
          setContextAddress(addr);
          setLocationPickerVisible(false);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: moderateVerticalScale(20),
  },
  sectionTitle: {
    fontSize: scale(16),
    fontFamily: FontFamily.monasans.bold,
    marginBottom: scale(12),
  },
  entryPointHint: {
    fontSize: scale(12),
    fontFamily: FontFamily.monasans.regular,
    marginBottom: scale(12),
  },
  orderTypeTabContainer: {
    flexDirection: 'row',
    borderRadius: scale(12),
    padding: scale(4),
  },
  orderTypeTab: {
    flex: 1,
    paddingVertical: scale(12),
    paddingHorizontal: scale(8),
    borderRadius: scale(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderTypeTabLabel: {
    fontSize: scale(14),
    fontFamily: FontFamily.monasans.semiBold,
  },
  inputLabel: {
    fontSize: scale(13),
    fontFamily: FontFamily.monasans.medium,
    marginBottom: scale(6),
    marginTop: scale(12),
  },
  input: {
    borderWidth: 1,
    borderRadius: scale(10),
    paddingHorizontal: scale(14),
    paddingVertical: scale(12),
    fontSize: scale(14),
    fontFamily: FontFamily.monasans.regular,
  },
  textArea: {
    minHeight: scale(80),
    textAlignVertical: 'top',
  },
  pickLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(8),
    paddingVertical: scale(12),
    paddingHorizontal: scale(14),
    marginTop: scale(10),
    borderRadius: scale(10),
    borderWidth: 1,
  },
  pickLocationLabel: {
    fontSize: scale(14),
    fontFamily: FontFamily.monasans.medium,
  },
  summaryCard: {
    borderRadius: scale(12),
    padding: scale(16),
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scale(8),
  },
  summaryItemQty: {
    fontSize: scale(13),
    fontFamily: FontFamily.monasans.medium,
    width: scale(30),
  },
  summaryItemName: {
    flex: 1,
    fontSize: scale(13),
    fontFamily: FontFamily.monasans.medium,
    marginRight: scale(8),
  },
  summaryItemPrice: {
    fontSize: scale(13),
    fontFamily: FontFamily.monasans.semiBold,
  },
  divider: {
    height: 1,
    marginVertical: scale(12),
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: scale(6),
  },
  summaryLabel: {
    fontSize: scale(13),
    fontFamily: FontFamily.monasans.regular,
  },
  summaryValue: {
    fontSize: scale(13),
    fontFamily: FontFamily.monasans.medium,
  },
  insufficientHint: {
    fontSize: scale(12),
    fontFamily: FontFamily.monasans.regular,
    marginTop: scale(4),
  },
  totalLabel: {
    fontSize: scale(15),
    fontFamily: FontFamily.monasans.bold,
  },
  totalValue: {
    fontSize: scale(17),
    fontFamily: FontFamily.monasans.bold,
  },
  bottomBar: {
    paddingTop: moderateVerticalScale(12),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 10,
  },
  orderButton: {
    paddingVertical: scale(16),
    borderRadius: scale(12),
    alignItems: 'center',
  },
  orderButtonText: {
    fontSize: scale(15),
    fontFamily: FontFamily.monasans.bold,
  },
  closedBanner: {
    marginHorizontal: scale(16),
    marginTop: scale(12),
    padding: scale(12),
    borderRadius: scale(8),
    borderWidth: 1,
  },
  closedBannerText: {
    fontSize: scale(13),
    fontFamily: FontFamily.monasans.medium,
    textAlign: 'center',
  },
  emptyCartContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: moderateVerticalScale(48),
  },
  emptyCartText: {
    fontSize: scale(18),
    fontFamily: FontFamily.monasans.semiBold,
    marginBottom: scale(8),
    textAlign: 'center',
  },
  emptyCartHint: {
    fontSize: scale(14),
    fontFamily: FontFamily.monasans.regular,
    marginBottom: scale(24),
    textAlign: 'center',
  },
  emptyCartButton: {
    paddingVertical: scale(14),
    paddingHorizontal: scale(32),
    borderRadius: scale(12),
  },
  emptyCartButtonText: {
    fontSize: scale(15),
    fontFamily: FontFamily.monasans.semiBold,
  },
  // Dine-in layout
  dineInHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: scale(12),
    borderBottomWidth: 1,
  },
  dineInHeaderBtn: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    alignItems: 'center',
    justifyContent: 'center',
  },
  dineInHeaderCenter: {
    alignItems: 'center',
  },
  dineInHeaderTitle: {
    fontSize: scale(18),
    fontFamily: FontFamily.monasans.bold,
  },
  dineInHeaderSubtitle: {
    fontSize: scale(11),
    fontFamily: FontFamily.monasans.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: scale(2),
  },
  dineInRestaurantSection: {
    alignItems: 'center',
    paddingVertical: scale(24),
  },
  dineInRestaurantLogoWrap: {
    width: scale(80),
    height: scale(80),
    borderRadius: scale(12),
    overflow: 'hidden',
    marginBottom: scale(12),
  },
  dineInRestaurantLogo: {
    width: '100%',
    height: '100%',
  },
  dineInStoreName: {
    fontSize: scale(20),
    fontFamily: FontFamily.monasans.bold,
    marginBottom: scale(4),
  },
  dineInStoreBranch: {
    fontSize: scale(14),
    fontFamily: FontFamily.monasans.regular,
    marginBottom: scale(16),
  },
  dineInTableCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: scale(16),
    borderRadius: scale(12),
    borderWidth: 1,
  },
  dineInTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dineInTableIconWrap: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(8),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scale(12),
  },
  dineInTableText: { flex: 1 },
  dineInTableLabel: {
    fontSize: scale(11),
    fontFamily: FontFamily.monasans.medium,
    textTransform: 'uppercase',
  },
  dineInTableValue: {
    fontSize: scale(18),
    fontFamily: FontFamily.monasans.bold,
    marginTop: scale(2),
  },
  dineInTableChange: {
    fontSize: scale(14),
    fontFamily: FontFamily.monasans.semiBold,
  },
  dineInSection: {
    marginBottom: scale(24),
  },
  dineInSectionTitle: {
    fontSize: scale(18),
    fontFamily: FontFamily.monasans.bold,
    marginBottom: scale(12),
    paddingHorizontal: scale(4),
  },
  dineInOrderItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: scale(12),
    borderRadius: scale(12),
    borderWidth: 1,
    marginBottom: scale(12),
  },
  dineInOrderItemThumb: {
    width: scale(64),
    height: scale(64),
    borderRadius: scale(8),
    overflow: 'hidden',
    marginRight: scale(12),
  },
  dineInOrderItemThumbImg: {
    width: '100%',
    height: '100%',
  },
  dineInOrderItemBody: { flex: 1 },
  dineInOrderItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  dineInOrderItemNames: { flex: 1, marginRight: scale(8) },
  dineInOrderItemName: {
    fontSize: scale(16),
    fontFamily: FontFamily.monasans.bold,
  },
  dineInOrderItemNote: {
    fontSize: scale(12),
    fontFamily: FontFamily.monasans.regular,
    marginTop: scale(2),
  },
  dineInOrderItemPrice: {
    fontSize: scale(16),
    fontFamily: FontFamily.monasans.bold,
  },
  dineInOrderQtyBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: scale(8),
    paddingVertical: scale(4),
    borderRadius: scale(6),
    marginTop: scale(8),
  },
  dineInOrderQtyText: {
    fontSize: scale(12),
    fontFamily: FontFamily.monasans.bold,
  },
  dineInKitchenNotes: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: scale(16),
    borderRadius: scale(12),
    borderWidth: 1,
    gap: scale(12),
  },
  dineInKitchenNotesIcon: {
    marginTop: scale(2),
  },
  dineInKitchenNotesInput: {
    flex: 1,
    fontSize: scale(14),
    fontFamily: FontFamily.monasans.regular,
    padding: 0,
    minHeight: scale(80),
    textAlignVertical: 'top',
  },
  dineInSummaryCard: {
    padding: scale(16),
    borderRadius: scale(12),
    borderWidth: 1,
  },
  dineInSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(12),
  },
  dineInSummaryLabel: {
    fontSize: scale(14),
    fontFamily: FontFamily.monasans.regular,
  },
  dineInSummaryValue: {
    fontSize: scale(14),
    fontFamily: FontFamily.monasans.semiBold,
  },
  dineInSummaryDivider: {
    borderTopWidth: 1,
    borderStyle: 'dashed',
    marginVertical: scale(12),
  },
  dineInSummaryTotalLabel: {
    fontSize: scale(18),
    fontFamily: FontFamily.monasans.bold,
  },
  dineInSummaryTotalValue: {
    fontSize: scale(20),
    fontFamily: FontFamily.monasans.bold,
  },
  dineInBottomBar: {
    paddingTop: scale(16),
    borderTopWidth: 1,
  },
  dineInConfirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: scale(56),
    borderRadius: scale(12),
    gap: scale(8),
    ...Platform.select({
      ios: { shadowRadius: 8, shadowOpacity: 0.2 },
      android: { elevation: 4 },
    }),
  },
  dineInConfirmButtonText: {
    fontSize: scale(18),
    fontFamily: FontFamily.monasans.bold,
  },
});

export default FnBCheckoutScreen;
