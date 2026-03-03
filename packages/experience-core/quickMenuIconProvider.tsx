/**
 * Registry for quick menu icon renderer. App provides implementation so experience-core
 * does not depend on app; core no longer needs wrappers that import from app.
 */
import React from 'react';
import type { ReactNode } from 'react';
import { Element3 } from 'iconsax-react-nativejs';
import { getIconSize } from '@core/config/utils/responsive';

export type QuickMenuIconFn = (
  iconColor: string,
  iconName?: string,
  itemId?: string
) => ReactNode;

let provider: QuickMenuIconFn | null = null;

export function setQuickMenuIconProvider(fn: QuickMenuIconFn): void {
  provider = fn;
}

export function getQuickMenuIcon(
  iconColor: string,
  iconName?: string,
  itemId?: string
): ReactNode {
  if (provider) return provider(iconColor, iconName, itemId);
  const size = getIconSize('large');
  return <Element3 width={size} height={size} color={iconColor} variant="Bulk" />;
}
