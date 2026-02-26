/**
 * HomeTabContentRouter
 * Routes tab content by tabId: plugin (lazy/PluginTabContentRenderer), disabled message, built-in tabs, then fallback.
 */
import React, { Suspense } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { useTheme } from "@core/theme";
import { useTranslation } from "@core/i18n";
import {
  getTabPlugin,
  PluginRegistry,
  getHorizontalPadding,
} from "@core/config";
import type { HomeTabConfig } from "@core/config";
import { useNewsState } from "./TabContent";
import {
  BerandaTab,
  BerandaNewsInfo,
  AnalyticsTab,
  NewsTab,
  AktivitasTab,
  DashboardTab,
  TransactionsTab,
} from "./TabContent";
import { PluginTabContentRenderer } from "./PluginTabContentRenderer";
import { getLazyTab, hasLazyTab } from "./LazyPluginTabs";

export interface TabRenderContext {
  activeTab: string;
  layoutWidth: number;
  newsState: ReturnType<typeof useNewsState>;
  showBalance: boolean;
  balance: number;
  balanceLoading: boolean;
  onNavigateToNews: () => void;
  onBalanceDetailPress: () => void;
  onToggleBalance: () => void;
  registerTabRefresh?: (tabId: string, fn: () => void) => void;
}

interface HomeTabContentRouterProps {
  tabId: string;
  tabConfig?: HomeTabConfig | null;
  context: TabRenderContext;
}

export const HomeTabContentRouter: React.FC<HomeTabContentRouterProps> = ({
  tabId,
  tabConfig,
  context,
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const {
    activeTab,
    layoutWidth,
    newsState,
    showBalance,
    balance,
    balanceLoading,
    onNavigateToNews,
    onBalanceDetailPress,
    onToggleBalance,
  } = context;

  const pluginMapping = getTabPlugin(tabId);

  if (pluginMapping && PluginRegistry.isPluginEnabled(pluginMapping.pluginId)) {
    const LazyTab = hasLazyTab(tabId) ? getLazyTab(tabId) : null;
    if (LazyTab) {
      return (
        <Suspense
          fallback={
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          }
        >
          <LazyTab
            isActive={activeTab === tabId}
            isVisible={activeTab === tabId}
            scrollEnabled={false}
          />
        </Suspense>
      );
    }
    return (
      <PluginTabContentRenderer
        tabId={tabId}
        activeTab={activeTab}
        scrollEnabled={false}
      />
    );
  }

  if (
    pluginMapping &&
    !PluginRegistry.isPluginEnabled(pluginMapping.pluginId)
  ) {
    return (
      <View
        style={{
          width: layoutWidth,
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: getHorizontalPadding(),
        }}
      >
        <Text
          style={{
            color: colors.textSecondary,
            fontSize: 16,
            textAlign: "center",
          }}
        >
          {t("home.tabModuleNotEnabled")}
        </Text>
      </View>
    );
  }

  if (tabId === "beranda" || tabId === "home") {
    return (
      <BerandaTab
        isActive={activeTab === tabId}
        onNavigateToNews={onNavigateToNews}
        scrollEnabled={false}
      />
    );
  }

  if (tabId === "beranda-news") {
    return (
      <BerandaNewsInfo
        showNewsInfo={true}
        onNewsPress={onNavigateToNews}
        onViewAllPress={onNavigateToNews}
        limit={6}
      />
    );
  }

  if (tabId === "activity" || tabId === "aktivitas") {
    return (
      <AktivitasTab
        isActive={activeTab === tabId}
        isVisible={activeTab === tabId}
        scrollEnabled={false}
      />
    );
  }

  if (tabId === "news" || tabId === "berita") {
    return (
      <NewsTab
        isActive={activeTab === tabId}
        isVisible={activeTab === tabId}
        searchState={newsState}
        scrollEnabled={false}
      />
    );
  }

  if (tabId === "analytics" || tabId === "analitik") {
    return (
      <AnalyticsTab isActive={activeTab === tabId} scrollEnabled={false} />
    );
  }

  if (tabId === "dashboard") {
    return (
      <DashboardTab
        isActive={activeTab === tabId}
        isVisible={activeTab === tabId}
        scrollEnabled={false}
      />
    );
  }

  if (tabId === "transactions") {
    return (
      <TransactionsTab
        title={t("balance.mainBalance") || "Saldo Utama"}
        balance={balance}
        showBalance={showBalance}
        onToggleBalance={onToggleBalance}
        onBalanceDetailPress={onBalanceDetailPress}
        isLoading={balanceLoading}
        isActive={activeTab === tabId}
        isVisible={activeTab === tabId}
      />
    );
  }

  if (tabConfig?.component) {
    return (
      <View style={{ width: layoutWidth, padding: getHorizontalPadding() }}>
        <Text style={{ color: colors.text }}>{tabConfig.label}</Text>
      </View>
    );
  }

  return (
    <View
      style={{
        width: layoutWidth,
        padding: getHorizontalPadding(),
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text style={{ color: colors.text, fontSize: 16 }}>
        {tabConfig?.label || tabId}
      </Text>
    </View>
  );
};
