# Family assistance — security foundation

Status: design only. **No delegated access is enabled by this document.**

## Ownership and consent
- The matrimonial member is an adult who signs up and controls their own authenticated account.
- A helper has a separate authenticated account; no shared passwords, OTPs, or sessions.
- The member initiates an invitation to an existing helper account. The helper must accept.
- The member must explicitly confirm each permission; default is no permissions.
- Members can revoke help at any time, immediately invalidating future helper requests.

## Minimal data model (proposal, not migration)
`family_helper_invites`: id, member_user_id, helper_user_id, requested_scopes, status, expires_at, created_at, accepted_at, revoked_at.
`family_helper_audit`: id, invitation_id, actor_user_id, action, created_at, metadata (non-sensitive).

Constraints: member != helper; unique active relationship; limited invite lifetime; no public lookup of invitations; invitation and audit data never included in public profiles.

## Permission boundaries
Allowlisted initial scope: `profile_suggestions_read` (only member-approved, non-sensitive suggestions; not full profile drafts). Future scopes require separate review and explicit consent.

Always denied to helpers: conversations, interests/messages, photos marked private, contact details, account email/phone/password, login sessions, payments, deletion, visibility controls, blocking, verification, and consent changes.

## Server enforcement
- Every delegated operation checks the authenticated helper identity, active accepted invitation, unexpired grant, member status and exact scope on the server.
- Database RLS must enforce the same ownership/grant constraints. Never trust UI visibility or user-supplied member IDs.
- Revoke via member-only endpoint; revoke all grants on member account deletion/deactivation.
- Log invite, acceptance, grant changes, access and revocation without sensitive payloads.
- Apply rate limits and anti-enumeration responses to invitation operations.

## Rollout gates
1. Review actual member/profile schema and existing RLS before writing migrations.
2. Implement RLS and server authorization with deny-by-default tests.
3. Add consent/invite/revoke UX with accessibility and mobile coverage.
4. Run integration tests against isolated Supabase test data, including cross-member denial and revoked grant denial.
5. Keep feature flag OFF until security review and production migration verified.
