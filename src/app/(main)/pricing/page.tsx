import Link from 'next/link';
import { Check, Crown, Heart, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PLANS, formatPlanPrice, type PlanCode } from '@/lib/subscriptions/plans';

const features: Record<PlanCode, string[]> = {
  free: ['Full profile & photos', 'Partner preferences & match %', '10 interests / month', '3 private profile shares / month', '3 biodata templates', 'Mutual-match messaging'],
  plus: ['Everything in Free', 'Unlimited interests & messaging', 'Advanced match filters', 'See who likes you', '20 private profile shares / month', 'All biodata templates', 'Read receipts & family introduction', '1 profile boost / month'],
  premium: ['Everything in Plus', 'Unlimited private profile sharing', '4 profile boosts / month', 'Premium member badge', 'Full horoscope tools', 'Priority support', 'Priority visibility in relevant matches'],
};

const icons = { free: Heart, plus: Sparkles, premium: Crown };

export default function PricingPage() {
  return <main className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
    <div className="mx-auto max-w-3xl text-center">
      <span className="inline-flex rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary">CupidMatch membership</span>
      <h1 className="mt-5 font-headline text-4xl font-semibold tracking-tight sm:text-5xl">Choose how you want to find your match</h1>
      <p className="mt-4 text-lg text-muted-foreground">Start free. Upgrade when you want more communication, visibility and relationship tools.</p>
    </div>
    <div className="mt-12 grid gap-6 lg:grid-cols-3">
      {(Object.keys(PLANS) as PlanCode[]).map(code => {
        const plan = PLANS[code]; const Icon = icons[code];
        return <Card key={code} className={`relative flex flex-col overflow-hidden rounded-3xl ${plan.highlighted ? 'border-primary shadow-xl ring-1 ring-primary' : 'shadow-sm'}`}>
          {plan.highlighted && <div className="bg-primary py-2 text-center text-xs font-bold uppercase tracking-[.18em] text-primary-foreground">Most popular</div>}
          <CardHeader className="space-y-4 p-7">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div>
            <div><CardTitle className="text-2xl">{plan.name}</CardTitle><p className="mt-2 min-h-12 text-sm text-muted-foreground">{plan.description}</p></div>
            <div><span className="text-4xl font-bold">{formatPlanPrice(plan.monthlyPricePence)}</span>{plan.monthlyPricePence > 0 && <span className="text-muted-foreground"> / month</span>}</div>
          </CardHeader>
          <CardContent className="flex-1 px-7"><div className="space-y-3">{features[code].map(feature => <div key={feature} className="flex gap-3 text-sm"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary"/><span>{feature}</span></div>)}</div></CardContent>
          <CardFooter className="p-7"><Button asChild variant={plan.highlighted ? 'default' : 'outline'} className="h-12 w-full rounded-xl"><Link href={code === 'free' ? '/signup' : `/signup?plan=${code}`}>{code === 'free' ? 'Start free' : `Choose ${plan.name}`}</Link></Button></CardFooter>
        </Card>;
      })}
    </div>
    <p className="mt-8 text-center text-sm text-muted-foreground">No payment will be taken until secure checkout is enabled. Subscription billing will be connected through the payment-provider adapter.</p>
  </main>;
}
