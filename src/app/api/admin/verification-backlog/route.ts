import { NextResponse } from 'next/server';
import { requireServerAdmin } from '@/lib/auth/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const admin = await requireServerAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from('profiles')
      .select('id,display_name,created_at,is_verified,is_published')
      .eq('is_published', true).eq('is_verified', false).eq('is_admin', false)
      .order('created_at', { ascending: true }).limit(100);
    if (error) throw error;
    return NextResponse.json({ profiles: data ?? [] }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'Verification backlog unavailable' }, { status: 503 });
  }
}
