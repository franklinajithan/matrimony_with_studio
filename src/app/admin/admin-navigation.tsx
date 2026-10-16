"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, ShieldCheck, CreditCard, Tags, Heart, Shield, ShieldAlert } from "lucide-react";

import {adminLinks} from '@/components/admin/admin-links';
import {useAdminResource} from '@/components/admin/use-admin-resource';

export function AdminNavigation() {
  const pathname = usePathname();
  const {data}=useAdminResource<{permissions:string[]}>('/api/admin/workspace-access');
  const links=adminLinks.filter(l=>l.scope==='workspace'||data?.permissions.includes(l.scope));
  return <nav aria-label="Admin navigation" className="mx-auto flex w-full max-w-screen-2xl gap-1.5 overflow-x-auto px-4 pb-3 sm:px-6">
    {links.map(({ href, label, icon: Icon }) => {
      const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
      return <Link key={href} href={href} aria-current={active ? "page" : undefined}
        className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold transition sm:text-sm ${active ? "bg-violet-700 text-white shadow-sm" : "text-slate-500 hover:bg-violet-50 hover:text-violet-700"}`}>
        <Icon className="h-4 w-4" />{label}
      </Link>;
    })}
  </nav>;
}
