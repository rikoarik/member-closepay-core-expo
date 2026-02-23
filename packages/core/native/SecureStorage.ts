/**
 * SecureStorage for native (iOS/Android).
 * - Sensitive keys (prefix @auth_): expo-secure-store (Keychain/Keystore).
 * - Other keys: AsyncStorage (multiGet/getAllKeys etc. supported).
 * Web uses SecureStorage.web.ts.
 */
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const USE_SECURE_STORE_FOR_PREFIX = '@auth_';

function useSecureStore(key: string): boolean {
  return Platform.OS !== 'web' && key.startsWith(USE_SECURE_STORE_FOR_PREFIX);
}

let SecureStore: {
  setItemAsync: (key: string, value: string) => Promise<void>;
  getItemAsync: (key: string) => Promise<string | null>;
  deleteItemAsync: (key: string) => Promise<void>;
} | null = null;

if (Platform.OS !== 'web') {
  try {
    SecureStore = require('expo-secure-store');
  } catch {
    SecureStore = null;
  }
}

export interface SecureStorageInterface {
  setItem(key: string, value: string): Promise<void>;
  getItem(key: string): Promise<string | null>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;
  getAllKeys(): Promise<string[]>;
  multiGet(keys: string[]): Promise<[string, string | null][]>;
  multiSet(keyValuePairs: [string, string][]): Promise<void>;
  multiRemove(keys: string[]): Promise<void>;
}

const SecureStorage: SecureStorageInterface = {
  async setItem(key: string, value: string): Promise<void> {
    if (useSecureStore(key) && SecureStore) {
      await SecureStore.setItemAsync(key, value);
      return;
    }
    await AsyncStorage.setItem(key, value);
  },

  async getItem(key: string): Promise<string | null> {
    if (useSecureStore(key) && SecureStore) {
      return await SecureStore.getItemAsync(key);
    }
    return await AsyncStorage.getItem(key);
  },

  async removeItem(key: string): Promise<void> {
    if (useSecureStore(key) && SecureStore) {
      await SecureStore.deleteItemAsync(key);
      return;
    }
    await AsyncStorage.removeItem(key);
  },

  async clear(): Promise<void> {
    const keys = await AsyncStorage.getAllKeys();
    await AsyncStorage.multiRemove(keys);
    if (SecureStore) {
      await SecureStore.deleteItemAsync('@auth_token');
      await SecureStore.deleteItemAsync('@auth_refresh_token');
      await SecureStore.deleteItemAsync('@auth_token_expiry');
    }
  },

  async getAllKeys(): Promise<string[]> {
    const asyncKeys = await AsyncStorage.getAllKeys();
    const secureKeys = ['@auth_token', '@auth_refresh_token', '@auth_token_expiry'];
    const existing: string[] = [];
    for (const k of secureKeys) {
      if (SecureStore) {
        try {
          const v = await SecureStore.getItemAsync(k);
          if (v != null) existing.push(k);
        } catch {
          // skip
        }
      }
    }
    return [...new Set([...asyncKeys, ...existing])];
  },

  async multiGet(keys: string[]): Promise<[string, string | null][]> {
    const result: [string, string | null][] = [];
    for (const key of keys) {
      const value = await SecureStorage.getItem(key);
      result.push([key, value]);
    }
    return result;
  },

  async multiSet(keyValuePairs: [string, string][]): Promise<void> {
    for (const [key, value] of keyValuePairs) {
      await SecureStorage.setItem(key, value);
    }
  },

  async multiRemove(keys: string[]): Promise<void> {
    for (const key of keys) {
      await SecureStorage.removeItem(key);
    }
  },
};

export default SecureStorage;
