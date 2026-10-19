-- Additive visitor analytics only. No catalog, content, or settings changes.
begin;
create table public.website_visitors (
  visitor_id uuid primary key,
  first_seen timestamptz not null default now(),
  last_seen timestamptz not null default now()
);
create index website_visitors_last_seen_idx on public.website_visitors(last_seen);
create table public.website_visitor_days (
  visitor_id uuid not null references public.website_visitors(visitor_id) on delete cascade,
  visit_date date not null,
  primary key (visitor_id, visit_date)
);
create index website_visitor_days_date_idx on public.website_visitor_days(visit_date, visitor_id);
create table public.website_analytics_start (
  singleton boolean primary key default true check (singleton),
  started_at timestamptz not null default now()
);
insert into public.website_analytics_start default values;
alter table public.website_visitors enable row level security;
alter table public.website_visitor_days enable row level security;
alter table public.website_analytics_start enable row level security;
revoke all on public.website_visitors, public.website_visitor_days, public.website_analytics_start from anon, authenticated;

-- Only server time is accepted; reloads and concurrent tabs upsert the same identity/day.
create function public.record_website_visit(p_visitor_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if p_visitor_id is null then raise exception 'Visitor identity required'; end if;
  if exists (select 1 from public.admin_users where user_id = auth.uid() and is_active) then
    -- Remove this browser's earlier anonymous visits once it is identified as admin.
    delete from public.website_visitors where visitor_id = p_visitor_id;
    return;
  end if;
  insert into public.website_visitors(visitor_id) values (p_visitor_id)
    on conflict (visitor_id) do update set last_seen = now();
  insert into public.website_visitor_days(visitor_id, visit_date)
    values (p_visitor_id, (now() at time zone 'Africa/Nairobi')::date)
    on conflict do nothing;
end;
$$;
revoke all on function public.record_website_visit(uuid) from public;
grant execute on function public.record_website_visit(uuid) to anon, authenticated;

create function public.website_visitor_statistics()
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  local_today date := (now() at time zone 'Africa/Nairobi')::date;
  result jsonb;
begin
  if not exists (select 1 from public.admin_users where user_id = auth.uid() and is_active) then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;
  select jsonb_build_object(
    'online', (select count(*) from public.website_visitors where last_seen >= now() - interval '2 minutes'),
    'today', (select count(*) from public.website_visitor_days where visit_date = local_today),
    'week', (select count(distinct visitor_id) from public.website_visitor_days where visit_date >= date_trunc('week', local_today::timestamp)::date),
    'month', (select count(distinct visitor_id) from public.website_visitor_days where visit_date >= date_trunc('month', local_today::timestamp)::date),
    'total', (select count(*) from public.website_visitors),
    'started_at', (select started_at from public.website_analytics_start where singleton)
  ) into result;
  return result;
end;
$$;
revoke all on function public.website_visitor_statistics() from public, anon;
grant execute on function public.website_visitor_statistics() to authenticated;
commit;
