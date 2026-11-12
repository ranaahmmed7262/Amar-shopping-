-- Assertions for the additive marketplace migration on disposable PostgreSQL.
do $$
declare
  v_variant_id bigint;
  v_order_id bigint;
  v_available bigint;
  v_pending bigint;
begin
  if (select count(*) from public.seller_wallet_ledger where commission_id = 1) <> 1 then
    raise exception 'Existing commission was not backfilled exactly once';
  end if;

  insert into public.products (seller_id, name, status, price_bdt, stock)
  values (1, 'Variant test product', 'approved', 200, 10);

  insert into public.product_variants (product_id, attributes, price_bdt, stock)
  values (2, '{"size":"M","color":"Black"}'::jsonb, 220, 4)
  returning id into v_variant_id;

  if (select stock from public.products where id = 2) <> 4 then
    raise exception 'Product stock did not synchronize from variant stock on insert';
  end if;

  v_order_id := (public.checkout_order(
    null,
    jsonb_build_array(jsonb_build_object('product_id', 2, 'variant_id', v_variant_id, 'quantity', 2)),
    'Dhaka, Smoke Buyer, 01700000000',
    'cod'
  )->>'order_id')::bigint;

  if (select stock from public.product_variants where id = v_variant_id) <> 2 then
    raise exception 'Variant stock was not decremented by checkout';
  end if;
  if (select stock from public.products where id = 2) <> 2 then
    raise exception 'Product stock did not synchronize after checkout';
  end if;
  if (select count(*) from public.order_items where order_id = v_order_id and variant_id = v_variant_id) <> 1 then
    raise exception 'Checkout did not persist the selected variant on the order item';
  end if;
  if (select count(*) from public.seller_wallet_ledger where order_id = v_order_id) <> 1 then
    raise exception 'Seller commission was not captured in the wallet ledger';
  end if;

  update public.orders
  set status = 'delivered', payment_status = 'paid'
  where id = v_order_id;

  perform set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);
  select available_bdt, pending_bdt
    into v_available, v_pending
  from public.get_seller_wallet_summary(1);

  if v_available <> 513 then
    raise exception 'Unexpected available wallet balance: expected 513, got %', v_available;
  end if;
  if v_pending <> 0 then
    raise exception 'Unexpected pending wallet balance: expected 0, got %', v_pending;
  end if;
end
$$;

select 'Marketplace migration smoke tests passed' as result;
