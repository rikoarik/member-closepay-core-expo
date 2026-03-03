/**
 * Tab and Widget to Plugin Mapping (Experience layer)
 * Derived from PluginRegistry only: manifest.tabs (with order) then exports.tabs, then exports.widgets. No hardcoded plugin IDs.
 */

import { PluginRegistry } from '@core/config/plugins/PluginRegistry';
import type { PluginTabConfig } from '@core/config/plugins/types';

export interface TabWidgetPluginMapping {
  pluginId: string;
  componentName: string;
}

function buildMaps(): {
  tabMap: Record<string, TabWidgetPluginMapping>;
  widgetMap: Record<string, TabWidgetPluginMapping>;
} {
  const tabMap: Record<string, TabWidgetPluginMapping> = {};
  const widgetMap: Record<string, TabWidgetPluginMapping> = {};

  if (!PluginRegistry.isInitialized()) {
    return { tabMap, widgetMap };
  }

  const plugins = PluginRegistry.getEnabledPlugins();

  // 1) manifest.tabs (array with order) — preferred, no hardcode
  const tabConfigs: { pluginId: string; tab: PluginTabConfig }[] = [];
  for (const manifest of plugins) {
    const tabs = manifest.tabs ?? [];
    for (const tab of tabs) {
      tabConfigs.push({ pluginId: manifest.id, tab });
    }
  }
  tabConfigs.sort((a, b) => (a.tab.order ?? 0) - (b.tab.order ?? 0));
  for (const { pluginId, tab } of tabConfigs) {
    tabMap[tab.id] = { pluginId, componentName: tab.component };
  }

  // 2) exports.tabs (Record) — fallback for plugins without manifest.tabs
  for (const manifest of plugins) {
    const ex = manifest.exports;
    if (ex?.tabs) {
      for (const [tabId, componentName] of Object.entries(ex.tabs)) {
        if (!tabMap[tabId]) tabMap[tabId] = { pluginId: manifest.id, componentName };
      }
    }
    if (ex?.widgets) {
      for (const [widgetId, componentName] of Object.entries(ex.widgets)) {
        widgetMap[widgetId] = { pluginId: manifest.id, componentName };
      }
    }
  }

  return { tabMap, widgetMap };
}

export function getTabPlugin(tabId: string): TabWidgetPluginMapping | null {
  const { tabMap } = buildMaps();
  return tabMap[tabId] ?? null;
}

export function getWidgetPlugin(widgetId: string): TabWidgetPluginMapping | null {
  const { widgetMap } = buildMaps();
  return widgetMap[widgetId] ?? null;
}
