"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { MessageCircle, LogOut, LayoutDashboard, Settings, UserCircle as UserCircleIcon, Loader2, Info, Zap, HelpCircle, Menu, CreditCard, Search } from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import React, { useEffect, useState } from "react";
import { onAuthStateChanged, signOut, User as FirebaseUser } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";

const mainAppNavLinks = [
  { href: "/dashboard", label: "Home", icon: <LayoutDashboard className="h-5 w-5" /> },
  { href: "/messages", label: "Messages", icon: <MessageCircle className="h-5 w-5" /> },
  { href: "/dashboard/edit-profile", label: "Profile", icon: <UserCircleIcon className="h-5 w-5" /> },
  { href: "/dashboard/preferences", label: "Settings", icon: <Settings className="h-5 w-5" /> },
];

const messagesLinkData = {
  href: "/messages",
  label: "Messages",
  icon: <MessageCircle className="h-5 w-5" />,
  notificationCount: 0,
};

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

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
      router.push("/");
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
        <div className="container mx-auto flex h-16 items-center px-4">
          <div className="flex items-center">
            <Logo />
          </div>

          <div className="hidden md:flex items-center space-x-1 flex-1 justify-center">
            {mainAppNavLinks.map((link) => (
              <Tooltip key={link.label}>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" asChild className={cn("h-12 w-12 rounded-full", pathname === link.href ? "text-primary bg-accent" : "text-foreground/70 hover:text-primary hover:bg-accent/50")}>
                    <Link href={link.href} aria-label={link.label}>
                      {link.icon}
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>{link.label}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>

          <div className="hidden md:flex relative w-[200px]">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input type="search" placeholder="Search..." className="w-full pl-8 h-9 bg-accent/50 border-none focus-visible:ring-1 text-sm" />
          </div>

          {isLoadingAuth ? (
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          ) : currentUser ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
                  <Avatar className="h-9 w-9 border-2 border-primary">
                    <AvatarImage src={currentUser.photoURL || undefined} alt={currentUser.displayName || "User"} />
                    <AvatarFallback>{currentUser.displayName ? currentUser.displayName.substring(0, 1).toUpperCase() : "U"}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{currentUser.displayName || "User"}</p>
                    <p className="text-xs leading-none text-muted-foreground">{currentUser.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard" className="flex items-center cursor-pointer">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/edit-profile" className="flex items-center cursor-pointer">
                    <UserCircleIcon className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/preferences" className="flex items-center cursor-pointer">
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
            <div className="hidden md:flex items-center space-x-2">
              <Button variant="ghost" asChild>
                <Link href="/login">Log In</Link>
              </Button>
              <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Link href="/signup">Sign Up</Link>
              </Button>
            </div>
          )}

          <div className="md:hidden">
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Open menu">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] p-4">
                <div className="mb-6">
                  <Logo />
                </div>
                <div className="mb-4">
                  <Input type="search" placeholder="Search..." className="w-full bg-accent/50 border-none focus-visible:ring-1" />
                </div>
                <nav className="space-y-1">
                  {mainAppNavLinks.map((link) => (
                    <Button key={link.label} variant="ghost" asChild className={cn("w-full justify-start px-4 py-3 text-base", pathname === link.href ? "text-primary bg-accent" : "text-foreground/70 hover:text-primary hover:bg-accent/50")} onClick={() => setIsSheetOpen(false)}>
                      <Link href={link.href}>
                        {React.cloneElement(link.icon, { className: "mr-3 h-5 w-5" })}
                        {link.label}
                      </Link>
                    </Button>
                  ))}
                  <hr className="my-3" />
                  {!currentUser && !isLoadingAuth && (
                    <>
                      <Button variant="outline" asChild className="w-full justify-start text-base py-3" onClick={() => setIsSheetOpen(false)}>
                        <Link href="/login">Log In</Link>
                      </Button>
                      <Button asChild className="w-full justify-start text-base py-3 bg-primary text-primary-foreground" onClick={() => setIsSheetOpen(false)}>
                        <Link href="/signup">Sign Up</Link>
                      </Button>
                    </>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
    </TooltipProvider>
  );
}
