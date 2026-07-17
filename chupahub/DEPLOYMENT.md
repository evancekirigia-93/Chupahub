# ChupaHub deployment checklist

## 1. Apply Supabase migrations

In Supabase SQL Editor, run these files in order:

1. `supabase/migrations/20260715120000_chupahub_core.sql` only if the original core schema is not already installed.
2. `supabase/migrations/20260716160000_supabase_storefront_admin.sql`.
3. `supabase/migrations/20260716161000_seed_existing_storefront.sql`.

Do not reset the database. The new migrations preserve existing tables, rows, and stored objects and can safely be run again.

## 2. Create the first administrator

Create the user in **Authentication → Users**, then run:

```sql
insert into public.admin_users (user_id, email, role, is_active)
select id, email, 'admin', true from auth.users where email = 'YOUR_EMAIL@example.com'
on conflict (user_id) do update set email = excluded.email, role = 'admin', is_active = true;
```

## 3. Configure Vercel

Import the repository and set the Vercel root directory to `chupahub/frontend`. Add:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`, or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Do **not** add a Supabase service-role or secret key. Build with `npm run build` and deploy.

## 4. Verify production

1. Open `/` and confirm categories, banners, promotions, top sellers, new arrivals, and featured products appear.
2. Open `/admin`, sign in, and confirm the account is recognized as an administrator.
3. Upload one test category, product, or banner image and save the record.
4. Edit its price/title/active status and allow up to 30 seconds for storefront revalidation.
5. Confirm Customers, Orders, and Order items are readable and update a test order/payment status.

## Legacy backend

`chupahub/backend` is not part of the Vercel deployment and must not be configured as a second data source. It is retained only to avoid deleting historical repository files.
