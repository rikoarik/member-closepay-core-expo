/**
 * useFnBCart Hook
 * Consumes shared FnB cart from FnBCartContext (MerchantDetail & Checkout share same cart).
 * App must wrap navigation with FnBCartProvider.
 */

import React, { useContext, useMemo } from 'react';
import type { OrderType, EntryPoint } from '../models';
import { getAvailableOrderTypes } from '../models';
import { getFnBCompanyConfig } from '../config/fnbCompanyConfig';
import { FnBCartContext } from '../context/FnBCartContext';

export type { CartItem } from '../context/FnBCartContext';

interface UseFnBCartReturn {
  cartItems: import('../context/FnBCartContext').CartItem[];
  itemCount: number;
  subtotal: number;
  activeStoreId: string | null;
  activeStoreName: string | null;
  addItem: (
    item: import('../models').FnBItem,
    quantity: number,
    variant?: import('../models').FnBVariant,
    addons?: import('../models').FnBAddon[],
    notes?: string
  ) => void;
  removeItem: (cartId: string) => void;
  updateQuantity: (cartId: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: (deliveryFee?: number, serviceFee?: number) => number;
  availableOrderTypes: OrderType[];
  getItemQuantity: (itemId: string) => number;
  incrementItem: (item: import('../models').FnBItem) => void;
  decrementItem: (itemId: string) => void;
  updateItem: (
    cartId: string,
    quantity: number,
    variant?: import('../models').FnBVariant,
    addons?: import('../models').FnBAddon[],
    notes?: string
  ) => void;
  setActiveStore: (storeId: string, storeName: string) => void;
  resetAndSwitchStore: (storeId: string, storeName: string) => void;
  isStoreConflict: (storeId: string) => boolean;
}

export const useFnBCart = (entryPoint: EntryPoint = 'browse'): UseFnBCartReturn => {
  const context = useContext(FnBCartContext);
  if (context == null) {
    throw new Error(
      'useFnBCart must be used within FnBCartProvider. Wrap your app (or FnB navigator) with <FnBCartProvider>.'
    );
  }

  const availableOrderTypes = useMemo(
    () => getAvailableOrderTypes(entryPoint, getFnBCompanyConfig()),
    [entryPoint]
  );

  return {
    ...context,
    availableOrderTypes,
  };
};

