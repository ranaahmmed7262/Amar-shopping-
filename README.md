# Amar Shopping — Bangladesh Multi-vendor Marketplace

Bangladesh-focused multi-vendor marketplace starter with Bengali-first storefront, BDT (৳) pricing, +880 phone support, customer accounts, seller applications, seller product management, admin approval, checkout, order history, commissions and delivery-fee settings.

## Bangladesh defaults
- Country: Bangladesh; currency: BDT (৳); phone prefix: +880.
- Delivery fee: ৳80 (admin configurable).
- Checkout methods: Cash on Delivery, bKash and Nagad. bKash/Nagad are selection-only until approved merchant credentials and gateway callbacks are integrated.
- Seller commission: 5%.

## Run locally
Requires Node.js 20+ and npm.
1. Copy `.env.example` to `.env`.
2. Set a strong private `JWT_SECRET` and `ADMIN_PASSWORD`.
3. Run `npm install` then `npm start`.
4. Open `http://localhost:4000` and `/dashboard.html`.

The first admin is created from `ADMIN_NAME`, `ADMIN_EMAIL` and `ADMIN_PASSWORD`. Never commit `.env` or expose secrets in browser code.

## Important deployment status
This is a development starter, not a production-ready store. The Express backend currently uses local SQLite and local image uploads. It must be hosted with persistent storage, HTTPS, backups, rate limiting, verified checkout and tested restore procedures before public orders. The Supabase SQL setup is included, but the current server is not yet migrated to Supabase. bKash/Nagad live payments, courier integration, OTP and seller payouts are not included.
