import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  ArrowLeft2,
  Call,
  MessageText,
  TruckFast,
  DirectInbox,
  TickCircle,
  Location,
} from 'iconsax-react-nativejs';
import { scale, moderateVerticalScale, getHorizontalPadding, FontFamily } from '@core/config';
import { useTheme } from '@core/theme';
import { useFnBActiveOrder } from '../../context/FnBActiveOrderContext';

export const FnBOrderTrackingScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const horizontalPadding = getHorizontalPadding();
  const { activeOrder } = useFnBActiveOrder();

  const handleBack = () => {
    navigation.goBack();
  };

  if (!activeOrder) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + moderateVerticalScale(8) }]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <ArrowLeft2 size={scale(24)} color={colors.text} variant="Linear" />
          </TouchableOpacity>
        </View>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Pesanan tidak ditemukan.</Text>
      </View>
    );
  }

  // Placeholder map image
  const mapImage = 'https://i.stack.imgur.com/KzXGz.png';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* MAP SECTION (Full width behind header) */}
      <View style={[StyleSheet.absoluteFillObject, { height: '60%' }]}>
        <Image 
          source={{ uri: mapImage }} 
          style={StyleSheet.absoluteFillObject} 
          resizeMode="cover"
        />
        <View style={styles.mapOverlay} />
      </View>

      {/* FLOATING HEADER */}
      <View style={[styles.headerFloating, { paddingTop: insets.top + moderateVerticalScale(8), paddingHorizontal: horizontalPadding }]}>
        <TouchableOpacity style={[styles.backButtonFloating, { backgroundColor: colors.surface }]} onPress={handleBack}>
          <ArrowLeft2 size={scale(20)} color={colors.text} variant="Linear" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={{ paddingTop: '80%', paddingBottom: insets.bottom + moderateVerticalScale(24) }}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={[styles.bottomSheet, { backgroundColor: colors.surface }]}>
          {/* DRIVER INFO */}
          <View style={styles.driverSection}>
            <View style={styles.driverProfile}>
              <View style={[styles.driverAvatarWrap, { backgroundColor: colors.primaryLight }]}>
                <TruckFast size={scale(24)} color={colors.primary} variant="Bold" />
              </View>
              <View style={styles.driverMeta}>
                <Text style={[styles.driverName, { color: colors.text }]}>Budi Santoso</Text>
                <Text style={[styles.driverPlat, { color: colors.textSecondary }]}>B 1234 XYZ • Gojek</Text>
              </View>
            </View>
            <View style={styles.driverActions}>
              <TouchableOpacity style={[styles.actionBtn, { borderColor: colors.border }]}>
                <MessageText size={scale(20)} color={colors.text} variant="Bold" />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, { borderColor: colors.border }]}>
                <Call size={scale(20)} color={colors.text} variant="Bold" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* ESTIMATION */}
          <View style={styles.estimationSection}>
            <Text style={[styles.estLabel, { color: colors.textSecondary }]}>Estimasi Tiba</Text>
            <View style={styles.estRow}>
              <Text style={[styles.estTime, { color: colors.text }]}>12:30</Text>
              <Text style={[styles.estAmPm, { color: colors.text }]}>WIB</Text>
            </View>
            <Text style={[styles.estDesc, { color: colors.textSecondary }]}>Driver sedang menuju lokasimu</Text>
          </View>

           <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* TRACKING PATH */}
          <View style={styles.trackingSection}>
            <Text style={[styles.estLabel, { color: colors.text }]}>Status Pengiriman</Text>
            
            <View style={styles.trackList}>
              {/* CURRENT */}
              <View style={styles.trackItem}>
                <View style={[styles.trackDotActive, { backgroundColor: colors.primary }]} />
                <View style={styles.trackLine} />
                <View style={styles.trackContent}>
                  <Text style={[styles.trackTitleActive, { color: colors.primary }]}>Driver Menuju Lokasimu</Text>
                  <Text style={[styles.trackTime, { color: colors.textSecondary }]}>12:15 WIB</Text>
                </View>
              </View>
              
              {/* PAST */}
              <View style={styles.trackItem}>
                <View style={[styles.trackDot, { backgroundColor: colors.border }]} />
                <View style={styles.trackLine} />
                <View style={styles.trackContent}>
                  <Text style={[styles.trackTitle, { color: colors.text }]}>Pesanan Diambil oleh Driver</Text>
                  <Text style={[styles.trackTime, { color: colors.textSecondary }]}>12:10 WIB</Text>
                </View>
              </View>

              {/* PAST */}
              <View style={styles.trackItem}>
                <View style={[styles.trackDot, { backgroundColor: colors.border }]} />
                <View style={styles.trackContent}>
                  <Text style={[styles.trackTitle, { color: colors.text }]}>Pesanan Siap Diambil</Text>
                  <Text style={[styles.trackTime, { color: colors.textSecondary }]}>12:00 WIB</Text>
                </View>
              </View>
            </View>
          </View>

        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerFloating: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonFloating: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  content: { flex: 1 },
  bottomSheet: {
    borderTopLeftRadius: scale(24),
    borderTopRightRadius: scale(24),
    paddingTop: scale(24),
    paddingHorizontal: scale(20),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 8,
    minHeight: '100%',
  },
  driverSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: scale(16),
  },
  driverProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: scale(12),
  },
  driverAvatarWrap: {
    width: scale(50),
    height: scale(50),
    borderRadius: scale(25),
    justifyContent: 'center',
    alignItems: 'center',
  },
  driverMeta: {
    flex: 1,
  },
  driverName: {
    fontSize: scale(16),
    fontFamily: FontFamily.monasans.bold,
    marginBottom: scale(4),
  },
  driverPlat: {
    fontSize: scale(13),
    fontFamily: FontFamily.monasans.medium,
  },
  driverActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(12),
  },
  actionBtn: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    marginVertical: scale(16),
  },
  estimationSection: {
    alignItems: 'center',
  },
  estLabel: {
    fontSize: scale(14),
    fontFamily: FontFamily.monasans.semiBold,
    marginBottom: scale(8),
  },
  estRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: scale(4),
    marginBottom: scale(4),
  },
  estTime: {
    fontSize: scale(32),
    fontFamily: FontFamily.monasans.bold,
  },
  estAmPm: {
    fontSize: scale(16),
    fontFamily: FontFamily.monasans.semiBold,
  },
  estDesc: {
    fontSize: scale(13),
    fontFamily: FontFamily.monasans.regular,
  },
  trackingSection: {
    marginTop: scale(8),
  },
  trackList: {
    marginTop: scale(16),
    paddingLeft: scale(8),
  },
  trackItem: {
    flexDirection: 'row',
    marginBottom: scale(24),
    position: 'relative',
  },
  trackDotActive: {
    width: scale(14),
    height: scale(14),
    borderRadius: scale(7),
    borderWidth: 3,
    borderColor: 'rgba(23, 192, 93, 0.2)', // Assuming a green-ish primary wrapper initially
    marginTop: scale(4),
  },
  trackDot: {
    width: scale(10),
    height: scale(10),
    borderRadius: scale(5),
    marginTop: scale(4),
    marginLeft: scale(2),
  },
  trackLine: {
    position: 'absolute',
    left: scale(6),
    top: scale(20),
    bottom: -scale(30),
    width: 2,
    backgroundColor: '#EEEEEE',
  },
  trackContent: {
    marginLeft: scale(16),
    flex: 1,
  },
  trackTitleActive: {
    fontSize: scale(15),
    fontFamily: FontFamily.monasans.bold,
    marginBottom: scale(4),
  },
  trackTitle: {
    fontSize: scale(15),
    fontFamily: FontFamily.monasans.medium,
    marginBottom: scale(4),
  },
  trackTime: {
    fontSize: scale(13),
    fontFamily: FontFamily.monasans.regular,
  },
  emptyText: {
    fontSize: scale(15),
    fontFamily: FontFamily.monasans.medium,
    textAlign: 'center',
    marginTop: scale(40),
  },
  header: {
    paddingHorizontal: scale(16),
    paddingVertical: scale(12),
  },
  backButton: {
    width: scale(40),
    height: scale(40),
    justifyContent: 'center',
  },
});
