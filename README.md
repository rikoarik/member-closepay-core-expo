# Member Closepay – Expo

Project Expo (iOS, Android, Web) yang di-convert dari member-closepay-base. UI dan fitur sama; di web beberapa modul native di-stub (NFC/BLE, Vision Camera, FreeRASP).

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

## Dependency

Path aliases: `@core/*`, `@plugins/*`, `@app/*` (lihat `babel.config.js` dan `tsconfig.json`).
