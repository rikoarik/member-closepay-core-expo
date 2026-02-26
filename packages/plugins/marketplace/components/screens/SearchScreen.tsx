/**
 * SearchScreen Component
 * Halaman search untuk marketplace seperti Shopee
 * Menampilkan history search dan rekomendasi
 */
import React, { useRef, useMemo } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Text, ScrollView, Keyboard, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { SearchNormal, CloseCircle, Calendar, Chart, Trash, ArrowLeft2 } from 'iconsax-react-nativejs';
import {
  scale,
  moderateVerticalScale,
  getHorizontalPadding,
  getResponsiveFontSize,
  FontFamily,
} from '@core/config';
import { useTheme } from '@core/theme';
import { useTranslation } from '@core/i18n';
import { useMarketplaceAnalytics } from '../../hooks/useMarketplaceAnalytics';
import { getCategories } from '../../hooks/useMarketplaceData';

export const SearchScreen: React.FC = () => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const horizontalPadding = getHorizontalPadding();
  const searchInputRef = useRef<TextInput>(null);

  const { searchHistory, trackSearch, clearSearchHistory, getRecommendations } = useMarketplaceAnalytics();
  const [searchQuery, setSearchQuery] = React.useState('');

  // Refresh focus on input when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }, [])
  );

  const recommendations = useMemo(() => {
    const { topCategories } = getRecommendations();
    const allCategories = getCategories().filter(c => c !== 'Semua');

    // Combine top categories tracked by user + some random ones if not enough data
    const combined = [...new Set([...topCategories, ...allCategories])].slice(0, 8);
    return combined;
  }, [getRecommendations]);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      trackSearch(searchQuery.trim());
      // @ts-ignore
      navigation.navigate('MarketplaceSearchResults' as never, { query: searchQuery.trim() } as never);
    }
  };

  const handleHistoryItemPress = (query: string) => {
    setSearchQuery(query);
    trackSearch(query);
    // @ts-ignore
    navigation.navigate('MarketplaceSearchResults' as never, { query } as never);
  };

  const handleRecommendationPress = (category: string) => {
    // When clicking a category recommendation, we search for that category
    setSearchQuery(category);
    trackSearch(category);
    // @ts-ignore
    navigation.navigate('MarketplaceSearchResults' as never, { query: category } as never);
  };

  const handleClearHistory = () => {
    Alert.alert(
      t('search.clearHistory') || 'Hapus History',
      t('search.clearHistoryConfirm') || 'Apakah Anda yakin ingin menghapus semua history pencarian?',
      [
        {
          text: t('common.cancel') || 'Batal',
          style: 'cancel',
        },
        {
          text: t('common.delete') || 'Hapus',
          style: 'destructive',
          onPress: () => clearSearchHistory(),
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Custom header: back + search bar */}
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
          onPress={() => navigation.goBack()}
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
            placeholder={t('marketplace.searchPlaceholder')}
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            multiline={false}
            numberOfLines={1}
            // @ts-ignore
            ellipsizeMode="tail"
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

      {/* Content */}
      <ScrollView
        style={styles.contentContainer}
        contentContainerStyle={{
          paddingBottom: insets.bottom + moderateVerticalScale(20),
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={Keyboard.dismiss}
      >
        {/* Search History */}
        {searchHistory.length > 0 && (
          <View style={[styles.section, { marginTop: moderateVerticalScale(16) }]}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Calendar size={scale(20)} color={colors.primary} variant="Linear" />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  {t('search.recentSearches') || 'Pencarian Terbaru'}
                </Text>
              </View>
              <TouchableOpacity onPress={handleClearHistory}>
                <Trash size={scale(18)} color={colors.textSecondary} variant="Linear" />
              </TouchableOpacity>
            </View>
            <View style={styles.historyContainer}>
              {searchHistory.map((query, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.historyItem, { backgroundColor: colors.surface }]}
                  onPress={() => handleHistoryItemPress(query)}
                >
                  <Calendar size={scale(16)} color={colors.textSecondary} variant="Linear" />
                  <Text style={[styles.historyText, { color: colors.text }]}>{query}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Recommendations */}
        <View style={styles.section}>
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
  historyContainer: {
    gap: scale(8),
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(16),
    paddingVertical: moderateVerticalScale(12),
    borderRadius: scale(12),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  historyText: {
    flex: 1,
    fontSize: getResponsiveFontSize('medium'),
    fontFamily: FontFamily.monasans.regular,
    marginLeft: scale(12),
  },
  removeHistoryButton: {
    padding: scale(4),
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