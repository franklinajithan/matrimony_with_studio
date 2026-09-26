import type { ReactNode } from "react";
import { Logo } from "@/components/shared/Logo";
import Link from "next/link";
import { requireAdminPage } from "./guard";

export const dynamic = "force-dynamic";

const links = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/users", label: "Members" },
  { href: "/admin/verifications", label: "Verifications" },
  { href: "/admin/subscriptions", label: "Subscriptions" },
  { href: "/admin/plans", label: "Plans" },
  { href: "/admin/success-stories", label: "Stories" },
  { href: "/admin/security", label: "Security" },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdminPage();
  return <div className="flex min-h-screen flex-col bg-white text-slate-900">
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-screen-2xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <Link href="/admin" className="flex min-w-0 items-center gap-3">
          <Logo size="sm" textColor="text-slate-900" />
          <span className="hidden border-l border-slate-200 pl-3 text-sm font-semibold text-slate-600 sm:inline">Admin workspace</span>
        </Link>
        <Link href="/" className="shrink-0 rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 sm:text-sm">Back to main site</Link>
      </div>
      <nav aria-label="Admin navigation" className="mx-auto flex max-w-screen-2xl gap-2 overflow-x-auto px-4 pb-3 sm:px-6">
        {links.map(link => <Link key={link.href} href={link.href}
          className="shrink-0 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-800 sm:text-sm">{link.label}</Link>)}
      </nav>
    </header>
    <main className="mx-auto w-full max-w-screen-2xl flex-1 px-4 py-7 sm:px-6">{children}</main>
    <footer className="border-t border-slate-100 px-4 py-5 text-center text-xs text-slate-400">CupidMatch administration · {new Date().getFullYear()}</footer>
  </div>;
}
