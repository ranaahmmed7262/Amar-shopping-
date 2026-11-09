-- Review-only: grant only the missing order tracking columns.
-- Existing orders_admin_update RLS policy must remain unchanged.
-- is_marketplace_admin() remains required by USING and WITH CHECK.
grant update (courier_name, tracking_number, tracking_note)
on table public.orders to authenticated;

-- Rollback:
-- revoke update (courier_name, tracking_number, tracking_note)
-- on table public.orders from authenticated;
