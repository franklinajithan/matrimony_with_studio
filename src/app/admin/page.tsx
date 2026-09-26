import { getAdminDashboardMetrics, type AdminDashboardMetrics } from "@/lib/admin/dashboard";
import { requireAdminPage } from "@/app/admin/guard";
import { Users, Activity, RefreshCw, UserCheck, BookHeart, CreditCard, BadgePoundSterling, Shield, ArrowUpRight, ArrowRight, LayoutDashboard, Sparkles, ShieldAlert } from "lucide-react";
import Link from "next/link";

const modules = [
  { title: "Member management", detail: "Member directory, profiles and account review", icon: Users, href: "/admin/users", tint: "bg-violet-50 text-violet-700", category: "COMMUNITY" },
  { title: "Verification centre", detail: "Review submitted requests and profile status", icon: UserCheck, href: "/admin/verifications", tint: "bg-blue-50 text-blue-700", category: "TRUST & SAFETY" },
  { title: "Subscriptions", detail: "View memberships and subscription records", icon: CreditCard, href: "/admin/subscriptions", tint: "bg-emerald-50 text-emerald-700", category: "REVENUE" },
  { title: "Plans & pricing", detail: "Review plan pricing and feature entitlements", icon: BadgePoundSterling, href: "/admin/plans", tint: "bg-amber-50 text-amber-700", category: "REVENUE" },
  { title: "Success stories", detail: "View community stories and submissions", icon: BookHeart, href: "/admin/success-stories", tint: "bg-rose-50 text-rose-700", category: "CONTENT" },
  { title: "Security & audit", detail: "Review recorded administrative activity", icon: Shield, href: "/admin/security", tint: "bg-slate-100 text-slate-700", category: "SYSTEM" },
] as const;

export default async function AdminDashboardPage() {
  await requireAdminPage();
  let metrics: AdminDashboardMetrics | null = null;
  try { metrics = await getAdminDashboardMetrics(); } catch { /* Never present unavailable counts as zero. */ }

  const stats = [
    { title: "Total members", value: metrics?.members, icon: Users, description: "Registered members excluding admins", href: "/admin/users", tint: "bg-violet-50 text-violet-700" },
    { title: "Active members", value: metrics?.activeUsers, icon: Activity, description: "Signed in within the last 30 days", href: "/admin/users", tint: "bg-emerald-50 text-emerald-700" },
    { title: "Unverified profiles", value: metrics?.pendingVerification, icon: ShieldAlert, description: "Published profiles awaiting verification", href: "/admin/verifications", tint: "bg-amber-50 text-amber-700" },
  ];

  return <div className="space-y-8 pb-12">
    <section className="relative overflow-hidden rounded-[28px] border border-violet-100 bg-gradient-to-br from-[#faf8ff] via-white to-[#f3f7ff] p-5 sm:p-8 lg:p-10">
      <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-violet-100/60 blur-3xl" aria-hidden="true" />
      <div className="relative flex flex-col justify-between gap-7 lg:flex-row lg:items-end">
        <div className="max-w-2xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white px-3 py-1.5 text-xs font-semibold text-violet-700"><Sparkles className="h-3.5 w-3.5" /> CUPIDMATCH WORKSPACE</div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">Your admin overview<span className="text-violet-600">.</span></h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">A clear view of your community, member activity and the tools that keep CupidMatch running.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/users" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-violet-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-800">Manage members <ArrowUpRight className="h-4 w-4" /></Link>
          <Link href="/admin/verifications" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 transition hover:border-violet-200">Review requests <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </div>
    </section>

    <section aria-label="Membership overview" className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><p className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-violet-700"><LayoutDashboard className="h-4 w-4" /> Live overview</p>
          <h2 className="text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">Community at a glance</h2>
          <p className="mt-1 text-xs text-slate-500">{metrics ? `Last updated ${new Date(metrics.updatedAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}` : "Live statistics unavailable"}</p>
        </div>
        <form action="/admin" method="get"><button type="submit" className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 sm:text-sm"><RefreshCw className="h-4 w-4" /> Refresh</button></form>
      </div>
      {!metrics && <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Statistics are temporarily unavailable. Refresh to try again.</p>}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map(({ title, value, icon: Icon, description, href, tint }) =>
          <Link href={href} key={title} className="group min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_14px_rgba(15,23,42,0.035)] transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-md sm:p-6">
            <div className="flex items-start justify-between gap-2"><span className="text-sm font-medium text-slate-600">{title}</span><span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tint}`}><Icon className="h-5 w-5" /></span></div>
            <p className="mt-3 text-4xl font-bold tabular-nums tracking-tight text-slate-950 sm:text-5xl" aria-label={value === undefined ? "Unavailable" : undefined}>{value === undefined ? "—" : value.toLocaleString("en-GB")}</p>
            <div className="mt-4 flex items-end justify-between gap-2"><p className="text-xs leading-5 text-slate-500">{description}</p><ArrowUpRight className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:text-violet-600" /></div>
          </Link>)}
      </div>
    </section>

    <section className="space-y-4">
      <div><p className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-violet-700">WORKSPACE</p><h2 className="text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">Management tools</h2><p className="mt-1 text-sm text-slate-500">Choose an area to view and manage.</p></div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{modules.map(({ title, detail, icon: Icon, href, tint, category }) =>
        <Link href={href} key={title} className="group flex min-h-[155px] flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_14px_rgba(15,23,42,0.035)] transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-md">
          <div className="flex items-start justify-between"><span className={`flex h-11 w-11 items-center justify-center rounded-xl ${tint}`}><Icon className="h-5 w-5" /></span><ArrowUpRight className="h-4 w-4 text-slate-400 transition group-hover:text-violet-600" /></div>
          <div className="mt-5"><p className="mb-1 text-[10px] font-bold tracking-widest text-slate-400">{category}</p><h3 className="text-base font-bold text-slate-900">{title}</h3><p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p></div>
        </Link>)}</div>
    </section>
  </div>;
}
