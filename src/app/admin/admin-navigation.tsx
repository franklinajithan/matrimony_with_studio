"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, ShieldCheck, CreditCard, Tags, Heart, Shield, BarChart3, MessageSquare } from "lucide-react";

const links = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/feedback", label: "Feedback", icon: MessageSquare },
  { href: "/admin/users", label: "Members", icon: Users },
  { href: "/admin/verifications", label: "Verification", icon: ShieldCheck },
  { href: "/admin/subscriptions", label: "Subscriptions", icon: CreditCard },
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
  { href: "/admin/plans", label: "Plans", icon: Tags },
  { href: "/admin/promo-codes", label: "Promo Codes", icon: Tags },
  { href: "/admin/success-stories", label: "Stories", icon: Heart },
  { href: "/admin/registration", label: "Registration", icon: Users },
  { href: "/admin/horoscope", label: "Horoscope", icon: Shield },
  { href: "/admin/security", label: "Security", icon: Shield },
];

export function AdminNavigation() {
  const pathname = usePathname();
  return <nav aria-label="Admin navigation" className="mx-auto flex w-full max-w-screen-2xl flex-wrap gap-1.5 px-4 pb-3 sm:px-6">
    {links.map(({ href, label, icon: Icon }) => {
      const active = href === "/admin" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
      return <Link key={href} href={href} aria-current={active ? "page" : undefined}
        className={`flex shrink-0 items-center gap-2 rounded-t-lg border-x border-t border-b-2 px-2.5 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary xl:px-3 ${active ? "border-border border-b-primary bg-accent text-primary" : "border-transparent text-muted-foreground hover:bg-accent hover:text-primary"}`}>
        <Icon aria-hidden="true" className="h-4 w-4" />{label}
      </Link>;
    })}
  </nav>;
}
