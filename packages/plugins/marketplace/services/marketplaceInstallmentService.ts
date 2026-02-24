/**
 * Marketplace Installment Service
 * Daftar cicilan dari order; bayar cicilan via paymentService lalu update order.
 */

import { getStoredOrders, setStoredOrders } from '../utils/orderStorage';
import type { MarketplaceOrder } from '../models/MarketplaceOrder';
import type { MarketplaceInstallment } from '../models/MarketplaceInstallment';

export interface InstallmentWithOrder {
  orderId: string;
  orderNumber: string;
  installment: MarketplaceInstallment;
}

export const marketplaceInstallmentService = {
  async getInstallmentsByOrder(orderId: string): Promise<MarketplaceInstallment[]> {
    const orders = await getStoredOrders();
    const order = orders.find((o) => o.id === orderId);
    return order?.installments ?? [];
  },

  async getAllInstallments(): Promise<InstallmentWithOrder[]> {
    const orders = await getStoredOrders();
    const list: InstallmentWithOrder[] = [];
    for (const order of orders) {
      if (order.installments?.length) {
        for (const inst of order.installments) {
          list.push({ orderId: order.id, orderNumber: order.orderNumber, installment: inst });
        }
      }
    }
    return list;
  },

  async payInstallment(
    orderId: string,
    installmentId: string,
    paidAt: string
  ): Promise<void> {
    const orders = await getStoredOrders();
    const next = orders.map((o) => {
      if (o.id !== orderId || !o.installments) return o;
      const installments = o.installments.map((inst) =>
        inst.id === installmentId ? { ...inst, status: 'paid' as const, paidAt } : inst
      );
      return { ...o, installments };
    });
    await setStoredOrders(next);
  },
};
