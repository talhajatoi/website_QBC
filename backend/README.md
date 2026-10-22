# Quetta Bicycles API

A JavaScript ES-module Express/MongoDB backend for Quetta Bicycles. It provides a public product catalogue, administrator-only inventory and review management, token-protected guest carts, stock-aware checkout, and WhatsApp click-to-chat order handoff.

## Prerequisites and installation

Use Node.js 20+ and a reachable MongoDB deployment (MongoDB 7+ recommended).

```bash
cd backend
npm install
Copy-Item .env.example .env
# edit .env with a real MongoDB URI and randomly generated JWT_SECRET
npm run dev
```

For production, set `NODE_ENV=production`, use a managed MongoDB replica set, HTTPS, and a distinct long random JWT secret. The backend always allows `https://quettabikesclub.com` and `https://www.quettabikesclub.com`; use `ALLOWED_ORIGINS` for any additional comma-separated frontend origins. The legacy `FRONTEND_URL` and `CLIENT_URL` settings are still accepted. Start with `npm start` only after the deployment environment supplies all required values.

## Environment

| Variable | Purpose |
| --- | --- |
| `NODE_ENV` | `development`, `test`, or `production`. Demo seeding is refused in production. |
| `PORT` | HTTP port; default `5000`. |
| `MONGODB_URI` | Required MongoDB connection URI. |
| `JWT_SECRET` | Required secret of at least 32 characters; generate it with a password manager. |
| `JWT_EXPIRES_IN` | Admin bearer-token lifetime, e.g. `15m`. |
| `UPLOADS_DIR` | Optional absolute directory for product, review, and category uploads. On Render, mount a persistent disk at `/var/data` and set this to `/var/data/uploads`; without a persistent disk, uploaded files may be lost when the service restarts or redeploys. |
| `ALLOWED_ORIGINS` | Optional comma-separated additional frontend origins for CORS; use origin only, without a path. The two quettabikesclub.com production origins are included automatically. When set, this is authoritative. |
| `FRONTEND_URL` | Legacy comma-separated CORS allowlist; used only when `ALLOWED_ORIGINS` is unset. |
| `CLIENT_URL` | Legacy comma-separated CORS allowlist; used only when `ALLOWED_ORIGINS` is unset. |
| `DNS_SERVERS` | Optional comma-separated DNS resolvers when a network blocks Node SRV lookups for `mongodb+srv` URIs. |
| `WHATSAPP_BUSINESS_NUMBER` | Initial default for the store's WhatsApp contact when the business settings record is first created; international digits only. After setup, change it in **Admin → Settings → Public store details**. |
| `DELIVERY_CHARGE_PKR` | Non-negative server-side delivery charge. |
| `ENABLE_DEMO_CONTENT` | Set `true` only for a development demonstration. Demo reviews are otherwise hidden and never affect product totals. |
| `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Used only by the initial-admin seed script. Password must be at least 12 characters. |

Public store name, WhatsApp number, public contact phone/email, address, Google Maps link, About page message, and social URLs are kept in one MongoDB `BusinessSettings` record. Read public values at `GET /api/business`; authorized admins update them through `PATCH /api/admin/business` or the dashboard Settings page. Admin sign-in name/email are separate private account fields and can be changed in Settings after confirming the current password. Payment account details remain backend environment variables and are not part of public business settings.

Never commit `.env`. Product image fields accept HTTPS URLs and product uploads; category images can be entered as URLs or uploaded in the admin category form.

### Persistent image uploads on Render

Product, review, and category image files are written to the local filesystem. To keep them across deploys, attach a persistent disk to the backend Render web service with mount path `/var/data`, then set `UPLOADS_DIR=/var/data/uploads` in that service's environment and redeploy. The backend creates the image subdirectories automatically. Existing database image paths do not contain the image bytes: if an old image URL returns 404, that file is already missing and must be uploaded again after persistent storage is configured. A persistent disk preserves files across redeploys of the same service, but it is not a substitute for backups.

## First administrator

There is deliberately no registration endpoint. Put the three `ADMIN_*` values in a local `.env`, then run:

```bash
npm run seed:admin
```

The script is idempotent: if that email exists, it changes nothing by default. If an existing admin needs a password reset, set `ADMIN_NAME`, `ADMIN_EMAIL`, and a new `ADMIN_PASSWORD` in the deployment environment, then explicitly run `npm run seed:admin -- --reset-password` from the backend directory (Render Shell). The reset uses the existing admin account with that email and hashes the password using the normal model hook. Remove `ADMIN_PASSWORD` from deployment secrets after bootstrap/reset if it is not otherwise needed.

## Authentication and client security

`POST /api/auth/login` returns a short-lived JWT. Send it only in the `Authorization: Bearer <token>` header. The API intentionally does not issue authentication cookies, so cookie CSRF does not apply. A React client should keep the token in memory where possible, never send an administrator token to public endpoints, and discard it on logout or expiry.

Guest-cart access uses a one-time opaque `cartToken` returned by the first `POST /api/cart/items`. Persist it client-side and send it in `X-Cart-Token` for all later cart requests. Order lookup similarly requires the `orderAccessToken` returned only at checkout, sent in `X-Order-Access-Token`. Do not place either value in an advertisement URL.

## API

Every response uses `{ success, message, data? }`; validation failures include an `errors` array. Pagination responses include `page`, `limit`, `total`, and `pages`.

| Method | Endpoint | Access |
| --- | --- | --- |
| GET | `/api/health` | Public |
| GET | `/api/business` | Public store name and contact details |
| POST | `/api/auth/login` | Public, rate limited |
| POST | `/api/auth/logout` | Admin bearer token |
| GET | `/api/auth/me` | Admin bearer token |
| PATCH | `/api/auth/password` | Admin bearer token |
| PATCH | `/api/auth/me` | Admin bearer token; update account name/email with current password |
| GET | `/api/categories` | Public |
| GET | `/api/products` | Public; filters: `category`, `brand`, `bicycleType`, `available`, `minPrice`, `maxPrice`; sort: `price_asc`, `price_desc`, `newest`, `rating`, `popularity` |
| GET | `/api/products/featured` | Public |
| GET | `/api/products/search?q=term` | Public |
| GET | `/api/products/categories/:categorySlug` | Public |
| GET | `/api/products/:idOrSlug` | Public |
| GET | `/api/products/:productId/reviews` | Public, published reviews only |
| GET | `/api/products/:productId/reviews/top` | Public |
| GET | `/api/products/:productId/reviews/summary` | Public |
| GET | `/api/cart` | `X-Cart-Token` |
| POST | `/api/cart/items` | Public, rate limited; returns token when creating a cart |
| PATCH / DELETE | `/api/cart/items/:itemId` | `X-Cart-Token` |
| DELETE | `/api/cart` | `X-Cart-Token` |
| POST | `/api/orders` | Public, rate limited; optional `Idempotency-Key` header |
| GET | `/api/orders/:orderNumber` | `X-Order-Access-Token` |
| GET | `/api/admin/dashboard` | Admin bearer token |
| GET / POST | `/api/admin/products` | Admin bearer token |
| PATCH | `/api/admin/business` | Admin bearer token; update public store settings |
| PATCH / DELETE | `/api/admin/products/:id` | Admin bearer token |
| PATCH | `/api/admin/products/:id/stock` | Admin bearer token |
| GET / POST | `/api/admin/categories` | Admin bearer token |
| PATCH / DELETE | `/api/admin/categories/:id` | Admin bearer token |
| GET | `/api/admin/reviews` | Admin bearer token |
| POST | `/api/admin/products/:productId/reviews` | Admin bearer token |
| PATCH / DELETE | `/api/admin/reviews/:reviewId` | Admin bearer token |
| GET | `/api/admin/orders` | Admin bearer token |
| GET | `/api/admin/orders/:id` | Admin bearer token |
| PATCH | `/api/admin/orders/:id/status` | Admin bearer token |
| PATCH | `/api/admin/orders/:id/payment-status` | Admin bearer token |
| PATCH | `/api/admin/orders/:id/notes` | Admin bearer token |

Example checkout (the server ignores any client-provided price or total):

```json
POST /api/orders
{
  "customer": { "name": "Ali Khan", "whatsapp": "+923001234567", "address": "House 1, Main Road, Quetta" },
  "items": [{ "productId": "<objectId>", "quantity": 1, "selectedOptions": { "size": "M", "color": "Black" } }],
  "paymentMethod": "cash_on_delivery",
  "attribution": { "utm_source": "facebook", "utm_campaign": "winter-sale" }
}
```

`fbclid`, `ig_source`, and standard UTM fields are stored only as non-authoritative attribution data. They never grant access or affect pricing.

## Order and WhatsApp workflow

Checkout re-reads products, validates options, conditionally decrements stock, snapshots items and prices, and creates `pending_confirmation` orders. Valid transitions are `pending_confirmation → confirmed → processing → shipped → delivered`, with cancellation/failed states at the appropriate earlier stages. Cancelling or failing a stock-reserved order restores inventory.

The response includes a `https://wa.me/...` URL with an encoded order summary. Opening it merely opens WhatsApp with a drafted message. It does not send a message, collect payment, or confirm the order; an administrator must do that manually.

## Reviews and demo data

Admins moderate reviews as `published` or `hidden`. The deterministic top review is the highest rating, then highest helpful count, then newest. Product rating totals always exclude `isDemo` records. To seed clearly labelled, unverified development samples after creating products:

```bash
npm run seed:demo-reviews
```

It is idempotent and hard-fails in production. Demo records can be shown only with `NODE_ENV=development` and `ENABLE_DEMO_CONTENT=true`; they remain excluded from stored production rating totals.

## Tests

```bash
npm test
```

Tests use `mongodb-memory-server`, never your configured production database. They cover health/database readiness, authentication, authorization, catalogue CRUD and validation, review aggregation/demo exclusion, cart totals and stock checks, order totals/WhatsApp URLs, order access control, invalid transitions, and centralized errors.

## Production notes

Helmet, restricted CORS, body-size limits, validation, rate limits, bcrypt hashing, JWT verification, opaque guest/order tokens, indexes, and centralized safe errors are enabled. Use a MongoDB replica set in production; the checkout flow protects inventory through conditional stock decrements and compensating rollback, while a replica set is the recommended foundation for future multi-document transaction and payment-provider work. No card data is accepted or stored.
