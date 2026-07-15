# Release Runbook

## Required Settings

Set these environment variables in production:

```text
HOST=0.0.0.0
PORT=8080
APP_NAME=YouTube Watch Party
SUPPORT_EMAIL=your-support-email
BUSINESS_NAME=your-business-name
STRIPE_PAYMENT_LINK=your-stripe-payment-link
YOUTUBE_API_KEY=your-youtube-data-api-key
```

## Launch Steps

1. Create the production web service using Docker, `render.yaml`, or the `Procfile`.
2. Add the environment variables above.
3. Attach a custom domain and enable HTTPS.
4. Open `/api/health` and confirm `ok` is `true`.
5. Join one room from two devices, play a YouTube video, send chat, and roll both games.
6. Confirm the Subscribe link appears when `STRIPE_PAYMENT_LINK` is set.
7. Replace local JSON storage with Postgres/Redis before large public traffic.

## Current Production Foundation

- Email-based room login.
- Per-user session token required for chat, controls, reactions, games, themes, and polling.
- Sanitized room snapshots so private session tokens are not exposed to other users.
- Official YouTube Data API search is used when `YOUTUBE_API_KEY` is configured.
- Stripe payment link is surfaced when `STRIPE_PAYMENT_LINK` is configured.
- Docker, Procfile, Render blueprint, health check, privacy page, and terms page are included.
