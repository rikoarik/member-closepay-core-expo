/**
 * Core Payment Module
 * Export semua types, services, dan components
 */

import { createPluginModule } from '@core/config';

// Types
export * from './types';

// Services
export * from './services/paymentService';
export * from './services/topUpService';
export * from './services/withdrawService';
export * from './services/transferService';
export * from './services/cardTransactionService';
// nfcBluetoothService not re-exported: uses native NFC/BLE, loads only when imported directly (e.g. TopUpMemberScreen, BluetoothDeviceSelector)

// Components - organized by feature
export * from './components/topup';
export * from './components/withdraw';
export * from './components/virtual-account';
export * from './components/transfer-member';
export * from './components/qr';
export * from './components/shared';

const manifest = require('./plugin.manifest.json');

const componentLoaders: Record<string, () => Promise<any>> = {
  TopUpEntryScreen: () => import('./components/topup/TopUpEntryScreen'),
  TopUpScreen: () => import('./components/topup/TopUpScreen'),
  TopUpCloseScreen: () => import('./components/topup/TopUpCloseScreen'),
  VirtualAccountScreen: () => import('./components/virtual-account/VirtualAccountScreen'),
  WithdrawScreen: () => import('./components/withdraw/WithdrawScreen'),
  WithdrawSuccessScreen: () => import('./components/withdraw/WithdrawSuccessScreen'),
  TopUpMemberScreen: () => import('./components/topup/TopUpMemberScreen'),
  TopUpMemberSummaryScreen: () => import('./components/topup/TopUpMemberSummaryScreen'),
  TopUpMemberPinScreen: () => import('./components/topup/TopUpMemberPinScreen'),
  TopUpMemberSuccessScreen: () => import('./components/topup/TopUpMemberSuccessScreen'),
  TransferMemberScreen: () => import('./components/transfer-member/TransferMemberScreen'),
  TransferMemberSuccessScreen: () => import('./components/transfer-member/TransferMemberSuccessScreen'),
  TapKartuSummaryScreen: () => import('./components/topup/TapKartuSummaryScreen'),
  VirtualCardTopUpAmountScreen: () => import('./components/topup/VirtualCardTopUpAmountScreen'),
  QrScreen: () => import('./components/qr/QrScreen'),
  EditQuickAmountScreen: () => import('./components/qr/EditQuickAmountScreen'),
  PinInput: () => import('./components/shared/PinInput'),
  WithdrawConfirmModal: () => import('./components/withdraw/WithdrawConfirmModal'),
  AutoWithdrawModal: () => import('./components/withdraw/AutoWithdrawModal'),
  PaymentTab: () => import('./components/tabs/PaymentTab'),
  PaymentQrisTab: () => import('./components/tabs/PaymentQrisTab'),
  PaymentTransferTab: () => import('./components/tabs/PaymentTransferTab'),
  PaymentVATab: () => import('./components/tabs/PaymentVATab'),
  PaymentBankTab: () => import('./components/tabs/PaymentBankTab'),
  PaymentMemberTab: () => import('./components/tabs/PaymentMemberTab'),
};

export default createPluginModule(manifest, componentLoaders);
