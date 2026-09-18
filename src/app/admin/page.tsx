import { requireAdminPage } from '@/app/admin/guard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, UserCheck, MessageSquareWarning, Settings, BookHeart, CreditCard, BadgePoundSterling, Shield, BarChart3, LifeBuoy } from 'lucide-react';
import Link from 'next/link';

const sections = [
  ['Members','Search, review and manage member accounts.',Users,'/admin/users'],
  ['Plans & Pricing','Manage Free, Plus and Premium access rules.',BadgePoundSterling,'/admin/plans'],
  ['Subscriptions','Review memberships, renewals and account access.',CreditCard,'/admin/subscriptions'],
  ['Profile Verification','Review identity and profile verification requests.',UserCheck,'/admin/verifications'],
  ['Moderation & Reports','Review reported profiles, messages and safety cases.',MessageSquareWarning,'/admin/reports'],
  ['Success Stories','Manage community success stories.',BookHeart,'/admin/success-stories'],
  ['Analytics','Monitor membership, engagement and conversion metrics.',BarChart3,'/admin/analytics'],
  ['Support','Handle member support and account assistance.',LifeBuoy,'/admin/support'],
  ['Site Settings','Manage operational feature and site configuration.',Settings,'/admin/settings'],
  ['Admin Security','Roles, permissions and audit activity.',Shield,'/admin/security'],
] as const;

export default async function AdminDashboardPage() {
  await requireAdminPage();

 return <div className="space-y-7"><div><p className="text-sm font-semibold text-primary">CupidMatch operations</p><h1 className="mt-1 text-3xl font-bold text-slate-800">Admin Control Centre</h1><p className="mt-2 text-slate-500">Manage members, subscriptions, safety and the commercial platform from one place.</p></div><div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{sections.map(([title,description,Icon,href]) => <Link href={href} key={title}><Card className="h-full rounded-2xl transition hover:-translate-y-0.5 hover:shadow-lg"><CardHeader><div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5"/></div><CardTitle className="text-lg">{title}</CardTitle></CardHeader><CardContent><CardDescription>{description}</CardDescription></CardContent></Card></Link>)}</div></div>;
}

