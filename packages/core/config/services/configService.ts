/**
 * Core Config - Config Service
 * EffectiveConfig = BaseConfig + TenantOverride + (optional) RemoteOverride
 * Lifecycle: setBaseConfig() → setTenantOverride() → setRemoteOverride()? → getEffectiveConfig()
 */

import { AppConfig, MenuItemConfig } from '../types/AppConfig';
import { getTenantConfigFromConfig, getCurrentTenantIdFromConfig } from './tenantService';
import type { TenantConfig } from '../tenants';
import type { TenantId } from '../tenants';
import { configEventEmitter } from '../utils/configEventEmitter';
import { getEnabledModuleIds } from '../utils/enabledModules';
import { mergeConfigs } from '../utils/mergeConfigs';
import Config from '../../native/Config';
import { logger } from './loggerService';

export interface ConfigService {
  loadConfig(): Promise<AppConfig>;
  /** Returns effective config or null if not yet initialized. Prefer getEffectiveConfig() after init. */
  getConfig(): AppConfig | null;
  /** Returns effective config. Throws if config not initialized (fail-fast). */
  getEffectiveConfig(): AppConfig;
  isFeatureEnabled(feature: string): boolean;
  isModuleEnabled(module: string): boolean;
  getMenuConfig(): MenuItemConfig[];
  refreshConfig(force?: boolean): Promise<void>;
  setBaseConfig(config: AppConfig): void;
  setTenantOverride(override?: Partial<AppConfig>): void;
  setRemoteOverride(override?: Partial<AppConfig>): void;
  getTenantConfig(): TenantConfig | null;
}

const DEFAULT_CONFIG: AppConfig = {
  companyInitial: 'DEFAULT',
  companyId: 'default',
  companyName: 'Default Company',
  tenantId: 'default',
  segmentId: 'balance-management',
  enabledFeatures: ['balance', 'payment'],
  enabledModules: ['balance', 'payment'],
  menuConfig: [],
  paymentMethods: ['balance'],
  homeVariant: 'dashboard',
  branding: {
    logo: '',
    appName: 'Closepay Merchant',
  },
  login: {
    showSignUp: true,
    showSocialLogin: false,
    socialLoginProviders: ['google'],
  },
  services: {
    api: {
      baseUrl: Config.API_BASE_URL || 'localhost:3000',
      timeout: 30000,
    },
  },
};

class ConfigServiceImpl implements ConfigService {
  private baseConfig: AppConfig | null = null;
  private tenantOverride?: Partial<AppConfig>;
  private remoteOverride?: Partial<AppConfig>;
  private effectiveConfig?: AppConfig;
  private lastRefreshTime: number = 0;

  setBaseConfig(config: AppConfig): void {
    this.baseConfig = config;
    this.recompute();
  }

  setTenantOverride(override?: Partial<AppConfig>): void {
    this.tenantOverride = override;
    this.recompute();
  }

  setRemoteOverride(override?: Partial<AppConfig>): void {
    this.remoteOverride = override;
    this.recompute();
  }

  /** Single merge entry point. */
  private recompute(): void {
    if (!this.baseConfig) return;
    this.effectiveConfig = mergeConfigs(
      this.baseConfig,
      this.tenantOverride,
      this.remoteOverride
    );
    configEventEmitter.emit(this.effectiveConfig);
  }

  getEffectiveConfig(): AppConfig {
    if (!this.effectiveConfig) {
      throw new Error('Config not initialized. Call setBaseConfig() (and optionally setTenantOverride/setRemoteOverride) first.');
    }
    return this.effectiveConfig;
  }

  getConfig(): AppConfig | null {
    return this.effectiveConfig ?? null;
  }

  async loadConfig(): Promise<AppConfig> {
    const config = this.getConfig();
    if (!config) {
      logger.warn('Config not initialized. Returning default. Call setBaseConfig() first.');
      return DEFAULT_CONFIG;
    }
    return config;
  }

  getTenantConfig(): TenantConfig | null {
    const config = this.getConfig();
    if (!config) return null;
    const tenantId = config.tenantId || config.companyId;
    if (!tenantId) return null;
    return getTenantConfigFromConfig(tenantId, config);
  }

  isFeatureEnabled(feature: string): boolean {
    const config = this.getConfig();
    if (!config) return false;
    return config.enabledFeatures.includes(feature);
  }

  isModuleEnabled(module: string): boolean {
    const config = this.getConfig();
    if (!config) return false;
    return getEnabledModuleIds(config.enabledModules).includes(module);
  }

  getMenuConfig(): MenuItemConfig[] {
    const config = this.getConfig();
    if (!config) return [];
    return config.menuConfig.filter((item) => item.visible);
  }

  async refreshConfig(_force: boolean = false): Promise<void> {
    this.lastRefreshTime = Date.now();
    const config = this.getConfig();
    if (config) {
      configEventEmitter.emit(config);
    }
    return Promise.resolve();
  }
}

export const configService: ConfigService = new ConfigServiceImpl();

export function getTenantConfig(tenantId: TenantId): TenantConfig | null {
  return getTenantConfigFromConfig(tenantId, configService.getConfig());
}

export function getCurrentTenantId(): TenantId | null {
  return getCurrentTenantIdFromConfig(configService.getConfig());
}
