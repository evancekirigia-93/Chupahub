-- Queue exactly one owner email for every new order, including guest/party orders.
-- Existing catalog, orders, and settings are untouched; no historical email backfill.
begin;
create function public.queue_new_order_owner_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.notification_deliveries(order_id, channel, recipient, event_key, status)
  values (new.id, 'email', 'evancekirigia@gmail.com', 'order_new_order_admin', 'pending')
  on conflict (order_id, channel, recipient, event_key) do nothing;
  return new;
end;
$$;
revoke all on function public.queue_new_order_owner_email() from public, anon, authenticated;
create trigger orders_queue_owner_email
  after insert on public.orders
  for each row execute function public.queue_new_order_owner_email();
commit;
