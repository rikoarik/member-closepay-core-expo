/**
 * Plugin Marketplace - Complete marketplace with search and product browsing
 * Module untuk marketplace lengkap dengan search dan browsing produk
 */

// Export semua public API
export { MarketplaceScreen } from './components/screens/MarketplaceScreen';
export { SearchScreen } from './components/screens/SearchScreen';
export { SearchResultsScreen } from './components/screens/SearchResultsScreen';
export { CartScreen } from './components/screens/CartScreen';
export { ProductDetailScreen } from './components/screens/ProductDetailScreen';
export { ProductReviewsScreen } from './components/screens/ProductReviewsScreen';
export { StoreDetailScreen } from './components/screens/StoreDetailScreen';
export { StoreProductSearchScreen } from './components/screens/StoreProductSearchScreen';
export { StoreProductSearchResultsScreen } from './components/screens/StoreProductSearchResultsScreen';
export { CheckoutScreen } from './components/screens/CheckoutScreen';
export { PaymentMethodSelectionScreen } from './components/screens/PaymentMethodSelectionScreen';
export { MarketplaceOrderDetailScreen } from './components/screens/MarketplaceOrderDetailScreen';
export { MarketplaceOrderProvider } from './context/MarketplaceOrderContext';
export { ProductCard } from './components/shared/ProductCard';
export type { Product } from './components/shared/ProductCard';
export { ProductCardSkeleton } from './components/shared/ProductCardSkeleton';
export { CartBar } from './components/shared/CartBar';
export { useMarketplaceData, getCategories, getAllStores } from './hooks/useMarketplaceData';
export type { Store } from './hooks/useMarketplaceData';
export { StoreCard } from './components/shared/StoreCard';
export { useSearch } from './hooks/useSearch';
export { useMarketplaceCart } from './hooks/useMarketplaceCart';
export { useMarketplaceWishlist } from './hooks/useMarketplaceWishlist';
export { marketplaceOrderService } from './services/marketplaceOrderService';
export {
  marketplaceInstallmentService,
  type InstallmentWithOrder,
} from './services/marketplaceInstallmentService';
export { installmentApiService, DEFAULT_INSTALLMENT_CONFIG } from './services/installmentApiService';
export type {
  InstallmentSummaryParams,
  InstallmentSummaryData,
  CreateInstallmentOrderParams,
  CreateInstallmentOrderResult,
  CheckoutLinkResult,
  InstallmentTransaction,
  InstallmentStatusResult,
} from './services/installmentApiService';
export { useInstallmentAPI } from './hooks/useInstallmentAPI';
export type { InstallmentCalculateResult } from './hooks/useInstallmentAPI';

// Module definition
export const MarketplaceModule = {
  id: 'marketplace',
  name: 'Marketplace',
  screens: {
    Marketplace: 'MarketplaceScreen',
    Search: 'SearchScreen',
    SearchResults: 'SearchResultsScreen',
    Cart: 'CartScreen',
    ProductDetail: 'ProductDetailScreen',
    ProductReviews: 'ProductReviewsScreen',
    StoreDetail: 'StoreDetailScreen',
    StoreProductSearch: 'StoreProductSearchScreen',
    StoreProductSearchResults: 'StoreProductSearchResultsScreen',
    Checkout: 'CheckoutScreen',
    MarketplacePaymentMethod: 'PaymentMethodSelectionScreen',
    MarketplaceOrderDetail: 'MarketplaceOrderDetailScreen',
  },
};
