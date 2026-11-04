import { requireAdminPage } from '@/app/admin/guard';
import { LivePricing } from '@/components/subscriptions/LivePricing';
export const dynamic='force-dynamic';
export default async function AdminPlansPage(){await requireAdminPage();return <section className="space-y-6"><h1 className="text-3xl font-bold">Plans & pricing</h1><p>Current configured prices are shared with the public and member screens. No existing plan is renamed or repriced.</p><LivePricing /></section>;}
