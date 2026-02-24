/**
 * FnBCartContext – shared cart state for FnB flow (MerchantDetail → Checkout)
 * Ensures cart items added on merchant screen appear on checkout screen.
 */

import React, { createContext, useCallback, useMemo, useState } from 'react';
import type { FnBItem, FnBVariant, FnBAddon, FnBOrderItem } from '../models';
import { getAvailableOrderTypes } from '../models';

export interface CartItem extends FnBOrderItem {
  cartId: string;
}

export interface FnBCartContextValue {
  cartItems: CartItem[];
  itemCount: number;
  subtotal: number;
  addItem: (
    item: FnBItem,
    quantity: number,
    variant?: FnBVariant,
    addons?: FnBAddon[],
    notes?: string
  ) => void;
  removeItem: (cartId: string) => void;
  updateQuantity: (cartId: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: (deliveryFee?: number, serviceFee?: number) => number;
  getItemQuantity: (itemId: string) => number;
  incrementItem: (item: FnBItem) => void;
  decrementItem: (itemId: string) => void;
  updateItem: (
    cartId: string,
    quantity: number,
    variant?: FnBVariant,
    addons?: FnBAddon[],
    notes?: string
  ) => void;
}

const defaultContextValue: FnBCartContextValue = {
  cartItems: [],
  itemCount: 0,
  subtotal: 0,
  addItem: () => {},
  removeItem: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  getTotal: () => 0,
  getItemQuantity: () => 0,
  incrementItem: () => {},
  decrementItem: () => {},
  updateItem: () => {},
};

export const FnBCartContext = createContext<FnBCartContextValue | null>(null);

export const FnBCartProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const calculateSubtotal = useCallback(
    (item: FnBItem, quantity: number, variant?: FnBVariant, addons?: FnBAddon[]): number => {
      let itemPrice = item.price;
      if (variant) itemPrice += variant.price;
      if (addons?.length) {
        itemPrice += addons.reduce((sum, a) => sum + a.price, 0);
      }
      return itemPrice * quantity;
    },
    []
  );

  const addItem = useCallback(
    (
      item: FnBItem,
      quantity: number,
      variant?: FnBVariant,
      addons?: FnBAddon[],
      notes?: string
    ) => {
      const cartId = `${item.id}-${Date.now()}`;
      const subtotal = calculateSubtotal(item, quantity, variant, addons);
      const newCartItem: CartItem = {
        cartId,
        item,
        quantity,
        variant,
        addons,
        notes,
        subtotal,
      };
      setCartItems((prev) => [...prev, newCartItem]);
    },
    [calculateSubtotal]
  );

  const removeItem = useCallback((cartId: string) => {
    setCartItems((prev) => prev.filter((item) => item.cartId !== cartId));
  }, []);

  const updateQuantity = useCallback(
    (cartId: string, quantity: number) => {
      if (quantity <= 0) {
        setCartItems((prev) => prev.filter((item) => item.cartId !== cartId));
        return;
      }
      setCartItems((prev) =>
        prev.map((cartItem) => {
          if (cartItem.cartId !== cartId) return cartItem;
          const newSubtotal = calculateSubtotal(
            cartItem.item,
            quantity,
            cartItem.variant,
            cartItem.addons
          );
          return { ...cartItem, quantity, subtotal: newSubtotal };
        })
      );
    },
    [calculateSubtotal]
  );

  const updateItem = useCallback(
    (
      cartId: string,
      quantity: number,
      variant?: FnBVariant,
      addons?: FnBAddon[],
      notes?: string
    ) => {
      setCartItems((prev) =>
        prev.map((cartItem) => {
          if (cartItem.cartId !== cartId) return cartItem;
          const newSubtotal = calculateSubtotal(
            cartItem.item,
            quantity,
            variant,
            addons
          );
          return {
            ...cartItem,
            quantity,
            variant,
            addons,
            notes,
            subtotal: newSubtotal,
          };
        })
      );
    },
    [calculateSubtotal]
  );

  const clearCart = useCallback(() => setCartItems([]), []);

  const getItemQuantity = useCallback((itemId: string): number => {
    return cartItems
      .filter((c) => c.item.id === itemId)
      .reduce((sum, c) => sum + c.quantity, 0);
  }, [cartItems]);

  const incrementItem = useCallback(
    (item: FnBItem) => {
      setCartItems((prev) => {
        const existing = prev.find(
          (c) =>
            c.item.id === item.id &&
            !c.variant &&
            (!c.addons || c.addons.length === 0)
        );
        if (existing) {
          const newQty = existing.quantity + 1;
          const newSubtotal = calculateSubtotal(
            existing.item,
            newQty,
            existing.variant,
            existing.addons
          );
          return prev.map((c) =>
            c.cartId === existing.cartId
              ? { ...c, quantity: newQty, subtotal: newSubtotal }
              : c
          );
        }
        const cartId = `${item.id}-${Date.now()}`;
        const subtotal = calculateSubtotal(item, 1);
        return [...prev, { cartId, item, quantity: 1, subtotal }];
      });
    },
    [calculateSubtotal]
  );

  const decrementItem = useCallback(
    (itemId: string) => {
      setCartItems((prev) => {
        const existing = prev.find(
          (c) =>
            c.item.id === itemId &&
            !c.variant &&
            (!c.addons || c.addons.length === 0)
        );
        if (!existing) return prev;
        if (existing.quantity <= 1) {
          return prev.filter((c) => c.cartId !== existing.cartId);
        }
        const newQty = existing.quantity - 1;
        const newSubtotal = calculateSubtotal(
          existing.item,
          newQty,
          existing.variant,
          existing.addons
        );
        return prev.map((c) =>
          c.cartId === existing.cartId
            ? { ...c, quantity: newQty, subtotal: newSubtotal }
            : c
        );
      });
    },
    [calculateSubtotal]
  );

  const itemCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems]
  );
  const subtotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.subtotal, 0),
    [cartItems]
  );
  const getTotal = useCallback(
    (deliveryFee = 0, serviceFee = 0) => subtotal + deliveryFee + serviceFee,
    [subtotal]
  );

  const value = useMemo<FnBCartContextValue>(
    () => ({
      cartItems,
      itemCount,
      subtotal,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      getTotal,
      getItemQuantity,
      incrementItem,
      decrementItem,
      updateItem,
    }),
    [
      cartItems,
      itemCount,
      subtotal,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      getTotal,
      getItemQuantity,
      incrementItem,
      decrementItem,
      updateItem,
    ]
  );

  return (
    <FnBCartContext.Provider value={value}>{children}</FnBCartContext.Provider>
  );
};
