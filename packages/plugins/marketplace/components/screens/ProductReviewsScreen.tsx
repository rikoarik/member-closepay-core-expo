/**
 * ProductReviewsScreen
 * Menampilkan semua ulasan produk dengan filter/sort.
 */

import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { scale, moderateVerticalScale, getHorizontalPadding, FontFamily, ScreenHeader } from '@core/config';
import { useTheme } from '@core/theme';
import { useTranslation } from '@core/i18n';

type ProductReview = {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
  createdAtTs?: number;
  images?: string[];
};

type ProductReviewsRouteParams = {
  ProductReviews: {
    productName?: string;
    averageRating?: number;
    reviews?: ProductReview[];
  };
};

type SortOption = 'latest' | 'oldest' | 'highest_rating' | 'lowest_rating';
type RatingFilter = 'all' | 1 | 2 | 3 | 4 | 5;

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

const SORT_OPTIONS: Array<{ value: SortOption; label: string }> = [
  { value: 'latest', label: 'Terbaru' },
  { value: 'oldest', label: 'Terlama' },
  { value: 'highest_rating', label: 'Bintang Tertinggi' },
  { value: 'lowest_rating', label: 'Bintang Terendah' },
];

const RATING_FILTERS: Array<{ value: RatingFilter; label: string }> = [
  { value: 'all', label: 'Semua' },
  { value: 5, label: '5★' },
  { value: 4, label: '4★' },
  { value: 3, label: '3★' },
  { value: 2, label: '2★' },
  { value: 1, label: '1★' },
];

const parseRelativeLabelToTimestamp = (label: string): number => {
  const now = Date.now();
  const lower = label.toLowerCase();

  if (lower.includes('baru saja')) return now;

  const numberMatch = lower.match(/(\d+)/);
  const amount = numberMatch ? Number(numberMatch[1]) : 0;

  if (lower.includes('menit')) return now - amount * 60 * 1000;
  if (lower.includes('jam')) return now - amount * HOUR_MS;
  if (lower.includes('hari')) return now - amount * DAY_MS;
  if (lower.includes('minggu')) return now - amount * 7 * DAY_MS;
  if (lower.includes('bulan')) return now - amount * 30 * DAY_MS;
  if (lower.includes('tahun')) return now - amount * 365 * DAY_MS;

  return 0;
};

export const ProductReviewsScreen: React.FC = () => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<ProductReviewsRouteParams, 'ProductReviews'>>();
  const insets = useSafeAreaInsets();
  const horizontalPadding = getHorizontalPadding();

  const productName = route.params?.productName ?? 'Produk';
  const reviews = route.params?.reviews ?? [];
  const averageFromRoute = route.params?.averageRating ?? 0;

  const [selectedSort, setSelectedSort] = useState<SortOption>('latest');
  const [selectedRatingFilter, setSelectedRatingFilter] = useState<RatingFilter>('all');

  const averageRating = useMemo(() => {
    if (!reviews.length) return averageFromRoute;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return sum / reviews.length;
  }, [reviews, averageFromRoute]);

  const visibleReviews = useMemo(() => {
    const normalized = reviews.map((review) => ({
      ...review,
      createdAtTs: review.createdAtTs ?? parseRelativeLabelToTimestamp(review.createdAt),
    }));

    const filtered =
      selectedRatingFilter === 'all'
        ? normalized
        : normalized.filter((review) => review.rating === selectedRatingFilter);

    const sorted = [...filtered].sort((a, b) => {
      if (selectedSort === 'latest') {
        return (b.createdAtTs ?? 0) - (a.createdAtTs ?? 0);
      }
      if (selectedSort === 'oldest') {
        return (a.createdAtTs ?? 0) - (b.createdAtTs ?? 0);
      }
      if (selectedSort === 'highest_rating') {
        return b.rating - a.rating;
      }
      return a.rating - b.rating;
    });

    return sorted;
  }, [reviews, selectedSort, selectedRatingFilter]);

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title={t('marketplace.allReviews')}
        onBackPress={handleBack}
        showBorder
        style={{ paddingTop: insets.top + moderateVerticalScale(8), backgroundColor: colors.surface }}
        paddingHorizontal={horizontalPadding}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingHorizontal: horizontalPadding, paddingBottom: insets.bottom + scale(24) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.summaryCard, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <Text style={[styles.summaryProductName, { color: colors.text }]} numberOfLines={1}>
            {productName}
          </Text>
          <Text style={[styles.summaryScore, { color: colors.primary }]}>
            {averageRating > 0 ? averageRating.toFixed(1) : '-'}
          </Text>
          <Text style={[styles.summaryCount, { color: colors.textSecondary }]}>
            dari {reviews.length} ulasan
          </Text>
        </View>

        <View style={[styles.filterBlock, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <Text style={[styles.filterTitle, { color: colors.text }]}>{t('marketplace.sort')}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterTrack}
          >
            {SORT_OPTIONS.map((item) => {
              const selected = item.value === selectedSort;
              return (
                <TouchableOpacity
                  key={item.value}
                  style={[
                    styles.filterChip,
                    {
                      borderColor: selected ? colors.primary : colors.border,
                      backgroundColor: selected ? `${colors.primary}14` : colors.background,
                    },
                  ]}
                  onPress={() => setSelectedSort(item.value)}
                  activeOpacity={0.85}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      { color: selected ? colors.primary : colors.textSecondary },
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <Text style={[styles.filterTitle, styles.filterSubTitle, { color: colors.text }]}>
            Filter Bintang
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterTrack}
          >
            {RATING_FILTERS.map((item) => {
              const selected = item.value === selectedRatingFilter;
              return (
                <TouchableOpacity
                  key={String(item.value)}
                  style={[
                    styles.filterChip,
                    {
                      borderColor: selected ? colors.primary : colors.border,
                      backgroundColor: selected ? `${colors.primary}14` : colors.background,
                    },
                  ]}
                  onPress={() => setSelectedRatingFilter(item.value)}
                  activeOpacity={0.85}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      { color: selected ? colors.primary : colors.textSecondary },
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.reviewList}>
          {visibleReviews.map((review) => (
            <View
              key={review.id}
              style={[styles.reviewItem, { borderColor: colors.border, backgroundColor: colors.surface }]}
            >
              <View style={styles.reviewItemHeader}>
                <Text style={[styles.reviewUserName, { color: colors.text }]}>{review.userName}</Text>
                <Text style={[styles.reviewDate, { color: colors.textSecondary }]}>{review.createdAt}</Text>
              </View>
              <Text style={[styles.reviewStars, { color: colors.warning }]}>
                {'★'.repeat(review.rating)}
                <Text style={{ color: colors.border }}>{'★'.repeat(5 - review.rating)}</Text>
              </Text>
              <Text style={[styles.reviewComment, { color: colors.textSecondary }]}>
                {review.comment}
              </Text>
              {!!review.images?.length && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.reviewImageScroll}
                  contentContainerStyle={styles.reviewImageTrack}
                >
                  {review.images.map((uri, index) => (
                    <Image
                      key={`${review.id}-img-${index}`}
                      source={{ uri }}
                      style={styles.reviewImage}
                      resizeMode="cover"
                    />
                  ))}
                </ScrollView>
              )}
            </View>
          ))}

          {!visibleReviews.length && (
            <View style={[styles.emptyCard, { borderColor: colors.border, backgroundColor: colors.surface }]}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Tidak ada ulasan sesuai filter.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingTop: moderateVerticalScale(14),
  },
  summaryCard: {
    borderWidth: 1,
    borderRadius: scale(12),
    paddingVertical: scale(12),
    paddingHorizontal: scale(14),
    marginBottom: scale(12),
    alignItems: 'center',
  },
  summaryProductName: {
    fontSize: scale(13),
    fontFamily: FontFamily.monasans.semiBold,
    marginBottom: scale(2),
  },
  summaryScore: {
    fontSize: scale(26),
    fontFamily: FontFamily.monasans.bold,
  },
  summaryCount: {
    marginTop: scale(2),
    fontSize: scale(12),
    fontFamily: FontFamily.monasans.regular,
  },
  filterBlock: {
    borderWidth: 1,
    borderRadius: scale(12),
    padding: scale(12),
    marginBottom: scale(12),
  },
  filterTitle: {
    fontSize: scale(13),
    fontFamily: FontFamily.monasans.semiBold,
    marginBottom: scale(8),
  },
  filterSubTitle: {
    marginTop: scale(8),
  },
  filterTrack: {
    gap: scale(8),
  },
  filterChip: {
    borderWidth: 1,
    borderRadius: scale(999),
    paddingVertical: scale(7),
    paddingHorizontal: scale(12),
  },
  filterChipText: {
    fontSize: scale(12),
    fontFamily: FontFamily.monasans.semiBold,
  },
  reviewList: {
    gap: scale(8),
  },
  reviewItem: {
    borderWidth: 1,
    borderRadius: scale(10),
    padding: scale(10),
  },
  reviewItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(4),
  },
  reviewUserName: {
    fontSize: scale(13),
    fontFamily: FontFamily.monasans.semiBold,
  },
  reviewDate: {
    fontSize: scale(11),
    fontFamily: FontFamily.monasans.regular,
  },
  reviewStars: {
    fontSize: scale(14),
    marginBottom: scale(4),
  },
  reviewComment: {
    fontSize: scale(12),
    fontFamily: FontFamily.monasans.regular,
    lineHeight: scale(18),
  },
  reviewImageScroll: {
    marginTop: scale(8),
  },
  reviewImageTrack: {
    gap: scale(8),
    paddingVertical: scale(2),
  },
  reviewImage: {
    width: scale(72),
    height: scale(72),
    borderRadius: scale(8),
  },
  emptyCard: {
    borderWidth: 1,
    borderRadius: scale(10),
    paddingVertical: scale(20),
    paddingHorizontal: scale(12),
    alignItems: 'center',
  },
  emptyText: {
    fontSize: scale(12),
    fontFamily: FontFamily.monasans.regular,
    textAlign: 'center',
  },
});

export default ProductReviewsScreen;
