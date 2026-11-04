import { tidePaymentReadiness } from './tide-preparation';
import type { BillingTerm, PlanCode } from './plans';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'cancelled' | 'refunded';
export type GatewayReadiness = {
 provider:string; enabled:boolean; checkoutAvailable:boolean;
 automaticActivationAvailable:boolean; recurringBillingAvailable:boolean; reason:string;
};
/** Only trusted server adapters may produce a receipt, after provider verification. */
export type VerifiedPaymentReceipt = {
 intentId:string; eventId:string; providerReference:string;
 status:Exclude<PaymentStatus,'pending'>; amountPence:number; currency:'GBP';
};
export interface PaymentGateway {
 readonly provider:string;
 readiness():GatewayReadiness;
 createCheckout(input:{intentId:string;plan:Exclude<PlanCode,'free'>|'plus';term:BillingTerm}):Promise<{url:string;providerReference:string}>;
 verifyConfirmation(body:string,headers:Headers):Promise<VerifiedPaymentReceipt>;
}
/** Replace only after official merchant verification, sandbox acceptance and owner approval. */
export const tideGateway:PaymentGateway={
 provider:'tide',readiness:tidePaymentReadiness,
 async createCheckout(){throw new Error('Tide merchant checkout is not verified or enabled.');},
 async verifyConfirmation(){throw new Error('No verified Tide payment confirmation contract is available.');},
};
export function paymentGateway():PaymentGateway{return tideGateway;}
