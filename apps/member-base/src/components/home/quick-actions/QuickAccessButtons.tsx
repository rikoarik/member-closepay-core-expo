/**
 * QuickAccessButtons Component
 * Row dengan quick access buttons - Optimized for performance
 * Menggunakan menu dari quick menu settings
 */
import React, { useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import {
  ArrowDown2,
  Call,
  People,
  Game,
  ArrowUp2,
  Shop,
  TruckFast,
  DocumentText,
  Heart,
  Coffee,
  Activity,
  Element3,
} from 'iconsax-react-nativejs';
import {
  scale,
  moderateVerticalScale,
  getIconSize,
  getResponsiveFontSize,
  getTabletGap,
  getHorizontalPadding,
  FontFamily,
  useQuickMenu,
  useDimensions,
  QuickAccessButtonSkeleton,
  QuickMenuItem,
  getMenuLabelKey,
} from '@core/config';
import { useTheme, type ThemeColors } from '@core/theme';
import { useTranslation } from '@core/i18n';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import {
  IconTopUpVA,
  IconTransferMember,
  IconKartuVirtual,
  IconTransferBank,
  IconMobile,
  IconWallet,
  IconBill,
  IconTransfer,
  IconMore,
  IconDonation,
  IconFnB,
  IconSport,
} from './icons';

interface QuickAccessButton {
  id: string;
  label: string;
  icon: React.ReactNode;
  iconBgColor: string;
  onPress?: () => void;
}

const QUICK_ACCESS_MAX_SLOTS = 7;
const GRID_COLUMNS = 4;
/** Di web, Dimensions.get('window') bisa return lebar browser penuh; cap agar grid tetap 4 kolom */
const MAX_WIDTH_FOR_GRID = 414;

interface QuickAccessButtonsProps {
  buttons?: QuickAccessButton[];
  /**
   * Callback when "Semua Menu" (slot 8) is pressed. If not provided, slot 8 is still shown but press is no-op.
   */
  onAllMenuPress?: () => void;
  /**
   * Key that changes when light/dark theme toggles (e.g. colors.surface). Ensures buttons re-render in real time without Metro reload.
   */
  themeKey?: string;
  /**
   * Gap antar button untuk tablet landscape (optional)
   * Jika tidak diatur, akan menggunakan gap default
   */
  tabletLandscapeGap?: number;
  /**
   * Gap antar button untuk tablet portrait (optional)
   * Jika tidak diatur, akan menggunakan gap default
   */
  tabletPortraitGap?: number;
}

// Asset icons untuk Akses Cepat member (topupva, transfermember, kartuvirtual, transferbank)
const getQuickAccessAssetIcon = (itemId: string, iconColor: string): React.ReactNode | null => {
  const size = getIconSize('large');
  switch (itemId) {
    case 'topupva':
      return <IconTopUpVA width={size} height={size} color={iconColor} />;
    case 'transfermember':
      return <IconTransferMember width={size} height={size} color={iconColor} />;
    case 'kartuvirtual':
      return <IconKartuVirtual width={size} height={size} color={iconColor} />;
    case 'transferbank':
      return <IconTransferBank width={size} height={size} color={iconColor} />;
    default:
      return null;
  }
};

// Fallback by itemId when config from admin has dummy/empty icon - top slots tetap tampil benar
const getIconByItemId = (itemId: string, iconColor: string): React.ReactNode | null => {
  const size = getIconSize('large');
  const variant = 'Bulk';
  switch (itemId?.toLowerCase()) {
    case 'donasizakat':
    case 'donasi':
      return <IconDonation width={size} height={size} color={iconColor} />;
    case 'marketplace':
      return <Shop size={size} color={iconColor} variant={variant} />;
    case 'fnb':
      return <IconFnB width={size} height={size} color={iconColor} />;
    case 'sportcenter':
      return <IconSport width={size} height={size} color={iconColor} />;
    case 'invoice':
      return <DocumentText size={size} color={iconColor} variant={variant} />;
    default:
      return null;
  }
};

// Icon mapping untuk quick menu. Dipakai di app dan didaftarkan ke QuickMenuSettingsScreen via setQuickMenuIconProvider.
// Config dari admin bisa cuma kirim dummy/empty icon; pakai itemId fallback + IconMore agar tidak break
export const getMenuIconForQuickAccess = (iconColor: string, iconName?: string, itemId?: string): React.ReactNode => {
  const assetIcon = itemId ? getQuickAccessAssetIcon(itemId, iconColor) : null;
  if (assetIcon) return assetIcon;

  const size = getIconSize('large');
  const variant = 'Bulk';

  const byItemId = itemId ? getIconByItemId(itemId, iconColor) : null;
  if (byItemId) return byItemId;

  const name = (iconName ?? '').trim();
  if (!name) return <IconMore width={size} height={size} color={iconColor} />;

  switch (iconName) {
    case 'payIPL':
      return <Shop size={size} color={iconColor} variant={variant} />;
    case 'emergency':
      return <Call size={size} color={iconColor} variant={variant} />;
    case 'guest':
      return <People size={size} color={iconColor} variant={variant} />;
    case 'ppob':
      return <IconMobile width={size} height={size} color={iconColor} />;
    case 'transfer':
      return <IconTransfer width={size} height={size} color={iconColor} />;
    case 'payment':
      return <IconWallet width={size} height={size} color={iconColor} />;
    case 'bill':
      return <IconBill width={size} height={size} color={iconColor} />;
    case 'topup':
      return <IconWallet width={size} height={size} color={iconColor} />;
    case 'withdraw':
      return <IconTransfer width={size} height={size} color={iconColor} />;
    case 'donation':
    case 'heart':
      return <IconDonation width={size} height={size} color={iconColor} />;
    case 'marketplace':
      return <Shop size={size} color={iconColor} variant={variant} />;
    case 'fnb':
      return <IconFnB width={size} height={size} color={iconColor} />;
    case 'sportcenter':
      return <IconSport width={size} height={size} color={iconColor} />;
    case 'invoice':
      return <DocumentText size={size} color={iconColor} variant={variant} />;
    default:
      return <IconMore width={size} height={size} color={iconColor} />;
  }
};

// Default background colors untuk setiap menu
const getDefaultBgColor = (colors: ThemeColors, iconName?: string): string => {
  // UNIFIED BACKGROUND: Always return surface color (White) with shadow in container
  return colors.surface;
};

// Default fallback buttons - empty array
const DEFAULT_MENU_ITEMS: QuickMenuItem[] = [];

// Skeleton component for loading state
const QuickAccessSkeleton = React.memo(() => {
  const skeletonItems = useMemo(() => Array.from({ length: GRID_COLUMNS }), []);
  const gap = useMemo(() => scale(12), []);
  const { width: screenWidth } = useDimensions();

  const horizontalPadding = getHorizontalPadding();
  const effectiveWidth =
    Platform.OS === 'web' ? Math.min(screenWidth, MAX_WIDTH_FOR_GRID) : screenWidth;
  const buttonWidth = useMemo(() => {
    const totalGap = gap * (GRID_COLUMNS - 1);
    const availableWidth = effectiveWidth - horizontalPadding * 2;
    return Math.floor((availableWidth - totalGap) / GRID_COLUMNS);
  }, [effectiveWidth, horizontalPadding, gap]);

  return (
    <View style={styles.aksesCepatRow}>
      {skeletonItems.map((_, index) => (
        <View
          key={`skeleton-${index}`}
          style={[
            {
              width: buttonWidth,
              marginRight: (index + 1) % GRID_COLUMNS === 0 ? 0 : gap,
              marginBottom: moderateVerticalScale(12),
            },
          ]}
        >
          <QuickAccessButtonSkeleton />
        </View>
      ))}
    </View>
  );
});

QuickAccessSkeleton.displayName = 'QuickAccessSkeleton';

// Custom comparison: must re-render when theme changes so colors stay in sync
const areEqualQuickAccess = (
  prevProps: QuickAccessButtonsProps,
  nextProps: QuickAccessButtonsProps
) => {
  if (prevProps.themeKey !== nextProps.themeKey) return false;
  if (prevProps.onAllMenuPress !== nextProps.onAllMenuPress) return false;
  if (prevProps.buttons && nextProps.buttons) {
    if (prevProps.buttons.length !== nextProps.buttons.length) return false;
    return prevProps.buttons.every((btn, index) => btn.id === nextProps.buttons![index].id);
  }
  return prevProps.buttons === nextProps.buttons;
};

export const QuickAccessButtons: React.FC<QuickAccessButtonsProps> = React.memo(
  ({ buttons, onAllMenuPress, themeKey, tabletLandscapeGap, tabletPortraitGap }) => {
    const { colors } = useTheme();
    const { t } = useTranslation();
    const navigation = useNavigation();
    const { enabledItems, isLoading, refresh } = useQuickMenu();
    const { width: screenWidth } = useDimensions();

    useFocusEffect(
      useCallback(() => {
        refresh();
      }, [refresh])
    );

    // Stabilize colors untuk mencegah re-render yang tidak perlu
    const primaryColor = colors.primary;
    const surfaceColor = colors.surface;
    const textColor = colors.text;

    // Stabilize screenWidth dengan rounding untuk mencegah re-render kecil
    const stableScreenWidth = useMemo(() => {
      // Round ke 10 terdekat untuk mencegah re-render karena perubahan kecil
      return Math.round(screenWidth / 10) * 10;
    }, [screenWidth]);

    // Get gap yang sesuai dengan device dan orientation
    const gap = useMemo(() => scale(12), []);

    // Stabilize enabledItems dengan useRef untuk mencegah re-render
    const previousEnabledItemsRef = React.useRef<typeof enabledItems>(enabledItems);
    const previousEnabledItemsKeyRef = React.useRef<string>('');

    const stableEnabledItems = useMemo(() => {
      const currentKey = JSON.stringify(
        enabledItems.map((item) => ({
          id: item.id,
          enabled: item.enabled,
          icon: item.icon,
          iconBgColor: item.iconBgColor,
        }))
      );

      // Jika sama dengan previous, return previous array (reference yang sama)
      if (currentKey === previousEnabledItemsKeyRef.current) {
        return previousEnabledItemsRef.current;
      }

      // Update refs
      previousEnabledItemsKeyRef.current = currentKey;
      previousEnabledItemsRef.current = enabledItems;
      return enabledItems;
    }, [enabledItems]);

    // Convert enabled menu items ke format QuickAccessButton
    // Hanya recalculate jika enabledItems benar-benar berubah
    const previousMenuButtonsRef = React.useRef<QuickAccessButton[]>([]);
    const previousSurfaceColorRef = React.useRef<string>(surfaceColor);

    // Background ikon selalu ikut theme (light = putih, dark = gelap). Jangan return cache saat theme berubah.
    const menuButtons = useMemo((): QuickAccessButton[] => {
      if (isLoading) {
        return [];
      }
      const items = stableEnabledItems.length > 0 ? stableEnabledItems : DEFAULT_MENU_ITEMS;
      const buttons: QuickAccessButton[] = items.map((item) => ({
        id: item.id,
        label: getMenuLabelKey(item) ? t(getMenuLabelKey(item)!) : item.label,
        icon: getMenuIconForQuickAccess(primaryColor, item.icon as string, item.id),
        iconBgColor: getDefaultBgColor(colors, item.icon as string),
        onPress: (item as unknown as QuickMenuItem).route
          ? () => {
              (navigation as any).navigate((item as unknown as QuickMenuItem).route as never);
            }
          : undefined,
      }));

      // Saat theme berubah (surfaceColor beda), selalu pakai buttons baru — jangan return cache yang masih gelap/terang
      if (previousSurfaceColorRef.current !== surfaceColor) {
        previousSurfaceColorRef.current = surfaceColor;
        previousMenuButtonsRef.current = buttons;
        return buttons;
      }

      const currentKey = JSON.stringify(
        buttons.map((b: QuickAccessButton) => ({ id: b.id, label: b.label }))
      );
      const previousKey = JSON.stringify(
        previousMenuButtonsRef.current.map((b: QuickAccessButton) => ({ id: b.id, label: b.label }))
      );

      if (currentKey === previousKey && previousMenuButtonsRef.current.length > 0) {
        return previousMenuButtonsRef.current;
      }

      previousMenuButtonsRef.current = buttons;
      return buttons;
    }, [stableEnabledItems, t, isLoading, navigation, primaryColor, surfaceColor]);

    const allMenuButton: QuickAccessButton = useMemo(
      () => ({
        id: 'all-menu',
        label: t('home.allMenu'),
        icon: <Element3 size={getIconSize('large')} color={primaryColor} variant="Bulk" />,
        iconBgColor: colors.primaryLight || colors.surface,
        onPress: onAllMenuPress,
      }),
      [t, primaryColor, colors.primaryLight, colors.surface, onAllMenuPress]
    );

    const baseButtons = buttons ?? menuButtons;
    const displayedSlots = baseButtons.slice(0, QUICK_ACCESS_MAX_SLOTS);
    const buttonsToRender = [...displayedSlots, allMenuButton];
    const buttonCount = buttonsToRender.length;
    const itemsPerRow = GRID_COLUMNS;

    // Hitung width button untuk grid 4 kolom; di web cap lebar agar tidak pakai lebar browser penuh
    const horizontalPadding = getHorizontalPadding();
    const effectiveWidth =
      Platform.OS === 'web' ? Math.min(stableScreenWidth, MAX_WIDTH_FOR_GRID) : stableScreenWidth;
    const buttonWidth = useMemo(() => {
      const totalGap = gap * (itemsPerRow - 1);
      const availableWidth = effectiveWidth - horizontalPadding * 2;
      return Math.floor((availableWidth - totalGap) / itemsPerRow);
    }, [effectiveWidth, horizontalPadding, gap, itemsPerRow]);

    // Memoized button style calculator
    const getButtonStyle = useCallback(
      (index: number) => {
        const rowIndex = Math.floor(index / itemsPerRow);
        const positionInRow = index % itemsPerRow;
        const isLastInRow = positionInRow === itemsPerRow - 1;
        const totalRows = Math.ceil(buttonCount / itemsPerRow);
        const isLastRow = rowIndex === totalRows - 1;

        return {
          width: buttonWidth,
          marginRight: isLastInRow ? 0 : gap,
          marginBottom: isLastRow ? 0 : moderateVerticalScale(12),
        };
      },
      [buttonWidth, gap, buttonCount]
    );

    if (isLoading) {
      return <QuickAccessSkeleton />;
    }

    return (
      <View style={styles.aksesCepatRow}>
        {buttonsToRender.map((button, index) => (
          <TouchableOpacity
            key={button.id}
            style={[styles.aksesCepatButton, getButtonStyle(index)]}
            onPress={button.onPress}
            activeOpacity={0.7}
          >
            <View style={[styles.aksesCepatIcon, { backgroundColor: button.iconBgColor }]}>
              {button.icon}
            </View>
            <Text style={[styles.aksesCepatLabel, { color: textColor }]} numberOfLines={2}>
              {button.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  },
  areEqualQuickAccess
);

QuickAccessButtons.displayName = 'QuickAccessButtons';

const styles = StyleSheet.create({
  aksesCepatRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  aksesCepatButton: {
    alignItems: 'center',
  },
  aksesCepatIcon: {
    width: scale(56),
    height: scale(56),
    borderRadius: scale(16),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: moderateVerticalScale(8),
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
  },
  aksesCepatLabel: {
    fontSize: getResponsiveFontSize('small'),
    fontFamily: FontFamily.monasans.medium,
    textAlign: 'center',
  },
});
