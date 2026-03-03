/**
 * FnBScanScreen – Entry for FnB store QR/Barcode scanner.
 * Full Expo: native pakai expo-camera (FnBScanScreenExpo). Web: resolved via FnBScanScreen.web.tsx.
 */
import React, { lazy, Suspense } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme } from '@core/theme';

const FnBScanScreenExpoLazy = lazy(() =>
  import('./FnBScanScreenExpo').then((m) => ({ default: m.FnBScanScreenExpo }))
);

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
      <FnBScanScreenExpoLazy />
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
