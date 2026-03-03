# experience-core

Layer pengaturan pengalaman: tab beranda, widget, quick menu, dan layar pengaturan terkait.

## Isi

- **tabWidgetPluginMap** – mapping tab/widget ke plugin (tanpa hardcode plugin ID di core).
- **services/quickMenuService** – load/save quick menu, daftar item, label key.
- **services/homeTabSettingsService** – load/save home tab (kiri/kanan) dan widget Beranda.
- **hooks/useQuickMenu** – hook untuk daftar menu & enabled items (di-re-export core).
- **components/QuickMenuSettingsScreen** – layar atur menu cepat.
- **components/HomeTabSettingsScreen** – layar atur tab kiri/kanan dan widget Beranda.

## Ketergantungan

- Hanya bergantung pada **@core** (theme, i18n, config utils, PluginRegistry, hooks, UI seperti ScreenHeader/BottomSheet).
- Jangan impor barrel `@core/config` dari sini (risiko circular); gunakan path spesifik (mis. `@core/config/utils/responsive`, `@core/config/plugins/PluginRegistry`).

## Konsumsi

- **Core** mere-export layar dan service dari `@experience-core` sehingga `AuthNavigator` / `createAppNavigator` dan fitur lain tetap pakai `@core/config`.

## Quick menu icon

- `quickMenuIconProvider` menyediakan `getQuickMenuIcon` dan `setQuickMenuIconProvider`. App (mis. member-base) memanggil `setQuickMenuIconProvider(getMenuIconForQuickAccess)` saat bootstrap agar QuickMenuSettingsScreen menampilkan icon yang sama dengan home. Tanpa registrasi, fallback icon (Element3) dipakai.
