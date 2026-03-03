/**
 * Plugin Registry
 * Plugins are registered via registerPlugins() from app bootstrap; Core does not list plugins by name.
 */

import type { PluginManifest, PluginRoute, PluginRegistryEntry, PluginModule } from './types';
import { getExportComponentNames } from './types';
import { validateManifestOrThrow } from './manifestValidator';
import { configService } from '../services/configService';
import { logger } from '../services/loggerService';
import { getEnabledModuleIds } from '../utils/enabledModules';

/**
 * Get plugin registry entry by ID (for compatibility; manifestPath unused after Phase 2).
 */
export function getPluginRegistryEntry(pluginId: string): PluginRegistryEntry | undefined {
  const manifest = PluginRegistry.getPlugin(pluginId);
  return manifest ? { id: manifest.id, manifestPath: '' } : undefined;
}

/**
 * Get all plugin IDs from registry
 */
export function getAllPluginIds(): string[] {
  return PluginRegistry.getAllPlugins().map(p => p.id);
}

export type { PluginManifest, PluginRegistryEntry, PluginModule };

/**
 * PluginRegistry class
 * Manages registered plugins and their state. Manifests and component loaders come from registerPlugins() only.
 */
class PluginRegistryClass {
  private initialized: boolean = false;
  private plugins: Map<string, PluginManifest> = new Map();
  private componentLoaders: Map<string, Record<string, () => Promise<any>>> = new Map();
  private enabledPlugins: Set<string> = new Set();

  /**
   * Register plugins from app bootstrap. Call before initializePlugins().
   */
  registerPlugins(modules: PluginModule[]): void {
    if (this.initialized) {
      throw new Error('Cannot register plugins after initialization.');
    }
    for (const module of modules) {
      const { manifest, componentLoaders } = module;
      if (this.plugins.has(manifest.id)) {
        throw new Error(`Duplicate plugin id: ${manifest.id}`);
      }
      validateManifestOrThrow(manifest);
      this.plugins.set(manifest.id, Object.freeze(manifest));
      this.componentLoaders.set(manifest.id, componentLoaders);
    }
  }

  /** Whether any plugins have been registered (used to enforce init order). */
  hasRegisteredPlugins(): boolean {
    return this.plugins.size > 0;
  }

  /** Get component loader for a plugin component. Single source of truth. */
  getComponentLoader(pluginId: string, name: string): () => Promise<any> {
    const loaders = this.componentLoaders.get(pluginId);
    if (!loaders) {
      throw new Error(`Plugin not registered: ${pluginId}`);
    }
    const loader = loaders[name];
    if (!loader) {
      throw new Error(`Missing component loader for ${pluginId}:${name}`);
    }
    return loader;
  }

  /** Get all component loaders for a plugin (for getPluginComponentLoaders). */
  getComponentLoaders(pluginId: string): Record<string, () => Promise<any>> {
    return this.componentLoaders.get(pluginId) ?? {};
  }

  /**
   * Validate that every exported component (screens/tabs/widgets/components) has a loader.
   * Call after bootstrapPlugins() in dev only. Flattens all export names via getExportComponentNames.
   */
  validate(): void {
    for (const [pluginId, manifest] of this.plugins) {
      const loaders = this.componentLoaders.get(pluginId);
      const names = getExportComponentNames(manifest.exports);
      for (const name of names) {
        if (!loaders?.[name]) {
          throw new Error(`Missing component loader for ${pluginId}:${name}`);
        }
      }
    }
  }

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
   * Register a single plugin manifest (used internally; prefer registerPlugins from app).
   */
  registerPlugin(manifest: PluginManifest): void {
    this.plugins.set(manifest.id, manifest);
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
 * Apply enabled state from config. Call after bootstrapPlugins() (registerPlugins).
 */
export async function initializePlugins(): Promise<void> {
  if (PluginRegistry.isInitialized()) {
    throw new Error(
      'PluginRegistry.initializePlugins() already called. Do not call twice (e.g. hot-reload).'
    );
  }
  if (!PluginRegistry.hasRegisteredPlugins()) {
    throw new Error(
      'PluginRegistry.initializePlugins() called before registerPlugins(). ' +
        'Did you forget to call bootstrapPlugins()?'
    );
  }
  logger.info('Initializing PluginRegistry...');
  try {
    const config = configService.getEffectiveConfig();
    // Core-plugin always on first, then config.enabledModules
    for (const manifest of PluginRegistry.getAllPlugins()) {
      if (manifest.type === 'core-plugin') {
        PluginRegistry.enablePlugin(manifest.id);
      }
    }
    const enabledIds = getEnabledModuleIds(config.enabledModules);
    for (const id of enabledIds) {
      if (PluginRegistry.getPlugin(id)) {
        PluginRegistry.enablePlugin(id);
      } else {
        logger.warn(`Enabled plugin not registered: ${id}`);
      }
    }
    PluginRegistry.markInitialized();
    logger.info('PluginRegistry initialized');
  } catch (error) {
    logger.error('Failed to initialize plugins', error);
    PluginRegistry.markInitialized();
  }
}

export function isPluginSystemInitialized(): boolean {
  return PluginRegistry.isInitialized();
}
