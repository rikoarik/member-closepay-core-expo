/**
 * Plugin Loader
 * After Phase 2: plugin list lives in app bootstrap (registerPlugins). Core does not load manifests by name.
 * This file kept for legacy type re-exports only. Do not add manifest loaders or plugin path requires in Core.
 */

export type { PluginManifest, PluginRegistryEntry } from './types';
