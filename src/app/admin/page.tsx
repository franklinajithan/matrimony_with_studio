import { getAdminDashboardMetrics, type AdminDashboardMetrics } from "@/lib/admin/dashboard";
import { requireAdminPage } from "@/app/admin/guard";
import { Users, Activity, RefreshCw, UserCheck, BookHeart, CreditCard, BadgePoundSterling, Shield, ArrowUpRight, ArrowRight, LayoutDashboard, Sparkles, ShieldAlert } from "lucide-react";
import Link from "next/link";

const modules = [
  { title: "Registration controls", detail: "Pause or reopen new member registrations", icon: Users, href: "/admin/registration", tint: "bg-accent text-primary", category: "SITE ACCESS" },
  { title: "Member management", detail: "Member directory, profiles and account review", icon: Users, href: "/admin/users", tint: "bg-accent text-primary", category: "COMMUNITY" },
  { title: "Verification centre", detail: "Review submitted requests and profile status", icon: UserCheck, href: "/admin/verifications", tint: "bg-blue-50 text-blue-700", category: "TRUST & SAFETY" },
  { title: "Subscriptions", detail: "View memberships and subscription records", icon: CreditCard, href: "/admin/subscriptions", tint: "bg-emerald-50 text-emerald-700", category: "REVENUE" },
  { title: "Invitation codes", detail: "Generate, disable and track special launch offers", icon: Sparkles, href: "/admin/promo-codes", tint: "bg-accent text-primary", category: "GROWTH" },
  { title: "Plans & pricing", detail: "Review plan pricing and feature entitlements", icon: BadgePoundSterling, href: "/admin/plans", tint: "bg-amber-50 text-amber-700", category: "REVENUE" },
  { title: "Success stories", detail: "View community stories and submissions", icon: BookHeart, href: "/admin/success-stories", tint: "bg-rose-50 text-rose-700", category: "CONTENT" },
  { title: "Security & audit", detail: "Review recorded administrative activity", icon: Shield, href: "/admin/security", tint: "bg-accent text-foreground", category: "SYSTEM" },
] as const;

export default async function AdminDashboardPage() {
  await requireAdminPage();
  let metrics: AdminDashboardMetrics | null = null;
  try { metrics = await getAdminDashboardMetrics(); } catch { /* Never present unavailable counts as zero. */ }

  const stats = [
    { title: "Total members", value: metrics?.members, icon: Users, description: "Registered members excluding admins", href: "/admin/users", tint: "bg-accent text-primary" },
    { title: "Active members", value: metrics?.activeUsers, icon: Activity, description: "Signed in within the last 30 days", href: "/admin/users", tint: "bg-emerald-50 text-emerald-700" },
    { title: "Unverified profiles", value: metrics?.pendingVerification, icon: ShieldAlert, description: "Published profiles awaiting verification", href: "/admin/verifications", tint: "bg-amber-50 text-amber-700" },
  ];

  return <div className="space-y-8 pb-12">
    <section className="relative overflow-hidden rounded-[28px] border border-border bg-gradient-to-br from-accent via-white to-accent p-5 sm:p-8 lg:p-10">
      <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-accent/60 blur-3xl" aria-hidden="true" />
      <div className="relative flex flex-col justify-between gap-7 lg:flex-row lg:items-end">
        <div className="max-w-2xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-primary"><Sparkles className="h-3.5 w-3.5" /> CUPIDMATCH WORKSPACE</div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">Your admin overview<span className="text-primary">.</span></h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">A clear view of your community, member activity and the tools that keep CupidMatch running.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/users" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-dark">Manage members <ArrowUpRight className="h-4 w-4" /></Link>
          <Link href="/admin/verifications" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-semibold text-foreground transition hover:border-border">Review requests <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </div>
    </section>

    <section aria-label="Membership overview" className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><p className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-primary"><LayoutDashboard className="h-4 w-4" /> Live overview</p>
          <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">Community at a glance</h2>
          <p className="mt-1 text-xs text-muted-foreground">{metrics ? `Last updated ${new Date(metrics.updatedAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}` : "Live statistics unavailable"}</p>
        </div>
        <form action="/admin" method="get"><button type="submit" className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-3 text-xs font-semibold text-foreground transition hover:bg-background sm:text-sm"><RefreshCw className="h-4 w-4" /> Refresh</button></form>
      </div>
      {!metrics && <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Statistics are temporarily unavailable. Refresh to try again.</p>}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map(({ title, value, icon: Icon, description, href, tint }) =>
          <Link href={href} key={title} className="group min-w-0 rounded-2xl border border-border bg-card p-5 shadow-[0_2px_14px_rgba(15,23,42,0.035)] transition hover:-translate-y-0.5 hover:border-border hover:shadow-md sm:p-6">
            <div className="flex items-start justify-between gap-2"><span className="text-sm font-medium text-muted-foreground">{title}</span><span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tint}`}><Icon className="h-5 w-5" /></span></div>
            <p className="mt-3 text-4xl font-bold tabular-nums tracking-tight text-foreground sm:text-5xl" aria-label={value === undefined ? "Unavailable" : undefined}>{value === undefined ? "—" : value.toLocaleString("en-GB")}</p>
            <div className="mt-4 flex items-end justify-between gap-2"><p className="text-xs leading-5 text-muted-foreground">{description}</p><ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:text-primary" /></div>
          </Link>)}
      </div>
    </section>

    <section className="space-y-4">
      <div><p className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-primary">WORKSPACE</p><h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">Management tools</h2><p className="mt-1 text-sm text-muted-foreground">Choose an area to view and manage.</p></div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{modules.map(({ title, detail, icon: Icon, href, tint, category }) =>
        <Link href={href} key={title} className="group flex min-h-[155px] flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-[0_2px_14px_rgba(15,23,42,0.035)] transition hover:-translate-y-0.5 hover:border-border hover:shadow-md">
          <div className="flex items-start justify-between"><span className={`flex h-11 w-11 items-center justify-center rounded-xl ${tint}`}><Icon className="h-5 w-5" /></span><ArrowUpRight className="h-4 w-4 text-muted-foreground transition group-hover:text-primary" /></div>
          <div className="mt-5"><p className="mb-1 text-[10px] font-bold tracking-widest text-muted-foreground">{category}</p><h3 className="text-base font-bold text-foreground">{title}</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">{detail}</p></div>
        </Link>)}</div>
    </section>
  </div>;
}
