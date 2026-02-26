/**
 * Member Base App App Entry Point
 * Template untuk company-specific app
 *
 * Usage:
 * 1. Copy this template to apps/{your-company-id}/index.tsx
 * 2. Update imports for your app-specific navigator
 * 3. Load your company-specific config
 * 4. Customize branding, plugins, and features
 */

import React, { useState, useEffect, useMemo } from 'react';
import { StatusBar, View, Text, ActivityIndicator, AppState, AppStateStatus } from 'react-native';
import { useFonts } from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from '@core/theme';
import { monaSansFontMap } from './loadFonts';
import { I18nProvider } from '@core/i18n';
import { SecurityProviderWrapper } from './SecurityProviderWrapper';
import { configService, configRefreshService, logger } from '@core/config';
import { initializePlugins } from '@core/config';
import { createAppNavigator } from '@core/navigation';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from './src/screens/HomeScreen';
import { NotificationScreen } from './src/screens/NotificationScreen';
import { NewsDetailScreen } from './src/screens/NewsDetailScreen';
import { NewsScreen } from './src/screens/NewsScreen';
import { SearchScreen, SearchResultsScreen } from '@plugins/marketplace';
import Toast from 'react-native-toast-message';
import { toastConfig } from './src/components/CustomToast';

// Screens from plugins (VirtualAccount, TransferMember, Withdraw, Qr are registered via plugin routes)
import { QrScreen } from '@plugins/payment';
import { TransactionHistoryScreen } from '@plugins/balance';
// Marketplace, ProductDetail, Cart, FnB from plugin routes
// App screens (VirtualCard, VirtualCardDetail, AddVirtualCard come from card-transaction plugin routes)
import { ProfileScreen } from '@core/account';
import { PlaceholderScreen } from './src/screens/PlaceholderScreen';
import { FnBCartProvider, FnBActiveOrderProvider } from '@plugins/marketplace-fnb';
import { MarketplaceOrderProvider } from '@plugins/marketplace';
import { appConfig } from './config/app.config';

const Stack = createNativeStackNavigator();

function MemberBaseAppContent(): React.JSX.Element {
  const { colors, isDark } = useTheme();
  const [pluginsInitialized, setPluginsInitialized] = useState(false);
  const [configLoaded, setConfigLoaded] = useState(false);

  // Create navigator (must be called before any conditional returns)
  const AppNavigator = useMemo(() => {
    const appScreens = (
      <>
        {/* Core Screens */}
        <Stack.Screen name="Notifications" component={NotificationScreen} />
        <Stack.Screen name="News" component={NewsScreen} />
        <Stack.Screen name="NewsDetail" component={NewsDetailScreen} />
        <Stack.Screen name="Search" component={SearchScreen} />
        <Stack.Screen name="SearchResults" component={SearchResultsScreen} />

        {/* Payment & Transfer Screens - VirtualAccount, TransferMember, Withdraw, Qr come from plugin routes */}
        <Stack.Screen name="ScanQr" component={QrScreen} />
        <Stack.Screen name="RequestMoney" component={PlaceholderScreen} />
        <Stack.Screen name="SplitBill" component={PlaceholderScreen} />

        {/* Marketplace & F&B (Marketplace, FnB, ProductDetail, Cart from plugin routes) */}
        {/* Search/SearchResults: app-specific names, plugin uses MarketplaceSearch/MarketplaceSearchResults */}
        {/* Card Screens (VirtualCard from card-transaction plugin) */}
        <Stack.Screen name="CardTopup" component={PlaceholderScreen} />
        <Stack.Screen name="CardLimit" component={PlaceholderScreen} />

        {/* Profile from core createAppNavigator; Settings/Account use same component, different route names */}
        <Stack.Screen name="Settings" component={ProfileScreen} />
        <Stack.Screen name="Account" component={ProfileScreen} />
        <Stack.Screen name="Reports" component={TransactionHistoryScreen} />
      </>
    );

    const Navigator = createAppNavigator({
      tenantId: 'member-base',
      HomeScreen: HomeScreen,
      appScreens: appScreens,
    });
    return Navigator;
  }, []);

  // Initialize app on mount
  useEffect(() => {
    let cancelled = false;
    const initializeApp = async () => {
      try {
        configService.setConfig(appConfig);
        if (!cancelled) setConfigLoaded(true);

        await initializePlugins();
        if (!cancelled) setPluginsInitialized(true);
      } catch (error) {
        logger.error('Failed to initialize app', error);
        if (!cancelled) {
          setConfigLoaded(true);
          setPluginsInitialized(true);
        }
      }
    };
    initializeApp();
    return () => {
      cancelled = true;
    };
  }, []);

  // Handle app state changes - refresh config saat app menjadi active
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // App menjadi active, refresh config dari backend
        configRefreshService.refresh().catch((error) => {
          logger.error('Failed to refresh config on app active', error);
        });
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, []);

  if (!configLoaded || !pluginsInitialized) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 16, color: colors.textSecondary }}>Memuat aplikasi...</Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <MarketplaceOrderProvider>
        <FnBCartProvider>
          <FnBActiveOrderProvider>
            <AppNavigator />
          </FnBActiveOrderProvider>
        </FnBCartProvider>
      </MarketplaceOrderProvider>
      <Toast config={toastConfig} />
    </>
  );
}

function FontLoader({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [fontsLoaded, fontError] = useFonts(monaSansFontMap);
  const { colors } = useTheme();

  if (!fontsLoaded && !fontError) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 16, color: colors.textSecondary }}>Memuat font...</Text>
      </View>
    );
  }

  return <>{children}</>;
}

function MemberBaseApp(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <I18nProvider>
          <SecurityProviderWrapper>
            <FontLoader>
              <MemberBaseAppContent />
            </FontLoader>
          </SecurityProviderWrapper>
        </I18nProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

export default MemberBaseApp;
