/**
 * MarketplaceWishlistScreen Component
 * Tab Wishlist: daftar produk favorit dari useMarketplaceWishlist
 */
import React, { useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  NativeSyntheticEvent,
  NativeScrollEvent,
  BackHandler,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Heart, Trash } from 'iconsax-react-nativejs';
import {
  scale,
  moderateVerticalScale,
  getHorizontalPadding,
  FontFamily,
  getResponsiveFontSize,
  ScreenHeader,
} from '@core/config';
import { useTheme } from '@core/theme';
import { useTranslation } from '@core/i18n';
import { useTabBar } from '../navigation/TabBarContext';
import { useMarketplaceWishlist } from '../../hooks/useMarketplaceWishlist';

const formatPrice = (price: number): string =>
  `Rp ${price.toLocaleString('id-ID')}`;

const PLACEHOLDER =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect fill="#ddd" width="120" height="120"/></svg>'
  );

export const MarketplaceWishlistScreen: React.FC = () => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const paddingH = getHorizontalPadding();
  const { toggleTabBar } = useTabBar();
  const { favoriteItems, removeFavorite, clearFavorites, favoritesCount } =
    useMarketplaceWishlist();
  const lastContentOffset = useRef(0);

  const goToExplore = useCallback(() => {
    navigation.navigate('MarketplaceExplore' as never);
  }, [navigation]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      goToExplore();
      return true;
    });
    return () => sub.remove();
  }, [goToExplore]);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const currentOffset = event.nativeEvent.contentOffset.y;
      const diff = currentOffset - lastContentOffset.current;
      if (Math.abs(diff) > 3) {
        if (diff > 0 && currentOffset > 20) {
          toggleTabBar(false);
        } else {
          toggleTabBar(true);
        }
      }
      lastContentOffset.current = currentOffset;
    },
    [toggleTabBar]
  );

  const handleProductPress = useCallback(
    (item: (typeof favoriteItems)[0]) => {
      (navigation as any).navigate('ProductDetail', {
        product: {
          id: item.id,
          name: item.name,
          price: item.price,
          imageUrl: item.imageUrl,
          storeName: item.storeName,
          category: item.category,
        },
      });
    },
    [navigation]
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title={t('marketplace.wishlist')}
        onBackPress={goToExplore}
        rightComponent={
          favoritesCount > 0 ? (
            <TouchableOpacity onPress={clearFavorites}>
              <Trash size={scale(22)} color={colors.error} variant="Linear" />
            </TouchableOpacity>
          ) : undefined
        }
        showBorder
        style={{ paddingTop: insets.top, backgroundColor: colors.surface }}
        paddingHorizontal={paddingH}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: paddingH,
            paddingBottom: insets.bottom + moderateVerticalScale(100),
            flexGrow: favoriteItems.length === 0 ? 1 : undefined,
          },
        ]}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        {favoriteItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Heart size={scale(48)} color={colors.textSecondary} variant="Bulk" />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {t('marketplace.emptyWishlist') || 'Belum ada favorit'}
            </Text>
          </View>
        ) : (
          favoriteItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.card, { backgroundColor: colors.surface }]}
              onPress={() => handleProductPress(item)}
              activeOpacity={0.8}
            >
              <Image
                source={{ uri: item.imageUrl || PLACEHOLDER }}
                style={styles.cardImage}
                resizeMode="cover"
              />
              <View style={styles.cardBody}>
                <Text
                  style={[styles.cardName, { color: colors.text }]}
                  numberOfLines={2}
                >
                  {item.name}
                </Text>
                {item.storeName && (
                  <Text
                    style={[styles.cardStore, { color: colors.textSecondary }]}
                    numberOfLines={1}
                  >
                    {item.storeName}
                  </Text>
                )}
                <Text style={[styles.cardPrice, { color: colors.primary }]}>
                  {formatPrice(item.price)}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.removeBtn}
                onPress={(e) => {
                  e.stopPropagation();
                  removeFavorite(item.id);
                }}
              >
                <Heart size={scale(22)} color={colors.error} variant="Bold" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    paddingTop: moderateVerticalScale(16),
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(16),
  },
  emptyText: {
    fontFamily: FontFamily?.monasans?.regular ?? 'System',
    fontSize: getResponsiveFontSize('medium'),
  },
  card: {
    flexDirection: 'row',
    padding: scale(12),
    borderRadius: 12,
    marginBottom: scale(12),
    alignItems: 'center',
  },
  cardImage: {
    width: scale(80),
    height: scale(80),
    borderRadius: 8,
  },
  cardBody: { flex: 1, marginLeft: scale(12) },
  cardName: {
    fontFamily: FontFamily?.monasans?.semiBold ?? 'System',
    fontSize: getResponsiveFontSize('medium'),
  },
  cardStore: {
    fontFamily: FontFamily?.monasans?.regular ?? 'System',
    fontSize: getResponsiveFontSize('small'),
    marginTop: scale(4),
  },
  cardPrice: {
    fontFamily: FontFamily?.monasans?.bold ?? 'System',
    fontSize: getResponsiveFontSize('medium'),
    marginTop: scale(4),
  },
  removeBtn: { padding: scale(8) },
});
