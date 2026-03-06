/**
 * FnBTab Component
 * Main FnB marketplace screen in HomeScreen
 * Shows store grid with search/filter header and QR scan
 */

import React, { useCallback, useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  ScrollView,
  Text,
  TouchableOpacity,
  TextInput,
  Animated,
  RefreshControl,
  Image,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  Shop,
  Star1,
  Location,
  Clock,
  SearchNormal,
  CloseCircle,
  ScanBarcode,
} from 'iconsax-react-nativejs';
import { useFnBLocation } from '../../context/FnBLocationContext';
import { FnBLocationPickerSheet } from '../shared/FnBLocationPickerSheet';
import {
  scale,
  moderateVerticalScale,
  getHorizontalPadding,
  FontFamily,
  useDimensions,
} from '@core/config';
import { useTheme } from '@core/theme';
import { useTranslation } from '@core/i18n';
import {
  FNBDUMMY_STORE_LIST_TAB,
  FNBDUMMY_STORE_ITEMS,
  DEFAULT_STORE_ID,
  type FnBStoreListItem,
} from '../../data/fnbDummyData';
import type { FnBItem } from '../../models/FnBItem';

interface FnBTabProps {
  isActive: boolean;
  isVisible: boolean;
  scrollEnabled?: boolean;
}

// Filter options
type StoreFilter = 'all' | 'food' | 'drink' | 'open' | 'rating';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
type BadgeBgKey = 'primary' | 'warning';
const BANNERS = [
  {
    id: '1',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBWyem3VPeIeVGlwdhRc47bzmSwB9pKrdWT7a0Rc1AP4VzSRhtMC2E-TjmfyCsWj7V1udDJ3gdmZVzy9lFWwd-ImUFUqlhQIM6lmhbAVU-aSjETyAeOsaSZOVrdyENacXoOgDeff2kiVFLQ0tsKo6Fr3w_9Gh9-Qe4Cy5jVkgfeiLkblLoAMq2HW6QLLwBgqQ4GJtaXVc1F3vARUearq6k7jQsosh8voVpOJS9tLYrmLo3KGeUBIGCD0fISkJawRfO7A-JkWd9Zq0d3',
    badgeKey: 'fnb.badgePromo' as const,
    badgeBg: 'primary' as BadgeBgKey,
    titleKey: 'fnb.banner1Title' as const,
    subtitleKey: 'fnb.banner1Subtitle' as const,
  },
  {
    id: '2',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCHfyBwgQ8ElUtgZsMyKMenLipEecXBlPorwQrZI7N7VfOno-H56q33nAkrO6EyyhSWlj142RYUvIDVUIs1LSvlSDX9pAKgBqkA-xQZRDz8SxweVglQmqzb2Z4Z1y1rF2fL0jM2t7ZqqP-ElMV5eWJ4u0R0ZZDRtjpF1y975rhxaDfAid_jJYHpIwyrXtKL0-PZoMCFg2Ls9advSszDtI24scMVO7eZLh5OFIima-PP2S6gxrwIDqxpERF67oldhdlC2MDHbvBtqgrR',
    badgeKey: 'fnb.badgeNew' as const,
    badgeBg: 'warning' as BadgeBgKey,
    titleKey: 'fnb.banner2Title' as const,
    subtitleKey: 'fnb.banner2Subtitle' as const,
  },
  {
    id: '3',
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&h=400&fit=crop',
    badgeKey: 'fnb.badgeBestSeller' as const,
    badgeBg: 'primary' as BadgeBgKey,
    titleKey: 'fnb.banner3Title' as const,
    subtitleKey: 'fnb.banner3Subtitle' as const,
  },
];
const BANNER_PADDING_H = scale(16);
const BANNER_CARD_WIDTH = SCREEN_WIDTH - BANNER_PADDING_H * 2;
const BANNER_HEIGHT = scale(160);
const BANNER_BORDER_RADIUS = scale(16);

// Skeleton Loading Component with Shimmer Animation
const StoreCardSkeleton: React.FC = () => {
  const { colors } = useTheme();
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmerAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    shimmerAnimation.start();

    return () => shimmerAnimation.stop();
  }, [shimmerAnim]);

  const shimmerOpacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.storeCard,
        {
          backgroundColor: colors.surface,
          opacity: shimmerOpacity,
          marginBottom: scale(8),
        },
      ]}
    >
      {/* Store Icon Skeleton */}
      <View style={[styles.storeIconContainer, { backgroundColor: colors.border }]}>
        <Animated.View
          style={[
            styles.skeletonIcon,
            { backgroundColor: colors.primaryLight, opacity: shimmerOpacity },
          ]}
        />
      </View>

      {/* Store Info Skeleton */}
      <View style={[styles.storeInfo, styles.listStoreInfo]}>
        {/* Header Row: Name + Badge */}
        <View style={styles.storeHeader}>
          <Animated.View
            style={[
              {
                height: scale(16),
                width: '60%',
                backgroundColor: colors.border,
                borderRadius: scale(4),
                opacity: shimmerOpacity,
              },
            ]}
          />
          <Animated.View
            style={[
              {
                height: scale(18),
                width: scale(40),
                backgroundColor: colors.border,
                borderRadius: scale(4),
                opacity: shimmerOpacity,
              },
            ]}
          />
        </View>

        {/* Description */}
        <Animated.View
          style={[
            {
              height: scale(12),
              width: '80%',
              backgroundColor: colors.border,
              borderRadius: scale(4),
              marginTop: scale(6),
              opacity: shimmerOpacity,
            },
          ]}
        />

        {/* Meta Row */}
        <View style={[styles.storeMetaRow, { marginTop: scale(8) }]}>
          <Animated.View
            style={[
              {
                height: scale(12),
                width: scale(35),
                backgroundColor: colors.border,
                borderRadius: scale(4),
                marginRight: scale(12),
                opacity: shimmerOpacity,
              },
            ]}
          />
          <Animated.View
            style={[
              {
                height: scale(12),
                width: scale(45),
                backgroundColor: colors.border,
                borderRadius: scale(4),
                marginRight: scale(12),
                opacity: shimmerOpacity,
              },
            ]}
          />
          <Animated.View
            style={[
              {
                height: scale(12),
                width: scale(70),
                backgroundColor: colors.border,
                borderRadius: scale(4),
                opacity: shimmerOpacity,
              },
            ]}
          />
        </View>
      </View>
    </Animated.View>
  );
};

export const FnBTab: React.FC<FnBTabProps> = ({ isActive, isVisible, scrollEnabled = true }) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { width: screenWidth } = useDimensions();
  const horizontalPadding = getHorizontalPadding();
  const insets = useSafeAreaInsets();

  // Cache untuk mencegah refetch saat tab switch
  const dataCache = useRef<{ stores: FnBStoreListItem[]; timestamp: number } | null>(null);
  const bannerListRef = useRef<FlatList>(null);
  const bannerIndexRef = useRef(0);
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  const BANNER_AUTO_SCROLL_INTERVAL = 4000;

  // Local state
  const [stores, setStores] = useState<FnBStoreListItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<StoreFilter>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [locationSheetVisible, setLocationSheetVisible] = useState(false);

  const { deliveryAddress, setDeliveryAddress } = useFnBLocation();

  useEffect(() => {
    if (!isVisible || BANNERS.length <= 1) return;
    const itemWidth = BANNER_CARD_WIDTH + scale(12);
    const timer = setInterval(() => {
      const next = (bannerIndexRef.current + 1) % BANNERS.length;
      bannerIndexRef.current = next;
      bannerListRef.current?.scrollToOffset({
        offset: next * itemWidth,
        animated: true,
      });
    }, BANNER_AUTO_SCROLL_INTERVAL);
    return () => clearInterval(timer);
  }, [isVisible]);

  const loadStores = useCallback(
    async (forceRefresh = false) => {
      // Check cache first (unless force refresh)
      if (!forceRefresh && dataCache.current) {
        const now = Date.now();
        const isCacheValid = now - dataCache.current.timestamp < CACHE_DURATION;

        if (isCacheValid && dataCache.current.stores.length > 0) {
          setStores(dataCache.current.stores);
          setIsInitialLoad(false);
          setLoadError(null);
          return;
        }
      }

      // Don't reload if already have data and not forcing refresh
      if (!forceRefresh && stores.length > 0) return;

      setIsInitialLoad(true);
      setLoadError(null);
      try {
        // Simulate API call with realistic delay
        await new Promise<void>((resolve) =>
          setTimeout(() => resolve(), forceRefresh ? 800 : 1200)
        );

        // Update cache
        dataCache.current = {
          stores: FNBDUMMY_STORE_LIST_TAB,
          timestamp: Date.now(),
        };

        setStores(FNBDUMMY_STORE_LIST_TAB);
      } catch (error) {
        setLoadError(
          t('fnb.loadStoresError') || 'Gagal memuat daftar toko. Silakan coba lagi.'
        );
      } finally {
        setIsInitialLoad(false);
      }
    },
    [stores.length, t]
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadStores(true);
    setRefreshing(false);
  }, [loadStores]);

  // Load data when tab becomes active
  useEffect(() => {
    if (isActive) {
      loadStores();
    } else if (isVisible) {
      // Pre-load data when tab is visible but not active (for smoother switching)
      // Only if we don't have cached data
      if (!dataCache.current || dataCache.current.stores.length === 0) {
        loadStores();
      }
    }
  }, [isActive, isVisible, loadStores]);

  // Show loading state based on visibility and data availability
  const shouldShowLoading = isVisible && (isInitialLoad || stores.length === 0);

  // Filtered stores based on search and filter
  const filteredStores = useMemo(() => {
    if (shouldShowLoading || stores.length === 0) return [];

    return stores.filter((store) => {
      const matchesSearch =
        searchQuery === '' ||
        store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        store.description.toLowerCase().includes(searchQuery.toLowerCase());

      let matchesFilter = true;
      switch (activeFilter) {
        case 'food':
          matchesFilter = store.category === 'Makanan';
          break;
        case 'drink':
          matchesFilter = store.category === 'Minuman';
          break;
        case 'open':
          matchesFilter = store.isOpen;
          break;
        case 'rating':
          matchesFilter = store.rating >= 4.5;
          break;
        default:
          matchesFilter = true;
      }

      return matchesSearch && matchesFilter;
    });
  }, [stores, searchQuery, activeFilter, shouldShowLoading]);

  const handleStorePress = useCallback(
    (store: FnBStoreListItem) => {
      // Navigate to FnB store menu screen
      // @ts-ignore
      navigation.navigate('FnBMerchantDetail', {
        storeId: store.id,
        storeName: store.name,
        entryPoint: 'browse',
      });
    },
    [navigation]
  );

  const handleScanPress = useCallback(() => {
    // Navigate to dedicated FnB scan screen
    // @ts-ignore
    navigation.navigate('FnBScan');
  }, [navigation]);

  const featuredProducts = useMemo(
    () => FNBDUMMY_STORE_ITEMS[DEFAULT_STORE_ID] ?? [],
    []
  );

  const handleProductPress = useCallback(
    () => {
      // @ts-ignore
      navigation.navigate('FnBMerchantDetail', {
        storeId: DEFAULT_STORE_ID,
        storeName: 'Warung Makan Sederhana',
        entryPoint: 'browse',
      });
    },
    [navigation]
  );

  const handleFilterPress = useCallback((filter: StoreFilter) => {
    setActiveFilter(filter);
    setShowFilters(false);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  const renderStoreCard = useCallback(
    ({ item }: { item: FnBStoreListItem }) => (
      <TouchableOpacity
        style={[styles.storeCard, { backgroundColor: colors.surface }]}
        onPress={() => handleStorePress(item)}
        activeOpacity={0.8}
      >
        <View style={[styles.storeIconContainer, { backgroundColor: colors.primaryLight }]}>
          <Shop size={scale(28)} color={colors.primary} variant="Bold" />
        </View>

        <View style={[styles.storeInfo, styles.listStoreInfo]}>
          <View style={styles.storeHeader}>
            <Text style={[styles.listStoreName, { color: colors.text }]} numberOfLines={1}>
              {item.name}
            </Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: item.isOpen ? colors.success : colors.error },
              ]}
            >
              <Text style={[styles.statusText, { color: colors.surface }]}>
                {item.isOpen ? 'Buka' : 'Tutup'}
              </Text>
            </View>
          </View>

          <Text
            style={[styles.storeDescription, { color: colors.textSecondary }]}
            numberOfLines={1}
          >
            {item.description}
          </Text>

          <View style={styles.storeMetaRow}>
            <View style={styles.metaItem}>
              <Star1 size={scale(12)} color={colors.warning} variant="Bold" />
              <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                {item.rating.toFixed(1)}
              </Text>
            </View>

            <View style={styles.metaItem}>
              <Location size={scale(12)} color={colors.textSecondary} variant="Linear" />
              <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                {item.distance}
              </Text>
            </View>

            <View style={styles.metaItem}>
              <Clock size={scale(12)} color={colors.textSecondary} variant="Linear" />
              <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                {item.openTime} - {item.closeTime}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    ),
    [colors, handleStorePress]
  );

  const renderBanner = useCallback(
    ({ item }: { item: (typeof BANNERS)[0] }) => (
      <TouchableOpacity
        style={[
          styles.bannerCard,
          {
            width: BANNER_CARD_WIDTH,
            height: BANNER_HEIGHT,
            borderRadius: BANNER_BORDER_RADIUS,
            marginRight: scale(12),
          },
        ]}
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
                  item.badgeBg === 'warning' ? colors.warning : colors.primary,
              },
            ]}
          >
            <Text style={styles.bannerBadgeText}>{t(item.badgeKey)}</Text>
          </View>
          <Text style={styles.bannerTitle}>{t(item.titleKey)}</Text>
          <Text style={styles.bannerSubtitle}>{t(item.subtitleKey)}</Text>
        </View>
      </TouchableOpacity>
    ),
    [colors, t]
  );

  const renderProductCard = useCallback(
    ({ item }: { item: FnBItem }) => (
      <TouchableOpacity
        style={[styles.productCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={handleProductPress}
        activeOpacity={0.8}
      >
        <View style={styles.productImageWrap}>
          <Image
            source={{ uri: item.imageUrl ?? '' }}
            style={styles.productImage}
            resizeMode="cover"
          />
        </View>
        <Text style={[styles.productName, { color: colors.text }]} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={[styles.productPrice, { color: colors.primary }]}>
          Rp {item.price.toLocaleString('id-ID')}
        </Text>
      </TouchableOpacity>
    ),
    [colors, handleProductPress]
  );

  const listHeaderComponent = useMemo(
    () => (
      <>
        <View style={[styles.bannerHeroWrap, { height: BANNER_HEIGHT }]}>
          <FlatList
            ref={bannerListRef}
            data={BANNERS}
            renderItem={renderBanner}
            keyExtractor={(o) => o.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            snapToInterval={BANNER_CARD_WIDTH + scale(12)}
            snapToAlignment="start"
            decelerationRate="fast"
            contentContainerStyle={styles.bannerCarouselContent}
            nestedScrollEnabled
            scrollEnabled
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(
                e.nativeEvent.contentOffset.x / (BANNER_CARD_WIDTH + scale(12))
              );
              bannerIndexRef.current = Math.min(idx, BANNERS.length - 1);
            }}
          />
        </View>
        {featuredProducts.length > 0 && (
          <View style={[styles.productSection, { paddingHorizontal: horizontalPadding }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t('fnb.menuPopuler') || 'Menu Populer'}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.productScrollContent}
              nestedScrollEnabled
              scrollEnabled
              directionalLockEnabled
            >
              {featuredProducts.slice(0, 10).map((item) => (
                <View key={item.id} style={styles.productCardWrap}>
                  {renderProductCard({ item })}
                </View>
              ))}
            </ScrollView>
          </View>
        )}
        <Text style={[styles.sectionTitle, { color: colors.text, marginTop: scale(8) }]}>
          {t('fnb.stores') || 'Toko'}
        </Text>
      </>
    ),
    [renderBanner, renderProductCard, featuredProducts, horizontalPadding, colors, t]
  );

  if (!isVisible) {
    return null;
  }

  const filterOptions: { key: StoreFilter; label: string }[] = [
    { key: 'all', label: 'Semua' },
    { key: 'food', label: 'Makanan' },
    { key: 'drink', label: 'Minuman' },
    { key: 'open', label: 'Buka' },
    { key: 'rating', label: 'Rating Tinggi' },
  ];

  return (
    <View style={[styles.container, { width: screenWidth }]}>
      {/* Fixed Header */}
      <View
        style={[
          styles.fixedHeader,
          {
            paddingTop: scale(10),
            paddingHorizontal: horizontalPadding,
          },
        ]}
      >
        {/* Title Row */}
        {/* <View style={styles.titleRow}>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>
                        {t('fnb.title') || 'Pesan Makanan'}
                    </Text>
                    <TouchableOpacity
                        style={[styles.viewToggleButton, { backgroundColor: colors.primary }]}
                        onPress={toggleViewMode}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        {viewMode === 'grid' ? (
                            <Element3 size={scale(18)} color={colors.surface} variant="Bold" />
                        ) : (
                            <HamburgerMenu size={scale(18)} color={colors.surface} variant="Bold" />
                        )}
                    </TouchableOpacity>
                </View> */}

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
              ? (deliveryAddress.split(',')[0]?.trim() || deliveryAddress)
              : t('fnb.currentLocationShort')}
          </Text>
        </TouchableOpacity>

        {/* Search + Scan in one bar (same as FnBScreen) */}
        <View
          style={[
            styles.searchWrap,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.searchInputRow}>
            <SearchNormal size={scale(20)} color={colors.textSecondary} variant="Linear" />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder={t('fnb.searchCraving') || t('fnb.searchPlaceholder') || 'Cari restoran atau menu...'}
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={clearSearch}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <CloseCircle size={scale(20)} color={colors.textSecondary} variant="Bold" />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            onPress={handleScanPress}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ScanBarcode size={scale(22)} color={colors.primary} variant="Bold" />
          </TouchableOpacity>
        </View>

        {/* Filter Row */}
        <View style={styles.filterRow}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScrollContent}
            nestedScrollEnabled={true}
            bounces={true}
          >
            {filterOptions.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: activeFilter === option.key ? colors.primary : colors.surface,
                    borderColor: activeFilter === option.key ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => handleFilterPress(option.key)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    {
                      color: activeFilter === option.key ? colors.surface : colors.text,
                    },
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      <FnBLocationPickerSheet
        visible={locationSheetVisible}
        onClose={() => setLocationSheetVisible(false)}
        onSelectAddress={(address) => {
          setDeliveryAddress(address);
          setLocationSheetVisible(false);
        }}
      />

      {/* Store List */}
      {shouldShowLoading ? (
        <View
          style={[
            styles.listContent,
            {
              paddingHorizontal: horizontalPadding,
              paddingBottom: insets.bottom + scale(20),
            },
          ]}
        >
          <StoreCardSkeleton />
          <StoreCardSkeleton />
          <StoreCardSkeleton />
          <StoreCardSkeleton />
          <StoreCardSkeleton />
        </View>
      ) : (
        <FlatList
          data={filteredStores}
          renderItem={renderStoreCard}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={listHeaderComponent}
          contentContainerStyle={[
            styles.listContent,
            {
              paddingHorizontal: horizontalPadding,
              paddingTop: moderateVerticalScale(16),
              paddingBottom: insets.bottom + scale(20),
            },
          ]}
          showsVerticalScrollIndicator={false}
          scrollEnabled={scrollEnabled}
          nestedScrollEnabled
          scrollEventThrottle={16}
          bounces={true}
          alwaysBounceVertical={true}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ItemSeparatorComponent={() => <View style={{ height: scale(8) }} />}
          ListEmptyComponent={
            loadError ? (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  {loadError}
                </Text>
                <TouchableOpacity
                  style={[styles.retryButton, { backgroundColor: colors.primary }]}
                  onPress={() => loadStores(true)}
                >
                  <Text style={[styles.retryButtonText, { color: colors.surface }]}>
                    {t('common.retry') || 'Coba lagi'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : shouldShowLoading ? (
              <View style={styles.emptyContainer}>
                {Array.from({ length: 4 }, (_, i) => (
                  <StoreCardSkeleton key={`skeleton-${i}`} />
                ))}
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  {searchQuery || activeFilter !== 'all'
                    ? t('fnb.noStoresMatchFilter') || 'Tidak ada toko yang sesuai filter'
                    : t('fnb.noStoresFound') || 'Tidak ada toko ditemukan'}
                </Text>
              </View>
            )
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fixedHeader: {
    paddingBottom: moderateVerticalScale(12),
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
    paddingHorizontal: scale(14),
    paddingVertical: scale(8),
    borderRadius: scale(20),
    marginBottom: scale(12),
    alignSelf: 'flex-start',
  },
  locationPillText: {
    fontFamily: FontFamily.monasans.bold,
    fontSize: scale(13),
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: scale(12),
  },
  headerTitle: {
    fontSize: scale(18),
    fontFamily: FontFamily.monasans.bold,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
  },
  viewToggleButton: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(10),
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleIcon: {
    fontSize: scale(16),
    fontWeight: 'bold',
    textAlign: 'center',
  },
  searchWrap: {
    height: scale(48),
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingLeft: scale(14),
    paddingRight: scale(14),
    borderRadius: scale(24),
    gap: scale(8),
    marginBottom: scale(12),
  },
  searchInputRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
  },
  searchInput: {
    flex: 1,
    fontSize: scale(14),
    fontFamily: FontFamily.monasans.regular,
    paddingVertical: 0,
  },
  bannerHeroWrap: {
    overflow: 'hidden',
    marginBottom: scale(16),
  },
  bannerCarouselContent: {
    paddingHorizontal: BANNER_PADDING_H,
  },
  bannerCard: {
    overflow: 'hidden',
    position: 'relative',
  },
  bannerImage: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  bannerGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
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
    color: '#fff',
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
    color: 'rgba(255,255,255,0.85)',
    marginTop: scale(4),
  },
  productSection: {
    marginBottom: scale(20),
  },
  sectionTitle: {
    fontSize: scale(16),
    fontFamily: FontFamily.monasans.bold,
    marginBottom: scale(12),
  },
  productScrollContent: {
    gap: scale(12),
    paddingRight: scale(16),
  },
  productCardWrap: {
    width: scale(140),
  },
  productCard: {
    borderRadius: scale(12),
    borderWidth: 1,
    overflow: 'hidden',
  },
  productImageWrap: {
    width: '100%',
    height: scale(100),
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productName: {
    fontFamily: FontFamily.monasans.semiBold,
    fontSize: scale(13),
    paddingHorizontal: scale(10),
    paddingTop: scale(8),
  },
  productPrice: {
    fontFamily: FontFamily.monasans.bold,
    fontSize: scale(13),
    paddingHorizontal: scale(10),
    paddingBottom: scale(10),
  },
  filterRow: {
    marginBottom: scale(4),
  },
  filterScrollContent: {
    paddingRight: scale(16),
    gap: scale(8),
  },
  filterChip: {
    paddingHorizontal: scale(14),
    paddingVertical: scale(6),
    borderRadius: scale(20),
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: scale(12),
    fontFamily: FontFamily.monasans.semiBold,
  },
  listContent: {
    paddingTop: moderateVerticalScale(4),
    flexGrow: 1,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    gap: scale(8),
  },
  storeCard: {
    padding: scale(12),
    borderRadius: scale(12),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    flexDirection: 'row',
  },
  storeIconContainer: {
    width: scale(48),
    height: scale(48),
    borderRadius: scale(10),
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  storeInfo: {
    alignItems: 'flex-start',
  },
  listStoreInfo: {
    alignItems: 'flex-start',
    flex: 1,
    marginLeft: scale(12),
  },
  storeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: scale(4),
    width: '100%',
  },
  storeName: {
    fontSize: scale(14),
    fontFamily: FontFamily.monasans.semiBold,
    textAlign: 'center',
    marginBottom: scale(2),
  },
  listStoreName: {
    fontSize: scale(16),
    fontFamily: FontFamily.monasans.semiBold,
    textAlign: 'left',
    marginBottom: scale(4),
  },
  statusBadge: {
    paddingHorizontal: scale(8),
    paddingVertical: scale(3),
    borderRadius: scale(4),
  },
  statusText: {
    fontSize: scale(10),
    fontFamily: FontFamily.monasans.semiBold,
  },
  storeDescription: {
    fontSize: scale(12),
    fontFamily: FontFamily.monasans.regular,
    marginBottom: scale(6),
  },
  storeMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  gridStoreMetaRow: {
    justifyContent: 'center',
    marginTop: scale(4),
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: scale(12),
  },
  metaText: {
    fontSize: scale(11),
    fontFamily: FontFamily.monasans.regular,
    marginLeft: scale(4),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: moderateVerticalScale(60),
  },
  emptyText: {
    fontSize: scale(14),
    fontFamily: FontFamily.monasans.regular,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: scale(16),
    paddingVertical: scale(12),
    paddingHorizontal: scale(24),
    borderRadius: scale(10),
  },
  retryButtonText: {
    fontSize: scale(14),
    fontFamily: FontFamily.monasans.semiBold,
  },
  skeletonIcon: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(8),
  },
  skeletonText: {
    borderRadius: scale(4),
  },
  skeletonName: {
    height: scale(14),
    width: '70%',
    marginBottom: scale(2),
  },
  skeletonDesc: {
    height: scale(12),
    width: '90%',
    marginBottom: scale(6),
  },
  skeletonMeta: {
    height: scale(10),
    width: scale(40),
    marginRight: scale(12),
  },
  skeletonBadge: {
    height: scale(16),
    width: scale(40),
    borderRadius: scale(8),
  },
});
