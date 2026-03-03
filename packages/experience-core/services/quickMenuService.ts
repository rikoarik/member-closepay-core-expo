/**
 * Quick Menu Service (Experience layer)
 */
import SecureStorage from '@core/native/SecureStorage';
import { PluginRegistry } from '@core/config/plugins/PluginRegistry';
import { configService } from '@core/config/services/configService';

export interface QuickMenuItem {
  id: string;
  label: string;
  enabled: boolean;
  icon?: string;
  iconBgColor?: string;
  route?: string;
  labelKey?: string;
}

function getMenuIdToLabelKeyFromRegistry(): Record<string, string> {
  const out: Record<string, string> = {};
  if (!PluginRegistry.isInitialized()) return out;
  for (const manifest of PluginRegistry.getEnabledPlugins()) {
    for (const entry of manifest.quickMenuItems ?? []) {
      if (entry.labelKey) {
        out[entry.id.toLowerCase()] = entry.labelKey;
      }
    }
  }
  return out;
}

/** Resolve menu label key from registry (manifest.quickMenuItems). No hardcoded plugin IDs. */
export function getMenuLabelKey(item: QuickMenuItem): string | undefined {
  if (item.labelKey) return item.labelKey;
  return getMenuIdToLabelKeyFromRegistry()[item.id.toLowerCase()];
}

const QUICK_MENU_STORAGE_KEY = '@quick_menu_settings';

export const loadQuickMenuSettings = async (): Promise<QuickMenuItem[]> => {
  try {
    const stored = await SecureStorage.getItem(QUICK_MENU_STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to load quick menu settings:', error);
  }
  return [];
};

export const saveQuickMenuSettings = async (menuItems: QuickMenuItem[]): Promise<void> => {
  try {
    await SecureStorage.setItem(QUICK_MENU_STORAGE_KEY, JSON.stringify(menuItems));
  } catch (error) {
    console.error('Failed to save quick menu settings:', error);
    throw error;
  }
};

export const getEnabledQuickMenuItems = async (): Promise<QuickMenuItem[]> => {
  const allItems = await loadQuickMenuSettings();
  return allItems.filter((item) => item.enabled);
};

/** Build quick menu items from manifest.quickMenuItems (all enabled plugins) and routes with showInMenu. No hardcoded plugin IDs. */
export const getPluginMenuItems = (): QuickMenuItem[] => {
  if (!PluginRegistry.isInitialized()) return [];

  const config = configService.getEffectiveConfig();
  const quickAccess = config.quickAccessMenu;
  if (quickAccess?.length) {
    const menuItems: QuickMenuItem[] = [];
    for (const item of quickAccess) {
      const route = PluginRegistry.getRouteByName(item.route);
      menuItems.push({
        id: item.id,
        label: route?.meta?.title || item.route,
        enabled: true,
        icon: item.icon || route?.meta?.icon || 'default',
        iconBgColor: undefined,
        route: item.route,
        labelKey: item.labelKey,
      });
    }
    return menuItems;
  }

  const byId = new Map<string, QuickMenuItem>();
  const ordered: QuickMenuItem[] = [];

  const entries: { order: number; item: QuickMenuItem }[] = [];
  for (const manifest of PluginRegistry.getEnabledPlugins()) {
    const items = manifest.quickMenuItems ?? [];
    for (const entry of items) {
      const route = entry.route ? PluginRegistry.getRouteByName(entry.route) : undefined;
      const item: QuickMenuItem = {
        id: entry.id,
        label: route?.meta?.title ?? entry.id,
        enabled: true,
        icon: entry.icon ?? route?.meta?.icon ?? 'default',
        iconBgColor: undefined,
        route: entry.route ?? route?.name,
        labelKey: entry.labelKey,
      };
      entries.push({ order: entry.order ?? 0, item });
    }
  }
  entries.sort((a, b) => a.order - b.order);
  for (const { item } of entries) {
    const key = item.id.toLowerCase();
    if (!byId.has(key)) {
      byId.set(key, item);
      ordered.push(item);
    }
  }

  for (const route of PluginRegistry.getEnabledRoutes()) {
    if (route.meta?.showInMenu && !byId.has(route.name.toLowerCase())) {
      const item: QuickMenuItem = {
        id: route.name,
        label: route.meta.title || route.name,
        enabled: true,
        icon: route.meta.icon || 'default',
        iconBgColor: undefined,
        route: route.name,
      };
      byId.set(route.name.toLowerCase(), item);
      ordered.push(item);
    }
  }

  return ordered;
};

export const getAllMenuItems = async (): Promise<QuickMenuItem[]> => {
  const storedItems = await loadQuickMenuSettings();
  const pluginItems = getPluginMenuItems();
  const mergedItems = new Map<string, QuickMenuItem>();

  for (const item of storedItems) {
    mergedItems.set(item.id, item);
  }
  for (const item of pluginItems) {
    const existing = mergedItems.get(item.id);
    if (existing) {
      mergedItems.set(item.id, { ...item, enabled: existing.enabled });
    } else {
      mergedItems.set(item.id, item);
    }
  }
  return Array.from(mergedItems.values());
};

export const getEnabledMenuItems = async (): Promise<QuickMenuItem[]> => {
  const allItems = await getAllMenuItems();
  return allItems.filter((item) => item.enabled);
};
