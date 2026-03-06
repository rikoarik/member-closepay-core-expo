/**
 * FnBAllMerchantsScreen – Halaman "Lihat Semua" merchant (Pilihan Familiar / Merchant Lain).
 */

import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Image,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { ArrowLeft2, Star1, Heart } from "iconsax-react-nativejs";
import {
  scale,
  moderateVerticalScale,
  getHorizontalPadding,
  FontFamily,
} from "@core/config";
import { useTheme } from "@core/theme";
import { useTranslation } from "@core/i18n";
import type { EntryPoint } from "../../models";
import { useFnBStoreFavorites } from "../../hooks";
import { FNBDISCOVERY_MERCHANTS, type DiscoveryMerchant } from "../../data/fnbDiscoveryMerchants";

type NavParams = { sectionKey?: "pilihan" | "lain"; entryPoint?: EntryPoint };

const BORDER_RADIUS = scale(16);

export const FnBAllMerchantsScreen: React.FC = () => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const horizontalPadding = getHorizontalPadding();
  const params = route.params as NavParams | undefined;
  const { sectionKey, entryPoint = "browse" } = params ?? {};
  const { isFavoriteStore, toggleStoreFavorite } = useFnBStoreFavorites();

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const titleKey =
    sectionKey === "pilihan"
      ? "fnb.sectionPilihanFamiliar"
      : sectionKey === "lain"
        ? "fnb.sectionMerchantLain"
        : "fnb.seeAllPageTitle";

  const handleBack = useCallback(() => navigation.goBack(), [navigation]);

  const handleMerchantPress = useCallback(
    (storeId: string) => {
      (navigation as any).navigate("FnBMerchantDetail", {
        entryPoint,
        storeId: storeId.replace(/-dup$/, ""),
      });
    },
    [navigation, entryPoint]
  );

  const renderItem = useCallback(
    ({ item }: { item: DiscoveryMerchant }) => (
      <TouchableOpacity
        style={[
          styles.merchantCard,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
        onPress={() => handleMerchantPress(item.id)}
        activeOpacity={0.8}
      >
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
              style={[styles.merchantRatingCount, { color: colors.textSecondary }]}
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
    ),
    [colors, handleMerchantPress, isFavoriteStore, toggleStoreFavorite]
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + moderateVerticalScale(8),
            paddingHorizontal: horizontalPadding,
            backgroundColor: colors.surface,
          },
        ]}
      >
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft2 size={scale(24)} color={colors.text} variant="Linear" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {t(titleKey)}
        </Text>
      </View>

      <View style={[styles.countRow, { paddingHorizontal: horizontalPadding }]}>
        <Text style={[styles.countText, { color: colors.textSecondary }]}>
          {t("fnb.foundMerchants")} {FNBDISCOVERY_MERCHANTS.length}{" "}
          {t("fnb.merchants")}
        </Text>
      </View>

      <FlatList
        data={FNBDISCOVERY_MERCHANTS}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + moderateVerticalScale(24) },
        ]}
        style={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(12),
    paddingBottom: moderateVerticalScale(12),
  },
  backButton: {
    padding: scale(4),
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    flex: 1,
    fontSize: scale(18),
    fontFamily: FontFamily.monasans.semiBold,
  },
  countRow: {
    paddingVertical: moderateVerticalScale(8),
  },
  countText: {
    fontSize: scale(13),
    fontFamily: FontFamily.monasans.regular,
  },
  list: { flex: 1 },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: getHorizontalPadding(),
    paddingTop: scale(8),
  },
  merchantCard: {
    flexDirection: "row",
    borderRadius: BORDER_RADIUS,
    overflow: "hidden",
    borderWidth: 1,
    marginBottom: scale(12),
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
  merchantDot: { fontSize: scale(10) },
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
});

export default FnBAllMerchantsScreen;
