# Plugin structure & template

Referensi struktur folder, manifest, dan bootstrap. Core tidak tahu path/nama/struktur plugin; daftar plugin hanya di app bootstrap.

---

## Struktur folder (contoh: balance)

```
packages/plugins/balance/
  ├── plugin.manifest.json
  ├── index.ts
  └── components/
       ├── screens/
       ├── tabs/
       ├── widgets/
       └── ui/
```

Nama folder bebas (screens/tabs/widgets/ui hanya contoh). Yang wajib: **manifest**, **index.ts** yang export default `createPluginModule(manifest, componentLoaders)`, dan **loader key = value di manifest exports**.

---

## 1. plugin.manifest.json

- **id**: unik, dipakai di `enabledModules` dan registry.
- **type**: `core-plugin` | `segment-plugin` | `company-plugin` (core-plugin auto-enabled).
- **exports**: semua komponen yang bisa di-load oleh registry.
  - **components**: `string[]` — nama komponen.
  - **screens**: `Record<string, string>` — route/screen id → nama komponen.
  - **tabs**: `Record<string, string>` — tab id → nama komponen.
  - **widgets**: `Record<string, string>` — widget id → nama komponen.

Penting: **value** di `screens` / `tabs` / `widgets` harus sama persis dengan **key** di `componentLoaders` di index.ts.

Contoh minimal:

```json
{
  "id": "balance",
  "name": "Balance",
  "version": "1.0.0",
  "description": "...",
  "type": "segment-plugin",
  "dependencies": [],
  "exports": {
    "components": ["BalanceWidget"],
    "screens": {
      "balance-home": "BalanceHomeScreen",
      "topup": "TopUpScreen",
      "withdraw": "WithdrawScreen"
    },
    "tabs": { "balance-tab": "BalanceHomeScreen" },
    "widgets": { "balance-widget": "BalanceWidget" }
  },
  "routes": [...],
  "permissions": [...]
}
```

---

## 2. index.ts (template)

- Import manifest (require atau import).
- Import `createPluginModule` dari `@core/config` (atau `@core/config/plugins`).
- Definisikan `componentLoaders`: object yang key-nya = **nama komponen** (sama dengan value di exports.screens/tabs/widgets/components).
- Export default: `createPluginModule(manifest, componentLoaders)`.

```ts
import { createPluginModule } from '@core/config';
import manifest from './plugin.manifest.json';

const componentLoaders: Record<string, () => Promise<any>> = {
  BalanceHomeScreen: () => import('./components/BalanceHomeScreen'),
  TopUpScreen: () => import('./components/TopUpScreen'),
  WithdrawScreen: () => import('./components/WithdrawScreen'),
  BalanceWidget: () => import('./components/BalanceWidget'),
};

export default createPluginModule(manifest, componentLoaders);
```

Aturan:

- Tidak import dari `apps/member-base`.
- Tidak depend pada struktur folder repo (hanya path relatif di dalam plugin).
- Semua loader lazy (`() => import(...)`); tidak side effect di top-level selain yang perlu (e.g. contract registration).

---

## 3. Bootstrap (app layer)

Satu-satunya tempat yang “tahu” daftar plugin: app bootstrap.

**File:** `apps/member-base/bootstrap/plugins.ts`

```ts
import { PluginRegistry } from '@core/config';
import balance from '@plugins/balance';
import payment from '@plugins/payment';
// ...

export function bootstrapPlugins(): void {
  PluginRegistry.registerPlugins([
    balance,
    payment,
    // ...
  ]);

  if (__DEV__) {
    PluginRegistry.validate();
  }
}
```

Urutan di app: panggil `bootstrapPlugins()` sebelum `initializePlugins()`. Core hanya expose `registerPlugins()` dan `validate()`; tidak ada daftar plugin by name di core.

---

## 4. Checklist per plugin

Setiap plugin wajib:

- [ ] Setiap **value** di `exports.screens` punya entry di `componentLoaders`.
- [ ] Setiap **value** di `exports.tabs` punya entry di `componentLoaders`.
- [ ] Setiap **value** di `exports.widgets` punya entry di `componentLoaders`.
- [ ] Setiap **item** di `exports.components` punya entry di `componentLoaders`.
- [ ] Tidak ada loader yang tidak direferensi di manifest (opsional ketat: bisa dipangkas).
- [ ] **id** unik di antara semua plugin.
- [ ] Tidak ada import dari `apps/member-base`.

Di dev, `PluginRegistry.validate()` (dipanggil setelah `bootstrapPlugins()`) akan throw jika ada ekspor tanpa loader.

---

## 5. Alur final

```
App
  → bootstrapPlugins()
  → PluginRegistry.registerPlugins([...])
  → (opsional) PluginRegistry.validate() di dev
  → initializePlugins()
  → Registry immutable, enabled set siap
```

Core tidak tahu: path plugin, nama plugin, struktur folder plugin. Hanya tahu: `PluginModule` (manifest + componentLoaders) yang didaftarkan dari app.
