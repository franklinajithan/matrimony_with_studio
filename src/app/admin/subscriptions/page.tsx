import { requireAdminPage } from '@/app/admin/guard';
import AdminSubscriptionsClient from './page-client';
export const dynamic='force-dynamic';
export default async function AdminSubscriptionsPage(){await requireAdminPage();return <AdminSubscriptionsClient/>;}
