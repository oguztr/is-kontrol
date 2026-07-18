# AGENTS.md

## Quick commands

```sh
pnpm install                              # must use pnpm (pnpm-workspace.yaml)
pnpm mobile:start                         # Metro bundler
pnpm bff:serve                            # BFF on :4000
pnpm inventory:serve                      # inventory-service on :3001
pnpm sales:serve                          # sales-service on :3002
pnpm customer:serve                       # customer-service on :3003
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
- **customer-service** (NestJS 11 + Kafka transport) -- mini CRM, HTTP at `/customers`, Kafka consumer + producer; source of truth for the unified Partner model (customer + supplier); feeds inventory's `business_partner_references` via `partner.*` events
- **Shared libs**: `@is-kontrol/inventory-contracts`, `@is-kontrol/sales-contracts`, `@is-kontrol/core-database`, `@is-kontrol/core-security`, `@is-kontrol/core-testing`

Tag-based dependency rules enforced by `@nx/enforce-module-boundaries` in `eslint.config.mjs`:
- `scope:mobile` can depend on `scope:core | scope:inventory | scope:sales`
- `scope:mobile-bff` can depend on `scope:inventory | scope:sales | scope:core`
- `scope:inventory` can depend on `scope:inventory | scope:core`
- `scope:customer` can depend on `scope:customer | scope:core`
- `scope:sales` can depend on `scope:sales | scope:inventory | scope:core`
- `type:contracts` can depend only on `scope:core`
- `scope:core` can depend only on `scope:core`

All lib imports resolve via `tsconfig.base.json` path aliases:
- `@is-kontrol/inventory-contracts` → `libs/inventory/contracts/src/index.ts`
- `@is-kontrol/sales-contracts` → `libs/sales/contracts/src/index.ts`
- `@is-kontrol/core-database` → `libs/core/database/src/index.ts`
- `@is-kontrol/core-security` → `libs/core/security/src/index.ts`
- `@is-kontrol/core-testing` → `libs/core/testing/src/index.ts`
- `@is-kontrol/shared-result` → `libs/shared/result/src/index.ts`
- `@is-kontrol/shared-interceptors` → `libs/shared/interceptors/src/index.ts`
- `@is-kontrol/shared-validation` → `libs/shared/validation/src/index.ts`
- `@is-kontrol/shared-constants` → `libs/shared/constants/src/index.ts`

The `libs/shared/*` libs are tagged `scope:core`, so every app may depend on them:
- **shared-result** — `Result` / `Success` / `Failure` + `DomainError`
- **shared-interceptors** — `DomainResultInterceptor` (unwraps `Result` returned from controllers)
- **shared-validation** — `ZodValidationPipe`, `idParamSchema` / `IdParamDto`
- **shared-constants** — cross-service enums (e.g. `CurrencyCode`)

## Folder & coding standards

### Service folder layout (inventory-service, sales-service)

```
src/
├── domain/entities/          # Plain entity classes (no ORM decorators)
├── infrastructure/           # Kafka clients, publishers, consumers, config
├── application/
│   ├── commands/<aggregate>/<action>/   # One folder per command: *.command.ts + *.handler.ts
│   ├── queries/<aggregate>/<action>/    # One folder per query: *.query.ts + *.handler.ts
│   ├── event-handlers/                  # Consumed-event handlers (inbox)
│   └── ports/                           # Framework-agnostic ports (UoW, actor, publisher)
├── main.ts                   # Bootstrap (NestFactory + connectMicroservice)
├── *.controller.ts           # HTTP endpoints
└── *.module.ts               # NestJS module composition
```

### BFF folder layout (mobile-bff)

```
src/
├── modules/                  # Proxy modules (controller + service + module per domain)
├── main.ts
└── mobile-bff.module.ts
```

### File & class naming

| Layer | File | Class |
|-------|------|-------|
| Entity | `*.entity.ts` | `XxxEntity` |
| Command | `*.command.ts` | `XxxCommand` |
| Query | `*.query.ts` | `XxxQuery` |
| Command/query handler | `*.handler.ts` | `XxxHandler` (single `execute(command)` method) |
| HTTP controller | `*.controller.ts` | `XxxController` |
| Kafka consumer | `*-event.consumer.ts` | `XxxEventConsumer` |
| Kafka publisher | `*-event.publisher.ts` | `XxxEventPublisher` |
| Infrastructure service | `kafka-*.service.ts` | `XxxService` |
| Kafka config | `kafka.config.ts` | — (plain object) |
| Consumed event schemas | `consumed-*.events.ts` | `XxxEvent` (interface) |
| Own event schemas | `*.events.ts` | `XxxEvent` (interface) |
| NestJS module | `*.module.ts` | `XxxModule` |
| DTOs (in contracts) | `*.dto.ts` | `XxxDto` (interface) |
| Kafka topics (in contracts) | `kafka-topics.ts` | `XxxKafkaTopics` (const) |

### Import conventions

- **Service code**: `import type { X } from '...'` for type-only imports; extensionless relative paths
- **Contracts lib barrel exports**: use `.js` extensions (`from './dtos/create-product.dto.js'`)
- Always use `import type` when importing DTOs, event interfaces, or status types into services

### Key patterns

- **IDs**: `crypto.randomUUID()` -- no UUID library dependency
- **Constructor injection**: all dependencies via `constructor(private readonly dep: Type)`; no `@Inject()` except for the Kafka producer token
- **DTOs**: interfaces living in contracts libs, imported as `import type`
- **Events**: every event interface has `occurredAt: string`; consumed event schemas are local copies (not imported from the producing service's contracts)
- **Topics**: defined as `as const` objects with a companion union type
- **Publishers**: each event method accepts `Omit<Event, 'occurredAt'>` and appends the timestamp via a private `withTimestamp()` helper
- **Language**: Turkish log messages in infrastructure layer; English everywhere else

## Elegant Object assumptions

- **No static methods or properties** -- everything is instance-level. Use `new` for all construction
- **No getters/setters** -- public fields (`readonly` for identity, mutable for state). A `get` accessor is only acceptable for truly derived/computed values that require no external input (e.g. `get totalQuantity()`)
- **Constructor-only initialization** -- all object state is set via constructor parameters. No post-construction mutation of identity fields
- **`public readonly`** for identity/immutable fields (`id`, `createdAt`, `orderNumber`, `quoteNumber`); mutable for state (`status`, `quantity`, `subtotal`)
- **Plain classes, no ORM decorators** -- domain entities are pure TypeScript classes. No `@Entity()`, no `@Column()`. Persistence layer will be separate
- **Concrete classes for domain objects** -- use `class` not `interface` for entities. Interfaces are for DTOs, events, and contracts
- **Constructor-based DI** -- no service locators, no `@Inject()` beyond the Kafka `ClientKafka` token
- **`import type` for type-only imports** -- keeps the runtime module graph clean

## Local infrastructure (required for inventory & sales services)

```sh
docker compose -f kafka/docker-compose.yml up -d
# Zookeeper :2181, Kafka broker :9092, Kafka-UI :7777
```

Services reference `KAFKA_BROKER` env var (defaults to `localhost:9092`). Ports default via `PORT` env var.

## Kafka event topics

| Direction | Topics |
|-----------|--------|
| inventory → kafka | `product.*` (created/updated/activated/deactivated/archived/deleted/base-unit.changed/stock-levels.changed), `warehouse.*` (created/updated/activated/deactivated), `stock.document.*` (created/posted/cancelled), type-specific post events (`stock.purchase.received`, `stock.sale.shipped`, `stock.transfer.completed`, `stock.adjustment.applied`, `stock.return.received/sent`, `stock.production.received/issued`, `stock.opening.created`), `stock.increased`, `stock.decreased`, `stock.transferred`, `stock.balance.changed`, `stock.level.below-minimum`, `stock.level.above-maximum`, `inventory.cost.changed` |
| sales → kafka | `quote.created`, `quote.updated`, `quote.sent`, `quote.accepted`, `quote.rejected`, `quote.expired`, `order.created`, `order.confirmed`, `order.shipped`, `order.cancelled`, `order.completed` |
| customer → kafka | `partner.created`, `partner.updated`, `partner.type-changed`, `partner.status-changed`, `partner.deleted`, `partner.merged` (payload `type` alanı CUSTOMER/SUPPLIER/BOTH taşır), `contact.created`, `contact.updated` |
| kafka → inventory | `company.*`, `currency.*`, `exchange-rate.updated`, `partner.*` (customer-service'ten; `business_partner_references` cache'ini besler) |
| kafka → customer | `company.*` (created/updated/activated/deactivated), `product.*` (created/updated/activated/deactivated/archived/deleted; inventory-service'ten, `product_references` cache'ini besler) |

## Result pattern

Use cases return `Result<T, E>` -- a discriminated union of `Success` and `Failure` -- instead of throwing or returning ad-hoc objects. This makes error paths explicit in the type signature.

### Type (lives in `libs/shared/result/`, import from `@is-kontrol/shared-result`)

```ts
// libs/shared/result/src/result.ts

export abstract class Result<T, E> {
  abstract readonly isSuccess: boolean;
  abstract readonly isFailure: boolean;
  abstract match<U>(onSuccess: (value: T) => U, onFailure: (error: E) => U): U;
}

export class Success<T> extends Result<T, never> {
  readonly isSuccess = true;
  readonly isFailure = false;

  constructor(public readonly value: T) {
    super();
  }

  match<U>(onSuccess: (value: T) => U, _onFailure: (error: never) => U): U {
    return onSuccess(this.value);
  }
}

export class Failure<E> extends Result<never, E> {
  readonly isSuccess = false;
  readonly isFailure = true;

  constructor(public readonly error: E) {
    super();
  }

  match<U>(_onSuccess: (value: never) => U, onFailure: (error: E) => U): U {
    return onFailure(this.error);
  }
}

export type DomainError = { code: string };
```

### Usage in use cases

```ts
// Before (current)
async execute(dto: CreateProductDto): Promise<ProductResponseDto> {
  // ... returns plain object or throws
}

// After (Result pattern)
async execute(dto: CreateProductDto): Promise<Result<ProductResponseDto, DomainError>> {
  // ...
  return new Success(responseDto);
  // or: return new Failure({ code: 'VALIDATION_ERROR', message: '...' });
}
```

### Usage in controllers

Controllers do NOT unwrap `Result` by hand. Each service derives a ready-made
interceptor from `DomainResultInterceptor` (`@is-kontrol/shared-interceptors`)
that maps its error codes to HTTP statuses, applies it at class level, and
returns the `Result` as-is:

```ts
// <service>/src/interface/http/domain-result.interceptor.ts
export class InventoryDomainResultInterceptor extends DomainResultInterceptor {
  constructor() {
    super(STATUS_BY_CODE); // Readonly<Record<ErrorCode, HttpStatus>>
  }
}

// controller
@Controller('products')
@UseInterceptors(InventoryDomainResultInterceptor)
export class ProductsController {
  @Post()
  async create(@Body() payload: CreateProductDto) {
    return this.createProduct.execute(payload); // Result döner, interceptor açar
  }
}
```

`Success` becomes the response body (a `Result<void, E>` yields an empty body);
`Failure` is thrown as `HttpException` with the mapped status, or 500 with
`{ code: 'UNKNOWN_DOMAIN_ERROR' }` when the code is not in the table.

### Rules

- **No static factories** -- use `new Success(data)`, `new Failure(error)`. No `Result.ok()` or `Result.err()`
- **Use cases return `Result`** -- never throw from use case code. All business failures become `Failure` values
- **Controllers bridge to HTTP via the interceptor** -- the class-level `DomainResultInterceptor` subclass maps `Success` to a 2xx response and `Failure` to an HTTP exception; controllers return the `Result` untouched
- **DomainError is a value object** -- discriminated on `code: string` plus context fields. Define domain-specific error codes per use case

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
