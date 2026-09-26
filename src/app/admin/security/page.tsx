import { requireAdminPage } from '@/app/admin/guard';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

type AuditEvent = {
  id: string;
  actor_id: string | null;
  action: string;
  target_type: string;
  target_id: string | null;
  created_at: string;
};

export default async function AdminSecurityPage() {
  await requireAdminPage();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from('admin_audit_log')
    .select('id,actor_id,action,target_type,target_id,created_at')
    .order('created_at', { ascending: false }).limit(100);
  const events = data as AuditEvent[] | null;
  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h1 className="text-3xl font-bold">Admin Security</h1>
        <p className="mt-2 text-sm text-slate-600">Recent administrative activity. Changes to roles require a separate audited server workflow.</p></div>
      <Link href="/admin" className="rounded-lg border bg-white px-4 py-2 text-sm">Back to dashboard</Link>
    </div>
    <Card><CardHeader><CardTitle>Audit activity</CardTitle>
      <CardDescription>Most recent 100 recorded events. Refresh the page to load recent activity.</CardDescription></CardHeader>
      <CardContent>
        {error ? <p role="alert">Audit activity is unavailable. Please try again.</p> :
          !events?.length ? <p>No audit events have been recorded.</p> :
          <div className="overflow-x-auto"><table className="w-full text-left text-sm">
            <thead><tr className="border-b"><th className="p-3">Time (UTC)</th><th className="p-3">Action</th><th className="p-3">Target</th><th className="p-3">Actor ID</th></tr></thead>
            <tbody>{events.map(event => <tr key={event.id} className="border-b">
              <td className="whitespace-nowrap p-3">{new Date(event.created_at).toLocaleString('en-GB', { timeZone: 'UTC' })}</td>
              <td className="p-3">{event.action}</td>
              <td className="p-3">{event.target_type}{event.target_id ? ` · ${event.target_id}` : ''}</td>
              <td className="p-3 font-mono text-xs">{event.actor_id ?? 'System'}</td>
            </tr>)}</tbody>
          </table></div>}
      </CardContent></Card>
  </div>;
}
