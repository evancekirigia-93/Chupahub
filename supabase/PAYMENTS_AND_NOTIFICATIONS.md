# ChupaHub payment, authentication, and notification configuration

## Before enabling checkout

Apply migrations through Supabase migration history, not manually:

```bash
supabase migration list --linked
supabase db push
```

Set the variables in `chupahub/frontend/.env.example` in **Vercel → Project → Settings → Environment Variables**. Only the `NEXT_PUBLIC_SUPABASE_*` values may be exposed to the browser. `SUPABASE_SERVICE_ROLE_KEY`, Daraja, email, SMS, WhatsApp, and Google secrets are server-only values.

## M-Pesa Daraja

1. Create a sandbox app in the [Safaricom Daraja developer portal](https://developer.safaricom.co.ke/), then obtain the consumer key, consumer secret, sandbox shortcode, and Lipa na M-Pesa passkey.
2. Set `MPESA_ENVIRONMENT=sandbox` and use a public HTTPS callback URL ending in `/api/mpesa/callback`. For local sandbox testing, use an HTTPS tunnel only for the callback URL; do not commit it.
3. Configure the callback URL in Daraja and test a successful, cancelled (`1032`), and timed-out (`1037`) STK prompt. The callback route is idempotent: duplicate callbacks do not mark an already-paid payment again.
4. Switch to production only after Safaricom has issued production credentials and accepted the production callback URL. Do not claim payment is live before this verification.

The checkout server recalculates item prices and stock from Supabase and calculates delivery from server-side delivery bands. It never accepts a browser-provided total.

## Authentication

In Supabase Auth, enable Email and Google. Add these redirect URLs to the Auth configuration:

- `https://YOUR_DOMAIN/auth/callback`
- `https://YOUR_DOMAIN/checkout`
- `http://localhost:3000/auth/callback` (development only)

Create the Google OAuth client in Google Cloud Console, add the Supabase callback URL shown by the Supabase Google provider page, then place its client ID and secret in the Supabase Google provider settings. Email confirmation and password reset are supplied by Supabase Auth; configure the email templates and site URL in Supabase.

## Notifications

`admin_notifications` always records new-order and confirmed-payment events for the secure admin dashboard. Configure an email provider such as Resend (`RESEND_API_KEY`, `EMAIL_FROM`, `ADMIN_NOTIFICATION_EMAIL`) before enabling email sends. Configure Africa's Talking or another approved provider only after valid credentials are available. WhatsApp requires a Meta Cloud API access token, phone-number ID, and approved templates where Meta requires them.

No SMS, WhatsApp, or email credentials are included in this repository. Until a provider integration and verified credentials are configured, use the in-dashboard notification record and do not claim external messages were sent.
