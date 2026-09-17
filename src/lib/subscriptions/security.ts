import type { SubscriptionStatus } from './types';

export const statusGrantsPaidAccess = (status?: string | null): status is Extract<SubscriptionStatus, 'active'|'trialing'> => status === 'active' || status === 'trialing';
export const mustUseVerifiedWebhook = true as const;
export const clientMayMutateSubscription = false as const;
