import { requireAdminPage } from '@/app/admin/guard';
import PaymentDashboard from './page-client';
export const dynamic='force-dynamic';
export default async function PaymentsPage(){await requireAdminPage();return <PaymentDashboard/>;}
