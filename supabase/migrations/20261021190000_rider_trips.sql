alter table public.delivery_tracking add column if not exists accepted_at timestamptz;
alter table public.delivery_tracking add column if not exists distance_km double precision not null default 0 check (distance_km >= 0);
alter table public.delivery_tracking add column if not exists rider_pay_kes numeric(12,2) not null default 0 check (rider_pay_kes >= 0);
create table if not exists public.delivery_tracking_points (
 id bigint generated always as identity primary key,
 order_id uuid not null references public.delivery_tracking(order_id) on delete cascade,
 rider_id uuid not null references public.delivery_riders(user_id),
 latitude double precision not null check (latitude between -90 and 90),
 longitude double precision not null check (longitude between -180 and 180),
 accuracy_m double precision check (accuracy_m >= 0),
 recorded_at timestamptz not null default now()
);
create index if not exists delivery_tracking_points_trip_idx on public.delivery_tracking_points(order_id,recorded_at);
alter table public.delivery_tracking_points enable row level security;
revoke all on public.delivery_tracking_points from anon,authenticated;
