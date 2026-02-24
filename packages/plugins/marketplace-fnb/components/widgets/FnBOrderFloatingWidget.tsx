/**
 * FnBOrderFloatingWidget
 * Floating bottom bar showing active order (Grab/GoFood style). Tap opens order status screen.
 */

import React, { useMemo, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useNavigation,
  useRoute,
  CommonActions,
} from "@react-navigation/native";
import {
  ArrowRight2,
  Clock,
  TaskSquare,
  TickCircle,
  Reserve,
  Bag2,
  DirectInbox,
  TruckFast,
} from "iconsax-react-nativejs";
import {
  scale,
  getHorizontalPadding,
  FontFamily,
  getResponsiveFontSize,
} from "@core/config";
import { useTheme } from "@core/theme";
import { useTranslation } from "@core/i18n";
import type { OrderStatus } from "../../models";
import { useFnBActiveOrder } from "../../context/FnBActiveOrderContext";

// Adjusted for Delivery flow context based on screenshot
// Original mapping can still use t() but fallback text updated for delivery context.
const STATUS_KEYS: Record<OrderStatus, string> = {
  pending: "fnb.statusPending", // Menunggu konfirmasi
  confirmed: "fnb.statusConfirmed", // Order Diterima / Menyiapkan
  preparing: "fnb.statusPreparing", // Dalam Pengiriman / Di jalan
  ready: "fnb.statusReady", // Pesanan Tiba
  completed: "fnb.statusCompleted", // Order Selesai
  cancelled: "fnb.statusCancelled",
};

const getStatusIcon = (status: OrderStatus, color: string, size: number) => {
  switch (status) {
    case "pending":
      return <Clock size={size} color={color} variant="Bold" />;
    case "confirmed":
      // Order Diterima (Receipt/Inbox)
      return <DirectInbox size={size} color={color} variant="Bold" />;
    case "preparing":
      // Dalam Pengiriman (Truck/Motorcycle)
      return <TruckFast size={size} color={color} variant="Bold" />;
    case "ready":
      // Selesai/Tiba
      return <TickCircle size={size} color={color} variant="Bold" />;
    default:
      return <Bag2 size={size} color={color} variant="Bold" />;
  }
};

export const FnBOrderFloatingWidget: React.FC = () => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const horizontalPadding = getHorizontalPadding();
  const { activeOrder } = useFnBActiveOrder();

  const pulseAnim = useRef(new Animated.Value(0.8)).current;
  const visibilityAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(-1)).current;

  const [isRendered, setIsRendered] = React.useState(false);

  const currentRoute = useRoute();

  const visible = useMemo(() => {
    if (!activeOrder) return false;
    if (
      activeOrder.status === "completed" ||
      activeOrder.status === "cancelled"
    )
      return false;
    // Hide widget when already on FnBOrderStatus screen
    if (currentRoute?.name === "FnBOrderStatus") return false;
    return true;
  }, [activeOrder, currentRoute?.name]);

  useEffect(() => {
    if (visible) {
      setIsRendered(true);
      Animated.spring(visibilityAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }).start();

      Animated.loop(
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: true,
        }),
      ).start();
    } else {
      Animated.timing(visibilityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setIsRendered(false);
      });
      shimmerAnim.stopAnimation();
    }
  }, [visible, visibilityAnim, shimmerAnim]);

  useEffect(() => {
    if (!visible) {
      pulseAnim.stopAnimation();
      return;
    }
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.8,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [visible, pulseAnim]);

  const statusText = useMemo(() => {
    if (!activeOrder) return "";
    const translated = t(STATUS_KEYS[activeOrder.status]);

    // If the translation returns the key itself or is missing, fallback to explicit Delivery text
    if (!translated || translated === STATUS_KEYS[activeOrder.status]) {
      switch (activeOrder.status) {
        case "pending":
          return "Menunggu Konfirmasi";
        case "confirmed":
          return "Order Diterima";
        case "preparing":
          return "Dalam Pengiriman";
        case "ready":
          return "Pesanan Tiba";
        case "completed":
          return "Order Selesai";
        case "cancelled":
          return "Dibatalkan";
        default:
          return activeOrder.status;
      }
    }

    return translated || activeOrder.status;
  }, [activeOrder, t]);

  const handlePress = () => {
    if (!activeOrder) return;
    // Use navigate (not push) to prevent duplicate stack entries
    navigation.dispatch(
      CommonActions.navigate({
        name: "FnBOrderStatus",
        params: { orderId: activeOrder.id },
      }),
    );
  };

  if (!isRendered) return null;

  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          paddingBottom: insets.bottom + scale(12),
          paddingHorizontal: horizontalPadding,
          opacity: visibilityAnim,
          transform: [
            {
              translateY: visibilityAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [100, 0],
              }),
            },
          ],
        },
      ]}
      pointerEvents="box-none"
    >
      <TouchableOpacity
        style={[
          styles.bar,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
        onPress={handlePress}
        activeOpacity={0.9}
      >
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            {
              backgroundColor: colors.primaryLight,
              opacity: 0.4,
              width: "150%",
              transform: [
                {
                  translateX: shimmerAnim.interpolate({
                    inputRange: [-1, 1],
                    outputRange: [-scale(400), scale(400)],
                  }),
                },
              ],
            },
          ]}
        />
        <View style={styles.iconWrapper}>
          <Animated.View
            style={[
              styles.iconPulse,
              {
                backgroundColor: colors.primaryLight,
                transform: [{ scale: pulseAnim }],
                opacity: pulseAnim.interpolate({
                  inputRange: [0.8, 1.3],
                  outputRange: [0.6, 0],
                }),
              },
            ]}
          />
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: colors.primaryLight },
            ]}
          >
            {activeOrder &&
              getStatusIcon(activeOrder.status, colors.primary, scale(22))}
          </View>
        </View>

        <View style={styles.content}>
          <Text
            style={[styles.statusText, { color: colors.primary }]}
            numberOfLines={1}
          >
            {statusText}
          </Text>
          <Text
            style={[styles.storeName, { color: colors.text }]}
            numberOfLines={1}
          >
            {activeOrder?.storeName || activeOrder?.storeId}
          </Text>
        </View>

        <View style={[styles.chevron, { backgroundColor: colors.primary }]}>
          <ArrowRight2
            size={scale(18)}
            color={colors.surface}
            variant="Linear"
          />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

FnBOrderFloatingWidget.displayName = "FnBOrderFloatingWidget";

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    padding: scale(10),
    paddingRight: scale(12),
    borderRadius: scale(100),
    borderWidth: 1,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  iconWrapper: {
    width: scale(46),
    height: scale(46),
    justifyContent: "center",
    alignItems: "center",
    marginRight: scale(12),
  },
  iconPulse: {
    position: "absolute",
    width: scale(46),
    height: scale(46),
    borderRadius: scale(23),
  },
  iconContainer: {
    width: scale(46),
    height: scale(46),
    borderRadius: scale(23),
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    marginRight: scale(12),
  },
  statusText: {
    fontSize: getResponsiveFontSize("medium"),
    fontFamily: FontFamily.monasans.bold,
    marginBottom: scale(2),
  },
  storeName: {
    fontSize: getResponsiveFontSize("small"),
    fontFamily: FontFamily.monasans.medium,
  },
  chevron: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    justifyContent: "center",
    alignItems: "center",
  },
});
