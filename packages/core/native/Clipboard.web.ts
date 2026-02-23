/**
 * Clipboard - Web (browser clipboard API)
 */
export interface ClipboardInterface {
  setString(text: string): void;
  getString(): Promise<string>;
  hasString(): Promise<boolean>;
  hasURL(): Promise<boolean>;
}

const Clipboard: ClipboardInterface = {
  setString(text: string): void {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
    }
  },
  async getString(): Promise<string> {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.readText) {
      return navigator.clipboard.readText();
    }
    return '';
  },
  async hasString(): Promise<boolean> {
    const t = await Clipboard.getString();
    return t.length > 0;
  },
  async hasURL(): Promise<boolean> {
    return false;
  },
};

export default Clipboard;
