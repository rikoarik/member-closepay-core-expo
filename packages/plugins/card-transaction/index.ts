/**
 * Plugin Balance Management - Card Transaction Module
 * Module untuk transaksi kartu UI
 */

import { createPluginModule } from '@core/config';

// Screens
export * from './components/screens';
// Tabs (for Home tab bar)
export { VirtualCardTab } from './components/tabs/VirtualCardTab';

const manifest = require('./plugin.manifest.json');

const componentLoaders: Record<string, () => Promise<any>> = {
  VirtualCardScreen: () => import('./components/screens/VirtualCardScreen'),
  VirtualCardDetailScreen: () => import('./components/screens/VirtualCardDetailScreen'),
  AddVirtualCardScreen: () => import('./components/screens/AddVirtualCardScreen'),
  CardTransactionHistoryScreen: () => import('./components/screens/CardTransactionHistoryScreen'),
  CardQrScreen: () => import('./components/screens/CardQrScreen'),
  CardWithdrawScreen: () => import('./components/screens/CardWithdrawScreen'),
  CardActivityLogScreen: () => import('./components/screens/CardActivityLogScreen'),
  SetPinFlowScreen: () => import('./components/screens/SetPinFlowScreen'),
  ActivatePinScreen: () => import('./components/screens/ActivatePinScreen'),
  VirtualCardTab: () => import('./components/tabs/VirtualCardTab'),
  CardDetailTab: () => import('./components/tabs/CardDetailTab'),
  CardTransactionTab: () => import('./components/tabs/CardTransactionTab'),
  CardLimitTab: () => import('./components/tabs/CardLimitTab'),
  CardTopupTab: () => import('./components/tabs/CardTopupTab'),
  CardSummary: () => import('./components/widgets/CardSummary'),
};

export default createPluginModule(manifest, componentLoaders);
