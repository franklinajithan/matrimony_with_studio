"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Check, Crown, Heart, Sparkles, Globe2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PLANS, type PlanCode } from '@/lib/subscriptions/plans';
import { MARKETS, MARKET_PRICES, formatMarketPrice, type MarketCode } from '@/lib/subscriptions/markets';

const features: Record<PlanCode, string[]> = {
  free: ['Create & browse profiles', 'Basic matching', '10 interests / month', 'Messaging after a mutual match'],
  premium: ['Everything in Free', 'Unlimited interests*', 'Full compatibility analysis', 'Advanced search', 'See who liked/viewed you', 'Family Introduction Mode'],
  premium_plus: ['Everything in Premium', 'Unlimited interests*', 'Incognito & privacy controls', '4 profile boosts / month', 'Priority visibility', 'Premium+ badge'],
};
const icons = { free: Heart, premium: Sparkles, premium_plus: Crown };

export default function PricingPage() {
  const [market, setMarket] = useState<MarketCode>('GB');
  useEffect(() => {
    const saved = window.localStorage.getItem('cupidmatch-market') as MarketCode | null;
    if (saved && saved in MARKETS) setMarket(saved);
  }, []);
  const changeMarket = (value: MarketCode) => {
    setMarket(value);
    window.localStorage.setItem('cupidmatch-market', value);
  };

  return <main className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
    <div className="mx-auto max-w-3xl text-center">
      <span className="inline-flex rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary">CupidMatch membership</span>
      <h1 className="mt-5 font-headline text-4xl font-semibold tracking-tight sm:text-5xl">Choose how you want to find your match</h1>
      <p className="mt-4 text-lg text-muted-foreground">Start free. Upgrade for deeper discovery, compatibility, privacy and visibility tools.</p>
      <label className="mx-auto mt-6 flex w-full max-w-xs items-center gap-2 rounded-xl border bg-card px-3 py-2 text-left text-sm">
        <Globe2 className="h-4 w-4 shrink-0 text-primary" />
        <span className="sr-only">Pricing country</span>
        <select value={market} onChange={e=>changeMarket(e.target.value as MarketCode)} className="w-full bg-transparent py-1 outline-none">
          {(Object.keys(MARKETS) as MarketCode[]).map(code=><option key={code} value={code}>{MARKETS[code].name} · {MARKETS[code].currency}</option>)}
        </select>
      </label>
      <p className="mt-2 text-xs text-muted-foreground">Choose your billing country. We do not force pricing based only on your location.</p>
    </div>

    <div className="mt-12 grid gap-6 lg:grid-cols-3">{(Object.keys(PLANS) as PlanCode[]).map(code => {
      const plan=PLANS[code]; const Icon=icons[code]; const prices=MARKET_PRICES[market][code];
      return <Card key={code} className={`relative flex flex-col overflow-hidden rounded-3xl ${plan.highlighted?'border-primary shadow-xl ring-1 ring-primary':'shadow-sm'}`}>
        {plan.highlighted && <div className="bg-primary py-2 text-center text-xs font-bold uppercase tracking-[.18em] text-primary-foreground">Most Popular</div>}
        <CardHeader className="space-y-4 p-7">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Icon className="h-5 w-5"/></div>
          <div><CardTitle className="text-2xl">{plan.name}</CardTitle><p className="mt-2 min-h-12 text-sm text-muted-foreground">{plan.description}</p></div>
          <div><span className="text-4xl font-bold">{formatMarketPrice(market, prices.monthly)}</span>{prices.monthly>0&&<span className="text-muted-foreground"> / month</span>}</div>
          {code!=='free'&&<div className="grid grid-cols-2 gap-2 text-sm"><div className="rounded-xl bg-muted p-3"><strong>3 months</strong><br/>{formatMarketPrice(market,prices.three_months)}</div><div className="rounded-xl bg-muted p-3"><strong>6 months</strong><br/>{formatMarketPrice(market,prices.six_months)}</div></div>}
        </CardHeader>
        <CardContent className="flex-1 px-7"><div className="space-y-3">{features[code].map(feature=><div key={feature} className="flex gap-3 text-sm"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary"/><span>{feature}</span></div>)}</div></CardContent>
        <CardFooter className="p-7"><Button asChild variant={plan.highlighted?'default':'outline'} className="h-12 w-full rounded-xl"><Link href={code==='free'?'/signup':`/signup?plan=${code}&market=${market}`}>{code==='free'?'Start free':`Choose ${plan.name}`}</Link></Button></CardFooter>
      </Card>
    })}</div>
    <p className="mt-6 text-center text-xs text-muted-foreground">*Unlimited interests are subject to fair-use and anti-spam controls.</p>
    <p className="mt-2 text-center text-sm text-muted-foreground">Payments are currently on hold. Choosing a paid plan will not activate paid access until secure billing is enabled.</p>
  </main>;
}
