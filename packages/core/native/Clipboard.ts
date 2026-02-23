/**
 * Clipboard for native (iOS/Android) via expo-clipboard.
 * Web uses Clipboard.web.ts.
 */
import { Platform } from 'react-native';

let ExpoClipboard: { setStringAsync: (s: string) => Promise<void>; getStringAsync: () => Promise<string> } | null = null;

if (Platform.OS !== 'web') {
  try {
    ExpoClipboard = require('expo-clipboard');
  } catch {
    ExpoClipboard = null;
  }
}

export interface ClipboardInterface {
  setString(text: string): void;
  getString(): Promise<string>;
  hasString(): Promise<boolean>;
  hasURL(): Promise<boolean>;
}

const Clipboard: ClipboardInterface = {
  setString(text: string): void {
    if (ExpoClipboard) {
      void ExpoClipboard.setStringAsync(text);
    }
  },

  async getString(): Promise<string> {
    if (!ExpoClipboard) return '';
    return await ExpoClipboard.getStringAsync();
  },

  async hasString(): Promise<boolean> {
    const s = await Clipboard.getString();
    return s.length > 0;
  },

  async hasURL(): Promise<boolean> {
    const s = await Clipboard.getString();
    return /^https?:\/\//i.test(s.trim()) || /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(s.trim());
  },
};

export default Clipboard;
