-- Rider tracking: additive schema, no changes to existing checkout data.
create table if not exists public.delivery_riders (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  phone text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create table if not exists public.delivery_tracking (
  order_id uuid primary key references public.orders(id) on delete cascade,
  rider_id uuid not null references public.delivery_riders(user_id),
  latitude double precision,
  longitude double precision,
  accuracy_m double precision,
  last_seen_at timestamptz,
  started_at timestamptz,
  finished_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint latitude_valid check(latitude between -90 and 90),
  constraint longitude_valid check(longitude between -180 and 180),
  constraint accuracy_valid check(accuracy_m is null or accuracy_m >= 0)
);
create index if not exists delivery_tracking_rider_idx on public.delivery_tracking(rider_id);
alter table public.delivery_riders enable row level security;
alter table public.delivery_tracking enable row level security;
drop policy if exists "Riders see own profile" on public.delivery_riders;
create policy "Riders see own profile" on public.delivery_riders for select to authenticated using (user_id=(select auth.uid()));
drop policy if exists "Admins manage riders" on public.delivery_riders;
create policy "Admins manage riders" on public.delivery_riders for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Riders see assigned tracking" on public.delivery_tracking;
create policy "Riders see assigned tracking" on public.delivery_tracking for select to authenticated using (rider_id=(select auth.uid()));
drop policy if exists "Admins manage tracking" on public.delivery_tracking;
create policy "Admins manage tracking" on public.delivery_tracking for all to authenticated using (public.is_admin()) with check (public.is_admin());
-- Location updates must be validated by a server endpoint: never grant riders unrestricted UPDATE.
revoke all on public.delivery_tracking from anon;
