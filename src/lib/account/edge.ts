import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { DeletionError } from './deletion';
export async function invokeAccountOperation(db: SupabaseClient, body: Record<string, unknown>, recoverySecret?: string) {
  const result = await db.functions.invoke('account-lifecycle', { body, ...(recoverySecret ? { headers: { 'x-recovery-secret': recoverySecret } } : {}) });
  if (result.error) {
    const response = result.error.context;
    const detail = response instanceof Response ? await response.json().catch(() => null) : null;
    throw new DeletionError(detail?.error || 'Account backend unavailable', response instanceof Response ? response.status : 503);
  }
  return result.data;
}
