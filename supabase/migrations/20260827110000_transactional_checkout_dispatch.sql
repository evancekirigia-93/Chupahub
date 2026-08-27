-- Forward-only commerce reliability upgrade.
-- Apply once through Supabase migration history. This migration never truncates catalogue or order data.
create extension if not exists pgcrypto;

alter table public.orders add column if not exists idempotency_key uuid;
create unique index if not exists orders_idempotency_key_unique
  on public.orders(idempotency_key) where idempotency_key is not null;

alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check check (
  status in ('pending','pending_payment','paid','packing','out_for_delivery','completed','cancelled','refunded')
);

create table if not exists public.order_item_dispatch_checks (
  order_id uuid not null references public.orders(id) on delete cascade,
  order_item_id uuid not null references public.order_items(id) on delete cascade,
  checked_by uuid references auth.users(id) on delete set null,
  checked_at timestamptz not null default now(),
  primary key (order_id, order_item_id)
);
alter table public.order_item_dispatch_checks enable row level security;
drop policy if exists "Admins manage dispatch checks" on public.order_item_dispatch_checks;
create policy "Admins manage dispatch checks" on public.order_item_dispatch_checks
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- One notification outbox is authoritative. Legacy order_notifications remains readable
-- for history but new code writes notification_deliveries only.
alter table public.notification_deliveries
  drop constraint if exists notification_deliveries_status_check;
alter table public.notification_deliveries
  add constraint notification_deliveries_status_check
  check (status in ('pending','processing','sent','failed','not_configured'));

create or replace function public.create_checkout_order(
  p_idempotency_key uuid,
  p_cart jsonb,
  p_order jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_order public.orders%rowtype;
  created_order public.orders%rowtype;
  cart_line jsonb;
  product_row public.products%rowtype;
  variant_row public.product_variants%rowtype;
  quantity_requested integer;
  unit_price numeric(12,2);
  original_price numeric(12,2);
  line_name text;
  calculated_subtotal numeric(12,2) := 0;
  calculated_original numeric(12,2) := 0;
  order_number_value text;
begin
  if p_idempotency_key is null then raise exception using errcode='22023', message='Missing idempotency key.'; end if;
  select * into existing_order from public.orders where idempotency_key=p_idempotency_key;
  if found then
    return jsonb_build_object('id',existing_order.id,'order_number',existing_order.order_number,'checkout_token',existing_order.checkout_token,'payment_status',existing_order.payment_status,'duplicate',true);
  end if;
  if jsonb_typeof(p_cart) <> 'array' or jsonb_array_length(p_cart)=0 then
    raise exception using errcode='22023', message='Cart is empty.';
  end if;

  -- Lock in a stable order so concurrent carts cannot oversell or deadlock each other.
  for cart_line in select value from jsonb_array_elements(p_cart) value
    order by value->>'productId', coalesce(value->>'variantId','')
  loop
    quantity_requested := (cart_line->>'quantity')::integer;
    if quantity_requested < 1 then raise exception using errcode='22023', message='Invalid cart quantity.'; end if;

    select * into product_row from public.products
      where id=(cart_line->>'productId')::uuid and is_active=true for update;
    if not found then raise exception using errcode='P0001', message='A product is no longer available.'; end if;

    if nullif(cart_line->>'variantId','') is not null then
      select * into variant_row from public.product_variants
        where id=(cart_line->>'variantId')::uuid and product_id=product_row.id and is_active=true for update;
      if not found then raise exception using errcode='P0001', message='A selected bottle size is no longer available.'; end if;
      if variant_row.stock < quantity_requested then raise exception using errcode='P0001', message=product_row.name||' — '||variant_row.name||' does not have enough stock.'; end if;
      unit_price := case when variant_row.old_price is not null
        and (variant_row.discount_starts_at is null or variant_row.discount_starts_at<=now())
        and (variant_row.discount_ends_at is null or variant_row.discount_ends_at>=now())
        then variant_row.price else variant_row.price end;
      original_price := coalesce(variant_row.old_price,unit_price);
      line_name := product_row.name||' — '||variant_row.name;
    else
      if product_row.track_inventory and product_row.stock < quantity_requested then raise exception using errcode='P0001', message=product_row.name||' does not have enough stock.'; end if;
      unit_price := product_row.price;
      original_price := coalesce(product_row.old_price,unit_price);
      line_name := product_row.name;
    end if;
    calculated_subtotal := calculated_subtotal + unit_price*quantity_requested;
    calculated_original := calculated_original + original_price*quantity_requested;
  end loop;

  order_number_value := 'CH-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,10));
  insert into public.orders(
    idempotency_key,customer_id,delivery_location_id,order_number,customer_name,customer_email,customer_phone,
    delivery_address,gps_lat,gps_lng,delivery_place_id,delivery_place_name,delivery_location_verified,
    delivery_instructions,gift_note,payment_method,payment_status,status,subtotal,delivery_fee,discount_total,total
  ) values (
    p_idempotency_key,nullif(p_order->>'customer_id','')::uuid,nullif(p_order->>'delivery_location_id','')::uuid,
    order_number_value,p_order->>'customer_name',nullif(p_order->>'customer_email',''),p_order->>'customer_phone',
    p_order->>'delivery_address',nullif(p_order->>'gps_lat','')::numeric,nullif(p_order->>'gps_lng','')::numeric,
    nullif(p_order->>'delivery_place_id',''),nullif(p_order->>'delivery_place_name',''),
    coalesce((p_order->>'delivery_location_verified')::boolean,false),nullif(p_order->>'delivery_instructions',''),
    nullif(p_order->>'gift_note',''),p_order->>'payment_method',p_order->>'payment_status',p_order->>'status',
    calculated_subtotal,(p_order->>'delivery_fee')::numeric,calculated_original-calculated_subtotal,
    calculated_subtotal+(p_order->>'delivery_fee')::numeric
  ) returning * into created_order;

  for cart_line in select value from jsonb_array_elements(p_cart) value loop
    quantity_requested := (cart_line->>'quantity')::integer;
    select * into product_row from public.products where id=(cart_line->>'productId')::uuid;
    if nullif(cart_line->>'variantId','') is not null then
      select * into variant_row from public.product_variants where id=(cart_line->>'variantId')::uuid;
      unit_price:=variant_row.price; line_name:=product_row.name||' — '||variant_row.name;
      update public.product_variants set stock=stock-quantity_requested where id=variant_row.id;
      insert into public.inventory_movements(product_id,variant_id,quantity_change,reason,reference,note)
        values(product_row.id,variant_row.id,-quantity_requested,'sale',created_order.order_number,'Reserved during checkout');
    else
      unit_price:=product_row.price; line_name:=product_row.name;
      if product_row.track_inventory then
        update public.products set stock=stock-quantity_requested where id=product_row.id;
        insert into public.inventory_movements(product_id,quantity_change,reason,reference,note)
          values(product_row.id,-quantity_requested,'sale',created_order.order_number,'Reserved during checkout');
      end if;
    end if;
    insert into public.order_items(order_id,product_id,variant_id,product_name,quantity,unit_price,line_total)
      values(created_order.id,product_row.id,nullif(cart_line->>'variantId','')::uuid,line_name,quantity_requested,unit_price,unit_price*quantity_requested);
  end loop;

  insert into public.admin_notifications(order_id,kind,title,body)
    values(created_order.id,'new_order','New order '||created_order.order_number,'A new checkout order is ready for dispatch.');
  if created_order.customer_email is not null then
    insert into public.notification_deliveries(order_id,channel,recipient,event_key,status)
      values(created_order.id,'email',created_order.customer_email,'order_placed','pending')
      on conflict(order_id,channel,recipient,event_key) do nothing;
  end if;

  return jsonb_build_object('id',created_order.id,'order_number',created_order.order_number,'checkout_token',created_order.checkout_token,'payment_status',created_order.payment_status,'subtotal',created_order.subtotal,'total',created_order.total,'duplicate',false);
end $$;

revoke all on function public.create_checkout_order(uuid,jsonb,jsonb) from public, anon, authenticated;
grant execute on function public.create_checkout_order(uuid,jsonb,jsonb) to service_role;

create or replace function public.dispatch_order(
  p_order_id uuid,
  p_rider_name text,
  p_rider_phone text,
  p_checked_item_ids uuid[],
  p_note text default null
) returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare current_order public.orders%rowtype; expected_count integer; checked_count integer;
begin
  if not public.is_admin() then raise exception using errcode='42501', message='Administrator access required.'; end if;
  select * into current_order from public.orders where id=p_order_id for update;
  if not found then raise exception using errcode='P0002', message='Order not found.'; end if;
  if current_order.status not in ('pending','pending_payment','paid','packing') then
    raise exception using errcode='22023', message='Order cannot be dispatched from its current status.';
  end if;
  if length(trim(coalesce(p_rider_name,'')))<2 or length(trim(coalesce(p_rider_phone,'')))<7 then
    raise exception using errcode='22023', message='Valid rider details are required.';
  end if;
  select count(*) into expected_count from public.order_items where order_id=p_order_id;
  select count(distinct id) into checked_count from public.order_items where order_id=p_order_id and id=any(p_checked_item_ids);
  if expected_count=0 or checked_count<>expected_count then raise exception using errcode='22023', message='Every order item must be checked.'; end if;

  insert into public.order_item_dispatch_checks(order_id,order_item_id,checked_by)
    select p_order_id,id,auth.uid() from public.order_items where order_id=p_order_id
    on conflict(order_id,order_item_id) do update set checked_by=excluded.checked_by,checked_at=now();

  update public.orders set status='out_for_delivery',dispatched_at=now(),rider_name=trim(p_rider_name),
    rider_phone=trim(p_rider_phone),updated_at=now() where id=p_order_id;
  insert into public.order_status_history(order_id,from_status,to_status,note,changed_by)
    values(p_order_id,current_order.status,'out_for_delivery',p_note,auth.uid());
  if current_order.customer_email is not null then
    insert into public.notification_deliveries(order_id,channel,recipient,event_key,status)
      values(p_order_id,'email',current_order.customer_email,'order_dispatched','pending')
      on conflict(order_id,channel,recipient,event_key) do nothing;
  end if;
  return jsonb_build_object('id',p_order_id,'status','out_for_delivery');
end $$;
grant execute on function public.dispatch_order(uuid,text,text,uuid[],text) to authenticated;
