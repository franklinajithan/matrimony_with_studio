import { billingConfigured } from './checkout';
export function billingProviderCapabilities(){return {credentialsConfigured:billingConfigured(),checkout:false,webhook:false,customerPortal:false} as const;}
