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

  const plugins = [
    ...(Array.isArray(config.plugins) ? config.plugins : []),
    ['freerasp-react-native/app.plugin.js', { android: { minSdkVersion: '23', R8Version: '8.3.37' } }],
    'react-native-ble-plx',
    'react-native-nfc-manager',
  ];

  return {
    ...config,
    extra: { ...(config.extra || {}), ...extra },
    plugins,
    ios: {
      ...config.ios,
      infoPlist: {
        ...(config.ios?.infoPlist || {}),
        NSCameraUsageDescription: 'Aplikasi memerlukan kamera untuk scan QR dan mengambil foto profil.',
        NSPhotoLibraryUsageDescription: 'Aplikasi memerlukan akses galeri untuk memilih foto profil.',
        NSMicrophoneUsageDescription: 'Aplikasi memerlukan mikrofon untuk merekam video.',
        NFCReaderUsageDescription: 'Aplikasi menggunakan NFC untuk pembayaran.',
      },
    },
    android: {
      ...config.android,
      permissions: [
        'android.permission.CAMERA',
        'android.permission.RECORD_AUDIO',
        'android.permission.NFC',
        'android.permission.BLUETOOTH',
        'android.permission.BLUETOOTH_SCAN',
        'android.permission.BLUETOOTH_CONNECT',
        ...(config.android?.permissions || []),
      ],
    },
  };
};
