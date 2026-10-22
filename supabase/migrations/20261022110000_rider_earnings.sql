-- Rider compensation is independent of the customer delivery fee.
alter table public.delivery_tracking add column if not exists rider_earning numeric(12,2);
alter table public.delivery_tracking add constraint rider_earning_nonnegative check (rider_earning is null or rider_earning >= 0);
