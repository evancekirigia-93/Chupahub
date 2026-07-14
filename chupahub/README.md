# ChupaHub

Production-ready premium liquor e-commerce platform split into independent `frontend/` and `backend/` folders.

## Phases delivered
1. Folder structure: `frontend` Next.js app and `backend` pure PHP API.
2. Frontend: responsive black-and-gold marketplace, SEO metadata, sitemap, product/category/checkout/admin pages.
3. Backend: PHP 8.3 REST API, PDO prepared statements, JWT auth, security headers, order and M-Pesa-ready endpoints.
4. Database: MySQL schema for products, users, orders, inventory, coupons, audit logs and delivery fees.
5. Admin panel: modern route covering dashboard modules for content, orders, inventory, SEO and analytics.
6. Deployment: Vercel for frontend; cPanel/Hostinger/Truehost for backend.

## Deployment
Frontend: set `NEXT_PUBLIC_API_BASE_URL`, run `npm install && npm run build`, deploy `chupahub/frontend` to Vercel.
Backend: upload `chupahub/backend` to hosting, point document root to `public/`, run Composer, import `database/schema.sql`, configure environment variables in cPanel.
