# ChupaHub Deployment Guide

## Frontend on Vercel
1. Import the repository and set the project root to `chupahub/frontend`.
2. Set `NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com/api`.
3. Build command: `npm run build`.
4. Output is managed by Next.js for Vercel automatically.

## Backend on Truehost, Hostinger or cPanel
1. Upload `chupahub/backend` outside the public web root where possible.
2. Point the domain or subdomain document root to `backend/public`.
3. Run `composer install --no-dev --optimize-autoloader`.
4. Create a MySQL database and import `backend/database/schema.sql` and optionally `seed.sql`.
5. Configure `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASS`, `JWT_SECRET`, `CORS_ORIGIN` and M-Pesa environment variables.
6. Ensure PHP 8.3 is selected, HTTPS is enabled and file uploads are restricted to `storage/uploads`.

## Operations
- Schedule backups for MySQL and uploaded images.
- Rotate `JWT_SECRET` and M-Pesa credentials periodically.
- Keep Composer dependencies updated and monitor audit logs.

## Supabase setup
1. In Supabase SQL Editor, run `supabase/migrations/20260715120000_chupahub_core.sql`.
2. In Authentication, create an admin user, then insert that user's UUID into `public.admin_users`.
3. In Storage, confirm the public buckets `product-images` and `homepage-banners` exist.
4. In Vercel, set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` for the frontend project, then redeploy once.
5. After deployment, content changes in `/admin` write to Supabase and appear on the live website automatically after the configured 30-second revalidation window.
