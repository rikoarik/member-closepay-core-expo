/**
 * StoreProductSearchScreen Component
 * Search products within the currently opened store only.
 * Layout and style match SearchScreen (back + search bar, recommendations, results).
 */

import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { SearchNormal, CloseCircle, Chart, ArrowLeft2 } from 'iconsax-react-nativejs';
import {
  scale,
  moderateVerticalScale,
  getHorizontalPadding,
  getResponsiveFontSize,
  FontFamily,
} from '@core/config';
import { useTheme } from '@core/theme';
import { useTranslation } from '@core/i18n';
import { useMarketplaceData } from '../../hooks/useMarketplaceData';
import type { Store } from '../../hooks/useMarketplaceData';

type StoreProductSearchRouteParams = {
  StoreProductSearch: {
    store: Store;
  };
};

export const StoreProductSearchScreen: React.FC = () => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<StoreProductSearchRouteParams, 'StoreProductSearch'>>();
  const insets = useSafeAreaInsets();
  const horizontalPadding = getHorizontalPadding();
  const searchInputRef = useRef<TextInput>(null);

  const store = route.params?.store;
  const [searchQuery, setSearchQuery] = useState('');

  const { products: allProducts } = useMarketplaceData(100, true, true);

  const storeProducts = useMemo(() => {
    if (!store || !allProducts) return [];
    return allProducts.filter((p) => p.storeName === store.name);
  }, [store, allProducts]);

  const recommendations = useMemo(() => {
    const categories = new Set<string>();
    storeProducts.forEach((p) => p.category && categories.add(p.category));
    return Array.from(categories).slice(0, 10);
  }, [storeProducts]);

  // Kept for compatibility; results are shown in StoreProductSearchResultsScreen
  const searchResults = useMemo(() => [], []);

  useFocusEffect(
    useCallback(() => {
      const timer = setTimeout(() => searchInputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }, [])
  );

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleSearch = useCallback(() => {
    const q = searchQuery.trim();
    if (store) (navigation as any).navigate('StoreProductSearchResults', { store, query: q || '' });
  }, [navigation, store, searchQuery]);

  const handleRecommendationPress = useCallback(
    (category: string) => {
      if (store) (navigation as any).navigate('StoreProductSearchResults', { store, query: category });
    },
    [navigation, store]
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
      {/* Header: same as SearchScreen - back + search bar with clear */}
      <View
        style={[
          styles.customHeader,
          {
            paddingTop: insets.top,
            paddingHorizontal: horizontalPadding,
            paddingBottom: moderateVerticalScale(12),
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
        <View style={[styles.searchInputContainer, { backgroundColor: colors.background || colors.surface }]}>
          <SearchNormal size={scale(20)} color={colors.primary} variant="Linear" />
          <TextInput
            ref={searchInputRef}
            style={[styles.searchInput, { color: colors.text }]}
            placeholder={t('marketplace.searchPlaceholderInStore')}
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            multiline={false}
            numberOfLines={1}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            onSubmitEditing={handleSearch}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <CloseCircle size={scale(20)} color={colors.textSecondary} variant="Linear" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.contentContainer}
        contentContainerStyle={{
          paddingBottom: insets.bottom + moderateVerticalScale(20),
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={Keyboard.dismiss}
      >
        {/* Recommendations - same section style as SearchScreen */}
        {recommendations.length > 0 && (
          <View style={[styles.section, { marginTop: moderateVerticalScale(16) }]}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Chart size={scale(20)} color={colors.primary} variant="Linear" />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  {t('search.recommendations') || 'Rekomendasi Pencarian'}
                </Text>
              </View>
            </View>
            <View style={styles.recommendationsContainer}>
              {recommendations.map((category, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.recommendationItem, { backgroundColor: colors.primaryLight || colors.surface }]}
                  onPress={() => handleRecommendationPress(category)}
                >
                  <Text style={[styles.recommendationText, { color: colors.primary }]}>{category}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(12),
  },
  backButton: {
    padding: scale(4),
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(12),
    height: scale(40),
    borderRadius: scale(20),
  },
  searchInput: {
    flex: 1,
    marginLeft: scale(8),
    fontFamily: FontFamily.monasans.regular,
    fontSize: getResponsiveFontSize('small'),
  },
  clearButton: {
    padding: scale(4),
  },
  contentContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  section: {
    paddingHorizontal: getHorizontalPadding(),
    marginBottom: moderateVerticalScale(24),
    marginTop: moderateVerticalScale(16),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateVerticalScale(12),
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
  },
  sectionTitle: {
    fontSize: getResponsiveFontSize('large'),
    fontFamily: FontFamily.monasans.semiBold,
  },
  recommendationsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scale(8),
  },
  recommendationItem: {
    paddingHorizontal: scale(16),
    paddingVertical: moderateVerticalScale(8),
    borderRadius: scale(20),
    borderWidth: 1,
    borderColor: 'transparent',
  },
  recommendationText: {
    fontSize: getResponsiveFontSize('medium'),
    fontFamily: FontFamily.monasans.medium,
  },
});

export default StoreProductSearchScreen;
