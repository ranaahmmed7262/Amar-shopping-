-- Keep order-status history writes trigger-only.
-- The trigger runs as its SECURITY DEFINER owner, so API roles do not need
-- direct EXECUTE permission on this trigger function.
revoke all on function public.record_order_status_history() from public, anon, authenticated;
