/**
 * FnB Store Model
 * Represents a food/beverage store with operating hours and delivery settings
 */

import type { OrderType } from './FnBOrder';

export interface OperatingHour {
    dayOfWeek: number; // 0=Sunday, 1=Monday, 2=Tuesday...
    openTime: string; // "08:00"
    closeTime: string; // "22:00"
    isClosed: boolean; // for holidays
}

export interface DeliverySettings {
    enabled: boolean;
    radius?: number; // in km, null = no limit
    fee: number;
    freeDeliveryMinAmount?: number;
}

export interface FnBStore {
    id: string;
    name: string;
    description?: string;
    imageUrl?: string;
    address: string;
    operatingHours: OperatingHour[];
    isOpen: boolean; // calculated based on current time
    delivery: DeliverySettings;
    orderTypes: OrderType[];
}

/**
 * QR Code data format (1 QR per store; optional table when QR is store+table)
 */
export interface FnBQRData {
    type: 'fnb-store';
    storeId: string;
    storeName: string;
    /** Set when QR encodes store + table (e.g. closepay://fnb/store-id/table/12) */
    tableNumber?: string;
}

/**
 * Check if store is currently open based on operating hours
 */
export const isStoreOpen = (store: FnBStore): boolean => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const todayHours = store.operatingHours.find((h) => h.dayOfWeek === dayOfWeek);

    if (!todayHours || todayHours.isClosed) {
        return false;
    }

    return currentTime >= todayHours.openTime && currentTime <= todayHours.closeTime;
};

/**
 * Parse QR code string to FnBQRData (store or store+table)
 */
export const parseFnBQRCode = (qrString: string): FnBQRData | null => {
    try {
        // Try URL format: closepay://fnb/store-id or closepay://fnb/store-id/table/12
        if (qrString.startsWith('closepay://fnb/')) {
            const path = qrString.replace('closepay://fnb/', '');
            const parts = path.split('/').filter(Boolean);
            const storeId = parts[0] ?? '';
            if (!storeId) return null;
            let tableNumber: string | undefined;
            const tableIdx = parts.indexOf('table');
            if (tableIdx >= 0 && parts[tableIdx + 1]) tableNumber = parts[tableIdx + 1];
            return { type: 'fnb-store', storeId, storeName: '', tableNumber };
        }

        // Try JSON format
        const data = JSON.parse(qrString);
        if (data.type === 'fnb-store' && data.storeId) {
            return data as FnBQRData;
        }

        return null;
    } catch {
        return null;
    }
};

/**
 * Parse QR that contains only table number (for "Scan meja" in checkout).
 * Formats: closepay://fnb/table/12 or JSON { type: 'fnb-table', tableNumber: '12' }
 */
export const parseFnBTableQRCode = (qrString: string): string | null => {
    try {
        if (qrString.startsWith('closepay://fnb/table/')) {
            const num = qrString.replace('closepay://fnb/table/', '').split('/')[0]?.trim();
            return num || null;
        }
        const data = JSON.parse(qrString);
        if (data.type === 'fnb-table' && data.tableNumber != null) {
            return String(data.tableNumber).trim() || null;
        }
        return null;
    } catch {
        return null;
    }
};
