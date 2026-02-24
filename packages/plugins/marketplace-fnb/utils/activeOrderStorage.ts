/**
 * Persist active FnB order for widget and order status screen
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FnBOrder } from '../models';

const KEY = 'fnb_active_order';

export async function getActiveOrder(): Promise<FnBOrder | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as FnBOrder;
    if (!parsed?.id || !parsed?.storeId || !Array.isArray(parsed?.items)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function setActiveOrder(order: FnBOrder | null): Promise<void> {
  try {
    if (order === null) {
      await AsyncStorage.removeItem(KEY);
      return;
    }
    await AsyncStorage.setItem(KEY, JSON.stringify(order));
  } catch {
    // ignore
  }
}

export async function clearActiveOrder(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
