# Laporan Cek Performa — Member Closepay Expo

**Tanggal:** 27 Februari 2025  
**Lingkup:** Build, Lint, Export Web, Export Android, Export iOS (production).

---

## 1. Ringkasan

| Script | Durasi | Status | Catatan |
|--------|--------|--------|--------|
| `perf:typecheck` | **13,8 detik** | OK (exit 0) | TypeScript tanpa error |
| `perf:lint` | **15,8 detik** | OK (exit 0) | 951 warnings, 0 errors |
| `perf:build` | **25,8 detik** | OK (exit 0) | Export **web** ke `dist/` |
| `perf:build:android` | **29,5 detik** | OK (exit 0) | Export **Android** (mobile) ke `dist/` |
| `perf:build:ios` | **30,7 detik** | OK (exit 0) | Export **iOS** (mobile) ke `dist/` |

---

## 2. Detail

### 2.1 TypeCheck (`npm run perf:typecheck`)
- **Durasi:** 13.810 ms
- **Hasil:** `tsc --noEmit` selesai tanpa error.
- **Kegunaan:** Baseline untuk mendeteksi melambatnya kompilasi (mis. setelah tambah plugin/type berat).

### 2.2 Lint (`npm run perf:lint`)
- **Durasi:** 15.784 ms
- **Hasil:** 951 problems (semua warning), 0 errors. Exit code 0.
- **Warning dominan:** `@typescript-eslint/no-unused-vars`, `@typescript-eslint/ban-ts-comment`, `@typescript-eslint/no-explicit-any`.
- **Kegunaan:** Baseline waktu lint; perbaikan warning bisa bertahap.

### 2.3 Build Web (`npm run perf:build`)
- **Durasi:** 25.800 ms (~26 detik)
- **Perintah:** `npx expo export -p web`
- **Output:** `dist/`
  - **Total ukuran folder dist:** ~10 MB
  - **Main bundle:** `_expo/static/js/web/index-*.js` ≈ **9,1 MB** (2.639 modul)
  - **Chunk lainnya:** 67 file JS (code-split), total ~68 web bundles
- **Aset:** 17 assets (font MonaSans, pattern, ikon navigasi, dll.).

### 2.4 Build Android — mobile (`npm run perf:build:android`)
- **Durasi:** 29.458 ms (~29,5 detik)
- **Perintah:** `npx expo export -p android`
- **Output:** `dist/`
  - **Total ukuran folder dist:** ~12 MB
  - **Bundle:** `_expo/static/js/android/index-*.hbc` ≈ **12 MB** (Hermes bytecode, 3.077 modul)
  - **Bundles:** 1 file (single bundle untuk Android)
- **Aset:** 23 assets (font MonaSans, pattern, ikon navigasi, dll.).

### 2.5 Build iOS — mobile (`npm run perf:build:ios`)
- **Durasi:** 30.673 ms (~30,7 detik)
- **Perintah:** `npx expo export -p ios`
- **Output:** `dist/`
  - **Total ukuran folder dist:** ~12 MB
  - **Bundle:** `_expo/static/js/ios/index-*.hbc` ≈ **12 MB** (Hermes bytecode, 3.076 modul)
  - **Bundles:** 1 file (single bundle untuk iOS)
- **Aset:** 22 assets (font MonaSans, pattern, ikon navigasi, dll.).
- **Catatan:** Menjalankan export web / android / ios akan menimpa isi `dist/` — jalankan sesuai platform yang ingin diukur.

---

## 3. Perbandingan Web vs Mobile (Android / iOS)

| Aspek | Web | Android (mobile) | iOS (mobile) |
|-------|-----|-------------------|---------------|
| Waktu export | ~26 s | ~29,5 s | ~30,7 s |
| Ukuran dist | ~10 MB | ~12 MB | ~12 MB |
| Main bundle | 9,1 MB (JS) | 12 MB (.hbc Hermes) | 12 MB (.hbc Hermes) |
| Jumlah modul | 2.639 | 3.077 | 3.076 |
| Chunk/code-split | 68 file | 1 file | 1 file |

---

## 4. Rekomendasi singkat

1. **Baseline:** Simpan angka di atas. Jika typecheck/lint/build naik signifikan (mis. 2x), cek dependency atau konfigurasi baru.
2. **Bundle:** Untuk analisis kontributor ukuran:
   - Web: `npm run perf:bundle:web` (Expo Atlas)
   - Android: `npm run perf:bundle:android` (Expo Atlas)
   - iOS: `npm run perf:bundle:ios` (Expo Atlas)
3. **ESLint:** 951 warning tidak memblokir; bisa dikurangi bertahap.

---

## 5. Cara menjalankan ulang

```bash
npm run perf:typecheck       # ukur typecheck
npm run perf:lint            # ukur lint
npm run perf:build           # ukur export web (output ke dist/)
npm run perf:build:android   # ukur export Android / mobile (output ke dist/)
npm run perf:build:ios       # ukur export iOS / mobile (output ke dist/)
npm run perf:bundle:web      # export web + Expo Atlas
npm run perf:bundle:android  # export Android + Expo Atlas
npm run perf:bundle:ios      # export iOS + Expo Atlas
```

Dokumentasi lengkap: [docs/performance.md](performance.md).
