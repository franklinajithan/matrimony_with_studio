import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireServerAdmin } from '@/lib/subscriptions/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const admin = await requireServerAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from('subscription_plans').select('*').order('monthly_price_pence');
  if (error) return NextResponse.json({ error: 'Could not load plans' }, { status: 500 });
  return NextResponse.json({ plans: data }, { headers: { 'Cache-Control': 'no-store' } });
}
