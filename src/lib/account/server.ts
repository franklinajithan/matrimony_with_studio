import 'server-only';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { hasRecentAuthentication } from './recent-auth';
export async function recentAccountUser() {
  const db = await createSupabaseServerClient();
  const { data: session } = await db.auth.getSession();
  const token = session.session?.access_token;
  if (!token) return null;
  const { data, error } = await db.auth.getUser(token);
  if (error || !data.user) return null;
  // getUser verified this exact JWT; refresh iat is deliberately not used.
  const claims = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
  if (!hasRecentAuthentication(claims)) return null;
  const live = await db.rpc('account_session_is_live');
  if (live.error || live.data !== true) return null;
  return { user: data.user, db };
}
