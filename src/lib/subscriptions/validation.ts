import { z } from 'zod';
export const paidPlanSchema=z.enum(['premium','premium_plus']);
export const billingTermSchema=z.enum(['monthly','three_months','six_months']);
export const subscriptionStatusSchema=z.enum(['pending','active','trialing','past_due','canceled','expired','refunded']);
