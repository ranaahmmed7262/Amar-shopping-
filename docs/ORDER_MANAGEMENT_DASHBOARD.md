# Dedicated Customer Order Management Dashboard

## Scope
Additive Admin dashboard above the existing Order Management Center. Existing customer order history, checkout, payment selection, Admin OTP, legacy order tools and support inbox are retained.

## Features
- Sections: All, New/Pending, Confirmed, Processing/Packed, Shipping, Delivered, Cancelled/Rejected.
- Serial numbers follow order ID ascending within the loaded order set; newly created IDs append at the end.
- Clicking an order number opens full customer, delivery, items, totals, payment, attachment, tracking and status history details.
- Phone, WhatsApp and email actions; registered customers use the existing customer_messages support chat.
- Existing Admin Realtime channels and 30-second fallback refresh update this dashboard.
- Mount requires the Admin profile and the current session's verified email OTP.

## Database audit
- Existing orders_admin_update RLS policy is for authenticated and requires is_marketplace_admin() in USING and WITH CHECK.
- authenticated already has column UPDATE privileges for status and payment_status.
- authenticated lacks UPDATE privileges for courier_name, tracking_number and tracking_note. The existing combined save writes these fields, explaining the 403.
- The proposed SQL grants only those three missing columns; it does not add customer write access or alter RLS.

## Safety
The SQL file is a review-only migration draft and has NOT been applied. Applying it changes production DB privileges and requires separate explicit approval. No code was merged to main and no live deploy was triggered. Production merge/deploy requires separate approval.

## Verification
The source guard checks the new module syntax and protected anchors. Browser journeys, live Realtime, actual status save, customer chat delivery and Android behavior remain NOT VERIFIED pending safe staging.


## CI trigger note
This PR targets the protection branch, whose current workflow does not yet include this PR target in its pull_request branch filter. The feature branch workflow includes a feature/** push trigger. A documentation-only commit is used to request that branch-push CI run; this does not alter storefront runtime behavior.


## Existing Admin controls preservation audit
- The new dashboard is inserted after the existing `#adminOverview`; it does not replace the Admin dashboard markup or existing order list, filters, order detail actions, customer/seller/product/settings controls.
- Existing `loadAdminOrders`, realtime subscriptions and 30-second fallback remain in place. Their refresh cycle also refreshes the dedicated dashboard.
- Status values and payment-status options were matched to the existing storefront source. Existing order SELECT relation shape is reused.
- The dashboard mount checks the Admin profile and the OTP verification result for the current authenticated session. A small session-scoped flag mirrors the existing server OTP status so an already-verified Admin session can mount after page reload; it does not bypass OTP or change RLS.
- No existing Admin control handlers were removed or rewritten.
- Regression tests still required: Admin login/OTP (fresh and reloaded session), all existing Admin tabs and save buttons, product/seller/customer/settings workflows, current order filters/detail/status/payment/history, customer order history, cart/checkout/payment, plus the new dashboard flows.


## CI rerun
The protection branch workflow now listens for pushes to `feature/**` so follow-up dashboard commits automatically run the same regression guard. This changes CI triggers only; it does not affect storefront runtime behavior.
