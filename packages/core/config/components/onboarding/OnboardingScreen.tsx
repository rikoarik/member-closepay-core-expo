/**
 * OnboardingScreen Component
 * Screen untuk first-time user experience dengan permission requests
 * Responsive untuk semua device termasuk EDC
 */
import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { useTheme } from '../../../theme';
import { useTranslation } from '../../../i18n';
import { moderateVerticalScale, moderateScale } from '../../utils/responsive';
import {
  permissionService,
  type PermissionResult,
} from '../../services/permissionService';
import { PhoneMockup } from '../phone-mockup';
import { styles } from './styles';
import type { OnboardingStep } from './types';
import { ONBOARDING_STEPS, TOTAL_STEPS } from './constants';

interface OnboardingScreenProps {
  onComplete: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({
  onComplete,
}) => {
  const { colors, isDark, setThemeMode, mode: themeMode } = useTheme();
  const { t, language, setLanguage } = useTranslation();
  const insets = useSafeAreaInsets();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(
    ONBOARDING_STEPS[0]
  );
  const [permissionStatus, setPermissionStatus] = useState<{
    notifications?: PermissionResult;
    camera?: PermissionResult;
    location?: PermissionResult;
  }>({});

  // Di web pakai lebar viewport mobile agar layout tidak terpotong (Dimensions.get = lebar browser penuh)
  const windowWidth = Dimensions.get('window').width;
  const screenWidth = Platform.OS === 'web' ? Math.min(windowWidth, 414) : windowWidth;
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const currentPageIndexRef = useRef(0);
  const pageOffset = useSharedValue(0);
  const gestureStartPage = useSharedValue(0);

  useEffect(() => {
    currentPageIndexRef.current = currentPageIndex;
  }, [currentPageIndex]);

  const getStepIndex = (step: OnboardingStep): number => {
    return ONBOARDING_STEPS.indexOf(step);
  };

  const getStepFromIndex = (index: number): OnboardingStep => {
    return ONBOARDING_STEPS[index] || ONBOARDING_STEPS[0];
  };

  // Request permission when user clicks "Aktifkan" button
  const handleActivatePermission = async () => {
    try {
      let result: PermissionResult | null = null;

      if (currentStep === 'notifications') {
        result = await permissionService.requestNotificationPermission();
        setPermissionStatus(prev => ({ ...prev, notifications: result! }));
        if (__DEV__ && result?.status !== 'granted') {
          console.log('Notification permission result:', result?.status, result?.message ?? '');
        }
      } else if (currentStep === 'camera') {
        result = await permissionService.requestCameraPermission();
        setPermissionStatus(prev => ({ ...prev, camera: result! }));
        if (__DEV__ && result?.status !== 'granted') {
          console.log('Camera permission result:', result?.status, result?.message ?? '');
        }
      } else if (currentStep === 'location') {
        result = await permissionService.requestLocationPermission();
        setPermissionStatus(prev => ({ ...prev, location: result! }));
        if (__DEV__ && result?.status !== 'granted') {
          console.log('Location permission result:', result?.status, result?.message ?? '');
        }
      }

      // After permission dialog closes, the button will automatically change 
      // to "Selanjutnya" because hasUserRespondedToPermission will return true
    } catch (error) {
      console.error('Error requesting permission:', error);
    }
  };

  // Check if user has responded to permission request (granted, denied, blocked, or unavailable)
  const hasUserRespondedToPermission = (step: OnboardingStep): boolean => {
    // Theme and language steps don't need permission
    if (step === 'theme' || step === 'language') return true;

    const terminalStatuses = ['granted', 'denied', 'blocked', 'unavailable'];
    if (step === 'notifications') {
      const status = permissionStatus.notifications?.status;
      return terminalStatuses.includes(status ?? '');
    }
    if (step === 'camera') {
      const status = permissionStatus.camera?.status;
      return terminalStatuses.includes(status ?? '');
    }
    if (step === 'location') {
      const status = permissionStatus.location?.status;
      return terminalStatuses.includes(status ?? '');
    }
    return false;
  };

  const TRANSITION_DURATION = 400;
  const transitionConfig = {
    duration: TRANSITION_DURATION,
    easing: Easing.out(Easing.cubic),
  };

  const handleNext = async () => {
    const currentIndex = getStepIndex(currentStep);

    // Check if user has responded to permission (or step doesn't need permission)
    const canProceed = hasUserRespondedToPermission(currentStep);

    if (!canProceed) {
      return;
    }

    if (currentIndex < ONBOARDING_STEPS.length - 1) {
      const nextIndex = currentIndex + 1;
      const nextStep = ONBOARDING_STEPS[nextIndex];

      pageOffset.value = withTiming(nextIndex, transitionConfig, (finished) => {
        if (finished) {
          runOnJS(setCurrentStep)(nextStep);
          runOnJS(setCurrentPageIndex)(nextIndex);
        }
      });
    } else {
      onComplete();
    }
  };

  const onSwipeEnd = useCallback(
    (targetIndex: number) => {
      const current = currentPageIndexRef.current;
      const step = getStepFromIndex(current);
      const isSwipeForward = targetIndex > current;
      const canGoForward =
        !isSwipeForward || hasUserRespondedToPermission(step);
      const clamped = Math.max(
        0,
        Math.min(
          TOTAL_STEPS - 1,
          canGoForward ? targetIndex : current
        )
      );

      pageOffset.value = withTiming(clamped, transitionConfig, (finished) => {
        if (finished) {
          runOnJS(setCurrentStep)(getStepFromIndex(clamped));
          runOnJS(setCurrentPageIndex)(clamped);
        }
      });
    },
    []
  );

  const panGesture = Gesture.Pan()
    .activeOffsetX([-15, 15])
    .onStart(() => {
      gestureStartPage.value = pageOffset.value;
    })
    .onUpdate((e) => {
      const next =
        gestureStartPage.value - e.translationX / screenWidth;
      pageOffset.value = Math.max(
        0,
        Math.min(TOTAL_STEPS - 1, next)
      );
    })
    .onEnd(() => {
      const target = Math.round(pageOffset.value);
      runOnJS(onSwipeEnd)(target);
    });

  const phoneAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -pageOffset.value * screenWidth }],
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -pageOffset.value * screenWidth }],
  }));

  const handleSkip = () => {
    const currentIndex = getStepIndex(currentStep);
    if (currentIndex < ONBOARDING_STEPS.length - 1) {
      const nextIndex = currentIndex + 1;
      const nextStep = ONBOARDING_STEPS[nextIndex];
      pageOffset.value = withTiming(nextIndex, transitionConfig, (finished) => {
        if (finished) {
          runOnJS(setCurrentStep)(nextStep);
          runOnJS(setCurrentPageIndex)(nextIndex);
        }
      });
    } else {
      onComplete();
    }
  };

  const renderStepContent = (step: OnboardingStep = currentStep) => {
    return (
      <View style={styles.textContentContainer}>
        {/* Title and Description */}
        <Text style={[styles.stepTitle, { color: colors.text }]}>
          {t(`onboarding.${step}.title`)}
        </Text>
        <Text
          style={[
            styles.stepDescription,
            { color: colors.textSecondary },
          ]}
        >
          {t(`onboarding.${step}.description`)}
        </Text>

        {/* Theme Selection Buttons - Only for theme step */}
        {step === 'theme' && (
          <View style={styles.themeButtonsContainer}>
            <TouchableOpacity
              style={[
                styles.themeButton,
                themeMode === 'system' && {
                  backgroundColor: colors.primary,
                },
                themeMode !== 'system' && {
                  backgroundColor: colors.surfaceSecondary,
                },
              ]}
              onPress={() => setThemeMode('system')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.themeButtonText,
                  {
                    color:
                      themeMode === 'system' ? '#FFFFFF' : colors.textSecondary,
                  },
                ]}
              >
                {t('onboarding.themeOptions.system')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.themeButton,
                themeMode === 'light' && {
                  backgroundColor: colors.primary,
                },
                themeMode !== 'light' && {
                  backgroundColor: colors.surfaceSecondary,
                },
              ]}
              onPress={() => setThemeMode('light')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.themeButtonText,
                  {
                    color:
                      themeMode === 'light' ? '#FFFFFF' : colors.textSecondary,
                  },
                ]}
              >
                {t('onboarding.themeOptions.light')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.themeButton,
                themeMode === 'dark' && {
                  backgroundColor: colors.primary,
                },
                themeMode !== 'dark' && {
                  backgroundColor: colors.surfaceSecondary,
                },
              ]}
              onPress={() => setThemeMode('dark')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.themeButtonText,
                  {
                    color:
                      themeMode === 'dark' ? '#FFFFFF' : colors.textSecondary,
                  },
                ]}
              >
                {t('onboarding.themeOptions.dark')}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Language Selection Buttons - Only for language step */}
        {step === 'language' && (
          <View style={styles.languageButtonsContainer}>
            <TouchableOpacity
              style={[
                styles.languageButton,
                language === 'id' && {
                  backgroundColor: colors.primary,
                },
                language !== 'id' && {
                  backgroundColor: colors.surfaceSecondary,
                },
              ]}
              onPress={() => setLanguage('id')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.languageButtonText,
                  {
                    color:
                      language === 'id' ? '#FFFFFF' : colors.textSecondary,
                  },
                ]}
              >
                {t('onboarding.languageOptions.indonesian')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.languageButton,
                language === 'en' && {
                  backgroundColor: colors.primary,
                },
                language !== 'en' && {
                  backgroundColor: colors.surfaceSecondary,
                },
              ]}
              onPress={() => setLanguage('en')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.languageButtonText,
                  {
                    color:
                      language === 'en' ? '#FFFFFF' : colors.textSecondary,
                  },
                ]}
              >
                {t('onboarding.languageOptions.english')}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  // Don't auto-request permission on step change
  // Permission will be requested when user clicks "Aktifkan" button

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Phone Image - Animated pager */}
      <View style={styles.phoneImageContainer}>
        <Animated.View
          style={[
            styles.phoneImageScrollView,
            {
              flexDirection: 'row',
              width: screenWidth * ONBOARDING_STEPS.length,
            },
            phoneAnimatedStyle,
          ]}
        >
          {ONBOARDING_STEPS.map((step) => (
            <View key={step} style={[styles.phoneImagePage, { width: screenWidth }]}>
              <PhoneMockup
                screenType={step}
                colors={colors}
                isDark={isDark}
                themeMode={themeMode}
                onThemeModeChange={setThemeMode}
                language={language}
                onLanguageChange={setLanguage}
              />
            </View>
          ))}
        </Animated.View>
      </View>

      {/* Card Container with Button Below */}
      <View
        style={[
          styles.cardContainer,
          {
            paddingBottom: insets.bottom + moderateVerticalScale(16),
          },
        ]}
      >
        {/* Card Base */}
        <View style={[styles.stepContentCard, { backgroundColor: colors.surface }]}>
          {/* Pagination Indicator - Fixed Position Above Title */}
          <View style={styles.paginationContainer}>
            {ONBOARDING_STEPS.map((_, index) => {
              const isCompleted = index < getStepIndex(currentStep);
              const isActive = index === getStepIndex(currentStep);
              const isActiveOrCompleted = isActive || isCompleted;

              return (
                <View
                  key={index}
                  style={[
                    styles.paginationDot,
                    {
                      backgroundColor: isActiveOrCompleted
                        ? colors.primary
                        : colors.border,
                      width: isActiveOrCompleted ? moderateScale(24) : moderateScale(8),
                    },
                  ]}
                />
              );
            })}
          </View>

          {/* Text Content - Animated pager with swipe */}
          <GestureDetector gesture={panGesture}>
            <Animated.View
              style={[
                styles.textScrollView,
                {
                  flexDirection: 'row',
                  width: screenWidth * ONBOARDING_STEPS.length,
                },
                contentAnimatedStyle,
              ]}
            >
              {ONBOARDING_STEPS.map((step) => (
                <View key={step} style={[styles.textPage, { width: screenWidth }]}>
                  <View style={styles.textPageContent}>
                    {renderStepContent(step)}
                  </View>
                </View>
              ))}
            </Animated.View>
          </GestureDetector>
        </View>

        {/* Bottom button - Below Card */}
        <View
          style={[
            styles.bottomContainer,
            {
              backgroundColor: colors.background,
              paddingTop: moderateVerticalScale(16),
            },
          ]}
        >
          {hasUserRespondedToPermission(currentStep) ? (
            <TouchableOpacity
              style={[styles.nextButton, { backgroundColor: colors.primary }]}
              onPress={handleNext}
              activeOpacity={0.8}
            >
              <Text style={[styles.nextButtonText, { color: colors.surface }]}>{t('common.next')}</Text>
            </TouchableOpacity>
          ) : currentStep !== 'theme' && currentStep !== 'language' ? (
            <TouchableOpacity
              style={[styles.activateButton, { backgroundColor: colors.primary }]}
              onPress={handleActivatePermission}
              activeOpacity={0.8}
            >
              <Text style={[styles.activateButtonText, { color: colors.surface }]}>
                {t('onboarding.activate')}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.nextButton, { backgroundColor: colors.primary }]}
              onPress={handleNext}
              activeOpacity={0.8}
            >
              <Text style={[styles.nextButtonText, { color: colors.surface }]}>{t('common.next')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

