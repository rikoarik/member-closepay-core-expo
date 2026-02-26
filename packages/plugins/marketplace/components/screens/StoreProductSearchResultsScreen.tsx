/**
 * StoreProductSearchResultsScreen Component
 * Hasil pencarian produk di toko yang dipilih (list/grid seperti SearchResults).
 * Dibuka dari StoreProductSearchScreen saat user submit/tap rekomendasi.
 */

import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { ShoppingCart } from 'iconsax-react-nativejs';
import {
  scale,
  moderateVerticalScale,
  getHorizontalPadding,
  FontFamily,
  ScreenHeader,
} from '@core/config';
import { useTheme } from '@core/theme';
import { useTranslation } from '@core/i18n';
import { ProductCard, Product } from '../shared/ProductCard';
import { ProductCardSkeleton } from '../shared/ProductCardSkeleton';
import { useMarketplaceData } from '../../hooks/useMarketplaceData';
import { useMarketplaceCart } from '../../hooks/useMarketplaceCart';
import type { Store } from '../../hooks/useMarketplaceData';

type StoreProductSearchResultsRouteParams = {
  StoreProductSearchResults: {
    store: Store;
    query: string;
  };
};

export const StoreProductSearchResultsScreen: React.FC = () => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<StoreProductSearchResultsRouteParams, 'StoreProductSearchResults'>>();
  const insets = useSafeAreaInsets();
  const horizontalPadding = getHorizontalPadding();
  const { itemCount } = useMarketplaceCart();

  const store = route.params?.store;
  const query = route.params?.query ?? '';

  const { products: allProducts, loading } = useMarketplaceData(100, true, true);

  const results = useMemo(() => {
    if (!store || !allProducts) return [];
    const storeProducts = allProducts.filter((p) => p.storeName === store.name);
    if (!query.trim()) return storeProducts;
    const q = query.toLowerCase().trim();
    return storeProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.category?.toLowerCase().includes(q) ?? false)
    );
  }, [store, allProducts, query]);

  const [refreshing, setRefreshing] = React.useState(false);
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleCartPress = useCallback(() => {
    (navigation as any).navigate('Cart');
  }, [navigation]);

  const handleProductPress = useCallback(
    (product: Product) => {
      (navigation as any).navigate('ProductDetail', { product });
    },
    [navigation]
  );

  const renderProduct = useCallback(
    ({ item }: { item: Product }) => (
      <ProductCard product={item} onPress={handleProductPress} />
    ),
    [handleProductPress]
  );

  if (!store) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: colors.text }}>{t('marketplace.storeNotFound')}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title={query ? `${t('marketplace.searchResults') || 'Hasil'} "${query}"` : (t('marketplace.searchResults') || 'Hasil')}
        onBackPress={handleBack}
        style={{ paddingTop: insets.top + moderateVerticalScale(8), backgroundColor: colors.surface }}
        paddingHorizontal={horizontalPadding}
        rightComponent={
          <TouchableOpacity onPress={handleCartPress} style={styles.cartButton} hitSlop={8}>
            <ShoppingCart size={scale(24)} color={colors.text} variant="Linear" />
            {itemCount > 0 && (
              <View style={[styles.cartBadge, { backgroundColor: colors.error }]}>
                <Text style={styles.cartBadgeText}>{itemCount > 99 ? '99+' : itemCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        }
      />

      {results.length > 0 && (
        <View style={[styles.countRow, { paddingHorizontal: horizontalPadding }]}>
          <Text style={[styles.countText, { color: colors.textSecondary }]}>
            {t('marketplace.found') || 'Ditemukan'} {results.length} {t('marketplace.products') || 'produk'}
          </Text>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingWrap}>
          {Array.from({ length: 4 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </View>
      ) : results.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {t('marketplace.noSearchResults') || 'Tidak ada produk yang cocok.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={results}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={[styles.columnWrapper, { paddingHorizontal: horizontalPadding }]}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + moderateVerticalScale(24) },
          ]}
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
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  cartButton: {
    padding: scale(4),
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -scale(4),
    right: -scale(4),
    minWidth: scale(18),
    height: scale(18),
    borderRadius: scale(9),
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scale(4),
  },
  cartBadgeText: {
    fontSize: scale(10),
    fontFamily: FontFamily.monasans.bold,
    color: '#FFFFFF',
  },
  countRow: {
    paddingVertical: moderateVerticalScale(8),
    backgroundColor: 'transparent',
  },
  countText: {
    fontSize: scale(13),
    fontFamily: FontFamily.monasans.regular,
  },
  listContent: {
    flexGrow: 1,
    paddingTop: moderateVerticalScale(8),
  },
  columnWrapper: {
    gap: scale(12),
    marginBottom: scale(12),
  },
  loadingWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: getHorizontalPadding(),
    gap: scale(12),
    paddingTop: scale(12),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: getHorizontalPadding(),
  },
  emptyText: {
    fontSize: scale(14),
    fontFamily: FontFamily.monasans.regular,
    textAlign: 'center',
  },
});

export default StoreProductSearchResultsScreen;
