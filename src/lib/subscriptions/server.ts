import 'server-only';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { effectivePlanCode, type SubscriptionState } from './entitlements';
import { getPlan } from './plans';

export async function getServerSubscription() {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { user: null, plan: getPlan('free'), subscription: null };

  const { data } = await supabase
    .from('member_subscriptions')
    .select('plan_code,status,current_period_end,cancel_at_period_end')
    .eq('user_id', auth.user.id)
    .in('status', ['active', 'trialing', 'past_due'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const state: SubscriptionState | null = data ? { planCode: data.plan_code, status: data.status, currentPeriodEnd: data.current_period_end } : null;
  return { user: auth.user, subscription: data, plan: getPlan(effectivePlanCode(state)) };
}

export async function requireServerAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const { data, error } = await supabase.rpc('is_current_user_admin');
  return !error && data === true ? auth.user : null;
}
