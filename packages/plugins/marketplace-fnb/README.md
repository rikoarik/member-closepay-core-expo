# Plugin Marketplace FnB

Food & Beverage ordering plugin with dine-in, take away, and delivery options.

## Overview

This plugin provides a complete FnB ordering experience with:

- Browse menu with category filtering
- Cart management with variants and addons
- Order type selection based on entry point
- Checkout with conditional form fields

## Features

- ✅ Menu browsing with category tabs
- ✅ Product cards with quick-add button
- ✅ Item detail sheet with variants/addons
- ✅ Floating cart bar
- ✅ Entry-point aware order types:
  - Scan QR → Dine-in + Take Away
  - Browse App → Take Away + Delivery
- ✅ Checkout with dynamic form fields
- ✅ Operating hours support
- ✅ Delivery settings

## Usage

### Screens

```typescript
import { FnBScreen, FnBCheckoutScreen } from '@plugins/marketplace-fnb';

// Main menu screen
<FnBScreen entryPoint="browse" />

// After QR scan
<FnBScreen entryPoint="scan-qr" />
```

### Hooks

```typescript
import { useFnBData, useFnBCart } from '@plugins/marketplace-fnb';

const { items, categories, store, loading, refresh } = useFnBData('browse');
const { cartItems, addItem, removeItem, subtotal, itemCount } = useFnBCart('browse');
```

### QR Code Parsing

```typescript
import { parseFnBQRCode } from '@plugins/marketplace-fnb';

const qrData = parseFnBQRCode('closepay://fnb/store-001');
// { type: 'fnb-store', storeId: 'store-001', storeName: '' }
```

## Entry Points

| Entry Point | Available Order Types |
| ----------- | --------------------- |
| `scan-qr`   | Dine-in, Take Away    |
| `browse`    | Take Away, Delivery   |

## Configuration

Add to your app config:

```typescript
// apps/your-app/config/app.config.ts
export const appConfig = {
  enabledModules: ['balance', 'payment', 'marketplace-fnb'],
  homeTabs: [{ id: 'fnb', label: 'Pesan Makanan', visible: true, order: 4 }],
};
```

## File Structure

```
packages/plugins/marketplace-fnb/
├── components/
│   ├── screens/
│   │   ├── FnBScreen.tsx
│   │   ├── FnBMerchantDetailScreen.tsx
│   │   ├── FnBCheckoutScreen.tsx
│   │   ├── FnBScanScreen.tsx
│   │   ├── FnBScanScreenExpo.tsx
│   │   ├── FnBScanScreen.web.tsx
│   │   ├── FnBFavoritesScreen.tsx
│   │   ├── FnBOrderStatusScreen.tsx
│   │   ├── FnBPaymentSuccessScreen.tsx
│   │   ├── FnBOrderTrackingScreen.tsx
│   │   ├── FnBChatDriverScreen.tsx
│   │   └── FnBOrderHistoryScreen.tsx
│   ├── shared/
│   │   ├── FnBItemCard.tsx
│   │   ├── FnBCategoryTabs.tsx
│   │   ├── FnBCartBar.tsx
│   │   ├── FnBItemDetailSheet.tsx
│   │   ├── FnBCartDetailSheet.tsx
│   │   ├── FnBLocationPickerModal.tsx
│   │   ├── FnBLocationPickerModal.web.tsx
│   │   ├── MerchantHeader.tsx
│   │   └── (skeletons)
│   ├── tabs/
│   │   ├── FnBTab.tsx
│   │   ├── FnBOrderTab.tsx
│   │   ├── FnBHistoryTab.tsx
│   │   └── FnBBalanceTab.tsx
│   └── widgets/
│       ├── FnBRecentOrders.tsx
│       └── FnBOrderFloatingWidget.tsx
├── context/
│   ├── FnBCartContext.tsx
│   └── FnBActiveOrderContext.tsx
├── hooks/
│   ├── useFnBData.ts
│   ├── useFnBCart.ts
│   ├── useFnBFavorites.ts
│   └── useFnBStoreFavorites.ts
├── models/
│   ├── FnBItem.ts
│   ├── FnBCategory.ts
│   ├── FnBOrder.ts
│   └── FnBStore.ts
├── utils/
│   ├── activeOrderStorage.ts
│   ├── deliveryStorage.ts
│   └── chatTemplateStorage.ts
├── data/
│   └── fnbDummyData.ts
├── plugin.manifest.json
├── index.ts
└── README.md
```

## Dependencies

- `@core/config` - Responsive utilities
- `@core/theme` - Theme colors
- `@core/i18n` - Translations
