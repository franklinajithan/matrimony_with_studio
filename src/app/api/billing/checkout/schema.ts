import { z } from 'zod';
export const checkoutSchema = z.object({ plan: z.enum(['premium','premium_plus']), term: z.enum(['monthly','three_months','six_months']) });
