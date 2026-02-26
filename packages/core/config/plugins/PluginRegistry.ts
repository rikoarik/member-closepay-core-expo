/**
 * Plugin Registry
 * Dynamic registry derived from PLUGIN_REGISTRY in pluginLoader (no circular import).
 */

import type { PluginManifest, PluginRoute, PluginRegistryEntry } from './types';
import { PLUGIN_REGISTRY, loadPluginManifest } from './pluginLoader';
import { validateManifestOrThrow } from './manifestValidator';
import { configService } from '../services/configService';
import { logger } from '../services/loggerService';

/**
 * Get plugin registry entry by ID
 */
export function getPluginRegistryEntry(pluginId: string): PluginRegistryEntry | undefined {
  return PLUGIN_REGISTRY.find(entry => entry.id === pluginId);
}

/**
 * Get all plugin IDs from registry
 */
export function getAllPluginIds(): string[] {
  return PLUGIN_REGISTRY.map(entry => entry.id);
}

export type { PluginManifest, PluginRegistryEntry };

/**
 * PluginRegistry class
 * Manages registered plugins and their state
 */
class PluginRegistryClass {
  private initialized: boolean = false;
  private plugins: Map<string, PluginManifest> = new Map();
  private enabledPlugins: Set<string> = new Set();

  /**
   * Check if registry is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Mark registry as initialized
   */
  markInitialized(): void {
    this.initialized = true;
  }

  /**
   * Register a plugin manifest
   */
  registerPlugin(manifest: PluginManifest): void {
    this.plugins.set(manifest.id, manifest);
    // Core plugins are enabled by default
    if (manifest.type === 'core-plugin') {
      this.enabledPlugins.add(manifest.id);
    }
  }

  /**
   * Enable a plugin
   */
  enablePlugin(pluginId: string): void {
    if (this.plugins.has(pluginId)) {
      this.enabledPlugins.add(pluginId);
    }
  }

  /**
   * Disable a plugin
   */
  disablePlugin(pluginId: string): void {
    this.enabledPlugins.delete(pluginId);
  }

  /**
   * Check if a plugin is enabled
   */
  isPluginEnabled(pluginId: string): boolean {
    return this.enabledPlugins.has(pluginId);
  }

  /**
   * Get a registered plugin manifest
   */
  getPlugin(pluginId: string): PluginManifest | undefined {
    return this.plugins.get(pluginId);
  }

  /**
   * Get all registered plugins
   */
  getAllPlugins(): PluginManifest[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get all enabled plugins
   */
  getEnabledPlugins(): PluginManifest[] {
    return Array.from(this.plugins.values()).filter(p => this.enabledPlugins.has(p.id));
  }

  /**
   * Get all routes from enabled plugins
   */
  getEnabledRoutes(): PluginRoute[] {
    const routes: PluginRoute[] = [];
    for (const plugin of this.getEnabledPlugins()) {
      if (plugin.routes) {
        routes.push(...plugin.routes);
      }
    }
    return routes;
  }

  /**
   * Check if a route is available (exists in any enabled plugin)
   */
  isRouteAvailable(routeName: string): boolean {
    return this.getEnabledRoutes().some(route => route.name === routeName);
  }

  /**
   * Get a route by name from enabled plugins
   */
  getRouteByName(routeName: string): PluginRoute | undefined {
    return this.getEnabledRoutes().find(route => route.name === routeName);
  }
}

export const PluginRegistry = new PluginRegistryClass();

/**
 * Initialize and register plugins from PLUGIN_REGISTRY. Lives here to avoid pluginLoader → PluginRegistry cycle.
 */
export async function initializePlugins(): Promise<void> {
  if (PluginRegistry.isInitialized()) {
    logger.debug('PluginRegistry already initialized');
    return;
  }
  logger.info('Initializing PluginRegistry...');
  try {
    const config = configService.getConfig();
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
    const validManifests = allManifests.filter((m): m is NonNullable<typeof m> => m !== null);
    const corePlugins = validManifests.filter(m => m.type === 'core-plugin').map(m => m.id);
    const enabledPlugins = config?.enabledModules || [];
    const pluginsToLoad = new Set([...corePlugins, ...enabledPlugins]);
    logger.info(`Loading ${pluginsToLoad.size} plugins:`, Array.from(pluginsToLoad));
    const manifestsToRegister = validManifests.filter(m => pluginsToLoad.has(m.id));
    manifestsToRegister.forEach(manifest => PluginRegistry.registerPlugin(manifest));
    for (const pluginId of enabledPlugins) {
      if (pluginsToLoad.has(pluginId)) PluginRegistry.enablePlugin(pluginId);
    }
    PluginRegistry.markInitialized();
    logger.info(`PluginRegistry initialized with ${manifestsToRegister.length} plugins`);
  } catch (error) {
    logger.error('Failed to initialize plugins', error);
    PluginRegistry.markInitialized();
  }
}

export function isPluginSystemInitialized(): boolean {
  return PluginRegistry.isInitialized();
}
