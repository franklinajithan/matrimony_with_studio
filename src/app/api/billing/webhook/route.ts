import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST() {
  // Fail closed until the Stripe SDK and webhook secret are configured. This route
  // intentionally never trusts client redirects or unsigned JSON to grant a plan.
  return NextResponse.json({ error: 'Verified Stripe webhook handling is not configured.' }, { status: 503 });
}
