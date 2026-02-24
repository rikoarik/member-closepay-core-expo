/**
 * MarketplaceOrderContext – list of orders for riwayat and order detail
 * Persists to AsyncStorage via orderStorage.
 */

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { MarketplaceOrder, MarketplaceOrderStatus } from '../models/MarketplaceOrder';
import type { MarketplaceInstallment } from '../models/MarketplaceInstallment';
import { getStoredOrders, setStoredOrders } from '../utils/orderStorage';

export interface MarketplaceOrderContextValue {
  orders: MarketplaceOrder[];
  addOrder: (order: MarketplaceOrder) => Promise<void>;
  updateOrderStatus: (orderId: string, status: MarketplaceOrderStatus) => Promise<void>;
  updateOrderInstallment: (
    orderId: string,
    installmentId: string,
    updates: Partial<Pick<MarketplaceInstallment, 'status' | 'paidAt'>>
  ) => Promise<void>;
  getOrderById: (orderId: string) => MarketplaceOrder | undefined;
  getOrders: (statusFilter?: MarketplaceOrderStatus | 'semua') => MarketplaceOrder[];
  refreshOrders: () => Promise<void>;
}

const defaultContextValue: MarketplaceOrderContextValue = {
  orders: [],
  addOrder: async () => {},
  updateOrderStatus: async () => {},
  updateOrderInstallment: async () => {},
  getOrderById: () => undefined,
  getOrders: () => [],
  refreshOrders: async () => {},
};

export const MarketplaceOrderContext = createContext<MarketplaceOrderContextValue | null>(null);

export function useMarketplaceOrders(): MarketplaceOrderContextValue {
  const ctx = useContext(MarketplaceOrderContext);
  return ctx ?? defaultContextValue;
}

export const MarketplaceOrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<MarketplaceOrder[]>([]);

  const refreshOrders = useCallback(async () => {
    const stored = await getStoredOrders();
    setOrders(stored);
  }, []);

  useEffect(() => {
    let cancelled = false;
    getStoredOrders().then((stored) => {
      if (!cancelled) setOrders(stored);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const addOrder = useCallback(async (order: MarketplaceOrder) => {
    setOrders((prev) => {
      const next = [order, ...prev];
      setStoredOrders(next).catch(() => {});
      return next;
    });
  }, []);

  const updateOrderStatus = useCallback(async (orderId: string, status: MarketplaceOrderStatus) => {
    setOrders((prev) => {
      const next = prev.map((o) => (o.id === orderId ? { ...o, status } : o));
      setStoredOrders(next).catch(() => {});
      return next;
    });
  }, []);

  const updateOrderInstallment = useCallback(
    async (
      orderId: string,
      installmentId: string,
      updates: Partial<Pick<MarketplaceInstallment, 'status' | 'paidAt'>>
    ) => {
      setOrders((prev) => {
        const next = prev.map((o) => {
          if (o.id !== orderId || !o.installments) return o;
          const installments = o.installments.map((inst) =>
            inst.id === installmentId ? { ...inst, ...updates } : inst
          );
          return { ...o, installments };
        });
        setStoredOrders(next).catch(() => {});
        return next;
      });
    },
    []
  );

  const getOrderById = useCallback(
    (orderId: string) => orders.find((o) => o.id === orderId),
    [orders]
  );

  const getOrders = useCallback(
    (statusFilter?: MarketplaceOrderStatus | 'semua') => {
      if (!statusFilter || statusFilter === 'semua') return orders;
      return orders.filter((o) => o.status === statusFilter);
    },
    [orders]
  );

  const value = useMemo<MarketplaceOrderContextValue>(
    () => ({
      orders,
      addOrder,
      updateOrderStatus,
      updateOrderInstallment,
      getOrderById,
      getOrders,
      refreshOrders,
    }),
    [
      orders,
      addOrder,
      updateOrderStatus,
      updateOrderInstallment,
      getOrderById,
      getOrders,
      refreshOrders,
    ]
  );

  return (
    <MarketplaceOrderContext.Provider value={value}>
      {children}
    </MarketplaceOrderContext.Provider>
  );
};
