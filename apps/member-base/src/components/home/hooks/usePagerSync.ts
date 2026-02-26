import { useEffect, useRef, useCallback } from 'react';
import { Animated } from 'react-native';
import type { Tab } from '@core/config';

export interface UsePagerSyncParams {
  tabs: Tab[];
  activeTab: string;
  setActiveTab: (id: string) => void;
  pagerRef: React.RefObject<any>;
  layoutWidth: number;
  scrollX: Animated.Value;
}

export interface UsePagerSyncReturn {
  handleTabChange: (tabId: string) => void;
}

/**
 * Syncs pager scroll with tab state: initial scroll, mount scroll,
 * handleTabChange with debounce, and cleanup.
 */
export function usePagerSync(params: UsePagerSyncParams): UsePagerSyncReturn {
  const { tabs, activeTab, setActiveTab, pagerRef, layoutWidth, scrollX } = params;
  const hasInitialScrollRef = useRef(false);
  const tabChangeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getTabIndex = useCallback(
    (tabId: string) => tabs.findIndex((tab) => tab.id === tabId),
    [tabs]
  );

  // Initial scroll to match activeTab (once, after useTabSync sets default)
  useEffect(() => {
    if (hasInitialScrollRef.current || tabs.length === 0 || !pagerRef.current) return;
    const index = tabs.findIndex((t) => t.id === activeTab);
    if (index < 0) return;
    hasInitialScrollRef.current = true;
    scrollX.setValue(index * layoutWidth);
    requestAnimationFrame(() => {
      pagerRef.current?.scrollTo({ x: index * layoutWidth, animated: false });
    });
  }, [activeTab, tabs, layoutWidth, scrollX, pagerRef]);

  // handleTabChange with debounce + cleanup timeout on unmount
  const handleTabChange = useCallback(
    (tabId: string) => {
      if (tabChangeTimeoutRef.current) {
        clearTimeout(tabChangeTimeoutRef.current);
      }
      setActiveTab(tabId);
      tabChangeTimeoutRef.current = setTimeout(() => {
        if (pagerRef.current) {
          const index = getTabIndex(tabId);
          if (index >= 0) {
            pagerRef.current.scrollTo({
              x: index * layoutWidth,
              animated: true,
            });
          }
        }
      }, 50);
    },
    [layoutWidth, getTabIndex, setActiveTab, pagerRef]
  );

  useEffect(() => {
    return () => {
      if (tabChangeTimeoutRef.current) {
        clearTimeout(tabChangeTimeoutRef.current);
      }
    };
  }, []);

  return { handleTabChange };
}
