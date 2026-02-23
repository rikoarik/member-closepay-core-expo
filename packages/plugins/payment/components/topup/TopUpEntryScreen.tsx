/**
 * Top Up Entry Screen
 * Router berdasarkan config topUpVAMode: open (langsung VA), close (input nominal), atau both (pilihan).
 */
import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@core/theme';
import { useTranslation } from '@core/i18n';
import { ArrowLeft2, Wallet, Edit2 } from 'iconsax-react-nativejs';
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

type TopUpVAMode = 'open' | 'close' | 'both';

export const TopUpEntryScreen = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { t } = useTranslation();

  const manifest = PluginRegistry.getPlugin('payment');
  const topUpVAMode: TopUpVAMode =
    (manifest?.config?.topUpVAMode as TopUpVAMode) ?? 'both';

  useEffect(() => {
    if (topUpVAMode === 'open') {
      (navigation as any).replace('TopUpDirect', {});
      return;
    }
    if (topUpVAMode === 'close') {
      (navigation as any).replace('TopUpClose', {});
      return;
    }
  }, [topUpVAMode, navigation]);

  const handleOpen = () => {
    (navigation as any).navigate('TopUpDirect', {});
  };

  const handleClose = () => {
    (navigation as any).navigate('TopUpClose', {});
  };

  if (topUpVAMode === 'open' || topUpVAMode === 'close') {
    return null;
  }

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
          {t('home.topUp')}
        </Text>
        <View style={styles.headerRight} />
      </View>

      <View style={[styles.content, { paddingHorizontal: horizontalPadding }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {t('virtualAccount.topUpWithVAThrough')}
        </Text>

        <TouchableOpacity
          style={[styles.optionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={handleClose}
          activeOpacity={0.7}
        >
          <View style={[styles.optionIconWrap, { backgroundColor: colors.primary + '20' }]}>
            <Edit2 size={getIconSize('large')} color={colors.primary} variant="Outline" />
          </View>
          <View style={styles.optionTextWrap}>
            <Text style={[styles.optionTitle, { color: colors.text }]}>
              {t('topUp.enterAmount')}
            </Text>
            <Text style={[styles.optionDesc, { color: colors.textSecondary }]}>
              {t('topUp.enterAmountDescription')}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.optionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={handleOpen}
          activeOpacity={0.7}
        >
          <View style={[styles.optionIconWrap, { backgroundColor: colors.primary + '20' }]}>
            <Wallet size={getIconSize('large')} color={colors.primary} variant="Outline" />
          </View>
          <View style={styles.optionTextWrap}>
            <Text style={[styles.optionTitle, { color: colors.text }]}>
              {t('topUp.directVA')}
            </Text>
            <Text style={[styles.optionDesc, { color: colors.textSecondary }]}>
              {t('topUp.directVADescription')}
            </Text>
          </View>
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
  content: {
    flex: 1,
    paddingTop: moderateVerticalScale(24),
  },
  sectionTitle: {
    fontSize: moderateScale(18),
    fontFamily: FontFamily.monasans.semiBold,
    marginBottom: moderateVerticalScale(20),
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: scale(16),
    borderRadius: scale(12),
    borderWidth: 1,
    marginBottom: moderateVerticalScale(12),
  },
  optionIconWrap: {
    width: scale(48),
    height: scale(48),
    borderRadius: scale(24),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(16),
  },
  optionTextWrap: { flex: 1 },
  optionTitle: {
    fontSize: getResponsiveFontSize('medium'),
    fontFamily: FontFamily.monasans.semiBold,
  },
  optionDesc: {
    fontSize: moderateScale(12),
    fontFamily: FontFamily.monasans.regular,
    marginTop: 2,
  },
});

export default TopUpEntryScreen;
