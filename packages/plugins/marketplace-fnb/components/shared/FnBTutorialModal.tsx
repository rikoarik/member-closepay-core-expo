/**
 * FnB tutorial overlay – transparent dim + spotlight (hole) + callout.
 * Shown once on first open; parent controls stepIndex and targetLayout via measureInWindow.
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scale, FontFamily, getHorizontalPadding } from '@core/config';
import { useTheme } from '@core/theme';
import { useTranslation } from '@core/i18n';

const STEP_KEYS = [
  'welcome',
  'searchScan',
  'location',
  'favorite',
  'categoryMerchant',
  'cart',
] as const;

const DIM_COLOR = 'rgba(0,0,0,0.55)';
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CALLOUT_GAP = scale(8);
const CALLOUT_MAX_WIDTH = SCREEN_WIDTH - scale(32);
const CALLOUT_MIN_HEIGHT = scale(140);

export interface TutorialTargetLayout {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface FnBTutorialModalProps {
  visible: boolean;
  stepIndex: number;
  targetLayout: TutorialTargetLayout | null;
  onComplete: () => void;
  onNext: () => void;
}

export const FnBTutorialModal: React.FC<FnBTutorialModalProps> = ({
  visible,
  stepIndex,
  targetLayout,
  onComplete,
  onNext,
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const paddingH = getHorizontalPadding();

  const totalSteps = STEP_KEYS.length;
  const isLast = stepIndex >= totalSteps - 1;
  const stepKey = STEP_KEYS[stepIndex];
  const titleKey = `fnb.tutorial${stepKey.charAt(0).toUpperCase() + stepKey.slice(1)}Title`;
  const descKey = `fnb.tutorial${stepKey.charAt(0).toUpperCase() + stepKey.slice(1)}Desc`;

  const showHole = targetLayout && targetLayout.width > 0 && targetLayout.height > 0;
  const { x, y, width, height } = targetLayout ?? { x: 0, y: 0, width: 0, height: 0 };

  // Callout position: no target = center; else below target if room, else above
  let calloutTop: number;
  if (!showHole) {
    calloutTop = (SCREEN_HEIGHT - CALLOUT_MIN_HEIGHT) / 2 - scale(40);
  } else {
    const spaceBelow = SCREEN_HEIGHT - (y + height) - insets.bottom - CALLOUT_MIN_HEIGHT;
    const calloutBelow = spaceBelow >= CALLOUT_GAP;
    calloutTop = calloutBelow ? y + height + CALLOUT_GAP : Math.max(insets.top + scale(16), y - CALLOUT_MIN_HEIGHT - CALLOUT_GAP);
  }
  const calloutLeft = paddingH;
  const calloutRight = SCREEN_WIDTH - paddingH;

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onComplete}
    >
      <View style={styles.overlay}>
        {/* Full dim layer */}
        <View style={[styles.dimLayer, { backgroundColor: DIM_COLOR }]} />

        {/* Spotlight hole: 4 strips around target */}
        {showHole && (
          <>
            <View style={[styles.strip, { top: 0, left: 0, right: 0, height: y, backgroundColor: DIM_COLOR }]} />
            <View style={[styles.strip, { top: y + height, left: 0, right: 0, bottom: 0, backgroundColor: DIM_COLOR }]} />
            <View style={[styles.strip, { top: y, left: 0, width: x, height, backgroundColor: DIM_COLOR }]} />
            <View style={[styles.strip, { top: y, left: x + width, right: 0, height, backgroundColor: DIM_COLOR }]} />
          </>
        )}

        {/* Callout card */}
        <View
          style={[
            styles.callout,
            {
              position: 'absolute',
              top: calloutTop,
              left: calloutLeft,
              right: calloutRight,
              backgroundColor: colors.surface,
              borderColor: colors.border,
              paddingBottom: insets.bottom + scale(16),
            },
          ]}
        >
          <Text style={[styles.calloutTitle, { color: colors.text }]}>{t(titleKey)}</Text>
          <Text style={[styles.calloutDesc, { color: colors.textSecondary }]}>{t(descKey)}</Text>
          <View style={styles.dots}>
            {STEP_KEYS.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  {
                    backgroundColor: i === stepIndex ? colors.primary : colors.border,
                    width: i === stepIndex ? scale(20) : scale(8),
                  },
                ]}
              />
            ))}
          </View>
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.skipBtn, { borderColor: colors.border }]}
              onPress={onComplete}
            >
              <Text style={[styles.skipBtnText, { color: colors.textSecondary }]}>
                {t('fnb.tutorialSkip')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.nextBtn, { backgroundColor: colors.primary }]}
              onPress={onNext}
            >
              <Text style={[styles.nextBtnText, { color: colors.surface }]}>
                {isLast ? t('fnb.tutorialDone') : t('fnb.tutorialNext')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  dimLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  strip: {
    position: 'absolute',
  },
  callout: {
    borderRadius: scale(16),
    borderWidth: 1,
    paddingHorizontal: scale(20),
    paddingTop: scale(20),
    maxWidth: CALLOUT_MAX_WIDTH,
    alignSelf: 'center',
  },
  calloutTitle: {
    fontFamily: FontFamily.monasans.bold,
    fontSize: scale(17),
    marginBottom: scale(8),
  },
  calloutDesc: {
    fontFamily: FontFamily.monasans.regular,
    fontSize: scale(14),
    lineHeight: scale(22),
    marginBottom: scale(16),
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(6),
    marginBottom: scale(16),
  },
  dot: {
    height: scale(8),
    borderRadius: scale(4),
  },
  actions: {
    flexDirection: 'row',
    gap: scale(12),
  },
  skipBtn: {
    flex: 1,
    paddingVertical: scale(12),
    borderRadius: scale(12),
    borderWidth: 1,
    alignItems: 'center',
  },
  skipBtnText: {
    fontFamily: FontFamily.monasans.semiBold,
    fontSize: scale(14),
  },
  nextBtn: {
    flex: 1,
    paddingVertical: scale(12),
    borderRadius: scale(12),
    alignItems: 'center',
  },
  nextBtnText: {
    fontFamily: FontFamily.monasans.semiBold,
    fontSize: scale(14),
  },
});
