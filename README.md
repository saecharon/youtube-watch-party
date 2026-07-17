# Watch Party Rooms

A watch-party app for up to 5 people per room. Everyone joins the same room, watches the same YouTube video, chats, reacts, searches music, and plays synced mini-games together.

## Run

```bash
python3 server.py
```

Then open:

```text
http://127.0.0.1:8080
```

To test with friends on the same network:

```bash
HOST=0.0.0.0 PORT=8080 python3 server.py
```

Then share:

```text
http://YOUR_LOCAL_IP:8080
```

Room state is saved locally in `data/rooms.json`, so rooms survive a server restart during local release testing.

## Health Check

```text
/api/health
```

## Docker

```bash
docker build -t youtube-watch-party .
docker run -p 8080:8080 youtube-watch-party
```

## iOS and Android

The app includes Capacitor config for native iOS and Android wrappers using the safer public app name `Watch Party Rooms`.

```bash
npm install
npm run native:add:ios
npm run native:add:android
npm run native:sync
```

Open the native projects:

```bash
npm run native:open:ios
npm run native:open:android
```

Before submitting to Apple or Google, read `native/APP_STORE_REVIEW.md`.

## Easy Web Host

For the easiest public demo, use Render:

1. Push this folder to a GitHub repository.
2. Open https://dashboard.render.com/blueprints
3. Create a new Blueprint instance from the repository.
4. Render reads `render.yaml` and deploys the app.
5. Share the generated `https://...onrender.com` URL.

The blueprint uses Render's free plan for quick demos. See `EASY_WEBHOST.md` for the full step-by-step version.

## Features

- Create or join a room
- Maximum 5 people per room
- Individual email login with session-protected room actions
- Live campus room discovery
- Room themes for different moods
- Host role with room control
- YouTube URL or video ID input
- In-app YouTube search with one-click room loading
- Instant music search with quick mood buttons
- Shared play, pause, seek, and video changes
- Floating reactions over the video
- Live chat with emoji picker and simple mood reactions
- Typing presence, badges, mini-game prompts, synced Snake & Ladder, and watch history
- No external Python packages required

## Release Setup

- Deploy behind HTTPS.
- Use a real domain.
- Put the Python server behind a process manager so it restarts automatically.
- Move room state from `data/rooms.json` to Postgres/Redis before public scale.
- Add real account login before subscriptions.
- Add Stripe or another payment provider before paid plans.
- Add privacy policy, terms, support contact, and abuse reporting.
- Review YouTube embed/API policy before charging users for the service.

## What Is Ready

- Local room creation and joining
- 5-person room limit
- Synced YouTube playback controls
- YouTube search and direct video loading
- Chat, emojis, reactions, moods, and avatars
- Synced room games
- Docker packaging
- Procfile and Render blueprint
- PWA install support plus Capacitor config for iOS and Android wrappers
- Health check at `/api/health`
- Privacy and terms pages
- Stripe payment link support through `STRIPE_PAYMENT_LINK`
- Official YouTube Data API search when `YOUTUBE_API_KEY` is configured

## What Is Needed For Public Subscription Release

- Final app name and domain.
- Production hosting choice.
- Support email and business/legal name for policies.
- Payment provider and subscription price.
- Production database choice, preferably Postgres plus Redis for live rooms.
- YouTube Data API key and policy confirmation for search and paid usage.
- Native app store assets, screenshots, support URL, app review notes, and platform billing decisions.
