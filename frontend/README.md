# Quetta Bicycles Frontend

React/Vite customer storefront and administrator console for the Quetta Bicycles API.

## Start

```powershell
cd frontend
npm install
Copy-Item .env.example .env
npm run dev
```

The backend must be running on the URL set in `VITE_API_URL` (default: `http://localhost:5000/api`). Include the `/api` prefix; this project deliberately uses `/api`, not `/api/v1`.

## Commands

```powershell
npm run dev
npm run build
npm run preview
npm run lint
```

## Environment

| Variable | Purpose |
| --- | --- |
| `VITE_API_URL` | Public API base URL, including `/api`; defaults to `http://localhost:5000/api`. |
| `VITE_STORE_NAME` | Optional display label for future branding use. |

Do not put MongoDB URIs, JWT signing secrets, admin passwords, or other private credentials in frontend variables.

## Render deployment

In the frontend Render service, add `VITE_API_URL` with the backend API URL, for example `https://your-backend.onrender.com/api`, then redeploy the frontend so Vite embeds the value in the production build. In the backend Render service, set `FRONTEND_URL` to the frontend's public origin only (for example `https://your-frontend.onrender.com`, without `/api` or a trailing slash). Add a comma-separated list if the site uses more than one origin.

For React Router deep links to load on refresh, configure the Render Static Site rewrite: source `/*`, destination `/index.html`, action `Rewrite`.

## Backend integration

- Admin authentication uses the backend's short-lived bearer token. It is retained in `sessionStorage`, not local storage, and sent as an `Authorization` header.
- Guest carts use the opaque `X-Cart-Token` returned by the API. It is retained locally only to restore the shopper's cart.
- A created order returns an opaque order-access token and WhatsApp draft URL. They are stored only in the active browser session, so order tracking cannot be opened from another device without a future secure sharing design.
- Checkout always submits item IDs/options and quantities only. The backend recalculates stock and pricing.

## Intentional backend limitations reflected honestly in the UI

- The dashboard currently shows only total products and pending orders because those are the only fields supplied by `GET /api/admin/dashboard`.
- Product images are URL inputs: the backend has no upload endpoint or cloud-media integration.
- Backend order listing supports status and pagination but not text/customer/payment-status search, so the UI does not fake those filters.
- The settings screen offers password changes only; other store settings do not have backend endpoints.
- Meta Pixel is not included because no consent policy or pixel configuration has been supplied.
