# Easy Web Host For Demo

Use Render. It is easier than ngrok for showing the app to friends because it gives you a real public `https://...onrender.com` URL.

## Fastest Steps

1. Create or open a GitHub account.
2. Create a new GitHub repository named `youtube-watch-party`.
3. Upload/push this folder to that repository.
4. Open Render:
   https://dashboard.render.com/blueprints
5. Click **New Blueprint Instance**.
6. Connect the GitHub repository.
7. Render will read `render.yaml`.
8. Fill these optional values when Render asks:
   - `SUPPORT_EMAIL`: your email
   - `BUSINESS_NAME`: your app/business name
   - `YOUTUBE_API_KEY`: leave blank for now
   - `STRIPE_PAYMENT_LINK`: leave blank for now
9. Click **Apply** or **Deploy**.

Render will give you a public URL like:

```text
https://youtube-watch-party.onrender.com
```

Share that URL.

## Important Demo Notes

- This is set to Render's `free` plan for quick demo hosting.
- Free hosting can sleep when nobody uses it, so the first load may be slow.
- Room data is stored in `data/rooms.json`; it can reset after redeploys.
- For a paid release, move room/account data to Postgres or Redis.

## Local App

The local app still runs with:

```bash
python3 server.py
```

Then open:

```text
http://127.0.0.1:8080
```
