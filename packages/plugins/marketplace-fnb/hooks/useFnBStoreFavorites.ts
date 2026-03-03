/**
 * useFnBStoreFavorites Hook
 * Manages favorite FnB stores/merchants (bukan menu item). Dipakai di kartu merchant untuk toggle favorit toko.
 */

import { useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@fnb_favorite_stores';

interface UseFnBStoreFavoritesReturn {
  favoriteStoreIds: string[];
  isFavoriteStore: (storeId: string) => boolean;
  toggleStoreFavorite: (storeId: string) => void;
}

export const useFnBStoreFavorites = (): UseFnBStoreFavoritesReturn => {
  const [favoriteStoreIds, setFavoriteStoreIds] = useState<string[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) setFavoriteStoreIds(parsed);
        }
      } catch {
        // ignore
      }
    };
    load();
  }, []);

  const save = useCallback(async (ids: string[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch {
      // ignore
    }
  }, []);

  const isFavoriteStore = useCallback(
    (storeId: string) => favoriteStoreIds.includes(storeId),
    [favoriteStoreIds]
  );

  const toggleStoreFavorite = useCallback(
    (storeId: string) => {
      const next = favoriteStoreIds.includes(storeId)
        ? favoriteStoreIds.filter((id) => id !== storeId)
        : [...favoriteStoreIds, storeId];
      setFavoriteStoreIds(next);
      save(next);
    },
    [favoriteStoreIds, save]
  );

  return {
    favoriteStoreIds,
    isFavoriteStore,
    toggleStoreFavorite,
  };
};

export default useFnBStoreFavorites;
