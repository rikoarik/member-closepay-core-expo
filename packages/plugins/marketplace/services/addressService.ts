/**
 * Address Service
 * CRUD alamat pengiriman (address book) untuk marketplace
 */

import { getStoredAddresses, setStoredAddresses } from '../utils/addressStorage';
import type { Address, AddressLabel } from '../models/Address';

function generateId(): string {
  return `addr-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export const addressService = {
  async getAll(): Promise<Address[]> {
    return getStoredAddresses();
  },

  async getById(id: string): Promise<Address | undefined> {
    const list = await getStoredAddresses();
    return list.find((a) => a.id === id);
  },

  async getDefault(): Promise<Address | undefined> {
    const list = await getStoredAddresses();
    return list.find((a) => a.isDefault) ?? list[0];
  },

  async save(address: Omit<Address, 'id' | 'createdAt' | 'updatedAt'>): Promise<Address> {
    const list = await getStoredAddresses();
    const now = new Date().toISOString();
    const newAddress: Address = {
      ...address,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };
    let next = list.filter((a) => a.id !== newAddress.id);
    if (address.isDefault) {
      next = next.map((a) => ({ ...a, isDefault: false, updatedAt: now }));
    }
    next = [newAddress, ...next];
    await setStoredAddresses(next);
    return newAddress;
  },

  async update(
    id: string,
    updates: Partial<Omit<Address, 'id' | 'createdAt'>>
  ): Promise<Address | undefined> {
    const list = await getStoredAddresses();
    const index = list.findIndex((a) => a.id === id);
    if (index === -1) return undefined;
    const now = new Date().toISOString();
    const updated = { ...list[index], ...updates, updatedAt: now };
    if (updates.isDefault === true) {
      const next = list.map((a) =>
        a.id === id ? updated : { ...a, isDefault: false, updatedAt: now }
      );
      next[index] = updated;
      await setStoredAddresses(next);
    } else {
      const next = [...list];
      next[index] = updated;
      await setStoredAddresses(next);
    }
    return updated;
  },

  async setDefault(id: string): Promise<void> {
    const list = await getStoredAddresses();
    const now = new Date().toISOString();
    const next = list.map((a) => ({
      ...a,
      isDefault: a.id === id,
      updatedAt: a.id === id ? now : a.updatedAt,
    }));
    await setStoredAddresses(next);
  },

  async delete(id: string): Promise<boolean> {
    const list = await getStoredAddresses();
    const filtered = list.filter((a) => a.id !== id);
    if (filtered.length === list.length) return false;
    await setStoredAddresses(filtered);
    return true;
  },

  createBlank(label: AddressLabel = 'home'): Omit<Address, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      label,
      recipientName: '',
      recipientPhone: '',
      latitude: 0,
      longitude: 0,
      province: '',
      city: '',
      district: '',
      subDistrict: '',
      postalCode: '',
      fullAddress: '',
      isDefault: false,
    };
  },
};
