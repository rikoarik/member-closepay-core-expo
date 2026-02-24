/**
 * Persist marketplace orders for riwayat and order detail
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { MarketplaceOrder } from '../models/MarketplaceOrder';

const KEY = '@marketplace_orders';

export async function getStoredOrders(): Promise<MarketplaceOrder[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (o: unknown) =>
        o &&
        typeof o === 'object' &&
        typeof (o as MarketplaceOrder).id === 'string' &&
        Array.isArray((o as MarketplaceOrder).items)
    );
  } catch {
    return [];
  }
}

export async function setStoredOrders(orders: MarketplaceOrder[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(orders));
  } catch {
    // ignore
  }
}
