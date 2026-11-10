-- Customer account status: owner-admin control with existing OTP gate.
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS account_status text NOT NULL DEFAULT 'active';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'users_account_status_check'
      AND conrelid = 'public.users'::regclass
  ) THEN
    ALTER TABLE public.users
      ADD CONSTRAINT users_account_status_check
      CHECK (account_status IN ('active', 'deactive'));
  END IF;
END $$;

-- Inactive profiles no longer resolve as an authenticated marketplace customer.
-- Existing ownership-based RLS policies therefore stop exposing customer data.
CREATE OR REPLACE FUNCTION public.current_profile_id()
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $function$
  SELECT id
  FROM public.users
  WHERE auth_user_id = (SELECT auth.uid())
    AND account_status = 'active'
  LIMIT 1;
$function$;

-- Only an OTP-verified marketplace admin may change a registered customer's status.
CREATE OR REPLACE FUNCTION public.admin_set_customer_status(
  p_user_id bigint,
  p_status text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $function$
BEGIN
  IF NOT public.is_marketplace_admin() THEN
    RAISE EXCEPTION 'Administrator access required';
  END IF;

  IF p_status NOT IN ('active', 'deactive') THEN
    RAISE EXCEPTION 'Invalid customer account status';
  END IF;

  UPDATE public.users
     SET account_status = p_status
   WHERE id = p_user_id
     AND role = 'customer';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Customer account not found';
  END IF;
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_set_customer_status(bigint, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_set_customer_status(bigint, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_set_customer_status(bigint, text) TO authenticated;
