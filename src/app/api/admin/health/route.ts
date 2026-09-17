import { NextResponse } from 'next/server';
import { requireServerAdmin } from '@/lib/subscriptions/server';

export async function GET() {
  const admin = await requireServerAdmin();
  return NextResponse.json({ adminAccess: Boolean(admin) }, { status: admin ? 200 : 403, headers: { 'Cache-Control': 'no-store' } });
}
