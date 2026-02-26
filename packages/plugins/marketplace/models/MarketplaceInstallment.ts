/**
 * Marketplace Installment Model
 * Cicilan per order marketplace
 */

export interface MarketplaceInstallment {
  id: string;
  orderId: string;
  amount: number;
  dueDate: string; // ISO string
  status: 'unpaid' | 'paid' | 'overdue';
  paidAt?: string; // ISO string
  sequenceNumber?: number;
}

export type InstallmentModeId =
  | 'dp_no_interest'
  | 'dp_with_interest'
  | 'zero_dp_no_interest'
  | 'zero_dp_with_interest';

export interface InstallmentModeConfig {
  id: InstallmentModeId;
  label: string;
  allowZeroDp: boolean;
  minDpPercent?: number;
  interestRatePerMonth?: number;
}

/** Config cicilan dari backend */
export interface InstallmentConfig {
  minDpPercent: number; // Min DP (e.g. 20)
  hasTenor?: boolean; // true = pakai tenor bulanan
  tenorOptions?: number[]; // [3, 6, 12] bulan
  interestRatePerMonth?: number; // 0 = tanpa bunga, 0.015 = 1.5%
  maxInstallmentCount?: number; // Max cicilan jika tanpa tenor (e.g. 72)
  installmentStep?: number; // Kelipatan (e.g. 2 → 2,4,6,8...)
  /** Metode cicilan dari admin; fallback ke mode default mock jika kosong */
  modes?: InstallmentModeConfig[];
  defaultModeId?: InstallmentModeId;
}

/** Pilihan cicilan user */
export interface InstallmentSelection {
  modeId?: InstallmentModeId;
  downPayment: number;
  installmentCount: number; // Jumlah cicilan / tenor
  monthlyAmount: number; // Per tagihan
  totalInterest: number; // Total bunga (0 jika tanpa bunga)
  totalPayment: number; // Total semua (DP + cicilan + bunga)
  interestRatePerMonth?: number;
}
