/**
 * Plugin Loader
 * Dynamic plugin manifest loading based on configuration
 * No hardcode - uses plugin registry for discovery
 */

import { validateManifestOrThrow } from './manifestValidator';
import { logger } from '../services/loggerService';
import type { PluginManifest, PluginRegistryEntry } from './types';

/**
 * Static manifest loaders - Metro requires static paths (use require, not dynamic import).
 * Dynamic import() of JSON in Metro can yield "Requiring unknown module" at runtime;
 * require() is resolved at bundle time and works reliably.
 *
 * To add a new plugin:
 * 1. Create plugin.manifest.json in packages/plugins/{pluginId}/
 * 2. Add entry here: '{pluginId}': () => Promise.resolve({ default: require('../../../plugins/{pluginId}/plugin.manifest.json') }),
 * 3. Enable plugin in app.config (enabledModules)
 */
export const MANIFEST_LOADERS: Record<string, () => Promise<{ default: PluginManifest } | PluginManifest>> = {
  balance: () => Promise.resolve({ default: require('../../../plugins/balance/plugin.manifest.json') as PluginManifest }),
  payment: () => Promise.resolve({ default: require('../../../plugins/payment/plugin.manifest.json') as PluginManifest }),
  'card-transaction': () => Promise.resolve({ default: require('../../../plugins/card-transaction/plugin.manifest.json') as PluginManifest }),
  marketplace: () => Promise.resolve({ default: require('../../../plugins/marketplace/plugin.manifest.json') as PluginManifest }),
  'marketplace-fnb': () => Promise.resolve({ default: require('../../../plugins/marketplace-fnb/plugin.manifest.json') as PluginManifest }),
  'sport-center': () => Promise.resolve({ default: require('../../../plugins/sport-center/plugin.manifest.json') as PluginManifest }),
  invoice: () => Promise.resolve({ default: require('../../../plugins/invoice/plugin.manifest.json') as PluginManifest }),
  'donasi-zakat': () => Promise.resolve({ default: require('../../../plugins/donasi-zakat/plugin.manifest.json') as PluginManifest }),
};

/**
 * Dynamic plugin registry
 * Automatically derived from MANIFEST_LOADERS to avoid duplication
 * All plugins with manifest loaders are automatically in the registry
 */
export const PLUGIN_REGISTRY: PluginRegistryEntry[] = Object.keys(MANIFEST_LOADERS).map(id => ({
  id,
  manifestPath: `../../../plugins/${id}/plugin.manifest.json`,
}));

/**
 * Load plugin manifest from static loader map. Exported for PluginRegistry.
 */
export async function loadPluginManifest(pluginId: string): Promise<PluginManifest> {
  const loader = MANIFEST_LOADERS[pluginId];
  if (!loader) {
    throw new Error(`Plugin ${pluginId} not found in manifest loaders`);
  }
  try {
    const module = await loader();
    return 'default' in module ? module.default : module;
  } catch (error) {
    logger.error(`Failed to load manifest for plugin ${pluginId}`, error);
    throw error;
  }
}
