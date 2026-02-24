/**
 * Persist last delivery info (phone + address) for pre-fill on next checkout
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'fnb_last_delivery';

export interface LastDeliveryInfo {
  phoneNumber: string;
  deliveryAddress: string;
}

export async function getLastDelivery(): Promise<LastDeliveryInfo | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LastDeliveryInfo;
    return parsed && typeof parsed.phoneNumber === 'string' && typeof parsed.deliveryAddress === 'string'
      ? parsed
      : null;
  } catch {
    return null;
  }
}

export async function setLastDelivery(info: LastDeliveryInfo): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(info));
  } catch {
    // ignore
  }
}
