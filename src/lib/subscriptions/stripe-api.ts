import 'server-only';

export async function stripeRequest<T>(path: string, options: { method?: 'GET' | 'POST'; body?: URLSearchParams; idempotencyKey?: string } = {}): Promise<T> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || !/^(sk|rk)_(test|live)_/.test(key)) throw new Error('Stripe API key is not configured');
  const response = await fetch('https://api.stripe.com/v1/' + path, {
    method: options.method ?? 'GET',
    headers: {
      Authorization: 'Bearer ' + key,
      ...(options.body ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
      ...(options.idempotencyKey ? { 'Idempotency-Key': options.idempotencyKey } : {}),
    },
    body: options.body?.toString(),
    cache: 'no-store',
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error('Stripe request failed');
  return (await response.json()) as T;
}

export type StripeSubscription = {
 id:string; customer:string; status:string; cancel_at_period_end:boolean;
 current_period_start?:number; current_period_end?:number;
 items:{data:Array<{price:{id:string};current_period_start?:number;current_period_end?:number}>};
 metadata:Record<string,string>;
};
export function stripeCheckoutReady() {
 const key = process.env.STRIPE_SECRET_KEY || '';
 const isTest = /^(sk|rk)_test_/.test(key);
 const isLive = /^(sk|rk)_live_/.test(key);
 const environmentSafe = process.env.VERCEL_ENV === 'production'
   ? (isLive && process.env.STRIPE_LIVE_APPROVED === 'true') : isTest;
 return process.env.STRIPE_CHECKOUT_ENABLED === 'true' && environmentSafe &&
   /^price_[a-zA-Z0-9]+$/.test(process.env.STRIPE_PRICE_PLUS_MONTHLY||'') &&
   /^price_[a-zA-Z0-9]+$/.test(process.env.STRIPE_PRICE_PREMIUM_MONTHLY||'') &&
   (process.env.STRIPE_PRICE_PLUS_MONTHLY !== process.env.STRIPE_PRICE_PREMIUM_MONTHLY) &&
   (process.env.STRIPE_WEBHOOK_SECRET||'').startsWith('whsec_') &&
   !!process.env.SUPABASE_SERVICE_ROLE_KEY;
}
