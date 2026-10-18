# Google login

Latest successful browser acceptance: 17 October 2026, approximately 23:11 London.
After the owner corrected Google and Supabase redirect settings, Google login
opened `https://cupidmatch.co.uk/dashboard`; reloading retained the authenticated
session. The earlier `redirect_uri_mismatch` and old-domain redirect are resolved.
The owner changed provider settings from their own browser; no client secret was
committed. Dedicated-account signup/recovery and delegated staff acceptance still
need verification. The 18 October preview shows Google and guards membership
behind sign-in; that public check is not another completed OAuth journey.

Google login uses Supabase OAuth with PKCE, not a client secret in the app.
The shared buttons appear on login/signup only when the public Supabase settings
report the provider enabled. Provider detection is not cached, so dashboard
configuration changes are reflected on the next page load.

## Configuration

- Google OAuth client type: Web application.
- JavaScript origin: `https://cupidmatch.co.uk`.
- Google authorised redirect URI:
  `https://ztuquqsmmfkoqhobfgyt.supabase.co/auth/v1/callback`.
- Save the client ID and secret only in Supabase Authentication > Providers > Google.
- Supabase Authentication > URL Configuration: set Site URL to
  `https://cupidmatch.co.uk`, allow `https://cupidmatch.co.uk/auth/callback**`.
  For a preview acceptance test, allow that exact preview origin with
  `/auth/callback**` as well. Avoid allowing arbitrary external preview domains.
- Google Auth Platform > Audience: when in Testing, add authorised testers before
  attempting login; complete the publishing requirements before public rollout.
- Keep nonce checks enabled and require an email address.

The OAuth callback stays on the initiating browser origin so its PKCE cookie can
be read. Existing internal destinations (including `/admin`) are preserved;
Supabase/database permissions still determine access. External destinations are
rejected. Signup's existing onboarding destination is retained. Cancellation and
expired links display distinct errors and preserve the destination for retry.
Callbacks without a destination now open the dashboard; recovery-token callbacks
open password reset. Middleware copies refreshed cookies to redirect responses
and makes session responses private/no-store. SMS deferral does not grant phone
verification or trial eligibility.

## Acceptance

On a deployment containing this commit, refresh login and confirm Google is shown
and Facebook remains hidden until enabled. In Safari, select Google, finish consent
with an authorised test account, and confirm the session survives refresh. Repeat
from `/admin` with an authorised administrator and verify ordinary users are denied.
Cancel consent and confirm a retryable message. Check signup and onboarding with a
new dedicated account. Confirm the Supabase redirect allowlist before testing.

`npm run test:oauth` covers actual callback/session-exchange routing and OAuth
initiation with fixtures. `npm run test:providers` covers dynamic availability.
These do not replace signed-in Google acceptance. No OAuth secret is stored here.
