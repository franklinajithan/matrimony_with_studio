# Subscription implementation status

Implemented: launch price/entitlement model; legacy Plus migration; billing tables/RLS/write locks; effective-plan resolver; server entitlement APIs; atomic monthly usage meter; server admin authorization helper; admin billing read APIs; audit-log foundation; billing configuration guards; CI build/typecheck workflow.

Intentionally disabled pending external credentials/provider setup: Stripe Checkout session creation, Stripe Customer Portal creation and signature-verified Stripe webhook processing. Those endpoints fail closed with HTTP 503 and cannot grant paid access.

Production purchase activation requires the Stripe account credentials and six Price IDs described in `SUBSCRIPTIONS.md`. Do not mark live billing as operational until Stripe test-mode checkout/webhook/cancellation tests pass.
