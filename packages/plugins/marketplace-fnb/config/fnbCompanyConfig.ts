/**
 * FnB company config – order types, payment methods, balance types.
 * Default/static for now; later can be replaced by API (admin per company).
 */

import type { OrderType, FnBPaymentMethod, FnBBalanceType } from '../models/FnBOrder';

export type { FnBPaymentMethod, FnBBalanceType };

export interface FnBCompanyConfig {
  /** Order types allowed for browse flow (scan-qr always uses dine-in + take-away) */
  allowedOrderTypes: OrderType[];
  /** Payment methods offered at checkout */
  allowedPaymentMethods: FnBPaymentMethod[];
  /** Balance types when payment method is balance (saldo makanan, utama, plafon) */
  allowedBalanceTypes: FnBBalanceType[];
}

const DEFAULT_FNB_COMPANY_CONFIG: FnBCompanyConfig = {
  allowedOrderTypes: ['dine-in', 'take-away', 'delivery'],
  allowedPaymentMethods: ['pay_at_counter', 'pay_later', 'balance'],
  allowedBalanceTypes: ['saldo-makan', 'saldo-utama', 'saldo-plafon'],
};

let cachedConfig: FnBCompanyConfig | null = null;

/**
 * Get FnB company config. Returns static default for now.
 * Later: replace with API fetch per company/tenant.
 */
export function getFnBCompanyConfig(): FnBCompanyConfig {
  if (cachedConfig) return cachedConfig;
  cachedConfig = { ...DEFAULT_FNB_COMPANY_CONFIG };
  return cachedConfig;
}

/**
 * Set config (e.g. after loading from API). Used for tests or when wiring API later.
 */
export function setFnBCompanyConfig(config: FnBCompanyConfig | null): void {
  cachedConfig = config;
}
