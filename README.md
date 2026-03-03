# Member Closepay – Expo

Project **full Expo** (managed workflow, kompatibel **Expo Go**). iOS, Android, Web; kamera pakai expo-camera; NFC/BLE di Expo Go di-stub (fitur pembayaran NFC/BLE tersedia hanya pesan “tidak tersedia” atau input manual).

## Lokasi

`/Users/macbookm2/Documents/TKI/member-closepay-expo`

## Setup

```bash
npm install
```

## Menjalankan

- **Web:** `npm run web` atau `npx expo start --web`  
  - Di desktop, tampilan dibatasi lebar 414px (viewport mobile).
- **iOS:** `npx expo start --ios`
- **Android:** `npx expo start --android`

### Android di device fisik (USB)

Agar bisa run di HP Android yang disambung USB:

1. **USB debugging**  
   Di HP: Pengaturan → Opsi pengembang → Aktifkan “USB debugging”. Sambungkan kabel USB.

2. **ADB & Android SDK**  
   Pastikan `adb` terdeteksi di terminal:
   ```bash
   adb devices
   ```
   Kalau `adb` tidak ditemukan:
   - Pasang [Android SDK Platform-Tools](https://developer.android.com/studio/releases/platform-tools) (atau lewat Android Studio).
   - Set env (sesuaikan path SDK kamu):
     ```bash
     export ANDROID_HOME=$HOME/Library/Android/sdk
     export PATH=$ANDROID_HOME/platform-tools:$PATH
     ```
   - Simpan di `~/.zshrc` lalu `source ~/.zshrc`.

3. **Expo Go di HP**  
   Install [Expo Go](https://play.google.com/store/apps/details?id=host.exp.exponent) dari Play Store.

4. **Jalankan**  
   - **Via LAN (HP dan laptop satu WiFi):**  
     ```bash
     npx expo start --android
     ```
     atau `npm run android:go`. Expo akan buka URL di device yang terdeteksi `adb`.  
     Kalau HP tidak bisa konek (blank/error): pastikan satu WiFi, atau coba set IP manual:
     ```bash
     REACT_NATIVE_PACKAGER_HOSTNAME=$(ipconfig getifaddr en0) npx expo start --android
     ```
   - **Via tunnel (HP beda WiFi / LAN gagal):**  
     ```bash
     npm run android:tunnel
     ```
     atau `npx expo start --android --tunnel`. Lebih lambat, tapi tidak bergantung WiFi yang sama.
   - **Development build (APK lokal):**  
     `npm run android` — prebuild + build lalu install ke device (butuh Android SDK di Mac).

## Build Web (static)

```bash
npx expo export --platform web
```

Output di folder `dist/`.

## Deploy web ke Vercel

1. Push repo ke GitHub/GitLab dan import project di [Vercel](https://vercel.com).
2. Di **Project Settings → Build & Development**:
   - **Build Command:** `npm run build:web` atau `npx expo export -p web`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`
3. Deploy. File `vercel.json` sudah berisi rewrites agar routing client-side (React Navigation) berjalan benar.

## Struktur

- `packages/core` – auth, config, theme, i18n, account, navigation, notification, security (FreeRASP di-stub di web).
- `packages/plugins` – balance, payment, marketplace, invoice, donasi-zakat, card-transaction, dll.
- `apps/member-base` – app member base (config, screens, components).

## Web stubs

- `SecurityProvider.web.tsx` – tanpa FreeRASP.
- `Config.web.ts`, `SecurityConfig.web.ts` – config dummy.
- `permissionService.web.ts` – permission stub.
- `nfcBluetoothService.web.ts` – NFC/BLE stub.
- `QrScanScreen.web.tsx` – input manual kode (tanpa kamera).
- `FnBScanScreen.web.tsx` – placeholder.
- `Clipboard.web.ts` – memakai `navigator.clipboard`.

## Full Expo

- Hanya pakai **Expo SDK** dan modul yang ada di Expo Go (expo-camera, expo-image-picker, expo-linear-gradient via shim, react-native-maps).
- Tidak ada `react-native-ble-plx`, `react-native-nfc-manager`, `react-native-vision-camera` — NFC/BLE pakai stub di runtime; scan QR pakai expo-camera.

## Dependency

Path aliases: `@core/*`, `@plugins/*`, `@app/*` (lihat `babel.config.js` dan `tsconfig.json`).
