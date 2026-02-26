/**
 * Marketplace Order Model
 * Order belanja marketplace dengan status dan item
 */

import type { Product } from '../components/shared/ProductCard';
import type { MarketplaceInstallment, InstallmentSelection } from './MarketplaceInstallment';
import type { Address } from './Address';

export type MarketplacePaymentMethod = 'balance' | 'co_link' | 'va';

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
  /** Alamat pengiriman (teks) — backward compatible */
  address: string;
  /** ID alamat dari address book (opsional) */
  shippingAddressId?: string;
  /** Snapshot alamat lengkap saat order (opsional) */
  shippingAddress?: Address;
  /** Metode pembayaran: balance, co_link (payment gateway), va (virtual account) */
  paymentMethod: MarketplacePaymentMethod;
  /** URL pembayaran eksternal untuk metode checkout link */
  checkoutLink?: string;
  status: MarketplaceOrderStatus;
  createdAt: string; // ISO string
  allowInstallment?: boolean;
  installments?: MarketplaceInstallment[];
  /** Pilihan cicilan yang dipilih user (DP, jumlah cicilan, per tagihan) */
  installmentSelection?: InstallmentSelection;
  /** Status approval order (jika perlu approval sebelum bayar) */
  approvalStatus?: 'WAITING_APPROVAL' | 'APPROVED' | 'REJECTED';
  /** Kode voucher yang dipakai (opsional) */
  voucherCode?: string;
  /** Potongan dari voucher (opsional) */
  voucherDiscount?: number;
  /** Asuransi pengiriman (opsional) */
  shippingInsuranceFee?: number;
}
