import { NextResponse } from 'next/server';
import { requireServerAdmin } from '@/lib/auth/admin';

export async function GET() {
  const admin = await requireServerAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  return NextResponse.json({ ok: true, admin: true });
}

