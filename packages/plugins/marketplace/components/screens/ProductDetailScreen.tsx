/**
 * ProductDetailScreen Component
 * Display product detail with add to cart functionality
 */

import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  Animated,
  Easing,
  RefreshControl,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import {
  Heart,
  ShoppingCart,
  Star1,
  Shop,
  Add,
  Minus,
  CloseCircle,
} from 'iconsax-react-nativejs';
import { scale, moderateVerticalScale, getHorizontalPadding, FontFamily, ScreenHeader, BottomSheet } from '@core/config';
import { useTheme } from '@core/theme';
import { useTranslation } from '@core/i18n';
import { useMarketplaceCart } from '../../hooks/useMarketplaceCart';
import { useMarketplaceWishlist } from '../../hooks/useMarketplaceWishlist';
import { getAllStores } from '../../hooks/useMarketplaceData';

const PRODUCT_PLACEHOLDER_400 =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><rect fill="#CCCCCC" width="400" height="400"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#666" font-size="24" font-family="sans-serif">Product</text></svg>'
  );
import type { Product } from '../shared/ProductCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type ProductDetailRouteParams = {
  ProductDetail: {
    product: Product;
  };
};

type ProductReview = {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
  createdAtTs?: number;
  images?: string[];
};

type DraftReviewImage = {
  id: string;
  localUri: string;
  uploadedUri: string | null;
  isUploading: boolean;
};

const REVIEW_PREVIEW_COUNT = 3;
const DAY_MS = 24 * 60 * 60 * 1000;

const formatPrice = (price: number): string => {
  return `Rp ${price.toLocaleString('id-ID')}`;
};

const createMockReviews = (productId: string): ProductReview[] => {
  const now = Date.now();
  return [
    {
      id: `${productId}-review-1`,
      userName: 'Budi',
      rating: 5,
      comment: 'Barang sesuai deskripsi, packing rapi dan pengiriman cepat.',
      createdAt: '2 hari lalu',
      createdAtTs: now - 2 * DAY_MS,
    },
    {
      id: `${productId}-review-2`,
      userName: 'Sinta',
      rating: 4,
      comment: 'Kualitas bagus, cuma warna sedikit beda dari foto.',
      createdAt: '5 hari lalu',
      createdAtTs: now - 5 * DAY_MS,
    },
    {
      id: `${productId}-review-3`,
      userName: 'Rafi',
      rating: 5,
      comment: 'Seller responsif dan produk berfungsi dengan baik.',
      createdAt: '1 minggu lalu',
      createdAtTs: now - 7 * DAY_MS,
    },
  ];
};

export const ProductDetailScreen: React.FC = () => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<ProductDetailRouteParams, 'ProductDetail'>>();
  const insets = useSafeAreaInsets();
  const horizontalPadding = getHorizontalPadding();

  const product = route.params?.product;
  const { addItem, itemCount } = useMarketplaceCart();
  const { isFavorite, toggleFavorite } = useMarketplaceWishlist();

  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageErrorMap, setImageErrorMap] = useState<Record<number, boolean>>({});
  const [reviews, setReviews] = useState<ProductReview[]>(() => createMockReviews(product?.id ?? 'product'));
  const [draftRating, setDraftRating] = useState(0);
  const [draftComment, setDraftComment] = useState('');
  const [draftImages, setDraftImages] = useState<DraftReviewImage[]>([]);
  const [showReviewSheet, setShowReviewSheet] = useState(false);

  // Animation state
  const [isAnimating, setIsAnimating] = useState(false);
  const animValue = useRef(new Animated.Value(0)).current;
  const cartIconRef = useRef<View>(null);
  const addToCartButtonRef = useRef<View>(null);
  const galleryScrollRef = useRef<ScrollView>(null);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [endPos, setEndPos] = useState({ x: SCREEN_WIDTH - scale(50), y: scale(50) }); // Default heuristic

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Simulate data refresh
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  }, []);

  // Check if store is open
  const store = product?.storeName
    ? getAllStores().find((s) => s.name === product.storeName)
    : null;
  const isStoreOpen = store?.isOpen ?? true;

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleCartPress = useCallback(() => {
    // @ts-ignore
    navigation.navigate('Cart');
  }, [navigation]);

  const startAddToCartAnimation = useCallback(
    (callback: () => void) => {
      setIsAnimating(true);
      animValue.setValue(0);

      Animated.timing(animValue, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
        easing: Easing.bezier(0.2, 0.8, 0.2, 1),
      }).start(() => {
        setIsAnimating(false);
        callback();
      });
    },
    [animValue]
  );

  const handleAddToCart = useCallback(() => {
    if (product && addToCartButtonRef.current) {
      // Measure button position for animation start
      addToCartButtonRef.current.measureInWindow((x, y, width, height) => {
        setStartPos({ x: x + width / 2, y: y });

        startAddToCartAnimation(() => {
          addItem(product, quantity);
          setQuantity(1);
        });
      });
    } else if (product) {
      // Fallback if measurement fails or not ready
      addItem(product, quantity);
      setQuantity(1);
    }
  }, [product, quantity, addItem, startAddToCartAnimation]);

  const handleBuyNow = useCallback(() => {
    if (product) {
      // @ts-ignore
      navigation.navigate('Checkout', { product, quantity });
    }
  }, [product, quantity, navigation]);

  const incrementQuantity = useCallback(() => {
    setQuantity((prev) => prev + 1);
  }, []);

  const decrementQuantity = useCallback(() => {
    setQuantity((prev) => (prev > 1 ? prev - 1 : 1));
  }, []);

  if (!product) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>
          {t('marketplace.productNotFound') || 'Product not found'}
        </Text>
      </View>
    );
  }

  const discountPercentage =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : null;
  const averageRating = useMemo(() => {
    if (!reviews.length) return product.rating ?? 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return sum / reviews.length;
  }, [reviews, product.rating]);
  const visibleReviews = useMemo(() => reviews.slice(0, REVIEW_PREVIEW_COUNT), [reviews]);
  const galleryImages = useMemo(() => {
    const images = (product.images ?? []).filter(Boolean);
    if (product.imageUrl && !images.includes(product.imageUrl)) {
      images.unshift(product.imageUrl);
    }
    return images.length ? images : [PRODUCT_PLACEHOLDER_400];
  }, [product.images, product.imageUrl]);

  const resolveImageUri = useCallback(
    (uri: string | undefined, index: number) => {
      if (!uri || imageErrorMap[index]) return PRODUCT_PLACEHOLDER_400;
      return uri;
    },
    [imageErrorMap]
  );

  const handleImageError = useCallback((index: number) => {
    setImageErrorMap((prev) => {
      if (prev[index]) return prev;
      return { ...prev, [index]: true };
    });
  }, []);

  const handleGalleryScrollEnd = useCallback(
    (event: any) => {
      const offsetX: number = event.nativeEvent.contentOffset.x ?? 0;
      const nextIndex = Math.round(offsetX / SCREEN_WIDTH);
      const bounded = Math.max(0, Math.min(nextIndex, galleryImages.length - 1));
      if (bounded !== currentImageIndex) {
        setCurrentImageIndex(bounded);
      }
    },
    [currentImageIndex, galleryImages.length]
  );

  const handleThumbnailPress = useCallback((index: number) => {
    setCurrentImageIndex(index);
    galleryScrollRef.current?.scrollTo({ x: SCREEN_WIDTH * index, animated: true });
  }, []);
  const handleViewAllReviews = useCallback(() => {
    (navigation as any).navigate('ProductReviews', {
      productName: product?.name ?? 'Produk',
      averageRating,
      reviews,
    });
  }, [navigation, product?.name, averageRating, reviews]);

  const handleVisitStore = useCallback(() => {
    if (store) {
      (navigation as any).navigate('StoreDetail', { store });
    }
  }, [navigation, store]);

  const handlePickReviewImages = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          t('profile.mediaLibraryPermissionRequired') || 'Izin Galeri Diperlukan',
          t('profile.mediaLibraryPermissionMessage') || 'Aplikasi memerlukan izin untuk mengakses galeri.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.length) {
        const pickedUris = result.assets
          .map((asset) => asset.uri)
          .filter((uri): uri is string => !!uri);
        if (pickedUris.length) {
          const uploadBatchId = Date.now();
          const draftBatch: DraftReviewImage[] = pickedUris.map((uri, index) => ({
            id: `${uploadBatchId}-${index}`,
            localUri: uri,
            uploadedUri: null,
            isUploading: true,
          }));

          setDraftImages((prev) => [...prev, ...draftBatch]);

          // Dummy upload simulation. Keep local preview and set fake uploaded URL after delay.
          draftBatch.forEach((draft, index) => {
            const delay = 500 + index * 200;
            setTimeout(() => {
              setDraftImages((prev) =>
                prev.map((item) =>
                  item.id === draft.id
                    ? {
                        ...item,
                        isUploading: false,
                        uploadedUri: `https://picsum.photos/seed/review-${draft.id}/800/800`,
                      }
                    : item
                )
              );
            }, delay);
          });
        }
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : t('profile.imagePickerError') || 'Terjadi kesalahan saat memilih foto.';
      Alert.alert(t('common.error') || 'Error', message);
    }
  }, [t]);

  const handleRemoveDraftImage = useCallback((idToRemove: string) => {
    setDraftImages((prev) => prev.filter((image) => image.id !== idToRemove));
  }, []);

  const handleSubmitReview = useCallback(() => {
    if (draftRating < 1) {
      Alert.alert(t('marketplace.reviewRatingRequired'), t('marketplace.reviewRatingRequiredMessage'));
      return;
    }

    const isAnyImageUploading = draftImages.some((image) => image.isUploading);
    if (isAnyImageUploading) {
      Alert.alert(t('marketplace.reviewUploadInProgress'), t('marketplace.reviewUploadMessage'));
      return;
    }

    const newReview: ProductReview = {
      id: `${product.id}-review-${Date.now()}`,
      userName: 'Anda',
      rating: draftRating,
      comment: draftComment.trim() || 'Tidak ada komentar tambahan.',
      createdAt: 'Baru saja',
      createdAtTs: Date.now(),
      images: draftImages.map((image) => image.uploadedUri || image.localUri),
    };

    setReviews((prev) => [newReview, ...prev]);
    setDraftRating(0);
    setDraftComment('');
    setDraftImages([]);
    setShowReviewSheet(false);
    Alert.alert(t('marketplace.reviewThankYou'), t('marketplace.reviewSubmitSuccess'));
  }, [draftRating, draftComment, draftImages, product.id, t]);

  useEffect(() => {
    if (currentImageIndex >= galleryImages.length) {
      setCurrentImageIndex(0);
    }
  }, [currentImageIndex, galleryImages.length]);

  const selectedImageUri = resolveImageUri(galleryImages[currentImageIndex], currentImageIndex);

  // Interpolate animation values
  const translateX = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, endPos.x - startPos.x],
  });

  const translateY = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, endPos.y - startPos.y],
  });

  const scaleAnim = animValue.interpolate({
    inputRange: [0, 0.8, 1],
    outputRange: [1, 0.2, 0.1],
  });

  const opacityAnim = animValue.interpolate({
    inputRange: [0, 0.9, 1],
    outputRange: [1, 0.5, 0],
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title={t('marketplace.productDetail')}
        onBackPress={handleBack}
        rightComponent={
          <View style={styles.headerRightRow}>
            {product && (
              <TouchableOpacity
                onPress={() => toggleFavorite(product)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={styles.headerButton}
              >
                <Heart
                  size={scale(24)}
                  color={isFavorite(product.id) ? (colors.error ?? '#E53935') : colors.text}
                  variant={isFavorite(product.id) ? 'Bold' : 'Linear'}
                />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              ref={cartIconRef}
              onPress={handleCartPress}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.headerButton}
            >
              <ShoppingCart size={scale(24)} color={colors.text} variant="Linear" />
              {itemCount > 0 && (
                <View style={[styles.cartBadge, { backgroundColor: colors.error }]}>
                  <Text style={styles.cartBadgeText}>{itemCount > 99 ? '99+' : itemCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        }
        style={{ paddingTop: insets.top + moderateVerticalScale(8), backgroundColor: colors.surface }}
        paddingHorizontal={horizontalPadding}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Product Image Gallery */}
        <View style={styles.imageContainer}>
          <ScrollView
            ref={galleryScrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleGalleryScrollEnd}
            style={styles.imageGallery}
          >
            {galleryImages.map((imageUri, index) => (
              <Image
                key={`${imageUri}-${index}`}
                source={{ uri: resolveImageUri(imageUri, index) }}
                style={styles.productImage}
                resizeMode="cover"
                onError={() => handleImageError(index)}
              />
            ))}
          </ScrollView>

          {discountPercentage && (
            <View style={[styles.discountBadge, { backgroundColor: colors.error }]}>
              <Text style={styles.discountText}>
                {discountPercentage}% {t('marketplace.off')}
              </Text>
            </View>
          )}

          {galleryImages.length > 1 && (
            <View style={[styles.imageCountBadge, { backgroundColor: colors.surface + 'CC' }]}>
              <Text style={[styles.imageCountText, { color: colors.text }]}>
                {currentImageIndex + 1}/{galleryImages.length}
              </Text>
            </View>
          )}
        </View>

        {galleryImages.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.thumbnailScroll}
            contentContainerStyle={[styles.thumbnailTrack, { paddingHorizontal: horizontalPadding }]}
          >
            {galleryImages.map((imageUri, index) => {
              const selected = index === currentImageIndex;
              return (
                <TouchableOpacity
                  key={`thumb-${imageUri}-${index}`}
                  style={[
                    styles.thumbnailItem,
                    {
                      borderColor: selected ? colors.primary : colors.border,
                    },
                  ]}
                  activeOpacity={0.8}
                  onPress={() => handleThumbnailPress(index)}
                >
                  <Image
                    source={{ uri: resolveImageUri(imageUri, index) }}
                    style={styles.thumbnailImage}
                    resizeMode="cover"
                    onError={() => handleImageError(index)}
                  />
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* Product Info */}
        <View style={[styles.infoContainer, { paddingHorizontal: horizontalPadding }]}>
          {/* Price Section */}
          <View style={styles.priceSection}>
            <Text style={[styles.price, { color: colors.primary }]}>
              {formatPrice(product.price)}
            </Text>
            {product.originalPrice && product.originalPrice > product.price && (
              <Text style={[styles.originalPrice, { color: colors.textSecondary }]}>
                {formatPrice(product.originalPrice)}
              </Text>
            )}
          </View>

          {/* Product Name */}
          <Text style={[styles.productName, { color: colors.text }]}>{product.name}</Text>

          {/* Rating & Sold */}
          <View style={styles.metaRow}>
            {(averageRating > 0 || reviews.length > 0) && (
              <View style={styles.ratingContainer}>
                <Star1 size={scale(16)} color={colors.warning} variant="Bold" />
                <Text style={[styles.ratingText, { color: colors.text }]}>
                  {averageRating.toFixed(1)}
                </Text>
              </View>
            )}
            {product.sold !== undefined && (
              <Text style={[styles.soldText, { color: colors.textSecondary }]}>
                {product.sold > 1000 ? `${(product.sold / 1000).toFixed(1)}rb` : product.sold}{' '}
                {t('marketplace.sold')}
              </Text>
            )}
          </View>

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Store Info */}
          {product.storeName && (
            <View style={styles.storeSection}>
              <View style={[styles.storeIcon, { backgroundColor: colors.primaryLight }]}>
                <Shop size={scale(20)} color={colors.primary} variant="Bold" />
              </View>
              <View style={styles.storeInfo}>
                <View style={styles.storeNameRow}>
                  <Text style={[styles.storeName, { color: colors.text }]}>
                    {product.storeName}
                  </Text>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: isStoreOpen ? colors.success + '20' : colors.error + '20',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        { color: isStoreOpen ? colors.success : colors.error },
                      ]}
                    >
                      {isStoreOpen
                        ? t('marketplace.storeOpen') || 'Buka'
                        : t('marketplace.storeClosed') || 'Tutup'}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.storeLocation, { color: colors.textSecondary }]}>{t('marketplace.storeLocationDefault')}</Text>
              </View>
              {store && (
                <TouchableOpacity
                  style={[styles.visitStoreButton, { backgroundColor: colors.primary }]}
                  onPress={handleVisitStore}
                  activeOpacity={0.8}
                >
                  <Text style={styles.visitStoreButtonText}>
                    {t('marketplace.visitStore') || 'Kunjungi'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Store Closed Banner */}
          {!isStoreOpen && (
            <View
              style={[
                styles.closedBanner,
                { backgroundColor: colors.error + '15', borderColor: colors.error },
              ]}
            >
              <Text style={[styles.closedBannerText, { color: colors.error }]}>
                {t('marketplace.storeClosedMessage') ||
                  'Toko ini sedang tutup dan tidak dapat menerima pesanan saat ini.'}
              </Text>
            </View>
          )}

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Description */}
          <View style={styles.descriptionSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t('marketplace.description')}
            </Text>
            <Text style={[styles.descriptionText, { color: colors.textSecondary }]}>
              {product.description || t('marketplace.descriptionDefault')}
            </Text>
          </View>

          {/* Product Detail */}
          <View style={styles.detailSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t('marketplace.productDetail') || 'Detail Produk'}
            </Text>
            <View
              style={[
                styles.detailCard,
                { borderColor: colors.border, backgroundColor: colors.background },
              ]}
            >
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{t('marketplace.detailRating')}</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {averageRating > 0 ? `${averageRating.toFixed(1)} / 5` : '-'}
                </Text>
              </View>
              <View style={[styles.detailRow, styles.detailRowDivider, { borderTopColor: colors.border }]}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{t('marketplace.detailSold')}</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {product.sold !== undefined
                    ? product.sold > 1000
                      ? `${(product.sold / 1000).toFixed(1)}rb`
                      : `${product.sold}`
                    : '-'}
                </Text>
              </View>
              <View style={[styles.detailRow, styles.detailRowDivider, { borderTopColor: colors.border }]}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{t('marketplace.detailStock')}</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {product.stock !== undefined ? `${product.stock}` : '-'}
                </Text>
              </View>
            </View>
          </View>

          {/* User Reviews */}
          <View style={styles.reviewSection}>
            <View style={styles.reviewHeaderRow}>
              <Text style={[styles.sectionTitle, styles.reviewSectionTitle, { color: colors.text }]}>
                Ulasan Pengguna
              </Text>
              <TouchableOpacity onPress={handleViewAllReviews} activeOpacity={0.8}>
                <Text style={[styles.reviewSeeAllText, { color: colors.primary }]}>{t('marketplace.reviewSeeAll')}</Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.reviewSummaryCard, { borderColor: colors.border, backgroundColor: colors.background }]}>
              <Text style={[styles.reviewSummaryScore, { color: colors.primary }]}>
                {averageRating > 0 ? averageRating.toFixed(1) : '-'}
              </Text>
              <Text style={[styles.reviewSummaryText, { color: colors.textSecondary }]}>
                dari {reviews.length} ulasan
              </Text>
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
            </View>

            <TouchableOpacity
              style={[styles.reviewOpenSheetButton, { backgroundColor: colors.primary }]}
              onPress={() => setShowReviewSheet(true)}
              activeOpacity={0.85}
            >
              <Text style={styles.reviewOpenSheetButtonText}>{t('marketplace.reviewAddRating')}</Text>
            </TouchableOpacity>
          </View>

          {/* Category */}
          {product.category && (
            <View style={styles.categorySection}>
              <Text style={[styles.categoryLabel, { color: colors.textSecondary }]}>
                {t('marketplace.category')}:
              </Text>
              <View style={[styles.categoryBadge, { backgroundColor: colors.primaryLight }]}>
                <Text style={[styles.categoryText, { color: colors.primary }]}>
                  {product.category}
                </Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      <BottomSheet
        visible={showReviewSheet}
        onClose={() => setShowReviewSheet(false)}
        snapPoints={[100]}
        initialSnapPoint={0}
      >
        <View style={[styles.reviewSheetContent, { paddingHorizontal: horizontalPadding }]}>
          <View style={styles.reviewSheetHeader}>
            <Text style={[styles.sheetTitle, { color: colors.text }]}>{t('marketplace.reviewAddRating')}</Text>
            <TouchableOpacity
              onPress={() => setShowReviewSheet(false)}
              style={[styles.reviewSheetHeaderClose]}
              activeOpacity={0.8}
            >
              <CloseCircle size={scale(20)} color={colors.text} variant="Linear" />
            </TouchableOpacity>
          </View>
          <View style={[styles.reviewFormCard, { borderColor: colors.border, backgroundColor: colors.background }]}>
            <Text style={[styles.reviewFormTitle, { color: colors.text }]}>{t('marketplace.reviewSelectRating')}</Text>
            <View style={styles.reviewRatingPicker}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setDraftRating(star)}
                  activeOpacity={0.8}
                  style={styles.reviewStarButton}
                >
                  <Text
                    style={[
                      styles.reviewStarText,
                      { color: star <= draftRating ? colors.warning : colors.border },
                    ]}
                  >
                    ★
                  </Text>
                </TouchableOpacity>
                ))}
            </View>
            <TouchableOpacity
              style={[styles.reviewPickImageButton, { borderColor: colors.border, backgroundColor: colors.surface }]}
              onPress={handlePickReviewImages}
              activeOpacity={0.8}
            >
              <Text style={[styles.reviewPickImageButtonText, { color: colors.text }]}>
                {t('marketplace.reviewAddPhoto')}
              </Text>
            </TouchableOpacity>
            {!!draftImages.length && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.reviewImageScroll}
                contentContainerStyle={styles.reviewImageTrack}
              >
                {draftImages.map((draft) => (
                  <View key={draft.id} style={styles.reviewDraftImageWrap}>
                    <Image source={{ uri: draft.localUri }} style={styles.reviewImage} resizeMode="cover" />
                    {draft.isUploading && (
                      <View style={styles.reviewDraftUploadingOverlay}>
                        <ActivityIndicator size="small" color="#FFFFFF" />
                        <Text style={styles.reviewDraftUploadingText}>{t('marketplace.reviewUploading')}</Text>
                      </View>
                    )}
                    <TouchableOpacity
                      style={[styles.reviewDraftRemoveButton, { backgroundColor: colors.error }]}
                      onPress={() => handleRemoveDraftImage(draft.id)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.reviewDraftRemoveButtonText}>×</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}
            <TextInput
              style={[
                styles.reviewInput,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                  color: colors.text,
                },
              ]}
              multiline
              placeholder={t('marketplace.reviewPlaceholder')}
              placeholderTextColor={colors.textSecondary}
              value={draftComment}
              onChangeText={setDraftComment}
            />
          </View>
          <TouchableOpacity
            style={[styles.reviewSubmitButton, { backgroundColor: colors.primary, marginTop: scale(12) }]}
            onPress={handleSubmitReview}
            activeOpacity={0.8}
          >
            <Text style={styles.reviewSubmitButtonText}>{t('marketplace.reviewSubmit')}</Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>

      {/* Bottom Bar */}
      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: colors.surface,
            paddingBottom: insets.bottom + moderateVerticalScale(12),
            paddingHorizontal: horizontalPadding,
          },
        ]}
      >
        {/* Quantity Selector */}
        <View style={styles.quantityContainer}>
          <TouchableOpacity
            style={[styles.quantityButton, { backgroundColor: colors.primaryLight }]}
            onPress={decrementQuantity}
          >
            <Minus size={scale(18)} color={colors.primary} variant="Linear" />
          </TouchableOpacity>
          <Text style={[styles.quantityText, { color: colors.text }]}>{quantity}</Text>
          <TouchableOpacity
            style={[styles.quantityButton, { backgroundColor: colors.primaryLight }]}
            onPress={incrementQuantity}
          >
            <Add size={scale(18)} color={colors.primary} variant="Linear" />
          </TouchableOpacity>
        </View>

        {/* Action Buttons Container */}
        <View style={styles.actionButtonsContainer}>
          {/* Add to Cart Button */}
          <TouchableOpacity
            ref={addToCartButtonRef}
            style={[
              styles.actionButton,
              styles.cartButtonOutline,
              {
                borderColor: isStoreOpen ? colors.primary : colors.border,
                opacity: isStoreOpen ? 1 : 0.5,
              },
            ]}
            onPress={handleAddToCart}
            activeOpacity={0.8}
            disabled={!isStoreOpen}
          >
            <ShoppingCart
              size={scale(20)}
              color={isStoreOpen ? colors.primary : colors.textSecondary}
              variant="Bold"
            />
          </TouchableOpacity>

          {/* Buy Now Button */}
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.buyButton,
              {
                backgroundColor: isStoreOpen ? colors.primary : colors.border,
              },
            ]}
            onPress={handleBuyNow}
            activeOpacity={0.8}
            disabled={!isStoreOpen}
          >
            <Text
              style={[
                styles.buyButtonText,
                { color: isStoreOpen ? '#FFFFFF' : colors.textSecondary },
              ]}
            >
              {t('marketplace.buyNow')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Flying Item Animation Layer */}
      {isAnimating && (
        <Animated.View
          style={[
            styles.flyingItem,
            {
              top: startPos.y,
              left: startPos.x,
              transform: [{ translateX }, { translateY }, { scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          <Image
            source={{
              uri: selectedImageUri,
            }}
            style={styles.flyingImage}
            resizeMode="cover"
          />
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
  },
  headerButton: {
    padding: scale(4),
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    zIndex: 1000,
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: scale(18),
    fontFamily: FontFamily.monasans.semiBold,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: moderateVerticalScale(20),
  },
  imageContainer: {
    width: SCREEN_WIDTH,
    aspectRatio: 1,
    position: 'relative',
  },
  imageGallery: {
    width: '100%',
    height: '100%',
  },
  productImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
  },
  imageCountBadge: {
    position: 'absolute',
    right: scale(12),
    bottom: scale(12),
    borderRadius: scale(999),
    paddingHorizontal: scale(10),
    paddingVertical: scale(4),
  },
  imageCountText: {
    fontSize: scale(11),
    fontFamily: FontFamily.monasans.semiBold,
  },
  thumbnailScroll: {
    marginTop: scale(10),
  },
  thumbnailTrack: {
    gap: scale(8),
    paddingVertical: scale(2),
  },
  thumbnailItem: {
    width: scale(64),
    height: scale(64),
    borderRadius: scale(10),
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  discountBadge: {
    position: 'absolute',
    top: scale(16),
    left: scale(16),
    paddingHorizontal: scale(12),
    paddingVertical: scale(6),
    borderRadius: scale(8),
  },
  discountText: {
    fontSize: scale(12),
    fontFamily: FontFamily.monasans.bold,
    color: '#FFFFFF',
  },
  infoContainer: {
    paddingTop: moderateVerticalScale(16),
  },
  priceSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(10),
    marginBottom: scale(8),
  },
  price: {
    fontSize: scale(24),
    fontFamily: FontFamily.monasans.bold,
  },
  originalPrice: {
    fontSize: scale(16),
    fontFamily: FontFamily.monasans.regular,
    textDecorationLine: 'line-through',
  },
  productName: {
    fontSize: scale(18),
    fontFamily: FontFamily.monasans.semiBold,
    lineHeight: scale(26),
    marginBottom: scale(12),
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(16),
    marginBottom: moderateVerticalScale(16),
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(4),
  },
  ratingText: {
    fontSize: scale(14),
    fontFamily: FontFamily.monasans.semiBold,
  },
  soldText: {
    fontSize: scale(14),
    fontFamily: FontFamily.monasans.regular,
  },
  divider: {
    height: 1,
    marginVertical: moderateVerticalScale(16),
  },
  storeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(12),
  },
  storeIcon: {
    width: scale(48),
    height: scale(48),
    borderRadius: scale(24),
    justifyContent: 'center',
    alignItems: 'center',
  },
  storeInfo: {
    flex: 1,
  },
  storeName: {
    fontSize: scale(15),
    fontFamily: FontFamily.monasans.semiBold,
    marginBottom: scale(2),
  },
  storeLocation: {
    fontSize: scale(13),
    fontFamily: FontFamily.monasans.regular,
  },
  storeNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
    marginBottom: scale(2),
  },
  statusBadge: {
    paddingHorizontal: scale(8),
    paddingVertical: scale(2),
    borderRadius: scale(8),
  },
  statusText: {
    fontSize: scale(11),
    fontFamily: FontFamily.monasans.medium,
  },
  visitStoreButton: {
    paddingVertical: scale(8),
    paddingHorizontal: scale(16),
    borderRadius: scale(8),
    alignSelf: 'flex-start',
  },
  visitStoreButtonText: {
    fontSize: scale(13),
    fontFamily: FontFamily.monasans.semiBold,
    color: '#FFFFFF',
  },
  closedBanner: {
    marginTop: moderateVerticalScale(12),
    padding: scale(12),
    borderRadius: scale(8),
    borderWidth: 1,
  },
  closedBannerText: {
    fontSize: scale(13),
    fontFamily: FontFamily.monasans.medium,
    textAlign: 'center',
  },
  descriptionSection: {
    marginBottom: moderateVerticalScale(16),
  },
  detailSection: {
    marginBottom: moderateVerticalScale(16),
  },
  reviewSection: {
    marginBottom: moderateVerticalScale(16),
  },
  detailCard: {
    borderWidth: 1,
    borderRadius: scale(12),
    paddingHorizontal: scale(12),
    paddingVertical: scale(6),
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: scale(8),
  },
  detailRowDivider: {
    borderTopWidth: 1,
  },
  detailLabel: {
    fontSize: scale(13),
    fontFamily: FontFamily.monasans.regular,
  },
  detailValue: {
    fontSize: scale(13),
    fontFamily: FontFamily.monasans.semiBold,
  },
  reviewSummaryCard: {
    borderWidth: 1,
    borderRadius: scale(12),
    paddingVertical: scale(12),
    alignItems: 'center',
    marginBottom: scale(12),
  },
  reviewSummaryScore: {
    fontSize: scale(24),
    fontFamily: FontFamily.monasans.bold,
  },
  reviewSummaryText: {
    fontSize: scale(12),
    fontFamily: FontFamily.monasans.regular,
    marginTop: scale(2),
  },
  reviewHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: scale(8),
  },
  reviewSectionTitle: {
    marginBottom: 0,
  },
  reviewSeeAllText: {
    fontSize: scale(12),
    fontFamily: FontFamily.monasans.semiBold,
  },
  reviewList: {
    gap: scale(8),
    marginBottom: scale(12),
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
  reviewFormCard: {
    borderWidth: 1,
    borderRadius: scale(12),
    padding: scale(12),
    marginBottom: scale(40),
  },
  reviewOpenSheetButton: {
    borderRadius: scale(10),
    paddingVertical: scale(11),
    alignItems: 'center',
  },
  reviewOpenSheetButtonText: {
    color: '#FFFFFF',
    fontSize: scale(13),
    fontFamily: FontFamily.monasans.bold,
  },
  reviewSheetContent: {
    paddingTop: scale(12),
    paddingBottom: scale(24),
  },
  reviewSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: scale(12),
    marginTop: scale(8),
  },
  reviewSheetHeaderClose: {
    width: scale(32),
    height: scale(32),
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewSheetHeaderCloseText: {
    fontSize: scale(20),
    lineHeight: scale(20),
    fontFamily: FontFamily.monasans.bold,
  },
  reviewFormTitle: {
    fontSize: scale(14),
    fontFamily: FontFamily.monasans.semiBold,
    marginBottom: scale(8),
  },
  reviewRatingPicker: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scale(10),
  },
  reviewStarButton: {
    marginHorizontal: scale(4),
  },
  reviewStarText: {
    fontSize: scale(28),
  },
  reviewPickImageButton: {
    borderWidth: 1,
    borderRadius: scale(10),
    paddingVertical: scale(10),
    alignItems: 'center',
    marginBottom: scale(10),
  },
  reviewPickImageButtonText: {
    fontSize: scale(13),
    fontFamily: FontFamily.monasans.semiBold,
  },
  reviewImageScroll: {
    marginBottom: scale(10),
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
  reviewDraftImageWrap: {
    position: 'relative',
  },
  reviewDraftUploadingOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderRadius: scale(8),
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(4),
  },
  reviewDraftUploadingText: {
    color: '#FFFFFF',
    fontSize: scale(10),
    fontFamily: FontFamily.monasans.medium,
  },
  reviewDraftRemoveButton: {
    position: 'absolute',
    right: -scale(6),
    top: -scale(6),
    width: scale(18),
    height: scale(18),
    borderRadius: scale(9),
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewDraftRemoveButtonText: {
    color: '#FFFFFF',
    fontSize: scale(14),
    lineHeight: scale(14),
    fontFamily: FontFamily.monasans.bold,
  },
  reviewInput: {
    borderWidth: 1,
    borderRadius: scale(10),
    minHeight: scale(84),
    paddingHorizontal: scale(10),
    paddingVertical: scale(8),
    textAlignVertical: 'top',
    fontSize: scale(13),
    fontFamily: FontFamily.monasans.regular,
    marginBottom: scale(10),
  },
  reviewSubmitButton: {
    position: 'absolute',
    bottom: scale(12),
    left: scale(12),
    right: scale(12),
    borderRadius: scale(10),
    paddingVertical: scale(11),
    alignItems: 'center',
  },
  reviewSubmitButtonText: {
    color: '#FFFFFF',
    fontSize: scale(13),
    fontFamily: FontFamily.monasans.bold,
  },
  reviewSheetCloseButton: {
    marginTop: scale(12),
    borderWidth: 1,
    borderRadius: scale(10),
    paddingVertical: scale(11),
    alignItems: 'center',
  },
  reviewSheetCloseButtonText: {
    fontSize: scale(13),
    fontFamily: FontFamily.monasans.semiBold,
  },
  sheetTitle: {
    fontSize: scale(18),
    fontFamily: FontFamily.monasans.bold,
  },
  sectionTitle: {
    fontSize: scale(16),
    fontFamily: FontFamily.monasans.bold,
    marginBottom: scale(8),
  },
  descriptionText: {
    fontSize: scale(14),
    fontFamily: FontFamily.monasans.regular,
    lineHeight: scale(22),
  },
  categorySection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
  },
  categoryLabel: {
    fontSize: scale(14),
    fontFamily: FontFamily.monasans.regular,
  },
  categoryBadge: {
    paddingHorizontal: scale(12),
    paddingVertical: scale(6),
    borderRadius: scale(16),
  },
  categoryText: {
    fontSize: scale(13),
    fontFamily: FontFamily.monasans.medium,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: moderateVerticalScale(12),
    gap: scale(12),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
  },
  quantityButton: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(8),
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: scale(16),
    fontFamily: FontFamily.monasans.bold,
    minWidth: scale(24),
    textAlign: 'center',
  },
  actionButtonsContainer: {
    flex: 1,
    flexDirection: 'row',
    gap: scale(8),
    marginLeft: scale(8),
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: moderateVerticalScale(10),
    borderRadius: scale(10),
  },
  cartButtonOutline: {
    flex: 0.4,
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  addToCartText: {
    fontSize: scale(14),
    fontFamily: FontFamily.monasans.bold,
  },
  buyButton: {
    flex: 1,
  },
  buyButtonText: {
    fontSize: scale(14),
    fontFamily: FontFamily.monasans.bold,
    color: '#FFFFFF',
  },
  flyingItem: {
    position: 'absolute',
    width: scale(40),
    height: scale(40),
    zIndex: 9999,
    borderRadius: scale(20),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#FFF',
  },
  flyingImage: {
    width: '100%',
    height: '100%',
  },
});

export default ProductDetailScreen;
