/**
 * Experience Core — tab, widget, and quick menu logic.
 * Depends on @core (platform). Consumed by core re-exports so apps keep using @core/config.
 */

export { getTabPlugin, getWidgetPlugin, type TabWidgetPluginMapping } from './tabWidgetPluginMap';
export {
  setQuickMenuIconProvider,
  getQuickMenuIcon,
  type QuickMenuIconFn,
} from './quickMenuIconProvider';
export * from './services/quickMenuService';
export * from './services/homeTabSettingsService';
export { useQuickMenu } from './hooks/useQuickMenu';
export { QuickMenuSettingsScreen } from './components/QuickMenuSettingsScreen';
export { HomeTabSettingsScreen } from './components/HomeTabSettingsScreen';
