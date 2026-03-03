/**
 * Root Expo app config.
 * Reads EXPO_PUBLIC_* env and exposes them as extra for Config.ts (expo-constants).
 */
module.exports = ({ config }) => {
  const extra = {
    API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || '',
    API_STG_BASE_URL: process.env.EXPO_PUBLIC_API_STG_BASE_URL || '',
    API_PROD_BASE_URL: process.env.EXPO_PUBLIC_API_PROD_BASE_URL || '',
    ENV: process.env.EXPO_PUBLIC_ENV || 'development',
    ANDROID_CERTIFICATE_HASH: process.env.EXPO_PUBLIC_ANDROID_CERTIFICATE_HASH || '',
    IOS_APP_TEAM_ID: process.env.EXPO_PUBLIC_IOS_APP_TEAM_ID || '',
    TALSEC_WATCHER_MAIL: process.env.EXPO_PUBLIC_TALSEC_WATCHER_MAIL || '',
    SUPPORT_WHATSAPP_NUMBER: process.env.EXPO_PUBLIC_SUPPORT_WHATSAPP_NUMBER || '',
    SUPPORT_EMAIL: process.env.EXPO_PUBLIC_SUPPORT_EMAIL || '',
    ANDROID_PACKAGE_NAME: process.env.EXPO_PUBLIC_ANDROID_PACKAGE_NAME || '',
    IOS_BUNDLE_ID: process.env.EXPO_PUBLIC_IOS_BUNDLE_ID || '',
  };

  // Expo full: only Expo SDK plugins so the app runs in Expo Go.
  // For dev client / production build with BLE, NFC, FreeRASP, add those plugins back.
  const plugins = [
    ...(Array.isArray(config.plugins) ? config.plugins : []),
    [
      'expo-camera',
      {
        cameraPermission: 'Aplikasi memerlukan kamera untuk scan QR code dan barcode serta mengambil foto profil.',
        microphonePermission: 'Aplikasi memerlukan mikrofon untuk merekam video.',
        recordAudioAndroid: true,
      },
    ],
    [
      'expo-image-picker',
      {
        photosPermission: 'Aplikasi memerlukan akses galeri untuk memilih foto profil dan gambar QR.',
        cameraPermission: 'Aplikasi memerlukan kamera untuk mengambil foto profil.',
      },
    ],
  ];

  return {
    ...config,
    extra: { ...(config.extra || {}), ...extra },
    plugins,
    ios: {
      ...config.ios,
      infoPlist: {
        ...(config.ios?.infoPlist || {}),
        NSCameraUsageDescription: 'Aplikasi memerlukan kamera untuk scan QR code, barcode, dan mengambil foto profil.',
        NSPhotoLibraryUsageDescription: 'Aplikasi memerlukan akses galeri untuk memilih foto profil dan gambar QR.',
        NSMicrophoneUsageDescription: 'Aplikasi memerlukan mikrofon untuk merekam video.',
        NSLocationWhenInUseUsageDescription: 'Aplikasi memerlukan lokasi untuk fitur toko terdekat dan pemindaian perangkat Bluetooth (BLE).',
        NSBluetoothAlwaysUsageDescription: 'Aplikasi memerlukan Bluetooth untuk terhubung dengan perangkat pembayaran NFC/kartu.',
        NSBluetoothPeripheralUsageDescription: 'Aplikasi memerlukan Bluetooth untuk terhubung dengan perangkat pembayaran NFC/kartu.',
        NFCReaderUsageDescription: 'Aplikasi menggunakan NFC untuk pembayaran dan membaca kartu.',
      },
    },
    android: {
      ...config.android,
      permissions: [
        'android.permission.CAMERA',
        'android.permission.RECORD_AUDIO',
        'android.permission.READ_MEDIA_IMAGES',
        'android.permission.READ_EXTERNAL_STORAGE',
        'android.permission.NFC',
        'android.permission.BLUETOOTH',
        'android.permission.BLUETOOTH_SCAN',
        'android.permission.BLUETOOTH_CONNECT',
        'android.permission.ACCESS_FINE_LOCATION',
        'android.permission.ACCESS_COARSE_LOCATION',
        'android.permission.POST_NOTIFICATIONS',
        ...(config.android?.permissions || []),
      ],
    },
  };
};
