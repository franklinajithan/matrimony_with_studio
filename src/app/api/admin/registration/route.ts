import { NextResponse } from 'next/server';
import { requireServerAdmin } from '@/lib/auth/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getRegistrationStatus } from '@/lib/registration/server';
export const dynamic = 'force-dynamic';
export async function GET() {
  if (!await requireServerAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try { return NextResponse.json(await getRegistrationStatus(), { headers: { 'Cache-Control': 'no-store' } }); }
  catch { return NextResponse.json({ error: 'Could not load registration settings.' }, { status: 503 }); }
}
export async function PATCH(request: Request) {
  if (!await requireServerAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  if (request.headers.get('origin') !== new URL(request.url).origin) return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid request' }, { status: 400 }); }
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  const { enabled, message, version } = body as Record<string, unknown>;
  if (typeof enabled !== 'boolean' || typeof message !== 'string' || !message.trim() || message.trim().length > 300 || typeof version !== 'number' || !Number.isSafeInteger(version) || version < 1)
    return NextResponse.json({ error: 'Choose enabled or paused and enter a message of 1–300 characters.' }, { status: 400 });
  const db = await createSupabaseServerClient();
  const { data, error } = await db.rpc('set_registration_access', { p_enabled: enabled, p_message: message.trim(), p_version: version });
  if (error) return NextResponse.json({ error: error.code === '40001' ? 'Settings changed. Refresh and try again.' : 'Could not save registration settings.' }, { status: error.code === '40001' ? 409 : 500 });
  return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } });
}
