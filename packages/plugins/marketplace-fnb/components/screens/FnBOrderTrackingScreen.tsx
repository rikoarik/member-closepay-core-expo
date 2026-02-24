import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Platform,
  Linking,
  Alert,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, CommonActions } from "@react-navigation/native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { ArrowLeft2, Call, MessageText, TruckFast } from "iconsax-react-nativejs";
import {
  scale,
  moderateVerticalScale,
  getHorizontalPadding,
  FontFamily,
  useDraggableBottomSheet,
} from "@core/config";
import { useTheme } from "@core/theme";
import { useFnBActiveOrder } from "../../context/FnBActiveOrderContext";

// Default region (Indonesia - Jakarta area); bisa diganti dari API tracking nanti
const DEFAULT_REGION = {
  latitude: -6.2088,
  longitude: 106.8456,
  latitudeDelta: 0.04,
  longitudeDelta: 0.04,
};

// Placeholder koordinat: merchant & tujuan (belum dari backend)
const MERCHANT_COORDS = { latitude: -6.2088, longitude: 106.8456 };
const DESTINATION_COORDS = { latitude: -6.215, longitude: 106.852 };

/** Decode encoded polyline (Google Polyline Algorithm); precision 5 = OSRM default */
function decodePolyline(
  encoded: string,
  precision = 5
): Array<{ latitude: number; longitude: number }> {
  const inv = 1 / Math.pow(10, precision);
  const points: Array<{ latitude: number; longitude: number }> = [];
  let i = 0;
  let lat = 0;
  let lng = 0;
  while (i < encoded.length) {
    let b = 0;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(i++) - 63;
      result |= (b & 31) << shift;
      shift += 5;
    } while (b >= 32);
    const dlat = (result & 1) ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(i++) - 63;
      result |= (b & 31) << shift;
      shift += 5;
    } while (b >= 32);
    const dlng = (result & 1) ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push({ latitude: lat * inv, longitude: lng * inv });
  }
  return points;
}

/** Jarak angular (radian) untuk interpolasi geodesik */
function angularDistance(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number }
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const lat1 = toRad(a.latitude);
  const lng1 = toRad(a.longitude);
  const lat2 = toRad(b.latitude);
  const lng2 = toRad(b.longitude);
  return 2 * Math.asin(Math.sqrt(Math.pow(Math.sin((lat1 - lat2) / 2), 2) + Math.cos(lat1) * Math.cos(lat2) * Math.pow(Math.sin((lng1 - lng2) / 2), 2)));
}

/** Interpolasi geodesik (great circle) antara dua titik - versi benar */
function interpolateGeodesicPoints(
  origin: { latitude: number; longitude: number },
  destination: { latitude: number; longitude: number },
  numSteps: number
): Array<{ latitude: number; longitude: number }> {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const toDeg = (r: number) => (r * 180) / Math.PI;
  const lat1 = toRad(origin.latitude);
  const lng1 = toRad(origin.longitude);
  const lat2 = toRad(destination.latitude);
  const lng2 = toRad(destination.longitude);
  const d = angularDistance(origin, destination);
  if (d < 1e-10) return [origin, destination];
  const points: Array<{ latitude: number; longitude: number }> = [];
  for (let i = 0; i <= numSteps; i++) {
    const t = i / numSteps;
    const f = Math.sin((1 - t) * d) / Math.sin(d);
    const g = Math.sin(t * d) / Math.sin(d);
    const x = f * Math.cos(lat1) * Math.cos(lng1) + g * Math.cos(lat2) * Math.cos(lng2);
    const y = f * Math.cos(lat1) * Math.sin(lng1) + g * Math.cos(lat2) * Math.sin(lng2);
    const z = f * Math.sin(lat1) + g * Math.sin(lat2);
    const lat = Math.atan2(z, Math.sqrt(x * x + y * y));
    const lng = Math.atan2(y, x);
    points.push({ latitude: toDeg(lat), longitude: toDeg(lng) });
  }
  return points;
}

/** Ambil koordinat rute driver (merchant → tujuan): coba OSRM encoded polyline (akurat), fallback geojson, fallback geodesik */
async function fetchRoutePolyline(
  origin: { latitude: number; longitude: number },
  destination: { latitude: number; longitude: number }
): Promise<Array<{ latitude: number; longitude: number }>> {
  try {
    const coords = `${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}`;
    const base = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full`;

    const urlEncoded = `${base}&geometries=polyline`;
    const resEncoded = await fetch(urlEncoded);
    const dataEncoded = await resEncoded.json();
    if (dataEncoded.code === "Ok" && dataEncoded.routes?.[0]?.geometry) {
      const decoded = decodePolyline(dataEncoded.routes[0].geometry, 5);
      if (decoded.length > 1) return decoded;
    }

    const urlGeo = `${base}&geometries=geojson`;
    const resGeo = await fetch(urlGeo);
    const dataGeo = await resGeo.json();
    if (dataGeo.code === "Ok" && dataGeo.routes?.[0]?.geometry?.coordinates?.length) {
      const coordsGeo = dataGeo.routes[0].geometry.coordinates as [number, number][];
      return coordsGeo.map(([lng, lat]) => ({ latitude: lat, longitude: lng }));
    }

    return [];
  } catch {
    return [];
  }
}

export const FnBOrderTrackingScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const horizontalPadding = getHorizontalPadding();
  const { activeOrder } = useFnBActiveOrder();

  const handleBack = () => {
    navigation.goBack();
  };

  const handleCallDriver = async () => {
    const driverPhone = activeOrder?.driver?.phoneNumber;
    if (!driverPhone?.trim()) {
      Alert.alert("Info", "Nomor driver belum tersedia.");
      return;
    }
    const url = `tel:${driverPhone.trim()}`;
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      Alert.alert("Error", "Tidak dapat membuka aplikasi telepon");
    }
  };

  const hasDriverPhone = Boolean(activeOrder?.driver?.phoneNumber?.trim());
  const driverName = activeOrder?.driver?.name ?? "Budi Santoso";
  const driverPlatText = activeOrder?.driver?.vehiclePlate
    ? `${activeOrder.driver.vehiclePlate} • Gojek`
    : "B 1234 XYZ • Gojek";

  const handleChatDriver = async () => {
    navigation.dispatch(
      CommonActions.navigate({
        name: "FnBChatDriver",
        params: { orderId: activeOrder?.id },
      }),
    );
  };

  if (!activeOrder) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
            paddingTop: insets.top + moderateVerticalScale(8),
          },
        ]}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <ArrowLeft2 size={scale(24)} color={colors.text} variant="Linear" />
          </TouchableOpacity>
        </View>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          Pesanan tidak ditemukan.
        </Text>
      </View>
    );
  }

  const mapImage = "https://i.stack.imgur.com/KzXGz.png";

  // Rute driver (garis di peta): default interpolasi geodesik merchant → tujuan; kalau OSRM sukses dipakai rute jalan (decoded polyline)
  const [routeCoordinates, setRouteCoordinates] = useState<Array<{ latitude: number; longitude: number }>>(() =>
    interpolateGeodesicPoints(MERCHANT_COORDS, DESTINATION_COORDS, 32)
  );
  useEffect(() => {
    if (Platform.OS === "web") return;
    let cancelled = false;
    fetchRoutePolyline(MERCHANT_COORDS, DESTINATION_COORDS).then((coords) => {
      if (!cancelled && coords.length > 1) setRouteCoordinates(coords);
    });
    return () => { cancelled = true; };
  }, []);

  // Posisi motor/driver: dari backend (driver.latitude/longitude) atau placeholder di atas rute
  const driverCoords =
    activeOrder?.driver?.latitude != null && activeOrder?.driver?.longitude != null
      ? { latitude: activeOrder.driver.latitude, longitude: activeOrder.driver.longitude }
      : routeCoordinates.length > 0
        ? routeCoordinates[Math.min(Math.floor(routeCoordinates.length * 0.35), routeCoordinates.length - 1)]
        : {
            latitude: (MERCHANT_COORDS.latitude + DESTINATION_COORDS.latitude) / 2,
            longitude: (MERCHANT_COORDS.longitude + DESTINATION_COORDS.longitude) / 2,
          };

  // Bottom sheet dari core: useDraggableBottomSheet (inline, bukan Modal) agar map tetap bisa zoom/geser
  const { height: sheetHeight, panResponder } = useDraggableBottomSheet([0.48, 0.72]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* MAP: full screen agar bisa zoom/geser; tidak tertutup ScrollView/Modal */}
      <View style={styles.mapContainer}>
        {Platform.OS === "web" ? (
          <Image
            source={{ uri: mapImage }}
            style={StyleSheet.absoluteFillObject}
            resizeMode="cover"
          />
        ) : (
          <MapView
            style={StyleSheet.absoluteFillObject}
            initialRegion={DEFAULT_REGION}
            showsUserLocation
            showsMyLocationButton={true}
            showsCompass={false}
            zoomEnabled={true}
            scrollEnabled={true}
            rotateEnabled={false}
          >
            {/* Garis rute: merchant → lokasi tujuan (selalu tampil; OSRM bisa gantikan dengan rute jalan) */}
            <Polyline
              coordinates={routeCoordinates}
              strokeColor={colors.primary ?? "#17C05D"}
              strokeWidth={5}
            />
            <Marker
              coordinate={MERCHANT_COORDS}
              title={activeOrder?.storeName || "Merchant"}
              pinColor={colors.primary}
            />
            {/* Marker posisi motor/driver (live dari backend atau placeholder) */}
            <Marker
              coordinate={driverCoords}
              title="Posisi motor"
              description={driverName}
              pinColor="#F59E0B"
            />
            <Marker
              coordinate={DESTINATION_COORDS}
              title="Lokasi kamu"
              description={activeOrder?.deliveryAddress}
            />
          </MapView>
        )}
      </View>

      {/* FLOATING HEADER */}
      <View
        style={[
          styles.headerFloating,
          {
            paddingTop: insets.top + moderateVerticalScale(8),
            paddingHorizontal: horizontalPadding,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.backButtonFloating,
            { backgroundColor: colors.surface },
          ]}
          onPress={handleBack}
        >
          <ArrowLeft2 size={scale(20)} color={colors.text} variant="Linear" />
        </TouchableOpacity>
      </View>

      {/* BOTTOM SHEET: inline pakai useDraggableBottomSheet dari @core/config (bukan Modal) supaya map bisa digeser/zoom */}
      <Animated.View
        style={[
          styles.bottomSheetWrap,
          {
            backgroundColor: colors.surface,
            height: sheetHeight,
            paddingBottom: insets.bottom + moderateVerticalScale(16),
          },
        ]}
      >
        <View style={styles.dragHandleWrap} {...panResponder.panHandlers}>
          <View style={[styles.dragHandle, { backgroundColor: colors.border }]} />
        </View>
        <ScrollView
          style={styles.sheetScroll}
          contentContainerStyle={styles.sheetContent}
          showsVerticalScrollIndicator={false}
        >
          {/* DRIVER INFO */}
          <View style={styles.driverSection}>
            <View style={styles.driverProfile}>
              <View
                style={[
                  styles.driverAvatarWrap,
                  { backgroundColor: colors.primaryLight },
                ]}
              >
                <TruckFast
                  size={scale(24)}
                  color={colors.primary}
                  variant="Bold"
                />
              </View>
              <View style={styles.driverMeta}>
                <Text style={[styles.driverName, { color: colors.text }]}>
                  {driverName}
                </Text>
                <Text
                  style={[styles.driverPlat, { color: colors.textSecondary }]}
                >
                  {driverPlatText}
                </Text>
              </View>
            </View>
            <View style={styles.driverActions}>
              <TouchableOpacity
                style={[styles.actionBtn, { borderColor: colors.border }]}
                onPress={handleChatDriver}
              >
                <MessageText
                  size={scale(20)}
                  color={colors.text}
                  variant="Bold"
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.actionBtn,
                  { borderColor: colors.border },
                  !hasDriverPhone && styles.actionBtnDisabled,
                ]}
                onPress={handleCallDriver}
                disabled={!hasDriverPhone}
              >
                <Call
                  size={scale(20)}
                  color={hasDriverPhone ? colors.text : colors.textSecondary}
                  variant="Bold"
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* ESTIMATION */}
          <View style={styles.estimationSection}>
            <Text style={[styles.estLabel, { color: colors.textSecondary }]}>
              Estimasi Tiba
            </Text>
            <View style={styles.estRow}>
              <Text style={[styles.estTime, { color: colors.text }]}>
                12:30
              </Text>
              <Text style={[styles.estAmPm, { color: colors.text }]}>WIB</Text>
            </View>
            <Text style={[styles.estDesc, { color: colors.textSecondary }]}>
              Driver sedang menuju lokasimu
            </Text>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* TRACKING PATH */}
          <View style={styles.trackingSection}>
            <Text style={[styles.estLabel, { color: colors.text }]}>
              Status Pengiriman
            </Text>

            <View style={styles.trackList}>
              <View style={styles.trackItem}>
                <View
                  style={[
                    styles.trackDotActive,
                    { backgroundColor: colors.primary },
                  ]}
                />
                <View style={styles.trackLine} />
                <View style={styles.trackContent}>
                  <Text
                    style={[styles.trackTitleActive, { color: colors.primary }]}
                  >
                    Driver Menuju Lokasimu
                  </Text>
                  <Text
                    style={[styles.trackTime, { color: colors.textSecondary }]}
                  >
                    12:15 WIB
                  </Text>
                </View>
              </View>

              <View style={styles.trackItem}>
                <View
                  style={[styles.trackDot, { backgroundColor: colors.border }]}
                />
                <View style={styles.trackLine} />
                <View style={styles.trackContent}>
                  <Text style={[styles.trackTitle, { color: colors.text }]}>
                    Pesanan Diambil oleh Driver
                  </Text>
                  <Text
                    style={[styles.trackTime, { color: colors.textSecondary }]}
                  >
                    12:10 WIB
                  </Text>
                </View>
              </View>

              <View style={styles.trackItem}>
                <View
                  style={[styles.trackDot, { backgroundColor: colors.border }]}
                />
                <View style={styles.trackContent}>
                  <Text style={[styles.trackTitle, { color: colors.text }]}>
                    Pesanan Siap Diambil
                  </Text>
                  <Text
                    style={[styles.trackTime, { color: colors.textSecondary }]}
                  >
                    12:00 WIB
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerFloating: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  backButtonFloating: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  mapContainer: {
    flex: 1,
  },
  bottomSheetWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: scale(20),
    borderTopRightRadius: scale(20),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 12,
  },
  dragHandleWrap: {
    alignItems: "center",
    paddingVertical: moderateVerticalScale(10),
  },
  dragHandle: {
    width: scale(40),
    height: scale(4),
    borderRadius: scale(2),
  },
  sheetScroll: {
    flex: 1,
  },
  sheetContent: {
    paddingHorizontal: scale(20),
    paddingBottom: scale(24),
  },
  driverSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: scale(12),
  },
  driverProfile: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: scale(12),
  },
  driverAvatarWrap: {
    width: scale(50),
    height: scale(50),
    borderRadius: scale(25),
    justifyContent: "center",
    alignItems: "center",
  },
  driverMeta: {
    flex: 1,
  },
  driverName: {
    fontSize: scale(14),
    fontFamily: FontFamily.monasans.bold,
    marginBottom: scale(2),
  },
  driverPlat: {
    fontSize: scale(12),
    fontFamily: FontFamily.monasans.medium,
  },
  driverActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(12),
  },
  actionBtn: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  actionBtnDisabled: {
    opacity: 0.6,
  },
  divider: {
    height: 1,
    marginVertical: scale(12),
  },
  estimationSection: {
    alignItems: "center",
  },
  estLabel: {
    fontSize: scale(12),
    fontFamily: FontFamily.monasans.semiBold,
    marginBottom: scale(6),
  },
  estRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: scale(4),
    marginBottom: scale(2),
  },
  estTime: {
    fontSize: scale(26),
    fontFamily: FontFamily.monasans.bold,
  },
  estAmPm: {
    fontSize: scale(14),
    fontFamily: FontFamily.monasans.semiBold,
  },
  estDesc: {
    fontSize: scale(12),
    fontFamily: FontFamily.monasans.regular,
  },
  trackingSection: {
    marginTop: scale(4),
  },
  trackList: {
    marginTop: scale(12),
    paddingLeft: scale(8),
  },
  trackItem: {
    flexDirection: "row",
    marginBottom: scale(18),
    position: "relative",
  },
  trackDotActive: {
    width: scale(14),
    height: scale(14),
    borderRadius: scale(7),
    borderWidth: 3,
    borderColor: "rgba(23, 192, 93, 0.2)", // Assuming a green-ish primary wrapper initially
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
    position: "absolute",
    left: scale(6),
    top: scale(20),
    bottom: -scale(30),
    width: 2,
    backgroundColor: "#EEEEEE",
  },
  trackContent: {
    marginLeft: scale(16),
    flex: 1,
  },
  trackTitleActive: {
    fontSize: scale(13),
    fontFamily: FontFamily.monasans.bold,
    marginBottom: scale(2),
  },
  trackTitle: {
    fontSize: scale(13),
    fontFamily: FontFamily.monasans.medium,
    marginBottom: scale(2),
  },
  trackTime: {
    fontSize: scale(12),
    fontFamily: FontFamily.monasans.regular,
  },
  emptyText: {
    fontSize: scale(15),
    fontFamily: FontFamily.monasans.medium,
    textAlign: "center",
    marginTop: scale(40),
  },
  header: {
    paddingHorizontal: scale(16),
    paddingVertical: scale(12),
  },
  backButton: {
    width: scale(40),
    height: scale(40),
    justifyContent: "center",
  },
});
