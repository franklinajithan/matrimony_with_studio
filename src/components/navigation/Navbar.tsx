
"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { MessageCircle, LogOut, LayoutDashboard, Settings, UserCircle as UserCircleIcon, Loader2 } from 'lucide-react'; // Renamed UserCircle to UserCircleIcon to avoid conflict
import { Logo } from '@/components/shared/Logo';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from '@/lib/utils';
import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Removed mainNavLinks array as these links are being removed.

const messagesLinkData = {
  href: '/messages',
  label: 'Messages',
  icon: <MessageCircle className="h-5 w-5" />, 
  notificationCount: 3, // Mock notification count
};

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
      router.push('/'); 
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Logout Failed",
        description: "Could not log you out. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <TooltipProvider delayDuration={0}>
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 max-w-screen-2xl items-center justify-between">
          <Logo />
          {/* Removed the main navigation links section */}
          <div className="flex items-center space-x-3">
            {currentUser && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href={messagesLinkData.href}
                    className={cn(
                      "transition-colors relative p-2 rounded-full hover:bg-accent",
                      pathname === messagesLinkData.href ? "text-primary bg-accent" : "text-foreground/70 hover:text-primary"
                    )}
                    aria-label={messagesLinkData.label}
                  >
                    {messagesLinkData.icon}
                    {messagesLinkData.notificationCount && messagesLinkData.notificationCount > 0 && (
                      <Badge variant="destructive" className="absolute top-0 right-0 h-4 w-4 min-w-[1rem] p-0 flex items-center justify-center text-xs transform translate-x-1/4 -translate-y-1/4">
                        {messagesLinkData.notificationCount}
                      </Badge>
                    )}
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>{messagesLinkData.label}</p>
                </TooltipContent>
              </Tooltip>
            )}

            {isLoadingAuth ? (
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            ) : currentUser ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={currentUser.photoURL || undefined} alt={currentUser.displayName || "User"} data-ai-hint="user avatar" />
                      <AvatarFallback>{currentUser.displayName ? currentUser.displayName.substring(0,1).toUpperCase() : "U"}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{currentUser.displayName || "User"}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {currentUser.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="flex items-center">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/edit-profile" className="flex items-center">
                      <UserCircleIcon className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/preferences" className="flex items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      Preferences
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="flex items-center cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/login">Log In</Link>
                </Button>
                <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Link href="/signup">Sign Up</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>
    </TooltipProvider>
  );
}
