/**
 * FnB Dummy Data - Satu sumber data dummy untuk development/demo
 * Dipakai oleh useFnBData, FnBTab, dan FnBRecentOrders
 */

import type { FnBCategory } from '../models/FnBCategory';
import type { FnBItem } from '../models/FnBItem';
import type { FnBStore } from '../models/FnBStore';

export const DEFAULT_STORE_ID = 'store-001';

// ---------------------------------------------------------------------------
// Kategori
// ---------------------------------------------------------------------------
export const FNBDUMMY_CATEGORIES: FnBCategory[] = [
  { id: 'all', name: 'Semua', itemCount: 20 },
  { id: 'food', name: 'Makanan', icon: '🍔', itemCount: 12 },
  { id: 'drink', name: 'Minuman', icon: '🥤', itemCount: 6 },
  { id: 'snack', name: 'Snack', icon: '🍿', itemCount: 2 },
];

// ---------------------------------------------------------------------------
// Toko (full) - untuk useFnBData
// ---------------------------------------------------------------------------
export const FNBDUMMY_STORES: Record<string, FnBStore> = {
  'store-001': {
    id: 'store-001',
    name: 'Warung Makan Sederhana',
    description: 'Menyajikan makanan rumahan dengan cita rasa autentik',
    imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600',
    address: 'Jl. Contoh No. 123, Jakarta',
    operatingHours: [
      { dayOfWeek: 0, openTime: '10:00', closeTime: '21:00', isClosed: false },
      { dayOfWeek: 1, openTime: '08:00', closeTime: '22:00', isClosed: false },
      { dayOfWeek: 2, openTime: '08:00', closeTime: '22:00', isClosed: false },
      { dayOfWeek: 3, openTime: '08:00', closeTime: '22:00', isClosed: false },
      { dayOfWeek: 4, openTime: '08:00', closeTime: '22:00', isClosed: false },
      { dayOfWeek: 5, openTime: '08:00', closeTime: '23:00', isClosed: false },
      { dayOfWeek: 6, openTime: '08:00', closeTime: '23:00', isClosed: false },
    ],
    isOpen: true,
    delivery: {
      enabled: true,
      radius: 10,
      fee: 10000,
      freeDeliveryMinAmount: 100000,
    },
    orderTypes: ['dine-in', 'take-away', 'delivery'],
  },
  'store-002': {
    id: 'store-002',
    name: 'Burger King Clone',
    description: 'Fast Food dengan menu burger lezat dan ayam crispy',
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600',
    address: 'Jl. Fast Food No. 45, Jakarta',
    operatingHours: [
      { dayOfWeek: 0, openTime: '09:00', closeTime: '22:00', isClosed: false },
      { dayOfWeek: 1, openTime: '09:00', closeTime: '22:00', isClosed: false },
      { dayOfWeek: 2, openTime: '09:00', closeTime: '22:00', isClosed: false },
      { dayOfWeek: 3, openTime: '09:00', closeTime: '22:00', isClosed: false },
      { dayOfWeek: 4, openTime: '09:00', closeTime: '22:00', isClosed: false },
      { dayOfWeek: 5, openTime: '09:00', closeTime: '23:00', isClosed: false },
      { dayOfWeek: 6, openTime: '09:00', closeTime: '23:00', isClosed: false },
    ],
    isOpen: true,
    delivery: {
      enabled: true,
      radius: 15,
      fee: 8000,
      freeDeliveryMinAmount: 75000,
    },
    orderTypes: ['dine-in', 'take-away', 'delivery'],
  },
  'store-003': {
    id: 'store-003',
    name: 'Bakso Pak Kumis',
    description: 'Bakso legendaris dengan kuah kaldu sapi asli yang gurih',
    imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600',
    address: 'Jl. Bakso No. 88, Jakarta',
    operatingHours: [
      { dayOfWeek: 0, openTime: '17:00', closeTime: '23:00', isClosed: false },
      { dayOfWeek: 1, openTime: '17:00', closeTime: '23:00', isClosed: false },
      { dayOfWeek: 2, openTime: '17:00', closeTime: '23:00', isClosed: false },
      { dayOfWeek: 3, openTime: '17:00', closeTime: '23:00', isClosed: false },
      { dayOfWeek: 4, openTime: '17:00', closeTime: '23:00', isClosed: false },
      { dayOfWeek: 5, openTime: '17:00', closeTime: '23:00', isClosed: false },
      { dayOfWeek: 6, openTime: '17:00', closeTime: '23:00', isClosed: false },
    ],
    isOpen: true,
    delivery: {
      enabled: true,
      radius: 8,
      fee: 5000,
      freeDeliveryMinAmount: 50000,
    },
    orderTypes: ['take-away', 'delivery'],
  },
  'store-004': {
    id: 'store-004',
    name: 'Pizza Hut Delivery',
    description: 'Pizza dengan berbagai topping dan pasta lezat',
    imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600',
    address: 'Jl. Italia No. 99, Jakarta',
    operatingHours: [
      { dayOfWeek: 0, openTime: '10:00', closeTime: '22:00', isClosed: false },
      { dayOfWeek: 1, openTime: '10:00', closeTime: '22:00', isClosed: false },
      { dayOfWeek: 2, openTime: '10:00', closeTime: '22:00', isClosed: false },
      { dayOfWeek: 3, openTime: '10:00', closeTime: '22:00', isClosed: false },
      { dayOfWeek: 4, openTime: '10:00', closeTime: '22:00', isClosed: false },
      { dayOfWeek: 5, openTime: '10:00', closeTime: '23:00', isClosed: false },
      { dayOfWeek: 6, openTime: '10:00', closeTime: '23:00', isClosed: false },
    ],
    isOpen: true,
    delivery: {
      enabled: true,
      radius: 20,
      fee: 15000,
      freeDeliveryMinAmount: 150000,
    },
    orderTypes: ['dine-in', 'take-away', 'delivery'],
  },
};

// ---------------------------------------------------------------------------
// Item menu default (store-001 dan fallback)
// ---------------------------------------------------------------------------
const FNBDUMMY_ITEMS_DEFAULT: FnBItem[] = [
  {
    id: '1',
    name: 'Nasi Goreng Spesial',
    description: 'Nasi goreng dengan telur, ayam, dan sayuran segar',
    price: 25000,
    imageUrl: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400',
    category: 'food',
    rating: 4.8,
    sold: 150,
    isAvailable: true,
    preparationTime: 15,
    variants: [
      { id: 'v1', name: 'Porsi Reguler', price: 0 },
      { id: 'v2', name: 'Porsi Jumbo', price: 10000 },
    ],
    addons: [
      { id: 'a1', name: 'Telur Mata Sapi', price: 5000 },
      { id: 'a2', name: 'Kerupuk', price: 3000 },
    ],
  },
  {
    id: '2',
    name: 'Mie Ayam Bakso',
    description: 'Mie ayam dengan bakso sapi dan pangsit',
    price: 20000,
    imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400',
    category: 'food',
    rating: 4.6,
    sold: 120,
    isAvailable: true,
    preparationTime: 10,
  },
  {
    id: '3',
    name: 'Ayam Geprek',
    description: 'Ayam crispy dengan sambal geprek pedas',
    price: 22000,
    imageUrl: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400',
    category: 'food',
    rating: 4.7,
    sold: 200,
    isAvailable: true,
    preparationTime: 12,
    variants: [
      { id: 'v1', name: 'Level 1', price: 0 },
      { id: 'v2', name: 'Level 2', price: 0 },
      { id: 'v3', name: 'Level 3', price: 2000 },
    ],
  },
  {
    id: '4',
    name: 'Sate Ayam',
    description: '10 tusuk sate ayam dengan bumbu kacang',
    price: 30000,
    imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400',
    category: 'food',
    rating: 4.9,
    sold: 180,
    isAvailable: true,
    preparationTime: 20,
  },
  {
    id: '5',
    name: 'Es Teh Manis',
    description: 'Teh manis dingin segar',
    price: 8000,
    imageUrl: 'https://images.unsplash.com/photo-1499638673689-79a0b5115d87?w=400',
    category: 'drink',
    rating: 4.5,
    sold: 300,
    isAvailable: true,
    preparationTime: 3,
  },
  {
    id: '6',
    name: 'Es Jeruk',
    description: 'Jus jeruk segar dengan es',
    price: 12000,
    imageUrl: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400',
    category: 'drink',
    rating: 4.6,
    sold: 150,
    isAvailable: true,
    preparationTime: 5,
  },
  {
    id: '7',
    name: 'Kopi Susu',
    description: 'Kopi dengan susu segar',
    price: 15000,
    imageUrl: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400',
    category: 'drink',
    rating: 4.7,
    sold: 250,
    isAvailable: true,
    preparationTime: 5,
  },
  {
    id: '8',
    name: 'Kentang Goreng',
    description: 'French fries crispy dengan saus',
    price: 18000,
    imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400',
    category: 'snack',
    rating: 4.4,
    sold: 80,
    isAvailable: true,
    preparationTime: 8,
  },
  {
    id: '9',
    name: 'Burger Classic',
    description: 'Burger daging sapi dengan keju dan sayuran',
    price: 35000,
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400',
    category: 'food',
    rating: 4.8,
    sold: 95,
    isAvailable: true,
    preparationTime: 15,
    variants: [
      { id: 'v1', name: 'Single Patty', price: 0 },
      { id: 'v2', name: 'Double Patty', price: 15000 },
    ],
  },
  {
    id: '10',
    name: 'Pizza Margherita',
    description: 'Pizza dengan tomat, mozzarella, dan basil',
    price: 50000,
    imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400',
    category: 'food',
    rating: 4.9,
    sold: 70,
    isAvailable: false,
    preparationTime: 25,
  },
];

// ---------------------------------------------------------------------------
// Item per toko (storeId -> FnBItem[])
// ---------------------------------------------------------------------------
export const FNBDUMMY_STORE_ITEMS: Record<string, FnBItem[]> = {
  'store-001': FNBDUMMY_ITEMS_DEFAULT,
  'store-002': [
    {
      id: 'bk-1',
      name: 'Whopper Classic',
      description: 'Burger daging sapi panggang api legendaris dengan sayuran segar',
      price: 55000,
      imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400',
      category: 'food',
      rating: 4.8,
      sold: 500,
      isAvailable: true,
      preparationTime: 10,
    },
    {
      id: 'bk-2',
      name: 'Chicken Burger',
      description: 'Burger ayam crispy dengan selada dan mayones',
      price: 35000,
      imageUrl: 'https://images.unsplash.com/photo-1615297348958-81274497e17b?w=400',
      category: 'food',
      rating: 4.5,
      sold: 300,
      isAvailable: true,
      preparationTime: 8,
    },
    {
      id: 'bk-3',
      name: 'French Fries',
      description: 'Kentang goreng renyah dan gurih',
      price: 25000,
      imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400',
      category: 'snack',
      rating: 4.7,
      sold: 800,
      isAvailable: true,
      preparationTime: 5,
    },
    {
      id: 'bk-4',
      name: 'Cola Large',
      description: 'Minuman bersoda dingin ukuran besar',
      price: 18000,
      imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400',
      category: 'drink',
      rating: 4.6,
      sold: 600,
      isAvailable: true,
      preparationTime: 2,
    },
  ],
  'store-003': [
    {
      id: 'bpk-1',
      name: 'Bakso Urat Besar',
      description: 'Bakso urat sapi ukuran jumbo dengan mie kuning',
      price: 25000,
      imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400',
      category: 'food',
      rating: 4.9,
      sold: 1200,
      isAvailable: true,
      preparationTime: 5,
    },
    {
      id: 'bpk-2',
      name: 'Mie Ayam Bakso',
      description: 'Mie ayam pangsit dengan topping bakso halus',
      price: 22000,
      imageUrl: 'https://images.unsplash.com/photo-1598514983318-2f64f8f4796c?w=400',
      category: 'food',
      rating: 4.8,
      sold: 450,
      isAvailable: true,
      preparationTime: 5,
    },
    {
      id: 'bpk-3',
      name: 'Es Jeruk',
      description: 'Es jeruk peras segar',
      price: 8000,
      imageUrl: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=400',
      category: 'drink',
      rating: 4.6,
      sold: 2000,
      isAvailable: true,
      preparationTime: 2,
    },
  ],
  'store-004': [
    {
      id: 'ph-1',
      name: 'Super Supreme Pizza',
      description: 'Pizza dengan topping daging sapi, ayam, jamur, paprika',
      price: 120000,
      imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400',
      category: 'food',
      rating: 4.8,
      sold: 350,
      isAvailable: true,
      preparationTime: 25,
    },
    {
      id: 'ph-2',
      name: 'Meat Lovers Pizza',
      description: 'Pizza dengan limpahan daging sapi, sosis, dan burger',
      price: 125000,
      imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400',
      category: 'food',
      rating: 4.9,
      sold: 400,
      isAvailable: true,
      preparationTime: 25,
    },
    {
      id: 'ph-3',
      name: 'Cheese Rolls',
      description: 'Roti gulung isi keju mozzarella leleh',
      price: 35000,
      imageUrl: 'https://images.unsplash.com/photo-1581454051034-be817e828d02?w=400',
      category: 'snack',
      rating: 4.7,
      sold: 500,
      isAvailable: true,
      preparationTime: 10,
    },
  ],
};

// ---------------------------------------------------------------------------
// Daftar toko untuk Tab (FnBTab) - id, name, description, rating, distance, isOpen, openTime, closeTime, category
// ---------------------------------------------------------------------------
export interface FnBStoreListItem {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  rating: number;
  distance: string;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
  category: string;
}

export const FNBDUMMY_STORE_LIST_TAB: FnBStoreListItem[] = [
  {
    id: 'store-001',
    name: 'Warung Makan Sederhana',
    description: 'Makanan rumahan autentik',
    imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600',
    rating: 4.8,
    distance: '0.5 km',
    isOpen: true,
    openTime: '08:00',
    closeTime: '22:00',
    category: 'Makanan',
  },
  {
    id: 'store-002',
    name: 'Burger King Clone',
    description: 'Fast Food burger & ayam crispy',
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600',
    rating: 4.5,
    distance: '1.2 km',
    isOpen: true,
    openTime: '09:00',
    closeTime: '22:00',
    category: 'Makanan',
  },
  {
    id: 'store-003',
    name: 'Bakso Pak Kumis',
    description: 'Bakso dan mie ayam legendaris',
    imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600',
    rating: 4.9,
    distance: '1.2 km',
    isOpen: false,
    openTime: '10:00',
    closeTime: '21:00',
    category: 'Makanan',
  },
  {
    id: 'store-004',
    name: 'Pizza Hut Delivery',
    description: 'Pizza dan pasta',
    imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600',
    rating: 4.7,
    distance: '1.5 km',
    isOpen: true,
    openTime: '16:00',
    closeTime: '22:00',
    category: 'Makanan',
  },
];

// ---------------------------------------------------------------------------
// Pesanan terakhir (widget FnBRecentOrders)
// ---------------------------------------------------------------------------
export interface FnBRecentOrderItem {
  id: string;
  store: string;
  date: string;
}

export const FNBDUMMY_RECENT_ORDERS: FnBRecentOrderItem[] = [
  { id: '1', store: 'Warung Makan Sederhana', date: 'Hari ini' },
  { id: '2', store: 'Burger King Clone', date: 'Kemarin' },
  { id: '3', store: 'Bakso Pak Kumis', date: '2 hari lalu' },
];
