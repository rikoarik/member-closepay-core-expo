/**
 * Resolves tenant-specific overrides for EffectiveConfig.
 * Phase 4: minimal hardcoded resolver. No remote fetch or storage.
 */

import type { AppConfig } from './types/AppConfig';

/**
 * Returns partial AppConfig overrides for the given tenant.
 * Used as TenantOverride in EffectiveConfig = Base + TenantOverride + RemoteOverride.
 */
export function resolveTenantConfig(tenantId: string): Partial<AppConfig> {
  if (tenantId === 'tenantA') {
    return {
      enabledModules: { invoice: false },
    };
  }
  return {};
}
