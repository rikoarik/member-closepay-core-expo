/**
 * Features Order - OrderItem Model
 * Model untuk item dalam order
 */

export interface Variant {
  id: string;
  name?: string;
  [key: string]: unknown;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  subtotal: number;
  variant?: Variant;
}

