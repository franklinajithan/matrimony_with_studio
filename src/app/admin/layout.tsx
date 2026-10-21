import type { ReactNode } from "react";
import { Logo } from "@/components/shared/Logo";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { requireAdminPage } from "./guard";
import { AdminNavigation } from "./admin-navigation";
import { AdminMobileTabBar } from "./admin-mobile-tab-bar";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdminPage();
  return <div className="flex min-h-screen flex-col bg-background text-foreground">
    <header className="sticky top-0 z-30 border-b border-border bg-card/95 shadow-card backdrop-blur-xl">
      <div className="mx-auto flex max-w-screen-2xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex max-w-[150px] items-center overflow-hidden sm:max-w-none"><Logo href="/admin" size="sm" textColor="text-foreground" /></span>
          <span className="hidden border-l border-border pl-3 text-xs font-bold uppercase tracking-widest text-primary lg:inline">Workspace</span>
        </div>
        <Link href="/" className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-background sm:text-sm">Main site <ArrowUpRight className="h-3.5 w-3.5" /></Link>
      </div>
      <div className="hidden md:block"><AdminNavigation /></div>
    </header>
    <main className="mx-auto w-full max-w-screen-2xl flex-1 px-4 py-6 pb-28 sm:px-6 sm:py-8 md:pb-8">{children}</main>
    <AdminMobileTabBar />
    <footer className="border-t border-border bg-card px-4 py-5 text-center text-xs text-muted-foreground">CupidMatch administration · {new Date().getFullYear()}</footer>
  </div>;
}
