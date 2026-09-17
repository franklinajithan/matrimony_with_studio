import { NextResponse } from 'next/server';
import { stripePriceId } from '@/lib/subscriptions/checkout';
import { getServerSubscription } from '@/lib/subscriptions/server';

export async function GET() {
  const { user } = await getServerSubscription();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const configured = {
    premium: ['monthly','three_months','six_months'].every(term => Boolean(stripePriceId('premium', term as 'monthly'|'three_months'|'six_months'))),
    premium_plus: ['monthly','three_months','six_months'].every(term => Boolean(stripePriceId('premium_plus', term as 'monthly'|'three_months'|'six_months'))),
  };
  return NextResponse.json({ configured }, { headers: { 'Cache-Control': 'no-store' } });
}
