/**
 * PaymentMethodSheet – Modal bottom sheet dengan tinggi dinamis.
 * Kecil saat cicilan non-aktif, membesar saat cicilan aktif (tenor + jadwal).
 * Tidak pakai BottomSheet core agar ukuran bisa menyesuaikan konten.
 */
import React, { useEffect } from 'react';
import {
  View,
  Modal,
  Pressable,
  ScrollView,
  Dimensions,
  LayoutAnimation,
  Platform,
  UIManager,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@core/theme';
import { scale, moderateVerticalScale } from '@core/config';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const HEIGHT_RATIO_COMPACT = 0.52; // cicilan off: metode + switch + tutup
const HEIGHT_RATIO_EXPANDED = 0.88; // cicilan on: + tenor + simulasi + jadwal

interface PaymentMethodSheetProps {
  visible: boolean;
  onClose: () => void;
  /** True ketika blok cicilan (tenor + jadwal) ditampilkan → sheet lebih tinggi */
  expandForInstallment: boolean;
  children: React.ReactNode;
}

export const PaymentMethodSheet: React.FC<PaymentMethodSheetProps> = ({
  visible,
  onClose,
  expandForInstallment,
  children,
}) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (visible) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
  }, [visible, expandForInstallment]);

  const sheetHeight =
    SCREEN_HEIGHT * (expandForInstallment ? HEIGHT_RATIO_EXPANDED : HEIGHT_RATIO_COMPACT);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.container}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)' }]} />
        </Pressable>

        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.surface,
              height: sheetHeight,
              paddingBottom: insets.bottom + moderateVerticalScale(16),
            },
          ]}
        >
          <View style={styles.handleWrap}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={true}
            keyboardShouldPersistTaps="handled"
            bounces={true}
          >
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: scale(20),
    borderTopRightRadius: scale(20),
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: -4 },
      },
      android: {
        elevation: 10,
      },
    }),
  },
  handleWrap: {
    alignItems: 'center',
    paddingVertical: moderateVerticalScale(10),
  },
  handle: {
    width: scale(40),
    height: scale(4),
    borderRadius: scale(2),
  },
  scroll: {
    flex: 1,
    minHeight: 0,
  },
  scrollContent: {
    paddingBottom: scale(24),
  },
});
