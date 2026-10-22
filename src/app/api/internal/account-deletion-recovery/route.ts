import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { invokeAccountOperation } from '@/lib/account/edge';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const supplied = Buffer.from(request.headers.get('authorization') || '');
  const expected = Buffer.from(`Bearer ${secret || ''}`);
  if (!secret || supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const result = await invokeAccountOperation(await createSupabaseServerClient(), { action: 'recover' }, secret);
    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch { return NextResponse.json({ error: 'Recovery incomplete; will retry' }, { status: 503 }); }
}
