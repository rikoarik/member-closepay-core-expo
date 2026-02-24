/**
 * Persist custom chat templates (quick reply) added by user
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'fnb_chat_templates';

const MAX_TEMPLATES = 20;
const MAX_LENGTH = 100;

export async function getCustomChatTemplates(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((t): t is string => typeof t === 'string' && t.trim().length > 0)
      .map((t) => t.trim())
      .slice(0, MAX_TEMPLATES);
  } catch {
    return [];
  }
}

export async function addCustomChatTemplate(text: string): Promise<boolean> {
  const trimmed = text.trim().slice(0, MAX_LENGTH);
  if (!trimmed) return false;
  try {
    const current = await getCustomChatTemplates();
    if (current.some((t) => t.toLowerCase() === trimmed.toLowerCase())) return false;
    const next = [...current, trimmed].slice(-MAX_TEMPLATES);
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
    return true;
  } catch {
    return false;
  }
}

export async function removeCustomChatTemplate(text: string): Promise<boolean> {
  try {
    const current = await getCustomChatTemplates();
    const next = current.filter((t) => t !== text);
    if (next.length === current.length) return false;
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
    return true;
  } catch {
    return false;
  }
}
