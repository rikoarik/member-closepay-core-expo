/**
 * useMarketplaceWishlist Hook
 * Manages favorite marketplace products with AsyncStorage persistence
 */

import { useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Product } from '../components/shared/ProductCard';

const WISHLIST_IDS_KEY = '@marketplace_wishlist';
const WISHLIST_ITEMS_KEY = '@marketplace_wishlist_items';

interface WishlistItemData {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  storeName?: string;
  category?: string;
}

export interface UseMarketplaceWishlistReturn {
  favoriteItems: WishlistItemData[];
  isFavorite: (productId: string) => boolean;
  toggleFavorite: (product: Product) => void;
  addFavorite: (product: Product) => void;
  removeFavorite: (productId: string) => void;
  clearFavorites: () => void;
  favoritesCount: number;
}

export const useMarketplaceWishlist = (): UseMarketplaceWishlistReturn => {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [favoriteItems, setFavoriteItems] = useState<WishlistItemData[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [storedIds, storedItems] = await Promise.all([
          AsyncStorage.getItem(WISHLIST_IDS_KEY),
          AsyncStorage.getItem(WISHLIST_ITEMS_KEY),
        ]);
        if (storedIds) setFavorites(JSON.parse(storedIds));
        if (storedItems) setFavoriteItems(JSON.parse(storedItems));
      } catch {
        // ignore
      }
    };
    load();
  }, []);

  const saveFavorites = useCallback(async (ids: string[], items: WishlistItemData[]) => {
    try {
      await Promise.all([
        AsyncStorage.setItem(WISHLIST_IDS_KEY, JSON.stringify(ids)),
        AsyncStorage.setItem(WISHLIST_ITEMS_KEY, JSON.stringify(items)),
      ]);
    } catch {
      // ignore
    }
  }, []);

  const isFavorite = useCallback(
    (productId: string) => favorites.includes(productId),
    [favorites]
  );

  const addFavorite = useCallback(
    (product: Product) => {
      if (favorites.includes(product.id)) return;
      const newIds = [...favorites, product.id];
      const newItem: WishlistItemData = {
        id: product.id,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl,
        storeName: product.storeName,
        category: product.category,
      };
      const newItems = [...favoriteItems, newItem];
      setFavorites(newIds);
      setFavoriteItems(newItems);
      saveFavorites(newIds, newItems);
    },
    [favorites, favoriteItems, saveFavorites]
  );

  const removeFavorite = useCallback(
    (productId: string) => {
      const newIds = favorites.filter((id) => id !== productId);
      const newItems = favoriteItems.filter((item) => item.id !== productId);
      setFavorites(newIds);
      setFavoriteItems(newItems);
      saveFavorites(newIds, newItems);
    },
    [favorites, favoriteItems, saveFavorites]
  );

  const toggleFavorite = useCallback(
    (product: Product) => {
      if (isFavorite(product.id)) removeFavorite(product.id);
      else addFavorite(product);
    },
    [isFavorite, addFavorite, removeFavorite]
  );

  const clearFavorites = useCallback(() => {
    setFavorites([]);
    setFavoriteItems([]);
    saveFavorites([], []);
  }, [saveFavorites]);

  return {
    favoriteItems,
    isFavorite,
    toggleFavorite,
    addFavorite,
    removeFavorite,
    clearFavorites,
    favoritesCount: favorites.length,
  };
};

export default useMarketplaceWishlist;
