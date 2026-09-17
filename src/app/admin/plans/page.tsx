import { Crown, ShieldCheck, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PLANS, formatPlanPrice, type PlanCode } from '@/lib/subscriptions/plans';

export default function AdminPlansPage() {
  return <div className="space-y-7">
    <div><p className="text-sm font-semibold text-primary">Revenue & access</p><h1 className="mt-1 text-3xl font-bold text-slate-800">Plans & Pricing</h1><p className="mt-2 text-slate-500">The entitlement foundation used across CupidMatch. Billing activation is intentionally separate from plan access.</p></div>
    <div className="grid gap-5 lg:grid-cols-3">{(Object.keys(PLANS) as PlanCode[]).map(code => { const p=PLANS[code]; return <Card key={code} className="rounded-2xl"><CardHeader><CardTitle className="flex items-center justify-between"><span>{p.name}</span><span className="text-primary">{formatPlanPrice(p.monthlyPricePence)}</span></CardTitle></CardHeader><CardContent className="space-y-3 text-sm text-slate-600"><div className="flex items-center gap-2"><Sparkles className="h-4 w-4"/> Interests: {p.entitlements.interestsPerMonth ?? 'Unlimited'}</div><div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4"/> Shares: {p.entitlements.profileSharesPerMonth ?? 'Unlimited'}</div><div className="flex items-center gap-2"><Crown className="h-4 w-4"/> Boosts: {p.entitlements.profileBoostsPerMonth}/month</div><div>Advanced filters: {p.entitlements.advancedFilters ? 'Enabled' : 'Free basics only'}</div><div>Premium badge: {p.entitlements.premiumBadge ? 'Enabled' : 'Not included'}</div></CardContent></Card> })}</div>
    <Card><CardHeader><CardTitle>Management status</CardTitle></CardHeader><CardContent className="text-sm text-slate-600">Plan definitions, subscriptions and monthly usage are now modelled separately. Price/limit editing should be connected to a server-authorized admin API before production edits are allowed; this page deliberately does not expose insecure client-side database writes.</CardContent></Card>
  </div>;
}
