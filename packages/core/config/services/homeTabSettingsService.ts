/**
 * Home Tab Settings Service
 * Tengah fixed = Beranda. Kiri & kanan = dropdown pilih tab.
 */
import SecureStorage from '../../native/SecureStorage';
import type { BerandaWidgetConfig } from '../types/AppConfig';

const HOME_TAB_SETTINGS_KEY = '@home_tab_settings';

export const MAX_HOME_TABS = 3;
export const BERANDA_TAB_ID = 'beranda';

/** Tab IDs that HomeScreen renders without a plugin (hardcoded branches). Used to filter loadable tabs in settings. */
export const HARDCODED_HOME_TAB_IDS: ReadonlySet<string> = new Set([
  'analytics',
  'analitik',
  'beranda-news',
  'activity',
  'aktivitas',
  'news',
  'berita',
  'dashboard',
  'transactions',
]);

export interface HomeTabSettings {
  enabledTabIds: string[];
  berandaWidgets?: BerandaWidgetConfig[];
}

/**
 * Tab untuk dropdown kiri & kanan (Beranda tidak termasuk - fixed di tengah)
 */
export interface AvailableHomeTab {
  id: string;
  labelKey: string;
}

export const ALL_AVAILABLE_HOME_TABS: AvailableHomeTab[] = [
  { id: 'analytics', labelKey: 'home.analytics' },
  { id: 'virtualcard', labelKey: 'home.virtualcard' },
  { id: 'fnb', labelKey: 'home.fnb' },
  { id: 'marketplace', labelKey: 'home.marketplace' },
  { id: 'activity', labelKey: 'home.activity' },
  { id: 'news', labelKey: 'home.news' },
  { id: 'beranda-news', labelKey: 'home.berandaNews' },

];

export const DEFAULT_BERANDA_WIDGETS: BerandaWidgetConfig[] = [
  { id: 'balance-card', visible: true, order: 1 },
  { id: 'quick-access', visible: true, order: 2 },
  { id: 'promo-banner', visible: true, order: 3 },
];

function isStringArray(arr: unknown): arr is string[] {
  return Array.isArray(arr) && arr.every((x) => typeof x === 'string');
}

/**
 * Sanitize stored enabledTabIds for load: preserve [left, center, right] with '' allowed.
 */
function sanitizeEnabledTabIdsForLoad(ids: unknown): string[] {
  if (!isStringArray(ids)) return [];
  const trimmed = ids
    .slice(0, MAX_HOME_TABS)
    .map((id) => (typeof id === 'string' ? id.trim() : ''));
  while (trimmed.length < MAX_HOME_TABS) trimmed.push('');
  return trimmed.slice(0, MAX_HOME_TABS);
}

function sanitizeBerandaWidgets(widgets: unknown): BerandaWidgetConfig[] | undefined {
  if (!Array.isArray(widgets)) return undefined;
  const out: BerandaWidgetConfig[] = [];
  const seen = new Set<string>();
  for (const w of widgets) {
    if (!w || typeof w !== 'object') continue;
    const id = typeof (w as BerandaWidgetConfig).id === 'string' ? (w as BerandaWidgetConfig).id.trim() : '';
    if (!id || seen.has(id)) continue;
    seen.add(id);
    const visible = (w as BerandaWidgetConfig).visible !== false;
    const order = typeof (w as BerandaWidgetConfig).order === 'number' ? (w as BerandaWidgetConfig).order : out.length + 1;
    out.push({ id, visible, order });
  }
  return out.length > 0 ? out.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)) : undefined;
}

/**
 * Load home tab settings dari storage. Sanitizes and validates stored data.
 */
export const loadHomeTabSettings = async (): Promise<HomeTabSettings> => {
  try {
    const stored = await SecureStorage.getItem(HOME_TAB_SETTINGS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as HomeTabSettings;
      const enabledTabIds = sanitizeEnabledTabIdsForLoad(parsed?.enabledTabIds);
      const berandaWidgets = sanitizeBerandaWidgets(parsed?.berandaWidgets);
      return {
        enabledTabIds,
        berandaWidgets,
      };
    }
  } catch (error) {
    console.error('Failed to load home tab settings:', error);
  }
  return { enabledTabIds: [] };
};

/**
 * Validates settings before save. Returns null if invalid.
 * Left and right may be empty; center must be Beranda. If both left and right are set, they must differ.
 */
export function validateHomeTabSettings(settings: HomeTabSettings): HomeTabSettings | null {
  const raw = settings.enabledTabIds;
  if (!Array.isArray(raw) || raw.length < MAX_HOME_TABS) return null;
  const left = typeof raw[0] === 'string' ? raw[0].trim() : '';
  const center = typeof raw[1] === 'string' ? raw[1].trim() : '';
  const right = typeof raw[2] === 'string' ? raw[2].trim() : '';
  if (!center) return null;
  if (center !== BERANDA_TAB_ID && center !== 'home') return null;
  if (left && right && left === right) return null;
  const berandaWidgets = sanitizeBerandaWidgets(settings.berandaWidgets);
  return {
    enabledTabIds: [left, BERANDA_TAB_ID, right],
    berandaWidgets: berandaWidgets && berandaWidgets.length > 0 ? berandaWidgets : undefined,
  };
}

/**
 * Save home tab settings - format: [leftTabId, 'beranda', rightTabId]. Validates before writing.
 */
export const saveHomeTabSettings = async (
  settings: HomeTabSettings
): Promise<void> => {
  const toSave = validateHomeTabSettings(settings);
  if (!toSave) {
    throw new Error('Invalid tab settings: center must be Beranda; if both left and right are set they must differ.');
  }
  try {
    await SecureStorage.setItem(HOME_TAB_SETTINGS_KEY, JSON.stringify({
      enabledTabIds: toSave.enabledTabIds,
      berandaWidgets: toSave.berandaWidgets,
    }));
  } catch (error) {
    console.error('Failed to save home tab settings:', error);
    throw error;
  }
};

/**
 * Get enabled tab IDs (max 3) - returns empty array if no override (app will use config)
 */
export const getEnabledHomeTabIds = async (): Promise<string[]> => {
  const settings = await loadHomeTabSettings();
  return settings.enabledTabIds;
};

/**
 * Validates and normalizes enabled tab IDs for HomeScreen.
 * Input: enabledTabIds from storage, format [left, 'beranda', right] with left/right possibly ''.
 * Returns 1, 2, or 3 tab IDs to show (only non-empty, valid IDs). Beranda always included.
 */
export function validateEnabledTabIds(
  enabledTabIds: string[],
  validTabIds: string[]
): string[] {
  const validSet = new Set(validTabIds.filter((id) => id && id !== BERANDA_TAB_ID && id !== 'home'));
  const [left = '', center = '', right = ''] = enabledTabIds.slice(0, MAX_HOME_TABS);
  const centerNorm = (center && (center === BERANDA_TAB_ID || center === 'home')) ? BERANDA_TAB_ID : '';
  if (!centerNorm) return [];

  const leftId = left && validSet.has(left) ? left : '';
  const rightId = right && validSet.has(right) ? right : '';
  if (leftId && rightId && leftId === rightId) {
    // both set but duplicate: treat right as empty to avoid duplicate tab
    return [leftId, BERANDA_TAB_ID];
  }

  const result: string[] = [];
  if (leftId) result.push(leftId);
  result.push(BERANDA_TAB_ID);
  if (rightId) result.push(rightId);
  return result;
}
