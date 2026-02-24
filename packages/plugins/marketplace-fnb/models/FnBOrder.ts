/**
 * FnB Order Model
 * Represents an order with items, order type, and customer info
 */

import type { FnBItem, FnBVariant, FnBAddon } from './FnBItem';

export type OrderType = 'dine-in' | 'take-away' | 'delivery';
export type EntryPoint = 'scan-qr' | 'browse';
export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';

/** Driver info from tracking/order detail API (e.g. relay phone for call) */
export interface FnBOrderDriver {
    name?: string;
    phoneNumber?: string;
    vehiclePlate?: string;
    /** Live position untuk tracking motor di peta (dari backend/websocket) */
    latitude?: number;
    longitude?: number;
}

export interface FnBOrderItem {
    item: FnBItem;
    quantity: number;
    variant?: FnBVariant;
    addons?: FnBAddon[];
    notes?: string;
    subtotal: number;
}

export interface FnBOrder {
    id: string;
    storeId: string;
    storeName?: string; // for display in widget and status screen
    items: FnBOrderItem[];
    orderType: OrderType;
    entryPoint: EntryPoint;
    customerName: string;
    tableNumber?: string; // for dine-in
    deliveryAddress?: string; // for delivery
    phoneNumber?: string; // for delivery
    pickupTime?: string; // for take-away
    subtotal: number;
    deliveryFee?: number;
    serviceFee?: number;
    total: number;
    status: OrderStatus;
    createdAt: string;
    /** Set when delivery is assigned; phoneNumber may be relay from backend */
    driver?: FnBOrderDriver;
}

/**
 * Get available order types based on entry point
 */
export const getAvailableOrderTypes = (entryPoint: EntryPoint): OrderType[] => {
    if (entryPoint === 'scan-qr') {
        // User is at the store - can dine-in or take away, but not delivery
        return ['dine-in', 'take-away'];
    }
    // User is browsing via app - can take away or delivery, but not dine-in
    return ['take-away', 'delivery'];
};
