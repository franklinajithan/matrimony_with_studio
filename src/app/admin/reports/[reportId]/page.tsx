import { requireAdminPage } from '@/app/admin/guard';
import AdminReportDetailClient from './page-client';

export default async function AdminReportDetailPage({ params }: { params?: Promise<{ reportId: string }> }) {
  await requireAdminPage("moderation");
  const resolved = params ? await params : { reportId: "" };
  return <AdminReportDetailClient reportId={resolved.reportId} />;
}
