import { NextResponse } from 'next/server';
import { savingsPence } from '@/lib/subscriptions';
export async function GET(){return NextResponse.json({premium:{three_months:savingsPence('premium','three_months'),six_months:savingsPence('premium','six_months')},premium_plus:{three_months:savingsPence('premium_plus','three_months'),six_months:savingsPence('premium_plus','six_months')}});}
