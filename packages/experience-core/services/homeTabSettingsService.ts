/**
 * Home Tab Settings Service (Experience layer)
 */
import SecureStorage from '@core/native/SecureStorage';
import type { BerandaWidgetConfig } from '@core/config/types/AppConfig';

const HOME_TAB_SETTINGS_KEY = '@home_tab_settings';

export const MAX_HOME_TABS = 3;
export const BERANDA_TAB_ID = 'beranda';

export const HARDCODED_HOME_TAB_IDS: ReadonlySet<string> = new Set([
  'analytics', 'analitik', 'beranda-news', 'activity', 'aktivitas', 'news', 'berita', 'dashboard', 'transactions',
]);

export interface HomeTabSettings {
  enabledTabIds: string[];
  berandaWidgets?: BerandaWidgetConfig[];
}

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

function sanitizeEnabledTabIdsForLoad(ids: unknown): string[] {
  if (!isStringArray(ids)) return [];
  const trimmed = ids.slice(0, MAX_HOME_TABS).map((id) => (typeof id === 'string' ? id.trim() : ''));
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

export const loadHomeTabSettings = async (): Promise<HomeTabSettings> => {
  try {
    const stored = await SecureStorage.getItem(HOME_TAB_SETTINGS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as HomeTabSettings;
      return {
        enabledTabIds: sanitizeEnabledTabIdsForLoad(parsed?.enabledTabIds),
        berandaWidgets: sanitizeBerandaWidgets(parsed?.berandaWidgets),
      };
    }
  } catch (error) {
    console.error('Failed to load home tab settings:', error);
  }
  return { enabledTabIds: [] };
};

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
    berandaWidgets: berandaWidgets?.length ? berandaWidgets : undefined,
  };
}

export const saveHomeTabSettings = async (settings: HomeTabSettings): Promise<void> => {
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

export const getEnabledHomeTabIds = async (): Promise<string[]> => {
  const settings = await loadHomeTabSettings();
  return settings.enabledTabIds;
};

export function validateEnabledTabIds(enabledTabIds: string[], validTabIds: string[]): string[] {
  const validSet = new Set(validTabIds.filter((id) => id && id !== BERANDA_TAB_ID && id !== 'home'));
  const [left = '', center = '', right = ''] = enabledTabIds.slice(0, MAX_HOME_TABS);
  const centerNorm = center && (center === BERANDA_TAB_ID || center === 'home') ? BERANDA_TAB_ID : '';
  if (!centerNorm) return [];

  const leftId = left && validSet.has(left) ? left : '';
  const rightId = right && validSet.has(right) ? right : '';
  if (leftId && rightId && leftId === rightId) return [leftId, BERANDA_TAB_ID];

  const result: string[] = [];
  if (leftId) result.push(leftId);
  result.push(BERANDA_TAB_ID);
  if (rightId) result.push(rightId);
  return result;
}
