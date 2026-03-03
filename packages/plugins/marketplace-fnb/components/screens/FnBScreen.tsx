/**
 * FnBScreen Component
 * FnB Home Discovery – layout matches reference (Delivering to, Search+Scan, Banners, Categories, Recommended Merchants).
 * Flow: FnBMerchantDetail, FnBScan, FnBFavorites; FnBOrderFloatingWidget at bottom.
 */

import React, { useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  FlatList,
  TextInput,
  Dimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  SearchNormal,
  ArrowDown2,
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
} from 'iconsax-react-nativejs';
import {
  scale,
  moderateVerticalScale,
  getHorizontalPadding,
  FontFamily,
} from '@core/config';
import { useTheme } from '@core/theme';
import { useTranslation } from '@core/i18n';
import type { EntryPoint } from '../../models';
import { useFnBStoreFavorites } from '../../hooks';
import { FnBOrderFloatingWidget } from '../widgets/FnBOrderFloatingWidget';

interface FnBScreenProps {
  entryPoint?: EntryPoint;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// --- Data (match reference copy & structure) ---

const BANNERS = [
  {
    id: '1',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBWyem3VPeIeVGlwdhRc47bzmSwB9pKrdWT7a0Rc1AP4VzSRhtMC2E-TjmfyCsWj7V1udDJ3gdmZVzy9lFWwd-ImUFUqlhQIM6lmhbAVU-aSjETyAeOsaSZOVrdyENacXoOgDeff2kiVFLQ0tsKo6Fr3w_9Gh9-Qe4Cy5jVkgfeiLkblLoAMq2HW6QLLwBgqQ4GJtaXVc1F3vARUearq6k7jQsosh8voVpOJS9tLYrmLo3KGeUBIGCD0fISkJawRfO7A-JkWd9Zq0d3',
    badge: 'PROMO',
    badgeBg: 'primary',
    title: '50% OFF\nSelected Items',
    subtitle: 'Valid until 25 Oct',
  },
  {
    id: '2',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCHfyBwgQ8ElUtgZsMyKMenLipEecXBlPorwQrZI7N7VfOno-H56q33nAkrO6EyyhSWlj142RYUvIDVUIs1LSvlSDX9pAKgBqkA-xQZRDz8SxweVglQmqzb2Z4Z1y1rF2fL0jM2t7ZqqP-ElMV5eWJ4u0R0ZZDRtjpF1y975rhxaDfAid_jJYHpIwyrXtKL0-PZoMCFg2Ls9advSszDtI24scMVO7eZLh5OFIima-PP2S6gxrwIDqxpERF67oldhdlC2MDHbvBtqgrR',
    badge: 'NEW',
    badgeBg: 'orange',
    title: 'Healthy Bowls\nFree Delivery',
    subtitle: 'Min order $15',
  },
];

const CATEGORIES = [
  { id: '1', name: 'Rice', Icon: Shop },
  { id: '2', name: 'Noodles', Icon: Discover },
  { id: '3', name: 'Drinks', Icon: Coffee },
  { id: '4', name: 'Snacks', Icon: Cake },
];

const MERCHANTS = [
  {
    id: 'store-001',
    name: 'Burger King & Queen',
    time: '25-35 min',
    description: 'American • Burgers • Fast Food',
    rating: 4.8,
    distance: '1.2 km',
    promoLabel: 'Free Delivery',
    promoHighlight: '20% off over $30',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCvkxFChGMIqGhKSSuFDoQgJ2kTNdu_eGm55B4msAG62ce9SCHkmheTU1GEoy6teblqJHTFPz-h8uCtcc6n06L16xhqpVhDfBp16uyghpTCZALvhThQ9ekCqJuPAf4PJZc7YZzjaYf7o_H5SCCdEbR0bKxvTGi9uJa8PnoF5UuEEp7j_joFAyxKhZ5Mwd_cAwxSzlyBsitipgJwkOm6FFjB5xiZKIRhRc9M7pLTX0mIOdaiL-9vUalNb_jPIOw2mfRq02PvKiul0gl7',
  },
  {
    id: 'store-002',
    name: 'Golden Dragon Dimsum',
    time: '40-50 min',
    description: 'Chinese • Dimsum • Noodles',
    rating: 4.5,
    distance: '3.5 km',
    promoLabel: null,
    promoHighlight: null,
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAJaihUMJ4cZeYMR-9IWZL8AM_zRIJLjvp2s62UvSXG9QUFQCbm9eObPadR_-hGnDFmc9PVw8Vc4zxvPuQmw7LxZIfGe73vXYhvd_X5C4JT6HByLMFdwe6xb989DiSIWxeP8EIzO6FhdtMVF626GKoWZzIB7HuTog9e1Bz9KgcuLWfJVYaE5eJair6WyAdiafC_MLARKzuPLYfXZJfgz9c49TDdgptro0tRCKBihg_30LdQapMyViPRu9uoq1AM3OJQSBgb6paCHuiP',
  },
  {
    id: 'store-003',
    name: 'Daily Dose Coffee',
    time: '15-25 min',
    description: 'Cafe • Beverages • Pastry',
    rating: 4.9,
    distance: '0.8 km',
    promoLabel: 'Buy 1 Get 1',
    promoHighlight: 'Promo Available',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCYcqwHU48mVBh7AMArNvi92S8ilr-WnvpkB7erlrK1UtCvU-L-1QABzNc6FYK65BFE8BiFNq6_gNHNZ-aVi_-zTIk25zygmQPHPCKl5PkuR53lXJPjkfVRJXxOdK26CqUMeINaTi9_hbseDh_G_Y5DE4gCUJpz47X42IRxVn4nK0rpFU4dAJ7FO0cmV9-TgoK3lXZNzgBkjnTOR5rsWF3nuL1b2TYN3M3-a03iCDMWDqEinmID7tqjQs0YdWky4CK0csnq4qOHc-ad',
  },
];

const BORDER_RADIUS = scale(16);
const BORDER_RADIUS_LG = scale(20);
const BANNER_CARD_WIDTH = SCREEN_WIDTH * 0.85;

export const FnBScreen: React.FC<FnBScreenProps> = ({ entryPoint = 'browse' }) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const horizontalPadding = getHorizontalPadding();
  const [searchQuery, setSearchQuery] = useState('');

  const handleMerchantPress = useCallback(
    (storeId: string) => {
      const cleanId = storeId.replace(/-dup$/, '');
      (navigation as any).navigate('FnBMerchantDetail', { entryPoint, storeId: cleanId });
    },
    [navigation, entryPoint]
  );

  const handleScanPress = useCallback(() => {
    (navigation as any).navigate('FnBScan');
  }, [navigation]);

  const handleFavoritesPress = useCallback(() => {
    (navigation as any).navigate('FnBFavorites');
  }, [navigation]);

  const { isFavoriteStore, toggleStoreFavorite } = useFnBStoreFavorites();

  const handleSeeAllPress = useCallback(() => {
    (navigation as any).navigate('FnBFavorites');
  }, [navigation]);

  const handleRiwayatOrderPress = useCallback(() => {
    (navigation as any).navigate('FnBOrderHistory');
  }, [navigation]);

  // --- Header ---
  const header = (
    <View
      style={[
        styles.header,
        {
          backgroundColor: colors.surface,
          paddingTop: insets.top + moderateVerticalScale(8),
          paddingBottom: moderateVerticalScale(12),
          paddingHorizontal: horizontalPadding,
        },
      ]}
    >
      {/* Row 1: Delivering to + Address + Notification */}
      <View style={styles.addressRow}>
        <View style={styles.addressCol}>
          <Text
            style={[styles.deliveringTo, { color: colors.textSecondary }]}
            numberOfLines={1}
          >
            {t('fnb.deliveringTo') || 'Delivering to'}
          </Text>
          <View style={styles.addressValueRow}>
            <Text
              style={[styles.addressValue, { color: colors.text }]}
              numberOfLines={1}
            >
              Home • 123 Main St, Apt 4B
            </Text>
            <ArrowDown2 size={scale(20)} color={colors.primary} variant="Linear" />
          </View>
        </View>
        <TouchableOpacity
          style={[styles.riwayatOrderButton, { backgroundColor: colors.primary + '1A' }]}
          onPress={handleRiwayatOrderPress}
          activeOpacity={0.7}
        >
          <ReceiptItem size={scale(18)} color={colors.primary} variant="Bold" />
          <Text style={[styles.riwayatOrderText, { color: colors.primary }]} numberOfLines={1}>
            {t('fnb.riwayatOrder') || 'Riwayat Order'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Row 2: Search + Scan */}
      <View style={styles.searchScanRow}>
        <View style={[styles.searchWrap, { backgroundColor: colors.background }]}>
          <SearchNormal size={scale(20)} color={colors.textSecondary} variant="Linear" />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder={t('fnb.searchCraving') || 'What are you craving?'}
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity
          style={[styles.scanButtonHeader, { backgroundColor: colors.primary }]}
          onPress={handleScanPress}
          activeOpacity={0.85}
        >
          <ScanBarcode size={scale(22)} color="#fff" variant="Bold" />
          <Text style={styles.scanButtonText}>Scan</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // --- Banner card ---
  const renderBanner = ({ item }: { item: (typeof BANNERS)[0] }) => (
    <TouchableOpacity
      style={[styles.bannerCard, { width: BANNER_CARD_WIDTH }]}
      activeOpacity={0.95}
    >
      <Image source={{ uri: item.imageUrl }} style={styles.bannerImage} resizeMode="cover" />
      <View style={styles.bannerGradient} />
      <View style={styles.bannerContent}>
        <View
          style={[
            styles.bannerBadge,
            {
              backgroundColor:
                item.badgeBg === 'orange' ? '#f97316' : colors.primary,
            },
          ]}
        >
          <Text style={styles.bannerBadgeText}>{item.badge}</Text>
        </View>
        <Text style={styles.bannerTitle}>{item.title}</Text>
        <Text style={styles.bannerSubtitle}>{item.subtitle}</Text>
      </View>
    </TouchableOpacity>
  );

  const categoryColors = [colors.primary, '#fb923c', '#60a5fa', '#f472b6'];

  const renderCategory = ({ item, index }: { item: (typeof CATEGORIES)[0]; index: number }) => {
    const IconComponent = item.Icon;
    return (
      <TouchableOpacity style={styles.categoryItem} activeOpacity={0.7}>
        <View
          style={[
            styles.categoryIconBox,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border || 'rgba(0,0,0,0.06)',
            },
          ]}
        >
          <IconComponent
            size={scale(28)}
            color={categoryColors[index % categoryColors.length]}
            variant="Bold"
          />
        </View>
        <Text style={[styles.categoryLabel, { color: colors.text }]}>{item.name}</Text>
      </TouchableOpacity>
    );
  };

  // --- Merchant card (Recommended) ---
  const renderMerchant = ({ item }: { item: (typeof MERCHANTS)[0] }) => (
    <TouchableOpacity
      style={[
        styles.merchantCard,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border || 'rgba(0,0,0,0.06)',
        },
      ]}
      onPress={() => handleMerchantPress(item.id)}
      activeOpacity={0.8}
    >
      <View style={styles.merchantImageWrap}>
        <Image source={{ uri: item.imageUrl }} style={styles.merchantImage} resizeMode="cover" />
        <View style={[styles.ratingBadge, { backgroundColor: 'rgba(255,255,255,0.9)' }]}>
          <Star1 size={scale(14)} color="#eab308" variant="Bold" />
          <Text style={[styles.ratingBadgeText, { color: colors.text }]}>{item.rating}</Text>
        </View>
        {item.promoLabel ? (
          <View style={[styles.promoBadgeTop, { backgroundColor: colors.primary }]}>
            <Text style={styles.promoBadgeTopText}>{item.promoLabel}</Text>
          </View>
        ) : null}
        <TouchableOpacity
          style={styles.favButton}
          onPress={(e) => {
            e.stopPropagation();
            toggleStoreFavorite(item.id);
          }}
        >
          <Heart
            size={scale(22)}
            color={isFavoriteStore(item.id) ? '#ef4444' : '#fff'}
            variant={isFavoriteStore(item.id) ? 'Bold' : 'Linear'}
          />
        </TouchableOpacity>
      </View>
      <View style={styles.merchantBody}>
        <View style={styles.merchantTitleRow}>
          <Text style={[styles.merchantName, { color: colors.text }]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={[styles.merchantTime, { color: colors.textSecondary }]}>
            {item.time}
          </Text>
        </View>
        <Text
          style={[styles.merchantDescription, { color: colors.textSecondary }]}
          numberOfLines={1}
        >
          {item.description}
        </Text>
        <View style={styles.merchantMetaRow}>
          <View style={styles.metaItem}>
            <Location size={scale(14)} color={colors.textSecondary} variant="Linear" />
            <Text style={[styles.metaText, { color: colors.textSecondary }]}>
              {item.distance}
            </Text>
          </View>
          {item.promoHighlight ? (
            <View style={styles.metaItem}>
              <DiscountShape size={scale(14)} color={colors.primary} variant="Bold" />
              <Text style={[styles.metaText, { color: colors.primary }]} numberOfLines={1}>
                {item.promoHighlight}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {header}

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + scale(100) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Promo Banners Carousel */}
        <View style={styles.bannerSection}>
          <FlatList
            data={BANNERS}
            renderItem={renderBanner}
            keyExtractor={(o) => o.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[styles.bannerListContent, { paddingLeft: horizontalPadding }]}
            ItemSeparatorComponent={() => <View style={{ width: scale(16) }} />}
            snapToInterval={BANNER_CARD_WIDTH + scale(16)}
            decelerationRate="fast"
          />
        </View>

        {/* Categories Grid */}
        <View style={[styles.categoriesSection, { paddingHorizontal: horizontalPadding }]}>
          <View style={styles.categoriesGrid}>
            {CATEGORIES.map((item, index) => (
              <View key={item.id} style={styles.categoryItemWrapper}>
                {renderCategory({ item, index })}
              </View>
            ))}
          </View>
        </View>

        {/* Recommended Merchants */}
        <View style={[styles.section, { paddingHorizontal: horizontalPadding }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t('fnb.recommendedMerchants') || 'Recommended Merchants'}
            </Text>
            <TouchableOpacity onPress={handleSeeAllPress} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>
                {t('common.seeAll') || 'See All'}
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

        <View style={{ height: scale(24) }} />
      </ScrollView>

      <View style={styles.fnbFloatingWidgetContainer} pointerEvents="box-none">
        <FnBOrderFloatingWidget />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    borderBottomLeftRadius: BORDER_RADIUS_LG,
    borderBottomRightRadius: BORDER_RADIUS_LG,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 10,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: scale(12),
    marginBottom: scale(12),
  },
  addressCol: {
    flex: 1,
    minWidth: 0,
  },
  deliveringTo: {
    fontSize: scale(11),
    fontFamily: FontFamily.monasans.medium,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: scale(2),
  },
  addressValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(4),
  },
  addressValue: {
    fontSize: scale(15),
    fontFamily: FontFamily.monasans.bold,
    flex: 1,
  },
  notifButton: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    alignItems: 'center',
    justifyContent: 'center',
  },
  riwayatOrderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
    paddingHorizontal: scale(10),
    paddingVertical: scale(8),
    borderRadius: scale(20),
  },
  riwayatOrderText: {
    fontSize: scale(12),
    fontFamily: FontFamily.monasans.semiBold,
    maxWidth: scale(90),
  },
  searchScanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(12),
  },
  searchWrap: {
    flex: 1,
    height: scale(48),
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: scale(12),
    paddingRight: scale(12),
    borderRadius: scale(12),
  },
  searchInput: {
    flex: 1,
    fontFamily: FontFamily.monasans.regular,
    fontSize: scale(14),
    marginLeft: scale(8),
    paddingVertical: 0,
  },
  scanButtonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: scale(48),
    paddingHorizontal: scale(16),
    borderRadius: scale(12),
    gap: scale(8),
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
      },
      android: { elevation: 4 },
    }),
  },
  scanButtonText: {
    fontFamily: FontFamily.monasans.bold,
    fontSize: scale(14),
    color: '#fff',
  },
  scrollContent: {
    paddingTop: moderateVerticalScale(16),
  },
  bannerSection: {
    marginBottom: moderateVerticalScale(24),
  },
  bannerListContent: {
    paddingRight: getHorizontalPadding(),
  },
  bannerCard: {
    height: scale(160),
    borderRadius: BORDER_RADIUS,
    overflow: 'hidden',
    position: 'relative',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6 },
      android: { elevation: 3 },
    }),
  },
  bannerImage: {
    ...StyleSheet.absoluteFillObject,
  },
  bannerGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  bannerContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: scale(20),
  },
  bannerBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: scale(8),
    paddingVertical: scale(4),
    borderRadius: scale(6),
    marginBottom: scale(8),
  },
  bannerBadgeText: {
    fontFamily: FontFamily.monasans.bold,
    fontSize: scale(11),
    color: '#102220',
  },
  bannerTitle: {
    fontFamily: FontFamily.monasans.bold,
    fontSize: scale(20),
    color: '#fff',
    lineHeight: scale(26),
  },
  bannerSubtitle: {
    fontFamily: FontFamily.monasans.regular,
    fontSize: scale(12),
    color: 'rgba(255,255,255,0.8)',
    marginTop: scale(4),
  },
  categoriesSection: {
    marginBottom: moderateVerticalScale(24),
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryItemWrapper: {
    width: '24%',
    marginBottom: scale(12),
  },
  categoryItem: {
    alignItems: 'center',
    gap: scale(8),
  },
  categoryIconBox: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: BORDER_RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  categoryLabel: {
    fontSize: scale(12),
    fontFamily: FontFamily.monasans.medium,
    textAlign: 'center',
  },
  section: {
    marginBottom: moderateVerticalScale(16),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: scale(16),
  },
  sectionTitle: {
    fontSize: scale(18),
    fontFamily: FontFamily.monasans.bold,
  },
  seeAll: {
    fontSize: scale(14),
    fontFamily: FontFamily.monasans.semiBold,
  },
  merchantList: {
    gap: scale(16),
  },
  merchantCardWrap: {
    marginBottom: 0,
  },
  merchantCard: {
    borderRadius: BORDER_RADIUS,
    overflow: 'hidden',
    borderWidth: 1,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 },
      android: { elevation: 2 },
    }),
  },
  merchantImageWrap: {
    height: scale(144),
    width: '100%',
    position: 'relative',
  },
  merchantImage: {
    width: '100%',
    height: '100%',
  },
  ratingBadge: {
    position: 'absolute',
    top: scale(12),
    left: scale(12),
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(4),
    paddingHorizontal: scale(8),
    paddingVertical: scale(4),
    borderRadius: scale(8),
  },
  ratingBadgeText: {
    fontFamily: FontFamily.monasans.bold,
    fontSize: scale(12),
  },
  promoBadgeTop: {
    position: 'absolute',
    top: scale(12),
    right: scale(12),
    paddingHorizontal: scale(8),
    paddingVertical: scale(4),
    borderRadius: scale(8),
  },
  promoBadgeTopText: {
    fontFamily: FontFamily.monasans.bold,
    fontSize: scale(11),
    color: '#102220',
  },
  favButton: {
    position: 'absolute',
    bottom: scale(12),
    right: scale(12),
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  merchantBody: {
    padding: scale(16),
  },
  merchantTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  merchantName: {
    fontFamily: FontFamily.monasans.bold,
    fontSize: scale(16),
    flex: 1,
    marginRight: scale(8),
  },
  merchantTime: {
    fontFamily: FontFamily.monasans.medium,
    fontSize: scale(12),
  },
  merchantDescription: {
    fontFamily: FontFamily.monasans.regular,
    fontSize: scale(14),
    marginTop: scale(4),
  },
  merchantMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(12),
    marginTop: scale(8),
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(4),
  },
  metaText: {
    fontFamily: FontFamily.monasans.medium,
    fontSize: scale(12),
  },
  fnbFloatingWidgetContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 99999,
  },
});

export default FnBScreen;
