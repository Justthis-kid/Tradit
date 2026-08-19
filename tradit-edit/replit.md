# Tradit

Tradit is a community-centered footwear exchange where people trade in well-loved pairs for store credit and discover their next rotation at a better price.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/tradit/` — responsive React storefront and member flows
- `artifacts/api-server/src/lib/tradit-store.ts` — proof-of-concept catalog, member state, scan offers, and checkout logic
- `artifacts/api-server/src/routes/tradit.ts` — server routes for products, dashboard, trade-ins, credit, and checkout
- `lib/api-spec/openapi.yaml` — source of truth for the Tradit API contract
- `artifacts/tradit/src/index.css` — Tradit visual tokens and global styles

## Architecture decisions

- The first release is a functioning proof of concept with in-memory demo state so the exchange loop can be evaluated without a migration-heavy setup.
- The API contract remains OpenAPI-first; generated Zod schemas validate server inputs and outputs, and generated React Query hooks power the client.
- Trade-in photos are processed transiently as part of the mock scan request; no uploaded image bytes are persisted.
- Tradit uses an editorial, warm, community-centered visual language rather than a generic resale marketplace template.

## Product

- Browse discounted footwear by category.
- Add pairs to a responsive bag and complete demo checkout with Tradit credit plus cash due.
- Upload a shoe photo, receive a mock brand/model/condition evaluation, and accept or decline the credit offer.
- View credit balance, scan allowance, pair-circulation impact, and recent activity.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- The demo member state resets when the API workflow restarts.
- After editing `lib/api-spec/openapi.yaml`, run `pnpm --filter @workspace/api-spec run codegen` before using updated client or server types.
- The API server workflow owns `/api`; the Tradit web workflow owns `/`.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
