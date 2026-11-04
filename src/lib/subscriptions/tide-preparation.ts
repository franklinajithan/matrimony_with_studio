/**
 * Credential-free payment configuration.
 * No payment or entitlement activation is permitted through this module.
 * Tide Payment Links being visible in the app does NOT establish an API,
 * signed webhook, subscription or automated checkout capability.
 */
export const PREMIUM_TRIAL_MONTHS = 2 as const;
export const PAYMENT_PROVIDER = 'tide' as const;

export type PaymentReadiness = {
  provider: typeof PAYMENT_PROVIDER;
  enabled: false;
  credentialsConfigured: false;
  checkoutAvailable: false;
  automaticActivationAvailable: false;
  recurringBillingAvailable: false;
  premiumTrialMonths: typeof PREMIUM_TRIAL_MONTHS;
  reason: string;
};

/** Fail-closed until Tide's official integration contract is verified. */
export function tidePaymentReadiness(): PaymentReadiness {
  return {
    provider: PAYMENT_PROVIDER,
    enabled: false,
    credentialsConfigured: false,
    checkoutAvailable: false,
    automaticActivationAvailable: false,
    recurringBillingAvailable: false,
    premiumTrialMonths: PREMIUM_TRIAL_MONTHS,
    reason: 'Tide payment API and verification mechanism have not been confirmed.',
  };
}

/** UTC calendar-month arithmetic, clamping to the last valid day of the target month. */
export function calculatePremiumTrialEnd(start: Date): Date {
  if (!(start instanceof Date) || !Number.isFinite(start.getTime())) {
    throw new TypeError('A valid trial start date is required');
  }
  const year = start.getUTCFullYear();
  const month = start.getUTCMonth() + PREMIUM_TRIAL_MONTHS;
  const day = Math.min(start.getUTCDate(), new Date(Date.UTC(year, month + 1, 0)).getUTCDate());
  return new Date(Date.UTC(year, month, day, start.getUTCHours(), start.getUTCMinutes(), start.getUTCSeconds(), start.getUTCMilliseconds()));
}
