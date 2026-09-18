import 'server-only';
import { redirect } from 'next/navigation';
import { getServerAdminAccess } from '@/lib/auth/admin';

export async function requireAdminPage() {
  const access = await getServerAdminAccess();
  if (access.status === 'unauthenticated') redirect('/login?next=%2Fadmin');
  if (access.status === 'forbidden') redirect('/dashboard');
  if (access.status !== 'authorized') {
    throw new Error('Admin access could not be verified. Please try again later.');
  }
  return access.user;
}
