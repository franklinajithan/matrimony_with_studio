import { redirect } from 'next/navigation';
import { requireServerAdmin } from '@/lib/subscriptions/server';

export async function requireAdminPage() {
  const admin = await requireServerAdmin();
  if (!admin) redirect('/login');
  return admin;
}
