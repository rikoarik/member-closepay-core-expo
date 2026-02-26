import { useEffect, useRef } from 'react';
import type { Tab } from '@core/config';

export interface UseTabSyncParams {
  tabs: Tab[];
  activeTab: string;
  setActiveTab: (id: string) => void;
}

/**
 * Sets default tab once when tabs are ready, and validates activeTab
 * when tabs list changes (e.g. after settings save). Single useEffect.
 */
export function useTabSync(params: UseTabSyncParams): void {
  const { tabs, activeTab, setActiveTab } = params;
  const hasSetDefaultRef = useRef(false);

  useEffect(() => {
    if (tabs.length === 0) return;

    // 1. Default tab (once): set to beranda/home or middle/first
    if (!hasSetDefaultRef.current) {
      hasSetDefaultRef.current = true;
      const berandaTab = tabs.find((t) => t.id === 'beranda' || t.id === 'home');
      const defaultTabId = berandaTab?.id ?? (tabs.length >= 2 ? tabs[1].id : tabs[0].id);
      if (activeTab !== defaultTabId) {
        setActiveTab(defaultTabId);
      }
      return;
    }

    // 2. Validate: ensure activeTab is still in tabs list
    const idx = tabs.findIndex((t) => t.id === activeTab);
    if (idx >= 0) return;

    const berandaOrMiddle =
      tabs.find((t) => t.id === 'beranda' || t.id === 'home')?.id ??
      (tabs.length >= 2 ? tabs[1].id : tabs[0].id);
    if (activeTab === berandaOrMiddle) return;
    setActiveTab(berandaOrMiddle);
  }, [tabs, activeTab, setActiveTab]);
}
