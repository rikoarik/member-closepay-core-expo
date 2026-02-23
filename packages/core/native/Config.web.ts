/**
 * Config - Web stub (no native module)
 */
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
  [key: string]: string | undefined;
}

const Config: ConfigInterface = {
  API_URL: 'https://api.example.com',
  API_HOSTNAME: 'api.example.com',
  API_STG_URL: 'https://stg-api.example.com',
  API_STG_HOSTNAME: 'stg-api.example.com',
  API_BASE_URL: 'https://api.example.com',
  API_STG_BASE_URL: 'https://stg-api.example.com',
  API_PROD_BASE_URL: 'https://api.example.com',
  PIN_LEAF_CERT: '',
  PIN_INTERMEDIATE: '',
  ENV: 'development',
};

export const getConfig = (): string | undefined => undefined;
export const getConfigAsync = async (): Promise<string | undefined> => undefined;
export const getAllConfig = async (): Promise<ConfigInterface> => Config;

export default Config;
