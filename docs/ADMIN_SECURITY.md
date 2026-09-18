# Admin authorization

`/admin/layout.tsx` is a Server Component and awaits `requireAdminPage()` before returning the admin shell. Every admin page also checks access independently, including server wrappers around the existing interactive client screens. This matters because Next.js can reuse layouts during navigation. The unused `(protected)` layout has been removed.

`src/lib/auth/admin.ts` is server-only. It verifies the session with Supabase `auth.getUser()` and calls the existing `public.is_admin()` function with the user's session. Only the boolean `true` grants access. Browser state and editable user metadata are never role authorities. Auth/configuration/database failures deny access. Role checks are not persisted or cached across requests.

Guests are redirected to login with `/admin` as the return destination. Signed-in non-admins go to `/dashboard`, avoiding a login redirect loop. Failed authorization infrastructure produces an error without rendering admin content.

Every existing `/api/admin` handler checks the shared server guard before protected reads. Existing consumers of `requireServerAdmin` from `subscriptions/server` remain compatible through a re-export. Future admin endpoints/actions must perform the same check; a layout does not protect APIs or server actions.

Database RLS and the `protect_privileged_profile_fields` trigger remain the enforcement for direct profile writes. No role grants, schema changes, or service-role client were added. Existing member-management UI behavior is unchanged.

## Verification

- `npm run test:admin`: 44 tests for guests, non-admins, valid admins, invalid sessions, forged metadata, missing/malformed roles, infrastructure failures, role revocation, every admin page, and direct access to every admin API.
- `npx tsc --noEmit`: passes.
- `npm run build`: passes; all admin routes are dynamically server-rendered. Existing Genkit/OpenTelemetry compilation warnings remain unrelated to this change.
- Production-server HTTP smoke tests: all seven admin page URLs redirect guests to login; all twelve admin API URLs return 403.
- The live database has profiles RLS enabled and the privileged-field trigger active. A transaction using the authenticated role confirmed an ordinary member receives `false` from `is_admin()` and cannot set their own `is_admin` flag. The transaction was rolled back.
- At inspection, the live project contained zero admin profiles. Assigning a first admin requires a separate, explicit account-selection decision. A real-admin browser login cannot be tested until one exists.

The tests run in the existing Verify workflow. Apply the code through the normal deployment process; creating a pull request alone does not update production.
