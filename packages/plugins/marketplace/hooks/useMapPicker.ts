/**
 * useMapPicker
 * State untuk map pick point: region, selected lat/lng, reverse geocode result
 */

import { useState, useCallback, useRef } from 'react';
import type { Region } from 'react-native-maps';
import { geocodingService, type GeocodeResult } from '../services/geocodingService';

const DEFAULT_REGION: Region = {
  latitude: -6.2088,
  longitude: 106.8456,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

const DEBOUNCE_MS = 800;
/** Jarak minimal (derajat) agar reverse geocode dipanggil lagi; hindari get berkali-kali untuk gerakan kecil */
const MIN_MOVE_THRESHOLD = 0.0001;

export interface MapPickerState {
  region: Region;
  selectedLat: number;
  selectedLng: number;
  geocodeResult: GeocodeResult | null;
  isGeocoding: boolean;
}

export function useMapPicker(initialRegion?: Region) {
  const [region, setRegion] = useState<Region>(initialRegion ?? DEFAULT_REGION);
  const [selectedLat, setSelectedLat] = useState(initialRegion?.latitude ?? DEFAULT_REGION.latitude);
  const [selectedLng, setSelectedLng] = useState(initialRegion?.longitude ?? DEFAULT_REGION.longitude);
  const [geocodeResult, setGeocodeResult] = useState<GeocodeResult | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);
  const lastGeocodedRef = useRef<{ lat: number; lng: number } | null>(null);

  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    const id = ++requestIdRef.current;
    setIsGeocoding(true);
    try {
      const result = await geocodingService.reverseGeocode(lat, lng);
      if (id !== requestIdRef.current) return result;
      setGeocodeResult(result);
      lastGeocodedRef.current = { lat, lng };
      return result;
    } finally {
      if (id === requestIdRef.current) setIsGeocoding(false);
    }
  }, []);

  const onRegionChangeComplete = useCallback(
    (r: Region) => {
      setRegion(r);
      setSelectedLat(r.latitude);
      setSelectedLng(r.longitude);
      const last = lastGeocodedRef.current;
      const moved =
        !last ||
        Math.abs(r.latitude - last.lat) >= MIN_MOVE_THRESHOLD ||
        Math.abs(r.longitude - last.lng) >= MIN_MOVE_THRESHOLD;
      if (!moved) return;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        debounceRef.current = null;
        reverseGeocode(r.latitude, r.longitude);
      }, DEBOUNCE_MS);
    },
    [reverseGeocode]
  );

  const setCenter = useCallback(
    (lat: number, lng: number) => {
      const newRegion: Region = {
        latitude: lat,
        longitude: lng,
        latitudeDelta: region.latitudeDelta,
        longitudeDelta: region.longitudeDelta,
      };
      setRegion(newRegion);
      setSelectedLat(lat);
      setSelectedLng(lng);
      lastGeocodedRef.current = null;
      reverseGeocode(lat, lng);
    },
    [region.latitudeDelta, region.longitudeDelta, reverseGeocode]
  );

  const reset = useCallback((newRegion?: Region) => {
    const r = newRegion ?? DEFAULT_REGION;
    setRegion(r);
    setSelectedLat(r.latitude);
    setSelectedLng(r.longitude);
    setGeocodeResult(null);
    lastGeocodedRef.current = { lat: r.latitude, lng: r.longitude };
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
  }, []);

  return {
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
    DEFAULT_REGION,
  };
}
