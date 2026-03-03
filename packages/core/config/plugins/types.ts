/**
 * Plugin System Types
 * Type definitions for the plugin manifest and registry system
 */

export type PluginType = 'core-plugin' | 'segment-plugin' | 'company-plugin';

export interface PluginRoute {
  name: string;
  path: string;
  component: string;
  permissions: string[];
  meta?: {
    title?: string;
    showInMenu?: boolean;
    icon?: string;
    [key: string]: any;
  };
}

/** Tab config from manifest (array form). Enables order and labelKey without hardcode in Core. */
export interface PluginTabConfig {
  id: string;
  component: string;
  order?: number;
  labelKey: string;
  icon?: string;
}

/** Quick menu item declared by plugin (for labelKey / icon resolution). */
export interface PluginQuickMenuItem {
  id: string;
  labelKey?: string;
  icon?: string;
  route?: string;
  /** Component name for loader; optional, route can be used for resolution. */
  component?: string;
  order?: number;
}

export interface PluginExports {
  components?: string[];
  hooks?: string[];
  services?: string[];
  models?: string[];
  screens?: Record<string, string>;
  tabs?: Record<string, string>;
  widgets?: Record<string, string>;
}

export interface PluginRegistryEntry {
  id: string;
  manifestPath: string;
}

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  type: PluginType;
  author?: string;
  dependencies: string[];
  exports: PluginExports;
  routes?: PluginRoute[];
  permissions: string[];
  config?: Record<string, any>;
  /** Quick menu items (id → labelKey/icon) for getMenuLabelKey; no hardcode in Core. */
  quickMenuItems?: PluginQuickMenuItem[];
  /** Tab configs with order and labelKey; merged by experience layer. Prefer over exports.tabs when present. */
  tabs?: PluginTabConfig[];
}

export interface PluginConfig {
  enabled: boolean;
  config?: Record<string, any>;
  routeOverrides?: Record<string, Partial<PluginRoute>>;
}

export interface SegmentConfiguration {
  segment: string;
  plugins: Record<string, PluginConfig>;
}

export interface CompanyConfiguration extends SegmentConfiguration {
  companyId: string;
}

/** Plugin module shape for app bootstrap; passed to registerPlugins(). */
export interface PluginModule {
  manifest: PluginManifest;
  componentLoaders: Record<string, () => Promise<any>>;
}

/** Flatten all component names from manifest.exports (screens, tabs, widgets, components). */
export function getExportComponentNames(exports?: PluginExports): string[] {
  if (!exports) return [];
  const names: string[] = [...(exports.components ?? [])];
  if (exports.screens) names.push(...Object.values(exports.screens));
  if (exports.tabs) names.push(...Object.values(exports.tabs));
  if (exports.widgets) names.push(...Object.values(exports.widgets));
  return [...new Set(names)];
}
