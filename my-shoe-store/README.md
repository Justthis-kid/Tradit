# Tradits

Tradits is a Next.js footwear resale storefront. The current catalog is a local JSON file, and the shopping cart is stored in the browser. Database-backed accounts, payments, and order processing are not yet implemented.

## Local development

Requirements: Node.js 20.9 or newer and npm (matching the Next.js runtime requirement).

1. Copy `.env.example` to `.env.local`.
2. Add a Google Gemini API key to `GEMINI_API_KEY` to enable shoe photo identification.
3. For production shoe evaluation, configure `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` for distributed AI-request limits. The endpoint remains disabled if the Gemini key or Upstash configuration is unavailable.
4. Install dependencies and start the development server:

   ```bash
   npm ci
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000).

Build and run the production app locally with:

```bash
npm run build
npm start
```

## Deploy to Vercel

This repository contains the app in the `my-shoe-store` subdirectory. To deploy from GitHub:

1. Import the repository in Vercel and select `my-shoe-store` as the **Root Directory**.
2. Use the detected Next.js framework settings. The checked-in `vercel.json` uses `npm ci` and `npm run build`; `package.json` declares Node.js 20.9 or newer.
3. Add `GEMINI_API_KEY`, `UPSTASH_REDIS_REST_URL`, and `UPSTASH_REDIS_REST_TOKEN` to Vercel Project Settings → Environment Variables for each enabled environment. Keep them server-side; never prefix them with `NEXT_PUBLIC_`. Production photo evaluation is enabled when all three values are configured and fails closed if the distributed Upstash limiter is unavailable.
4. Deploy the project. Subsequent pushes to the connected Git branch will trigger deployments.

The store can build without provider credentials. The scan endpoint limits requests to 10 per hour and 25 per day per client IP, using distributed Upstash storage in production and in-memory storage in development. Submitting the same processed image more than five times in a rolling 24-hour window bans that IP from image uploads for five minutes; each subsequent flag doubles the ban duration, up to a 24-hour maximum, and Upstash stores the escalation across Vercel instances. When enabled, the endpoint accepts JPEG, PNG, and WebP uploads up to 3 MB, verifies their signatures and decodes them under a pixel limit, then re-encodes them as JPEG to remove embedded metadata before sending them to Gemini. The AI is instructed to identify non-footwear and the UI clearly reports when an image does not show footwear. Original images are not saved by the app.

## Current implementation boundaries

This is still a storefront prototype, not a production e-commerce system. The product catalog is a local JSON file and the cart is browser-local and untrusted. The credit page intentionally displays a fixed `$0.00`; it does not read old browser values or issue credit. There is no authentication, user identity, database, real trade-in valuation, order persistence, tax calculation, payment processing, or admin system. The photo endpoint only returns AI-assisted identification and visible-condition text; it cannot issue a trade-in offer or store credit. Do not accept payments or represent browser-stored values as redeemable funds until server-side order, inventory, wallet, authentication, and payment workflows are implemented.

The application is JavaScript/JSX, not TypeScript. A TypeScript type-check script is not configured, and adding a no-op type-check command would misrepresent coverage.

## Routes and services

- `/` and `/shop`: storefront and product catalog
- `/product/[id]`: product details
- `/cart` and `/checkout`: browser-backed cart and current checkout/evaluation flow
- `/evaluate`: AI-assisted shoe evaluation
- `/credit`: store credit display
- `/api/products`: JSON product catalog
- `/api/scan`: rate-limited Gemini shoe identification (requires `GEMINI_API_KEY` and production Upstash configuration)
