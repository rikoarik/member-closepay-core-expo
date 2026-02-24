/**
 * FnBActiveOrderContext – active order state for widget and order status screen
 * Persists to AsyncStorage so widget and status screen stay in sync across app restarts.
 */

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { FnBOrder } from '../models';
import type { OrderStatus } from '../models';
import { getActiveOrder, setActiveOrder as setActiveOrderStorage } from '../utils/activeOrderStorage';

/** Dummy mode: auto-advance status untuk testing cepat (hanya __DEV__) */
const FNBDUMMY_AUTO_STATUS = __DEV__;
const FNBDUMMY_DELAY_MS = 2000;

const STATUS_SEQUENCE: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'ready', 'completed'];

function getNextStatus(current: OrderStatus): OrderStatus | null {
  const i = STATUS_SEQUENCE.indexOf(current);
  if (i < 0 || i >= STATUS_SEQUENCE.length - 1) return null;
  return STATUS_SEQUENCE[i + 1];
}

export interface FnBActiveOrderContextValue {
  activeOrder: FnBOrder | null;
  setActiveOrder: (order: FnBOrder | null) => Promise<void>;
  refreshActiveOrder: () => Promise<void>;
}

const defaultContextValue: FnBActiveOrderContextValue = {
  activeOrder: null,
  setActiveOrder: async () => {},
  refreshActiveOrder: async () => {},
};

export const FnBActiveOrderContext = createContext<FnBActiveOrderContextValue | null>(null);

export function useFnBActiveOrder(): FnBActiveOrderContextValue {
  const ctx = useContext(FnBActiveOrderContext);
  return ctx ?? defaultContextValue;
}

export const FnBActiveOrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeOrder, setActiveOrderState] = useState<FnBOrder | null>(null);
  const advanceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const orderRef = useRef<FnBOrder | null>(null);
  const setActiveOrderRef = useRef<(order: FnBOrder | null) => Promise<void>>(async () => {});

  const refreshActiveOrder = useCallback(async () => {
    const order = await getActiveOrder();
    setActiveOrderState(order);
  }, []);

  useEffect(() => {
    let cancelled = false;
    getActiveOrder().then((order) => {
      if (!cancelled) setActiveOrderState(order);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const setActiveOrder = useCallback(async (order: FnBOrder | null) => {
    await setActiveOrderStorage(order);
    setActiveOrderState(order);
  }, []);

  setActiveOrderRef.current = setActiveOrder;
  orderRef.current = activeOrder;

  useEffect(() => {
    if (!FNBDUMMY_AUTO_STATUS || !activeOrder || activeOrder.status === 'completed' || activeOrder.status === 'cancelled') {
      return;
    }
    orderRef.current = activeOrder;
    const delay = FNBDUMMY_DELAY_MS;
    advanceTimeoutRef.current = setTimeout(() => {
      const order = orderRef.current;
      const setOrder = setActiveOrderRef.current;
      if (!order) return;
      const next = getNextStatus(order.status);
      if (next === 'completed') {
        setOrder({ ...order, status: 'completed' });
        // Jangan setOrder(null) agar layar Detail Pesanan (take away/delivery) tetap punya data
        // Widget sudah otomatis hilang karena visible = false saat status === 'completed'
      } else if (next) {
        setOrder({ ...order, status: next });
      }
    }, delay);
    return () => {
      if (advanceTimeoutRef.current) clearTimeout(advanceTimeoutRef.current);
      advanceTimeoutRef.current = null;
    };
  }, [activeOrder?.id, activeOrder?.status]);

  const value = useMemo<FnBActiveOrderContextValue>(
    () => ({
      activeOrder,
      setActiveOrder,
      refreshActiveOrder,
    }),
    [activeOrder, setActiveOrder, refreshActiveOrder]
  );

  return (
    <FnBActiveOrderContext.Provider value={value}>
      {children}
    </FnBActiveOrderContext.Provider>
  );
};
