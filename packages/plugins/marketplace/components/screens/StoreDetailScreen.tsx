/**
 * StoreDetailScreen Component
 * Display store profile and products
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Alert,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { ArrowLeft2, Verify, Star1, SearchNormal, Copy, ShoppingCart, MessageText, TickCircle } from 'iconsax-react-nativejs';
import { scale, moderateVerticalScale, getHorizontalPadding, FontFamily } from '@core/config';
import { useTheme } from '@core/theme';
import { useTranslation } from '@core/i18n';
import { Clipboard } from '@core/native';
import { ProductCard, Product } from '../shared/ProductCard';
import { ProductCardSkeleton } from '../shared/ProductCardSkeleton';
import { MarketplaceCategoryTabs } from '../shared/MarketplaceCategoryTabs';
import { useMarketplaceData, Store, getCategories } from '../../hooks/useMarketplaceData';
import { useMarketplaceCart } from '../../hooks/useMarketplaceCart';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ALL_CATEGORIES_VALUE = 'all';

type StoreDetailRouteParams = {
  StoreDetail: {
    store: Store;
  };
};

export const StoreDetailScreen: React.FC = () => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<StoreDetailRouteParams, 'StoreDetail'>>();
  const insets = useSafeAreaInsets();
  const horizontalPadding = getHorizontalPadding();

  const store = route.params?.store;
  const { itemCount } = useMarketplaceCart();
  const [selectedCategory, setSelectedCategory] = useState<string>(ALL_CATEGORIES_VALUE);
  const rawCategories = useMemo(() => getCategories(), []);
  const categoryOptions = useMemo(
    () => [
      { value: ALL_CATEGORIES_VALUE, label: t('marketplace.allCategories') },
      ...rawCategories.filter((c) => c !== 'Semua').map((c) => ({ value: c, label: c })),
    ],
    [t, rawCategories]
  );

  // Fetch all products and filter by store name
  // In a real app, we would fetch products by store ID from API
  const { products: allProducts, loading } = useMarketplaceData(100, true, true);

  const storeProducts = useMemo(() => {
    if (!store || !allProducts) return [];
    let products = allProducts.filter((p) => p.storeName === store.name);

    if (selectedCategory !== ALL_CATEGORIES_VALUE) {
      products = products.filter((p) => p.category === selectedCategory);
    }

    return products;
  }, [store, allProducts, selectedCategory]);

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleCategorySelect = useCallback((category: string) => {
    setSelectedCategory(category);
  }, []);

  const handleProductPress = (product: Product) => {
    // @ts-ignore
    navigation.navigate('ProductDetail', { product });
  };

  const handleChat = async () => {
    if (store?.phoneNumber) {
      const url = `https://wa.me/${store.phoneNumber}`;
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert(t('common.error'), t('marketplace.whatsAppNotInstalled'));
      }
    }
  };

  const handleCopyPhoneNumber = () => {
    if (store?.phoneNumber) {
      Clipboard.setString(store.phoneNumber);
      Alert.alert(t('common.success'), t('marketplace.phoneNumberCopied'));
    }
  };

  const handleCartPress = useCallback(() => {
    (navigation as any).navigate('Cart');
  }, [navigation]);

  const handleOpenSearch = useCallback(() => {
    if (store) (navigation as any).navigate('StoreProductSearch', { store });
  }, [navigation, store]);

  if (!store) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },
        ]}
      >
        <Text style={{ color: colors.text }}>{t('marketplace.storeNotFound')}</Text>
      </View>
    );
  }

  const renderHeader = () => (
    <View>
      {/* Gallery-style store section: circular logo + verified + name + rating • location + Open • hours */}
      <View style={[styles.storeSectionTop, { paddingHorizontal: horizontalPadding }]}>
        <View style={styles.storeLogoRow}>
          <View style={[styles.storeLogoWrap, { borderColor: colors.surface }]}>
            
            <Image source={{ uri: store.imageUrl }} style={styles.storeLogoImage} resizeMode="cover" />
            
          </View>
          <View style={styles.storeInfoTop}>
            <Text style={[styles.storeNameTop, { color: colors.text }]} numberOfLines={1}>
              {store.name}
              <View style={[styles.verifiedBadge]}>
                  <Verify color={colors.success}  variant="Linear" />
              </View>
            </Text>
            <View style={styles.storeMetaRow}>
              <Star1 size={scale(14)} color={colors.warning} variant="Bold" />
              <Text style={[styles.storeRatingText, { color: colors.text }]}>
                {store.rating?.toFixed(1) || '4.9'}
              </Text>
              <Text style={[styles.storeMetaDot, { color: colors.border }]}>•</Text>
              <Text style={[styles.storeLocationTop, { color: colors.textSecondary }]} numberOfLines={1}>
                {store.location}
              </Text>
            </View>
            <Text
              style={[
                styles.storeOpenText,
                { color: store.isOpen ? colors.success : colors.error },
              ]}
            >
              {store.isOpen
                ? `${t('marketplace.storeOpen') || 'Open'} • ${store.openingHours ?? '08:00 - 21:00'}`
                : (t('marketplace.storeClosed') || 'Closed')}
            </Text>
          </View>
        </View>
      </View>

      {/* Category pills - horizontal scroll */}
      <View style={styles.categoryPillsWrap}>
        <MarketplaceCategoryTabs
          categories={categoryOptions}
          selectedCategory={selectedCategory}
          onSelectCategory={handleCategorySelect}
        />
      </View>
    </View>
  );

  const renderProduct = ({ item }: { item: Product }) => (
    <ProductCard product={item} onPress={handleProductPress} />
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Gallery-style sticky header: back + search + cart */}
      <View
        style={[
          styles.galleryHeader,
          {
            paddingTop: insets.top + moderateVerticalScale(8),
            paddingHorizontal: horizontalPadding,
            paddingBottom: moderateVerticalScale(12),
            backgroundColor: (colors.surface || '#FFFFFF') + 'E6',
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity onPress={handleBack} style={styles.headerIconButton} hitSlop={8}>
          <ArrowLeft2 size={scale(24)} color={colors.text} variant="Linear" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.searchInputWrap, { backgroundColor: colors.inputBackground || colors.border + '40' }]}
          onPress={handleOpenSearch}
          activeOpacity={0.8}
        >
          <SearchNormal size={scale(18)} color={colors.textSecondary} variant="Linear" />
          <Text style={[styles.searchPlaceholderText, { color: colors.textSecondary }]}>
            {t('marketplace.searchPlaceholderInStore')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleCartPress} style={styles.headerIconButton} hitSlop={8}>
          <ShoppingCart size={scale(24)} color={colors.text} variant="Linear" />
          {itemCount > 0 && (
            <View style={[styles.cartBadge, { backgroundColor: colors.error }]}>
              <Text style={styles.cartBadgeText}>{itemCount > 99 ? '99+' : itemCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <FlatList
        key="store-products-grid-2"
        data={storeProducts}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + moderateVerticalScale(80) },
        ]}
        ListHeaderComponent={renderHeader}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          loading ? (
            <View style={styles.loadingContainer}>
              {Array.from({ length: 4 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {t('marketplace.noProductsInStore')}
              </Text>
            </View>
          )
        }
      />

      {/* FAB Chat (gallery style) */}
      {store.phoneNumber && (
        <TouchableOpacity
          style={[styles.fabChat, { backgroundColor: colors.primary, bottom: insets.bottom + moderateVerticalScale(24) }]}
          onPress={handleChat}
          activeOpacity={0.9}
        >
          <MessageText size={scale(24)} color="#FFFFFF" variant="Bold" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  galleryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(12),
    borderBottomWidth: 1,
    zIndex: 10,
  },
  headerIconButton: {
    padding: scale(8),
    position: 'relative',
  },
  searchInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: scale(999),
    paddingVertical: scale(10),
    paddingHorizontal: scale(14),
    gap: scale(8),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchPlaceholderText: {
    flex: 1,
    fontSize: scale(14),
    fontFamily: FontFamily.monasans.regular,
  },
  cartBadge: {
    position: 'absolute',
    top: scale(4),
    right: scale(4),
    minWidth: scale(16),
    height: scale(16),
    borderRadius: scale(8),
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scale(4),
  },
  cartBadgeText: {
    fontSize: scale(10),
    fontFamily: FontFamily.monasans.bold,
    color: '#FFFFFF',
  },
  storeSectionTop: {
    paddingVertical: moderateVerticalScale(20),
  },
  storeLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(16),
  },
  storeLogoWrap: {
    width: scale(80),
    height: scale(80),
    borderRadius: scale(40),
    overflow: 'hidden',
    borderWidth: 2,
    position: 'relative',
  },
  storeLogoImage: {
    width: '100%',
    height: '100%',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -scale(4),
    right: -scale(4),
    width: scale(24),
    height: scale(24),
    borderRadius: scale(12),
    zIndex: 999999999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storeInfoTop: {
    flex: 1,
    minWidth: 0,
  },
  storeNameTop: {
    fontSize: scale(20),
    fontFamily: FontFamily.monasans.bold,
    marginBottom: scale(4),
  },
  storeMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
    marginBottom: scale(2),
  },
  storeRatingText: {
    fontSize: scale(14),
    fontFamily: FontFamily.monasans.semiBold,
  },
  storeMetaDot: {
    fontSize: scale(12),
  },
  storeLocationTop: {
    flex: 1,
    fontSize: scale(13),
    fontFamily: FontFamily.monasans.regular,
  },
  storeOpenText: {
    fontSize: scale(12),
    fontFamily: FontFamily.monasans.semiBold,
  },
  categoryPillsWrap: {
    marginBottom: moderateVerticalScale(8),
  },
  listContent: {
    flexGrow: 1,
  },
  columnWrapper: {
    gap: scale(12),
    paddingHorizontal: getHorizontalPadding(),
    marginBottom: scale(12),
  },
  loadingContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: getHorizontalPadding(),
  },
  emptyContainer: {
    padding: scale(32),
    alignItems: 'center',
  },
  emptyText: {
    fontSize: scale(14),
    fontFamily: FontFamily.monasans.regular,
    textAlign: 'center',
  },
  fabChat: {
    position: 'absolute',
    right: getHorizontalPadding() + scale(8),
    width: scale(56),
    height: scale(56),
    borderRadius: scale(28),
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
});

export default StoreDetailScreen;
