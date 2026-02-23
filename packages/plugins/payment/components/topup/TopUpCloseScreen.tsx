/**
 * Top Up Close Screen
 * Input nominal + pilih bank VA (radio) → navigate ke VirtualAccount dengan amount.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@core/theme';
import { useTranslation } from '@core/i18n';
import { ArrowLeft2 } from 'iconsax-react-nativejs';
import {
  scale,
  moderateScale,
  moderateVerticalScale,
  getHorizontalPadding,
  getMinTouchTarget,
  getResponsiveFontSize,
  getIconSize,
  FontFamily,
} from '@core/config';
import { PluginRegistry } from '@core/config';

interface BankVA {
  id: string;
  name: string;
  shortName: string;
  color: string;
}

const BANKS: BankVA[] = [
  { id: 'bsi', name: 'Bank Syariah Indonesia', shortName: 'BSI', color: '#076535' },
  { id: 'bca', name: 'Bank Central Asia', shortName: 'BCA', color: '#0066AE' },
  { id: 'bni', name: 'BNI', shortName: 'BNI', color: '#F26522' },
  { id: 'mandiri', name: 'Bank Mandiri', shortName: 'Mandiri', color: '#003D79' },
  { id: 'bri', name: 'BRI', shortName: 'BRI', color: '#003A70' },
];

const QUICK_AMOUNTS = [50000, 100000, 200000, 500000, 1000000, 2000000];

export const TopUpCloseScreen = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const manifest = PluginRegistry.getPlugin('payment');
  const minTopUp = (manifest?.config?.minTopUp as number) ?? 10000;
  const maxTopUp = (manifest?.config?.maxTopUp as number) ?? 10000000;

  const [amount, setAmount] = useState('');
  const [selectedBankId, setSelectedBankId] = useState<string | null>(null);
  const [selectedQuickAmount, setSelectedQuickAmount] = useState<number | null>(null);

  const formatCurrency = (value: string): string => {
    const numericValue = value.replace(/\D/g, '');
    if (!numericValue) return '';
    return parseInt(numericValue, 10).toLocaleString('id-ID');
  };

  const handleAmountChange = (text: string) => {
    const numericValue = text.replace(/\D/g, '');
    setAmount(numericValue);
    setSelectedQuickAmount(null);
  };

  const handleQuickAmount = (quickAmount: number) => {
    setAmount(quickAmount.toString());
    setSelectedQuickAmount(quickAmount);
  };

  const numericAmount = parseInt(amount.replace(/\D/g, ''), 10) || 0;
  const displayAmount = numericAmount > 0 ? formatCurrency(amount) : '';
  const isValidAmount = numericAmount >= minTopUp && numericAmount <= maxTopUp;
  const canSubmit = isValidAmount && selectedBankId != null;

  const handleNext = () => {
    if (!canSubmit || !selectedBankId) return;
    (navigation as any).navigate('VirtualAccount', {
      amount: numericAmount,
      bankId: selectedBankId,
      channel: 'mbanking',
    });
  };

  const horizontalPadding = getHorizontalPadding();
  const minTouchTarget = getMinTouchTarget();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <ArrowLeft2 size={getIconSize('medium')} color={colors.text} variant="Outline" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {t('balance.fillBalance')}
        </Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: horizontalPadding, paddingBottom: insets.bottom + moderateVerticalScale(100) },
        ]}
      >
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>{t('topUp.amount')}</Text>
          <View
            style={[
              styles.amountContainer,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.currencyPrefix, { color: colors.text }]}>Rp</Text>
            <TextInput
              style={[styles.amountInput, { color: colors.text }]}
              value={displayAmount}
              onChangeText={handleAmountChange}
              placeholder="0"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
              selectTextOnFocus
            />
          </View>
          <Text style={[styles.quickAccessLabel, { color: colors.textSecondary }]}>
            {t('topUp.quickAccess')}
          </Text>
          <View style={styles.quickAccessContainer}>
            {QUICK_AMOUNTS.map((quickAmount) => (
              <TouchableOpacity
                key={quickAmount}
                style={[
                  styles.quickAccessButton,
                  {
                    backgroundColor:
                      selectedQuickAmount === quickAmount ? colors.primary : colors.surface,
                    borderColor:
                      selectedQuickAmount === quickAmount ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => handleQuickAmount(quickAmount)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.quickAccessButtonText,
                    {
                      color:
                        selectedQuickAmount === quickAmount ? colors.surface : colors.text,
                    },
                  ]}
                >
                  Rp {formatCurrency(quickAmount.toString())}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('topUp.paymentMethod')}
          </Text>
          {BANKS.map((bank) => (
            <TouchableOpacity
              key={bank.id}
              style={[
                styles.bankRow,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
              onPress={() => setSelectedBankId(bank.id)}
              activeOpacity={0.7}
            >
              <View style={[styles.radioOuter, { borderColor: colors.primary }]}>
                {selectedBankId === bank.id ? (
                  <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />
                ) : null}
              </View>
              <View style={[styles.bankLogo, { backgroundColor: bank.color }]}>
                <Text style={styles.bankLogoText}>{bank.shortName}</Text>
              </View>
              <Text style={[styles.bankName, { color: colors.text }]}>{bank.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
            paddingBottom: insets.bottom + moderateVerticalScale(16),
            paddingHorizontal: horizontalPadding,
          },
        ]}
      >
        <View style={styles.footerRow}>
          <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>
            {t('topUp.total')}
          </Text>
          <Text style={[styles.totalValue, { color: colors.text }]}>
            Rp {numericAmount > 0 ? formatCurrency(amount) : '0'}
          </Text>
        </View>
        <TouchableOpacity
          style={[
            styles.nextButton,
            {
              backgroundColor: canSubmit ? colors.primary : colors.border,
              opacity: canSubmit ? 1 : 0.6,
            },
          ]}
          onPress={handleNext}
          disabled={!canSubmit}
          activeOpacity={0.8}
        >
          <Text style={[styles.nextButtonText, { color: colors.surface }]}>
            {t('common.next')}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: getHorizontalPadding(),
    paddingBottom: moderateVerticalScale(12),
  },
  backButton: {
    padding: moderateVerticalScale(8),
    minWidth: getMinTouchTarget(),
    minHeight: getMinTouchTarget(),
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: getResponsiveFontSize('large'),
    fontFamily: FontFamily.monasans.semiBold,
    flex: 1,
  },
  headerRight: { width: getMinTouchTarget() },
  scrollView: { flex: 1 },
  scrollContent: { paddingTop: moderateVerticalScale(8) },
  section: { marginBottom: moderateVerticalScale(24) },
  label: {
    fontSize: getResponsiveFontSize('medium'),
    fontFamily: FontFamily.monasans.semiBold,
    marginBottom: moderateVerticalScale(8),
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: scale(12),
    paddingHorizontal: scale(16),
    paddingVertical: scale(14),
  },
  currencyPrefix: {
    fontSize: getResponsiveFontSize('medium'),
    fontFamily: FontFamily.monasans.medium,
    marginRight: scale(8),
  },
  amountInput: {
    flex: 1,
    fontSize: getResponsiveFontSize('medium'),
    fontFamily: FontFamily.monasans.medium,
    padding: 0,
  },
  quickAccessLabel: {
    fontSize: moderateScale(12),
    fontFamily: FontFamily.monasans.regular,
    marginTop: moderateVerticalScale(12),
    marginBottom: moderateVerticalScale(8),
  },
  quickAccessContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scale(8),
  },
  quickAccessButton: {
    paddingVertical: scale(10),
    paddingHorizontal: scale(14),
    borderRadius: scale(8),
    borderWidth: 1,
  },
  quickAccessButtonText: {
    fontSize: moderateScale(13),
    fontFamily: FontFamily.monasans.medium,
  },
  sectionTitle: {
    fontSize: getResponsiveFontSize('medium'),
    fontFamily: FontFamily.monasans.semiBold,
    marginBottom: moderateVerticalScale(12),
  },
  bankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: scale(16),
    borderRadius: scale(12),
    borderWidth: 1,
    marginBottom: moderateVerticalScale(8),
  },
  radioOuter: {
    width: scale(22),
    height: scale(22),
    borderRadius: scale(11),
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(12),
  },
  radioInner: {
    width: scale(12),
    height: scale(12),
    borderRadius: scale(6),
  },
  bankLogo: {
    width: scale(40),
    height: scale(28),
    borderRadius: scale(6),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(12),
  },
  bankLogoText: {
    fontSize: moderateScale(11),
    fontFamily: FontFamily.monasans.bold,
    color: '#FFFFFF',
  },
  bankName: {
    flex: 1,
    fontSize: getResponsiveFontSize('medium'),
    fontFamily: FontFamily.monasans.medium,
  },
  footer: {
    borderTopWidth: 1,
    paddingTop: moderateVerticalScale(16),
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateVerticalScale(12),
  },
  totalLabel: {
    fontSize: getResponsiveFontSize('medium'),
    fontFamily: FontFamily.monasans.medium,
  },
  totalValue: {
    fontSize: getResponsiveFontSize('large'),
    fontFamily: FontFamily.monasans.semiBold,
  },
  nextButton: {
    paddingVertical: moderateVerticalScale(14),
    borderRadius: scale(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonText: {
    fontSize: getResponsiveFontSize('medium'),
    fontFamily: FontFamily.monasans.semiBold,
  },
});

export default TopUpCloseScreen;
