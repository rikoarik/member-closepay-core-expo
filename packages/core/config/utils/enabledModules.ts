/**
 * Normalize enabledModules (array or object) to a list of enabled module IDs.
 * Use this instead of reading config.enabledModules directly for .includes() or iteration.
 */

export type EnabledModulesInput =
  | string[]
  | Record<string, boolean>
  | undefined
  | null;

/**
 * Returns the list of enabled module IDs from config.enabledModules.
 * Supports legacy array format and object format (Record<string, boolean>).
 */
export function getEnabledModuleIds(value: EnabledModulesInput): string[] {
  if (value === undefined || value === null) {
    return [];
  }
  if (Array.isArray(value)) {
    return [...value];
  }
  if (typeof value === 'object' && value !== null) {
    return Object.entries(value)
      .filter(([, v]) => Boolean(v))
      .map(([k]) => k);
  }
  return [];
}
