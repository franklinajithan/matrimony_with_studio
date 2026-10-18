import { billingConfigured } from "./checkout";
export function billingProviderCapabilities() {
  return {
    credentialsConfigured: billingConfigured(),
    checkout: billingConfigured(),
    webhook: billingConfigured(),
    customerPortal: billingConfigured(),
  } as const;
}
