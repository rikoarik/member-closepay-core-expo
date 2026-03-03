/**
 * Marketplace FnB Plugin
 * Food & Beverage ordering with dine-in, take away, and delivery options
 */

import { createPluginModule } from '@core/config';

// Models
export type {
    FnBItem,
    FnBVariant,
    FnBAddon,
    FnBCategory,
    FnBOrder,
    FnBOrderItem,
    OrderType,
    EntryPoint,
    OrderStatus,
    FnBStore,
    FnBQRData,
    OperatingHour,
    DeliverySettings,
} from './models';
export { getAvailableOrderTypes, isStoreOpen, parseFnBQRCode } from './models';

// Context (required for shared cart and active order)
export { FnBCartProvider, FnBCartContext } from './context/FnBCartContext';
export { FnBActiveOrderProvider, useFnBActiveOrder } from './context/FnBActiveOrderContext';

// Hooks
export { useFnBData, useFnBCart, useFnBFavorites } from './hooks';

// Components
export {
    FnBItemCard,
    FnBCategoryTabs,
    FnBCartBar,
    FnBItemDetailSheet,
    MerchantHeader,
} from './components/shared';

// Screens
export { FnBScreen, FnBMerchantDetailScreen, FnBCheckoutScreen, FnBOrderStatusScreen, FnBPaymentSuccessScreen, FnBOrderHistoryScreen, FnBScanScreen, FnBFavoritesScreen, FnBOrderTrackingScreen, FnBChatDriverScreen } from './components/screens';

// Module definition
export const FnBModule = {
    id: 'marketplace-fnb',
    name: 'F&B Marketplace',
    screens: {
        FnB: 'FnBScreen',
        FnBMerchantDetail: 'FnBMerchantDetailScreen',
        FnBCheckout: 'FnBCheckoutScreen',
        FnBScan: 'FnBScanScreen',
        FnBFavorites: 'FnBFavoritesScreen',
    FnBPaymentSuccess: 'FnBPaymentSuccessScreen',
    FnBOrderHistory: 'FnBOrderHistoryScreen',
    },
};

const manifest = require('./plugin.manifest.json');

const componentLoaders: Record<string, () => Promise<any>> = {
  FnBItemCard: () => import('./components/shared/FnBItemCard'),
  FnBCategoryTabs: () => import('./components/shared/FnBCategoryTabs'),
  FnBCartBar: () => import('./components/shared/FnBCartBar'),
  FnBItemDetailSheet: () => import('./components/shared/FnBItemDetailSheet'),
  MerchantHeader: () => import('./components/shared/MerchantHeader'),
  FnBFavorites: () => import('./components/screens/FnBFavoritesScreen'),
  FnBFavoritesScreen: () => import('./components/screens/FnBFavoritesScreen'),
  FnBScreen: () => import('./components/screens/FnBScreen'),
  FnBMerchantDetailScreen: () => import('./components/screens/FnBMerchantDetailScreen'),
  FnBCheckoutScreen: () => import('./components/screens/FnBCheckoutScreen'),
  FnBScanScreen: () => import('./components/screens/FnBScanScreen'),
  FnBOrderStatusScreen: () => import('./components/screens/FnBOrderStatusScreen'),
  FnBPaymentSuccessScreen: () => import('./components/screens/FnBPaymentSuccessScreen'),
  FnBOrderHistoryScreen: () => import('./components/screens/FnBOrderHistoryScreen'),
  FnBOrderTrackingScreen: () => import('./components/screens/FnBOrderTrackingScreen'),
  FnBChatDriverScreen: () => import('./components/screens/FnBChatDriverScreen'),
  FnBTab: () => import('./components/tabs/FnBTab'),
  FnBOrderTab: () => import('./components/tabs/FnBOrderTab'),
  FnBHistoryTab: () => import('./components/tabs/FnBHistoryTab'),
  FnBBalanceTab: () => import('./components/tabs/FnBBalanceTab'),
  FnBRecentOrders: () => import('./components/widgets/FnBRecentOrders'),
  FnBOrderFloatingWidget: () => import('./components/widgets/FnBOrderFloatingWidget'),
};

export default createPluginModule(manifest, componentLoaders);
