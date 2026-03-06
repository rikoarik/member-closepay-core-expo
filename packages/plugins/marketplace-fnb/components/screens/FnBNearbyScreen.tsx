/**
 * FnBNearbyScreen – Daftar resto terdekat (urut jarak).
 */

import React, { useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { ArrowLeft2, Star1 } from "iconsax-react-nativejs";
import {
  scale,
  moderateVerticalScale,
  getHorizontalPadding,
  FontFamily,
} from "@core/config";
import { useTheme } from "@core/theme";
import { useTranslation } from "@core/i18n";
import {
  FNBDISCOVERY_MERCHANTS,
  type DiscoveryMerchant,
} from "../../data/fnbDiscoveryMerchants";

function parseDistanceKm(d: string): number {
  const m = d.match(/([\d.]+)\s*km/i);
  return m ? parseFloat(m[1]) : 999;
}

export const FnBNearbyScreen: React.FC = () => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const horizontalPadding = getHorizontalPadding();

  const merchants = useMemo(
    () =>
      [...FNBDISCOVERY_MERCHANTS].sort(
        (a, b) => parseDistanceKm(a.distance) - parseDistanceKm(b.distance)
      ),
    []
  );

  const [refreshing, setRefreshing] = React.useState(false);
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleMerchantPress = useCallback(
    (merchant: DiscoveryMerchant) => {
      (navigation as { navigate: (name: string, params: { storeId: string }) => void }).navigate(
        "FnBMerchantDetail",
        { storeId: merchant.id.replace(/-dup$/, "") }
      );
    },
    [navigation]
  );

  const renderItem = useCallback(
    ({ item }: { item: DiscoveryMerchant }) => (
      <TouchableOpacity
        style={[
          styles.merchantCard,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
        onPress={() => handleMerchantPress(item)}
        activeOpacity={0.8}
      >
        <Image
          source={{ uri: item.imageUrl }}
          style={styles.merchantImage}
          resizeMode="cover"
        />
        <View style={styles.merchantBody}>
          <Text
            style={[styles.merchantName, { color: colors.text }]}
            numberOfLines={1}
          >
            {item.name}
          </Text>
          <Text
            style={[styles.merchantDesc, { color: colors.textSecondary }]}
            numberOfLines={1}
          >
            {item.description}
          </Text>
          <View style={styles.ratingRow}>
            <Star1 size={scale(14)} color={colors.warning} variant="Bold" />
            <Text style={[styles.merchantRating, { color: colors.text }]}>
              {item.rating}
            </Text>
            <Text
              style={[styles.merchantMeta, { color: colors.textSecondary }]}
            >
              {item.distance} · {item.time}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    ),
    [colors, handleMerchantPress]
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
          {t("fnb.nearbyPageTitle")}
        </Text>
      </View>

      {merchants.length > 0 && (
        <View style={[styles.countRow, { paddingHorizontal: horizontalPadding }]}>
          <Text style={[styles.countText, { color: colors.textSecondary }]}>
            {t("fnb.foundMerchants")} {merchants.length} {t("fnb.merchants")}
          </Text>
        </View>
      )}

      <FlatList
        data={merchants}
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
    alignItems: "center",
    padding: scale(12),
    borderRadius: scale(12),
    borderWidth: 1,
    marginBottom: scale(12),
  },
  merchantImage: {
    width: scale(64),
    height: scale(64),
    borderRadius: scale(8),
  },
  merchantBody: {
    flex: 1,
    marginLeft: scale(12),
  },
  merchantName: {
    fontFamily: FontFamily.monasans.semiBold,
    fontSize: scale(15),
  },
  merchantDesc: {
    fontFamily: FontFamily.monasans.regular,
    fontSize: scale(13),
    marginTop: scale(2),
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: scale(4),
    gap: scale(4),
  },
  merchantRating: {
    fontFamily: FontFamily.monasans.semiBold,
    fontSize: scale(13),
  },
  merchantMeta: {
    fontFamily: FontFamily.monasans.regular,
    fontSize: scale(12),
    marginLeft: scale(8),
  },
});

export default FnBNearbyScreen;
