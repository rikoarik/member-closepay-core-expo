import { useRef, useCallback } from 'react';
import { BackHandler, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { useTranslation } from '@core/i18n';
import type { Tab } from '@core/config';

const DOUBLE_BACK_PRESS_DELAY = 2000;

export interface UseDoubleBackExitParams {
  tabs: Tab[];
  activeTab: string;
  setActiveTab: (id: string) => void;
  pagerRef: React.RefObject<any>;
  layoutWidth: number;
}

/**
 * Registers hardware back press: from non-home tab go to home;
 * on home tab, double-back to exit (Android) or show Toast.
 */
export function useDoubleBackExit(params: UseDoubleBackExitParams): void {
  const { tabs, activeTab, setActiveTab, pagerRef, layoutWidth } = params;
  const { t } = useTranslation();
  const backPressTimeRef = useRef<number>(0);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        const homeTabId = tabs.find((tab) => tab.id === 'home' || tab.id === 'beranda')?.id;
        const isHomeTab = homeTabId && activeTab === homeTabId;

        if (!isHomeTab && homeTabId) {
          setActiveTab(homeTabId);
          const homeIndex = tabs.findIndex((tab) => tab.id === homeTabId);
          if (homeIndex >= 0 && pagerRef.current) {
            pagerRef.current.scrollTo({
              x: homeIndex * layoutWidth,
              animated: true,
            });
          }
          return true;
        }

        const now = Date.now();
        if (backPressTimeRef.current && now - backPressTimeRef.current < DOUBLE_BACK_PRESS_DELAY) {
          if (Platform.OS === 'android') {
            BackHandler.exitApp();
          }
          return true;
        }
        backPressTimeRef.current = now;
        Toast.show({
          type: 'info',
          text1: t('common.pressAgainToExit') || 'Tekan sekali lagi untuk keluar',
          position: 'bottom',
          visibilityTime: 2000,
        });
        return true;
      };

      const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => {
        backHandler.remove();
        backPressTimeRef.current = 0;
      };
    }, [activeTab, tabs, layoutWidth, setActiveTab, pagerRef, t])
  );
}
