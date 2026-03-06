/**
 * Persist FnB tutorial "seen" state so we only show once.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@fnb_tutorial_completed';

export async function isFnBTutorialCompleted(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(KEY);
    return value === 'true';
  } catch {
    return false;
  }
}

export async function setFnBTutorialCompleted(): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, 'true');
  } catch {
    // ignore
  }
}
