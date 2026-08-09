# Native App Store Review Checklist

This project is configured for Capacitor builds as **Zynlivo**.

No configuration can guarantee Apple App Review or Google Play approval. This checklist removes common avoidable rejection risks before submission.

## App Identity

- Public app name: `Zynlivo`
- Bundle ID / package name: `com.watchparty.rooms`
- Do not submit with `YouTube` in the app name, icon text, subtitle, or seller-facing title.
- In descriptions, say the app lets friends watch videos together using YouTube embeds. Do not imply an official Google or YouTube partnership.

## Required Store URLs

Replace placeholders before approval:

- Privacy Policy: `https://your-domain.com/privacy.html`
- Terms: `https://your-domain.com/terms.html`
- Support URL: `https://your-domain.com/support`
- Support email: real monitored email address

## Permissions

Use the minimum permissions only.

### iOS

Required by the webview app:

- Network access through App Transport Security HTTPS.

Do not add until the feature is live and reviewed:

- Camera
- Microphone
- Photo library
- Contacts
- Location
- Tracking / IDFA

If voice messages, photo upload, or contacts invites are added later, add the matching `NS...UsageDescription` text in Xcode before submitting.

### Android

Expected permissions:

- `android.permission.INTERNET`
- `android.permission.POST_NOTIFICATIONS` only if native push notifications are enabled.

Do not add broad storage permissions. For images later, use Android Photo Picker instead of file storage access.

## Privacy Answers

Current app may collect:

- Email address for login/session identity
- Display name and avatar
- Chat messages and reactions
- Room membership and friend/invite actions
- Queue/watch activity inside the room
- Game state and game actions

Current app should not claim:

- Location collection
- Contacts collection
- Financial data collection
- Health data collection
- Third-party advertising tracking

YouTube embeds and YouTube search may process data under YouTube/Google policies. Mention this in privacy text.

## Review Demo Notes

Provide a reviewer note like:

```text
Zynlivo lets up to five invited users join a private room, sync YouTube playback, chat, and play room games. The app is not affiliated with YouTube or Google. YouTube playback is provided through embedded YouTube player behavior.

Demo steps:
1. Open the app.
2. Enter any email address and display name to create a local session.
3. Tap Create Room.
4. Paste a YouTube URL or video ID and press Load.
5. Use chat and Snake & Ladder in the same room.
```

If the production login changes to OTP, include a working reviewer account or a way for reviewers to receive OTP.

## Rejection Risks To Fix Before Paid Launch

- A native app that only loads a remote website can be rejected as too web-like. Add native polish, stable offline shell, push notifications, and mobile-specific navigation before final submission.
- Paid subscription needs a compliant payment setup. Apple digital content generally requires In-App Purchase. Google Play also has billing rules. Do not route mobile users only to Stripe without legal review.
- YouTube paid usage and branding must comply with YouTube API Services and embedded player policies.
- User-generated chat needs abuse reporting, blocking, and moderation before scaling publicly.

## Build Commands

```bash
npm install
npm run native:add:ios
npm run native:add:android
npm run native:sync
npm run native:open:ios
npm run native:open:android
```

After Capacitor generates `ios/` and `android/`, apply the platform notes in this folder before uploading builds.

The generated project in this repository already includes:

- `ios/App/App/PrivacyInfo.xcprivacy` in the iOS app target.
- Android backup disabled with `data_extraction_rules.xml`.
- Only Android internet permission enabled by default.
