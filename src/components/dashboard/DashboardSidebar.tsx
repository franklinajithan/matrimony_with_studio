"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Home,
  Search,
  Heart,
  Bookmark,
  Users,
  MessageCircle,
  User,
  Settings,
  Shield,
  CreditCard,
  HelpCircle,
  Sliders,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";

const navigationItems = [
  { href: "/dashboard", label: "Overview", icon: Home },
  { href: "/discover", label: "Discover people", icon: Search },
  { href: "/interests", label: "Interests", icon: Heart, count: 0 },
  { href: "/shortlist", label: "Shortlisted", icon: Bookmark, count: 0 },
  { href: "/connections", label: "Connections", icon: Users, count: 0 },
  { href: "/messages", label: "Messages", icon: MessageCircle, count: 0 },
  { href: "/profile", label: "My profile", icon: User },
  { href: "/preferences", label: "Partner preferences", icon: Sliders },
  { href: "/privacy", label: "Privacy & verification", icon: Shield },
  { href: "/membership", label: "Membership", icon: CreditCard },
  { href: "/help", label: "Help centre", icon: HelpCircle },
  { href: "/settings", label: "Settings", icon: Settings },
];

interface DashboardSidebarProps {
  className?: string;
  interestsCount?: number;
  shortlistCount?: number;
  connectionsCount?: number;
  messagesCount?: number;
}

export function DashboardSidebar({
  className,
  interestsCount = 0,
  shortlistCount = 0,
  connectionsCount = 0,
  messagesCount = 0,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();

  const counts: Record<string, number> = {
    "/interests": interestsCount,
    "/shortlist": shortlistCount,
    "/connections": connectionsCount,
    "/messages": messagesCount,
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Signed out",
        description: "You've been successfully signed out.",
      });
      router.push("/");
    } catch (error) {
      console.error("Sign out error:", error);
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className={cn("flex h-full flex-col border-r bg-background", className)}>
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
            <Heart className="h-5 w-5 fill-current" />
          </div>
          <span className="text-xl font-semibold">CupidMatch</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href;
          const count = counts[item.href];
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-violet-50 text-violet-700"
                  : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="flex-1">{item.label}</span>
              {count > 0 && (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-violet-600 px-1.5 text-xs font-semibold text-white">
                  {count}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Sign Out */}
      <div className="border-t p-4">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-gray-700 hover:bg-gray-50 hover:text-gray-900"
          onClick={handleSignOut}
        >
          <LogOut className="h-5 w-5" />
          Sign out
        </Button>
      </div>
    </div>
  );
}
