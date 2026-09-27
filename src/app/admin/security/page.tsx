import { requireAdminPage } from '@/app/admin/guard';
import AuditExplorer from './audit-explorer';
export const dynamic='force-dynamic';
export default async function AdminSecurityPage(){await requireAdminPage();return <AuditExplorer/>;}
