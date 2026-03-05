/**
 * FnBScreen Component
 * FnB Home Discovery – GoFood-style layout (Location pill, Search+Scan, Banners, Categories, Merchant list).
 * Flow: FnBMerchantDetail, FnBScan, FnBFavorites; FnBOrderFloatingWidget at bottom.
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  Image,
  FlatList,
  Dimensions,
  Platform,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import {
  SearchNormal,
  CloseCircle,
  Heart,
  Star1,
  Location,
  ScanBarcode,
  DiscountShape,
  Shop,
  Cake,
  Coffee,
  Discover,
  ReceiptItem,
  DocumentText,
  Clock,
  Note,
  People,
  PercentageSquare,
  TruckFast,
} from "iconsax-react-nativejs";
import {
  scale,
  moderateVerticalScale,
  getHorizontalPadding,
  FontFamily,
} from "@core/config";
import { useTheme } from "@core/theme";
import { useTranslation } from "@core/i18n";
import type { EntryPoint } from "../../models";
import { useFnBStoreFavorites, useFnBCart } from "../../hooks";
import { useFnBLocation } from "../../context/FnBLocationContext";
import { FNBDISCOVERY_MERCHANTS } from "../../data/fnbDiscoveryMerchants";
import { FnBOrderFloatingWidget } from "../widgets/FnBOrderFloatingWidget";
import { FnBCartBar } from "../shared/FnBCartBar";
import { FnBLocationPickerSheet } from "../shared/FnBLocationPickerSheet";
import { FnBLocationPickerModal } from "../shared/FnBLocationPickerModal";

interface FnBScreenProps {
  entryPoint?: EntryPoint;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type FnBBottomTab = "jelajahi" | "aktivitas" | "favorit";
type AktivitasSubTab = "riwayat" | "dalam_proses" | "draf";

// --- Data ---

type BadgeBgKey = "primary" | "warning";
const BANNERS = [
  {
    id: "1",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBWyem3VPeIeVGlwdhRc47bzmSwB9pKrdWT7a0Rc1AP4VzSRhtMC2E-TjmfyCsWj7V1udDJ3gdmZVzy9lFWwd-ImUFUqlhQIM6lmhbAVU-aSjETyAeOsaSZOVrdyENacXoOgDeff2kiVFLQ0tsKo6Fr3w_9Gh9-Qe4Cy5jVkgfeiLkblLoAMq2HW6QLLwBgqQ4GJtaXVc1F3vARUearq6k7jQsosh8voVpOJS9tLYrmLo3KGeUBIGCD0fISkJawRfO7A-JkWd9Zq0d3",
    badgeKey: "fnb.badgePromo" as const,
    badgeBg: "primary" as BadgeBgKey,
    titleKey: "fnb.banner1Title" as const,
    subtitleKey: "fnb.banner1Subtitle" as const,
  },
  {
    id: "2",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCHfyBwgQ8ElUtgZsMyKMenLipEecXBlPorwQrZI7N7VfOno-H56q33nAkrO6EyyhSWlj142RYUvIDVUIs1LSvlSDX9pAKgBqkA-xQZRDz8SxweVglQmqzb2Z4Z1y1rF2fL0jM2t7ZqqP-ElMV5eWJ4u0R0ZZDRtjpF1y975rhxaDfAid_jJYHpIwyrXtKL0-PZoMCFg2Ls9advSszDtI24scMVO7eZLh5OFIima-PP2S6gxrwIDqxpERF67oldhdlC2MDHbvBtqgrR",
    badgeKey: "fnb.badgeNew" as const,
    badgeBg: "warning" as BadgeBgKey,
    titleKey: "fnb.banner2Title" as const,
    subtitleKey: "fnb.banner2Subtitle" as const,
  },
  {
    id: "3",
    imageUrl:
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&h=400&fit=crop",
    badgeKey: "fnb.badgeBestSeller" as const,
    badgeBg: "primary" as BadgeBgKey,
    titleKey: "fnb.banner3Title" as const,
    subtitleKey: "fnb.banner3Subtitle" as const,
  },
  {
    id: "4",
    imageUrl:
      "https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=800&h=400&fit=crop",
    badgeKey: "fnb.badgeFreeDelivery" as const,
    badgeBg: "primary" as BadgeBgKey,
    titleKey: "fnb.banner4Title" as const,
    subtitleKey: "fnb.banner4Subtitle" as const,
  },
];

type CategoryColorKey = "primary" | "warning" | "info" | "error";
const CATEGORIES = [
  { id: "1", nameKey: "fnb.categoryResto" as const, Icon: Shop, colorKey: "primary" as CategoryColorKey },
  { id: "2", nameKey: "fnb.categoryOngkir" as const, Icon: TruckFast, colorKey: "warning" as CategoryColorKey },
  { id: "3", nameKey: "fnb.categoryGroupOrder" as const, Icon: People, colorKey: "info" as CategoryColorKey },
  { id: "4", nameKey: "fnb.categorySerbaPromo" as const, Icon: PercentageSquare, colorKey: "error" as CategoryColorKey },
];

const MERCHANTS = FNBDISCOVERY_MERCHANTS;

const BORDER_RADIUS = scale(16);
const BORDER_RADIUS_LG = scale(20);
const BANNER_CARD_WIDTH = SCREEN_WIDTH;
const PARALLAX_HERO_HEIGHT = scale(280);
const HEADER_HEIGHT = scale(56);

export const FnBScreen: React.FC<FnBScreenProps> = ({
  entryPoint = "browse",
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const horizontalPadding = getHorizontalPadding();
  const [activeTab, setActiveTab] = useState<FnBBottomTab>("jelajahi");
  const [aktivitasSubTab, setAktivitasSubTab] =
    useState<AktivitasSubTab>("riwayat");
  const [refreshing, setRefreshing] = useState(false);
  const [locationSheetVisible, setLocationSheetVisible] = useState(false);
  const [mapModalVisible, setMapModalVisible] = useState(false);
  const { deliveryAddress, setDeliveryAddress } = useFnBLocation();
  const scrollY = useRef(new Animated.Value(0)).current;
  const bannerListRef = useRef<FlatList>(null);
  const bannerIndexRef = useRef(0);
  const CAROUSEL_INTERVAL = 4000;
  const bannerItemWidth = BANNER_CARD_WIDTH;

  useEffect(() => {
    if (activeTab !== "jelajahi") return;
    const id = setInterval(() => {
      const next = (bannerIndexRef.current + 1) % BANNERS.length;
      bannerIndexRef.current = next;
      bannerListRef.current?.scrollToOffset({
        offset: next * bannerItemWidth,
        animated: true,
      });
    }, CAROUSEL_INTERVAL);
    return () => clearInterval(id);
  }, [activeTab, bannerItemWidth]);

  const handleMerchantPress = useCallback(
    (storeId: string) => {
      const cleanId = storeId.replace(/-dup$/, "");
      (navigation as any).navigate("FnBMerchantDetail", {
        entryPoint,
        storeId: cleanId,
      });
    },
    [navigation, entryPoint],
  );

  const handleScanPress = useCallback(() => {
    (navigation as any).navigate("FnBScan");
  }, [navigation]);

  const handleFavoritesPress = useCallback(() => {
    (navigation as any).navigate("FnBFavorites");
  }, [navigation]);

  const { isFavoriteStore, toggleStoreFavorite } = useFnBStoreFavorites();

  const {
    itemCount: cartItemCount,
    subtotal: cartSubtotal,
    activeStoreId: cartStoreId,
    activeStoreName: cartStoreName,
  } = useFnBCart(entryPoint);

  const handleSeeAllPress = useCallback(() => {
    (navigation as any).navigate("FnBFavorites");
  }, [navigation]);

  const handleSearchPress = useCallback(() => {
    (navigation as any).navigate("FnBProductSearch");
  }, [navigation]);

  const handleMauLagiPress = useCallback(() => setActiveTab("jelajahi"), []);

  const handleCartBarPress = useCallback(() => {
    if (cartStoreId) {
      (navigation as any).navigate("FnBMerchantDetail", {
        entryPoint,
        storeId: cartStoreId,
      });
    }
  }, [navigation, entryPoint, cartStoreId]);

  const handleCartCheckout = useCallback(() => {
    if (cartStoreId) {
      (navigation as any).navigate("FnBCheckout", {
        entryPoint,
        storeId: cartStoreId,
      });
    }
  }, [navigation, entryPoint, cartStoreId]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  }, []);

  // --- Header: interpolasi lebar range agar smooth; hanya opacity/transform supaya native driver bisa ---
  const HEADER_TRANSITION_END = 110;
  const headerBgOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_TRANSITION_END],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const headerIconOpacityLight = scrollY.interpolate({
    inputRange: [0, HEADER_TRANSITION_END],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  const headerIconOpacityDark = scrollY.interpolate({
    inputRange: [0, HEADER_TRANSITION_END],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const stickyStart = 100;
  const stickyEnd = 165;
  const stickySearchOpacity = scrollY.interpolate({
    inputRange: [stickyStart, stickyEnd],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const stickySearchTranslateY = scrollY.interpolate({
    inputRange: [stickyStart, stickyEnd],
    outputRange: [-scale(8), 0],
    extrapolate: "clamp",
  });

  const header = (
    <View
      style={[
        styles.headerOverlay,
        {
          paddingTop: insets.top + scale(8),
          paddingBottom: scale(8),
          paddingHorizontal: horizontalPadding,
        },
      ]}
      pointerEvents="box-none"
    >
      <Animated.View
        style={[
          styles.headerOverlayBg,
          {
            backgroundColor: colors.surface,
            opacity: headerBgOpacity,
            borderBottomLeftRadius: BORDER_RADIUS_LG,
            borderBottomRightRadius: BORDER_RADIUS_LG,
            shadowColor: colors.text,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          },
        ]}
        pointerEvents="none"
      />

      <View
        style={{ flex: 1, zIndex: 10, elevation: 4 }}
        pointerEvents="box-none"
      >
        {/* Baris atas: Close + Location pill + action icons */}
        <View style={styles.headerTopRow}>
          {/* Close button: overlay opacity (bisa native driver) */}
          <View style={[styles.headerCircleBtnWrap, { borderRadius: scale(20) }]}>
            <Animated.View
              style={[
                StyleSheet.absoluteFillObject,
                styles.headerBtnOverlayDark,
                { opacity: headerIconOpacityLight, borderRadius: scale(20) },
              ]}
            />
            <Animated.View
              style={[
                StyleSheet.absoluteFillObject,
                styles.headerBtnOverlayLight,
                { opacity: headerIconOpacityDark, borderRadius: scale(20) },
              ]}
            />
            <TouchableOpacity
              onPress={() => (navigation as any).goBack()}
              style={styles.headerCircleBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <View
                style={{
                  width: scale(22),
                  height: scale(22),
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Animated.View
                  style={{
                    position: "absolute",
                    opacity: headerIconOpacityLight,
                  }}
                >
                  <CloseCircle
                    size={scale(22)}
                    color={colors.surface}
                    variant="Linear"
                  />
                </Animated.View>
                <Animated.View
                  style={{
                    position: "absolute",
                    opacity: headerIconOpacityDark,
                  }}
                >
                  <CloseCircle
                    size={scale(22)}
                    color={colors.text}
                    variant="Linear"
                  />
                </Animated.View>
              </View>
            </TouchableOpacity>
          </View>

          {/* Location pill */}
          <TouchableOpacity
            style={[styles.locationPill, { backgroundColor: colors.primary }]}
            activeOpacity={0.8}
            onPress={() => setLocationSheetVisible(true)}
          >
            <Location size={scale(14)} color={colors.surface} variant="Bold" />
            <Text
              style={[styles.locationPillText, { color: colors.surface }]}
              numberOfLines={1}
            >
              {deliveryAddress
                ? (deliveryAddress.split(",")[0]?.trim() || deliveryAddress)
                : t("fnb.currentLocationShort")}
            </Text>
          </TouchableOpacity>

          {/* Right action icons */}
          <View style={styles.headerRightIcons}>
            <View style={[styles.headerCircleBtnWrap, { borderRadius: scale(20) }]}>
              <Animated.View
                style={[
                  StyleSheet.absoluteFillObject,
                  styles.headerBtnOverlayDark,
                  { opacity: headerIconOpacityLight, borderRadius: scale(20) },
                ]}
              />
              <Animated.View
                style={[
                  StyleSheet.absoluteFillObject,
                  styles.headerBtnOverlayLight,
                  { opacity: headerIconOpacityDark, borderRadius: scale(20) },
                ]}
              />
              <TouchableOpacity
                style={styles.headerCircleBtn}
                onPress={handleFavoritesPress}
              >
                <View
                  style={{
                    width: scale(20),
                    height: scale(20),
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Animated.View
                    style={{
                      position: "absolute",
                      opacity: headerIconOpacityLight,
                    }}
                  >
                    <Heart
                      size={scale(20)}
                      color={colors.surface}
                      variant="Linear"
                    />
                  </Animated.View>
                  <Animated.View
                    style={{
                      position: "absolute",
                      opacity: headerIconOpacityDark,
                    }}
                  >
                    <Heart
                      size={scale(20)}
                      color={colors.text}
                      variant="Linear"
                    />
                  </Animated.View>
                </View>
              </TouchableOpacity>
            </View>
            <View style={[styles.headerCircleBtnWrap, { borderRadius: scale(20) }]}>
              <Animated.View
                style={[
                  StyleSheet.absoluteFillObject,
                  styles.headerBtnOverlayDark,
                  { opacity: headerIconOpacityLight, borderRadius: scale(20) },
                ]}
              />
              <Animated.View
                style={[
                  StyleSheet.absoluteFillObject,
                  styles.headerBtnOverlayLight,
                  { opacity: headerIconOpacityDark, borderRadius: scale(20) },
                ]}
              />
              <TouchableOpacity
                style={styles.headerCircleBtn}
                onPress={() => setActiveTab("aktivitas")}
              >
                <View
                  style={{
                    width: scale(20),
                    height: scale(20),
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Animated.View
                    style={{
                      position: "absolute",
                      opacity: headerIconOpacityLight,
                    }}
                  >
                    <DocumentText
                      size={scale(20)}
                      color={colors.surface}
                      variant="Linear"
                    />
                  </Animated.View>
                  <Animated.View
                    style={{
                      position: "absolute",
                      opacity: headerIconOpacityDark,
                    }}
                  >
                    <DocumentText
                      size={scale(20)}
                      color={colors.text}
                    variant="Linear"
                  />
                </Animated.View>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>

        {/* Search bar di bawah baris Close + Location + icons */}
        <Animated.View
          style={{
            opacity: stickySearchOpacity,
            transform: [{ translateY: stickySearchTranslateY }],
            marginTop: scale(12),
          }}
          pointerEvents="box-none"
        >
          <View
            style={[
              styles.searchWrap,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <TouchableOpacity
              style={styles.searchInputTouchable}
              onPress={handleSearchPress}
              activeOpacity={0.7}
            >
              <SearchNormal
                size={scale(20)}
                color={colors.textSecondary}
                variant="Linear"
              />
              <Text
                style={[styles.searchPlaceholder, { color: colors.textSecondary }]}
                numberOfLines={1}
              >
                {t("fnb.searchCraving")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleScanPress}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <ScanBarcode
                size={scale(22)}
                color={colors.primary}
                variant="Bold"
              />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </View>
  );

  // --- Search bar with scan icon (tap opens FnBProductSearch) ---
  const searchBarComponent = (
    <View
      style={[
        styles.searchWrap,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <TouchableOpacity
        style={styles.searchInputTouchable}
        onPress={handleSearchPress}
        activeOpacity={0.7}
      >
        <SearchNormal
          size={scale(20)}
          color={colors.textSecondary}
          variant="Linear"
        />
        <Text
          style={[styles.searchPlaceholder, { color: colors.textSecondary }]}
          numberOfLines={1}
        >
          {t("fnb.searchCraving")}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={handleScanPress}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <ScanBarcode size={scale(22)} color={colors.primary} variant="Bold" />
      </TouchableOpacity>
    </View>
  );

  // --- Banner card ---
  const renderBanner = ({ item }: { item: (typeof BANNERS)[0] }) => (
    <TouchableOpacity
      style={[styles.bannerCard, { width: BANNER_CARD_WIDTH }]}
      activeOpacity={0.95}
    >
      <Image
        source={{ uri: item.imageUrl }}
        style={styles.bannerImage}
        resizeMode="cover"
      />
      <View style={styles.bannerGradient} />
      <View style={styles.bannerContent}>
        <View
          style={[
            styles.bannerBadge,
            {
              backgroundColor:
                item.badgeBg === "warning" ? colors.warning : colors.primary,
            },
          ]}
        >
          <Text style={styles.bannerBadgeText}>{t(item.badgeKey)}</Text>
        </View>
        <Text style={styles.bannerTitle}>{t(item.titleKey)}</Text>
        <Text style={styles.bannerSubtitle}>{t(item.subtitleKey)}</Text>
      </View>
    </TouchableOpacity>
  );

  // --- Category item (circular) ---
  const renderCategory = ({ item }: { item: (typeof CATEGORIES)[0] }) => {
    const IconComponent = item.Icon;
    const catColor = colors[item.colorKey] ?? colors.primary;
    return (
      <TouchableOpacity style={styles.categoryItem} activeOpacity={0.7}>
        <View
          style={[
            styles.categoryCircle,
            {
              backgroundColor: catColor + "15",
              borderColor: catColor + "30",
            },
          ]}
        >
          <IconComponent size={scale(28)} color={catColor} variant="Bold" />
        </View>
        <Text style={[styles.categoryLabel, { color: colors.text }]}>
          {t(item.nameKey)}
        </Text>
      </TouchableOpacity>
    );
  };

  // --- Merchant card (horizontal layout like GoFood) ---
  const renderMerchant = ({ item }: { item: (typeof MERCHANTS)[0] }) => (
    <TouchableOpacity
      style={[
        styles.merchantCard,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
      onPress={() => handleMerchantPress(item.id)}
      activeOpacity={0.8}
    >
      {/* Left: square image */}
      <View style={styles.merchantImageWrap}>
        <Image
          source={{ uri: item.imageUrl }}
          style={styles.merchantImage}
          resizeMode="cover"
        />
        <TouchableOpacity
          style={styles.favButton}
          onPress={(e) => {
            e.stopPropagation();
            toggleStoreFavorite(item.id);
          }}
        >
          <Heart
            size={scale(16)}
            color={
              isFavoriteStore(item.id) ? colors.primary : "rgba(255,255,255,0.8)"
            }
            variant={isFavoriteStore(item.id) ? "Bold" : "Linear"}
          />
        </TouchableOpacity>
      </View>

      {/* Right: details */}
      <View style={styles.merchantBody}>
        <Text
          style={[styles.merchantName, { color: colors.text }]}
          numberOfLines={1}
        >
          {item.name}
        </Text>
        <View style={styles.merchantRatingRow}>
          <Star1 size={scale(14)} color={colors.warning} variant="Bold" />
          <Text style={[styles.merchantRatingText, { color: colors.text }]}>
            {item.rating}
          </Text>
          <Text
            style={[
              styles.merchantRatingCount,
              { color: colors.textSecondary },
            ]}
          >
            ({item.ratingCount})
          </Text>
          <Text style={[styles.merchantDot, { color: colors.textSecondary }]}>
            •
          </Text>
          <Text style={[styles.merchantTime, { color: colors.textSecondary }]}>
            {item.time}
          </Text>
        </View>
        <Text
          style={[styles.merchantDelivery, { color: colors.textSecondary }]}
          numberOfLines={1}
        >
          {item.deliveryFee}
        </Text>
        {item.promoLabel ? (
          <Text
            style={[styles.merchantPromo, { color: colors.primary }]}
            numberOfLines={1}
          >
            {item.promoLabel}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );

  // --- Aktivitas sub-tabs ---
  const aktivitasSubTabs: { key: AktivitasSubTab; labelKey: string }[] = [
    { key: "riwayat", labelKey: "fnb.tabRiwayat" },
    { key: "dalam_proses", labelKey: "fnb.tabDalamProses" },
    { key: "draf", labelKey: "fnb.tabDraf" },
  ];

  const renderAktivitasContent = () => (
    <ScrollView
      style={styles.aktivitasScroll}
      contentContainerStyle={[
        styles.aktivitasScrollContent,
        {
          paddingTop: insets.top + scale(72),
          paddingBottom: insets.bottom + scale(120),
          paddingHorizontal: horizontalPadding,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Sub-tab bar */}
      <View
        style={[
          styles.aktivitasTabBar,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        {aktivitasSubTabs.map(({ key, labelKey }) => (
          <TouchableOpacity
            key={key}
            style={[
              styles.aktivitasTabItem,
              aktivitasSubTab === key && { backgroundColor: colors.primary },
            ]}
            onPress={() => setAktivitasSubTab(key)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.aktivitasTabLabel,
                {
                  color:
                    aktivitasSubTab === key
                      ? colors.surface
                      : colors.textSecondary,
                },
              ]}
            >
              {t(labelKey)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Riwayat */}
      <TouchableOpacity
        style={[
          styles.aktivitasCard,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
        onPress={() => (navigation as any).navigate("FnBOrderHistory")}
        activeOpacity={0.8}
      >
        <ReceiptItem size={scale(24)} color={colors.primary} variant="Bold" />
        <View style={styles.aktivitasCardTextWrap}>
          <Text style={[styles.aktivitasCardTitle, { color: colors.text }]}>
            {t("fnb.orderHistory")}
          </Text>
          <Text
            style={[styles.aktivitasCardSub, { color: colors.textSecondary }]}
          >
            {t("fnb.orderHistorySubtitle")}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Dalam proses */}
      <TouchableOpacity
        style={[
          styles.aktivitasCard,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
        onPress={() =>
          (navigation as any).navigate("FnBOrderHistory", {
            filter: "in_progress",
          })
        }
        activeOpacity={0.8}
      >
        <Clock size={scale(24)} color={colors.primary} variant="Bold" />
        <View style={styles.aktivitasCardTextWrap}>
          <Text style={[styles.aktivitasCardTitle, { color: colors.text }]}>
            {t("fnb.inProgressTitle")}
          </Text>
          <Text
            style={[styles.aktivitasCardSub, { color: colors.textSecondary }]}
          >
            {t("fnb.inProgressSubtitle")}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Draf */}
      <TouchableOpacity
        style={[
          styles.aktivitasCard,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
        onPress={() =>
          (navigation as any).navigate("FnBOrderHistory", { filter: "draft" })
        }
        activeOpacity={0.8}
      >
        <Note size={scale(24)} color={colors.primary} variant="Bold" />
        <View style={styles.aktivitasCardTextWrap}>
          <Text style={[styles.aktivitasCardTitle, { color: colors.text }]}>
            {t("fnb.draftTitle")}
          </Text>
          <Text
            style={[styles.aktivitasCardSub, { color: colors.textSecondary }]}
          >
            {t("fnb.draftSubtitle")}
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.mauLagiButton, { backgroundColor: colors.primary }]}
        onPress={handleMauLagiPress}
        activeOpacity={0.85}
      >
        <Discover size={scale(20)} color={colors.surface} variant="Bold" />
        <Text style={[styles.mauLagiButtonText, { color: colors.surface }]}>
          {t("fnb.mauLagi")}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );

  // --- Favorit content ---
  const renderFavoritContent = () => (
    <ScrollView
      style={styles.aktivitasScroll}
      contentContainerStyle={[
        styles.aktivitasScrollContent,
        {
          paddingTop: insets.top + scale(72),
          paddingBottom: insets.bottom + scale(120),
          paddingHorizontal: horizontalPadding,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Text
        style={[
          styles.sectionTitle,
          { color: colors.text, marginBottom: scale(16) },
        ]}
      >
        {t("fnb.sectionFavorit")}
      </Text>
      <View style={styles.merchantList}>
        {MERCHANTS.map((m) => (
          <View key={m.id} style={styles.merchantCardWrap}>
            {renderMerchant({ item: m })}
          </View>
        ))}
      </View>
    </ScrollView>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {header}

      {activeTab === "jelajahi" && (
        <Animated.ScrollView
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true },
          )}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + scale(120) },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero banner */}
          <View style={[styles.bannerHeroWrap, { paddingTop: 0 }]}>
            <FlatList
              ref={bannerListRef}
              data={BANNERS}
              renderItem={renderBanner}
              keyExtractor={(o) => o.id}
              horizontal
              pagingEnabled={false}
              showsHorizontalScrollIndicator={false}
              snapToInterval={bannerItemWidth}
              snapToAlignment="start"
              decelerationRate="fast"
              onMomentumScrollEnd={(e) => {
                const idx = Math.round(
                  e.nativeEvent.contentOffset.x / bannerItemWidth,
                );
                bannerIndexRef.current = Math.min(idx, BANNERS.length - 1);
              }}
            />
          </View>

          {/* Search bar */}
          <View
            style={[
              styles.searchSection,
              { paddingHorizontal: horizontalPadding },
            ]}
          >
            {searchBarComponent}
          </View>

          {/* Categories horizontal scroll */}
          <View style={styles.categoriesSection}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[
                styles.categoriesScroll,
                { paddingHorizontal: horizontalPadding },
              ]}
            >
              {CATEGORIES.map((item) => (
                <View key={item.id}>{renderCategory({ item })}</View>
              ))}
            </ScrollView>
          </View>

          {/* Recommended merchants */}
          <View
            style={[styles.section, { paddingHorizontal: horizontalPadding }]}
          >
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {t("fnb.sectionPilihanFamiliar")}
              </Text>
              <TouchableOpacity
                onPress={handleSeeAllPress}
                style={[styles.seeAllBtn, { borderColor: colors.primary }]}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={[styles.seeAllText, { color: colors.primary }]}>
                  {t("fnb.seeAll")}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.merchantList}>
              {MERCHANTS.map((m) => (
                <View key={m.id} style={styles.merchantCardWrap}>
                  {renderMerchant({ item: m })}
                </View>
              ))}
            </View>
          </View>

          {/* Other Merchants */}
          <View
            style={[styles.section, { paddingHorizontal: horizontalPadding }]}
          >
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {t("fnb.sectionMerchantLain")}
              </Text>
              <TouchableOpacity
                onPress={handleSeeAllPress}
                style={[styles.seeAllBtn, { borderColor: colors.primary }]}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={[styles.seeAllText, { color: colors.primary }]}>
                  {t("fnb.seeAll")}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.merchantList}>
              {MERCHANTS.map((m) => (
                <View key={`other-${m.id}`} style={styles.merchantCardWrap}>
                  {renderMerchant({ item: m })}
                </View>
              ))}
            </View>
          </View>
          <View style={{ height: scale(24) }} />
        </Animated.ScrollView>
      )}

      {activeTab === "favorit" && renderFavoritContent()}
      {activeTab === "aktivitas" && renderAktivitasContent()}

      {/* Floating Cart Bar */}
      {cartItemCount > 0 && (
        <View
          style={[
            styles.cartBarContainer,
            { bottom: insets.bottom + scale(4) },
          ]}
        >
          <FnBCartBar
            itemCount={cartItemCount}
            total={cartSubtotal}
            onPress={handleCartBarPress}
            onCheckout={handleCartCheckout}
            visible={cartItemCount > 0}
          />
        </View>
      )}

        <View
          style={[
            styles.fnbFloatingWidgetContainer,
            {
              bottom: insets.bottom + scale(cartItemCount > 0 ? 80 : 8),
            },
          ]}
        pointerEvents="box-none"
      >
        <FnBOrderFloatingWidget />
      </View>

      <FnBLocationPickerSheet
        visible={locationSheetVisible}
        onClose={() => setLocationSheetVisible(false)}
        onSelectAddress={(address) => {
          setDeliveryAddress(address);
          setLocationSheetVisible(false);
        }}
        onRequestMapPicker={() => {
          setLocationSheetVisible(false);
          setMapModalVisible(true);
        }}
      />
      <FnBLocationPickerModal
        visible={mapModalVisible}
        onClose={() => setMapModalVisible(false)}
        onSelectAddress={(address) => {
          setDeliveryAddress(address);
          setMapModalVisible(false);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // --- Header ---
  headerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerOverlayBg: {
    ...StyleSheet.absoluteFillObject,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(10),
  },
  headerCircleBtnWrap: {
    position: "relative",
    width: scale(36),
    height: scale(36),
  },
  headerBtnOverlayDark: {
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  headerBtnOverlayLight: {
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  headerCircleBtn: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    justifyContent: "center",
    alignItems: "center",
  },
  locationPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
    paddingHorizontal: scale(14),
    paddingVertical: scale(8),
    borderRadius: scale(20),
  },
  locationPillText: {
    fontFamily: FontFamily.monasans.bold,
    fontSize: scale(13),
  },
  headerRightIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
    marginLeft: "auto",
  },
  // --- Search ---
  searchSection: {
    marginTop: scale(-18),
    marginBottom: scale(8),
  },
  searchWrap: {
    height: scale(48),
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    paddingLeft: scale(14),
    paddingRight: scale(14),
    borderRadius: scale(24),
    gap: scale(8),
  },
  searchInputTouchable: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
  },
  searchPlaceholder: {
    flex: 1,
    fontFamily: FontFamily.monasans.regular,
    fontSize: scale(14),
  },
  // --- Scroll content ---
  scrollContent: {
    paddingTop: 0,
  },
  // --- Banner ---
  bannerHeroWrap: {
    overflow: "hidden",
  },
  bannerCard: {
    height: scale(280),
    overflow: "hidden",
    position: "relative",
  },
  bannerImage: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  bannerGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  bannerContent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: scale(20),
  },
  bannerBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: scale(8),
    paddingVertical: scale(4),
    borderRadius: scale(6),
    marginBottom: scale(8),
  },
  bannerBadgeText: {
    fontFamily: FontFamily.monasans.bold,
    fontSize: scale(11),
    color: "#fff",
  },
  bannerTitle: {
    fontFamily: FontFamily.monasans.bold,
    fontSize: scale(20),
    color: "#fff",
    lineHeight: scale(26),
  },
  bannerSubtitle: {
    fontFamily: FontFamily.monasans.regular,
    fontSize: scale(12),
    color: "rgba(255,255,255,0.85)",
    marginTop: scale(4),
  },
  // --- Categories (horizontal circular) ---
  categoriesSection: {
    marginBottom: scale(20),
  },
  categoriesScroll: {
    gap: scale(16),
    paddingVertical: scale(4),
  },
  categoryItem: {
    alignItems: "center",
    width: scale(72),
  },
  categoryCircle: {
    width: scale(56),
    height: scale(56),
    borderRadius: scale(28),
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    marginBottom: scale(6),
  },
  categoryLabel: {
    fontSize: scale(11),
    fontFamily: FontFamily.monasans.semiBold,
    textAlign: "center",
    lineHeight: scale(14),
  },
  // --- Section ---
  section: {
    marginBottom: moderateVerticalScale(16),
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: scale(16),
  },
  sectionTitle: {
    fontSize: scale(16),
    fontFamily: FontFamily.monasans.bold,
    flex: 1,
  },
  seeAllBtn: {
    paddingHorizontal: scale(14),
    paddingVertical: scale(6),
    borderRadius: scale(20),
    borderWidth: 1.5,
  },
  seeAllText: {
    fontSize: scale(12),
    fontFamily: FontFamily.monasans.bold,
  },
  // --- Merchant cards (horizontal layout) ---
  merchantList: {
    gap: scale(12),
  },
  merchantCardWrap: {
    marginBottom: 0,
  },
  merchantCard: {
    flexDirection: "row",
    borderRadius: BORDER_RADIUS,
    overflow: "hidden",
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
      },
      android: { elevation: 1 },
    }),
  },
  merchantImageWrap: {
    width: scale(100),
    height: scale(100),
    position: "relative",
  },
  merchantImage: {
    width: "100%",
    height: "100%",
  },
  favButton: {
    position: "absolute",
    top: scale(6),
    right: scale(6),
    width: scale(28),
    height: scale(28),
    borderRadius: scale(14),
    backgroundColor: "rgba(0,0,0,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  merchantBody: {
    flex: 1,
    paddingVertical: scale(10),
    paddingHorizontal: scale(12),
    justifyContent: "center",
    gap: scale(2),
  },
  merchantName: {
    fontFamily: FontFamily.monasans.bold,
    fontSize: scale(14),
    marginBottom: scale(2),
  },
  merchantRatingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
  },
  merchantRatingText: {
    fontFamily: FontFamily.monasans.semiBold,
    fontSize: scale(12),
  },
  merchantRatingCount: {
    fontFamily: FontFamily.monasans.regular,
    fontSize: scale(11),
  },
  merchantDot: {
    fontSize: scale(10),
  },
  merchantTime: {
    fontFamily: FontFamily.monasans.regular,
    fontSize: scale(11),
  },
  merchantDelivery: {
    fontFamily: FontFamily.monasans.regular,
    fontSize: scale(12),
    marginTop: scale(2),
  },
  merchantPromo: {
    fontFamily: FontFamily.monasans.semiBold,
    fontSize: scale(12),
    marginTop: scale(2),
  },
  // --- Floating widget ---
  fnbFloatingWidgetContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 99999,
  },
  cartBarContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 9998,
  },
  // --- Aktivitas ---
  aktivitasScroll: { flex: 1 },
  aktivitasScrollContent: { paddingTop: scale(24), gap: scale(12) },
  aktivitasTabBar: {
    flexDirection: "row",
    borderRadius: scale(12),
    borderWidth: 1,
    padding: scale(4),
    gap: scale(4),
  },
  aktivitasTabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: scale(10),
    borderRadius: scale(10),
  },
  aktivitasTabLabel: {
    fontFamily: FontFamily.monasans.semiBold,
    fontSize: scale(13),
  },
  aktivitasTabContent: {
    gap: scale(12),
  },
  aktivitasCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: scale(16),
    borderRadius: BORDER_RADIUS,
    borderWidth: 1,
    gap: scale(12),
  },
  aktivitasCardTextWrap: { flex: 1, minWidth: 0 },
  aktivitasCardTitle: {
    fontFamily: FontFamily.monasans.semiBold,
    fontSize: scale(15),
  },
  aktivitasCardSub: {
    fontFamily: FontFamily.monasans.regular,
    fontSize: scale(12),
    marginTop: scale(2),
  },
  // --- Favorit ---
  favoritEmptyWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: scale(48),
    gap: scale(12),
  },
  favoritEmptyText: {
    fontFamily: FontFamily.monasans.regular,
    fontSize: scale(14),
    textAlign: "center",
  },
  // --- Mau lagi ---
  mauLagiButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: scale(14),
    borderRadius: scale(12),
    gap: scale(8),
    marginTop: scale(8),
  },
  mauLagiButtonText: {
    fontFamily: FontFamily.monasans.bold,
    fontSize: scale(15),
  },
  // --- QR tab ---
  qrTabWrap: { flex: 1, justifyContent: "center", paddingVertical: scale(48) },
  qrCtaCard: {
    alignItems: "center",
    padding: scale(32),
    borderRadius: BORDER_RADIUS_LG,
    gap: scale(12),
  },
  qrCtaTitle: {
    fontFamily: FontFamily.monasans.bold,
    fontSize: scale(18),
  },
  qrCtaSub: {
    fontFamily: FontFamily.monasans.regular,
    fontSize: scale(14),
    textAlign: "center",
  },
  // --- Bottom Nav ---
  bottomNavWrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    zIndex: 9999,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
    }),
  },
  bottomNavFloating: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-evenly",
    paddingVertical: scale(10),
    paddingHorizontal: scale(4),
  },
  bottomNavItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: scale(10),
    paddingHorizontal: scale(8),
    borderRadius: scale(20),
    gap: scale(4),
  },
  bottomNavLabel: {
    fontFamily: FontFamily.monasans.medium,
    fontSize: scale(12),
    marginTop: scale(4),
  },
});

export default FnBScreen;
