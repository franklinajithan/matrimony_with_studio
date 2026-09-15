import {
  Compass,
  CreditCard,
  Heart,
  LayoutDashboard,
  MessageCircle,
  Shield,
  SlidersHorizontal,
  Sparkles,
  UserCircle,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type DashboardNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  match?: "exact" | "prefix";
};

export const dashboardPrimaryNav: DashboardNavItem[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, match: "exact" },
  { href: "/discover", label: "Discover", icon: Compass, match: "prefix" },
  { href: "/dashboard/interests", label: "Interests", icon: Heart, match: "prefix" },
  { href: "/messages", label: "Connections", icon: Users, match: "prefix" },
  { href: "/messages", label: "Messages", icon: MessageCircle, match: "prefix" },
];

export const dashboardAccountNav: DashboardNavItem[] = [
  { href: "/dashboard/edit-profile", label: "My profile", icon: UserCircle, match: "prefix" },
  { href: "/dashboard/horoscope", label: "Horoscope", icon: Sparkles, match: "prefix" },
  { href: "/onboarding?step=2", label: "Partner preferences", icon: SlidersHorizontal, match: "prefix" },
  { href: "/dashboard/privacy", label: "Privacy and safety", icon: Shield, match: "prefix" },
  { href: "/pricing", label: "Subscription", icon: CreditCard, match: "prefix" },
];

export const dashboardMobileNav: DashboardNavItem[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, match: "exact" },
  { href: "/discover", label: "Discover", icon: Compass, match: "prefix" },
  { href: "/dashboard/interests", label: "Interests", icon: Heart, match: "prefix" },
  { href: "/messages", label: "Messages", icon: MessageCircle, match: "prefix" },
  { href: "/dashboard/edit-profile", label: "Profile", icon: UserCircle, match: "prefix" },
];

export function isNavActive(pathname: string, item: DashboardNavItem): boolean {
  const href = item.href.split("?")[0];
  if (item.match === "exact") return pathname === href;
  if (href === "/messages") return pathname === "/messages" || pathname.startsWith("/messages/");
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function titleForDashboardPath(pathname: string): string {
  if (pathname === "/dashboard") return "Your overview";
  if (pathname.startsWith("/dashboard/interests")) return "Interests";
  if (pathname.startsWith("/dashboard/privacy")) return "Privacy and safety";
  if (pathname.startsWith("/dashboard/edit-profile")) return "My profile";
  if (pathname.startsWith("/dashboard/horoscope")) return "Horoscope";
  if (pathname.startsWith("/dashboard/preferences")) return "Partner preferences";
  if (pathname.startsWith("/dashboard/biodata")) return "Biodata";
  if (pathname.startsWith("/dashboard/profile-views")) return "Profile views";
  return "Dashboard";
}
