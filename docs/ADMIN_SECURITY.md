# Admin security

The existing client Admin layout is not a security boundary. New admin APIs call `requireServerAdmin()` which verifies the authenticated Supabase user and `is_current_user_admin()` on the server. Database RLS protects billing/audit reads and browser roles have no billing mutation grants.

When admin mutation screens are added, mutations must go through server-only/service-role code, re-check admin authorization and append an `admin_audit_log` row. Never expose the Supabase service role key to the browser.
