/**
 * FnBLocationPickerModal – In-app map picker ala Grab for delivery address
 * Pin fixed at center; user pans/zooms map; address updates via reverse geocode
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import MapView, { type Region } from 'react-native-maps';
import * as ExpoLocation from 'expo-location';
import { CloseCircle, Location as LocationIcon } from 'iconsax-react-nativejs';
import { scale, moderateVerticalScale, FontFamily, getHorizontalPadding } from '@core/config';
import { useTheme } from '@core/theme';
import { useTranslation } from '@core/i18n';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const DEFAULT_REGION: Region = {
  latitude: -6.2088,
  longitude: 106.8456,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

const DEBOUNCE_MS = 500;
/** Minimum change (degrees) to trigger new reverse geocode ~5m */
const GEOCODE_THRESHOLD = 0.00005;

function formatGeocodeAddress(geocode: ExpoLocation.LocationGeocodedAddress | null): string {
  if (!geocode) return '';
  const parts = [
    geocode.street,
    geocode.streetNumber,
    geocode.district,
    geocode.subregion,
    geocode.city,
    geocode.region,
    geocode.postalCode,
  ].filter(Boolean);
  return parts.join(', ') || '';
}

export interface FnBLocationPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectAddress: (address: string) => void;
}

export const FnBLocationPickerModal: React.FC<FnBLocationPickerModalProps> = ({
  visible,
  onClose,
  onSelectAddress,
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [region, setRegion] = useState<Region>(DEFAULT_REGION);
  const [addressText, setAddressText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const mapRef = useRef<MapView>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastCenterRef = useRef({ latitude: region.latitude, longitude: region.longitude });
  const lastGeocodedCenterRef = useRef({ latitude: 0, longitude: 0 });
  const hasFirstAddressRef = useRef(false);

  const doReverseGeocode = useCallback(
    async (latitude: number, longitude: number) => {
      if (Platform.OS === 'web') return;
      const isFirstLoad = !hasFirstAddressRef.current;
      if (isFirstLoad) setIsGeocoding(true);
      try {
        const [result] = await ExpoLocation.reverseGeocodeAsync({ latitude, longitude });
        const formatted = formatGeocodeAddress(result);
        setAddressText(formatted || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
        lastGeocodedCenterRef.current = { latitude, longitude };
        hasFirstAddressRef.current = true;
      } catch {
        setAddressText(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
        lastGeocodedCenterRef.current = { latitude, longitude };
        hasFirstAddressRef.current = true;
      } finally {
        if (isFirstLoad) setIsGeocoding(false);
      }
    },
    []
  );

  const onRegionChangeComplete = useCallback(
    (r: Region) => {
      setRegion(r);
      lastCenterRef.current = { latitude: r.latitude, longitude: r.longitude };
      const last = lastGeocodedCenterRef.current;
      const latDiff = Math.abs(r.latitude - last.latitude);
      const lngDiff = Math.abs(r.longitude - last.longitude);
      if (latDiff < GEOCODE_THRESHOLD && lngDiff < GEOCODE_THRESHOLD) return;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        debounceRef.current = null;
        doReverseGeocode(r.latitude, r.longitude);
      }, DEBOUNCE_MS);
    },
    [doReverseGeocode]
  );

  const goToMyLocation = useCallback(async () => {
    if (Platform.OS === 'web') return;
    try {
      const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          t('fnb.locationPermissionDeniedTitle') || 'Izin Lokasi',
          t('fnb.locationPermissionDenied') || 'Aktifkan akses lokasi untuk mengisi alamat dari peta.'
        );
        return;
      }
      const position = await ExpoLocation.getCurrentPositionAsync({
        accuracy: ExpoLocation.Accuracy.Balanced,
      });
      const { latitude, longitude } = position.coords;
      const newRegion: Region = {
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setRegion(newRegion);
      lastCenterRef.current = { latitude, longitude };
      mapRef.current?.animateToRegion(newRegion, 500);
      await doReverseGeocode(latitude, longitude);
    } catch {
      Alert.alert(
        t('fnb.locationErrorTitle') || 'Lokasi',
        t('fnb.locationError') || 'Tidak dapat mengambil lokasi. Pastikan GPS aktif dan coba lagi.'
      );
    }
  }, [t, doReverseGeocode]);

  const handleUseThisAddress = useCallback(() => {
    const toSend = addressText.trim() || `${lastCenterRef.current.latitude.toFixed(6)}, ${lastCenterRef.current.longitude.toFixed(6)}`;
    onSelectAddress(toSend);
    onClose();
  }, [addressText, onSelectAddress, onClose]);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    hasFirstAddressRef.current = false;
    lastGeocodedCenterRef.current = { latitude: 0, longitude: 0 };
    setIsLoading(true);
    setAddressText('');
    if (Platform.OS === 'web') {
      setIsLoading(false);
      return;
    }
    (async () => {
      try {
        const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
        if (cancelled) return;
        if (status === 'granted') {
          const position = await ExpoLocation.getCurrentPositionAsync({
            accuracy: ExpoLocation.Accuracy.Balanced,
          });
          if (cancelled) return;
          const { latitude, longitude } = position.coords;
          const newRegion: Region = {
            latitude,
            longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          };
          setRegion(newRegion);
          lastCenterRef.current = { latitude, longitude };
          setTimeout(() => mapRef.current?.animateToRegion(newRegion, 300), 100);
          await doReverseGeocode(latitude, longitude);
        } else {
          setRegion(DEFAULT_REGION);
          lastCenterRef.current = { latitude: DEFAULT_REGION.latitude, longitude: DEFAULT_REGION.longitude };
          await doReverseGeocode(DEFAULT_REGION.latitude, DEFAULT_REGION.longitude);
        }
      } catch {
        if (!cancelled) {
          setRegion(DEFAULT_REGION);
          setAddressText(`${DEFAULT_REGION.latitude.toFixed(6)}, ${DEFAULT_REGION.longitude.toFixed(6)}`);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [visible, doReverseGeocode]);

  const isWeb = Platform.OS === 'web';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={[styles.container, { marginTop: insets.top, backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>
            {t('fnb.locationPickerTitle') || 'Pilih lokasi'}
          </Text>
          <TouchableOpacity onPress={onClose} hitSlop={12} style={styles.closeBtn}>
            <CloseCircle size={scale(28)} color={colors.textSecondary} variant="Bold" />
          </TouchableOpacity>
        </View>

        {isWeb ? (
          <View style={styles.webPlaceholder}>
            <Text style={[styles.webText, { color: colors.textSecondary }]}>
              {t('fnb.locationNotSupportedWeb') || 'Pilih lokasi tidak tersedia di web.'}
            </Text>
            <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.primary }]} onPress={onClose}>
              <Text style={[styles.primaryButtonText, { color: colors.surface }]}>
                {t('common.close') || 'Tutup'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.mapWrap}>
              {isLoading ? (
                <View style={[styles.loadingOverlay, { backgroundColor: colors.surface }]}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                    {t('fnb.loadingLocation') || 'Mengambil lokasi...'}
                  </Text>
                </View>
              ) : null}
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

            <View style={[styles.footer, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <View style={[styles.addressCard, { backgroundColor: colors.surface }]}>
                {isGeocoding ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Text style={[styles.addressText, { color: colors.text }]} numberOfLines={2}>
                    {addressText || (t('fnb.loadingAddress') || 'Memuat alamat...')}
                  </Text>
                )}
              </View>
              <TouchableOpacity
                style={[styles.secondaryButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={goToMyLocation}
                disabled={isLoading}
              >
                <LocationIcon size={scale(20)} color={colors.primary} variant="Bold" />
                <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>
                  {t('fnb.useMyLocation') || 'Gunakan lokasi saya'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: colors.primary }]}
                onPress={handleUseThisAddress}
                disabled={isLoading}
              >
                <Text style={[styles.primaryButtonText, { color: colors.surface }]}>
                  {t('fnb.useThisAddress') || 'Gunakan alamat ini'}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: getHorizontalPadding(),
    paddingVertical: scale(12),
    borderBottomWidth: 1,
  },
  title: {
    fontSize: scale(18),
    fontFamily: FontFamily.monasans.bold,
  },
  closeBtn: {
    padding: scale(4),
  },
  mapWrap: {
    flex: 1,
    position: 'relative',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  loadingText: {
    marginTop: scale(8),
    fontSize: scale(14),
    fontFamily: FontFamily.monasans.regular,
  },
  pinContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '50%',
    marginTop: -scale(30),
    alignItems: 'center',
    zIndex: 2,
  },
  footer: {
    paddingHorizontal: getHorizontalPadding(),
    paddingTop: scale(16),
    paddingBottom: moderateVerticalScale(24),
    borderTopWidth: 1,
  },
  addressCard: {
    padding: scale(12),
    borderRadius: scale(10),
    marginBottom: scale(12),
    minHeight: scale(44),
    justifyContent: 'center',
  },
  addressText: {
    fontSize: scale(14),
    fontFamily: FontFamily.monasans.regular,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(8),
    paddingVertical: scale(12),
    borderRadius: scale(10),
    borderWidth: 1,
    marginBottom: scale(10),
  },
  secondaryButtonText: {
    fontSize: scale(14),
    fontFamily: FontFamily.monasans.semiBold,
  },
  primaryButton: {
    paddingVertical: scale(14),
    borderRadius: scale(10),
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: scale(15),
    fontFamily: FontFamily.monasans.semiBold,
  },
  webPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: scale(24),
  },
  webText: {
    fontSize: scale(16),
    fontFamily: FontFamily.monasans.regular,
    textAlign: 'center',
    marginBottom: scale(24),
  },
});
