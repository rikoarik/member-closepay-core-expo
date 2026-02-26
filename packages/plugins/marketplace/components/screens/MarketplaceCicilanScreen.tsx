/**
 * MarketplaceCicilanScreen Component
 * Tab Cicilan: daftar cicilan dari order (tabs Belum Lunas / Lunas), expandable cards, status badge (overdue), inline pay
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
import { Wallet, ArrowDown2, ArrowUp2 } from 'iconsax-react-nativejs';
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
  const [activeTab, setActiveTab] = useState<'unpaid' | 'paid'>('unpaid');
  const [expandedId, setExpandedId] = useState<string | null>(null);

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

  const unpaidList = useMemo(
    () => flattened.filter((f) => f.installment.status !== 'paid'),
    [flattened]
  );
  const paidList = useMemo(
    () => flattened.filter((f) => f.installment.status === 'paid'),
    [flattened]
  );
  const displayList = activeTab === 'unpaid' ? unpaidList : paidList;

  const isOverdue = useCallback((inst: MarketplaceInstallment) => {
    if (inst.status === 'overdue') return true;
    if (inst.status !== 'unpaid') return false;
    try {
      return new Date(inst.dueDate) < new Date();
    } catch {
      return false;
    }
  }, []);

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

      {/* Tabs: Belum Lunas | Lunas */}
      <View style={[styles.tabRow, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'unpaid' && {
              borderBottomColor: colors.primary,
              borderBottomWidth: 2,
            },
          ]}
          onPress={() => setActiveTab('unpaid')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'unpaid' ? colors.primary : colors.textSecondary },
            ]}
          >
            {t('marketplace.cicilanBelumLunas')}
          </Text>
          {unpaidList.length > 0 && (
            <View style={[styles.badge, { backgroundColor: colors.primaryLight }]}>
              <Text style={[styles.badgeText, { color: colors.primary }]}>{unpaidList.length}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'paid' && {
              borderBottomColor: colors.primary,
              borderBottomWidth: 2,
            },
          ]}
          onPress={() => setActiveTab('paid')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'paid' ? colors.primary : colors.textSecondary },
            ]}
          >
            {t('marketplace.cicilanLunas')}
          </Text>
          {paidList.length > 0 && (
            <View style={[styles.badge, { backgroundColor: colors.primaryLight }]}>
              <Text style={[styles.badgeText, { color: colors.primary }]}>{paidList.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: paddingH,
            paddingBottom: insets.bottom + moderateVerticalScale(100),
            flexGrow: displayList.length === 0 ? 1 : undefined,
          },
        ]}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        {displayList.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Wallet size={scale(48)} color={colors.textSecondary} variant="Bulk" />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {activeTab === 'unpaid'
                ? t('marketplace.emptyCicilan')
                : t('marketplace.emptyCicilan')}
            </Text>
          </View>
        ) : (
          displayList.map(({ orderId, orderNumber, installment }) => {
            const overdue = isOverdue(installment);
            const expanded = expandedId === installment.id;
            return (
              <View
                key={installment.id}
                style={[styles.card, { backgroundColor: colors.surface }]}
              >
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setExpandedId(expanded ? null : installment.id)}
                >
                  <View style={styles.cardRow}>
                    <Text style={[styles.orderLabel, { color: colors.textSecondary }]}>
                      {orderNumber}
                      {installment.sequenceNumber != null && (
                        <Text style={{ color: colors.textSecondary }}>
                          {' '}
                          · #{installment.sequenceNumber}
                        </Text>
                      )}
                    </Text>
                    <View style={styles.statusRow}>
                      {overdue && (
                        <View
                          style={[
                            styles.overdueBadge,
                            { backgroundColor: colors.error + '20' },
                          ]}
                        >
                          <Text
                            style={[styles.overdueBadgeText, { color: colors.error }]}
                          >
                            {t('marketplace.installmentOverdue')}
                          </Text>
                        </View>
                      )}
                      <Text
                        style={[
                          styles.statusLabel,
                          {
                            color:
                              installment.status === 'paid'
                                ? colors.success
                                : overdue
                                  ? colors.error
                                  : colors.warning,
                          },
                        ]}
                      >
                        {installment.status === 'paid'
                          ? t('marketplace.installmentPaid')
                          : t('marketplace.installmentUnpaid')}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.dueLabel, { color: colors.text }]}>
                    Jatuh tempo: {formatDate(installment.dueDate)}
                  </Text>
                  <Text style={[styles.amountLabel, { color: colors.primary }]}>
                    {formatPrice(installment.amount)}
                  </Text>
                  <View style={styles.expandRow}>
                    {expanded ? (
                      <ArrowUp2 size={scale(16)} color={colors.textSecondary} />
                    ) : (
                      <ArrowDown2 size={scale(16)} color={colors.textSecondary} />
                    )}
                  </View>
                </TouchableOpacity>
                {expanded && (
                  <View style={[styles.expandedContent, { borderTopColor: colors.border }]}>
                    <Text style={[styles.expandedLabel, { color: colors.textSecondary }]}>
                      Order: {orderNumber}
                    </Text>
                    {installment.sequenceNumber != null && (
                      <Text style={[styles.expandedLabel, { color: colors.textSecondary }]}>
                        Cicilan ke-{installment.sequenceNumber}
                      </Text>
                    )}
                  </View>
                )}
                {installment.status !== 'paid' && (
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
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: getHorizontalPadding(),
  },
  tab: {
    paddingVertical: scale(12),
    paddingHorizontal: scale(8),
    marginRight: scale(16),
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
  },
  tabText: {
    fontFamily: FontFamily?.monasans?.semiBold ?? 'System',
    fontSize: getResponsiveFontSize('small'),
  },
  badge: {
    paddingHorizontal: scale(6),
    paddingVertical: scale(2),
    borderRadius: scale(10),
  },
  badgeText: {
    fontFamily: FontFamily?.monasans?.semiBold ?? 'System',
    fontSize: getResponsiveFontSize('xsmall'),
  },
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
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
  },
  overdueBadge: {
    paddingHorizontal: scale(6),
    paddingVertical: scale(2),
    borderRadius: scale(4),
  },
  overdueBadgeText: {
    fontFamily: FontFamily?.monasans?.semiBold ?? 'System',
    fontSize: getResponsiveFontSize('xsmall'),
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
    marginBottom: scale(8),
  },
  expandRow: {
    marginBottom: scale(8),
  },
  expandedContent: {
    paddingTop: scale(8),
    marginTop: scale(4),
    borderTopWidth: 1,
  },
  expandedLabel: {
    fontFamily: FontFamily?.monasans?.regular ?? 'System',
    fontSize: getResponsiveFontSize('small'),
    marginBottom: scale(4),
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
