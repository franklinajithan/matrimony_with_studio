"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, ShieldCheck, CreditCard, Menu } from "lucide-react";
import { useState } from "react";

const primary = [
  { href: "/admin", label: "Home", icon: LayoutDashboard },
  { href: "/admin/users", label: "Members", icon: Users },
  { href: "/admin/verifications", label: "Reviews", icon: ShieldCheck },
  { href: "/admin/subscriptions", label: "Billing", icon: CreditCard },
];
const extra = [
  { href: "/admin/registration", label: "Registration controls" },
  { href: "/admin/plans", label: "Plans & pricing" },
  { href: "/admin/success-stories", label: "Success stories" },
  { href: "/admin/security", label: "Security & audit" },
];

export function AdminMobileTabBar() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreActive = extra.some(item => pathname.startsWith(item.href));
  return <>
    {moreOpen && <div className="fixed inset-0 z-40 bg-primary-dark/30 backdrop-blur-[2px] md:hidden" onClick={() => setMoreOpen(false)}>
      <div role="dialog" aria-label="More admin sections" className="absolute inset-x-3 bottom-[calc(5.75rem+env(safe-area-inset-bottom))] rounded-3xl border border-border bg-card p-4 shadow-elevated" onClick={event => event.stopPropagation()}>
        <p className="mb-3 px-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">More tools</p>
        {extra.map(item => <Link key={item.href} href={item.href} onClick={() => setMoreOpen(false)} className="block rounded-xl px-3 py-3 text-sm font-semibold text-foreground hover:bg-accent">{item.label}</Link>)}
      </div>
    </div>}
    <nav aria-label="Mobile admin tabs" className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-6px_25px_rgba(15,23,42,0.06)] backdrop-blur-xl md:hidden">
      <div className="grid h-[4.75rem] grid-cols-5 items-stretch px-1">
        {primary.map(({ href, label, icon: Icon }) => {
          const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
          return <Link key={href} href={href} aria-current={active ? "page" : undefined} onClick={() => setMoreOpen(false)}
            className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-semibold transition ${active ? "text-primary" : "text-muted-foreground"}`}>
            <span className={`flex h-8 w-12 items-center justify-center rounded-xl ${active ? "bg-accent" : ""}`}><Icon className="h-[19px] w-[19px]" /></span>{label}
          </Link>;
        })}
        <button type="button" aria-expanded={moreOpen} onClick={() => setMoreOpen(value => !value)}
          className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-semibold ${moreActive || moreOpen ? "text-primary" : "text-muted-foreground"}`}>
          <span className={`flex h-8 w-12 items-center justify-center rounded-xl ${moreActive || moreOpen ? "bg-accent" : ""}`}><Menu className="h-[19px] w-[19px]" /></span>More
        </button>
      </div>
    </nav>
  </>;
}
