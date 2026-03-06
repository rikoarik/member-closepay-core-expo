/**
 * FnBMerchantDetailScreen Component
 * Main screen for FnB marketplace with menu grid, category tabs, and floating cart
 */

import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  Pressable,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { SearchNormal, CloseCircle, Warning2 } from "iconsax-react-nativejs";
import {
  scale,
  moderateVerticalScale,
  getHorizontalPadding,
  FontFamily,
  ScreenHeader,
  getResponsiveFontSize,
} from "@core/config";
import { useTheme } from "@core/theme";
import { useTranslation } from "@core/i18n";
import { useFnBData, useFnBCart, useFnBFavorites } from "../../hooks";
import {
  FnBItemCard,
  FnBCategoryTabs,
  FnBCartBar,
  FnBItemDetailSheet,
  FnBCartDetailSheet,
  MerchantHeader,
  FnBItemCardSkeleton,
  FnBCategoryTabsSkeleton,
  MerchantHeaderSkeleton,
} from "../shared";
import type {
  FnBItem,
  FnBVariant,
  FnBAddon,
  FnBOrderItem,
  EntryPoint,
} from "../../models";

interface CartItem extends FnBOrderItem {
  cartId: string;
}

interface FnBMerchantDetailScreenProps {
  entryPoint?: EntryPoint;
}

export const FnBMerchantDetailScreen: React.FC<
  FnBMerchantDetailScreenProps
> = ({ entryPoint = "browse" }) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const horizontalPadding = getHorizontalPadding();

  // Get params from route
  const params = route.params as
    | { entryPoint?: EntryPoint; storeId?: string; tableNumber?: string }
    | undefined;
  const activeEntryPoint = params?.entryPoint || entryPoint;
  const storeId = params?.storeId;

  // Data hooks
  const {
    filteredItems,
    categories,
    store,
    loading,
    error: dataError,
    selectedCategory,
    setSelectedCategory,
    refresh,
  } = useFnBData(activeEntryPoint, storeId);

  const {
    cartItems,
    itemCount,
    subtotal,
    addItem,
    updateQuantity,
    removeItem,
    updateItem,
    getItemQuantity,
    incrementItem,
    decrementItem,
    isStoreConflict,
    setActiveStore,
    resetAndSwitchStore,
    activeStoreName,
  } = useFnBCart(activeEntryPoint);

  const { isFavorite, toggleFavorite } = useFnBFavorites();

  // Local state
  const [refreshing, setRefreshing] = useState(false);
  const [selectedItem, setSelectedItem] = useState<FnBItem | null>(null);
  const [editingCartItem, setEditingCartItem] = useState<CartItem | null>(null);
  const [showItemDetail, setShowItemDetail] = useState(false);
  const [showCartDetail, setShowCartDetail] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [replaceCartDialog, setReplaceCartDialog] = useState<{
    item: FnBItem;
    storeId: string;
    storeName: string;
  } | null>(null);

  // Filter items based on search query
  const searchedItems = useMemo(() => {
    if (!searchQuery.trim()) return filteredItems;

    const query = searchQuery.toLowerCase().trim();
    return filteredItems.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        (item.description && item.description.toLowerCase().includes(query)),
    );
  }, [filteredItems, searchQuery]);

  // Handlers
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const handleItemPress = useCallback((item: FnBItem) => {
    setSelectedItem(item);
    setShowItemDetail(true);
  }, []);

  const handleAddItem = useCallback(
    (item: FnBItem) => {
      if (!store?.isOpen) return;
      const currentStoreId = storeId || store?.id || "";
      const currentStoreName = store?.name || "";

      // Check store conflict
      if (isStoreConflict(currentStoreId)) {
        setReplaceCartDialog({
          item,
          storeId: currentStoreId,
          storeName: currentStoreName,
        });
        return;
      }

      // Set active store if not set yet
      setActiveStore(currentStoreId, currentStoreName);

      if (item.variants && item.variants.length > 0) {
        setSelectedItem(item);
        setShowItemDetail(true);
      } else {
        incrementItem(item);
      }
    },
    [
      incrementItem,
      store?.isOpen,
      store?.id,
      store?.name,
      storeId,
      isStoreConflict,
      activeStoreName,
      resetAndSwitchStore,
      setActiveStore,
    ],
  );

  const handleRemoveItem = useCallback(
    (item: FnBItem) => {
      if (!store?.isOpen) return;
      decrementItem(item.id);
    },
    [decrementItem, store?.isOpen],
  );

  const handleAddToCart = useCallback(
    (
      item: FnBItem,
      quantity: number,
      variant?: FnBVariant,
      addons?: FnBAddon[],
      notes?: string,
    ) => {
      const currentStoreId = storeId || store?.id || "";
      const currentStoreName = store?.name || "";

      // Set active store if not set yet
      setActiveStore(currentStoreId, currentStoreName);

      if (editingCartItem) {
        updateItem(editingCartItem.cartId, quantity, variant, addons, notes);
        setEditingCartItem(null);
      } else {
        addItem(item, quantity, variant, addons, notes);
      }
    },
    [
      addItem,
      updateItem,
      editingCartItem,
      storeId,
      store?.id,
      store?.name,
      setActiveStore,
    ],
  );

  const handleCloseItemDetail = useCallback(() => {
    setShowItemDetail(false);
    setSelectedItem(null);
    setEditingCartItem(null);
  }, []);

  const handleEditCartItem = useCallback((cartItem: CartItem) => {
    setEditingCartItem(cartItem);
    setSelectedItem(cartItem.item);
    setShowCartDetail(false);
    setShowItemDetail(true);
  }, []);

  const handleCartPress = useCallback(() => {
    setShowCartDetail(true);
  }, []);

  const handleCloseCartDetail = useCallback(() => {
    setShowCartDetail(false);
  }, []);

  const handleCartCheckout = useCallback(() => {
    setShowCartDetail(false);
    // @ts-expect-error - navigation type does not include plugin screens
    navigation.navigate("FnBCheckout", {
      entryPoint,
      storeId: params?.storeId,
      tableNumber: params?.tableNumber,
    });
  }, [navigation, entryPoint, params?.storeId, params?.tableNumber]);

  const clearSearch = useCallback(() => {
    setSearchQuery("");
  }, []);

  const handleConfirmReplaceCart = useCallback(() => {
    if (!replaceCartDialog) return;
    const { item, storeId, storeName } = replaceCartDialog;
    resetAndSwitchStore(storeId, storeName);
    if (item.variants && item.variants.length > 0) {
      setSelectedItem(item);
      setShowItemDetail(true);
    } else {
      incrementItem(item);
    }
    setReplaceCartDialog(null);
  }, [replaceCartDialog, resetAndSwitchStore, incrementItem]);

  const handleDismissReplaceCart = useCallback(() => {
    setReplaceCartDialog(null);
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: FnBItem }) => (
      <FnBItemCard
        item={item}
        quantity={getItemQuantity(item.id)}
        isFavorite={isFavorite(item.id)}
        onPress={handleItemPress}
        onAdd={store?.isOpen ? handleAddItem : undefined}
        onRemove={store?.isOpen ? handleRemoveItem : undefined}
        onToggleFavorite={toggleFavorite}
      />
    ),
    [
      handleItemPress,
      handleAddItem,
      handleRemoveItem,
      getItemQuantity,
      isFavorite,
      toggleFavorite,
      store?.isOpen,
    ],
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title={store?.name || t("fnb.title") || "Pesan Makanan"}
        onBackPress={() => navigation.goBack()}
        showBorder
        style={{ paddingTop: insets.top, backgroundColor: colors.surface }}
        paddingHorizontal={horizontalPadding}
      />
      {/* Search bar selalu tampil; clear isi pakai tombol X di dalam field */}
      <View
        style={[
          styles.searchInputRow,
          {
            backgroundColor: colors.surface,
            paddingHorizontal: horizontalPadding,
            paddingTop: moderateVerticalScale(10),
            paddingBottom: moderateVerticalScale(10),
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View
          style={[
            styles.searchInputContainer,
            {
              backgroundColor: colors.background,
              borderColor: colors.border,
              borderWidth: 1,
            },
          ]}
        >
          <SearchNormal
            size={scale(20)}
            color={colors.textSecondary}
            variant="Linear"
          />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder={t("fnb.searchMenu") || "Cari menu..."}
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={clearSearch}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <CloseCircle
                size={scale(20)}
                color={colors.textSecondary}
                variant="Linear"
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Menu Grid */}
      <FlatList
        key="fnb-menu-grid-2"
        data={searchedItems}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingHorizontal: horizontalPadding,
            paddingBottom:
              itemCount > 0
                ? insets.bottom + scale(120)
                : insets.bottom + moderateVerticalScale(24),
          },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          <View>
            {loading ? (
              <>
                <MerchantHeaderSkeleton />
                <FnBCategoryTabsSkeleton />
              </>
            ) : (
              <>
                {store && <MerchantHeader store={store} />}
                <FnBCategoryTabs
                  categories={categories}
                  selectedCategory={selectedCategory}
                  onSelectCategory={setSelectedCategory}
                />
              </>
            )}
          </View>
        }
        ListEmptyComponent={
          loading ? (
            // Show skeleton loading when loading
            <View style={styles.loadingContainer}>
              {Array.from({ length: 6 }, (_, index) => (
                <FnBItemCardSkeleton key={`skeleton-${index}`} />
              ))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {searchQuery
                  ? t("fnb.noMenuSearchFound", { query: searchQuery }) ||
                    `Tidak ada menu "${searchQuery}" ditemukan`
                  : t("fnb.noMenuFound") || "Tidak ada menu ditemukan"}
              </Text>
            </View>
          )
        }
      />

      {/* Floating Cart Bar - Only show if store is open */}
      {store?.isOpen && (
        <FnBCartBar
          itemCount={itemCount}
          total={subtotal}
          onPress={handleCartPress}
          onCheckout={handleCartCheckout}
          visible={itemCount > 0}
        />
      )}

      {/* Data load error banner */}
      {dataError && (
        <View
          style={[
            styles.closedBanner,
            {
              backgroundColor: colors.error + "15",
              borderTopColor: colors.error,
              paddingBottom: scale(12),
              marginHorizontal: horizontalPadding,
              marginBottom: scale(8),
            },
          ]}
        >
          <Text style={[styles.closedBannerText, { color: colors.error }]}>
            {dataError}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={() => refresh()}
          >
            <Text style={[styles.retryButtonText, { color: colors.surface }]}>
              {t("common.retry") || "Coba lagi"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Store Closed Banner */}
      {store && !store.isOpen && (
        <View
          style={[
            styles.closedBanner,
            {
              backgroundColor: colors.error + "15",
              borderTopColor: colors.error,
              paddingBottom: insets.bottom + scale(12),
            },
          ]}
        >
          <Text style={[styles.closedBannerText, { color: colors.error }]}>
            {t("fnb.storeClosedMessage") ||
              "Toko ini sedang tutup dan tidak dapat menerima pesanan saat ini."}
          </Text>
        </View>
      )}

      {/* Item Detail Sheet */}
      <FnBItemDetailSheet
        item={editingCartItem ? editingCartItem.item : selectedItem}
        visible={showItemDetail}
        initialQuantity={editingCartItem ? editingCartItem.quantity : 0}
        initialVariant={editingCartItem?.variant}
        initialAddons={editingCartItem?.addons}
        initialNotes={editingCartItem?.notes}
        isFavorite={selectedItem ? isFavorite(selectedItem.id) : false}
        onClose={handleCloseItemDetail}
        onAddToCart={handleAddToCart}
        onToggleFavorite={toggleFavorite}
      />

      {/* Cart Detail Sheet */}
      <FnBCartDetailSheet
        visible={showCartDetail}
        cartItems={cartItems}
        subtotal={subtotal}
        onClose={handleCloseCartDetail}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeItem}
        onEditItem={handleEditCartItem}
        onCheckout={handleCartCheckout}
      />

      {/* Replace cart confirmation dialog */}
      <Modal
        visible={!!replaceCartDialog}
        transparent
        animationType="fade"
        onRequestClose={handleDismissReplaceCart}
      >
        <Pressable
          style={styles.replaceCartBackdrop}
          onPress={handleDismissReplaceCart}
        >
          <Pressable
            style={[
              styles.replaceCartCard,
              {
                backgroundColor: colors.surface,
                paddingHorizontal: horizontalPadding + scale(24),
              }
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={[styles.replaceCartIconWrap, { backgroundColor: colors.warning + "20" }]}>
              <Warning2 size={scale(40)} color={colors.warning} variant="Bold" />
            </View>
            <Text style={[styles.replaceCartTitle, { color: colors.text }]}>
              {t("fnb.replaceCartTitle")}
            </Text>
            <Text style={[styles.replaceCartMessage, { color: colors.textSecondary }]}>
              {t("fnb.replaceCartMessage", {
                storeName: replaceCartDialog?.storeName ?? "",
              })}
            </Text>
            <View style={styles.replaceCartButtons}>
              <TouchableOpacity
                style={[styles.replaceCartBtn, styles.replaceCartBtnCancel, { borderColor: colors.border }]}
                onPress={handleDismissReplaceCart}
                activeOpacity={0.8}
              >
                <Text style={[styles.replaceCartBtnText, { color: colors.text }]}>
                  {t("common.cancel")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.replaceCartBtn, styles.replaceCartBtnConfirm, { backgroundColor: colors.primary }]}
                onPress={handleConfirmReplaceCart}
                activeOpacity={0.8}
              >
                <Text style={[styles.replaceCartBtnText, { color: colors.surface }]}>
                  {t("fnb.replaceCartConfirm")}
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchInputRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(14),
    height: scale(44),
    borderRadius: scale(12),
    gap: scale(10),
  },
  searchInput: {
    flex: 1,
    fontSize: scale(15),
    fontFamily: FontFamily.monasans.regular,
    marginLeft: 0,
    marginRight: scale(8),
    paddingVertical: scale(10),
  },
  columnWrapper: {
    justifyContent: "space-between",
  },
  listContent: {
    paddingTop: moderateVerticalScale(16),
    flexGrow: 1,
  },
  loadingContainer: {
    paddingTop: moderateVerticalScale(8),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: moderateVerticalScale(60),
  },
  emptyText: {
    fontSize: scale(14),
    fontFamily: FontFamily.monasans.regular,
  },
  closedBanner: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: scale(16),
    paddingTop: scale(12),
    borderTopWidth: 1,
  },
  closedBannerText: {
    fontSize: scale(13),
    fontFamily: FontFamily.monasans.medium,
    textAlign: "center",
  },
  retryButton: {
    marginTop: scale(10),
    alignSelf: "center",
    paddingVertical: scale(10),
    paddingHorizontal: scale(20),
    borderRadius: scale(10),
  },
  retryButtonText: {
    fontSize: scale(14),
    fontFamily: FontFamily.monasans.semiBold,
  },
  replaceCartBackdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: scale(24),
  },
  replaceCartCard: {
    width: "100%",
    maxWidth: scale(340),
    borderRadius: scale(16),
    paddingVertical: scale(24),
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
      },
      android: { elevation: 8 },
    }),
  },
  replaceCartIconWrap: {
    width: scale(64),
    height: scale(64),
    borderRadius: scale(32),
    justifyContent: "center",
    alignItems: "center",
    marginBottom: scale(16),
  },
  replaceCartTitle: {
    fontSize: getResponsiveFontSize("large"),
    fontFamily: FontFamily.monasans.bold,
    textAlign: "center",
    marginBottom: scale(8),
  },
  replaceCartMessage: {
    fontSize: getResponsiveFontSize("medium"),
    fontFamily: FontFamily.monasans.regular,
    textAlign: "center",
    lineHeight: scale(22),
    marginBottom: scale(24),
  },
  replaceCartButtons: {
    flexDirection: "row",
    gap: scale(12),
    width: "100%",
  },
  replaceCartBtn: {
    flex: 1,
    paddingVertical: scale(14),
    borderRadius: scale(12),
    alignItems: "center",
    justifyContent: "center",
  },
  replaceCartBtnCancel: {
    borderWidth: 1,
  },
  replaceCartBtnConfirm: {},
  replaceCartBtnText: {
    fontSize: getResponsiveFontSize("medium"),
    fontFamily: FontFamily.monasans.semiBold,
  },
});

export default FnBMerchantDetailScreen;
