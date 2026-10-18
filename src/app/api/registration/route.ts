import { NextResponse } from 'next/server';
import { getRegistrationStatus } from '@/lib/registration/server';
export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    return NextResponse.json(await getRegistrationStatus(), { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'Registration is temporarily unavailable. Please try again later.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
