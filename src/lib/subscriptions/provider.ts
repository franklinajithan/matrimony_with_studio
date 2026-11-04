import { tidePaymentReadiness } from './tide-preparation';
/** Report the active adapter, never legacy Stripe credentials as usable checkout. */
export function billingProviderCapabilities(){
 const readiness=tidePaymentReadiness();
 return {credentialsConfigured:readiness.credentialsConfigured,checkout:false,webhook:false,customerPortal:false} as const;
}
