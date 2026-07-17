-- Complete, non-destructive Supabase schema for the ChupaHub storefront and admin.
-- Safe to run repeatedly: existing rows and tables are preserved.
create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Add storefront/admin fields without replacing existing tables.
alter table if exists public.categories
  add column if not exists description text,
  add column if not exists color text;

alter table if exists public.products
  add column if not exists short_description text,
  add column if not exists currency text not null default 'KES',
  add column if not exists sort_order integer not null default 0;

alter table if exists public.promotions
  add column if not exists image_url text,
  add column if not exists badge_text text,
  add column if not exists button_label text,
  add column if not exists button_url text,
  add column if not exists sort_order integer not null default 0;

alter table if exists public.homepage_banners
  add column if not exists mobile_image_url text,
  add column if not exists badge_text text;

alter table if exists public.orders
  add column if not exists payment_reference text,
  add column if not exists admin_notes text;

create table if not exists public.delivery_settings (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  min_distance_km numeric(8,2) not null default 0 check (min_distance_km >= 0),
  max_distance_km numeric(8,2) check (max_distance_km is null or max_distance_km >= min_distance_km),
  fee numeric(10,2) not null default 0 check (fee >= 0),
  estimated_minutes_min integer not null default 10 check (estimated_minutes_min >= 0),
  estimated_minutes_max integer not null default 50 check (estimated_minutes_max >= estimated_minutes_min),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists categories_active_sort_idx on public.categories(is_active, sort_order, name);
create index if not exists products_storefront_idx on public.products(is_active, sort_order, created_at desc);
create index if not exists banners_active_sort_idx on public.homepage_banners(is_active, sort_order);
create index if not exists promotions_active_dates_idx on public.promotions(is_active, starts_at, ends_at);
create index if not exists delivery_settings_active_sort_idx on public.delivery_settings(is_active, sort_order);
create index if not exists order_items_order_idx on public.order_items(order_id);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users
    where user_id = auth.uid() and is_active = true
  );
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

alter table public.delivery_settings enable row level security;

-- Recreate policies by name so this migration is rerunnable and can repair old policies.
drop policy if exists "Public read delivery settings" on public.delivery_settings;
create policy "Public read delivery settings" on public.delivery_settings
  for select using (is_active or public.is_admin());
drop policy if exists "Admin write delivery settings" on public.delivery_settings;
create policy "Admin write delivery settings" on public.delivery_settings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Tighten all administrative writes to authenticated administrators.
drop policy if exists "Admin write categories" on public.categories;
create policy "Admin write categories" on public.categories for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Admin write brands" on public.brands;
create policy "Admin write brands" on public.brands for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Admin write products" on public.products;
create policy "Admin write products" on public.products for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Admin write promotions" on public.promotions;
create policy "Admin write promotions" on public.promotions for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Admin write banners" on public.homepage_banners;
create policy "Admin write banners" on public.homepage_banners for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Admin update orders" on public.orders;
create policy "Admin update orders" on public.orders for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Admin delete orders" on public.orders;
create policy "Admin delete orders" on public.orders for delete to authenticated
  using (public.is_admin());
drop policy if exists "Admin manage order items" on public.order_items;
create policy "Admin manage order items" on public.order_items for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Administrators can inspect all operational data; customers retain the old owner policies.
drop policy if exists "Admins read customers" on public.customers;
create policy "Admins read customers" on public.customers for select to authenticated using (public.is_admin());
drop policy if exists "Admins read delivery locations" on public.delivery_locations;
create policy "Admins read delivery locations" on public.delivery_locations for select to authenticated using (public.is_admin());
drop policy if exists "Admins read orders" on public.orders;
create policy "Admins read orders" on public.orders for select to authenticated using (public.is_admin());
drop policy if exists "Admins read order items" on public.order_items;
create policy "Admins read order items" on public.order_items for select to authenticated using (public.is_admin());

-- Make the new table's timestamp behavior idempotent.
drop trigger if exists delivery_settings_updated_at on public.delivery_settings;
create trigger delivery_settings_updated_at before update on public.delivery_settings
for each row execute function public.set_updated_at();

-- Required public image buckets. Existing objects and the legacy bucket are untouched.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('category-images', 'category-images', true, 10485760, array['image/jpeg','image/png','image/webp','image/gif']),
  ('product-images', 'product-images', true, 10485760, array['image/jpeg','image/png','image/webp','image/gif']),
  ('banner-images', 'banner-images', true, 10485760, array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Public reads and authenticated-admin-only writes for each managed bucket.
drop policy if exists "Public read ChupaHub images" on storage.objects;
create policy "Public read ChupaHub images" on storage.objects for select
  using (bucket_id in ('category-images','product-images','banner-images'));
drop policy if exists "Admins upload ChupaHub images" on storage.objects;
create policy "Admins upload ChupaHub images" on storage.objects for insert to authenticated
  with check (bucket_id in ('category-images','product-images','banner-images') and public.is_admin());
drop policy if exists "Admins update ChupaHub images" on storage.objects;
create policy "Admins update ChupaHub images" on storage.objects for update to authenticated
  using (bucket_id in ('category-images','product-images','banner-images') and public.is_admin())
  with check (bucket_id in ('category-images','product-images','banner-images') and public.is_admin());
drop policy if exists "Admins delete ChupaHub images" on storage.objects;
create policy "Admins delete ChupaHub images" on storage.objects for delete to authenticated
  using (bucket_id in ('category-images','product-images','banner-images') and public.is_admin());
