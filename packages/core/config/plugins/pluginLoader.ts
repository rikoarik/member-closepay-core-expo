/**
 * Plugin Loader
 * Dynamic plugin manifest loading based on configuration
 * No hardcode - uses plugin registry for discovery
 */

import { PluginRegistry } from './PluginRegistry';
import { validateManifestOrThrow } from './manifestValidator';
import { configService } from '../services/configService';
import type { PluginRegistryEntry } from './PluginRegistry';
import { logger } from '../services/loggerService';
import type { PluginManifest } from './types';

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
 * Load plugin manifest from static loader map
 */
async function loadPluginManifest(pluginId: string): Promise<PluginManifest> {
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

/**
 * Initialize and register plugins dynamically based on configuration
 * Only loads plugins that are enabled in AppConfig
 */
export async function initializePlugins(): Promise<void> {
  if (PluginRegistry.isInitialized()) {
    logger.debug('PluginRegistry already initialized');
    return;
  }

  logger.info('Initializing PluginRegistry...');

  try {
    // Get enabled plugins from config
    const config = configService.getConfig();

    // Discover all plugins from registry
    const allManifests = await Promise.all(
      PLUGIN_REGISTRY.map(async (entry) => {
        try {
          const manifest = await loadPluginManifest(entry.id);
          validateManifestOrThrow(manifest);
          return manifest;
        } catch (error) {
          logger.error(`Failed to load plugin ${entry.id}`, error);
          return null;
        }
      })
    );

    // Type guard filter to properly remove null values
    const validManifests = allManifests.filter((m): m is NonNullable<typeof m> => m !== null);

    // Core plugins are determined from manifest.type === 'core-plugin'
    const corePlugins = validManifests
      .filter(m => m.type === 'core-plugin')
      .map(m => m.id);

    // Get enabled plugins from config (fallback to all if config not loaded)
    const enabledPlugins = config?.enabledModules || [];

    // Combine core plugins with enabled plugins (remove duplicates)
    const pluginsToLoad = new Set([...corePlugins, ...enabledPlugins]);

    logger.info(`Loading ${pluginsToLoad.size} plugins:`, Array.from(pluginsToLoad));

    // Register only enabled plugins
    const manifestsToRegister = validManifests.filter(m =>
      pluginsToLoad.has(m.id)
    );

    // Register all enabled plugins
    manifestsToRegister.forEach(manifest => {
      PluginRegistry.registerPlugin(manifest);
    });

    // Enable plugins based on config
    // Core plugins are already enabled by default in PluginRegistry.registerPlugin
    // Enable additional plugins from config
    for (const pluginId of enabledPlugins) {
      if (pluginsToLoad.has(pluginId)) {
        PluginRegistry.enablePlugin(pluginId);
      }
    }

    PluginRegistry.markInitialized();
    logger.info(`PluginRegistry initialized with ${manifestsToRegister.length} plugins`);
  } catch (error) {
    logger.error('Failed to initialize plugins', error);
    // Don't throw - allow app to continue with no plugins
    PluginRegistry.markInitialized();
  }
}

/**
 * Get initialization status
 */
export function isPluginSystemInitialized(): boolean {
  return PluginRegistry.isInitialized();
}
