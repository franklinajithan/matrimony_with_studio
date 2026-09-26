import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  const { data, error } = await supabase.from('verification_requests')
    .select('id,status,member_note,created_at,reviewed_at')
    .eq('member_id', auth.user.id).order('created_at', { ascending: false }).limit(20);
  if (error) return NextResponse.json({ error: 'Unable to load requests' }, { status: 503 });
  return NextResponse.json({ requests: data ?? [] }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }
  if (!body || typeof body !== 'object' || Array.isArray(body) || typeof (body as { note?: unknown }).note !== 'string' || (body as { note: string }).note.length > 1000)
    return NextResponse.json({ error: 'Note must be text of at most 1000 characters' }, { status: 400 });
  const note = (body as { note: string }).note.trim();
  const { data: profile, error: profileError } = await supabase.from('profiles')
    .select('id,is_verified').eq('id', auth.user.id).single();
  if (profileError || !profile) return NextResponse.json({ error: 'Member profile required' }, { status: 403 });
  if (profile.is_verified) return NextResponse.json({ error: 'Profile already verified' }, { status: 409 });
  const { data, error } = await supabase.from('verification_requests')
    .insert({ member_id: auth.user.id, member_note: note }).select('id,status,created_at').single();
  if (error) return NextResponse.json({ error: error.code === '23505' ? 'A pending request already exists' : 'Unable to submit request' }, { status: error.code === '23505' ? 409 : 503 });
  return NextResponse.json({ request: data }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
}
