/**
 * Core Config - Tenant Service
 * Pure helpers for tenant config from AppConfig. No configService import to avoid require cycle.
 */

import type { TenantId, TenantConfig } from '../tenants';
import type { AppConfig } from '../types/AppConfig';

/**
 * Get tenant configuration from a given app config (pure function, no cycle).
 */
export function getTenantConfigFromConfig(
  tenantId: TenantId,
  config: AppConfig | null
): TenantConfig | null {
  if (!config) return null;
  if (config.companyId !== tenantId && config.tenantId !== tenantId) return null;
  return {
    id: tenantId,
    name: config.companyName,
    role: 'merchant',
    enabledFeatures: config.enabledModules || config.enabledFeatures || [],
    theme: {
      logo: config.branding?.logo,
      appName: config.branding?.appName,
    },
    homeVariant: config.homeVariant || 'dashboard',
  };
}

/**
 * Get current tenant ID from a given app config (pure function, no cycle).
 */
export function getCurrentTenantIdFromConfig(config: AppConfig | null): TenantId | null {
  return config?.companyId || config?.tenantId || null;
}

