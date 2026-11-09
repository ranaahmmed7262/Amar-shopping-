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
