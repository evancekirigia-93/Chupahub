# Chupahub mobile apps: Android + iPhone

## Customer apps
- Use the existing Next.js storefront and Supabase APIs as the shared backend.
- Build native Android/iOS shells with secure login, browsing, cart, checkout, M-Pesa, order history, notifications, and tracking.
- Native app releases require Android signing/Play Console and Apple signing/App Store Connect accounts.
- Validate Apple App Store and Google Play policies, including alcohol sales, age verification, location-specific commerce restrictions, and payment rules, before submission.
- Never put Supabase service role keys in either app.

## Rider app — Android first
- Separate authenticated rider role; same Supabase project and delivery assignments.
- Implement a native Android foreground location service with visible persistent notification and explicit opt-in. Android may still interrupt GPS depending on OS/device settings.
- Send coordinates via authenticated rider API at sensible intervals, retry offline and report last-seen timestamps.
- Stop tracking on delivery completion/cancellation, rider logout, or explicit stop. Do not continuously track off duty.
- Add location-permission onboarding, battery guidance and test with screen locked on multiple Android versions.
- iOS rider support later requires native background location entitlement and App Store review.

## Release gates
- Build and test actual binaries on devices.
- Verify end-to-end customer order, admin dispatch, rider assignment, location sharing, customer tracking and completed status.
- Audit RLS, privacy, retention and stale GPS behavior.
- Do not claim published apps or background GPS until signed builds are tested and approved.
