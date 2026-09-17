import { NextResponse } from 'next/server';
import { requireServerAdmin } from '@/lib/subscriptions/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const admin = await requireServerAdmin();
  if (!admin) return NextResponse.json({ admin: false }, { status: 403, headers: { 'Cache-Control': 'no-store' } });
  return NextResponse.json({ admin: true }, { headers: { 'Cache-Control': 'no-store' } });
}
