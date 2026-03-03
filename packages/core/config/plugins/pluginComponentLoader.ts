/**
 * Plugin Component Loader
 * Resolves component loaders from PluginRegistry (registered by app bootstrap). No hardcoded plugin paths in Core.
 */

import { PluginRegistry } from './PluginRegistry';
import type { PluginManifest } from './types';
import React from 'react';

function getComponentLoader(pluginId: string, componentName: string): () => Promise<any> {
  return PluginRegistry.getComponentLoader(pluginId, componentName);
}

/**
 * Load plugin component dynamically
 * @param pluginId - Plugin identifier
 * @param componentName - Component name to load
 * @returns Promise resolving to React component
 */
export async function loadPluginComponent(
  pluginId: string,
  componentName: string
): Promise<React.ComponentType<any>> {
  // Check if plugin is enabled
  if (!PluginRegistry.isPluginEnabled(pluginId)) {
    throw new Error(`Plugin ${pluginId} is not enabled`);
  }

  // Get plugin manifest
  const plugin = PluginRegistry.getPlugin(pluginId);
  if (!plugin) {
    throw new Error(`Plugin ${pluginId} not found`);
  }

  // Check if component is exported (screens, components, tabs, widgets)
  const exports = plugin.exports;
  const isScreen = exports.screens && Object.values(exports.screens).includes(componentName);
  const isComponent = exports.components?.includes(componentName);
  const isTab = exports.tabs && Object.values(exports.tabs).includes(componentName);
  const isWidget = exports.widgets && Object.values(exports.widgets).includes(componentName);

  if (!isScreen && !isComponent && !isTab && !isWidget) {
    throw new Error(`Component ${componentName} not exported by plugin ${pluginId}`);
  }

  const loader = getComponentLoader(pluginId, componentName);

  try {
    const module = await loader();
    const Component = module[componentName] || module.default;

    if (!Component) {
      throw new Error(`Component ${componentName} not found in module for plugin ${pluginId}`);
    }

    return Component;
  } catch (error) {
    console.error(`Failed to load component ${pluginId}.${componentName}:`, error);
    throw error;
  }
}

/**
 * Get lazy component loader function for React.lazy
 * @param pluginId - Plugin identifier
 * @param componentName - Component name
 * @returns Loader function compatible with React.lazy
 */
export function getPluginComponentLoader(
  pluginId: string,
  componentName: string
): () => Promise<{ default: React.ComponentType<any> }> {
  return async () => {
    const Component = await loadPluginComponent(pluginId, componentName);
    return { default: Component };
  };
}

/**
 * Get all available component loaders for a plugin
 * @param pluginId - Plugin identifier
 * @returns Record of componentName -> loader function
 */
export function getPluginComponentLoaders(
  pluginId: string
): Record<string, () => Promise<any>> {
  return PluginRegistry.getComponentLoaders(pluginId);
}
