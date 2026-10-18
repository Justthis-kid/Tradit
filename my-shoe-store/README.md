# Tradits

Tradits is a Next.js footwear resale storefront. The current catalog is a local JSON file, and cart and store-credit data are stored in the browser. Database-backed accounts, payments, and order processing are not yet implemented.

## Local development

Requirements: Node.js 20.9 or newer and npm (matching the Next.js runtime requirement).

1. Copy `.env.example` to `.env.local`.
2. Add a Google Gemini API key to `GEMINI_API_KEY` if you want to use shoe evaluation.
3. Install dependencies and start the development server:

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
3. Add `GEMINI_API_KEY` to Vercel Project Settings → Environment Variables for the environments where shoe evaluation should be enabled. Keep it server-side; do not prefix it with `NEXT_PUBLIC_`.
4. Deploy the project. Subsequent pushes to the connected Git branch will trigger deployments.

The store can build without `GEMINI_API_KEY`, but requests to the shoe-evaluation endpoint require it. No database URL or payment-provider credentials are needed by the current implementation.

## Routes and services

- `/` and `/shop`: storefront and product catalog
- `/product/[id]`: product details
- `/cart` and `/checkout`: browser-backed cart and current checkout/evaluation flow
- `/evaluate`: AI-assisted shoe evaluation
- `/credit`: store credit display
- `/api/products`: JSON product catalog
- `/api/scan`: Gemini shoe evaluation (requires `GEMINI_API_KEY`)
