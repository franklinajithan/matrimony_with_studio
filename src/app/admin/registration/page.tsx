import { requireAdminPage } from '@/app/admin/guard';
import RegistrationControls from './registration-controls';
export const dynamic = 'force-dynamic';
export default async function RegistrationPage() {
  await requireAdminPage();
  return <div className="mx-auto max-w-2xl space-y-6"><div><p className="text-sm font-semibold text-primary">Site access</p><h1 className="mt-1 text-3xl font-bold">Registration controls</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">Temporarily pause new members joining CupidMatch, then reopen whenever you are ready. Existing members can continue to log in.</p></div><RegistrationControls /></div>;
}
