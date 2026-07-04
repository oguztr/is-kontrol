# İşKontrol ERP Monorepo

React Native mobil uygulama, Mobile BFF gateway ve mikroservisleri tek Nx monorepo'sunda barındıran ERP iskeleti.

## Proje yapısı

```
is-kontrol/
├── apps/
│   ├── mobile-app/              # React Native (Yönetici & Tekniker)
│   ├── mobile-bff/              # Mobile-for-Backend gateway
│   ├── inventory-service/       # Stok & Ürün mikroservisi
│   └── sales-service/           # Teklif & Satış mikroservisi
├── libs/
│   ├── inventory/contracts/     # Stok servisi sözleşmeleri (DTO + Event)
│   ├── sales/contracts/         # Satış servisi sözleşmeleri
│   └── core/
│       ├── database/            # Multi-tenancy & RLS altyapısı
│       ├── security/            # JWT & RBAC guard'ları
│       └── testing/             # Test yardımcıları
├── nx.json
├── tsconfig.base.json
├── eslint.config.js
└── package.json
```

## Komutlar

| Komut | Açıklama |
|-------|----------|
| `pnpm mobile:start` | Metro bundler |
| `pnpm mobile:android` | Android'de çalıştır |
| `pnpm bff:serve` | Mobile BFF (port 4000) |
| `pnpm inventory:serve` | Inventory service (port 3001) |
| `pnpm sales:serve` | Sales service (port 3002) |
| `pnpm build:all` | Tüm projeleri derle |
| `pnpm graph` | Bağımlılık grafiği |

## Servis portları

- **mobile-bff:** `4000` → `/bff`
- **inventory-service:** `3001` → `/inventory`
- **sales-service:** `3002` → `/sales`

## Modül sınırları

Nx tag'leri ve `eslint.config.js` içindeki `@nx/enforce-module-boundaries` kuralları ile:

- Mobil uygulama doğrudan mikroservislere değil BFF'e bağlanır
- Servisler yalnızca kendi contract lib'lerini ve `core/*` kütüphanelerini kullanır
- BFF, inventory/sales contract'larını aggregation için tüketir

## Not

Eski `apps/mobile` ve `apps/api` klasörleri kaldırıldı. Metro çalışıyorsa `pnpm mobile:start` komutunu yeniden başlatın.
