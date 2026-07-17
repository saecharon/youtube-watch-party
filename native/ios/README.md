# iOS Notes

After running `npm run native:add:ios`, open Xcode with:

```bash
npm run native:open:ios
```

Then apply these settings:

1. Set bundle identifier to `com.watchparty.rooms`.
2. Set display name to `Watch Party Rooms`.
3. Set deployment target to the current App Store-supported iOS version you want to support.
4. Add `native/ios/PrivacyInfo.xcprivacy` to the Xcode app target.
5. Use HTTPS only. Do not enable broad App Transport Security exceptions.
6. Do not add camera, microphone, photo library, contacts, location, or tracking permissions until those features are complete.
7. If push notifications are enabled later, add the Apple Push Notifications entitlement and server-side APNs support.

Reviewer note: the app is not affiliated with YouTube or Google.
