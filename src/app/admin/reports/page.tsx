import { requireAdminPage } from '@/app/admin/guard';
import AdminReportsPageClient from './page-client';

export default async function AdminReportsPage() {
  await requireAdminPage("moderation");
  return <AdminReportsPageClient />;
}
