/**
 * MarketplaceCicilanScreen Component
 * Tab Cicilan: daftar cicilan dari order yang punya installments
 */
import React, { useCallback, useMemo, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  NativeSyntheticEvent,
  NativeScrollEvent,
  BackHandler,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Wallet } from 'iconsax-react-nativejs';
import {
  scale,
  moderateVerticalScale,
  getHorizontalPadding,
  FontFamily,
  getResponsiveFontSize,
  ScreenHeader,
} from '@core/config';
import { useTheme } from '@core/theme';
import { useTranslation } from '@core/i18n';
import { useTabBar } from '../navigation/TabBarContext';
import { useMarketplaceOrders } from '../../context/MarketplaceOrderContext';
import { paymentService } from '@plugins/payment';
import type { MarketplaceInstallment } from '../../models/MarketplaceInstallment';

const formatPrice = (price: number): string =>
  `Rp ${price.toLocaleString('id-ID')}`;

const formatDate = (iso: string): string => {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
};

interface FlattenedInstallment {
  orderId: string;
  orderNumber: string;
  installment: MarketplaceInstallment;
}

export const MarketplaceCicilanScreen: React.FC = () => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const paddingH = getHorizontalPadding();
  const { toggleTabBar } = useTabBar();
  const { orders, updateOrderInstallment } = useMarketplaceOrders();
  const lastContentOffset = useRef(0);
  const [payingId, setPayingId] = useState<string | null>(null);

  const flattened = useMemo(() => {
    const list: FlattenedInstallment[] = [];
    for (const order of orders) {
      if (order.installments && order.installments.length > 0) {
        for (const inst of order.installments) {
          list.push({
            orderId: order.id,
            orderNumber: order.orderNumber,
            installment: inst,
          });
        }
      }
    }
    return list;
  }, [orders]);

  const goToExplore = useCallback(() => {
    navigation.navigate('MarketplaceExplore' as never);
  }, [navigation]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      goToExplore();
      return true;
    });
    return () => sub.remove();
  }, [goToExplore]);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const currentOffset = event.nativeEvent.contentOffset.y;
      const diff = currentOffset - lastContentOffset.current;
      if (Math.abs(diff) > 3) {
        if (diff > 0 && currentOffset > 20) {
          toggleTabBar(false);
        } else {
          toggleTabBar(true);
        }
      }
      lastContentOffset.current = currentOffset;
    },
    [toggleTabBar]
  );

  const handlePay = useCallback(
    async (item: FlattenedInstallment) => {
      const { orderId, orderNumber, installment } = item;
      if (installment.status === 'paid') return;
      setPayingId(installment.id);
      try {
        await paymentService.payWithBalance(installment.amount, installment.id, {
          storeName: t('marketplace.storeNameCicilan'),
          reference: orderNumber,
        });
        await updateOrderInstallment(orderId, installment.id, {
          status: 'paid',
          paidAt: new Date().toISOString(),
        });
      } catch (err) {
        const msg =
          err instanceof Error && err.message.toLowerCase().includes('insufficient')
            ? t('marketplace.insufficientBalance')
            : t('marketplace.paymentFailed');
        Alert.alert(t('common.error'), msg);
      } finally {
        setPayingId(null);
      }
    },
    [updateOrderInstallment, t]
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title={t('marketplace.cicilan')}
        onBackPress={goToExplore}
        showBorder
        style={{ paddingTop: insets.top, backgroundColor: colors.surface }}
        paddingHorizontal={paddingH}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: paddingH,
            paddingBottom: insets.bottom + moderateVerticalScale(100),
            flexGrow: flattened.length === 0 ? 1 : undefined,
          },
        ]}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        {flattened.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Wallet size={scale(48)} color={colors.textSecondary} variant="Bulk" />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {t('marketplace.emptyCicilan')}
            </Text>
          </View>
        ) : (
          flattened.map(({ orderId, orderNumber, installment }) => (
            <View
              key={installment.id}
              style={[styles.card, { backgroundColor: colors.surface }]}
            >
              <View style={styles.cardRow}>
                <Text style={[styles.orderLabel, { color: colors.textSecondary }]}>
                  {orderNumber}
                </Text>
                <Text
                  style={[
                    styles.statusLabel,
                    {
                      color:
                        installment.status === 'paid'
                          ? colors.success
                          : colors.warning,
                    },
                  ]}
                >
                  {installment.status === 'paid'
                    ? t('marketplace.installmentPaid')
                    : t('marketplace.installmentUnpaid')}
                </Text>
              </View>
              <Text style={[styles.dueLabel, { color: colors.text }]}>
                Jatuh tempo: {formatDate(installment.dueDate)}
              </Text>
              <Text style={[styles.amountLabel, { color: colors.primary }]}>
                {formatPrice(installment.amount)}
              </Text>
              {installment.status === 'unpaid' && (
                <TouchableOpacity
                  style={[styles.payButton, { backgroundColor: colors.primary }]}
                  onPress={() => handlePay({ orderId, orderNumber, installment })}
                  disabled={payingId !== null}
                >
                  {payingId === installment.id ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={styles.payButtonText}>
                      {t('marketplace.payInstallment')}
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    paddingTop: moderateVerticalScale(16),
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(16),
  },
  emptyText: {
    fontFamily: FontFamily?.monasans?.regular ?? 'System',
    fontSize: getResponsiveFontSize('medium'),
  },
  card: {
    padding: scale(16),
    borderRadius: 12,
    marginBottom: scale(12),
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(8),
  },
  orderLabel: {
    fontFamily: FontFamily?.monasans?.semiBold ?? 'System',
    fontSize: getResponsiveFontSize('small'),
  },
  statusLabel: {
    fontFamily: FontFamily?.monasans?.semiBold ?? 'System',
    fontSize: getResponsiveFontSize('small'),
  },
  dueLabel: {
    fontFamily: FontFamily?.monasans?.regular ?? 'System',
    fontSize: getResponsiveFontSize('small'),
    marginBottom: scale(4),
  },
  amountLabel: {
    fontFamily: FontFamily?.monasans?.bold ?? 'System',
    fontSize: getResponsiveFontSize('medium'),
    marginBottom: scale(12),
  },
  payButton: {
    paddingVertical: scale(10),
    borderRadius: 8,
    alignItems: 'center',
  },
  payButtonText: {
    fontFamily: FontFamily?.monasans?.semiBold ?? 'System',
    fontSize: getResponsiveFontSize('small'),
    color: '#FFF',
  },
});
