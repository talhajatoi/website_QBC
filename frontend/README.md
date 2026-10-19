# Quetta Bicycles Frontend

React/Vite customer storefront and administrator console for the Quetta Bicycles API.

## Start

```powershell
cd frontend
npm install
Copy-Item .env.example .env
npm run dev
```

The backend must be running on port 5000 for local development; Vite proxies `/api` and `/uploads` requests to it. `VITE_API_BASE_URL` defaults to `/api`, which also lets the production frontend use the backend on the same origin. This project deliberately uses `/api`, because that is the prefix implemented by the backend—not `/api/v1`.

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
| `VITE_API_BASE_URL` | Public API base URL; no trailing slash. |
| `VITE_STORE_NAME` | Optional display label for future branding use. |

Do not put MongoDB URIs, JWT signing secrets, admin passwords, or other private credentials in frontend variables.

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
