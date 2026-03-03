import { createPluginModule } from '@core/config';

export * from './components/screens/DonationHubScreen';
export * from './components/screens/CampaignDetailScreen';
export * from './components/screens/DonationInputScreen';
export * from './components/screens/DonationHistoryScreen';
export * from './components/screens/ZakatCalculatorScreen';
export * from './components/screens/ZakatInputScreen';
export * from './components/screens/DonationListScreen';
export * from './components/screens/DonorListScreen';

const manifest = require('./plugin.manifest.json');

const componentLoaders: Record<string, () => Promise<any>> = {
  DonationHubScreen: () => import('./components/screens/DonationHubScreen'),
  CampaignDetailScreen: () => import('./components/screens/CampaignDetailScreen'),
  DonationInputScreen: () => import('./components/screens/DonationInputScreen'),
  DonationHistoryScreen: () => import('./components/screens/DonationHistoryScreen'),
  ZakatCalculatorScreen: () => import('./components/screens/ZakatCalculatorScreen'),
  ZakatInputScreen: () => import('./components/screens/ZakatInputScreen'),
  DonationListScreen: () => import('./components/screens/DonationListScreen'),
  DonorListScreen: () => import('./components/screens/DonorListScreen'),
};

export default createPluginModule(manifest, componentLoaders);
