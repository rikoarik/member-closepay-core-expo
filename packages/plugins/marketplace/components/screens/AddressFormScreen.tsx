/**
 * AddressFormScreen
 * Tambah atau ubah alamat; bisa buka Map Picker untuk pin point
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { Location, ArrowLeft2, Map } from "iconsax-react-nativejs";
import {
  scale,
  moderateVerticalScale,
  getHorizontalPadding,
  FontFamily,
  ScreenHeader,
} from "@core/config";
import { useTheme } from "@core/theme";
import { useTranslation } from "@core/i18n";
import { useAddressBook } from "../../hooks/useAddressBook";
import type { Address, AddressLabel } from "../../models/Address";
import type { GeocodeResult } from "../../services/geocodingService";

type AddressFormRouteParams = {
  AddressForm: {
    addressId?: string;
    fromMapPicker?: boolean;
    latitude?: number;
    longitude?: number;
    geocodeResult?: GeocodeResult;
  };
};

const LABEL_OPTIONS: { value: AddressLabel; labelKey: string }[] = [
  { value: "home", labelKey: "marketplace.addressLabelHome" },
  { value: "office", labelKey: "marketplace.addressLabelOffice" },
  { value: "other", labelKey: "marketplace.addressLabelOther" },
];

export const AddressFormScreen: React.FC = () => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<AddressFormRouteParams, "AddressForm">>();
  const insets = useSafeAreaInsets();
  const horizontalPadding = getHorizontalPadding();
  const { getById, add, update, createBlank } = useAddressBook();

  const addressId = route.params?.addressId;
  const fromMapPicker = route.params?.fromMapPicker;
  const mapLat = route.params?.latitude;
  const mapLng = route.params?.longitude;
  const geocodeResult = route.params?.geocodeResult;

  const isEdit = !!addressId;
  const [loading, setLoading] = useState(!!addressId);
  const [saving, setSaving] = useState(false);

  const [label, setLabel] = useState<AddressLabel>("home");
  const [customLabel, setCustomLabel] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [latitude, setLatitude] = useState(0);
  const [longitude, setLongitude] = useState(0);
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [subDistrict, setSubDistrict] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [fullAddress, setFullAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [isDefault, setIsDefault] = useState(false);

  useEffect(() => {
    if (addressId) {
      const addr = getById(addressId);
      if (addr) {
        setLabel(addr.label);
        setCustomLabel(addr.customLabel ?? "");
        setRecipientName(addr.recipientName);
        setRecipientPhone(addr.recipientPhone);
        setLatitude(addr.latitude);
        setLongitude(addr.longitude);
        setProvince(addr.province);
        setCity(addr.city);
        setDistrict(addr.district);
        setSubDistrict(addr.subDistrict);
        setPostalCode(addr.postalCode);
        setFullAddress(addr.fullAddress);
        setNotes(addr.notes ?? "");
        setIsDefault(addr.isDefault);
      }
      setLoading(false);
    } else {
      const blank = createBlank("home");
      setRecipientName(blank.recipientName);
      setRecipientPhone(blank.recipientPhone);
      setLatitude(blank.latitude);
      setLongitude(blank.longitude);
      setProvince(blank.province);
      setCity(blank.city);
      setDistrict(blank.district);
      setSubDistrict(blank.subDistrict);
      setPostalCode(blank.postalCode);
      setFullAddress(blank.fullAddress);
      setIsDefault(blank.isDefault);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addressId]);

  useEffect(() => {
    if (fromMapPicker && geocodeResult && mapLat != null && mapLng != null) {
      setLatitude(mapLat);
      setLongitude(mapLng);
      setProvince(geocodeResult.province);
      setCity(geocodeResult.city);
      setDistrict(geocodeResult.district);
      setSubDistrict(geocodeResult.subDistrict);
      setPostalCode(geocodeResult.postalCode);
      setFullAddress(geocodeResult.fullAddress);
    }
  }, [fromMapPicker, geocodeResult, mapLat, mapLng]);

  const handlePickOnMap = () => {
    (navigation as any).navigate("MapPicker", {
      initialLat: latitude || undefined,
      initialLng: longitude || undefined,
    });
  };

  const handleSave = async () => {
    if (!recipientName.trim()) {
      Alert.alert(
        t("common.error"),
        t("marketplace.recipientName") + " wajib diisi.",
      );
      return;
    }
    if (!recipientPhone.trim()) {
      Alert.alert(
        t("common.error"),
        t("marketplace.recipientPhone") + " wajib diisi.",
      );
      return;
    }
    if (!fullAddress.trim()) {
      Alert.alert(
        t("common.error"),
        t("marketplace.fullAddress") + " wajib diisi.",
      );
      return;
    }
    setSaving(true);
    try {
      const payload = {
        label,
        customLabel: label === "other" ? customLabel : undefined,
        recipientName: recipientName.trim(),
        recipientPhone: recipientPhone.trim(),
        latitude,
        longitude,
        province,
        city,
        district,
        subDistrict,
        postalCode,
        fullAddress: fullAddress.trim(),
        notes: notes.trim() || undefined,
        isDefault,
      };
      if (isEdit && addressId) {
        await update(addressId, payload);
      } else {
        await add(payload);
      }
      navigation.goBack();
    } catch {
      Alert.alert(t("common.error"), "Gagal menyimpan alamat.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScreenHeader
          title={
            isEdit ? t("marketplace.editAddress") : t("marketplace.addAddress")
          }
          onBackPress={() => navigation.goBack()}
          style={{ paddingTop: insets.top, backgroundColor: colors.surface }}
          paddingHorizontal={horizontalPadding}
        />
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title={
          isEdit ? t("marketplace.editAddress") : t("marketplace.addAddress")
        }
        onBackPress={() => navigation.goBack()}
        style={{ paddingTop: insets.top, backgroundColor: colors.surface }}
        paddingHorizontal={horizontalPadding}
      />
      <KeyboardAwareScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: horizontalPadding,
            paddingBottom: insets.bottom + moderateVerticalScale(100),
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        enableOnAndroid
        enableAutomaticScroll
        extraScrollHeight={40}
        extraHeight={20}
      >
          <View
            style={[
              styles.section,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t("marketplace.addressLabel")}
            </Text>
            <View style={styles.labelRow}>
              {LABEL_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.labelChip,
                    {
                      backgroundColor:
                        label === opt.value
                          ? colors.primaryLight
                          : colors.background,
                      borderColor:
                        label === opt.value ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setLabel(opt.value)}
                >
                  <Text
                    style={[
                      styles.labelChipText,
                      {
                        color:
                          label === opt.value ? colors.primary : colors.text,
                      },
                    ]}
                  >
                    {t(opt.labelKey)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {label === "other" && (
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder="Label (misal: Kos)"
                placeholderTextColor={colors.textSecondary}
                value={customLabel}
                onChangeText={setCustomLabel}
                keyboardType="default"
              />
            )}
          </View>

          <View
            style={[
              styles.section,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t("marketplace.recipientName")}
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              placeholder={t("marketplace.recipientName")}
              placeholderTextColor={colors.textSecondary}
              value={recipientName}
              onChangeText={setRecipientName}
            />
            <Text
              style={[
                styles.sectionTitle,
                { color: colors.text, marginTop: scale(12) },
              ]}
            >
              {t("marketplace.recipientPhone")}
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              placeholder={t("marketplace.recipientPhone")}
              placeholderTextColor={colors.textSecondary}
              value={recipientPhone}
              onChangeText={setRecipientPhone}
              keyboardType="phone-pad"
            />
          </View>

          <View
            style={[
              styles.section,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {t("marketplace.fullAddress")}
              </Text>
              <TouchableOpacity
                onPress={handlePickOnMap}
                style={[
                  styles.mapButton,
                  { backgroundColor: colors.primaryLight },
                ]}
              >
                <Map size={scale(18)} color={colors.primary} variant="Bold" />
                <Text style={[styles.mapButtonText, { color: colors.primary }]}>
                  {t("marketplace.pickOnMap")}
                </Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={[
                styles.input,
                styles.inputMultiline,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              placeholder={t("marketplace.fullAddress")}
              placeholderTextColor={colors.textSecondary}
              value={fullAddress}
              onChangeText={setFullAddress}
              multiline
              numberOfLines={3}
            />
            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text
                  style={[styles.labelSmall, { color: colors.textSecondary }]}
                >
                  {t("marketplace.province")}
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  placeholder={t("marketplace.province")}
                  placeholderTextColor={colors.textSecondary}
                  value={province}
                  onChangeText={setProvince}
                />
              </View>
              <View style={styles.halfInput}>
                <Text
                  style={[styles.labelSmall, { color: colors.textSecondary }]}
                >
                  {t("marketplace.city")}
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  placeholder={t("marketplace.city")}
                  placeholderTextColor={colors.textSecondary}
                  value={city}
                  onChangeText={setCity}
                />
              </View>
            </View>
            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text
                  style={[styles.labelSmall, { color: colors.textSecondary }]}
                >
                  {t("marketplace.district")}
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  placeholder={t("marketplace.district")}
                  placeholderTextColor={colors.textSecondary}
                  value={district}
                  onChangeText={setDistrict}
                />
              </View>
              <View style={styles.halfInput}>
                <Text
                  style={[styles.labelSmall, { color: colors.textSecondary }]}
                >
                  {t("marketplace.postalCode")}
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  placeholder={t("marketplace.postalCode")}
                  placeholderTextColor={colors.textSecondary}
                  value={postalCode}
                  onChangeText={setPostalCode}
                  keyboardType="number-pad"
                />
              </View>
            </View>
            <Text style={[styles.labelSmall, { color: colors.textSecondary }]}>
              {t("marketplace.notesForCourier")}
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              placeholder={t("marketplace.notesForCourier")}
              placeholderTextColor={colors.textSecondary}
              value={notes}
              onChangeText={setNotes}
            />
          </View>

          <View
            style={[
              styles.section,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <TouchableOpacity
              style={[styles.defaultRow, { borderColor: colors.border }]}
              onPress={() => setIsDefault(!isDefault)}
              activeOpacity={0.8}
            >
              <Text style={[styles.defaultLabel, { color: colors.text }]}>
                {t("marketplace.setAsDefault")}
              </Text>
              <View
                style={[
                  styles.checkbox,
                  {
                    borderColor: colors.border,
                    backgroundColor: isDefault ? colors.primary : "transparent",
                  },
                ]}
              >
                {isDefault && <Text style={styles.checkmark}>✓</Text>}
              </View>
            </TouchableOpacity>
          </View>
      </KeyboardAwareScrollView>

      {/* Footer di luar scroll agar tidak overlap area form atas; tetap fixed di bawah layar */}
      <View
        style={[
          styles.footer,
          {
            backgroundColor: colors.surface,
            paddingBottom: insets.bottom + scale(16),
            paddingHorizontal: horizontalPadding,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.saveButton,
            { backgroundColor: colors.primary, opacity: saving ? 0.7 : 1 },
          ]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={styles.saveButtonText}>
              {t("common.save") || "Simpan"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  loadingWrap: { flex: 1, justifyContent: "center", alignItems: "center" },
  scroll: { flex: 1 },
  scrollContent: { paddingTop: moderateVerticalScale(16) },
  section: {
    borderRadius: scale(12),
    padding: scale(16),
    marginBottom: moderateVerticalScale(16),
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: scale(16),
    fontFamily: FontFamily.monasans.bold,
    marginBottom: scale(8),
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: scale(8),
  },
  labelRow: { flexDirection: "row", gap: scale(8), flexWrap: "wrap" },
  labelChip: {
    paddingHorizontal: scale(16),
    paddingVertical: scale(8),
    borderRadius: scale(20),
    borderWidth: 1,
  },
  labelChipText: {
    fontSize: scale(14),
    fontFamily: FontFamily.monasans.medium,
  },
  input: {
    borderRadius: scale(8),
    borderWidth: 1,
    marginTop: scale(8),
    padding: scale(12),
    fontSize: scale(14),
    fontFamily: FontFamily.monasans.regular,
  },
  inputMultiline: { minHeight: scale(80), textAlignVertical: "top" },
  labelSmall: {
    fontSize: scale(12),
    fontFamily: FontFamily.monasans.regular,
    marginBottom: scale(4),
  },
  row: { flexDirection: "row", gap: scale(12), marginTop: scale(12) },
  halfInput: { flex: 1 },
  mapButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
    paddingHorizontal: scale(12),
    paddingVertical: scale(8),
    borderRadius: scale(8),
  },
  mapButtonText: {
    fontSize: scale(13),
    fontFamily: FontFamily.monasans.semiBold,
  },
  defaultRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: scale(4),
    borderTopWidth: 1,
    marginTop: scale(4),
  },
  defaultLabel: { fontSize: scale(14), fontFamily: FontFamily.monasans.medium },
  checkbox: {
    width: scale(22),
    height: scale(22),
    borderRadius: scale(6),
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  checkmark: {
    color: "#FFF",
    fontSize: scale(14),
    fontFamily: FontFamily.monasans.bold,
  },
  footer: {
    paddingTop: scale(16),
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.06)",
  },
  saveButton: {
    paddingVertical: moderateVerticalScale(14),
    borderRadius: scale(12),
    alignItems: "center",
  },
  saveButtonText: {
    fontSize: scale(16),
    fontFamily: FontFamily.monasans.bold,
    color: "#FFF",
  },
});

export default AddressFormScreen;
