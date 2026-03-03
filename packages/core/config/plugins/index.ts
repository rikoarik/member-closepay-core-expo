/**
 * Plugin System Exports
 * Central export point for the plugin system
 */

// Types
export * from './types';

// Plugin module helper (for plugin index.ts)
export { createPluginModule } from './createPluginModule';

// Registry
export { PluginRegistry, getPluginRegistryEntry, getAllPluginIds } from './PluginRegistry';

// Validation
export * from './manifestValidator';

// Plugin Loader (initializePlugins lives in PluginRegistry to avoid cycle)
export { initializePlugins, isPluginSystemInitialized } from './PluginRegistry';

// Component Loader
export {
  loadPluginComponent,
  getPluginComponentLoader,
  getPluginComponentLoaders,
} from './pluginComponentLoader';

// Tab & Widget Mapping
export { getTabPlugin, getWidgetPlugin } from './tabWidgetPluginMap';
export type { TabWidgetPluginMapping } from './tabWidgetPluginMap';

// Hooks
export { usePluginRegistry } from './hooks/usePluginRegistry';
export type { UsePluginRegistryReturn } from './hooks/usePluginRegistry';
export { usePluginComponent } from './hooks/usePluginComponent';
export type { UsePluginComponentOptions, UsePluginComponentReturn } from './hooks/usePluginComponent';
