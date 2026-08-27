# Production architecture

The root Next.js application is the only production application deployed to Vercel.

- Storefront and admin UI: `src/app`
- Server routes: `src/app/api`
- Database schema: ordered files in `supabase/migrations`
- Production verification: `.github/workflows/ci.yml`

The historical PHP/static prototype under `chupahub/` is retained only as an archive and is excluded from Vercel uploads. It must not be configured as the Vercel root directory.

## Required production environment

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- Resend variables used by `src/lib/server/resend-email.ts`
- M-Pesa variables used by `src/lib/server/mpesa.ts`
- `CRON_SECRET` only when calling the notification recovery endpoint externally

Apply new Supabase migrations through migration history before deploying application code that depends on them. Never rerun superseded core migrations manually.
