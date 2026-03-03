/**
 * Effective config merge: Base + TenantOverride + RemoteOverride.
 * Deterministic, explicit per-field control. No lodash, no deep magic.
 */

import type { AppConfig } from '../types/AppConfig';

function toEnabledModulesObject(
  value: AppConfig['enabledModules'] | undefined
): Record<string, boolean> {
  if (value === undefined || value === null) return {};
  if (Array.isArray(value)) {
    return Object.fromEntries(value.map((id) => [id, true]));
  }
  return typeof value === 'object' ? { ...value } : {};
}

/**
 * Merge base + tenant + remote into effective config.
 * - enabledModules: deep merge (object per key)
 * - homeTabs, quickAccessMenu: replace whole array
 * - branding, services, support: shallow merge
 */
export function mergeConfigs(
  base: AppConfig,
  tenant?: Partial<AppConfig>,
  remote?: Partial<AppConfig>
): AppConfig {
  if (!base.enabledModules) {
    throw new Error('Base config missing enabledModules');
  }

  const result: AppConfig = {
    ...base,
  };

  // 1️⃣ enabledModules (deep merge object)
  const baseMod = toEnabledModulesObject(base.enabledModules);
  const tenantMod = tenant?.enabledModules ? toEnabledModulesObject(tenant.enabledModules) : {};
  const remoteMod = remote?.enabledModules ? toEnabledModulesObject(remote.enabledModules) : {};
  result.enabledModules = {
    ...baseMod,
    ...tenantMod,
    ...remoteMod,
  };

  // 2️⃣ homeTabs (replace)
  if (tenant?.homeTabs) result.homeTabs = tenant.homeTabs;
  if (remote?.homeTabs) result.homeTabs = remote.homeTabs;

  // 3️⃣ quickAccessMenu (replace)
  if (tenant?.quickAccessMenu) result.quickAccessMenu = tenant.quickAccessMenu;
  if (remote?.quickAccessMenu) result.quickAccessMenu = remote.quickAccessMenu;

  // 4️⃣ branding (shallow merge)
  result.branding = {
    ...base.branding,
    ...tenant?.branding,
    ...remote?.branding,
  };

  // 5️⃣ services (shallow merge)
  if (base.services) {
    result.services = {
      ...base.services,
      ...tenant?.services,
      ...remote?.services,
    };
  }

  // 6️⃣ support (shallow merge)
  if (base.support || tenant?.support || remote?.support) {
    result.support = {
      ...(base.support ?? {}),
      ...(tenant?.support ?? {}),
      ...(remote?.support ?? {}),
    };
  }

  return result;
}
