/**
 * PaymentMethodSelectionScreen
 * Halaman pemilihan metode pembayaran checkout (tanpa bottom sheet)
 */

import React, { useMemo, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Animated,
  Easing,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Wallet3, Bank, TickCircle, Card, ArrowDown2, ArrowUp2 } from 'iconsax-react-nativejs';
import { scale, moderateVerticalScale, getHorizontalPadding, FontFamily, ScreenHeader } from '@core/config';
import { useTheme } from '@core/theme';
import { useTranslation } from '@core/i18n';
import { DEFAULT_INSTALLMENT_CONFIG } from '../../services/installmentApiService';
import type { InstallmentSelection } from '../../models/MarketplaceInstallment';

type PaymentMethodOption = 'balance' | 'va' | 'installment';

type VABankOption = {
  code: string;
  name: string;
  fee: number;
};

type PaymentSelectionResult = {
  paymentMethod: PaymentMethodOption;
  vaBankCode?: string;
  vaBankName?: string;
  installmentSelection?: InstallmentSelection | null;
};

type RouteParams = {
  MarketplacePaymentMethod: {
    selectedPaymentMethod?: PaymentMethodOption;
    selectedVABankCode?: string;
    availableBalance?: number;
    totalAmount?: number;
    installmentPreview?: InstallmentSelection | null;
    onSelect?: (selection: PaymentSelectionResult) => void;
  };
};

const formatPrice = (price: number): string => `Rp ${price.toLocaleString('id-ID')}`;

const VA_BANK_OPTIONS: VABankOption[] = [
  { code: 'bca', name: 'BCA Virtual Account', fee: 4000 },
  { code: 'bni', name: 'BNI Virtual Account', fee: 4000 },
  { code: 'bri', name: 'BRI Virtual Account', fee: 4000 },
  { code: 'mandiri', name: 'Mandiri Virtual Account', fee: 4000 },
];

export const PaymentMethodSelectionScreen: React.FC = () => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RouteParams, 'MarketplacePaymentMethod'>>();
  const insets = useSafeAreaInsets();
  const paddingH = getHorizontalPadding();

  const params = route.params;
  const availableBalance = params?.availableBalance ?? 0;
  const totalAmount = params?.totalAmount ?? 0;
  const installmentPreview = params?.installmentPreview ?? null;
  const initialMethod: PaymentMethodOption = params?.selectedPaymentMethod ?? 'balance';

  const selectedInstallmentMode = useMemo(() => {
    const modes = DEFAULT_INSTALLMENT_CONFIG.modes ?? [];
    if (!modes.length) return null;
    if (DEFAULT_INSTALLMENT_CONFIG.defaultModeId) {
      const defaultMode = modes.find((mode) => mode.id === DEFAULT_INSTALLMENT_CONFIG.defaultModeId);
      if (defaultMode) return defaultMode;
    }
    return modes[0];
  }, []);

  const installmentCountOptions = useMemo(() => {
    if (DEFAULT_INSTALLMENT_CONFIG.hasTenor && DEFAULT_INSTALLMENT_CONFIG.tenorOptions?.length) {
      return DEFAULT_INSTALLMENT_CONFIG.tenorOptions;
    }

    const step = DEFAULT_INSTALLMENT_CONFIG.installmentStep ?? 2;
    const maxCount = Math.min(DEFAULT_INSTALLMENT_CONFIG.maxInstallmentCount ?? 72, 36);
    const options: number[] = [];
    for (let count = step; count <= maxCount; count += step) {
      options.push(count);
    }
    return options;
  }, []);

  const fallbackInstallmentCount = installmentCountOptions[0] ?? 1;
  const minDpPercent = selectedInstallmentMode?.allowZeroDp
    ? 0
    : selectedInstallmentMode?.minDpPercent ?? DEFAULT_INSTALLMENT_CONFIG.minDpPercent ?? 20;
  const minDownPayment = useMemo(
    () => Math.ceil((totalAmount * minDpPercent) / 100),
    [totalAmount, minDpPercent]
  );

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodOption>(initialMethod);
  const [selectedBankCode, setSelectedBankCode] = useState<string | null>(
    params?.selectedVABankCode ?? null
  );
  const [expandedSection, setExpandedSection] = useState<'va' | 'installment' | null>(() => {
    if (initialMethod === 'va') return 'va';
    if (initialMethod === 'installment') return 'installment';
    return null;
  });
  const [downPaymentInput, setDownPaymentInput] = useState<string>(() => {
    const initialDp = installmentPreview?.downPayment ?? minDownPayment;
    return String(Math.max(0, initialDp));
  });
  const [installmentCount, setInstallmentCount] = useState<number>(() => {
    const initialCount = installmentPreview?.installmentCount ?? fallbackInstallmentCount;
    return installmentCountOptions.includes(initialCount) ? initialCount : fallbackInstallmentCount;
  });

  const vaExpandAnim = useRef(new Animated.Value(initialMethod === 'va' ? 1 : 0)).current;
  const installmentExpandAnim = useRef(
    new Animated.Value(initialMethod === 'installment' ? 1 : 0)
  ).current;

  const selectedBank = useMemo(
    () => VA_BANK_OPTIONS.find((bank) => bank.code === selectedBankCode) ?? null,
    [selectedBankCode]
  );
  const downPaymentValue = useMemo(() => {
    const parsed = parseInt(downPaymentInput.replace(/\D/g, ''), 10);
    return Number.isNaN(parsed) ? 0 : parsed;
  }, [downPaymentInput]);

  const installmentSelection = useMemo<InstallmentSelection | null>(() => {
    if (totalAmount <= 0 || installmentCount <= 0) return null;
    if (!selectedInstallmentMode?.allowZeroDp && downPaymentValue < minDownPayment) return null;
    if (downPaymentValue >= totalAmount) return null;

    const remaining = Math.max(0, totalAmount - downPaymentValue);
    const interestRatePerMonth =
      selectedInstallmentMode?.interestRatePerMonth ?? DEFAULT_INSTALLMENT_CONFIG.interestRatePerMonth ?? 0;
    const totalInterest = remaining * interestRatePerMonth * installmentCount;
    const monthlyAmount = Math.ceil((remaining + totalInterest) / installmentCount);
    const totalPayment = downPaymentValue + remaining + totalInterest;

    return {
      modeId: selectedInstallmentMode?.id ?? DEFAULT_INSTALLMENT_CONFIG.defaultModeId,
      downPayment: downPaymentValue,
      installmentCount,
      monthlyAmount,
      totalInterest,
      totalPayment,
      interestRatePerMonth,
    };
  }, [
    totalAmount,
    installmentCount,
    selectedInstallmentMode?.allowZeroDp,
    selectedInstallmentMode?.interestRatePerMonth,
    selectedInstallmentMode?.id,
    downPaymentValue,
    minDownPayment,
  ]);

  const hasEnoughBalance = availableBalance >= totalAmount;

  const runExpandAnimation = useCallback(
    (expanded: 'va' | 'installment' | null) => {
      Animated.parallel([
        Animated.timing(vaExpandAnim, {
          toValue: expanded === 'va' ? 1 : 0,
          duration: 260,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(installmentExpandAnim, {
          toValue: expanded === 'installment' ? 1 : 0,
          duration: 260,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
      ]).start();
    },
    [vaExpandAnim, installmentExpandAnim]
  );

  const handleApply = useCallback(() => {
    if (selectedMethod === 'va' && !selectedBank) {
      Alert.alert(t('common.error') || 'Error', t('marketplace.selectPayment') || 'Pilih bank VA dulu.');
      return;
    }
    if (selectedMethod === 'installment' && !installmentSelection) {
      Alert.alert(
        t('common.error') || 'Error',
        `DP minimal ${formatPrice(minDownPayment)} dan harus kurang dari total belanja.`
      );
      return;
    }

    params?.onSelect?.({
      paymentMethod: selectedMethod,
      vaBankCode: selectedBank?.code,
      vaBankName: selectedBank?.name,
      installmentSelection: selectedMethod === 'installment' ? installmentSelection : null,
    });
    navigation.goBack();
  }, [selectedMethod, selectedBank, params, navigation, t, installmentSelection, minDownPayment]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title={t('marketplace.paymentMethod')}
        onBackPress={() => navigation.goBack()}
        style={{ paddingTop: insets.top + moderateVerticalScale(8), backgroundColor: colors.surface }}
        paddingHorizontal={paddingH}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: paddingH }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {t('marketplace.paymentMethod')}
        </Text>

        <TouchableOpacity
          style={[
            styles.optionCard,
            styles.optionCardStandalone,
            {
              borderColor: selectedMethod === 'balance' ? colors.primary : colors.border,
              backgroundColor: colors.surface,
            },
          ]}
          onPress={() => {
            setSelectedMethod('balance');
            setExpandedSection(null);
            runExpandAnimation(null);
          }}
          activeOpacity={0.8}
        >
          <View style={[styles.iconWrap, { borderColor: colors.border, backgroundColor: colors.background }]}>
            <Wallet3 size={scale(18)} color={selectedMethod === 'balance' ? colors.primary : colors.textSecondary} variant={selectedMethod === 'balance' ? 'Bold' : 'Linear'} />
          </View>
          <View style={styles.optionTextWrap}>
            <Text style={[styles.optionTitle, { color: selectedMethod === 'balance' ? colors.primary : colors.text }]}>
              {t('marketplace.paymentBalance')}
            </Text>
            <Text style={[styles.optionMeta, { color: colors.textSecondary }]}>{t('marketplace.paymentBalanceDesc') || 'Bayar instan dari saldo akun'}</Text>
            <View style={styles.balanceMetaRow}>
              <View style={[styles.balanceAmountPill, { backgroundColor: colors.primaryLight }]}>
                <Text style={[styles.balanceAmountLabel, { color: colors.textSecondary }]}>
                  {t('marketplace.availableBalance') || 'Saldo tersedia'}
                </Text>
                <Text style={[styles.balanceAmountValue, { color: colors.primary }]}>
                  {formatPrice(availableBalance)}
                </Text>
              </View>
              <View
                style={[
                  styles.balanceStatusPill,
                  { backgroundColor: hasEnoughBalance ? colors.successLight : colors.warningLight },
                ]}
              >
                <Text
                  style={[
                    styles.balanceStatusText,
                    { color: hasEnoughBalance ? colors.success : colors.warning },
                  ]}
                >
                  {hasEnoughBalance ? 'Saldo Cukup' : 'Saldo Kurang'}
                </Text>
              </View>
            </View>
          </View>
          {selectedMethod === 'balance' && <TickCircle size={scale(20)} color={colors.primary} variant="Bold" />}
        </TouchableOpacity>

        <View style={styles.optionGroup}>
          <TouchableOpacity
            style={[
              styles.optionCard,
              {
                borderColor: selectedMethod === 'va' ? colors.primary : colors.border,
                backgroundColor: colors.surface,
              },
            ]}
            onPress={() => {
              const nextExpanded = expandedSection === 'va' ? null : 'va';
              setSelectedMethod('va');
              setExpandedSection(nextExpanded);
              runExpandAnimation(nextExpanded);
            }}
            activeOpacity={0.8}
          >
            <View style={[styles.iconWrap, { borderColor: colors.border, backgroundColor: colors.background }]}>
              <Bank size={scale(18)} color={selectedMethod === 'va' ? colors.primary : colors.textSecondary} variant={selectedMethod === 'va' ? 'Bold' : 'Linear'} />
            </View>
            <View style={styles.optionTextWrap}>
              <Text style={[styles.optionTitle, { color: selectedMethod === 'va' ? colors.primary : colors.text }]}>
                {t('marketplace.paymentVa')}
              </Text>
              <Text style={[styles.optionMeta, { color: colors.textSecondary }]}>
                {selectedBank
                  ? `${selectedBank.name} · Admin ${formatPrice(selectedBank.fee)}`
                  : 'Pilih bank VA dulu sebelum lanjut checkout'}
              </Text>
            </View>
            <View style={styles.optionActions}>
              {selectedMethod === 'va' && <TickCircle size={scale(18)} color={colors.primary} variant="Bold" />}
              {expandedSection === 'va' ? (
                <ArrowUp2 size={scale(18)} color={colors.textSecondary} variant="Linear" />
              ) : (
                <ArrowDown2 size={scale(18)} color={colors.textSecondary} variant="Linear" />
              )}
            </View>
          </TouchableOpacity>

          <Animated.View
            style={[
              styles.expandWrap,
              {
                maxHeight: vaExpandAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, scale(360)],
                }),
                opacity: vaExpandAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 1],
                }),
                transform: [
                  {
                    translateY: vaExpandAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-scale(6), 0],
                    }),
                  },
                ],
              },
            ]}
            pointerEvents={expandedSection === 'va' ? 'auto' : 'none'}
          >
            <View style={[styles.bankSection, { borderColor: colors.border, backgroundColor: colors.surface }]}>
              <Text style={[styles.bankSectionTitle, { color: colors.text }]}>{t('marketplace.selectVaBank')}</Text>
              {VA_BANK_OPTIONS.map((bank) => {
                const selected = selectedBankCode === bank.code;
                return (
                  <TouchableOpacity
                    key={bank.code}
                    style={[
                      styles.bankRow,
                      {
                        borderColor: selected ? colors.primary : colors.border,
                        backgroundColor: selected ? colors.primaryLight : colors.background,
                      },
                    ]}
                    onPress={() => setSelectedBankCode(bank.code)}
                    activeOpacity={0.75}
                  >
                    <View style={styles.bankTextWrap}>
                      <Text style={[styles.bankName, { color: selected ? colors.primary : colors.text }]}>
                        {bank.name}
                      </Text>
                      <Text style={[styles.bankMeta, { color: colors.textSecondary }]}>{t('marketplace.adminFee')} {formatPrice(bank.fee)}</Text>
                    </View>
                    {selected && <TickCircle size={scale(18)} color={colors.primary} variant="Bold" />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </Animated.View>
        </View>

        <View style={styles.optionGroup}>
          <TouchableOpacity
            style={[
              styles.optionCard,
              {
                borderColor: selectedMethod === 'installment' ? colors.primary : colors.border,
                backgroundColor: colors.surface,
              },
            ]}
            onPress={() => {
              const nextExpanded = expandedSection === 'installment' ? null : 'installment';
              setSelectedMethod('installment');
              setExpandedSection(nextExpanded);
              runExpandAnimation(nextExpanded);
            }}
            activeOpacity={0.8}
          >
            <View style={[styles.iconWrap, { borderColor: colors.border, backgroundColor: colors.background }]}>
              <Card size={scale(18)} color={selectedMethod === 'installment' ? colors.primary : colors.textSecondary} variant={selectedMethod === 'installment' ? 'Bold' : 'Linear'} />
            </View>
            <View style={styles.optionTextWrap}>
              <Text style={[styles.optionTitle, { color: selectedMethod === 'installment' ? colors.primary : colors.text }]}>
                {t('marketplace.bayarCicilan')}
              </Text>
              <Text style={[styles.optionMeta, { color: colors.textSecondary }]}>{t('marketplace.configureInstallmentHint')}</Text>
            </View>
            <View style={styles.optionActions}>
              {selectedMethod === 'installment' && <TickCircle size={scale(18)} color={colors.primary} variant="Bold" />}
              {expandedSection === 'installment' ? (
                <ArrowUp2 size={scale(18)} color={colors.textSecondary} variant="Linear" />
              ) : (
                <ArrowDown2 size={scale(18)} color={colors.textSecondary} variant="Linear" />
              )}
            </View>
          </TouchableOpacity>

          <Animated.View
            style={[
              styles.expandWrap,
              {
                maxHeight: installmentExpandAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, scale(620)],
                }),
                opacity: installmentExpandAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 1],
                }),
                transform: [
                  {
                    translateY: installmentExpandAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-scale(6), 0],
                    }),
                  },
                ],
              },
            ]}
            pointerEvents={expandedSection === 'installment' ? 'auto' : 'none'}
          >
            <View style={[styles.bankSection, { borderColor: colors.border, backgroundColor: colors.surface }]}>
              <Text style={[styles.bankSectionTitle, { color: colors.text }]}>{t('marketplace.configureInstallment')}</Text>

              <Text style={[styles.installmentSectionLabel, { color: colors.text }]}>{t('marketplace.uangMuka')}</Text>
              <Text style={[styles.installmentHint, { color: colors.textSecondary }]}>{t('marketplace.minDpPercent', { percent: minDpPercent })}</Text>
              <TextInput
                style={[
                  styles.installmentInput,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.background,
                    color: colors.text,
                  },
                ]}
                value={downPaymentInput}
                onChangeText={(text) => setDownPaymentInput(text.replace(/\D/g, ''))}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor={colors.textSecondary}
              />

              <Text style={[styles.installmentSectionLabel, { color: colors.text }]}>{t('marketplace.installmentCountLabel')}</Text>
              <View style={styles.installmentChipRow}>
                {installmentCountOptions.map((count) => {
                  const selected = installmentCount === count;
                  return (
                    <TouchableOpacity
                      key={count}
                      style={[
                        styles.installmentChip,
                        {
                          borderColor: selected ? colors.primary : colors.border,
                          backgroundColor: selected ? colors.primaryLight : colors.background,
                        },
                      ]}
                      onPress={() => setInstallmentCount(count)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.installmentChipText, { color: selected ? colors.primary : colors.text }]}>{count}x</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={[styles.summaryBlock, { borderColor: colors.border }]}>
                <View style={styles.previewRow}>
                  <Text style={[styles.previewLabel, { color: colors.textSecondary }]}>DP</Text>
                  <Text style={[styles.previewValue, { color: colors.text }]}>{formatPrice(downPaymentValue)}</Text>
                </View>
                <View style={styles.previewRow}>
                  <Text style={[styles.previewLabel, { color: colors.textSecondary }]}>{t('marketplace.installmentCount')}</Text>
                  <Text style={[styles.previewValue, { color: colors.text }]}>{installmentCount}x</Text>
                </View>
                <View style={styles.previewRow}>
                  <Text style={[styles.previewLabel, { color: colors.textSecondary }]}>{t('marketplace.perInstallment')}</Text>
                  <Text style={[styles.previewValue, { color: colors.text }]}>
                    {installmentSelection ? formatPrice(installmentSelection.monthlyAmount) : '-'}
                  </Text>
                </View>
                {installmentSelection?.totalInterest ? (
                  <View style={styles.previewRow}>
                    <Text style={[styles.previewLabel, { color: colors.textSecondary }]}>{t('marketplace.interest')}</Text>
                    <Text style={[styles.previewValue, { color: colors.text }]}>
                      {formatPrice(installmentSelection.totalInterest)}
                    </Text>
                  </View>
                ) : null}
                <View style={[styles.previewRow, styles.previewTotalRow, { borderTopColor: colors.border }]}>
                  <Text style={[styles.previewLabel, { color: colors.text }]}>{t('marketplace.totalPayment')}</Text>
                  <Text style={[styles.previewValue, { color: colors.primary }]}>
                    {installmentSelection ? formatPrice(installmentSelection.totalPayment) : '-'}
                  </Text>
                </View>
              </View>

              {!installmentSelection && (
                <Text style={[styles.installmentErrorText, { color: colors.warning }]}>{t('marketplace.installmentDpError', { min: formatPrice(minDownPayment) })}</Text>
              )}
            </View>
          </Animated.View>
        </View>
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            paddingHorizontal: paddingH,
            paddingBottom: insets.bottom + moderateVerticalScale(12),
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.applyButton, { backgroundColor: colors.primary }]}
          onPress={handleApply}
          activeOpacity={0.85}
        >
          <Text style={styles.applyButtonText}>{t('common.confirm') || 'Pakai Metode Ini'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: {
    paddingTop: moderateVerticalScale(16),
    paddingBottom: moderateVerticalScale(16),
  },
  sectionTitle: {
    fontSize: scale(16),
    fontFamily: FontFamily.monasans.bold,
    marginBottom: scale(10),
  },
  optionCard: {
    borderWidth: 1.5,
    borderRadius: scale(12),
    paddingHorizontal: scale(12),
    paddingVertical: scale(12),
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionCardStandalone: { marginBottom: scale(10) },
  optionGroup: {
    marginBottom: scale(10),
  },
  expandWrap: {
    overflow: 'hidden',
  },
  iconWrap: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scale(10),
  },
  optionTextWrap: { flex: 1 },
  optionActions: {
    marginLeft: scale(8),
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
  },
  optionTitle: {
    fontSize: scale(14),
    fontFamily: FontFamily.monasans.semiBold,
  },
  optionMeta: {
    fontSize: scale(12),
    fontFamily: FontFamily.monasans.regular,
    marginTop: scale(2),
  },
  balanceMetaRow: {
    marginTop: scale(8),
    flexDirection: 'row',
    gap: scale(8),
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  balanceAmountPill: {
    borderRadius: scale(10),
    paddingHorizontal: scale(10),
    paddingVertical: scale(8),
    minWidth: scale(160),
  },
  balanceAmountLabel: {
    fontSize: scale(11),
    fontFamily: FontFamily.monasans.regular,
    marginBottom: scale(2),
  },
  balanceAmountValue: {
    fontSize: scale(13),
    fontFamily: FontFamily.monasans.bold,
  },
  balanceStatusPill: {
    borderRadius: scale(999),
    paddingHorizontal: scale(10),
    paddingVertical: scale(6),
  },
  balanceStatusText: {
    fontSize: scale(11),
    fontFamily: FontFamily.monasans.semiBold,
  },
  bankSection: {
    borderWidth: 1,
    borderRadius: scale(12),
    padding: scale(12),
    marginTop: scale(6),
  },
  bankSectionTitle: {
    fontSize: scale(14),
    fontFamily: FontFamily.monasans.semiBold,
    marginBottom: scale(8),
  },
  bankRow: {
    borderWidth: 1,
    borderRadius: scale(10),
    paddingHorizontal: scale(12),
    paddingVertical: scale(10),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: scale(8),
  },
  bankTextWrap: { flex: 1, marginRight: scale(8) },
  bankName: {
    fontSize: scale(13),
    fontFamily: FontFamily.monasans.semiBold,
  },
  bankMeta: {
    fontSize: scale(12),
    fontFamily: FontFamily.monasans.regular,
    marginTop: scale(2),
  },
  installmentSectionLabel: {
    fontSize: scale(13),
    fontFamily: FontFamily.monasans.semiBold,
    marginBottom: scale(4),
  },
  installmentHint: {
    fontSize: scale(12),
    fontFamily: FontFamily.monasans.regular,
    marginBottom: scale(8),
  },
  installmentInput: {
    borderWidth: 1,
    borderRadius: scale(10),
    paddingHorizontal: scale(12),
    paddingVertical: scale(10),
    fontSize: scale(14),
    fontFamily: FontFamily.monasans.regular,
    marginBottom: scale(12),
  },
  installmentChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scale(8),
    marginBottom: scale(12),
  },
  installmentChip: {
    borderWidth: 1,
    borderRadius: scale(999),
    paddingHorizontal: scale(12),
    paddingVertical: scale(8),
  },
  installmentChipText: {
    fontSize: scale(13),
    fontFamily: FontFamily.monasans.semiBold,
  },
  summaryBlock: {
    borderWidth: 1,
    borderRadius: scale(10),
    padding: scale(10),
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: scale(6),
  },
  previewLabel: {
    fontSize: scale(13),
    fontFamily: FontFamily.monasans.regular,
  },
  previewValue: {
    fontSize: scale(13),
    fontFamily: FontFamily.monasans.semiBold,
  },
  previewTotalRow: {
    marginTop: scale(6),
    paddingTop: scale(8),
    borderTopWidth: 1,
  },
  installmentErrorText: {
    marginTop: scale(8),
    fontSize: scale(12),
    fontFamily: FontFamily.monasans.regular,
  },
  footer: {
    borderTopWidth: 1,
    paddingTop: moderateVerticalScale(12),
  },
  applyButton: {
    borderRadius: scale(12),
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: moderateVerticalScale(14),
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: scale(16),
    fontFamily: FontFamily.monasans.bold,
  },
});

export default PaymentMethodSelectionScreen;
