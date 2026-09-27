import 'server-only';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { effectivePlanCode, type SubscriptionState } from './entitlements';
import { getPlan } from './plans';

export async function getServerSubscription() {
 const supabase=await createSupabaseServerClient();
 const {data:auth}=await supabase.auth.getUser();
 if(!auth.user)return {user:null,plan:getPlan('free'),subscription:null,trial:null};
 const [paid,launch]=await Promise.all([
  supabase.from('user_subscriptions').select('plan_code,status,current_period_end,cancel_at_period_end,provider_customer_id,provider_subscription_id').eq('user_id',auth.user.id).in('status',['active','trialing','past_due']).order('created_at',{ascending:false}).limit(1).maybeSingle(),
  supabase.from('member_trials').select('starts_at,ends_at,duration_months,promo_code_id').eq('user_id',auth.user.id).maybeSingle()
 ]);
 const sub=paid.data;
 const paidCode=sub?.plan_code==='plus'?'premium_plus':sub?.plan_code;
 const state:SubscriptionState|null=sub?{planCode:paidCode,status:sub.status,currentPeriodEnd:sub.current_period_end}:null;
 const effective=effectivePlanCode(state);
 const trial=launch.data;
 const trialActive=!!trial && new Date(trial.starts_at).getTime()<=Date.now() && new Date(trial.ends_at).getTime()>Date.now();
 const plan=effective!=='free'?getPlan(effective):trialActive?getPlan('premium'):getPlan('free');
 return {user:auth.user,subscription:sub,trial,plan};
}
export { requireServerAdmin } from '@/lib/auth/admin';
