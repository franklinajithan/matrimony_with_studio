# Admin dashboard counts

The membership overview at `/admin` loads fresh database aggregates on each request. Refresh counts performs a new server request. Admins are excluded from all three member metrics.

- **Member count:** profiles joined to an existing Auth user, excluding admins. Includes unpublished profiles.
- **Active users:** those members whose latest successful sign-in occurred within the last 30 days. This measures recent sign-ins, not online presence or all activity from long-lived sessions.
- **Pending verification:** published, unverified member profiles. Draft/unpublished profiles are excluded. There is no verification-request workflow yet; this is a profile review backlog, not a count of submitted documents.

The page and `/api/admin/summary` use the same server-only loader. The API returns `members`, `activeUsers`, `pendingVerification`, and `updatedAt`; it no longer returns a fabricated zero for the unavailable subscription table. No other repository code consumed that old field. Failures display an unavailable state and return HTTP 503, never false zero counts.

The public RPC is security-invoker. Its private implementation checks `auth.uid()` and the current database admin role before reading aggregate counts. Only counts and a timestamp are returned; no Auth records or sign-in timestamps leave the database. Anonymous execute permissions are revoked. The additive migration is already applied; its filename matches the remote migration version.

Validation: 52 tests pass, source TypeScript checking passes, and the production build passes. Live database tests confirm the admin receives 14/3/12 at validation time while ordinary members and anonymous callers are rejected. Test transactions were rolled back. Generated Next route types expose three pre-existing errors in the blog and shared-profile/biodata pages; source checking and the existing pre-build CI sequence are unaffected. Existing Genkit/OpenTelemetry build warnings remain.

Supabase advisors report no findings on the new functions. Existing findings remain outside this change, including the [discovery view](https://supabase.com/docs/guides/database/database-linter?lint=0010_security_definer_view) and [public security-definer functions](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable).
