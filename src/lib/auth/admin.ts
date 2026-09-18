import 'server-only';
import type { User } from '@supabase/supabase-js';
import { createSupabaseServerClient } from '@/lib/supabase/server';

type AdminAccess =
  | { status: 'authorized'; user: User }
  | { status: 'unauthenticated' | 'forbidden' | 'unavailable'; user: null };

/** Verify identity and read the current database role on every request. */
export async function getServerAdminAccess(): Promise<AdminAccess> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return { status: 'unauthenticated', user: null };

    // This existing RLS helper derives the caller from auth.uid(). Never trust
    // browser state, user_metadata, or a role supplied by the caller.
    const role = await supabase.rpc('is_admin');
    if (role.error) return { status: 'unavailable', user: null };
    if (role.data !== true) return { status: 'forbidden', user: null };
    return { status: 'authorized', user: data.user };
  } catch {
    // Configuration, Auth and database failures must never grant access.
    return { status: 'unavailable', user: null };
  }
}

/** API handlers must call this before any protected read or write. */
export async function requireServerAdmin(): Promise<User | null> {
  const access = await getServerAdminAccess();
  return access.status === 'authorized' ? access.user : null;
}
