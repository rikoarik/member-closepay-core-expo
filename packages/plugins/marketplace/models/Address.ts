/**
 * Address Model
 * Alamat pengiriman dengan label, koordinat, dan detail administratif
 */

export type AddressLabel = 'home' | 'office' | 'other';

export interface Address {
  id: string;
  label: AddressLabel;
  customLabel?: string;

  recipientName: string;
  recipientPhone: string;

  latitude: number;
  longitude: number;

  province: string;
  city: string;
  district: string;
  subDistrict: string;
  postalCode: string;

  fullAddress: string;
  notes?: string;

  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export function getAddressDisplayLabel(label: AddressLabel, customLabel?: string): string {
  if (label === 'other' && customLabel?.trim()) return customLabel.trim();
  const map: Record<AddressLabel, string> = {
    home: 'Rumah',
    office: 'Kantor',
    other: 'Lainnya',
  };
  return map[label];
}
