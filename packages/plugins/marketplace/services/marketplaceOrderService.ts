/**
 * Marketplace Order Service
 * Baca/tulis order ke storage; nanti bisa diganti dengan API call.
 */

import { getStoredOrders, setStoredOrders } from '../utils/orderStorage';
import type { MarketplaceOrder, MarketplaceOrderStatus } from '../models/MarketplaceOrder';

export const marketplaceOrderService = {
  async getOrders(statusFilter?: MarketplaceOrderStatus | 'semua'): Promise<MarketplaceOrder[]> {
    const orders = await getStoredOrders();
    if (!statusFilter || statusFilter === 'semua') return orders;
    return orders.filter((o) => o.status === statusFilter);
  },

  async getOrderById(orderId: string): Promise<MarketplaceOrder | undefined> {
    const orders = await getStoredOrders();
    return orders.find((o) => o.id === orderId);
  },

  async createOrder(order: MarketplaceOrder): Promise<void> {
    const orders = await getStoredOrders();
    await setStoredOrders([order, ...orders]);
  },

  async updateOrderStatus(orderId: string, status: MarketplaceOrderStatus): Promise<void> {
    const orders = await getStoredOrders();
    const next = orders.map((o) => (o.id === orderId ? { ...o, status } : o));
    await setStoredOrders(next);
  },

  async updateOrderInstallment(
    orderId: string,
    installmentId: string,
    updates: { status?: 'unpaid' | 'paid'; paidAt?: string }
  ): Promise<void> {
    const orders = await getStoredOrders();
    const next = orders.map((o) => {
      if (o.id !== orderId || !o.installments) return o;
      const installments = o.installments.map((inst) =>
        inst.id === installmentId ? { ...inst, ...updates } : inst
      );
      return { ...o, installments };
    });
    await setStoredOrders(next);
  },
};
