"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bell,
  Globe,
  Heart,
  LogOut,
  Menu,
  MessageCircle,
  Users,
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
import {
  countPendingRequests,
  countRecentAcceptedConnections,
  subscribeToPendingRequests,
} from "@/lib/supabase/matches";
import { countUnreadMessages } from "@/lib/supabase/chats";
import { useToast } from "@/hooks/use-toast";
import { useLoginWelcomeToast } from "@/hooks/use-login-welcome-toast";
import { MemberAvatar } from "@/components/dashboard/MemberAvatar";
import { DashboardChromeProvider } from "@/components/dashboard/chrome-context";
import { useI18n } from "@/components/i18n/I18nProvider";
import { getMessages } from "@/components/i18n/messages";
import { LANGUAGES, type LanguageCode } from "@/components/i18n/I18nProvider";
import {
  dashboardAccountNav,
  dashboardMobileNav,
  dashboardPrimaryNav,
  isNavActive,
  titleForDashboardPath,
  type DashboardNavItem,
} from "@/components/dashboard/nav";

type NavBadges = {
  interests: number;
  connections: number;
  messages: number;
};

function badgeForHref(href: string, badges: NavBadges): number {
  const path = href.split("?")[0];
  if (path === "/interests") return badges.interests;
  if (path === "/connections") return badges.connections;
  if (path === "/messages") return badges.messages;
  return 0;
}

function CountPill({ count, dark = false }: { count: number; dark?: boolean }) {
  if (count <= 0) return null;
  return (
    <span
      className={cn(
        "ml-auto inline-flex min-w-[1.25rem] items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none",
        dark ? "bg-white text-violet-700" : "bg-primary text-primary-foreground"
      )}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

function NavList({
  items,
  pathname,
  onNavigate,
  compact = false,
  badges,
  labels,
}: {
  items: DashboardNavItem[];
  pathname: string;
  onNavigate?: () => void;
  compact?: boolean;
  badges: NavBadges;
  labels: Record<string,string>;
}) {
  return (
    <ul className="space-y-1">
      {items.map((item) => {
        const Icon = item.icon;
        const active = isNavActive(pathname, item);
        const count = badgeForHref(item.href, badges);
        return (
          <li key={`${item.label}-${item.href}`}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              aria-label={count > 0 ? `${item.label}, ${count} new` : item.label}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                active
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/70 hover:text-foreground"
              )}
            >
              <span className="relative shrink-0">
                <Icon className={cn("h-4 w-4", compact && "h-5 w-5")} aria-hidden="true" />
                {count > 0 ? (
                  <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-primary" aria-hidden />
                ) : null}
              </span>
              <span className="truncate">{labels[item.href] || item.label}</span>
              <CountPill count={count} />
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
  badges,
  labels,
  accountLabel,
  logoutLabel,
}: {
  pathname: string;
  onLogout: () => void;
  onNavigate?: () => void;
  badges: NavBadges;
  labels: Record<string,string>;
  accountLabel: string;
  logoutLabel: string;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-4 py-4">
        <Logo href="/dashboard" size="md" className="ml-0" />
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Dashboard">
        <NavList items={dashboardPrimaryNav} pathname={pathname} onNavigate={onNavigate} badges={badges} labels={labels} />
        <p className="mb-2 mt-6 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {accountLabel}
        </p>
        <NavList items={dashboardAccountNav} pathname={pathname} onNavigate={onNavigate} badges={badges} labels={labels} />
      </nav>
      <div className="border-t border-border p-3">
        <Button
          variant="ghost"
          className="h-11 w-full justify-start text-muted-foreground"
          onClick={onLogout}
        >
          <LogOut className="mr-3 h-4 w-4" aria-hidden="true" />
          {logoutLabel}
        </Button>
      </div>
    </div>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const { language, setLanguage } = useI18n();
  const dt = getMessages(language).dashboard;
  const navLabels = useMemo<Record<string, string>>(() => ({"/dashboard":dt.overview,"/discover":dt.findMatches,"/interests":dt.interests,"/connections":dt.connections,"/messages":dt.messages,"/dashboard/edit-profile":dt.myProfile,"/dashboard/edit-profile/match-details":dt.matchProfile,"/biodata":dt.biodata,"/dashboard/horoscope":dt.horoscope,"/dashboard/preferences":dt.preferences,"/dashboard/privacy":dt.privacy,"/pricing":dt.subscription}), [dt]);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [displayName, setDisplayName] = useState<string>("");
  const [photoURL, setPhotoURL] = useState<string>("");
  const [badges, setBadges] = useState<NavBadges>({ interests: 0, connections: 0, messages: 0 });
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isMessagesRoute = pathname === "/messages" || pathname.startsWith("/messages/");

  useLoginWelcomeToast();

  const headerUnread = badges.interests + badges.connections + badges.messages;

  const connectionsSeenKey = useCallback(
    (userId: string) => `cupidmatch:connections-seen:${userId}`,
    []
  );

  const refreshBadges = useCallback(
    async (userId: string) => {
      try {
        const seenAt =
          typeof window !== "undefined"
            ? window.localStorage.getItem(connectionsSeenKey(userId))
            : null;
        const [interests, connections, messages] = await Promise.all([
          countPendingRequests(userId),
          countRecentAcceptedConnections(userId, 14, seenAt),
          countUnreadMessages(userId),
        ]);
        setBadges({ interests, connections, messages });
      } catch (error) {
        console.warn("Could not refresh notification badges:", error);
      }
    },
    [connectionsSeenKey]
  );

  const clearConnectionsBadge = useCallback(() => {
    if (!currentUser) return;
    try {
      window.localStorage.setItem(connectionsSeenKey(currentUser.uid), new Date().toISOString());
    } catch {
      // ignore storage failures
    }
    setBadges((prev) => (prev.connections === 0 ? prev : { ...prev, connections: 0 }));
  }, [connectionsSeenKey, currentUser]);

  const setUnread = useCallback((count: number | null) => {
    if (typeof count !== "number") return;
    const next = Math.max(0, count);
    setBadges((prev) => (prev.messages === next ? prev : { ...prev, messages: next }));
  }, []);

  const setInterestsCount = useCallback((count: number) => {
    const next = Math.max(0, count);
    setBadges((prev) => (prev.interests === next ? prev : { ...prev, interests: next }));
  }, []);

  const refreshBadgesForChrome = useCallback(() => {
    if (currentUser) void refreshBadges(currentUser.uid);
  }, [currentUser, refreshBadges]);

  const chromeValue = useMemo(
    () => ({
      setUnread,
      setInterestsCount,
      clearConnectionsBadge,
      refreshBadges: refreshBadgesForChrome,
    }),
    [setUnread, setInterestsCount, clearConnectionsBadge, refreshBadgesForChrome]
  );

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

  useEffect(() => {
    if (!currentUser) return;
    if (pathname === "/connections" || pathname.startsWith("/connections/")) {
      clearConnectionsBadge();
    }
  }, [clearConnectionsBadge, currentUser, pathname]);

  useEffect(() => {
    if (!currentUser) return;
    void refreshBadges(currentUser.uid);
    const unsubscribe = subscribeToPendingRequests(currentUser.uid, (requests) => {
      setBadges((prev) => ({ ...prev, interests: requests.length }));
    });
    const interval = window.setInterval(() => {
      void refreshBadges(currentUser.uid);
    }, 30000);
    return () => {
      unsubscribe();
      window.clearInterval(interval);
    };
  }, [currentUser, refreshBadges, pathname]);

  const title = useMemo(() => navLabels[pathname] || (pathname === "/dashboard" ? dt.titleOverview : titleForDashboardPath(pathname)), [pathname, navLabels, dt.titleOverview]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({ title: "Logged out", description: "You have been signed out." });
    } catch {
      toast({
        title: "Could not log out",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      window.location.assign("/logout");
    }
  };

  return (
    <div
      className={cn(
        "bg-background",
        isMessagesRoute
          ? "flex h-[100svh] h-[100dvh] flex-col overflow-hidden"
          : "min-h-screen"
      )}
    >
      <a
        href="#dashboard-main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-card focus:px-3 focus:py-2"
      >
        Skip to overview
      </a>
      <div
        className={cn(
          "lg:grid lg:grid-cols-[240px_minmax(0,1fr)]",
          isMessagesRoute && "min-h-0 flex-1"
        )}
      >
        <aside
          className={cn(
            "sticky top-0 hidden border-r border-border bg-card lg:block",
            isMessagesRoute ? "h-full" : "h-screen"
          )}
        >
          <SidebarBody pathname={pathname} onLogout={handleLogout} badges={badges} labels={navLabels} accountLabel={dt.account} logoutLabel={dt.logout} />
        </aside>

        <div
          className={cn(
            "flex flex-col",
            isMessagesRoute ? "h-full min-h-0" : "min-h-screen"
          )}
        >
          <header className="sticky top-0 z-40 shrink-0 border-b border-border bg-background/95 backdrop-blur">
            <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
              <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="h-11 w-11 lg:hidden" aria-label="Open menu">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[280px] bg-card p-0">
                  <SheetHeader className="sr-only">
                    <SheetTitle>{dt.menu}</SheetTitle>
                  </SheetHeader>
                  <SidebarBody
                    pathname={pathname}
                    onLogout={handleLogout}
                    onNavigate={() => setDrawerOpen(false)}
                    badges={badges}
                    labels={navLabels}
                    accountLabel={dt.account}
                    logoutLabel={dt.logout}
                  />
                </SheetContent>
              </Sheet>

              <h1 className="truncate font-headline text-lg font-semibold text-foreground sm:text-xl">
                {title}
              </h1>

              <div className="ml-auto flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-11 gap-2 px-3" aria-label="Select language">
                      <Globe className="h-4 w-4" aria-hidden="true" />
                      <span className="hidden sm:inline">{LANGUAGES[language]}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {(Object.entries(LANGUAGES) as [LanguageCode, string][]).map(([code, name]) => (
                      <DropdownMenuItem key={code} onClick={() => setLanguage(code)} className={language === code ? "font-semibold text-primary" : ""}>
                        {name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <div className="hidden md:block">
                  <SearchAutocomplete className="w-[220px] lg:w-[280px]" placeholder={dt.search} />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="relative h-11 w-11"
                      aria-label={
                        headerUnread > 0
                          ? `Notifications, ${headerUnread} unread`
                          : "Notifications"
                      }
                    >
                      <Bell className="h-5 w-5" aria-hidden="true" />
                      {headerUnread > 0 ? (
                        <span className="absolute right-1.5 top-1.5 inline-flex min-w-[1.1rem] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-4 text-primary-foreground">
                          {headerUnread > 99 ? "99+" : headerUnread}
                        </span>
                      ) : null}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64">
                    <DropdownMenuLabel>{dt.notifications}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/interests" className="flex w-full items-center gap-2">
                        <Heart className="h-4 w-4 text-primary" aria-hidden />
                        <span className="flex-1">{dt.interests}</span>
                        <CountPill count={badges.interests} />
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/connections" className="flex w-full items-center gap-2">
                        <Users className="h-4 w-4 text-primary" aria-hidden />
                        <span className="flex-1">{dt.connections}</span>
                        <CountPill count={badges.connections} />
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/messages" className="flex w-full items-center gap-2">
                        <MessageCircle className="h-4 w-4 text-primary" aria-hidden />
                        <span className="flex-1">{dt.messages}</span>
                        <CountPill count={badges.messages} />
                      </Link>
                    </DropdownMenuItem>
                    {headerUnread === 0 ? (
                      <p className="px-2 py-3 text-xs text-muted-foreground">{dt.caughtUp}</p>
                    ) : null}
                  </DropdownMenuContent>
                </DropdownMenu>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-11 gap-2 px-2">
                      <MemberAvatar
                        name={displayName || "Member"}
                        photoURL={photoURL}
                        className="h-8 w-8"
                      />
                      <span className="hidden max-w-[120px] truncate text-sm font-medium sm:inline">
                        {displayName || "Account"}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>{dt.myAccount}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/edit-profile">{dt.myProfile}</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/privacy">{dt.privacy}</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/pricing">{dt.subscription}</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
                      {dt.logout}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          <main
            id="dashboard-main"
            className={cn(
              "flex-1",
              isMessagesRoute
                ? "min-h-0 overflow-hidden p-0"
                : "px-4 py-6 pb-24 sm:px-6 lg:px-8 lg:pb-8"
            )}
          >
            <DashboardChromeProvider value={chromeValue}>
              {children}
            </DashboardChromeProvider>
          </main>
        </div>
      </div>

      {isMessagesRoute ? (
        <div
          aria-hidden="true"
          className="h-[calc(60px+env(safe-area-inset-bottom))] shrink-0 lg:hidden"
        />
      ) : null}

      <nav
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 border-t border-violet-700/20 bg-violet-600 pb-[env(safe-area-inset-bottom)] shadow-lg lg:hidden",
          drawerOpen && "hidden"
        )}
        aria-label="Primary"
      >
        <ul className="grid grid-cols-5 px-2 py-2">
          {dashboardMobileNav.map((item) => {
            const Icon = item.icon;
            const active = isNavActive(pathname, item);
            const count = badgeForHref(item.href, badges);
            return (
              <li key={item.label}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  aria-label={count > 0 ? `${item.label}, ${count} new` : item.label}
                  className={cn(
                    "relative flex min-h-[44px] flex-col items-center justify-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-white",
                    active
                      ? "bg-white text-violet-700 shadow-sm"
                      : "text-white hover:bg-violet-500"
                  )}
                >
                  <span className="relative">
                    <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                    {count > 0 ? (
                      <span
                        className={cn(
                          "absolute -right-2 -top-1 inline-flex min-w-[1rem] items-center justify-center rounded-full px-1 text-[9px] font-bold leading-4",
                          active ? "bg-violet-600 text-white" : "bg-white text-violet-700"
                        )}
                      >
                        {count > 9 ? "9+" : count}
                      </span>
                    ) : null}
                  </span>
                  <span className="truncate">{item.href === "/dashboard" ? dt.overview : item.href === "/discover" ? dt.matches : item.href === "/interests" ? dt.interests : item.href === "/messages" ? dt.messages : dt.profile}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
