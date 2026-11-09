# Amar Shopping — Protected Feature Baseline

Baseline captured from `main` commit `14063d0539e55d3b63b06bb83ced6eab069e11ce` on 2026-11-09.

## Protection rule

Existing production features are protected. A future change must be additive by default. No existing feature, route, UI control, database object, policy, RPC, authentication flow, payment behavior, or customer/admin data may be removed, replaced, renamed, or materially changed without the owner's explicit, change-specific approval.

A general request to add a feature is not approval to modify unrelated existing behavior.

## Feature inventory

The current repository is a Bengali-first, Bangladesh-focused multi-vendor storefront. The following feature groups are present in the current source/repository history and must be retained:

- Storefront shell, branding, responsive layout, navigation and hamburger menu
- Bengali/English language selection and storefront content
- Product catalogue, product cards/details, categories, search and filters
- Cart, checkout, stock validation and order placement
- Cash on Delivery and manual bKash/Nagad payment selection
- Customer signup/login, session and profile handling
- Customer order history and order tracking
- Seller applications, seller approval and seller product submission/image upload
- Admin private entry, password login and email OTP verification
- Admin dashboard, navigation and All-in-One / Master Control settings
- Admin product, category, order, customer, seller and store-management controls
- Order status history, customer order updates, realtime order subscriptions and polling
- Supabase Auth, database, Storage, RPC and Row Level Security integration
- SEO metadata, robots.txt and sitemap.xml
- Capacitor Android app configuration and Android release workflow

## Source-level sentinels

The current baseline includes these implementation anchors. The CI guard checks that the anchors remain present; this is a regression tripwire, not proof that every feature works end-to-end.

- `adminOtpVerifiedUserId` — admin OTP verification state
- `privateLogo` and `admin-reveal` — private admin entry gesture
- `email-otp/status` — server-side OTP status check
- `track_order_by_phone` — customer order tracking
- `amar-admin-orders-live` — realtime admin order channel
- `loadAdminOrders` — admin order refresh path
- `All-in-One` and `Master Control` — master control UI labels

## Known backend data inventory (read-only audit)

Previously observed Supabase objects include:

Tables: `admin_email_otp_challenges`, `app_settings`, `customer_messages`, `order_items`, `order_status_history`, `orders`, `products`, `seller_applications`, `seller_commissions`, `users`.

Important existing integrations include order-status history, realtime publication for orders and order_status_history, and the orders status-history trigger.

**Do not treat this document as permission to modify the database.** Any schema, data, RLS, Auth, RPC, Storage, or payment change needs a separate impact review and explicit approval.

## Verification status and limitations

- Baseline commit and source anchors were inspected.
- JavaScript syntax and source-anchor checks are introduced by the companion CI workflow.
- Static checks do not prove browser behavior, payment settlement, email delivery, permissions, or full customer/admin journeys.
- Before every production release, run the staging and end-to-end checklist in `docs/RELEASE_GATES.md`.
- If a test cannot be run, mark it **NOT VERIFIED**; never report it as passed.

## Recovery

Keep the last known-good production commit and deployment identifiable. If a release fails, stop further rollout, restore the previous known-good release, and investigate. Never clear production data or build caches as a routine recovery step.
