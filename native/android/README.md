# Android Notes

After running `npm run native:add:android`, open Android Studio with:

```bash
npm run native:open:android
```

Then apply these settings:

1. Confirm package name is `com.watchparty.rooms`.
2. Confirm app label is `Zynlivo`.
3. Keep only required permissions.
4. Use the Android Photo Picker later for image sharing. Do not request broad file or media storage permissions.
5. If native push notifications are enabled later, request `POST_NOTIFICATIONS` at runtime on Android 13+.
6. Build an Android App Bundle (`.aab`) for Play Console upload.

Expected base permission:

```xml
<uses-permission android:name="android.permission.INTERNET" />
```

Do not add microphone, camera, contacts, or location permissions until those features are live and explained in the Play Store Data Safety form.
