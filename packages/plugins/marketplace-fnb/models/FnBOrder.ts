/**
 * FnB Order Model
 * Represents an order with items, order type, and customer info
 */

import type { FnBItem, FnBVariant, FnBAddon } from './FnBItem';

export type OrderType = 'dine-in' | 'take-away' | 'delivery';
export type EntryPoint = 'scan-qr' | 'browse';
export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';

export type FnBPaymentMethod = 'pay_at_counter' | 'pay_later' | 'balance';
export type FnBBalanceType = 'saldo-makan' | 'saldo-utama' | 'saldo-plafon';

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
    /** How the order is paid: at counter, later, or with balance */
    paymentMethod: FnBPaymentMethod;
    /** When paymentMethod === 'balance', which balance type was used */
    balanceType?: FnBBalanceType;
}

/** Company config shape for order types (browse only); scan-qr ignores this */
export interface FnBOrderTypesConfig {
    allowedOrderTypes?: OrderType[];
}

/**
 * Get available order types based on entry point and optional company config.
 * Scan QR: always dine-in + take-away. Browse: from config or default.
 */
export const getAvailableOrderTypes = (
    entryPoint: EntryPoint,
    companyConfig?: FnBOrderTypesConfig | null
): OrderType[] => {
    if (entryPoint === 'scan-qr') {
        return ['dine-in', 'take-away'];
    }
    const allowed = companyConfig?.allowedOrderTypes;
    if (allowed && allowed.length > 0) return allowed;
    return ['take-away', 'delivery'];
};
