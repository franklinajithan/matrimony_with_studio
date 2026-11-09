# CupidMatch mobile release readiness

Reviewed 9 November 2026 against the main branch.

| Target | Current implementation | Release gate |
| --- | --- | --- |
| Android | The Android workflow generates a Capacitor wrapper around the live site and builds a debug APK. | A tracked, reproducible release project, upload signing key, Play Console access, and a signed release bundle. Complete installed-device acceptance before store submission. |
| iPhone | The existing web manifest supplies standalone display, app names and icons. The web app can be installed from Safari. | Verify the installed PWA on an iPhone against isolated accounts. |
| Native iOS | No Xcode project is checked in on main. | A maintained native project, signing and Apple Developer account access are needed if native distribution is pursued. |

Use the web app for the iPhone release path and the existing Android APK for internal testing. Keep store listing URLs unset until their public pages can be opened while signed out. The public link hub is at https://cupidmatch.co.uk/links.

## Device acceptance

Run on a physical Android device and an iPhone with the installed PWA. Use two disposable accounts connected to an isolated environment. Record device, OS, build, date and pass or fail for every row.

| Journey | Acceptance |
| --- | --- |
| Sign-in | Email and Google sign-in return to the correct environment and retain the session after closing and reopening the app. |
| Profile editing | Save a profile field and a permitted photo, reopen and verify both. |
| Match discovery | Open Discover and a permitted profile, then verify that a blocked test member cannot be reached by direct navigation. |
| Account deletion | Initiate permanent deletion as the disposable account, verify the resulting sign-out and expected deletion workflow, and confirm the account cannot continue using the old session. |

## Draft listing copy

**Name** · CupidMatch

**Short description** · Marriage-focused matchmaking for Sri Lankan and South Asian communities.

**Description** · Create a matrimonial profile, set your partner preferences and discover profiles that fit what you are looking for. Connect at your own pace, choose what you share and manage your account from CupidMatch.

Use screenshots from the signed release candidate with disposable profiles. Prepare a privacy policy URL, support contact, reviewer access and a public account-deletion instructions URL. Complete the store privacy and data declarations from the actual release build and integrations. Store review and device acceptance are pending.

[Google Play user data and deletion requirements](https://support.google.com/googleplay/android-developer/answer/10144311) · [Apple App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
