"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  LogOut,
  Menu,
} from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { SearchAutocomplete } from "@/components/search/SearchAutocomplete";
import { cn } from "@/lib/utils";
import { auth, onAuthStateChanged, signOut, type AuthUser } from "@/lib/supabase/auth";
import { getProfile } from "@/lib/supabase/profiles";
import { useToast } from "@/hooks/use-toast";
import { useLoginWelcomeToast } from "@/hooks/use-login-welcome-toast";
import { MemberAvatar } from "@/components/dashboard/MemberAvatar";
import { DashboardChromeProvider } from "@/components/dashboard/chrome-context";
import {
  dashboardAccountNav,
  dashboardMobileNav,
  dashboardPrimaryNav,
  isNavActive,
  titleForDashboardPath,
  type DashboardNavItem,
} from "@/components/dashboard/nav";

function NavList({
  items,
  pathname,
  onNavigate,
  compact = false,
}: {
  items: DashboardNavItem[];
  pathname: string;
  onNavigate?: () => void;
  compact?: boolean;
}) {
  return (
    <ul className="space-y-1">
      {items.map((item) => {
        const Icon = item.icon;
        const active = isNavActive(pathname, item);
        return (
          <li key={`${item.label}-${item.href}`}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                item.label === "Horoscope" && "ml-3 text-[13px]",
                active
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/70 hover:text-foreground"
              )}
            >
              <Icon className={cn("h-4 w-4 shrink-0", compact && "h-5 w-5")} aria-hidden="true" />
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function SidebarBody({
  pathname,
  onLogout,
  onNavigate,
}: {
  pathname: string;
  onLogout: () => void;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-4 py-5">
        <Logo href="/dashboard" textSize="text-lg" iconSize={22} />
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Dashboard">
        <NavList items={dashboardPrimaryNav} pathname={pathname} onNavigate={onNavigate} />
        <p className="mb-2 mt-6 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Account
        </p>
        <NavList items={dashboardAccountNav} pathname={pathname} onNavigate={onNavigate} />
      </nav>
      <div className="border-t border-border p-3">
        <Button
          variant="ghost"
          className="h-11 w-full justify-start text-muted-foreground"
          onClick={onLogout}
        >
          <LogOut className="mr-3 h-4 w-4" aria-hidden="true" />
          Log out
        </Button>
      </div>
    </div>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [displayName, setDisplayName] = useState<string>("");
  const [photoURL, setPhotoURL] = useState<string>("");
  const [unread, setUnread] = useState<number | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useLoginWelcomeToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (!user) {
        router.replace("/login?next=/dashboard");
      }
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (!currentUser) return;
    let active = true;
    getProfile(currentUser.uid)
      .then((profile) => {
        if (!active) return;
        setDisplayName(profile?.displayName || currentUser.displayName || "");
        setPhotoURL(profile?.photoURL || currentUser.photoURL || "");
      })
      .catch(() => {
        if (!active) return;
        setDisplayName(currentUser.displayName || "");
        setPhotoURL(currentUser.photoURL || "");
      });
    return () => {
      active = false;
    };
  }, [currentUser]);

  const title = useMemo(() => titleForDashboardPath(pathname), [pathname]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({ title: "Logged out", description: "You have been signed out." });
      router.push("/");
      router.refresh();
    } catch {
      toast({
        title: "Could not log out",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <a
        href="#dashboard-main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-card focus:px-3 focus:py-2"
      >
        Skip to overview
      </a>
      <div className="lg:grid lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="sticky top-0 hidden h-screen border-r border-border bg-card lg:block">
          <SidebarBody pathname={pathname} onLogout={handleLogout} />
        </aside>

        <div className="flex min-h-screen flex-col">
          <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
            <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
              <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="h-11 w-11 lg:hidden" aria-label="Open menu">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[280px] bg-card p-0">
                  <SheetHeader className="sr-only">
                    <SheetTitle>Dashboard menu</SheetTitle>
                  </SheetHeader>
                  <SidebarBody
                    pathname={pathname}
                    onLogout={handleLogout}
                    onNavigate={() => setDrawerOpen(false)}
                  />
                </SheetContent>
              </Sheet>

              <h1 className="truncate font-headline text-lg font-semibold text-foreground sm:text-xl">
                {title}
              </h1>

              <div className="ml-auto flex items-center gap-2">
                <div className="hidden md:block">
                  <SearchAutocomplete className="w-[220px] lg:w-[280px]" placeholder="Search people" />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative h-11 w-11"
                  aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
                  onClick={() => {
                    if (pathname === "/dashboard") {
                      document.getElementById("recent-activity")?.scrollIntoView({ behavior: "smooth" });
                    } else {
                      router.push("/dashboard#recent-activity");
                    }
                  }}
                >
                  <Bell className="h-5 w-5" aria-hidden="true" />
                  {unread !== null && unread > 0 ? (
                    <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-primary" aria-hidden="true" />
                  ) : null}
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-11 rounded-full px-1" aria-label="Account menu">
                      <MemberAvatar name={displayName || "Member"} photoURL={photoURL} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="font-normal">
                      <p className="text-sm font-medium">{displayName || "Member"}</p>
                      <p className="text-xs text-muted-foreground">{currentUser?.email}</p>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/edit-profile">My profile</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/privacy">Privacy and safety</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/pricing">Subscription</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          <main
            id="dashboard-main"
            className="flex-1 px-4 py-6 sm:px-6 lg:px-8 pb-28 lg:pb-8"
          >
            <DashboardChromeProvider value={{ setUnread }}>
              {children}
            </DashboardChromeProvider>
          </main>
        </div>
      </div>

      <nav
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden",
          drawerOpen && "hidden"
        )}
        aria-label="Primary"
      >
        <ul className="grid grid-cols-5">
          {dashboardMobileNav.map((item) => {
            const Icon = item.icon;
            const active = isNavActive(pathname, item);
            return (
              <li key={item.label}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-14 flex-col items-center justify-center gap-1 text-[11px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
