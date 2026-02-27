/**
 * SecureStorage - Web stub (AsyncStorage only; no Keychain)
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  setItem: (key, value) => AsyncStorage.setItem(key, value),
  getItem: (key) => AsyncStorage.getItem(key),
  removeItem: (key) => AsyncStorage.removeItem(key),
  clear: () => AsyncStorage.clear(),
  getAllKeys: () => AsyncStorage.getAllKeys() as Promise<string[]>,
  multiGet: (keys) => AsyncStorage.multiGet(keys) as Promise<[string, string | null][]>,
  multiSet: (keyValuePairs) => AsyncStorage.multiSet(keyValuePairs),
  multiRemove: (keys) => AsyncStorage.multiRemove(keys),
};

export default SecureStorage;
