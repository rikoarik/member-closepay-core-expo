/**
 * Config for native (iOS/Android).
 * Reads from expo-constants extra (filled by app.config.js from EXPO_PUBLIC_* env).
 * Web uses Config.web.ts.
 */
import { Platform } from 'react-native';
import Constants from 'expo-constants';

export interface ConfigInterface {
  API_URL: string;
  API_HOSTNAME: string;
  API_STG_URL: string;
  API_STG_HOSTNAME: string;
  API_BASE_URL: string;
  API_STG_BASE_URL: string;
  API_PROD_BASE_URL: string;
  PIN_LEAF_CERT: string;
  PIN_INTERMEDIATE: string;
  ENV: string;
  ANDROID_CERTIFICATE_HASH?: string;
  IOS_APP_TEAM_ID?: string;
  TALSEC_WATCHER_MAIL?: string;
  SUPPORT_WHATSAPP_NUMBER?: string;
  SUPPORT_EMAIL?: string;
  ANDROID_PACKAGE_NAME?: string;
  IOS_BUNDLE_ID?: string;
  [key: string]: string | undefined;
}

const extra = (Platform.OS === 'web')
  ? null
  : (Constants.expoConfig?.extra ?? (Constants as unknown as { manifest?: { extra?: Record<string, string> } }).manifest?.extra);

const fromExtra = (key: string): string => {
  if (extra && typeof extra[key] === 'string') {
    return extra[key] as string;
  }
  return '';
};

const Config: ConfigInterface = {
  get API_URL() { return fromExtra('API_BASE_URL') || 'https://api.example.com'; },
  get API_HOSTNAME() { return fromExtra('API_BASE_URL').replace(/^https?:\/\//, '').split('/')[0] || ''; },
  get API_STG_URL() { return fromExtra('API_STG_BASE_URL') || 'https://stg-api.example.com'; },
  get API_STG_HOSTNAME() { return fromExtra('API_STG_BASE_URL').replace(/^https?:\/\//, '').split('/')[0] || ''; },
  get API_BASE_URL() { return fromExtra('API_BASE_URL') || 'https://api.example.com'; },
  get API_STG_BASE_URL() { return fromExtra('API_STG_BASE_URL') || 'https://stg-api.example.com'; },
  get API_PROD_BASE_URL() { return fromExtra('API_PROD_BASE_URL') || fromExtra('API_BASE_URL') || 'https://api.example.com'; },
  PIN_LEAF_CERT: '',
  PIN_INTERMEDIATE: '',
  get ENV() { return fromExtra('ENV') || 'development'; },
  get ANDROID_CERTIFICATE_HASH() { return fromExtra('ANDROID_CERTIFICATE_HASH') || undefined; },
  get IOS_APP_TEAM_ID() { return fromExtra('IOS_APP_TEAM_ID') || undefined; },
  get TALSEC_WATCHER_MAIL() { return fromExtra('TALSEC_WATCHER_MAIL') || undefined; },
  get SUPPORT_WHATSAPP_NUMBER() { return fromExtra('SUPPORT_WHATSAPP_NUMBER') || undefined; },
  get SUPPORT_EMAIL() { return fromExtra('SUPPORT_EMAIL') || undefined; },
  get ANDROID_PACKAGE_NAME() { return fromExtra('ANDROID_PACKAGE_NAME') || undefined; },
  get IOS_BUNDLE_ID() { return fromExtra('IOS_BUNDLE_ID') || undefined; },
};

/**
 * Get a single config value
 */
export const getConfig = (key: string): string | undefined => {
  const v = (Config as Record<string, string | undefined>)[key];
  return typeof v === 'string' ? v : undefined;
};

/**
 * Get config value async
 */
export const getConfigAsync = async (key: string): Promise<string | undefined> => {
  return getConfig(key);
};

/**
 * Get all config values
 */
export const getAllConfig = async (): Promise<ConfigInterface> => {
  return { ...Config };
};

export default Config;
