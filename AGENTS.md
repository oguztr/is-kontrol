# AGENTS.md

## Quick commands

```sh
pnpm install                              # must use pnpm (pnpm-workspace.yaml)
pnpm mobile:start                         # Metro bundler
pnpm bff:serve                            # BFF on :4000
pnpm inventory:serve                      # inventory-service on :3001
pnpm sales:serve                          # sales-service on :3002
pnpm build:all                            # build everything
pnpm lint                                 # lint all projects
pnpm test                                 # test all projects
```

## Run a single package

```sh
nx build mobile-bff
nx serve mobile-bff
nx test mobile-bff
nx lint mobile-bff
nx typecheck mobile-bff
```

## Architecture & module boundaries

- **mobile-app** (React Native 0.84) -- talks only to **mobile-bff**, never directly to services
- **mobile-bff** (NestJS 11, Express) -- HTTP proxy/aggregation at `/bff`; does **not** use Kafka
- **inventory-service** (NestJS 11 + Kafka transport) -- HTTP at `/inventory`, Kafka consumer + producer
- **sales-service** (NestJS 11 + Kafka transport) -- HTTP at `/sales`, Kafka consumer + producer
- **Shared libs**: `@is-kontrol/inventory-contracts`, `@is-kontrol/sales-contracts`, `@is-kontrol/core-database`, `@is-kontrol/core-security`, `@is-kontrol/core-testing`

Tag-based dependency rules enforced by `@nx/enforce-module-boundaries` in `eslint.config.mjs`:
- `scope:mobile` can depend on `scope:core | scope:inventory | scope:sales`
- `scope:mobile-bff` can depend on `scope:inventory | scope:sales | scope:core`
- `scope:inventory` can depend on `scope:inventory | scope:core`
- `scope:sales` can depend on `scope:sales | scope:inventory | scope:core`
- `type:contracts` can depend only on `scope:core`
- `scope:core` can depend only on `scope:core`

All lib imports resolve via `tsconfig.base.json` path aliases:
- `@is-kontrol/inventory-contracts` → `libs/inventory/contracts/src/index.ts`
- `@is-kontrol/sales-contracts` → `libs/sales/contracts/src/index.ts`
- `@is-kontrol/core-database` → `libs/core/database/src/index.ts`
- `@is-kontrol/core-security` → `libs/core/security/src/index.ts`
- `@is-kontrol/core-testing` → `libs/core/testing/src/index.ts`

## Local infrastructure (required for inventory & sales services)

```sh
docker compose -f kafka/docker-compose.yml up -d
# Zookeeper :2181, Kafka broker :9092, Kafka-UI :7777
```

Services reference `KAFKA_BROKER` env var (defaults to `localhost:9092`). Ports default via `PORT` env var.

## Kafka event topics

| Direction | Topics |
|-----------|--------|
| inventory → kafka | `product.created`, `stock.created`, `stock.moved`, `stock.reserved`, `stock.released` |
| sales → kafka | `quote.created`, `quote.updated`, `quote.sent`, `quote.accepted`, `quote.rejected`, `quote.expired`, `order.created`, `order.confirmed`, `order.shipped`, `order.cancelled`, `order.completed` |

## Gotchas

- **Package manager is pnpm.** `npm install` will break workspace resolution.
- **No `.env` files exist.** Environment variables (`PORT`, `KAFKA_BROKER`) are consumed directly from the shell. There is no `.env.example`.
- **mobile-app has no `project.json`.** It is configured entirely by Nx plugin inference (`@nx/react-native/plugin`, `@nx/vite/plugin`).
- **`.vscode/launch.json` is stale** -- references old `apps/api` that no longer exists.
- **No tests written yet.** All projects set `passWithNoTests: true`, so `nx test` is a no-op. Write tests as `*.spec.ts`.
- **BFF serve target** has `runBuildTargetDependencies: false` in `project.json` -- `nx serve mobile-bff` only builds the BFF itself, not its lib dependencies.
- **Build-order in CI:** `test` targets depend on `^build` (nx.json `targetDefaults`), so `nx run-many -t test` builds upstream deps first.
- **`@swc/jest`** is the configured Jest transform (not `ts-jest` in projects), per `jest.preset.js`.
- **Indentation:** 2 spaces (`.editorconfig`).
