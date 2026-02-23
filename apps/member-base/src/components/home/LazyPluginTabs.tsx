/**
 * Lazy loaders for plugin tabs so they load reliably in Home (bypasses dynamic plugin loader).
 * Each tabId maps to a function that returns a promise of the component (default or named export).
 */
import React, { lazy } from 'react';

type TabLoader = () => Promise<{ default: React.ComponentType<any> }>;

const wrapNamed = (mod: any, name: string): { default: React.ComponentType<any> } => ({
  default: mod[name] ?? mod.default,
});

const TAB_LOADERS: Record<string, TabLoader> = {
  // card-transaction
  virtualcard: () => import('@plugins/card-transaction/components/tabs/VirtualCardTab').then((m) => wrapNamed(m, 'VirtualCardTab')),
  'kartu-virtual': () => import('@plugins/card-transaction/components/tabs/VirtualCardTab').then((m) => wrapNamed(m, 'VirtualCardTab')),
  'card-detail': () => import('@plugins/card-transaction/components/tabs/CardDetailTab').then((m) => wrapNamed(m, 'CardDetailTab')),
  'detail-kartu': () => import('@plugins/card-transaction/components/tabs/CardDetailTab').then((m) => wrapNamed(m, 'CardDetailTab')),
  'card-transaction': () => import('@plugins/card-transaction/components/tabs/CardTransactionTab').then((m) => wrapNamed(m, 'CardTransactionTab')),
  'transaksi-kartu': () => import('@plugins/card-transaction/components/tabs/CardTransactionTab').then((m) => wrapNamed(m, 'CardTransactionTab')),
  'card-limit': () => import('@plugins/card-transaction/components/tabs/CardLimitTab').then((m) => wrapNamed(m, 'CardLimitTab')),
  'limit-kartu': () => import('@plugins/card-transaction/components/tabs/CardLimitTab').then((m) => wrapNamed(m, 'CardLimitTab')),
  'card-topup': () => import('@plugins/card-transaction/components/tabs/CardTopupTab').then((m) => wrapNamed(m, 'CardTopupTab')),
  // marketplace
  marketplace: () => import('@plugins/marketplace/components/tabs/MarketplaceTab').then((m) => wrapNamed(m, 'MarketplaceTab')),
  'marketplace-general': () => import('@plugins/marketplace/components/tabs/MarketplaceGeneralTab').then((m) => wrapNamed(m, 'MarketplaceGeneralTab')),
  'marketplace-balance': () => import('@plugins/marketplace/components/tabs/MarketplaceBalanceTab').then((m) => wrapNamed(m, 'MarketplaceBalanceTab')),
  'marketplace-transaction': () => import('@plugins/marketplace/components/tabs/MarketplaceTransactionTab').then((m) => wrapNamed(m, 'MarketplaceTransactionTab')),
  // marketplace-fnb
  fnb: () => import('@plugins/marketplace-fnb/components/tabs/FnBTab').then((m) => wrapNamed(m, 'FnBTab')),
  'fnb-order': () => import('@plugins/marketplace-fnb/components/tabs/FnBOrderTab').then((m) => wrapNamed(m, 'FnBOrderTab')),
  'fnb-history': () => import('@plugins/marketplace-fnb/components/tabs/FnBHistoryTab').then((m) => wrapNamed(m, 'FnBHistoryTab')),
  'fnb-balance': () => import('@plugins/marketplace-fnb/components/tabs/FnBBalanceTab').then((m) => wrapNamed(m, 'FnBBalanceTab')),
  // balance
  balance: () => import('@plugins/balance/components/tabs/BalanceTab').then((m) => wrapNamed(m, 'BalanceTab')),
  saldo: () => import('@plugins/balance/components/tabs/BalanceTab').then((m) => wrapNamed(m, 'BalanceTab')),
  'balance-main': () => import('@plugins/balance/components/tabs/BalanceMainTab').then((m) => wrapNamed(m, 'BalanceMainTab')),
  'saldo-utama': () => import('@plugins/balance/components/tabs/BalanceMainTab').then((m) => wrapNamed(m, 'BalanceMainTab')),
  'balance-plafon': () => import('@plugins/balance/components/tabs/BalancePlafonTab').then((m) => wrapNamed(m, 'BalancePlafonTab')),
  'saldo-plafon': () => import('@plugins/balance/components/tabs/BalancePlafonTab').then((m) => wrapNamed(m, 'BalancePlafonTab')),
  'balance-meal': () => import('@plugins/balance/components/tabs/BalanceMealTab').then((m) => wrapNamed(m, 'BalanceMealTab')),
  'saldo-makan': () => import('@plugins/balance/components/tabs/BalanceMealTab').then((m) => wrapNamed(m, 'BalanceMealTab')),
  'balance-history': () => import('@plugins/balance/components/tabs/BalanceHistoryTab').then((m) => wrapNamed(m, 'BalanceHistoryTab')),
  'riwayat-saldo': () => import('@plugins/balance/components/tabs/BalanceHistoryTab').then((m) => wrapNamed(m, 'BalanceHistoryTab')),
  'balance-transfer': () => import('@plugins/balance/components/tabs/BalanceTransferTab').then((m) => wrapNamed(m, 'BalanceTransferTab')),
  'transfer-saldo': () => import('@plugins/balance/components/tabs/BalanceTransferTab').then((m) => wrapNamed(m, 'BalanceTransferTab')),
  'balance-topup': () => import('@plugins/balance/components/tabs/BalanceTopupTab').then((m) => wrapNamed(m, 'BalanceTopupTab')),
  'topup-saldo': () => import('@plugins/balance/components/tabs/BalanceTopupTab').then((m) => wrapNamed(m, 'BalanceTopupTab')),
  'transaction-history': () => import('@plugins/balance/components/tabs/TransactionHistoryTab').then((m) => wrapNamed(m, 'TransactionHistoryTab')),
  'riwayat-transaksi': () => import('@plugins/balance/components/tabs/TransactionHistoryTab').then((m) => wrapNamed(m, 'TransactionHistoryTab')),
  'transaction-all': () => import('@plugins/balance/components/tabs/TransactionAllTab').then((m) => wrapNamed(m, 'TransactionAllTab')),
  'semua-transaksi': () => import('@plugins/balance/components/tabs/TransactionAllTab').then((m) => wrapNamed(m, 'TransactionAllTab')),
  'transaction-card': () => import('@plugins/balance/components/tabs/TransactionCardTab').then((m) => wrapNamed(m, 'TransactionCardTab')),
  'transaksi-kartu-only': () => import('@plugins/balance/components/tabs/TransactionCardTab').then((m) => wrapNamed(m, 'TransactionCardTab')),
  // payment
  payment: () => import('@plugins/payment/components/tabs/PaymentTab').then((m) => wrapNamed(m, 'PaymentTab')),
  pembayaran: () => import('@plugins/payment/components/tabs/PaymentTab').then((m) => wrapNamed(m, 'PaymentTab')),
  'payment-qris': () => import('@plugins/payment/components/tabs/PaymentQrisTab').then((m) => wrapNamed(m, 'PaymentQrisTab')),
  'bayar-qris': () => import('@plugins/payment/components/tabs/PaymentQrisTab').then((m) => wrapNamed(m, 'PaymentQrisTab')),
  'payment-transfer': () => import('@plugins/payment/components/tabs/PaymentTransferTab').then((m) => wrapNamed(m, 'PaymentTransferTab')),
  'bayar-transfer': () => import('@plugins/payment/components/tabs/PaymentTransferTab').then((m) => wrapNamed(m, 'PaymentTransferTab')),
  'payment-va': () => import('@plugins/payment/components/tabs/PaymentVATab').then((m) => wrapNamed(m, 'PaymentVATab')),
  'bayar-va': () => import('@plugins/payment/components/tabs/PaymentVATab').then((m) => wrapNamed(m, 'PaymentVATab')),
  'payment-bank': () => import('@plugins/payment/components/tabs/PaymentBankTab').then((m) => wrapNamed(m, 'PaymentBankTab')),
  'bayar-bank': () => import('@plugins/payment/components/tabs/PaymentBankTab').then((m) => wrapNamed(m, 'PaymentBankTab')),
  'payment-member': () => import('@plugins/payment/components/tabs/PaymentMemberTab').then((m) => wrapNamed(m, 'PaymentMemberTab')),
  'bayar-member': () => import('@plugins/payment/components/tabs/PaymentMemberTab').then((m) => wrapNamed(m, 'PaymentMemberTab')),
  // sport-center
  'sport-center': () => import('@plugins/sport-center/components/tabs/SportCenterTab').then((m) => wrapNamed(m, 'SportCenterTab')),
};

const lazyCache: Record<string, React.LazyExoticComponent<React.ComponentType<any>>> = {};

export function getLazyTab(tabId: string): React.LazyExoticComponent<React.ComponentType<any>> | null {
  const loader = TAB_LOADERS[tabId];
  if (!loader) return null;
  if (!lazyCache[tabId]) {
    lazyCache[tabId] = lazy(loader);
  }
  return lazyCache[tabId];
}

export function hasLazyTab(tabId: string): boolean {
  return tabId in TAB_LOADERS;
}
