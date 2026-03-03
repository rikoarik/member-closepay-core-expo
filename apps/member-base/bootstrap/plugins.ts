/**
 * Plugin bootstrap — single place that registers all plugins with Core.
 * Adding a plugin = add import + add to registerPlugins([...]).
 * Core does not know plugin IDs or paths.
 */

import { PluginRegistry } from '@core/config';

import balance from '@plugins/balance';
import payment from '@plugins/payment';
import cardTransaction from '@plugins/card-transaction';
import marketplace from '@plugins/marketplace';
import marketplaceFnb from '@plugins/marketplace-fnb';
import invoice from '@plugins/invoice';
import donasiZakat from '@plugins/donasi-zakat';

export function bootstrapPlugins(): void {
  PluginRegistry.registerPlugins([
    balance,
    payment,
    cardTransaction,
    marketplace,
    marketplaceFnb,
    invoice,
    donasiZakat,
  ]);

  if (__DEV__) {
    PluginRegistry.validate();
  }
}
