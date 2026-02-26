/**
 * AddressListScreen
 * Daftar alamat tersimpan; pilih untuk checkout atau tambah/ubah/hapus
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Location, Add, Edit2, Trash, TickCircle } from 'iconsax-react-nativejs';
import { scale, moderateVerticalScale, getHorizontalPadding, FontFamily, ScreenHeader } from '@core/config';
import { useTheme } from '@core/theme';
import { useTranslation } from '@core/i18n';
import { useAddressBook } from '../../hooks/useAddressBook';
import { getAddressDisplayLabel, type Address, type AddressLabel } from '../../models/Address';

type AddressListRouteParams = {
  AddressList: { forCheckout?: boolean };
};

export const AddressListScreen: React.FC = () => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<AddressListRouteParams, 'AddressList'>>();
  const insets = useSafeAreaInsets();
  const horizontalPadding = getHorizontalPadding();
  const forCheckout = route.params?.forCheckout === true;

  const { addresses, defaultAddress, loading, setDefault, remove } = useAddressBook();

  const handleSelect = (address: Address) => {
    if (forCheckout) {
      (navigation as any).navigate('Checkout', { selectedAddressId: address.id });
      return;
    }
    navigation.goBack();
  };

  const handleAdd = () => {
    (navigation as any).navigate('AddressForm', {});
  };

  const handleEdit = (address: Address) => {
    (navigation as any).navigate('AddressForm', { addressId: address.id });
  };

  const handleDelete = (address: Address) => {
    Alert.alert(
      t('common.delete') || 'Hapus',
      `Hapus alamat "${getAddressDisplayLabel(address.label, address.customLabel)}"?`,
      [
        { text: t('common.cancel') || 'Batal', style: 'cancel' },
        {
          text: t('common.delete') || 'Hapus',
          style: 'destructive',
          onPress: () => remove(address.id),
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: Address }) => {
    const isDefault = defaultAddress?.id === item.id;
    const labelText = getAddressDisplayLabel(item.label, item.customLabel);
    const shortAddress = [item.fullAddress, item.district, item.city].filter(Boolean).join(', ');

    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderColor: isDefault ? colors.primary : colors.border,
            borderWidth: isDefault ? 2 : 1,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.cardContent}
          onPress={() => handleSelect(item)}
          activeOpacity={0.8}
        >
          <View style={styles.cardHeader}>
            <Text style={[styles.labelBadge, { color: colors.primary, backgroundColor: colors.primaryLight }]}>
              {labelText}
            </Text>
            {isDefault && (
              <View style={[styles.defaultBadge, { backgroundColor: colors.primary }]}>
                <TickCircle size={scale(12)} color="#FFF" variant="Bold" />
                <Text style={styles.defaultText}>{t('marketplace.defaultAddress')}</Text>
              </View>
            )}
          </View>
          <Text style={[styles.recipientName, { color: colors.text }]}>{item.recipientName}</Text>
          <Text style={[styles.recipientPhone, { color: colors.textSecondary }]}>{item.recipientPhone}</Text>
          <Text style={[styles.addressLine, { color: colors.text }]} numberOfLines={2}>
            {shortAddress || item.fullAddress}
          </Text>
        </TouchableOpacity>
        <View style={[styles.cardActions, { borderTopColor: colors.border }]}>
          {!isDefault && (
            <TouchableOpacity onPress={() => setDefault(item.id)} style={styles.actionBtn}>
              <TickCircle size={scale(18)} color={colors.primary} variant="Linear" />
              <Text style={[styles.actionText, { color: colors.primary }]}>{t('marketplace.setAsDefault')}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => handleEdit(item)} style={styles.actionBtn}>
            <Edit2 size={scale(18)} color={colors.text} variant="Linear" />
            <Text style={[styles.actionText, { color: colors.text }]}>{t('common.edit') || 'Ubah'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(item)} style={styles.actionBtn}>
            <Trash size={scale(18)} color={colors.error || '#FF3B30'} variant="Linear" />
            <Text style={[styles.actionText, { color: colors.error || '#FF3B30' }]}>{t('common.delete') || 'Hapus'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScreenHeader
          title={t('marketplace.addressList')}
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
        title={t('marketplace.addressList')}
        onBackPress={() => navigation.goBack()}
        rightComponent={
          <TouchableOpacity onPress={handleAdd} style={styles.addButton}>
            <Add size={scale(22)} color={colors.primary} variant="Bold" />
            <Text style={[styles.addButtonText, { color: colors.primary }]}>{t('marketplace.addAddress')}</Text>
          </TouchableOpacity>
        }
        style={{ paddingTop: insets.top, backgroundColor: colors.surface }}
        paddingHorizontal={horizontalPadding}
      />
      {addresses.length === 0 ? (
        <View style={[styles.empty, { paddingHorizontal: horizontalPadding }]}>
          <Location size={scale(48)} color={colors.textSecondary} variant="Linear" />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {t('marketplace.noAddressYet')}
          </Text>
          <TouchableOpacity
            style={[styles.addAddressButton, { backgroundColor: colors.primary }]}
            onPress={handleAdd}
          >
            <Text style={styles.addAddressButtonText}>{t('marketplace.addAddress')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={addresses}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            { paddingHorizontal: horizontalPadding, paddingBottom: insets.bottom + moderateVerticalScale(24) },
          ]}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingTop: moderateVerticalScale(16), gap: scale(12) },
  card: {
    borderRadius: scale(12),
    overflow: 'hidden',
    marginBottom: scale(12),
  },
  cardContent: { padding: scale(16) },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: scale(8), marginBottom: scale(8) },
  labelBadge: {
    fontSize: scale(12),
    fontFamily: FontFamily.monasans.semiBold,
    paddingHorizontal: scale(8),
    paddingVertical: scale(4),
    borderRadius: scale(6),
  },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(4),
    paddingHorizontal: scale(8),
    paddingVertical: scale(4),
    borderRadius: scale(6),
  },
  defaultText: {
    fontSize: scale(11),
    fontFamily: FontFamily.monasans.semiBold,
    color: '#FFF',
  },
  recipientName: {
    fontSize: scale(16),
    fontFamily: FontFamily.monasans.bold,
    marginBottom: scale(4),
  },
  recipientPhone: { fontSize: scale(14), fontFamily: FontFamily.monasans.regular, marginBottom: scale(4) },
  addressLine: { fontSize: scale(14), fontFamily: FontFamily.monasans.regular },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(16),
    paddingVertical: scale(8),
    borderTopWidth: 1,
    gap: scale(16),
  },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: scale(6) },
  actionText: { fontSize: scale(13), fontFamily: FontFamily.monasans.medium },
  addButton: { flexDirection: 'row', alignItems: 'center', gap: scale(6) },
  addButtonText: { fontSize: scale(14), fontFamily: FontFamily.monasans.semiBold },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: scale(40) },
  emptyText: {
    fontSize: scale(16),
    fontFamily: FontFamily.monasans.regular,
    textAlign: 'center',
    marginTop: scale(16),
    marginBottom: scale(24),
  },
  addAddressButton: {
    paddingHorizontal: scale(24),
    paddingVertical: scale(12),
    borderRadius: scale(12),
  },
  addAddressButtonText: {
    fontSize: scale(16),
    fontFamily: FontFamily.monasans.semiBold,
    color: '#FFF',
  },
});

export default AddressListScreen;
