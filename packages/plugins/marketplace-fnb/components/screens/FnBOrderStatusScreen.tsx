/**
 * FnBOrderStatusScreen
 * Detail pesanan Delivery styled based on the reference design.
 */

import React, { useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import {
  DirectInbox,
  Clock,
  TickCircle,
  TruckFast,
  Shop,
  Box,
  UserSquare,
  RecordCircle,
  Bag2,
  ShoppingCart,
  Moneys,
  DocumentText,
  Reserve,
  ShopAdd,
} from "iconsax-react-nativejs";
import {
  scale,
  moderateVerticalScale,
  getHorizontalPadding,
  FontFamily,
  ScreenHeader,
} from "@core/config";
import { useTheme } from "@core/theme";
import { useTranslation } from "@core/i18n";
import type { OrderStatus, OrderType } from "../../models";
import { useFnBActiveOrder } from "../../context/FnBActiveOrderContext";

const formatPrice = (price: number): string =>
  `Rp ${price.toLocaleString("id-ID")}`;

// Map backend status to 3-step display: 0 = Diterima, 1 = Dalam Pengiriman, 2 = Selesai
function getThreeStepIndex(status: OrderStatus): number {
  switch (status) {
    case "pending":
    case "confirmed":
      return 0;
    case "preparing":
      return 1; // Assuming 'preparing' means it's on its way for delivery context
    case "ready":
    case "completed":
      return 2;
    case "cancelled":
      return -1;
    default:
      return 0;
  }
}

// Mock estimasi siap (createdAt + 30 menit)
function getEstimatedReadyTime(createdAt: string): string {
  try {
    const d = new Date(createdAt);
    d.setMinutes(d.getMinutes() + 30);
    const h = d.getHours();
    const m = d.getMinutes();
    return `${h.toString().padStart(2, "0")}.${m.toString().padStart(2, "0")} WIB`;
  } catch {
    return "--.-- WIB";
  }
}

export const FnBOrderStatusScreen: React.FC = () => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const horizontalPadding = getHorizontalPadding();
  const { activeOrder, setActiveOrder, refreshActiveOrder } =
    useFnBActiveOrder();

  const params = route.params as { orderId?: string } | undefined;
  const orderId = params?.orderId;

  const order = useMemo(() => {
    if (activeOrder && (!orderId || activeOrder.id === orderId))
      return activeOrder;
    return null; // For exact match required, would fetch by ID here if not active
  }, [activeOrder, orderId]);

  useEffect(() => {
    if (!order && orderId) refreshActiveOrder();
  }, [orderId, refreshActiveOrder, order]);

  const currentStepIndex = useMemo(
    () => (order ? getThreeStepIndex(order.status) : -1),
    [order],
  );
  const estimatedReady = useMemo(
    () => (order?.createdAt ? getEstimatedReadyTime(order.createdAt) : ""),
    [order?.createdAt],
  );

  const handleBack = () => {
    navigation.goBack();
  };

  const handleTrackOrder = () => {
    (navigation as any).navigate("FnBOrderTracking", { orderId: order?.id });
  };

  if (!order) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScreenHeader title={t('fnb.orderDetail')} />
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {t('fnb.orderNotFound')}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* HEADER SECTION (Light Gray Background) */}
      <View
        style={[
          styles.topSection,
          { paddingTop: insets.top + moderateVerticalScale(8) },
        ]}
      >
        <ScreenHeader
          title={t('fnb.orderDetail')}
          onBackPress={handleBack}
          paddingHorizontal={horizontalPadding}
        />

        {/* STEPPER */}
        <View style={styles.stepperContainer}>
          <View style={styles.stepperRow}>
            {/* Step 1 */}
            <View style={styles.stepperItem}>
              <View
                style={[
                  styles.stepperIconWrap,
                  currentStepIndex >= 0
                    ? styles.stepperActiveBg
                    : styles.stepperInactiveBg,
                ]}
              >
                {order.orderType === "delivery" ? (
                  <DirectInbox
                    size={scale(24)}
                    color={
                      currentStepIndex >= 0
                        ? colors.primary
                        : colors.textSecondary
                    }
                    variant="Bold"
                  />
                ) : (
                  <Reserve
                    size={scale(24)}
                    color={
                      currentStepIndex >= 0
                        ? colors.primary
                        : colors.textSecondary
                    }
                    variant="Bold"
                  />
                )}
              </View>
              <Text
                style={[
                  styles.stepperLabel,
                  currentStepIndex === 0
                    ? styles.stepperLabelActive
                    : styles.stepperLabelInactive,
                ]}
              >
                {t('fnb.orderReceived')}
              </Text>
            </View>

            <View style={styles.stepperLineWrapper}>
              <View style={styles.stepperLineDashed} />
            </View>

            {/* Step 2 */}
            <View style={styles.stepperItem}>
              <View
                style={[
                  styles.stepperIconWrap,
                  currentStepIndex >= 1
                    ? styles.stepperActiveBg
                    : styles.stepperInactiveBg,
                ]}
              >
                <Clock
                  size={scale(24)}
                  color={
                    currentStepIndex >= 1
                      ? colors.primary
                      : colors.textSecondary
                  }
                  variant="Bold"
                />
              </View>
              <Text
                style={[
                  styles.stepperLabel,
                  currentStepIndex === 1
                    ? styles.stepperLabelActive
                    : styles.stepperLabelInactive,
                ]}
              >
                {order.orderType === "delivery"
                  ? t('fnb.inDelivery')
                  : t('fnb.inProcess')}
              </Text>
            </View>

            <View style={styles.stepperLineWrapper}>
              <View style={styles.stepperLineDashed} />
            </View>

            {/* Step 3 */}
            <View style={styles.stepperItem}>
              <View
                style={[
                  styles.stepperIconWrap,
                  currentStepIndex >= 2
                    ? styles.stepperActiveBg
                    : styles.stepperInactiveBg,
                ]}
              >
                <TickCircle
                  size={scale(24)}
                  color={
                    currentStepIndex >= 2
                      ? colors.primary
                      : colors.textSecondary
                  }
                  variant="Bold"
                />
              </View>
              <Text
                style={[
                  styles.stepperLabel,
                  currentStepIndex === 2
                    ? styles.stepperLabelActive
                    : styles.stepperLabelInactive,
                ]}
              >
                {t('fnb.orderCompleted')}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{
          paddingHorizontal: horizontalPadding,
          paddingBottom: moderateVerticalScale(120),
          paddingTop: scale(16),
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Chips and Target Time */}
        <View style={styles.metaRow}>
          <View style={styles.chipsRow}>
            <View style={styles.chipDelivery}>
              {order.orderType === "delivery" ? (
                <TruckFast
                  size={scale(16)}
                  color={colors.textSecondary}
                  variant="Bold"
                />
              ) : order.orderType === "take-away" ? (
                <Bag2
                  size={scale(16)}
                  color={colors.textSecondary}
                  variant="Bold"
                />
              ) : (
                <Shop
                  size={scale(16)}
                  color={colors.textSecondary}
                  variant="Bold"
                />
              )}
              <Text style={styles.chipText}>
                {order.orderType === "delivery"
                  ? t('fnb.delivery')
                  : order.orderType === "take-away"
                    ? t('fnb.takeAway')
                    : t('fnb.dineIn')}
              </Text>
            </View>
            <View style={styles.chipName}>
              {order.orderType === "dine-in" ? (
                <>
                  <Reserve
                    size={scale(16)}
                    color={colors.textSecondary}
                    variant="Bold"
                  />
                  <Text style={styles.chipText}>
                    {t('fnb.tableNo')} {order.tableNumber || "-"}
                  </Text>
                </>
              ) : (
                <>
                  <Shop
                    size={scale(16)}
                    color={colors.textSecondary}
                    variant="Bold"
                  />
                  <Text style={styles.chipText}>
                    {t('fnb.orderUnderName', {
                      name: order.customerName || t('fnb.guestCustomer'),
                    })}
                  </Text>
                </>
              )}
            </View>
          </View>
        </View>

        <Text style={[styles.foodReadyText, { color: colors.primary }]}>
          {t('fnb.foodReadyAt', { time: estimatedReady })}
        </Text>

        {/* Modular Cards Rendered Based on Order Type */}
        {(() => {
          const renderAddressCard = () => (
            <View style={[styles.card, { borderColor: colors.border }]}>
              <View style={styles.addressSection}>
                <View style={styles.addressHeader}>
                  <Shop
                    size={scale(16)}
                    color={colors.textSecondary}
                    variant="Bold"
                  />
                  <Text style={styles.addressLabel}>{t('fnb.sender')}</Text>
                </View>
                <Text style={[styles.addressTitle, { color: colors.text }]}>
                  {order.storeName || t('fnb.merchantName')}
                </Text>
              </View>
              <View style={[styles.addressSection, { marginTop: scale(16) }]}>
                <View style={styles.addressHeader}>
                  <UserSquare
                    size={scale(16)}
                    color={colors.textSecondary}
                    variant="Bold"
                  />
                  <Text style={styles.addressLabel}>{t('fnb.recipient')}</Text>
                </View>
                <Text style={[styles.addressTitle, { color: colors.text }]}>
                  {order.customerName} - {order.phoneNumber || "08XXX"}
                </Text>
                <Text
                  style={[
                    styles.addressDetail,
                    { color: colors.textSecondary },
                  ]}
                >
                  {order.deliveryAddress || t('fnb.addressNotAvailable')}
                </Text>
              </View>
            </View>
          );

          const renderDriverCard = () => (
            <View
              style={[
                styles.card,
                { borderColor: colors.border, marginTop: scale(16) },
              ]}
            >
              <View style={styles.addressHeader}>
                <Box
                  size={scale(16)}
                  color={colors.textSecondary}
                  variant="Bold"
                />
                <Text style={styles.addressLabel}>{t('fnb.deliverySection')}</Text>
              </View>
              <View style={styles.driverRow}>
                <View style={styles.driverInfo}>
                  <RecordCircle
                    size={scale(20)}
                    color={colors.primary}
                    variant="Bold"
                  />
                  <Text style={[styles.driverName, { color: colors.text }]}>
                    Gojek
                  </Text>
                </View>
                <Text style={[styles.driverPrice, { color: colors.text }]}>
                  {formatPrice(order.deliveryFee || 0)}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.trackButtonWrap}
                onPress={handleTrackOrder}
              >
                <Text
                  style={[styles.trackButtonText, { color: colors.primary }]}
                >
                  {t('fnb.trackOrder')}
                </Text>
              </TouchableOpacity>
            </View>
          );

          const renderPesananCard = (marginT: number) => (
            <View
              style={[
                styles.card,
                { borderColor: colors.border, marginTop: marginT },
              ]}
            >
              <View style={styles.addressHeader}>
                <ShoppingCart
                  size={scale(16)}
                  color={colors.textSecondary}
                  variant="Linear"
                />
                <Text style={styles.addressLabel}>{t('fnb.orderLabel')}</Text>
              </View>
              {order.items.map((line, idx) => (
                <View key={idx} style={styles.itemRowWrapper}>
                  <View style={styles.itemRow}>
                    <Text style={[styles.itemQty, { color: colors.text }]}>
                      {line.quantity}x
                    </Text>
                    <View style={styles.itemMain}>
                      <Text style={[styles.itemName, { color: colors.text }]}>
                        {line.item.name}
                      </Text>
                      {line.notes?.trim() ? (
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            marginTop: scale(4),
                          }}
                        >
                          <DocumentText
                            size={scale(12)}
                            color={colors.textSecondary}
                            variant="Bold"
                          />
                          <Text
                            style={[
                              styles.itemNote,
                              {
                                color: colors.textSecondary,
                                marginLeft: scale(4),
                                marginTop: 0,
                              },
                            ]}
                            numberOfLines={2}
                          >
                            {line.notes}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={[styles.itemPrice, { color: colors.text }]}>
                      {formatPrice(line.subtotal)}
                    </Text>
                  </View>
                  {idx < order.items.length - 1 && (
                    <View
                      style={[
                        styles.dashedDivider,
                        { borderColor: colors.border },
                      ]}
                    />
                  )}
                </View>
              ))}
            </View>
          );

          const renderPembayaranCard = () => (
            <View
              style={[
                styles.card,
                { borderColor: colors.border, marginTop: scale(16) },
              ]}
            >
              <View style={styles.addressHeader}>
                <Moneys
                  size={scale(16)}
                  color={colors.textSecondary}
                  variant="Bold"
                />
                <Text style={styles.addressLabel}>{t('fnb.payment')}</Text>
              </View>
              <View style={styles.paymentRow}>
                <Text
                  style={[styles.paymentLabel, { color: colors.textSecondary }]}
                >
                  {t('fnb.paymentMethod')}
                </Text>
                <Text style={[styles.paymentValue, { color: colors.text }]}>
                  {order.paymentMethod === 'pay_at_counter'
                    ? (t('fnb.payAtCounter') || 'Bayar di kasir')
                    : order.paymentMethod === 'pay_later'
                      ? (t('fnb.payLater') || 'Bayar nanti')
                      : order.paymentMethod === 'balance'
                        ? (t('fnb.payWithBalance') || 'Bayar dengan Saldo') +
                          (order.balanceType
                            ? ` (${order.balanceType === 'saldo-makan' ? (t('fnb.balanceTypeMeal') || 'Saldo Makanan') : order.balanceType === 'saldo-utama' ? (t('fnb.balanceTypeMain') || 'Saldo Utama') : (t('fnb.balanceTypePlafon') || 'Saldo Plafon')})`
                            : '')
                        : '—'}
                </Text>
              </View>
              <View style={styles.paymentRow}>
                <Text
                  style={[styles.paymentLabel, { color: colors.textSecondary }]}
                >
                  {t('fnb.subtotal')}
                </Text>
                <Text style={[styles.paymentValue, { color: colors.text }]}>
                  {formatPrice(order.subtotal || 0)}
                </Text>
              </View>
              <View style={styles.paymentRow}>
                <Text
                  style={[styles.paymentLabel, { color: colors.textSecondary }]}
                >
                  {t('fnb.serviceFeeLabel')}
                </Text>
                <Text style={[styles.paymentValue, { color: colors.text }]}>
                  {formatPrice(order.serviceFee || 0)}
                </Text>
              </View>
              <View
                style={[styles.dashedDivider, { borderColor: colors.border }]}
              />
              <View style={[styles.paymentRow, { marginBottom: 0 }]}>
                <Text
                  style={[styles.paymentTotalLabel, { color: colors.text }]}
                >
                  {t('fnb.totalPayment')}
                </Text>
                <Text
                  style={[styles.paymentTotalValue, { color: colors.text }]}
                >
                  {formatPrice(order.total || 0)}
                </Text>
              </View>
            </View>
          );

          const renderCatatanGlobal = () => {
            const globalNotes =
              (order as any).notes || t('fnb.defaultOrderNotes');
            if (!globalNotes) return null;
            return (
              <View
                style={[
                  styles.card,
                  { borderColor: colors.border, marginTop: scale(16) },
                ]}
              >
                <View style={styles.addressHeader}>
                  <DocumentText
                    size={scale(16)}
                    color={colors.textSecondary}
                    variant="Bold"
                  />
                  <Text style={styles.addressLabel}>{t('fnb.note')}</Text>
                </View>
                <Text
                  style={[
                    styles.addressTitle,
                    {
                      color: colors.text,
                      marginTop: scale(4),
                      fontFamily: FontFamily.monasans.regular,
                    },
                  ]}
                >
                  {globalNotes}
                </Text>
              </View>
            );
          };

          if (order.orderType === "delivery") {
            return (
              <>
                {renderAddressCard()}
                {renderDriverCard()}
                {renderPesananCard(scale(16))}
                {renderPembayaranCard()}
                {renderCatatanGlobal()}
              </>
            );
          } else {
            return (
              <>
                {renderPesananCard(0)}
                {renderPembayaranCard()}
                {renderCatatanGlobal()}
              </>
            );
          }
        })()}
      </ScrollView>
    </View>
  );
};

FnBOrderStatusScreen.displayName = "FnBOrderStatusScreen";

const styles = StyleSheet.create({
  container: { flex: 1 },
  topSection: {
    backgroundColor: "#F9F9FB", // Light gray background for stepper section
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
    paddingBottom: scale(24),
  },
  stepperContainer: {
    marginTop: scale(24),
    paddingHorizontal: scale(24),
  },
  stepperRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  stepperItem: {
    alignItems: "center",
    flex: 1,
    zIndex: 2,
  },
  stepperIconWrap: {
    width: scale(56),
    height: scale(56),
    borderRadius: scale(28),
    justifyContent: "center",
    alignItems: "center",
    marginBottom: scale(12),
  },
  stepperActiveBg: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  stepperInactiveBg: {
    backgroundColor: "#F0F0F0",
  },
  stepperLabel: {
    fontSize: scale(12),
    textAlign: "center",
  },
  stepperLabelActive: {
    fontFamily: FontFamily.monasans.semiBold,
    color: "#000",
  },
  stepperLabelInactive: {
    fontFamily: FontFamily.monasans.regular,
    color: "#999",
  },
  stepperLineWrapper: {
    flex: 1,
    height: scale(56), // Align with center of icon
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
    marginTop: -scale(12),
  },
  stepperLineDashed: {
    width: "100%",
    height: 1,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderStyle: "dashed",
  },
  content: { flex: 1 },
  metaRow: {
    marginTop: scale(8),
    marginBottom: scale(12),
  },
  chipsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(12),
  },
  chipDelivery: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
  },
  chipName: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
    backgroundColor: "#F5F5F5",
    paddingHorizontal: scale(12),
    paddingVertical: scale(6),
    borderRadius: scale(6),
  },
  chipText: {
    fontSize: scale(13),
    fontFamily: FontFamily.monasans.medium,
    color: "#444",
  },
  foodReadyText: {
    fontSize: scale(13),
    fontFamily: FontFamily.monasans.semiBold,
    marginBottom: scale(16),
  },
  card: {
    borderWidth: 1,
    borderRadius: scale(12),
    padding: scale(16),
    backgroundColor: "#FFFFFF",
  },
  addressSection: {
    // marginBottom: scale(8),
  },
  addressHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
    marginBottom: scale(8),
  },
  addressLabel: {
    fontSize: scale(13),
    fontFamily: FontFamily.monasans.regular,
    color: "#777",
  },
  addressTitle: {
    fontSize: scale(14),
    fontFamily: FontFamily.monasans.semiBold,
    marginBottom: scale(4),
  },
  addressDetail: {
    fontSize: scale(13),
    fontFamily: FontFamily.monasans.regular,
    lineHeight: scale(18),
  },
  driverRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: scale(12),
  },
  driverInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
  },
  driverName: {
    fontSize: scale(14),
    fontFamily: FontFamily.monasans.medium,
  },
  driverPrice: {
    fontSize: scale(14),
    fontFamily: FontFamily.monasans.semiBold,
  },
  trackButtonWrap: {
    marginTop: scale(16),
    alignItems: "center",
    paddingVertical: scale(8),
  },
  trackButtonText: {
    fontSize: scale(15),
    fontFamily: FontFamily.monasans.semiBold,
  },
  itemRowWrapper: {
    marginTop: scale(8),
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: scale(8),
  },
  itemQty: {
    fontSize: scale(14),
    fontFamily: FontFamily.monasans.medium,
    width: scale(30),
    marginTop: 2,
  },
  itemMain: {
    flex: 1,
    paddingRight: scale(12),
  },
  itemName: {
    fontSize: scale(14),
    fontFamily: FontFamily.monasans.medium,
  },
  itemNote: {
    fontSize: scale(12),
    fontFamily: FontFamily.monasans.regular,
    marginTop: scale(4),
  },
  itemPrice: {
    fontSize: scale(14),
    fontFamily: FontFamily.monasans.semiBold,
    marginTop: 2,
  },
  dashedDivider: {
    borderWidth: 0.5,
    borderStyle: "dashed",
    marginVertical: scale(8),
    marginHorizontal: scale(4),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: scale(15),
    fontFamily: FontFamily.monasans.regular,
  },
  paymentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: scale(8),
  },
  paymentLabel: {
    fontSize: scale(14),
    fontFamily: FontFamily.monasans.regular,
  },
  paymentValue: {
    fontSize: scale(14),
    fontFamily: FontFamily.monasans.regular,
  },
  paymentTotalLabel: {
    fontSize: scale(14),
    fontFamily: FontFamily.monasans.semiBold,
  },
  paymentTotalValue: {
    fontSize: scale(14),
    fontFamily: FontFamily.monasans.bold,
  },
});

export default FnBOrderStatusScreen;
