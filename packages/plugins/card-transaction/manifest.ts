/**
 * Card Transaction Plugin - Manifest
 * TypeScript manifest export for CorePlugin interface
 */

import type { CorePlugin as CorePluginType } from '@core/config/plugins/contracts';
import manifestJson from './plugin.manifest.json';

export const CorePlugin: CorePluginType = {
  id: manifestJson.id,
  routes: manifestJson.routes || [],
  menuItems: [],
};

