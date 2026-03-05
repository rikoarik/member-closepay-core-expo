# Member Closepay – Expo

Aplikasi member Closepay (React Native / Expo). **Full Expo** — managed workflow, bisa dijalankan di **Expo Go** (iOS & Android). Web didukung dengan viewport mobile; NFC/BLE di Expo Go di-stub.

---

## Ringkasan

| Platform | Cara jalankan | Catatan |
|----------|----------------|---------|
| **Web** | `npm run web` | Tampilan max 414px (mobile viewport). Beberapa modul native di-stub. |
| **iOS** | `npx expo start --ios` | Butuh Expo Go atau simulator. |
| **Android** | `npx expo start --android` atau `npm run android:tunnel` | Expo Go atau device USB + ADB. |
| **Build APK** | `npm run android` lalu `npm run build:android:release` | Butuh Android SDK; prebuild generate folder `android/`. |

- **Kamera:** expo-camera (QR/barcode, foto profil).
- **NFC/BLE:** Di Expo Go tidak ada modul native — tampil pesan “tidak tersedia” atau input manual. Untuk NFC/BLE penuh pakai development build.

---

## Prasyarat

- **Node.js** 18+ (disarankan LTS)
- **npm** (atau yarn/pnpm)
- **Expo Go** di HP ([iOS](https://apps.apple.com/app/expo-go/id982107779), [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))
- **Android:** untuk device USB — [Android SDK Platform-Tools](https://developer.android.com/studio/releases/platform-tools) (atau Android Studio) + `adb` di PATH

---

## Setup

```bash
git clone <repo-url>
cd member-closepay-expo
npm install
```

### Environment variables (opsional)

Config API dan env dibaca dari `EXPO_PUBLIC_*`. Buat file `.env` di root atau set di shell:

| Variable | Contoh | Keterangan |
|----------|--------|------------|
| `EXPO_PUBLIC_API_BASE_URL` | `https://api.example.com` | Base URL API |
| `EXPO_PUBLIC_API_STG_BASE_URL` | `https://stg-api.example.com` | API staging |
| `EXPO_PUBLIC_API_PROD_BASE_URL` | `https://prod-api.example.com` | API production |
| `EXPO_PUBLIC_ENV` | `development` / `staging` / `production` | Environment |
| `EXPO_PUBLIC_SUPPORT_WHATSAPP_NUMBER` | | Nomor WhatsApp support |
| `EXPO_PUBLIC_SUPPORT_EMAIL` | | Email support |
| `EXPO_PUBLIC_ANDROID_PACKAGE_NAME` | | Package name Android (build) |
| `EXPO_PUBLIC_IOS_BUNDLE_ID` | | Bundle ID iOS (build) |

Tanpa env, app tetap jalan dengan nilai default (string kosong / development).

---

## Menjalankan

### Semua platform

```bash
npm start          # Metro; pilih platform di CLI atau scan QR dengan Expo Go
npm run web        # Buka di browser (mobile viewport)
npm run android:go # Android via Expo Go (LAN)
npm run android:tunnel  # Android via tunnel (HP beda WiFi pun bisa)
npm run ios        # iOS (simulator / Expo Go)
```

### Android di device fisik (USB)

1. **USB debugging**  
   HP: Pengaturan → Opsi pengembang → aktifkan “USB debugging”. Sambung kabel USB.

2. **Cek ADB**  
   ```bash
   adb devices
   ```  
   Jika `adb` tidak ditemukan, pasang Android SDK Platform-Tools dan set:
   ```bash
   export ANDROID_HOME=$HOME/Library/Android/sdk
   export PATH=$ANDROID_HOME/platform-tools:$PATH
   ```
   (Simpan di `~/.zshrc` lalu `source ~/.zshrc`.)

3. **Expo Go**  
   Install [Expo Go](https://play.google.com/store/apps/details?id=host.exp.exponent) dari Play Store.

4. **Jalankan**  
   - **LAN (HP & laptop satu WiFi):**  
     ```bash
     npx expo start --android
     ```
     atau `npm run android:go`.  
     Jika HP tidak bisa konek, coba set IP manual:
     ```bash
     REACT_NATIVE_PACKAGER_HOSTNAME=$(ipconfig getifaddr en0) npx expo start --android
     ```
   - **Tunnel (HP beda WiFi / LAN gagal):**  
     ```bash
     npm run android:tunnel
     ```
     atau `npx expo start --android --tunnel`.

### Development build (APK lokal)

```bash
npm run android
```

Pertama kali akan prebuild (generate folder `android/`) dan build. Butuh Android SDK (dan NDK jika dipakai). Setelah ada `android/`:

```bash
npm run build:android:release
```

APK release: `android/app/build/outputs/apk/release/app-release.apk`.

---

## Scripts (npm)

| Script | Perintah | Keterangan |
|--------|----------|------------|
| `start` | `expo start` | Metro; pilih platform di terminal |
| `web` | `expo start --web` | Dev web |
| `android` | `expo run:android` | Build & run native Android (prebuild) |
| `android:go` | `expo start --android` | Expo Go Android (LAN) |
| `android:tunnel` | `expo start --android --tunnel` | Expo Go Android via tunnel |
| `ios` | `expo run:ios` | Build & run iOS |
| `build:web` | `expo export -p web` + workbox | Export web ke `dist/` |
| `build:android:release` | `expo run:android --variant release` | APK release |
| `lint` | `eslint .` | Lint |
| `typecheck` | `tsc --noEmit` | Type check |
| `perf:build` | timed `expo export -p web` | Ukur waktu export web |
| `perf:build:android` | timed `expo export -p android` | Ukur waktu export Android |
| `perf:build:ios` | timed `expo export -p ios` | Ukur waktu export iOS |

---

## Struktur project

```
member-closepay-expo/
├── app.config.js          # Config Expo (env → extra)
├── app.json               # Manifest Expo
├── App.tsx                # Root component
├── index.ts               # Entry
├── apps/
│   └── member-base/       # App member: config, screens, components
│       ├── config/        # app.config.ts, theme
│       └── src/
├── packages/
│   ├── core/              # Auth, config, theme, i18n, account, navigation, notification, security
│   ├── experience-core/   # Tab/widget mapping, quick menu, HomeTabSettings, QuickMenuSettings
│   └── plugins/           # balance, payment, marketplace, invoice, donasi-zakat, card-transaction, dll.
├── assets/
├── dist/                  # Output export web (setelah build:web)
└── android/               # Ada setelah prebuild (expo run:android)
```

- **Path aliases:** `@core/*`, `@experience-core`, `@plugins/*`, `@app/*` (lihat `tsconfig.json` dan `metro.config.js`).
- **Plugin:** Setiap plugin punya `plugin.manifest.json` dan export di `index.ts`; didaftarkan di `apps/member-base/bootstrap/plugins.ts`.

---

## Build & deploy

### EAS Build & Submit (iOS/Android)

Proyek sudah terhubung ke EAS (project ID di `app.json`). Build dan submit ke app store via EAS:

1. **Login** (sekali): `npx eas login`
2. **Connect project** (jika belum): `npx eas-cli@latest init --id 828900b1-74b1-40f8-85ae-3eba6a407514`
3. **Build**: `npx eas build --platform all`
4. **Build + submit ke store**: `npx eas build --platform all --auto-submit`

Credentials (Apple ID, Google Play service account) diatur di [expo.dev](https://expo.dev) → Project → Credentials. Untuk Android: upload keystore `closepay-member-keystore.keystore` di dashboard (alias: `closepaymember77`, store/key password: sesuai yang dipakai tim). Lihat [EAS Build](https://docs.expo.dev/build/introduction/) dan [EAS Submit](https://docs.expo.dev/submit/introduction/).

### Web (static)

```bash
npm run build:web
```

Output di `dist/`. Deploy ke Vercel/Netlify: Build Command = `npm run build:web`, Output Directory = `dist`. Routing client-side sudah diatur di `vercel.json`.

### Android (APK)

```bash
npm run android
# lalu
npm run build:android:release
```

Cek ukuran APK: `npm run size:android:release`.

---

## Development

- **Lint:** `npm run lint`
- **Type check:** `npm run typecheck`

Konvensi kode dan aturan plugin ada di `.cursor/rules/`.

---

## Troubleshooting

### Require cycle warnings

Saat start Metro mungkin muncul banyak “Require cycle” (theme → config → experience-core → theme, dll). Itu **dikenal** dan tidak membuat app crash; nilainya tetap ter-initialize. Bisa diabaikan atau nanti direfaktor (mis. pecah re-export atau lazy load) untuk menghilangkan cycle.

### Android: HP tidak bisa konek ke Metro

- Pastikan HP dan laptop **satu WiFi**.
- Coba **tunnel:** `npm run android:tunnel`.
- Atau set IP manual: `REACT_NATIVE_PACKAGER_HOSTNAME=$(ipconfig getifaddr en0) npx expo start --android`.

### Expo Go Android: error “expo-notifications… removed from Expo Go”

Di SDK 53+, push notification di Android Expo Go tidak didukung. App sudah diatur agar di Expo Go Android **tidak** memanggil `expo-notifications` untuk permission; hanya pakai `PermissionsAndroid`. Pastikan pakai versi terbaru; kalau masih error, reload app (pull to refresh di Expo Go atau `r` di terminal).

### Blank / red screen setelah load

- **Clear cache:** `npx expo start --clear` atau `npx expo start --reset-cache`.
- Pastikan versi Expo Go sesuai SDK (proyek pakai Expo SDK 55).

### Build Android gagal

- Pastikan `ANDROID_HOME` mengarah ke Android SDK dan `adb` ada di PATH.
- Untuk release: keystore dan signing config (biasanya di EAS atau `android/app/build.gradle`).

---

## Batasan Expo Go

- **NFC/BLE:** Tidak ada modul native; service pakai stub (pesan “tidak tersedia” atau input manual).
- **Push notification (Android):** Tidak didukung di Expo Go SDK 53+; permission tetap lewat `PermissionsAndroid`.
- **FreeRASP:** Di web/Expo Go di-stub; untuk production pakai development build.

Untuk fitur penuh (NFC/BLE, push production, FreeRASP), gunakan **development build** (`npm run android` / EAS Build).

---

## Dependency & path aliases

- **Path aliases:** `@core/*` → `packages/core/*`, `@experience-core` → `packages/experience-core`, `@plugins/*` → `packages/plugins/*`, `@app/*` → `apps/member-base/src/*`.
- Config: `babel.config.js`, `tsconfig.json`, `metro.config.js`.

---

## Referensi

- [Expo Docs](https://docs.expo.dev/)
- [Development Builds](https://docs.expo.dev/develop/development-builds/introduction/)
- [EAS Build](https://docs.expo.dev/build/introduction/)
