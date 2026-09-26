import type { ReactNode } from "react";
import { Logo } from "@/components/shared/Logo";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { requireAdminPage } from "./guard";
import { AdminNavigation } from "./admin-navigation";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdminPage();
  return <div className="flex min-h-screen flex-col bg-[#fafbfe] text-slate-900">
    <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/95 shadow-[0_2px_16px_rgba(15,23,42,0.035)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-screen-2xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href="/admin" className="flex min-w-0 items-center gap-2" aria-label="CupidMatch admin home">
          <span className="flex max-w-[150px] items-center overflow-hidden sm:max-w-none"><Logo size="sm" textColor="text-slate-900" /></span>
          <span className="hidden border-l border-slate-200 pl-3 text-xs font-bold uppercase tracking-widest text-violet-700 lg:inline">Workspace</span>
        </Link>
        <Link href="/" className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 sm:text-sm">Main site <ArrowUpRight className="h-3.5 w-3.5" /></Link>
      </div>
      <AdminNavigation />
    </header>
    <main className="mx-auto w-full max-w-screen-2xl flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    <footer className="border-t border-slate-100 bg-white px-4 py-5 text-center text-xs text-slate-400">CupidMatch administration · {new Date().getFullYear()}</footer>
  </div>;
}
