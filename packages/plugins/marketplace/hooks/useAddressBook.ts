/**
 * useAddressBook
 * CRUD alamat tersimpan dan alamat default untuk checkout
 */

import { useState, useCallback, useEffect } from 'react';
import { addressService } from '../services/addressService';
import type { Address, AddressLabel } from '../models/Address';

export function useAddressBook() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [defaultAddress, setDefaultAddress] = useState<Address | undefined>();
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [list, defaultAddr] = await Promise.all([
        addressService.getAll(),
        addressService.getDefault(),
      ]);
      setAddresses(list);
      setDefaultAddress(defaultAddr);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    refresh().then(() => {
      if (cancelled) return;
    });
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  const add = useCallback(
    async (address: Omit<Address, 'id' | 'createdAt' | 'updatedAt'>) => {
      const saved = await addressService.save(address);
      await refresh();
      return saved;
    },
    [refresh]
  );

  const update = useCallback(
    async (id: string, updates: Partial<Omit<Address, 'id' | 'createdAt'>>) => {
      const updated = await addressService.update(id, updates);
      if (updated) await refresh();
      return updated;
    },
    [refresh]
  );

  const setDefault = useCallback(
    async (id: string) => {
      await addressService.setDefault(id);
      await refresh();
    },
    [refresh]
  );

  const remove = useCallback(
    async (id: string) => {
      const ok = await addressService.delete(id);
      if (ok) await refresh();
      return ok;
    },
    [refresh]
  );

  const getById = useCallback(
    (id: string) => addresses.find((a) => a.id === id),
    [addresses]
  );

  return {
    addresses,
    defaultAddress,
    loading,
    refresh,
    add,
    update,
    setDefault,
    remove,
    getById,
    createBlank: useCallback((label?: AddressLabel) => addressService.createBlank(label), []),
  };
}
