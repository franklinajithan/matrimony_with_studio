import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';

export class DeletionError extends Error {
  constructor(message: string, public status = 503) { super(message); }
}
/** Durable, retryable saga. The tombstone outlives Auth, including a lost response. */
export async function deleteAccount(db: SupabaseClient, userId: string, actorId: string, email?: string) {
  const { data: prior, error: priorError } = await db.from('account_deletions').select('state').eq('user_id', userId).maybeSingle();
  if (priorError) throw new DeletionError('Deletion backend unavailable');
  if (prior?.state === 'completed') return;
  const { data: account, error: accountError } = await db.auth.admin.getUserById(userId);
  if (!account.user && prior && (accountError?.status === 404 || accountError?.code === 'user_not_found')) {
    const result = await db.from('account_deletions').update({ state: 'completed', completed_at: new Date().toISOString(), lease_until: null, error_code: null }).eq('user_id', userId);
    if (result.error) throw new DeletionError('Unable to record completion');
    return;
  }
  if (accountError || !account.user) throw new DeletionError('Member not found', 404);
  if (email && account.user.email?.toLowerCase() !== email.trim().toLowerCase()) throw new DeletionError('Confirmation email does not match', 400);
  const { data: profile, error: profileError } = await db.from('profiles').select('is_admin').eq('id', userId).single();
  if (profileError) throw new DeletionError('Unable to verify member');
  if (profile.is_admin) throw new DeletionError('Administrator accounts require separate controls', 403);
  const billing = await db.rpc('account_billing_active', { p_user: userId });
  if (billing.error) throw new DeletionError('Unable to check paid subscriptions');
  if (billing.data) throw new DeletionError('Cancel the paid subscription with the payment provider first', 409);
  const begin = await db.rpc('account_begin_deletion', { p_user: userId, p_actor: actorId });
  if (begin.error) throw new DeletionError('Unable to lock account for deletion');
  // A single atomic UPDATE claims the job; a crashed worker can be retried later.
  const now = new Date();
  const claim = await db.from('account_deletions').update({ state: 'processing', lease_until: new Date(now.getTime() + 300_000).toISOString() })
    .eq('user_id', userId).or(`lease_until.is.null,lease_until.lt.${now.toISOString()}`).select('user_id,attempts').maybeSingle();
  if (claim.error) throw new DeletionError('Unable to claim deletion');
  if (!claim.data) throw new DeletionError('Deletion is already in progress', 409);
  let stage = 'disable_login';
  try {
    const ban = await db.auth.admin.updateUserById(userId, { ban_duration: '876000h' });
    if (ban.error) throw ban.error;
    stage = 'storage';
    for (let batch = 0; batch < 1000; batch++) {
      const objects = await db.rpc('account_storage_objects', { p_user: userId });
      if (objects.error) throw objects.error;
      const rows = objects.data as { bucket_id: string; name: string }[];
      if (!rows.length) break;
      for (const bucket of new Set(rows.map(o => o.bucket_id))) {
        const removed = await db.storage.from(bucket).remove(rows.filter(o => o.bucket_id === bucket).map(o => o.name));
        if (removed.error) throw removed.error;
      }
      if (batch === 999) throw new Error('Storage backlog');
    }
    stage = 'relationships';
    const residuals = await db.rpc('account_erase_residuals', { p_user: userId });
    if (residuals.error) throw residuals.error;
    stage = 'auth';
    const removed = await db.auth.admin.deleteUser(userId, false);
    if (removed.error) throw removed.error;
    stage = 'completion';
    const complete = await db.from('account_deletions').update({ state: 'completed', completed_at: new Date().toISOString(), lease_until: null, error_code: null, attempts: claim.data.attempts + 1 }).eq('user_id', userId);
    if (complete.error) throw complete.error;
  } catch {
    // No email, tokens, content, file paths or provider error payloads enter logs.
    console.error('account_deletion_failed', { userId, stage });
    await db.from('account_deletions').update({ state: 'failed', error_code: stage, lease_until: null, attempts: claim.data.attempts + 1 }).eq('user_id', userId);
    throw new DeletionError('Deletion is pending recovery. Your account is locked and hidden. Support can retry it safely.');
  }
}
