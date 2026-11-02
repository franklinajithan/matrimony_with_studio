# Blocked-members load recovery — 2 November 2026

Continued from PR #73 at c1e2c05cbda6ab062537a47a907681dc2cda3f5e, stacked on consolidated core PR #72. Read-only GitHub inspection confirmed #73 build/admin checks and Vercel deployment status successful. These PRs remain unmerged.

Settings previously required a full refresh after a blocked-members request failed. The error state now offers Try again, clears stale results, and subscribes again to current authentication before loading. The previous subscription is cleaned up and its pending responses are invalidated. Existing server-derived ownership and public member references remain intact.

Validation: 31 safety tests pass, including two new actual-component cases for failure/retry/recovery, subscription cleanup, account switching and sign-out while requests are pending. TypeScript and targeted ESLint checked separately. No database changes are needed for this incremental fix.

Release acceptance still depends on #72/#73 staged migration review and disposable signed-in browser/device journeys. Existing safety UI must not be released against a backend without its required migrations. This change does not establish live OAuth, production-schema staging or physical-device acceptance. No live member mutations or production migration performed.
