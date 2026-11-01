import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { invokeAccountOperation } from '@/lib/account/edge';
import { recentAccountUser } from '@/lib/account/server';
import { DeletionError } from '@/lib/account/deletion';
export const maxDuration = 60;
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
export async function GET() {
  try {
    const db = await createSupabaseServerClient();
    const { data, error } = await db.auth.getUser();
    if (error || !data.user) return json({ error: 'Sign in required' }, 401);
    const profile = await db.from('profiles').select('deactivated_at').eq('id', data.user.id).single();
    if (profile.error) return json({ error: 'Account unavailable' }, 503);
    return json({ deactivated: Boolean(profile.data.deactivated_at) });
  } catch { return json({ error: 'Account unavailable' }, 503); }
}
export async function POST(request: Request) {
  if (request.headers.get('origin') !== new URL(request.url).origin) return json({ error: 'Invalid origin' }, 403);
  try {
    const context = await recentAccountUser();
    if (!context) return json({ error: 'Verify your identity again before continuing' }, 401);
    const body = await request.json().catch(() => null);
    if (!['delete', 'deactivate', 'reactivate'].includes(body?.action)) return json({ error: 'Invalid action' }, 400);
    if (body.confirmation !== (body.action === 'delete' ? 'DELETE' : 'CONFIRM')) return json({ error: 'Explicit confirmation required' }, 400);
    if (body.action === 'delete') {
      await invokeAccountOperation(context.db, { action: 'delete', confirmation: body.confirmation });
      await context.db.auth.signOut({ scope: 'local' });
    } else {
      await invokeAccountOperation(context.db, { action: body.action, confirmation: body.confirmation });
    }
    return json({ success: true });
  } catch (error) {
    return json({ error: error instanceof DeletionError ? error.message : 'Account service unavailable. Please try again.' }, error instanceof DeletionError ? error.status : 503);
  }
}
