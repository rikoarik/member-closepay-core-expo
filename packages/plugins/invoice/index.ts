/**
 * Invoice Plugin
 * Invoice and billing management - create, send, and pay invoices
 */

import { createPluginModule } from '@core/config';

export { InvoiceScreen } from './components/screens';
export { InvoiceListScreen } from './components/screens';
export { InvoiceDetailScreen } from './components/screens';

export { InvoiceTab } from './components/tabs';
export { InvoiceFeatured } from './components/widgets';

export { useInvoiceData, getInvoices, getInvoiceById } from './hooks';
export type { Invoice, InvoiceStatus, InvoiceSenderType } from './models';

export const InvoiceModule = {
  id: 'invoice',
  name: 'Invoice',
  screens: {
    Invoice: 'InvoiceScreen',
    InvoiceList: 'InvoiceListScreen',
    InvoiceDetail: 'InvoiceDetailScreen',
    InvoicePayment: 'InvoicePaymentScreen',
  },
};

const manifest = require('./plugin.manifest.json');

const componentLoaders: Record<string, () => Promise<any>> = {
  InvoiceScreen: () => import('./components/screens/InvoiceScreen'),
  InvoiceListScreen: () => import('./components/screens/InvoiceListScreen'),
  InvoiceDetailScreen: () => import('./components/screens/InvoiceDetailScreen'),
  InvoiceCreateScreen: () => import('./components/screens/InvoiceCreateScreen'),
  InvoicePaymentScreen: () => import('./components/screens/InvoicePaymentScreen'),
  InvoicePaymentSuccessScreen: () => import('./components/screens/InvoicePaymentSuccessScreen'),
  InvoiceTab: () => import('./components/tabs/InvoiceTab'),
  InvoiceFeatured: () => import('./components/widgets/InvoiceFeatured'),
};

export default createPluginModule(manifest, componentLoaders);
