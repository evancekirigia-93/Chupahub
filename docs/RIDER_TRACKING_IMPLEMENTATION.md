# Chupahub Rider Tracking — implementation checklist

This branch introduces the additive database schema for rider accounts and location records. It is NOT yet a working or deployed tracking system.

## Required before release
1. Add administrator-only assignment endpoint that links a verified rider auth user to an out-for-delivery order. Preserve the existing packing-check and dispatch RPC.
2. Add authenticated rider dashboard and location-ingest endpoint. Validate bearer token with Supabase Auth; confirm rider owns the active assignment; reject coordinates outside valid ranges, stale timestamps and excessive update rates. Never trust user-editable metadata for rider authorization.
3. Add opaque, expiring customer tracking links, server-side verification, and a limited public response containing only status, rider position and update age. Never expose addresses, phone numbers, auth IDs or raw order data.
4. Add map UI, polling/realtime refresh, stale GPS indicators, delivery-complete stop and automatic data retention/cleanup.
5. Build a signed Android rider application with a foreground location service, persistent notification, Android location permissions and opt-in. Browser-only tracking cannot guarantee updates when locked. Follow Android background-location policies, battery optimizations, and Play Store policy requirements.
6. Test with Android screen locked, app switched, weak mobile network, location revoked, order reassignment, cancellation and completed deliveries.
7. Review migrations against production schema and apply through the existing migration history; do not replay old migrations. Test RLS for rider A vs rider B and anonymous access.
8. Deploy only after end-to-end verification. No production deployment is included in this branch.
