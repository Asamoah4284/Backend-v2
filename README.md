# The Artisan's Circle — Backend API

Backend API for The Artisan's Circle, a marketplace connecting African artisans with customers. Built with Express and MongoDB, with JWT authentication, a points-based referral system, and device-fingerprint fraud detection.

## Tech Stack

- **Runtime:** Node.js / Express 4
- **Database:** MongoDB (Mongoose 7)
- **Auth:** JSON Web Tokens (`jsonwebtoken`) + `bcryptjs` password hashing
- **Security:** `helmet`, `cors`, `express-rate-limit`, `express-validator`
- **Testing:** Jest

## Getting Started

### Prerequisites

- Node.js (v16+ recommended)
- A MongoDB instance (local or Atlas)

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file in the project root:

| Variable | Description | Default |
|---|---|---|
| `PORT` | Port the server listens on | `5000` |
| `MONGODB_URI` | MongoDB connection string | — |
| `MONGODB_URI_PROD` | Fallback MongoDB URI (production) | — |
| `MONGODB_URI_TEST` | MongoDB URI used by the test suite | — |
| `JWT_SECRET` | Secret used to sign JWTs | — |
| `JWT_EXPIRES_IN` | JWT expiry (e.g. `7d`) | `7d` |
| `RATE_LIMIT_WINDOW_MS` | Rate-limit window in ms | `3600000` (1 hour) |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window per IP | `10000` |
| `NODE_ENV` | `development` / `production` / `test` | `development` |

### Running

```bash
npm start       # production
npm run dev     # development, with nodemon
```

The server exposes a health check at `GET /health`.

### Seeding data

```bash
npm run seed             # seed products/base data
npm run seed:artisans    # seed artisan profiles
npm run update:products  # bulk-update products
```

### Tests

```bash
npm test
```

## Project Structure

```
server.js           Express app setup, middleware, DB connection, route mounting
routes/
  auth.js            Registration, login, fingerprint update/lookup, fraud check
  public.js          Public read-only endpoints (products, artisans, users)
  app.js             Authenticated app endpoints (dashboard, orders, referrals, users)
  internal.js        Internal health/stats endpoints
models/
  User.js            User schema, auth methods, referral + fingerprint fraud logic
  Artisan.js         Artisan profile schema
  Product.js         Product schema
  Order.js           Order schema
middleware/
  auth.js            JWT verification middleware
  validation.js      express-validator rules for registration/login
scripts/             One-off scripts for seeding/updating the database
docs/                Additional API documentation (fingerprint, user endpoints)
tests/               Jest test suites
```

## API Overview

All routes are mounted under the following base paths: `/auth`, `/public`, `/app`, `/internal`.

### Auth (`/auth`)

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/auth/register` | Register a new user (customer or artisan), optional referral code + device fingerprint | No |
| POST | `/auth/login` | Log in, returns JWT | No |
| PUT | `/auth/update-fingerprint` | Update a user's stored device fingerprint | No |
| GET | `/auth/fingerprint/:userId` | Fetch a user's stored fingerprint | No |
| POST | `/auth/check-fingerprint-fraud` | Check a fingerprint for duplicate-account / same-device-referral fraud | No |

### Public (`/public`)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/public/products` | List products (pagination, category/artisan/price filters) |
| GET | `/public/products/:id` | Get a single product |
| GET | `/public/artisans` | List artisans (pagination, specialty/location filters) |
| GET | `/public/artisans/:id` | Get a single artisan with their products |
| GET | `/public/users` | List users (pagination, type/search filters) |

### App (`/app`) — requires `Authorization: Bearer <token>` unless noted

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/app/dashboard` | Current user's info + orders with product/artisan details | Yes |
| POST | `/app/orders` | Create an order | No |
| GET | `/app/orders` | List orders for a given `userId` (query param) | No |
| POST | `/app/referrals` | Attach a referral code to a user by email | No |
| GET | `/app/users` | List users (pagination, type/search filters) | Yes |
| GET | `/app/users/:userId` | Get a specific user's details | Yes |

### Internal (`/internal`)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/internal/health` | Health check |
| GET | `/internal/stats` | Internal stats placeholder |

See [`docs/user-api.md`](docs/user-api.md) and [`docs/fingerprint-api.md`](docs/fingerprint-api.md) for detailed request/response documentation.

## Key Concepts

- **Referral points:** Each user gets a unique `myReferralCode` on registration. When a new user signs up with someone else's code, the referrer is awarded points — unless fraud is detected.
- **Fingerprint fraud detection:** Client-supplied device fingerprints (`User.fingerprint`) are compared using `User.isSameDevice` to block self-referrals and multi-account abuse.
- **Auth:** JWTs are issued on register/login and verified via the `auth` middleware, which attaches `req.user`.
