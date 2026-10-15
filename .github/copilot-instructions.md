# Tradit project guidance

## Product direction

Tradit is a footwear resale storefront. Keep the existing editorial visual identity while making the experience responsive, accessible, and reliable. The long-term target is a production-ready Next.js App Router application deployable to Vercel, backed by Supabase/PostgreSQL through Prisma, with secure authentication and a real payment/order workflow.

## Current repository state

- The runnable app is in `my-shoe-store/`; it currently uses Next.js 14, React 18, JavaScript/JSX, and a static JSON product catalog.
- Routes are under `my-shoe-store/app/`, shared components under `my-shoe-store/components/`, API handlers under `my-shoe-store/app/api/`, and client utilities under `my-shoe-store/lib/`.
- Cart state currently lives in browser local storage. Do not describe it as account-synced or production-persistent.
- Prisma, Supabase, authentication, payment processing, order persistence, admin/dashboard routes, automated tests, and TypeScript are not yet integrated. Treat these as implementation work, not existing features.
- `.env.local` is ignored by Git. Never hardcode credentials or commit secrets.

## Engineering expectations

- Inspect existing code and preserve the current storefront behavior and styling when changing features.
- Prefer small, end-to-end changes that wire all affected routes and components together; use shared helpers for repeated behavior.
- Validate user input at API boundaries, report failures clearly, and never invent successful payment, order, or AI results.
- Keep client-only browser APIs inside client components and effects/event handlers.
- Use semantic HTML, keyboard-accessible controls, responsive layouts, and descriptive image alternatives.
- Add and run focused tests when test tooling exists. Before declaring the project production-ready, verify installation, build, type checking, linting, and deployment configuration; call out any unavailable tools or unfinished production requirements.
- Assume local Windows development; use the app directory `my-shoe-store/` as the working project root.
