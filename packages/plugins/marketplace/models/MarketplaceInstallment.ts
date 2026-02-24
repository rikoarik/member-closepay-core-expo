/**
 * Marketplace Installment Model
 * Cicilan per order marketplace
 */

export interface MarketplaceInstallment {
  id: string;
  orderId: string;
  amount: number;
  dueDate: string; // ISO string
  status: 'unpaid' | 'paid';
  paidAt?: string; // ISO string
}
