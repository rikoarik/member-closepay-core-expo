/**
 * MapPickerScreen
 * Pilih lokasi di peta: GPS, drag map, reverse geocode → return coords + address fields
 */

import React, { useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import MapView, { type Region } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Location as LocationIcon, ArrowLeft2 } from 'iconsax-react-nativejs';
import { scale, moderateVerticalScale, getHorizontalPadding, FontFamily } from '@core/config';
import { useTheme } from '@core/theme';
import { useTranslation } from '@core/i18n';
import { useMapPicker } from '../../hooks/useMapPicker';
import { useCurrentLocation } from '../../hooks/useCurrentLocation';
import { geocodingService, type GeocodeResult } from '../../services/geocodingService';

const DEFAULT_REGION: Region = {
  latitude: -6.2088,
  longitude: 106.8456,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

type MapPickerRouteParams = {
  MapPicker: { initialLat?: number; initialLng?: number };
};

export const MapPickerScreen: React.FC = () => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<MapPickerRouteParams, 'MapPicker'>>();
  const insets = useSafeAreaInsets();
  const horizontalPadding = getHorizontalPadding();
  const mapRef = useRef<MapView>(null);

  const initialLat = route.params?.initialLat ?? DEFAULT_REGION.latitude;
  const initialLng = route.params?.initialLng ?? DEFAULT_REGION.longitude;
  const initialRegion: Region = {
    latitude: initialLat,
    longitude: initialLng,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  const {
    region,
    selectedLat,
    selectedLng,
    geocodeResult,
    isGeocoding,
    setRegion,
    onRegionChangeComplete,
    setCenter,
    reverseGeocode,
    reset,
  } = useMapPicker(initialRegion);

  const { getCurrentPosition, loading: locationLoading } = useCurrentLocation();

  useEffect(() => {
    reset(initialRegion);
    reverseGeocode(initialLat, initialLng);
  }, []);

  const goToMyLocation = useCallback(async () => {
    const coords = await getCurrentPosition();
    if (!coords) {
      Alert.alert(
        t('common.error') || 'Error',
        t('marketplace.useMyLocation') + ' — ' + 'Izin lokasi ditolak atau GPS tidak tersedia.'
      );
      return;
    }
    const newRegion: Region = {
      latitude: coords.latitude,
      longitude: coords.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
    setRegion(newRegion);
    mapRef.current?.animateToRegion(newRegion, 500);
    setCenter(coords.latitude, coords.longitude);
  }, [getCurrentPosition, setCenter, setRegion, t]);

  const handleConfirm = useCallback(() => {
    const result: GeocodeResult = geocodeResult ?? {
      province: '',
      city: '',
      district: '',
      subDistrict: '',
      postalCode: '',
      fullAddress: `${selectedLat.toFixed(6)}, ${selectedLng.toFixed(6)}`,
    };
    (navigation as any).navigate('AddressForm', {
      fromMapPicker: true,
      latitude: selectedLat,
      longitude: selectedLng,
      geocodeResult: result,
    });
  }, [geocodeResult, selectedLat, selectedLng, navigation]);

  const addressText = geocodeResult?.fullAddress || `${selectedLat.toFixed(6)}, ${selectedLng.toFixed(6)}`;
  const isWeb = Platform.OS === 'web';

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderColor: colors.border, paddingHorizontal: horizontalPadding }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={12}>
          <ArrowLeft2 size={scale(24)} color={colors.text} variant="Linear" />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>{t('marketplace.pickOnMap')}</Text>
      </View>

      {isWeb ? (
        <View style={[styles.webPlaceholder, { paddingHorizontal: horizontalPadding }]}>
          <Text style={[styles.webText, { color: colors.textSecondary }]}>
            Pilih lokasi di peta tidak tersedia di web. Gunakan aplikasi mobile.
          </Text>
          <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.primary }]} onPress={() => navigation.goBack()}>
            <Text style={[styles.primaryButtonText, { color: colors.surface }]}>{t('common.close')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.mapWrap}>
            <MapView
              ref={mapRef}
              style={StyleSheet.absoluteFill}
              initialRegion={region}
              region={undefined}
              onRegionChangeComplete={onRegionChangeComplete}
              showsUserLocation
              showsMyLocationButton={false}
            />
            <View style={styles.pinContainer} pointerEvents="none">
              <LocationIcon size={scale(40)} color={colors.primary} variant="Bold" />
            </View>
          </View>

          <View style={[styles.footer, { backgroundColor: colors.background, borderColor: colors.border, paddingHorizontal: horizontalPadding, paddingBottom: insets.bottom + moderateVerticalScale(16) }]}>
            <View style={[styles.addressCard, { backgroundColor: colors.surface }]}>
              {isGeocoding ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text style={[styles.addressText, { color: colors.text }]} numberOfLines={2}>
                  {addressText}
                </Text>
              )}
            </View>
            <TouchableOpacity
              style={[styles.secondaryButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={goToMyLocation}
              disabled={locationLoading}
            >
              <LocationIcon size={scale(20)} color={colors.primary} variant="Bold" />
              <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>
                {t('marketplace.useMyLocation')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: colors.primary }]}
              onPress={handleConfirm}
              disabled={isGeocoding}
            >
              <Text style={[styles.primaryButtonText, { color: colors.surface }]}>
                {t('marketplace.useThisLocation')}
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scale(12),
    borderBottomWidth: 1,
  },
  backBtn: { padding: scale(4), marginRight: scale(8) },
  title: { fontSize: scale(18), fontFamily: FontFamily.monasans.bold, flex: 1 },
  mapWrap: { flex: 1, position: 'relative' },
  pinContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    paddingTop: moderateVerticalScale(12),
    borderTopWidth: 1,
    gap: scale(12),
  },
  addressCard: {
    padding: scale(12),
    borderRadius: scale(8),
  },
  addressText: { fontSize: scale(14), fontFamily: FontFamily.monasans.regular },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(8),
    paddingVertical: scale(12),
    borderRadius: scale(12),
    borderWidth: 1,
  },
  primaryButton: {
    paddingVertical: moderateVerticalScale(14),
    borderRadius: scale(12),
    alignItems: 'center',
  },
  primaryButtonText: { fontSize: scale(16), fontFamily: FontFamily.monasans.bold },
  secondaryButtonText: { fontSize: scale(14), fontFamily: FontFamily.monasans.semiBold },
  webPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: scale(16) },
  webText: { fontSize: scale(16), textAlign: 'center' },
});

export default MapPickerScreen;
