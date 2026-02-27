# Cek performa (build, bundle, runtime)

Dokumentasi cara mengukur dan menganalisis performa proyek Member Closepay Expo: build/compile, ukuran bundle, dan runtime di device/simulator.

---

## 1. Performa build / compile

Script berikut menjalankan tugas build dan mencetak durasi (ms) ke stdout. Gunakan untuk baseline lokal atau CI.

| Script | Perintah | Interpretasi |
|--------|----------|--------------|
| `npm run perf:typecheck` | `tsc --noEmit` | Waktu kompilasi TypeScript. Naik tajam jika banyak file baru atau dependensi berat. |
| `npm run perf:lint` | `npm run lint` | Waktu ESLint. Bergantung jumlah file dan rule. |
| `npm run perf:build` | `npx expo export -p web` | Waktu export production **web**. Output ke `dist/`. |
| `npm run perf:build:android` | `npx expo export -p android` | Waktu export production **Android** (mobile, bundle .hbc). Output ke `dist/`. Menimpa isi dist. |
| `npm run perf:build:ios` | `npx expo export -p ios` | Waktu export production **iOS** (mobile, bundle .hbc). Output ke `dist/`. Menimpa isi dist. |

**Cara pakai:** Jalankan di root repo. Contoh:

```bash
npm run perf:typecheck
# ... output tsc ...
# [perf] Duration: 3240 ms
```

**Baseline:** Catat hasil di mesin/CI Anda; gunakan untuk mendeteksi regresi (mis. typecheck > 2x setelah penambahan plugin).

---

## 2. Ukuran bundle (Expo Atlas)

Expo Atlas memvisualisasikan kontribusi modul terhadap bundle production dan membantu menemukan duplikasi atau dependensi besar.

### Menjalankan

- **Web:** `npm run perf:bundle:web` — export web + Atlas.
- **Android (mobile):** `npm run perf:bundle:android` — export Android + Atlas.
- **iOS (mobile):** `npm run perf:bundle:ios` — export iOS + Atlas.

Contoh (web). Ini akan:

1. Export production web dengan Atlas: `EXPO_ATLAS=true npx expo export -p web`
2. Menghasilkan `.expo/atlas.jsonl`
3. Menjalankan `npx expo-atlas .expo/atlas.jsonl` dan membuka visualisasi di browser

**Windows:** Jika `EXPO_ATLAS=true` tidak didukung di shell Anda, set env dulu lalu jalankan export:

```cmd
set EXPO_ATLAS=true
npx expo export -p web
npx expo-atlas .expo/atlas.jsonl
```

### Lokasi output

- **Atlas data:** `.expo/atlas.jsonl` (setelah export dengan `EXPO_ATLAS=true`)
- **Export web:** `dist/` (bundle JS + aset). Main bundle: `_expo/static/js/web/index-*.js`
- **Export Android:** `dist/` (bundle Hermes .hbc + aset). Bundle: `_expo/static/js/android/index-*.hbc`
- **Export iOS:** `dist/` (bundle Hermes .hbc + aset). Bundle: `_expo/static/js/ios/index-*.hbc`

### Cara membaca hasil

- **Treemap:** Ukuran kotak = kontribusi modul terhadap total bundle. Fokus pada kotak terbesar.
- **Monorepo:** Cek kontribusi `@core/*` dan `@plugins/*`; prioritaskan plugin yang membesar-kan bundle.
- **Duplikasi:** Modul yang muncul di beberapa chunk bisa dideteksi lewat graph/treemap Atlas.
- **Detail modul:** Di Atlas, Cmd+click (Mac) / Ctrl+click pada node untuk melihat detail transformasi Babel dan dependensi.

Untuk analisis production yang akurat, export dengan mode production (tanpa dev): script di atas sudah memakai `expo export`, yang production by default.

---

## 3. Performa runtime (FPS, render, memory)

Mengukur performa saat app berjalan di device/simulator tanpa menambah dependency. Gunakan tool standar React Native / Expo.

### React DevTools Profiler

- **Setup:** Pasang [React DevTools](https://react.dev/learn/react-developer-tools); sambungkan ke app (Expo dev client / simulator).
- **Langkah:**
  1. Buka tab Profiler, mulai recording.
  2. Lakukan interaksi: navigasi, scroll list panjang, buka layar dengan banyak widget (Home, Marketplace, Cart, daftar transaksi).
  3. Stop recording; review "Commit" duration dan daftar komponen.
- **Fokus:** Komponen dengan render lama atau re-render tidak perlu. Prioritas: `HomeScreen`, `PluginWidgetRenderer`, list besar (mis. `TransactionList` di balance plugin).

### FPS / Performance Monitor

- **Di development:** Buka Expo dev menu (shake device atau Cmd+D di simulator), aktifkan "Show Perf Monitor" jika tersedia (atau React Native Performance Monitor: FPS, JS thread).
- **Baseline:** Catat FPS saat:
  - **Cold start:** Dari launch sampai HomeScreen tampil penuh.
  - **Scroll berat:** Daftar transaksi, daftar produk marketplace, atau layar dengan banyak widget.

### Hermes / Chrome DevTools (jika pakai Hermes)

- **CPU/JS profiling:** Sambungkan Chrome DevTools ke Hermes, ambil CPU profile saat skenario berat (scroll, navigasi, load data).
- Berguna untuk melihat waktu eksekusi JS dan hotspot.

### Skenario uji yang disarankan

| Skenario | Yang diamati |
|----------|------------------|
| Cold start | Waktu sampai HomeScreen tampil; apakah ada jank saat font/plugin load. |
| Scroll list | FPS saat scroll daftar transaksi / produk; re-render berlebihan di Profiler. |
| Buka Marketplace / Checkout | Waktu sampai layar interaktif; FPS saat scroll dan saat submit. |

Dokumentasi ini tidak mewajibkan penambahan library (mis. `react-native-performance`); bisa ditambah nanti jika tim butuh metrik FPS/memory yang tercatat otomatis.
