-- Dedicated party checkout leaves normal product pricing and checkout unchanged.
alter table public.orders add column if not exists party_package_id smallint;
alter table public.orders add column if not exists party_discount_total numeric(12,2) not null default 0;

create or replace function public.create_party_checkout_order(
  p_package_id integer,
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
  package_config jsonb;
  package_items jsonb;
  expected_cart jsonb;
  actual_cart jsonb;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_idempotency_key::text, 0));
  if p_idempotency_key is null then raise exception using errcode='22023', message='Missing idempotency key.'; end if;
  select * into existing_order from public.orders where idempotency_key=p_idempotency_key;
  if found then
    if existing_order.party_package_id is distinct from p_package_id then
      raise exception 'Party package request identifier belongs to a different order.';
    end if;
    return jsonb_build_object('id',existing_order.id,'order_number',existing_order.order_number,'checkout_token',existing_order.checkout_token,'payment_status',existing_order.payment_status,'subtotal',existing_order.subtotal,'total',existing_order.total,'duplicate',true);
  end if;
  if jsonb_typeof(p_cart) <> 'array' or jsonb_array_length(p_cart)=0 then
    raise exception using errcode='22023', message='Cart is empty.';
  end if;

  if p_package_id is null or p_package_id not between 1 and 4 then
    raise exception 'Party package is not available.';
  end if;
  -- Read package membership from trusted admin settings, never client prices.
  select value into package_config from public.store_settings where key='party_packages' and is_public=true for share;
  select value into package_config from jsonb_array_elements(coalesce(package_config,'[]'::jsonb)) where (value->>'id')::integer=p_package_id;
  if package_config is null or coalesce((package_config->>'is_active')::boolean,false)=false then
    raise exception 'Party package is not available.';
  end if;
  package_items := package_config->'items';
  if jsonb_typeof(package_items) is distinct from 'array' or jsonb_array_length(package_items)=0 then
    raise exception 'Party package has no products.';
  end if;
  if exists (select 1 from jsonb_array_elements(package_items) item group by item->>'productId',coalesce(item->>'variantId','') having count(*)>1) then
    raise exception 'Party package contains duplicate products and sizes.';
  end if;
  select jsonb_agg(jsonb_build_object('productId',item->>'productId','variantId',coalesce(item->>'variantId',''),'quantity',(item->>'quantity')::integer) order by item->>'productId',coalesce(item->>'variantId',''))
    into expected_cart from jsonb_array_elements(package_items) item;
  select jsonb_agg(jsonb_build_object('productId',item->>'productId','variantId',coalesce(item->>'variantId',''),'quantity',(item->>'quantity')::integer) order by item->>'productId',coalesce(item->>'variantId',''))
    into actual_cart from jsonb_array_elements(p_cart) item;
  if actual_cart is distinct from expected_cart then
    raise exception 'Party package contents changed. Please choose the package again.';
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
    delivery_instructions,gift_note,payment_method,payment_status,status,subtotal,delivery_fee,discount_total,total,party_package_id,party_discount_total
  ) values (
    p_idempotency_key,nullif(p_order->>'customer_id','')::uuid,nullif(p_order->>'delivery_location_id','')::uuid,
    order_number_value,p_order->>'customer_name',nullif(p_order->>'customer_email',''),p_order->>'customer_phone',
    p_order->>'delivery_address',nullif(p_order->>'gps_lat','')::numeric,nullif(p_order->>'gps_lng','')::numeric,
    nullif(p_order->>'delivery_place_id',''),nullif(p_order->>'delivery_place_name',''),
    coalesce((p_order->>'delivery_location_verified')::boolean,false),nullif(p_order->>'delivery_instructions',''),
    nullif(p_order->>'gift_note',''),p_order->>'payment_method',p_order->>'payment_status',p_order->>'status',
    calculated_subtotal,0,calculated_original-calculated_subtotal+round(calculated_subtotal*0.10,2),
    calculated_subtotal-round(calculated_subtotal*0.10,2),p_package_id,round(calculated_subtotal*0.10,2)
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

revoke all on function public.create_party_checkout_order(integer,uuid,jsonb,jsonb) from public, anon, authenticated;
grant execute on function public.create_party_checkout_order(integer,uuid,jsonb,jsonb) to service_role;
