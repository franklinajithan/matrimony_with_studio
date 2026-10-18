import { requireAdminPage } from '@/app/admin/guard';
import AdminPageClient from './page-client';

export default async function AdminPage() {
  await requireAdminPage("members");
  return <AdminPageClient />;
}
