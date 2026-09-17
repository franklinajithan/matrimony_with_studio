import { NextResponse } from 'next/server';
import { billingConfigured } from '@/lib/subscriptions/checkout';

export async function GET() {
  const configured = billingConfigured();
  return NextResponse.json({ billing: configured ? 'configured' : 'disabled' }, { status: configured ? 200 : 503, headers: { 'Cache-Control': 'no-store' } });
}
