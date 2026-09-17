# Entitlement rules

Use `getServerSubscription()` for trusted server-side feature decisions. `effectivePlanCode()` treats pending, past-due, cancelled, expired and unknown plans as Free, and also downgrades an elapsed period to Free.

Client UI may hide/show upgrade prompts, but it must not be the security boundary. Paid API actions must resolve the authenticated member's subscription on the server and enforce the corresponding entitlement/usage limit there.

Free members retain messaging after a mutual match. Premium unlocks compatibility, advanced filters, likes/visitors and Family Introduction. Premium+ additionally unlocks incognito, priority visibility, boosts and the Premium+ badge.
