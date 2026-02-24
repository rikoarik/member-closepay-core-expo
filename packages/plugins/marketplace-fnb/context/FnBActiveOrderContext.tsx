/**
 * FnBActiveOrderContext – active order state for widget and order status screen
 * Persists to AsyncStorage so widget and status screen stay in sync across app restarts.
 */

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { FnBOrder } from '../models';
import { getActiveOrder, setActiveOrder as setActiveOrderStorage } from '../utils/activeOrderStorage';

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
