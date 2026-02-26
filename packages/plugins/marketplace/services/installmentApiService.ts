/**
 * Installment API Service — MOCK
 * Semua response mock; tidak ada panggilan HTTP. Ganti dengan axiosInstance saat backend siap.
 */

import type { InstallmentConfig, InstallmentSelection, InstallmentModeConfig } from '../models/MarketplaceInstallment';

const DEFAULT_INSTALLMENT_MODES: InstallmentModeConfig[] = [
  {
    id: 'dp_no_interest',
    label: 'DP + Cicilan (Tanpa Bunga)',
    allowZeroDp: false,
    minDpPercent: 20,
    interestRatePerMonth: 0,
  },
];

/** Config cicilan mock admin (default: 1 mode = DP tanpa bunga) */
export const DEFAULT_INSTALLMENT_CONFIG: InstallmentConfig = {
  minDpPercent: 20,
  hasTenor: true,
  tenorOptions: [3, 6, 9, 12, 18, 24, 30, 36],
  interestRatePerMonth: 0,
  maxInstallmentCount: 72,
  installmentStep: 2,
  modes: DEFAULT_INSTALLMENT_MODES,
  defaultModeId: 'dp_no_interest',
};

export interface InstallmentSummaryParams {
  orderData: { total: number; [key: string]: unknown };
  dp: number;
  count: number;
}

export interface InstallmentSummaryData {
  downPayment: number;
  remaining: number;
  installmentCount: number;
  monthlyAmount: number;
  totalInterest: number;
  totalPayment: number;
  schedule?: { sequenceNumber: number; dueDate: string; amount: number }[];
}

export interface CreateInstallmentOrderParams {
  orderData: unknown;
  paymentMethod: 'balance' | 'co_link' | 'va';
  installmentSelection: InstallmentSelection;
  addressId?: string;
  shippingOptionId?: string;
  voucherCode?: string;
}

export interface CreateInstallmentOrderResult {
  transactionId: string[];
  orderList: { orderId: string; orderNumber: string }[];
  approvalStatus?: 'WAITING_APPROVAL' | 'APPROVED' | 'REJECTED';
}

export interface CheckoutLinkResult {
  checkoutLink: string;
}

export interface InstallmentTransaction {
  id: string;
  orderId: string;
  orderNumber: string;
  amount: number;
  dueDate: string;
  status: 'unpaid' | 'paid' | 'overdue';
  paidAt?: string;
  sequenceNumber?: number;
}

export interface InstallmentStatusResult {
  status: 'WAITING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  checkoutLink?: string;
}

export const installmentApiService = {
  /**
   * Config cicilan — mock: selalu return default (tanpa HTTP).
   */
  async getConfig(): Promise<InstallmentConfig> {
    return Promise.resolve(DEFAULT_INSTALLMENT_CONFIG);
  },

  /**
   * Preview summary — mock: return null (frontend pakai calculate lokal).
   */
  async getSummary(_params: InstallmentSummaryParams): Promise<InstallmentSummaryData | null> {
    return Promise.resolve(null);
  },

  /**
   * Create installment order — mock: return transaction ID dummy.
   */
  async createOrder(
    params: CreateInstallmentOrderParams
  ): Promise<CreateInstallmentOrderResult> {
    const id = `mock-${Date.now()}`;
    return Promise.resolve({
      transactionId: [id],
      orderList: [{ orderId: id, orderNumber: `INV/MOCK/${Date.now()}` }],
      approvalStatus: 'APPROVED',
    });
  },

  /**
   * Checkout DP — mock: return link dummy (untuk CO Link/VA nanti buka WebView).
   */
  async checkoutDP(transactionId: string): Promise<CheckoutLinkResult> {
    return Promise.resolve({
      checkoutLink: `https://mock-payment.example.com/dp?tx=${encodeURIComponent(transactionId)}`,
    });
  },

  /**
   * Bayar cicilan — mock: return link dummy.
   */
  async checkoutInstallment(installmentId: string): Promise<CheckoutLinkResult> {
    return Promise.resolve({
      checkoutLink: `https://mock-payment.example.com/inst?id=${encodeURIComponent(installmentId)}`,
    });
  },

  /**
   * List tagihan — mock: return array kosong (data cicilan dari order lokal/context).
   */
  async getTransactions(_status: 'NOT_PAID' | 'PAID'): Promise<InstallmentTransaction[]> {
    return Promise.resolve([]);
  },

  /**
   * Cek status approval — mock: COMPLETED.
   */
  async checkStatus(_orderId: string): Promise<InstallmentStatusResult> {
    return Promise.resolve({ status: 'COMPLETED' });
  },
};
