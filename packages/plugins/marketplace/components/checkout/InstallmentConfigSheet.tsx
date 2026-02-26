/**
 * InstallmentConfigSheet
 * Bottom sheet konfigurasi cicilan — adaptif dari config backend (DP, tenor/count, bunga)
 */

import React, { useMemo, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CloseCircle } from 'iconsax-react-nativejs';
import { BottomSheet, scale, getHorizontalPadding, FontFamily, getResponsiveFontSize } from '@core/config';
import { useTheme } from '@core/theme';
import { useTranslation } from '@core/i18n';
import { useInstallmentAPI } from '../../hooks/useInstallmentAPI';
import type { InstallmentSelection } from '../../models/MarketplaceInstallment';

const formatPrice = (price: number): string =>
  `Rp ${price.toLocaleString('id-ID')}`;

interface InstallmentConfigSheetProps {
  visible: boolean;
  onClose: () => void;
  totalAmount: number;
  /** Pilihan cicilan yang sudah diterapkan — dipakai untuk pre-fill saat sheet dibuka kembali */
  initialSelection?: InstallmentSelection | null;
  onApply: (selection: InstallmentSelection) => void;
}

export const InstallmentConfigSheet: React.FC<InstallmentConfigSheetProps> = ({
  visible,
  onClose,
  totalAmount,
  initialSelection,
  onApply,
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const paddingH = getHorizontalPadding();
  const { config, loadingConfig, calculate } = useInstallmentAPI();
  const fallbackMinDpPercent = config.minDpPercent ?? 20;

  const selectedMode = useMemo(() => {
    if (config.modes?.length) {
      if (config.defaultModeId) {
        const defaultMode = config.modes.find((mode) => mode.id === config.defaultModeId);
        if (defaultMode) return defaultMode;
      }
      return config.modes[0];
    }
    return {
      id: 'dp_no_interest' as const,
      label: 'DP + Cicilan (Tanpa Bunga)',
      allowZeroDp: false,
      minDpPercent: fallbackMinDpPercent,
      interestRatePerMonth: 0,
    };
  }, [config.modes, config.defaultModeId, fallbackMinDpPercent]);

  const defaultCount = useMemo(
    () => (config.hasTenor ? (config.tenorOptions?.[0] ?? 3) : (config.installmentStep ?? 2)),
    [config.hasTenor, config.tenorOptions, config.installmentStep]
  );

  const modeMinDpPercent = selectedMode?.allowZeroDp ? 0 : selectedMode?.minDpPercent ?? fallbackMinDpPercent;
  const minDp = useMemo(
    () => Math.ceil((totalAmount * modeMinDpPercent) / 100),
    [totalAmount, modeMinDpPercent]
  );
  const isZeroDpMode = selectedMode?.allowZeroDp ?? false;

  const [downPayment, setDownPayment] = useState<string>(() => (totalAmount > 0 ? String(minDp) : '0'));
  const [installmentCount, setInstallmentCount] = useState<number>(() => defaultCount);

  useEffect(() => {
    if (visible && totalAmount > 0) {
      if (initialSelection && initialSelection.downPayment >= 0 && initialSelection.installmentCount > 0) {
        setDownPayment(String(initialSelection.downPayment));
        setInstallmentCount(initialSelection.installmentCount);
      } else {
        setDownPayment(String(minDp || 0));
        setInstallmentCount(defaultCount);
      }
    }
  }, [visible, totalAmount, minDp, defaultCount, initialSelection]);

  useEffect(() => {
    if (!visible || totalAmount <= 0) return;
    if (isZeroDpMode) {
      setDownPayment('0');
      return;
    }
    setDownPayment((prev) => {
      const n = parseInt(prev.replace(/\D/g, ''), 10);
      if (isNaN(n) || n < minDp) return String(minDp);
      return String(n);
    });
  }, [visible, totalAmount, isZeroDpMode, minDp]);

  const countOptions = useMemo(() => {
    if (config.hasTenor && config.tenorOptions?.length) {
      return config.tenorOptions.map((n) => ({ value: n, label: `${n}x` }));
    }
    const max = config.maxInstallmentCount ?? 72;
    const step = config.installmentStep ?? 2;
    const opts: { value: number; label: string }[] = [];
    for (let i = step; i <= Math.min(max, 36); i += step) {
      opts.push({ value: i, label: `${i}x` });
    }
    return opts;
  }, [config.hasTenor, config.tenorOptions, config.maxInstallmentCount, config.installmentStep]);

  const dpNum = useMemo(() => {
    const n = parseInt(downPayment.replace(/\D/g, ''), 10);
    return isNaN(n) ? 0 : n;
  }, [downPayment]);
  const effectiveDp = isZeroDpMode ? 0 : dpNum;

  const preview = useMemo(() => {
    if (totalAmount <= 0 || installmentCount <= 0) return null;
    if (effectiveDp >= totalAmount) return null;
    if (!isZeroDpMode && effectiveDp < minDp) return null;
    return calculate(totalAmount, effectiveDp, installmentCount, {
      interestRatePerMonth: selectedMode?.interestRatePerMonth ?? config.interestRatePerMonth ?? 0,
    });
  }, [
    totalAmount,
    installmentCount,
    effectiveDp,
    isZeroDpMode,
    minDp,
    calculate,
    selectedMode?.interestRatePerMonth,
    config.interestRatePerMonth,
  ]);

  const isValid = preview !== null && preview.totalPayment > 0;

  const handleApply = useCallback(() => {
    if (!preview || !isValid) {
      if (!isZeroDpMode && effectiveDp < minDp) {
        Alert.alert(
          t('common.error'),
          t('marketplace.installmentMinDpError', { percent: modeMinDpPercent })
        );
      }
      return;
    }
    const selection: InstallmentSelection = {
      modeId: selectedMode?.id,
      downPayment: effectiveDp,
      installmentCount,
      monthlyAmount: preview.monthlyAmount,
      totalInterest: preview.totalInterest,
      totalPayment: preview.totalPayment,
      interestRatePerMonth: preview.interestRatePerMonth,
    };
    onApply(selection);
    onClose();
  }, [
    preview,
    isValid,
    isZeroDpMode,
    effectiveDp,
    minDp,
    modeMinDpPercent,
    selectedMode?.id,
    installmentCount,
    onApply,
    onClose,
    t,
  ]);

  const interestRate = (selectedMode?.interestRatePerMonth ?? config.interestRatePerMonth ?? 0) * 100;
  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      snapPoints={[100]}
      initialSnapPoint={0}
      panOnlyOnHandle
    >
      <View style={[styles.sheetContent, { paddingHorizontal: paddingH }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            {t('marketplace.bayarCicilan')}
          </Text>
          <TouchableOpacity
            onPress={onClose}
            hitSlop={12}
            style={[styles.closeButton, { backgroundColor: colors.border }]}
          >
            <CloseCircle size={scale(24)} color={colors.textSecondary} variant="Bold" />
          </TouchableOpacity>
        </View>

        {loadingConfig ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : (
          <>
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={[styles.totalCard, { borderColor: colors.border, backgroundColor: colors.background }]}>
                <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>
                  {t('marketplace.totalBelanja')}
                </Text>
                <Text style={[styles.totalValue, { color: colors.text }]}>
                  {formatPrice(totalAmount)}
                </Text>
              </View>

              <Text style={[styles.sectionLabel, { color: colors.text }]}>
                {t('marketplace.uangMuka')}
              </Text>
              {isZeroDpMode ? (
                <Text style={[styles.hint, { color: colors.textSecondary }]}>
                  {t('marketplace.installmentNoDpHint') || 'Mode ini tidak memerlukan DP'}
                </Text>
              ) : (
                <Text style={[styles.hint, { color: colors.textSecondary }]}>
                  {t('marketplace.minDpPercent', { percent: modeMinDpPercent })}
                </Text>
              )}
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.text,
                    opacity: isZeroDpMode ? 0.7 : 1,
                  },
                ]}
                value={isZeroDpMode ? '0' : downPayment}
                onChangeText={(text) => setDownPayment(text.replace(/\D/g, ''))}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor={colors.textSecondary}
                editable={!isZeroDpMode}
              />

              <Text style={[styles.sectionLabel, { color: colors.text }]}>
                {t('marketplace.jumlahCicilan') || 'Jumlah Cicilan'}
              </Text>
              <View style={styles.chipRow}>
                {countOptions.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: installmentCount === opt.value ? colors.primaryLight : colors.background,
                        borderColor: installmentCount === opt.value ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => setInstallmentCount(opt.value)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: installmentCount === opt.value ? colors.primary : colors.text },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {preview && (
                <>
                  <Text style={[styles.sectionLabel, { color: colors.text }]}>
                    {t('marketplace.rincian')}
                  </Text>
                  <View style={[styles.summaryBlock, { borderColor: colors.border }]}>
                    <View style={styles.summaryRow}>
                      <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                        {t('marketplace.sisaTagihan')}
                      </Text>
                      <Text style={[styles.summaryValue, { color: colors.text }]}>
                        {formatPrice(preview.remaining)}
                      </Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                        {t('marketplace.uangMuka')}
                      </Text>
                      <Text style={[styles.summaryValue, { color: colors.text }]}>
                        {formatPrice(effectiveDp)}
                      </Text>
                    </View>
                    {preview.totalInterest > 0 && (
                      <View style={styles.summaryRow}>
                        <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                          {t('marketplace.totalInterest')} ({interestRate}%)
                        </Text>
                        <Text style={[styles.summaryValue, { color: colors.text }]}>
                          {formatPrice(preview.totalInterest)}
                        </Text>
                      </View>
                    )}
                    <View style={styles.summaryRow}>
                      <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                        {t('marketplace.perCicilan')}
                      </Text>
                      <Text style={[styles.summaryValue, { color: colors.text }]}>
                        {formatPrice(preview.monthlyAmount)}
                      </Text>
                    </View>
                    <View style={[styles.summaryRow, { borderTopWidth: 1, borderTopColor: colors.border }]}>
                      <Text style={[styles.summaryLabel, { color: colors.text }]}>
                        {t('marketplace.totalPayment')}
                      </Text>
                      <Text style={[styles.summaryValue, { color: colors.primary }]}>
                        {formatPrice(preview.totalPayment)}
                      </Text>
                    </View>
                  </View>
                </>
              )}
            </ScrollView>

            <View style={[styles.footer, { paddingBottom: insets.bottom, borderTopColor: colors.border }]}>
              <TouchableOpacity
                style={[
                  styles.applyButton,
                  {
                    backgroundColor: isValid ? colors.primary : colors.border,
                    marginBottom: insets.bottom + scale(8),
                  },
                ]}
                onPress={handleApply}
                disabled={!isValid}
              >
                <Text
                  style={[
                    styles.applyButtonText,
                    { color: isValid ? '#FFF' : colors.textSecondary },
                  ]}
                >
                  {t('marketplace.terapkan')}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  sheetContent: {
    paddingTop: scale(8),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: scale(16),
  },
  closeButton: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: FontFamily?.monasans?.bold ?? 'System',
    fontSize: getResponsiveFontSize('large'),
  },
  loadingWrap: {
    paddingVertical: scale(32),
    alignItems: 'center',
  },
  scroll: { maxHeight: 500 },
  scrollContent: { paddingBottom: scale(12) },
  totalCard: {
    borderWidth: 1,
    borderRadius: scale(12),
    paddingHorizontal: scale(12),
    paddingVertical: scale(10),
    marginBottom: scale(14),
  },
  totalLabel: {
    fontFamily: FontFamily?.monasans?.regular ?? 'System',
    fontSize: getResponsiveFontSize('small'),
    marginBottom: scale(4),
  },
  totalValue: {
    fontFamily: FontFamily?.monasans?.bold ?? 'System',
    fontSize: getResponsiveFontSize('medium'),
    marginBottom: scale(16),
  },
  sectionLabel: {
    fontFamily: FontFamily?.monasans?.semiBold ?? 'System',
    fontSize: getResponsiveFontSize('small'),
    marginBottom: scale(4),
  },
  hint: {
    fontFamily: FontFamily?.monasans?.regular ?? 'System',
    fontSize: getResponsiveFontSize('small'),
    marginBottom: scale(8),
  },
  input: {
    borderWidth: 1,
    borderRadius: scale(8),
    paddingHorizontal: scale(12),
    paddingVertical: scale(12),
    fontSize: getResponsiveFontSize('medium'),
    fontFamily: FontFamily?.monasans?.regular ?? 'System',
    marginBottom: scale(16),
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scale(8),
    marginBottom: scale(16),
  },
  chip: {
    paddingHorizontal: scale(14),
    paddingVertical: scale(8),
    borderRadius: scale(20),
    borderWidth: 1,
  },
  chipText: {
    fontFamily: FontFamily?.monasans?.semiBold ?? 'System',
    fontSize: getResponsiveFontSize('small'),
  },
  summaryBlock: {
    borderWidth: 1,
    borderRadius: scale(8),
    padding: scale(12),
    marginBottom: scale(16),
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: scale(6),
  },
  summaryLabel: {
    fontFamily: FontFamily?.monasans?.regular ?? 'System',
    fontSize: getResponsiveFontSize('small'),
  },
  summaryValue: {
    fontFamily: FontFamily?.monasans?.semiBold ?? 'System',
    fontSize: getResponsiveFontSize('small'),
  },
  applyButton: {
    paddingVertical: scale(14),
    borderRadius: scale(12),
    alignItems: 'center',
  },
  footer: {
    borderTopWidth: 1,
    paddingTop: scale(12),
  },
  applyButtonText: {
    fontFamily: FontFamily?.monasans?.semiBold ?? 'System',
    fontSize: getResponsiveFontSize('medium'),
  },
});
