import React from 'react';
import { View, Animated, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useTheme } from '@core/theme';
import { QrScanIcon } from '@core/config/components/icons';
import { scale, moderateVerticalScale } from '@core/config';
import { useFabAnimation } from './hooks/useFabAnimation';

export interface QrFabProps {
  visible: boolean;
  onPress: () => void;
}

export const QrFab: React.FC<QrFabProps> = ({ visible, onPress }) => {
  const { colors } = useTheme();
  const { fabOpacity, fabScale } = useFabAnimation(visible);

  return (
    <Animated.View
      style={[
        styles.fab,
        {
          backgroundColor: colors.primary,
          opacity: fabOpacity,
          zIndex: 2,
          transform: [{ scale: fabScale }],
        },
      ]}
      pointerEvents={visible ? 'auto' : 'none'}
    >
      <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.fabTouchable}>
        <QrScanIcon width={scale(26)} height={scale(26)} fill={colors.surface} />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: moderateVerticalScale(54),
    alignSelf: 'center',
    width: scale(80),
    height: scale(55),
    borderRadius: scale(2000),
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  fabTouchable: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
