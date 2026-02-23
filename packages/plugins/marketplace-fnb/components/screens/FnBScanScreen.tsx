/**
 * FnBScanScreen – Entry for FnB store QR/Barcode scanner.
 * Expo Go: uses expo-camera (FnBScanScreenExpo). Dev client/prebuild: uses vision-camera (FnBScanScreenVision).
 * Web: resolved via FnBScanScreen.web.tsx.
 */
import React, { lazy, Suspense } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import Constants from 'expo-constants';
import { useTheme } from '@core/theme';

const FnBScanScreenExpoLazy = lazy(() =>
  import('./FnBScanScreenExpo').then((m) => ({ default: m.FnBScanScreenExpo }))
);
const FnBScanScreenVisionLazy = lazy(() =>
  import('./FnBScanScreenVision').then((m) => ({ default: m.FnBScanScreenVision }))
);

const isExpoGo = Constants.appOwnership === 'expo';
const useExpoCamera = isExpoGo && Platform.OS !== 'web';

function FnBScanScreenFallback() {
  const { colors } = useTheme();
  return (
    <View style={[styles.fallback, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[styles.fallbackText, { color: colors.textSecondary }]}>Memuat kamera...</Text>
    </View>
  );
}

export const FnBScanScreen: React.FC = () => {
  return (
    <Suspense fallback={<FnBScanScreenFallback />}>
      {useExpoCamera ? (
        <FnBScanScreenExpoLazy />
      ) : (
        <FnBScanScreenVisionLazy />
      )}
    </Suspense>
  );
};

const styles = StyleSheet.create({
  fallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackText: {
    marginTop: 16,
    fontSize: 14,
  },
});

export default FnBScanScreen;
