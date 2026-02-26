/**
 * HomeScreen Component
 * Dashboard screen sesuai design
 * Responsive untuk semua device termasuk EDC
 */
import React, { useState, useRef, useCallback, useMemo, memo } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Animated,
  Platform,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useTheme } from "@core/theme";
import { useTranslation } from "@core/i18n";
import {
  moderateVerticalScale,
  getHorizontalPadding,
  TabSwitcher,
  useDimensions,
  type Tab,
  useConfig,
  useRefreshWithConfig,
  loadHomeTabSettings,
  getWidgetPlugin,
  PluginRegistry,
  validateEnabledTabIds,
  usePluginComponent,
} from "@core/config";
import { TopBar } from "../components/home";
import { useNewsState } from "../components/home";
import { HomeTabContentRouter } from "../components/home/HomeTabContentRouter";
import { HomeTabPager } from "../components/home/HomeTabPager";
import {
  useTabSync,
  usePagerSync,
  useDoubleBackExit,
} from "../components/home/hooks";
import { QrFab } from "../components/home/QrFab";
import { useNotifications } from "@core/notification";
import { useBalance } from "@plugins/balance";
import { useFnBActiveOrder } from "@plugins/marketplace-fnb";

const FNB_ORDER_FLOATING_WIDGET_ID = "fnb-order-floating";

const HomeScreenComponent = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { width: screenWidth } = useDimensions();
  const fnbFloatingWidgetPlugin = getWidgetPlugin(FNB_ORDER_FLOATING_WIDGET_ID);
  const { Component: FnBOrderFloatingWidget, loading: fnbWidgetLoading } =
    usePluginComponent({
      pluginId: fnbFloatingWidgetPlugin?.pluginId ?? "",
      componentName: fnbFloatingWidgetPlugin?.componentName ?? "",
    });
  const showFnBFloatingWidget =
    fnbFloatingWidgetPlugin &&
    PluginRegistry.isPluginEnabled(fnbFloatingWidgetPlugin.pluginId) &&
    !fnbWidgetLoading &&
    FnBOrderFloatingWidget;
  const { activeOrder: fnbActiveOrder } = useFnBActiveOrder();
  const isFnBWidgetVisible = Boolean(
    fnbActiveOrder &&
    fnbActiveOrder.status !== "completed" &&
    fnbActiveOrder.status !== "cancelled",
  );
  // State for News Tab (Lifted Up)
  const newsState = useNewsState();

  const pagerRef = useRef<any>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const { config } = useConfig();
  const [enabledTabIdsFromSettings, setEnabledTabIdsFromSettings] = useState<
    string[] | null
  >(null);
  const [showBalance, setShowBalance] = useState(false);
  const { balance, isLoading: balanceLoading } = useBalance();

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      loadHomeTabSettings().then((settings) => {
        if (!cancelled) setEnabledTabIdsFromSettings(settings.enabledTabIds);
      });
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const configHomeTabs = React.useMemo(() => {
    const raw = config?.homeTabs || [];
    return raw
      .filter((tab) => tab.visible !== false)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [config?.homeTabs]);

  /** Semua tab dari config (termasuk visible: false) untuk validasi tab pilihan user di settings */
  const configHomeTabsFull = React.useMemo(() => {
    const raw = config?.homeTabs || [];
    return [...raw].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [config?.homeTabs]);

  const homeTabs = React.useMemo(() => {
    if (enabledTabIdsFromSettings === null) return configHomeTabs;
    const tabById = new Map(configHomeTabsFull.map((tab) => [tab.id, tab]));
    const validIds = configHomeTabsFull.map((tab) => tab.id);
    if (validIds.length === 0) return configHomeTabs;
    if (enabledTabIdsFromSettings.length === 0) return configHomeTabs;

    const orderedIds = validateEnabledTabIds(
      enabledTabIdsFromSettings,
      validIds,
    );
    const seen = new Set<string>();
    return orderedIds.map((id) => {
      const fromConfig = tabById.get(id);
      if (fromConfig) {
        seen.add(id);
        return fromConfig;
      }
      const fallback = validIds.find((vid) => !seen.has(vid)) ?? validIds[0];
      seen.add(fallback);
      return (
        tabById.get(fallback) ?? {
          id: fallback,
          label: fallback,
          visible: true as const,
        }
      );
    });
  }, [configHomeTabs, configHomeTabsFull, enabledTabIdsFromSettings]);

  const tabs: Tab[] = React.useMemo(() => {
    return homeTabs.map((tab) => {
      const i18nKey = `home.${tab.id}`;
      const translatedLabel = t(i18nKey);
      const label =
        translatedLabel && translatedLabel !== i18nKey
          ? translatedLabel
          : tab.label;
      return { id: tab.id, label };
    });
  }, [homeTabs, t]);

  // Default tab tengah = Beranda (tab index 1: kiri=0, beranda=1, kanan=2)
  const [activeTab, setActiveTab] = useState<string>("beranda");
  const tabRefreshFunctionsRef = useRef<{ [key: string]: () => void }>({});

  // Di web pakai max lebar 414 (sama seperti HP) agar layout/gambar tidak nge-scale
  const MOBILE_VIEWPORT_WIDTH = 414;
  const layoutWidth =
    Platform.OS === "web"
      ? Math.min(screenWidth, MOBILE_VIEWPORT_WIDTH)
      : screenWidth;

  // Hide QR FAB when FnB order floating widget is visible (avoid overlap)
  const shouldShowFab =
    config?.showQrButton !== false &&
    (activeTab === "beranda" || activeTab === "home") &&
    !isFnBWidgetVisible;

  useTabSync({ tabs, activeTab, setActiveTab });
  const { handleTabChange } = usePagerSync({
    tabs,
    activeTab,
    setActiveTab,
    pagerRef,
    layoutWidth,
    scrollX,
  });
  useDoubleBackExit({ tabs, activeTab, setActiveTab, pagerRef, layoutWidth });

  const registerTabRefresh = useCallback(
    (tabId: string, refreshFn: () => void) => {
      tabRefreshFunctionsRef.current[tabId] = refreshFn;
    },
    [],
  );

  const tabRenderContext = useMemo(
    () => ({
      activeTab,
      layoutWidth,
      newsState,
      showBalance,
      balance: balance?.balance ?? 0,
      balanceLoading,
      onNavigateToNews: () => navigation.navigate("News" as never),
      onBalanceDetailPress: () =>
        navigation.navigate("TransactionHistory" as never),
      onToggleBalance: () => setShowBalance((v) => !v),
      registerTabRefresh,
    }),
    [
      activeTab,
      layoutWidth,
      newsState,
      showBalance,
      balance?.balance,
      balanceLoading,
      navigation,
      registerTabRefresh,
    ],
  );

  const { refresh: handleRefresh, isRefreshing: refreshing } =
    useRefreshWithConfig({
      onRefresh: async () => {
        // Call refresh function of active tab
        const refreshFn = tabRefreshFunctionsRef.current[activeTab];
        if (refreshFn) {
          refreshFn();
        }
      },
      enableConfigRefresh: true,
    });

  const handleMenuPress = () => {
    navigation.navigate("Profile" as never);
  };

  const handleNotificationPress = () => {
    navigation.navigate("Notifications" as never);
  };

  const handleQrPress = () => {
    navigation.navigate("Qr" as never);
  };

  const activeTabIndex = useMemo(
    () => tabs.findIndex((t) => t.id === activeTab),
    [tabs, activeTab],
  );

  const shouldRenderTab = useCallback(
    (tabId: string, index: number) => {
      return Math.abs(index - activeTabIndex) <= 1;
    },
    [activeTabIndex],
  );

  const handlePagerMomentumEnd = useCallback(
    (event: any) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const index = Math.round(offsetX / layoutWidth);

      if (tabs[index] && tabs[index].id !== activeTab) {
        setActiveTab(tabs[index].id);
      }
    },
    [layoutWidth, tabs, activeTab],
  );

  const { unreadCount, refresh: refreshNotifications } = useNotifications();

  useFocusEffect(
    React.useCallback(() => {
      const id = requestAnimationFrame(() => {
        refreshNotifications();
      });
      return () => cancelAnimationFrame(id);
    }, [refreshNotifications]),
  );

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      {/* Main ScrollView dengan sticky header di TabSwitcher */}
      <ScrollView
        style={[styles.scrollView]}
        contentContainerStyle={styles.scrollContent}
        stickyHeaderIndices={[1]}
        showsVerticalScrollIndicator={false}
        bounces={true}
        directionalLockEnabled={true}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        {...(Platform.OS === "ios" && {
          contentInsetAdjustmentBehavior: "automatic",
          automaticallyAdjustContentInsets: false,
          automaticallyAdjustKeyboardInsets: false,
        })}
      >
        {/* TopBar - Bisa di-scroll */}
        <View
          style={[
            styles.topBarContainer,
            {
              paddingHorizontal: getHorizontalPadding(),
              backgroundColor: colors.background,
            },
          ]}
        >
          <TopBar
            notificationCount={unreadCount}
            onNotificationPress={handleNotificationPress}
            onMenuPress={handleMenuPress}
          />
        </View>

        {/* Tab Switcher - Sticky Header */}
        <View
          style={{
            zIndex: 1,
            backgroundColor: colors.background,
          }}
        >
          {tabs.length > 1 && (
            <View
              style={{
                paddingHorizontal: getHorizontalPadding(),
                paddingVertical: moderateVerticalScale(12),
              }}
            >
              <TabSwitcher
                variant="segmented"
                tabs={tabs}
                activeTab={activeTab}
                onTabChange={handleTabChange}
                scrollX={scrollX}
                pagerWidth={layoutWidth}
              />
            </View>
          )}
        </View>

        {/* Tab Content - Horizontal Pager untuk swipe antar tab */}
        <View style={styles.tabContentContainer}>
          <HomeTabPager
            tabs={tabs}
            activeTab={activeTab}
            layoutWidth={layoutWidth}
            scrollX={scrollX}
            pagerRef={pagerRef}
            onMomentumScrollEnd={handlePagerMomentumEnd}
            shouldRenderTab={shouldRenderTab}
            renderTab={(tabId, index) => (
              <HomeTabContentRouter
                tabId={tabId}
                tabConfig={homeTabs.find((t) => t.id === tabId) ?? undefined}
                context={tabRenderContext}
              />
            )}
          />
        </View>
      </ScrollView>

      {/* FnB active order floating widget (Grab/GoFood style) */}
      {showFnBFloatingWidget && (
        <View
          style={styles.fnbFloatingWidgetContainer}
          pointerEvents="box-none"
        >
          <FnBOrderFloatingWidget />
        </View>
      )}

      {config?.showQrButton !== false && (
        <QrFab visible={shouldShowFab} onPress={handleQrPress} />
      )}
    </SafeAreaView>
  );
};

export const HomeScreen = memo(HomeScreenComponent);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  topBarContainer: {
    paddingBottom: moderateVerticalScale(8),
  },
  tabContentContainer: {
    flex: 1,
  },
  fnbFloatingWidgetContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0, // above FAB QR button
    zIndex: 99999999999,
  },
});
