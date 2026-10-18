import 'server-only';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { RegistrationStatus } from './status';
export async function getRegistrationStatus(): Promise<RegistrationStatus> {
  const db = await createSupabaseServerClient();
  const { data, error } = await db.from('registration_control').select('enabled,message,version,updated_at').eq('singleton', true).single();
  if (error || !data) throw new Error('Registration status is temporarily unavailable. Please try again later.');
  return data as RegistrationStatus;
}
