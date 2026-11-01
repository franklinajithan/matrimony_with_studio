import { NextResponse } from 'next/server';
import { requireServerAdmin } from '@/lib/auth/admin';
import { invokeAccountOperation } from '@/lib/account/edge';
import { recentAccountUser } from '@/lib/account/server';
import { DeletionError } from '@/lib/account/deletion';
export const maxDuration = 60;
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export async function POST(request: Request) {
  const admin = await requireServerAdmin();
  if (!admin) return json({ error: 'Forbidden' }, 403);
  if (request.headers.get('origin') !== new URL(request.url).origin) return json({ error: 'Invalid origin' }, 403);
  try {
    const recent = await recentAccountUser();
    if (!recent || recent.user.id !== admin.id) return json({ error: 'Verify your administrator identity again' }, 401);
    const body = await request.json().catch(() => null);
    if (!uuid.test(body?.memberId || '') || typeof body?.email !== 'string' || !body.email.trim() || body.confirmation !== 'DELETE') return json({ error: 'Member, confirmation email and DELETE required' }, 400);
    if (body.memberId === admin.id) return json({ error: 'You cannot delete your own administrator account' }, 403);
    await invokeAccountOperation(recent.db, { action: 'admin-delete', memberId: body.memberId, email: body.email, confirmation: 'DELETE' });
    return json({ message: 'Member permanently deleted. The same email can register again.' });
  } catch (error) {
    return json({ error: error instanceof DeletionError ? error.message : 'Deletion backend unavailable. Check server configuration.' }, error instanceof DeletionError ? error.status : 503);
  }
}
