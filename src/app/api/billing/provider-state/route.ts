import { NextResponse } from 'next/server';
import { billingConfigured } from '@/lib/subscriptions/checkout';
export async function GET(){return NextResponse.json({configured:billingConfigured(),checkoutEnabled:false,webhookEnabled:false,portalEnabled:false},{headers:{'Cache-Control':'no-store'}});}
