# ChupaHub admin dashboard

The production admin dashboard lives inside the existing Next.js storefront, not in a second Vercel project:

- Production URL: `https://www.chupahub.com/admin`
- Local URL: `http://localhost:3000/admin`

## Vercel project routing

This repository includes a root `vercel.json` so the existing Vercel project deploys the Next.js app from `chupahub/frontend` instead of serving the old static root HTML files. That routing is what makes `/admin` resolve on `www.chupahub.com`.

## Required Vercel environment variables

Set these variables on the existing Vercel project connected to `www.chupahub.com`:

```text
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_OR_PUBLISHABLE_KEY
```

`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` is also supported by the frontend, but `NEXT_PUBLIC_SUPABASE_ANON_KEY` should be present for production because the admin browser client uses Supabase Auth and RLS with the public anon/publishable key only.

Never add a Supabase service-role key to Vercel public variables or frontend code.

## First administrator

1. Create or confirm the user in **Supabase Dashboard → Authentication → Users**.
2. Run this SQL in the Supabase SQL editor, replacing the email only if needed:

```sql
insert into public.admin_users (user_id, email, role, is_active)
select id, email, 'admin', true
from auth.users
where lower(email) = lower('Evancekirigia@gmail.com')
on conflict (user_id) do update
set email = excluded.email,
    role = 'admin',
    is_active = true,
    updated_at = now();
```

The password must be managed in Supabase Auth. Do not store it in the repository.

## Admin capabilities

After signing in, `/admin` manages live Supabase data for:

- Products, prices, compare-at prices, stock, low-stock alerts, images, gallery URLs, SEO fields and publish/top-seller/new-arrival flags.
- Product variants with options JSON, variant prices, stock and images.
- Categories, unlimited parent/child category relationships, category icons/images and SEO fields.
- Brands, homepage banners, promotions, delivery zones and store settings.
- Orders, payment statuses, order workflow statuses, customers, audit logs and reports.

All writes are protected by Supabase Auth plus RLS policies. The browser uses the public anon/publishable key and never bypasses RLS.
