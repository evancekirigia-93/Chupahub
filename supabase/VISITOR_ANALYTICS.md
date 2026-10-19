# Website visitor analytics

Fresh tracking was requested on 19 October 2026; historical analytics are intentionally not imported. Counts start when the new migration and application code are activated. No visits before activation are inferred or backfilled.

## Deploy

1. Audit the linked production project's migration history as described in `MIGRATIONS.md`. Do not replay historical migrations or seeds. Apply only the pending additive `20261019120000_visitor_analytics.sql` migration after reconciling history. This migration creates three analytics tables and two RPCs; it does not modify products, images, banners, categories, admin users or store settings.
2. Deploy the root Next.js app from `main` through the existing Vercel integration. The existing public Supabase URL and anon/publishable key are sufficient for analytics; no service-role key is exposed to the browser.
3. Open the storefront in a non-admin browser. Refresh several times and navigate between pages. In a separate signed-in admin browser, click the eye icon in the header: today and total should increase once, online should become one, and refreshes should not increase uniques. Check two separate fresh browser profiles count separately.
4. Stop activity in that visitor browser: online expires after two minutes, while period totals remain. Visit `/admin` and sign in as an active admin: that browser is excluded, including its earlier anonymous visits. Check anonymous and non-admin callers cannot read `website_visitor_statistics` or any analytics tables.

Counts use distinct persistent browser identities, not identified people. Separate devices/profiles or clearing both localStorage and the first-party visitor cookie can count again. Disabled storage skips tracking rather than generating unstable identities. No IP address, email, URL history, products, or order data are stored. Requests use the configured Supabase project directly. Browser tracking can be blocked by privacy tools and cannot eliminate deliberate automated traffic.

Today, week and month use Africa/Nairobi time; weeks begin Monday. Online means a foreground browser sent a heartbeat within the last two minutes. A visible tab sends a heartbeat every 30 seconds. The dashboard refreshes every 30 seconds. Missing migration/access/configuration shows unavailable, never a fabricated zero. The tracking start timestamp is saved once by the migration and displayed in the expanded statistics.

## Tests

`npm run test:visitors` executes the actual SQL migration in isolated PostgreSQL (PGlite) with a minimal Supabase authentication fixture, covering permissions, deduplication, period totals, presence expiry, admin cleanup, and Nairobi dates. It never contacts or modifies production. Also run `npm run typecheck`, `npm run build`, and `node scripts/check-migrations.mjs`.
