import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireServerAdmin } from '@/lib/subscriptions/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const admin = await requireServerAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from('member_subscriptions').select('id,user_id,plan_code,billing_term,status,current_period_start,current_period_end,cancel_at_period_end,created_at').order('created_at', { ascending: false }).limit(250);
  if (error) return NextResponse.json({ error: 'Could not load subscriptions' }, { status: 500 });
  return NextResponse.json({ subscriptions: data }, { headers: { 'Cache-Control': 'no-store' } });
}
