/**
 * Helper to build a PluginModule for registerPlugins().
 * Use in each plugin index.ts for consistent shape and future extensibility.
 */

import type { PluginManifest, PluginModule } from './types';

export function createPluginModule(
  manifest: PluginManifest,
  componentLoaders: Record<string, () => Promise<any>>
): PluginModule {
  return { manifest, componentLoaders };
}
