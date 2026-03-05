/**
 * FnB Discovery merchants list – shared between FnBScreen and FnB Product Search.
 */

export interface DiscoveryMerchant {
  id: string;
  name: string;
  time: string;
  description: string;
  rating: number;
  ratingCount: string;
  distance: string;
  deliveryFee: string;
  promoLabel?: string;
  imageUrl: string;
}

export const FNBDISCOVERY_MERCHANTS: DiscoveryMerchant[] = [
  {
    id: "store-001",
    name: "KFC, Salatiga",
    time: "20-30 min",
    description: "American • Fried Chicken",
    rating: 4.8,
    ratingCount: "34rb+",
    distance: "1.2 km",
    deliveryFee: "Ongkir 15rb",
    promoLabel: "Diskon 33%, maks. 28rb",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCvkxFChGMIqGhKSSuFDoQgJ2kTNdu_eGm55B4msAG62ce9SCHkmheTU1GEoy6teblqJHTFPz-h8uCtcc6n06L16xhqpVhDfBp16uyghpTCZALvhThQ9ekCqJuPAf4PJZc7YZzjaYf7o_H5SCCdEbR0bKxvTGi9uJa8PnoF5UuEEp7j_joFAyxKhZ5Mwd_cAwxSzlyBsitipgJwkOm6FFjB5xiZKIRhRc9M7pLTX0mIOdaiL-9vUalNb_jPIOw2mfRq02PvKiul0gl7",
  },
  {
    id: "store-002",
    name: "Waroeng Lada Hitam, Kalicacing",
    time: "15-25 min",
    description: "Indonesian • Nasi • Lauk",
    rating: 4.8,
    ratingCount: "32rb+",
    distance: "3.5 km",
    deliveryFee: "Diskon ongkir 14.9rb",
    promoLabel: "Diskon 45%, maks. 86rb",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAJaihUMJ4cZeYMR-9IWZL8AM_zRIJLjvp2s62UvSXG9QUFQCbm9eObPadR_-hGnDFmc9PVw8Vc4zxvPuQmw7LxZIfGe73vXYhvd_X5C4JT6HByLMFdwe6xb989DiSIWxeP8EIzO6FhdtMVF626GKoWZzIB7HuTog9e1Bz9KgcuLWfJVYaE5eJair6WyAdiafC_MLARKzuPLYfXZJfgz9c49TDdgptro0tRCKBihg_30LdQapMyViPRu9uoq1AM3OJQSBgb6paCHuiP",
  },
  {
    id: "store-003",
    name: "Daily Dose Coffee",
    time: "15-25 min",
    description: "Cafe • Beverages • Pastry",
    rating: 4.9,
    ratingCount: "12rb+",
    distance: "0.8 km",
    deliveryFee: "Gratis ongkir",
    promoLabel: "Promo Available",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCYcqwHU48mVBh7AMArNvi92S8ilr-WnvpkB7erlrK1UtCvU-L-1QABzNc6FYK65BFE8BiFNq6_gNHNZ-aVi_-zTIk25zygmQPHPCKl5PkuR53lXJPjkfVRJXxOdK26CqUMeINaTi9_hbseDh_G_Y5DE4gCUJpz47X42IRxVn4nK0rpFU4dAJ7FO0cmV9-TgoK3lXZNzgBkjnTOR5rsWF3nuL1b2TYN3M3-a03iCDMWDqEinmID7tqjQs0YdWky4CK0csnq4qOHc-ad",
  },
  {
    id: "store-004",
    name: "Bakso Pak Kumis",
    time: "10-20 min",
    description: "Indonesian • Bakso • Mie",
    rating: 4.7,
    ratingCount: "28rb+",
    distance: "2.1 km",
    deliveryFee: "Ongkir 10rb",
    promoLabel: "Beli 2 gratis 1",
    imageUrl:
      "https://images.unsplash.com/photo-1555126634-323283e090fa?w=400&h=400&fit=crop",
  },
  {
    id: "store-005",
    name: "Sate Madura Pak Haji",
    time: "25-35 min",
    description: "Indonesian • Sate • Nasi",
    rating: 4.6,
    ratingCount: "18rb+",
    distance: "4.0 km",
    deliveryFee: "Ongkir 12rb",
    promoLabel: "Diskon 20%",
    imageUrl:
      "https://images.unsplash.com/photo-1529563021893-cc83c992d75d?w=400&h=400&fit=crop",
  },
  {
    id: "store-006",
    name: "Martabak San Francisco",
    time: "20-30 min",
    description: "Snack • Martabak • Dessert",
    rating: 4.9,
    ratingCount: "45rb+",
    distance: "1.5 km",
    deliveryFee: "Gratis ongkir",
    promoLabel: "Best seller!",
    imageUrl:
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=400&fit=crop",
  },
  {
    id: "store-007",
    name: "Nasi Goreng Kebon Sirih",
    time: "15-20 min",
    description: "Indonesian • Nasi Goreng",
    rating: 4.5,
    ratingCount: "22rb+",
    distance: "2.8 km",
    deliveryFee: "Ongkir 8rb",
    promoLabel: "Porsi jumbo!",
    imageUrl:
      "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&h=400&fit=crop",
  },
  {
    id: "store-008",
    name: "Geprek Bensu",
    time: "15-25 min",
    description: "Indonesian • Ayam Geprek",
    rating: 4.4,
    ratingCount: "51rb+",
    distance: "1.9 km",
    deliveryFee: "Diskon ongkir 5rb",
    promoLabel: "Diskon 25%, maks. 15rb",
    imageUrl:
      "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=400&h=400&fit=crop",
  },
];

/** Recommendation keywords for search screen (categories / popular terms). */
export const FNBDISCOVERY_RECOMMENDATIONS = [
  "Nasi Goreng",
  "Bakso",
  "Kopi",
  "Ayam Geprek",
  "Martabak",
  "Sate",
  "Burger",
  "Pizza",
];
