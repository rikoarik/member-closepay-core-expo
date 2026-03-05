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
  /** Set true when pager has laid out so initial scroll can run (avoids ref timing) */
  pagerReady?: boolean;
}

export interface UsePagerSyncReturn {
  handleTabChange: (tabId: string) => void;
  /** Call when user starts dragging so pending programmatic scroll is cancelled */
  cancelPendingScroll: () => void;
}

/**
 * Syncs pager scroll with tab state: initial scroll, mount scroll,
 * handleTabChange with debounce, and cleanup.
 */
export function usePagerSync(params: UsePagerSyncParams): UsePagerSyncReturn {
  const { tabs, activeTab, setActiveTab, pagerRef, layoutWidth, scrollX, pagerReady = true } = params;
  const hasInitialScrollRef = useRef(false);
  const tabChangeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getTabIndex = useCallback(
    (tabId: string) => tabs.findIndex((tab) => tab.id === tabId),
    [tabs]
  );

  const cancelPendingScroll = useCallback(() => {
    if (tabChangeTimeoutRef.current) {
      clearTimeout(tabChangeTimeoutRef.current);
      tabChangeTimeoutRef.current = null;
    }
  }, []);

  // Initial scroll to match activeTab (once, when pager is ready)
  useEffect(() => {
    if (hasInitialScrollRef.current || tabs.length === 0 || layoutWidth <= 0 || !pagerReady || !pagerRef.current) return;
    const index = tabs.findIndex((t) => t.id === activeTab);
    if (index < 0) return;
    hasInitialScrollRef.current = true;
    const x = index * layoutWidth;
    scrollX.setValue(x);
    requestAnimationFrame(() => {
      pagerRef.current?.scrollTo({ x, animated: false });
    });
  }, [activeTab, tabs, layoutWidth, scrollX, pagerRef, pagerReady]);

  // Saat layoutWidth berubah (mis. setelah onLayout pager), sync posisi scroll
  const prevLayoutWidthRef = useRef(layoutWidth);
  useEffect(() => {
    if (tabs.length === 0 || layoutWidth <= 0 || !pagerRef.current) return;
    if (prevLayoutWidthRef.current === layoutWidth) return;
    prevLayoutWidthRef.current = layoutWidth;
    const index = Math.min(Math.max(0, tabs.findIndex((t) => t.id === activeTab)), tabs.length - 1);
    const x = index * layoutWidth;
    scrollX.setValue(x);
    pagerRef.current.scrollTo({ x, animated: false });
  }, [layoutWidth, tabs, activeTab, scrollX, pagerRef]);

  // handleTabChange with debounce; cancel on drag so tap-then-swipe is not overridden
  const handleTabChange = useCallback(
    (tabId: string) => {
      cancelPendingScroll();
      setActiveTab(tabId);
      tabChangeTimeoutRef.current = setTimeout(() => {
        tabChangeTimeoutRef.current = null;
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
    [layoutWidth, getTabIndex, setActiveTab, pagerRef, cancelPendingScroll]
  );

  useEffect(() => {
    return () => {
      if (tabChangeTimeoutRef.current) {
        clearTimeout(tabChangeTimeoutRef.current);
      }
    };
  }, []);

  return { handleTabChange, cancelPendingScroll };
}
