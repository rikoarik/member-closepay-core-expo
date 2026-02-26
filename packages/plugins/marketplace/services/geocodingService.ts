/**
 * Geocoding Service
 * Reverse geocode (lat/lng → address) via Expo Location for map pick point
 */

import { Platform } from 'react-native';
import * as ExpoLocation from 'expo-location';
import type { Address } from '../models/Address';

export interface GeocodeResult {
  province: string;
  city: string;
  district: string;
  subDistrict: string;
  postalCode: string;
  fullAddress: string;
  street?: string;
}

function formatGeocodeAddress(geocode: ExpoLocation.LocationGeocodedAddress | null): GeocodeResult {
  const empty = {
    province: '',
    city: '',
    district: '',
    subDistrict: '',
    postalCode: '',
    fullAddress: '',
    street: '',
  };
  if (!geocode) return empty;
  const parts = [
    geocode.street,
    geocode.streetNumber,
    geocode.district,
    geocode.subregion,
    geocode.city,
    geocode.region,
    geocode.postalCode,
  ].filter(Boolean);
  return {
    province: geocode.region ?? '',
    city: geocode.city ?? geocode.subregion ?? '',
    district: geocode.district ?? '',
    subDistrict: geocode.subregion ?? '',
    postalCode: geocode.postalCode ?? '',
    fullAddress: parts.join(', ') || '',
    street: [geocode.street, geocode.streetNumber].filter(Boolean).join(' ') || undefined,
  };
}

export const geocodingService = {
  /**
   * Reverse geocode: latitude/longitude → address fields.
   * On web returns placeholder (no native API).
   */
  async reverseGeocode(latitude: number, longitude: number): Promise<GeocodeResult> {
    if (Platform.OS === 'web') {
      return {
        province: '',
        city: '',
        district: '',
        subDistrict: '',
        postalCode: '',
        fullAddress: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
      };
    }
    try {
      const [result] = await ExpoLocation.reverseGeocodeAsync({ latitude, longitude });
      return formatGeocodeAddress(result);
    } catch {
      return {
        province: '',
        city: '',
        district: '',
        subDistrict: '',
        postalCode: '',
        fullAddress: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
      };
    }
  },

  /**
   * Map GeocodeResult to partial Address (for form auto-fill).
   */
  toAddressFields(result: GeocodeResult): Pick<
    Address,
    'province' | 'city' | 'district' | 'subDistrict' | 'postalCode' | 'fullAddress'
  > {
    return {
      province: result.province,
      city: result.city,
      district: result.district,
      subDistrict: result.subDistrict,
      postalCode: result.postalCode,
      fullAddress: result.fullAddress,
    };
  },
};
