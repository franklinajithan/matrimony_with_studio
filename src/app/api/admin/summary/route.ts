import { NextResponse } from 'next/server';
import { requireServerAdmin } from '@/lib/auth/admin';
import { getAdminDashboardMetrics } from '@/lib/admin/dashboard';

export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'no-store' };

export async function GET() {
  if (!await requireServerAdmin()) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers });
  }
  try {
    return NextResponse.json(await getAdminDashboardMetrics(), { headers });
  } catch {
    return NextResponse.json({ error: 'Dashboard statistics are unavailable.' }, { status: 503, headers });
  }
}
