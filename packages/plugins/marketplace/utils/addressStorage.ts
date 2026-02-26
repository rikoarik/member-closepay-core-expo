/**
 * Persist address book (alamat tersimpan) untuk marketplace
 * Dummy address di cache untuk testing saat daftar kosong
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Address } from '../models/Address';

const KEY = '@marketplace_addresses';

/** Alamat dummy untuk testing; disimpan di cache bila daftar kosong */
function getDummyAddresses(): Address[] {
  const now = new Date().toISOString();
  return [
    {
      id: 'addr-dummy-home',
      label: 'home',
      recipientName: 'John Doe',
      recipientPhone: '081234567890',
      latitude: -6.2088,
      longitude: 106.8456,
      province: 'DKI Jakarta',
      city: 'Jakarta Pusat',
      district: 'Menteng',
      subDistrict: 'Menteng',
      postalCode: '10310',
      fullAddress: 'Jalan Penataran No. 20, Menteng, Jakarta Pusat',
      notes: 'Dekat minimarket',
      isDefault: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'addr-dummy-office',
      label: 'office',
      recipientName: 'Jane Smith',
      recipientPhone: '081298765432',
      latitude: -6.1751,
      longitude: 106.865,
      province: 'DKI Jakarta',
      city: 'Jakarta Selatan',
      district: 'Kebayoran Baru',
      subDistrict: 'Gunung',
      postalCode: '12120',
      fullAddress: 'Gedung Example Lt 3, Jl. Sudirman Kav 52-53',
      isDefault: false,
      createdAt: now,
      updatedAt: now,
    },
  ];
}

/**
 * Jika cache kosong, isi dengan alamat dummy lalu simpan ke cache.
 * Mengembalikan daftar yang tersimpan (dummy atau yang sudah ada).
 */
export async function getStoredAddresses(): Promise<Address[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) {
      const dummy = getDummyAddresses();
      await setStoredAddresses(dummy);
      return dummy;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      const dummy = getDummyAddresses();
      await setStoredAddresses(dummy);
      return dummy;
    }
    const list = parsed.filter(
      (a: unknown) =>
        a &&
        typeof a === 'object' &&
        typeof (a as Address).id === 'string' &&
        typeof (a as Address).recipientName === 'string'
    );
    if (list.length === 0) {
      const dummy = getDummyAddresses();
      await setStoredAddresses(dummy);
      return dummy;
    }
    return list;
  } catch {
    return [];
  }
}

export async function setStoredAddresses(addresses: Address[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(addresses));
  } catch {
    // ignore
  }
}
