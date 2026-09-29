import { requireAdminPage } from '@/app/admin/guard';
import AdminReportDetailClient from './page-client';

export default async function AdminReportDetailPage({ params }: { params: { reportId: string } }) {
  await requireAdminPage();
  return <AdminReportDetailClient reportId={params.reportId} />;
}
