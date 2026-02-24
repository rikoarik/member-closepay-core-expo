/**
 * useFnBData Hook
 * Fetches and manages FnB menu data (dummy data from fnbDummyData)
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { FnBItem, FnBCategory, FnBStore, EntryPoint } from '../models';
import { isStoreOpen } from '../models';
import {
  DEFAULT_STORE_ID,
  FNBDUMMY_CATEGORIES,
  FNBDUMMY_STORES,
  FNBDUMMY_STORE_ITEMS,
} from '../data/fnbDummyData';

interface UseFnBDataReturn {
    items: FnBItem[];
    categories: FnBCategory[];
    store: FnBStore | null;
    loading: boolean;
    error: string | null;
    selectedCategory: string;
    setSelectedCategory: (categoryId: string) => void;
    filteredItems: FnBItem[];
    refresh: () => Promise<void>;
    entryPoint: EntryPoint;
    setEntryPoint: (entry: EntryPoint) => void;
}

export const useFnBData = (initialEntryPoint: EntryPoint = 'browse', storeId?: string): UseFnBDataReturn => {
    const [items, setItems] = useState<FnBItem[]>([]);
    const [categories, setCategories] = useState<FnBCategory[]>([]);
    const [store, setStore] = useState<FnBStore | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [entryPoint, setEntryPoint] = useState<EntryPoint>(initialEntryPoint);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            // Simulate API call
            await new Promise<void>((resolve) => setTimeout(resolve, 800));

            // Get store by ID or use default
            const targetStoreId = storeId || DEFAULT_STORE_ID;
            const storeData = FNBDUMMY_STORES[targetStoreId] || FNBDUMMY_STORES[DEFAULT_STORE_ID];

            // Get items for this store
            const storeItems =
              FNBDUMMY_STORE_ITEMS[targetStoreId] || FNBDUMMY_STORE_ITEMS[DEFAULT_STORE_ID];
            setItems(storeItems);

            setCategories(FNBDUMMY_CATEGORIES);

            // Calculate isOpen dynamically based on operating hours
            const storeWithStatus = {
                ...storeData,
                isOpen: isStoreOpen(storeData),
            };
            setStore(storeWithStatus);
        } catch (err) {
            setError(
              err instanceof Error ? err.message : 'Gagal memuat data menu. Silakan coba lagi.'
            );
        } finally {
            setLoading(false);
        }
    }, [storeId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const filteredItems = useMemo(() => {
        if (selectedCategory === 'all') {
            return items;
        }
        return items.filter((item) => item.category === selectedCategory);
    }, [items, selectedCategory]);

    const refresh = useCallback(async () => {
        await fetchData();
    }, [fetchData]);

    return {
        items,
        categories,
        store,
        loading,
        error,
        selectedCategory,
        setSelectedCategory,
        filteredItems,
        refresh,
        entryPoint,
        setEntryPoint,
    };
};
