import { NextResponse } from 'next/server';
import { tidePaymentReadiness } from '@/lib/subscriptions/tide-preparation';
export const dynamic='force-dynamic';
export async function GET(){return NextResponse.json(tidePaymentReadiness(),{headers:{'Cache-Control':'no-store'}});}
