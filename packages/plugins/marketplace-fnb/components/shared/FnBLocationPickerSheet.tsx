/**
 * FnBLocationPickerSheet – Pilih lokasi: cari alamat, lokasi saat ini, alamat terakhir, pilih di peta.
 */

import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Platform,
  Alert,
} from "react-native";
import * as ExpoLocation from "expo-location";
import { SearchNormal, Flash, Location, CloseCircle, Map } from "iconsax-react-nativejs";
import { scale, moderateVerticalScale, FontFamily, BottomSheet } from "@core/config";
import { useTheme } from "@core/theme";
import { useTranslation } from "@core/i18n";
import { getLastDelivery } from "../../utils/deliveryStorage";

/** Full address for storage/display when needed */
function formatGeocodeAddress(
  geocode: ExpoLocation.LocationGeocodedAddress | null
): string {
  if (!geocode) return "";
  const parts = [
    geocode.street,
    geocode.streetNumber,
    geocode.district,
    geocode.subregion,
    geocode.city,
    geocode.region,
    geocode.postalCode,
  ].filter(Boolean);
  return parts.join(", ") || "";
}

/** Short label: jalan atau desa/kelurahan saja */
function formatGeocodeAddressShort(
  geocode: ExpoLocation.LocationGeocodedAddress | null
): string {
  if (!geocode) return "";
  const streetPart = [geocode.street, geocode.streetNumber].filter(Boolean).join(" ");
  if (streetPart) return streetPart;
  if (geocode.district) return geocode.district;
  if (geocode.subregion) return geocode.subregion;
  if (geocode.city) return geocode.city;
  return formatGeocodeAddress(geocode);
}

export interface FnBLocationPickerSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelectAddress: (address: string) => void;
  onRequestMapPicker?: () => void;
}

export const FnBLocationPickerSheet: React.FC<FnBLocationPickerSheetProps> = ({
  visible,
  onClose,
  onSelectAddress,
  onRequestMapPicker,
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ExpoLocation.LocationGeocodedAddress[]>([]);
  const [searching, setSearching] = useState(false);
  const [lastDelivery, setLastDelivery] = useState<{ deliveryAddress: string } | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);

  useEffect(() => {
    if (visible) {
      getLastDelivery().then(setLastDelivery);
    }
  }, [visible]);

  const handleSearch = useCallback(async () => {
    const q = searchQuery.trim();
    if (!q || Platform.OS === "web") return;
    setSearching(true);
    setSearchResults([]);
    try {
      const coords = await ExpoLocation.geocodeAsync(q);
      if (coords.length === 0) {
        setSearching(false);
        return;
      }
      const reversed = await Promise.all(
        coords.slice(0, 5).map((c) =>
          ExpoLocation.reverseGeocodeAsync({
            latitude: c.latitude,
            longitude: c.longitude,
          }).then(([r]) => r)
        )
      );
      setSearchResults(reversed.filter(Boolean) as ExpoLocation.LocationGeocodedAddress[]);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, [searchQuery]);

  const handleSelectSearchResult = useCallback(
    (geocode: ExpoLocation.LocationGeocodedAddress) => {
      const formatted = formatGeocodeAddress(geocode);
      if (formatted) {
        onSelectAddress(formatted);
        onClose();
      }
    },
    [onSelectAddress, onClose]
  );

  const handleCurrentLocation = useCallback(async () => {
    if (Platform.OS === "web") return;
    setGettingLocation(true);
    try {
      const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          t("fnb.locationPermissionDeniedTitle"),
          t("fnb.locationPermissionDenied")
        );
        setGettingLocation(false);
        return;
      }
      const position = await ExpoLocation.getCurrentPositionAsync({
        accuracy: ExpoLocation.Accuracy.Balanced,
      });
      const [result] = await ExpoLocation.reverseGeocodeAsync({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      const formatted = formatGeocodeAddress(result);
      if (formatted) {
        onSelectAddress(formatted);
        onClose();
      }
    } catch {
      Alert.alert(t("fnb.locationErrorTitle"), t("fnb.locationError"));
    } finally {
      setGettingLocation(false);
    }
  }, [t, onSelectAddress, onClose]);

  const handleLastAddress = useCallback(() => {
    if (lastDelivery?.deliveryAddress) {
      onSelectAddress(lastDelivery.deliveryAddress);
      onClose();
    }
  }, [lastDelivery, onSelectAddress, onClose]);

  const handlePickOnMap = useCallback(() => {
    onRequestMapPicker?.();
    onClose();
  }, [onRequestMapPicker, onClose]);

  return (
    <BottomSheet visible={visible} onClose={onClose} snapPoints={[100]}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            {t("fnb.locationPickerTitle")}
          </Text>
          <TouchableOpacity onPress={onClose} hitSlop={8}>
            <CloseCircle size={scale(24)} color={colors.textSecondary} variant="Linear" />
          </TouchableOpacity>
        </View>

        <View style={[styles.searchRow, { backgroundColor: colors.background }]}>
          <SearchNormal size={scale(20)} color={colors.textSecondary} variant="Linear" />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder={t("fnb.searchAddressPlaceholder")}
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searching ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <TouchableOpacity onPress={handleSearch}>
              <Text style={[styles.searchBtn, { color: colors.primary }]}>
                {t("fnb.searchAddress")}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {searchResults.length > 0 && (
          <View style={styles.resultsWrap}>
            {searchResults.map((r, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.resultItem, { borderBottomColor: colors.border }]}
                onPress={() => handleSelectSearchResult(r)}
              >
                <Location size={scale(18)} color={colors.primary} variant="Linear" />
                <Text
                  style={[styles.resultText, { color: colors.text }]}
                  numberOfLines={1}
                >
                  {formatGeocodeAddressShort(r)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            style={[styles.optionRow, { borderBottomColor: colors.border }]}
            onPress={handleCurrentLocation}
            disabled={gettingLocation}
          >
            <View style={[styles.iconBox, { backgroundColor: colors.primary + "15" }]}>
              <Flash size={scale(20)} color={colors.primary} variant="Bold" />
            </View>
            <View style={styles.optionText}>
              <Text style={[styles.optionTitle, { color: colors.text }]}>
                {t("fnb.useMyLocation")}
              </Text>
              <Text style={[styles.optionSub, { color: colors.textSecondary }]}>
                {gettingLocation
                  ? t("fnb.loadingLocation")
                  : t("fnb.locationPickerTitle")}
              </Text>
            </View>
            {gettingLocation && (
              <ActivityIndicator size="small" color={colors.primary} />
            )}
          </TouchableOpacity>

          {lastDelivery?.deliveryAddress ? (
            <TouchableOpacity
              style={[styles.optionRow, { borderBottomColor: colors.border }]}
              onPress={handleLastAddress}
            >
              <View style={[styles.iconBox, { backgroundColor: colors.primary + "15" }]}>
                <Location size={scale(20)} color={colors.primary} variant="Bold" />
              </View>
              <View style={styles.optionText}>
                <Text style={[styles.optionTitle, { color: colors.text }]}>
                  {t("fnb.lastAddress")}
                </Text>
                <Text
                  style={[styles.optionSub, { color: colors.textSecondary }]}
                  numberOfLines={1}
                >
                  {lastDelivery.deliveryAddress.split(",")[0]?.trim() ||
                    lastDelivery.deliveryAddress}
                </Text>
              </View>
            </TouchableOpacity>
          ) : null}

          {onRequestMapPicker && (
            <TouchableOpacity
              style={[styles.optionRow, { borderBottomColor: colors.border }]}
              onPress={handlePickOnMap}
            >
              <View style={[styles.iconBox, { backgroundColor: colors.primary + "15" }]}>
                <Map size={scale(20)} color={colors.primary} variant="Bold" />
              </View>
              <View style={styles.optionText}>
                <Text style={[styles.optionTitle, { color: colors.text }]}>
                  {t("fnb.pickOnMap")}
                </Text>
                <Text style={[styles.optionSub, { color: colors.textSecondary }]}>
                  {t("fnb.pickLocationOnMap")}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: scale(16),
    paddingBottom: moderateVerticalScale(24),
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: moderateVerticalScale(16),
  },
  title: {
    fontSize: scale(18),
    fontFamily: FontFamily.monasans.semiBold,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(12),
    paddingVertical: scale(10),
    borderRadius: scale(12),
    gap: scale(8),
    marginBottom: scale(12),
  },
  searchInput: {
    flex: 1,
    fontFamily: FontFamily.monasans.regular,
    fontSize: scale(14),
    paddingVertical: 0,
  },
  searchBtn: {
    fontFamily: FontFamily.monasans.semiBold,
    fontSize: scale(13),
  },
  resultsWrap: {
    marginBottom: scale(12),
    maxHeight: scale(160),
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(10),
    paddingVertical: scale(10),
    borderBottomWidth: 1,
  },
  resultText: {
    flex: 1,
    fontFamily: FontFamily.monasans.regular,
    fontSize: scale(13),
  },
  scroll: {
    maxHeight: scale(280),
  },
  scrollContent: {
    paddingBottom: scale(16),
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: scale(14),
    borderBottomWidth: 1,
    gap: scale(12),
  },
  iconBox: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(12),
    alignItems: "center",
    justifyContent: "center",
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontFamily: FontFamily.monasans.semiBold,
    fontSize: scale(15),
  },
  optionSub: {
    fontFamily: FontFamily.monasans.regular,
    fontSize: scale(13),
    marginTop: scale(2),
  },
});
