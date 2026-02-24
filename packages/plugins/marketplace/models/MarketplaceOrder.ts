/**
 * Marketplace Order Model
 * Order belanja marketplace dengan status dan item
 */

import type { Product } from '../components/shared/ProductCard';
import type { MarketplaceInstallment } from './MarketplaceInstallment';

export type MarketplaceOrderStatus =
  | 'belum_dibayar'
  | 'dipesan'
  | 'diproses'
  | 'dikirim'
  | 'at_pickup_point'
  | 'selesai'
  | 'dibatalkan'
  | 'ditolak'
  | 'ditinjau';

export interface MarketplaceOrderItem {
  product: Product;
  quantity: number;
  subtotal: number;
}

export interface MarketplaceOrder {
  id: string;
  orderNumber: string;
  items: MarketplaceOrderItem[];
  subtotal: number;
  shippingFee: number;
  total: number;
  address: string;
  paymentMethod: string;
  status: MarketplaceOrderStatus;
  createdAt: string; // ISO string
  allowInstallment?: boolean;
  installments?: MarketplaceInstallment[];
}
