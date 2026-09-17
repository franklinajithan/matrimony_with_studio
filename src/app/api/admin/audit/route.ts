import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireServerAdmin } from '@/lib/subscriptions/server';

export const dynamic = 'force-dynamic';
export async function GET() {
  const admin = await requireServerAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from('admin_audit_log').select('*').order('created_at', { ascending: false }).limit(250);
  if (error) return NextResponse.json({ error: 'Could not load audit log' }, { status: 500 });
  return NextResponse.json({ events: data }, { headers: { 'Cache-Control': 'no-store' } });
}
