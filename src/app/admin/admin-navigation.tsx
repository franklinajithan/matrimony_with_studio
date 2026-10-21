"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, ShieldCheck, CreditCard, Tags, Heart, Shield } from "lucide-react";

const links = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/users", label: "Members", icon: Users },
  { href: "/admin/verifications", label: "Verification", icon: ShieldCheck },
  { href: "/admin/subscriptions", label: "Subscriptions", icon: CreditCard },
  { href: "/admin/plans", label: "Plans", icon: Tags },
  { href: "/admin/promo-codes", label: "Promo Codes", icon: Tags },
  { href: "/admin/success-stories", label: "Stories", icon: Heart },
  { href: "/admin/registration", label: "Registration", icon: Users },
  { href: "/admin/horoscope", label: "Horoscope", icon: Shield },
  { href: "/admin/security", label: "Security", icon: Shield },
];

export function AdminNavigation() {
  const pathname = usePathname();
  return <nav aria-label="Admin navigation" className="mx-auto flex w-full max-w-screen-2xl gap-1.5 overflow-x-auto px-4 pb-3 sm:px-6">
    {links.map(({ href, label, icon: Icon }) => {
      const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
      return <Link key={href} href={href} aria-current={active ? "page" : undefined}
        className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold transition sm:text-sm ${active ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:bg-accent hover:text-primary"}`}>
        <Icon className="h-4 w-4" />{label}
      </Link>;
    })}
  </nav>;
}
