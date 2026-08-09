# Release Runbook

## Required Settings

Set these environment variables in production:

```text
HOST=0.0.0.0
PORT=8080
APP_NAME=Zynlivo
SUPPORT_EMAIL=your-support-email
BUSINESS_NAME=your-business-name
STRIPE_PAYMENT_LINK=your-stripe-payment-link
YOUTUBE_API_KEY=your-youtube-data-api-key
AUTH_SECRET=long-random-secret
EMAIL_PROVIDER=resend
RESEND_API_KEY=your-resend-api-key
RESEND_FROM_EMAIL=onboarding@resend.dev-or-verified-domain-email
SMTP_HOST=smtp-provider-host
SMTP_PORT=587
SMTP_USERNAME=smtp-login
SMTP_PASSWORD=smtp-password-or-app-password
SMTP_FROM_EMAIL=no-reply@your-domain.com
SMTP_FROM_NAME=Zynlivo
SMTP_SECURITY=starttls
```

For Render release, prefer `EMAIL_PROVIDER=resend` because SMTP ports can be blocked by cloud hosts. Gmail SMTP can remain configured as a fallback, but OTP delivery should use Resend over HTTPS.

## Launch Steps

1. Create the production web service using Docker, `render.yaml`, or the `Procfile`.
2. Add the environment variables above.
3. Attach a custom domain and enable HTTPS.
4. Open `/api/health` and confirm `ok` is `true`.
5. Open `/api/config` and confirm `emailOtpReady`, `officialYoutubeSearch`, and any required release flags are `true`.
6. Request an OTP from a real email inbox and verify login.
7. Join one room from two devices, play a YouTube video, send chat, and roll both games.
8. Confirm the Subscribe link appears when `STRIPE_PAYMENT_LINK` is set.
9. Replace local JSON storage with Postgres/Redis before large public traffic.

## Native App Build

Use the native app name `Zynlivo` for iOS and Android.

```bash
npm install
npm run native:add:ios
npm run native:add:android
npm run native:sync
```

Before store upload, complete `native/APP_STORE_REVIEW.md`, add real support/legal URLs, and confirm mobile subscription billing rules.

## Current Production Foundation

- Email OTP authentication with session-protected accounts.
- Per-user session token required for chat, controls, reactions, games, themes, and polling.
- Sanitized room snapshots so private session tokens are not exposed to other users.
- Official YouTube Data API search is used when `YOUTUBE_API_KEY` is configured.
- Stripe payment link is surfaced when `STRIPE_PAYMENT_LINK` is configured.
- Docker, Procfile, Render blueprint, health check, privacy page, and terms page are included.
