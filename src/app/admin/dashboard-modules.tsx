"use client";
import Link from "next/link";
import {
  Users,
  Activity,
  UserCheck,
  BookHeart,
  CreditCard,
  BadgePoundSterling,
  Shield,
  ArrowUpRight,
  Sparkles,
  ShieldAlert,
} from "lucide-react";
import { useAdminResource } from "@/components/admin/use-admin-resource";
const modules = [
 {scope:"support",title:"Support inbox",detail:"Respond to member requests and track resolutions",icon:Users,href:"/admin/support",tint:"bg-cyan-50 text-cyan-700",category:"COMMUNITY"},
  {
    scope: "content",
    title: "Content moderation",
    detail: "Review member photos, biographies and publication",
    icon: Shield,
    href: "/admin/content",
    tint: "bg-orange-50 text-orange-700",
    category: "TRUST & SAFETY",
  },
  {
    scope: "manage",
    title: "Staff access",
    detail: "Delegate Support and Moderator permissions",
    icon: Users,
    href: "/admin/staff",
    tint: "bg-indigo-50 text-indigo-700",
    category: "SYSTEM",
  },
  {
    scope: "notifications",
    title: "Member notifications",
    detail: "Send notices and review read status",
    icon: Activity,
    href: "/admin/notifications",
    tint: "bg-cyan-50 text-cyan-700",
    category: "COMMUNITY",
  },
  {
    scope: "members",
    title: "Member management",
    detail: "Member directory, profiles and account review",
    icon: Users,
    href: "/admin/users",
    tint: "bg-violet-50 text-violet-700",
    category: "COMMUNITY",
  },
  {
    scope: "moderation",
    title: "Member reports",
    detail: "Safety moderation and report investigation",
    icon: ShieldAlert,
    href: "/admin/reports",
    tint: "bg-red-50 text-red-700",
    category: "TRUST & SAFETY",
  },
  {
    scope: "moderation",
    title: "Verification centre",
    detail: "Review submitted requests and profile status",
    icon: UserCheck,
    href: "/admin/verifications",
    tint: "bg-blue-50 text-blue-700",
    category: "TRUST & SAFETY",
  },
  {
    scope: "billing",
    title: "Subscriptions",
    detail: "View memberships and subscription records",
    icon: CreditCard,
    href: "/admin/subscriptions",
    tint: "bg-emerald-50 text-emerald-700",
    category: "REVENUE",
  },
  {
    scope: "billing",
    title: "Invitation codes",
    detail: "Generate, disable and track special launch offers",
    icon: Sparkles,
    href: "/admin/promo-codes",
    tint: "bg-purple-50 text-purple-700",
    category: "GROWTH",
  },
  {
    scope: "billing",
    title: "Plans & pricing",
    detail: "Review plan pricing and feature entitlements",
    icon: BadgePoundSterling,
    href: "/admin/plans",
    tint: "bg-amber-50 text-amber-700",
    category: "REVENUE",
  },
  {
    scope: "content",
    title: "Success stories",
    detail: "View community stories and submissions",
    icon: BookHeart,
    href: "/admin/success-stories",
    tint: "bg-rose-50 text-rose-700",
    category: "CONTENT",
  },
  {
    scope: "manage",
    title: "Security & audit",
    detail: "Review recorded administrative activity",
    icon: Shield,
    href: "/admin/security",
    tint: "bg-slate-100 text-slate-700",
    category: "SYSTEM",
  },
] as const;

export function AdminDashboardModules() {
  const { data, error, loading } = useAdminResource<{ permissions: string[] }>(
    "/api/admin/workspace-access",
  );
  if (loading) return <p role="status">Loading your management tools…</p>;
  if (error)
    return (
      <p role="alert">
        Unable to load available tools. Refresh the page to retry.
      </p>
    );
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {modules
        .filter((m) => data?.permissions.includes(m.scope))
        .map(({ title, detail, icon: Icon, href, tint, category }) => (
          <Link
            href={href}
            key={title}
            className="group flex min-h-[155px] flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-violet-200 hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <span
                className={`flex h-11 w-11 items-center justify-center rounded-xl ${tint}`}
              >
                <Icon className="h-5 w-5" />
              </span>
              <ArrowUpRight className="h-4 w-4 text-slate-400" />
            </div>
            <div className="mt-5">
              <p className="mb-1 text-[10px] font-bold tracking-widest text-slate-400">
                {category}
              </p>
              <h3 className="text-base font-bold text-slate-900">{title}</h3>
              <p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p>
            </div>
          </Link>
        ))}
    </div>
  );
}
