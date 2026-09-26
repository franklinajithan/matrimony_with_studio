import { getAdminDashboardMetrics, type AdminDashboardMetrics } from '@/lib/admin/dashboard';
import { requireAdminPage } from '@/app/admin/guard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, Activity, RefreshCw, UserCheck, MessageSquareWarning, Settings, BookHeart, CreditCard, BadgePoundSterling, Shield, BarChart3, LifeBuoy } from 'lucide-react';
import Link from 'next/link';

const sections = [
  ['Members','Search, review and manage member accounts.',Users,'/admin/users'],
  ['Plans & Pricing','View membership plans and pricing.',BadgePoundSterling,'/admin/plans'],
  ['Subscriptions','Review memberships, renewals and account access.',CreditCard,'/admin/subscriptions'],
  ['Profile Verification','Review published profiles awaiting verification.',UserCheck,'/admin/verifications'],
  ['Success Stories','Manage community success stories.',BookHeart,'/admin/success-stories'],
  ['Admin Security','Review recorded administrative audit activity.',Shield,'/admin/security'],
] as const;

export default async function AdminDashboardPage() {
  await requireAdminPage();
  let metrics: AdminDashboardMetrics | null = null;
  try {
    metrics = await getAdminDashboardMetrics();
  } catch {
    // An unavailable count must never be presented as zero.
  }
  const stats = [
    { title: 'Member count', value: metrics?.members, icon: Users, color: 'bg-violet-50 text-violet-700', description: 'Registered member profiles, excluding admins' },
    { title: 'Active users', value: metrics?.activeUsers, icon: Activity, color: 'bg-emerald-50 text-emerald-700', description: 'Members who signed in within the last 30 days' },
    { title: 'Pending verification', value: metrics?.pendingVerification, icon: UserCheck, color: 'bg-amber-50 text-amber-700', description: 'Published member profiles not yet verified' },
  ];

 return <div className="space-y-7"><div><p className="text-sm font-semibold text-primary">CupidMatch operations</p><h1 className="mt-1 text-3xl font-bold text-slate-800">Admin Control Centre</h1><p className="mt-2 text-slate-500">Manage members, subscriptions, safety and the commercial platform from one place.</p></div><section aria-label="Membership overview" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="text-lg font-semibold text-slate-800">Membership overview</h2>
          <p className="text-xs text-slate-500">{metrics ? `Updated ${new Date(metrics.updatedAt).toLocaleString('en-GB', { timeZone: 'UTC' })} UTC` : 'Statistics could not be loaded'}</p>
        </div>
        <form action="/admin" method="get"><button type="submit" className="inline-flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm font-medium hover:bg-slate-50"><RefreshCw className="h-4 w-4"/>Refresh counts</button></form>
      </div>
      {!metrics && <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Dashboard statistics are temporarily unavailable. Please refresh to try again.</p>}
      <div className="grid gap-4 md:grid-cols-3">{stats.map(({ title, value, icon: Icon, color, description }) => (
        <Card key={title} className="rounded-2xl border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium text-slate-600">{title}</CardTitle><span className={`rounded-xl p-2.5 ${color}`}><Icon className="h-5 w-5"/></span></CardHeader>
          <CardContent><p className="text-4xl font-bold tabular-nums tracking-tight text-slate-900" aria-label={value === undefined ? 'Unavailable' : undefined}>{value === undefined ? '—' : value.toLocaleString('en-GB')}</p><p className="mt-3 text-sm text-slate-500">{description}</p></CardContent>
        </Card>
      ))}</div>
    </section><div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{sections.map(([title,description,Icon,href]) => <Link href={href} key={title}><Card className="h-full rounded-2xl transition hover:-translate-y-0.5 hover:shadow-lg"><CardHeader><div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5"/></div><CardTitle className="text-lg">{title}</CardTitle></CardHeader><CardContent><CardDescription>{description}</CardDescription></CardContent></Card></Link>)}</div></div>;
}

