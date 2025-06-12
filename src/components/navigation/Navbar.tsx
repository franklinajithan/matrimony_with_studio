
"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { MessageCircle, LogOut, LayoutDashboard, Settings, UserCircle as UserCircleIcon, Loader2, Info, Zap, HelpCircle, Menu } from 'lucide-react';
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
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";

const mainAppNavLinks = [
  { href: '/about', label: 'About Us', icon: <Info className="h-5 w-5" /> },
  { href: '/features', label: 'Features', icon: <Zap className="h-5 w-5" /> },
  { href: '/contact', label: 'Contact', icon: <HelpCircle className="h-5 w-5" /> },
];

const messagesLinkData = {
  href: '/messages',
  label: 'Messages',
  icon: <MessageCircle className="h-5 w-5" />,
  notificationCount: 0, // Updated from mock, real count needs separate logic
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
  
  const commonNavLinks = (isMobile = false) => mainAppNavLinks.map((link) => (
    <Button
      key={link.label}
      variant="ghost"
      asChild
      className={cn(
        "transition-colors h-auto text-sm font-medium",
        isMobile ? "w-full justify-start px-4 py-3 text-base" : "px-3 py-1.5 lg:px-4",
        pathname === link.href ? "text-primary bg-accent" : "text-foreground/70 hover:text-primary hover:bg-accent/50"
      )}
      onClick={() => isMobile && setIsSheetOpen(false)}
    >
      <Link href={link.href} aria-label={link.label}>
        {isMobile && React.cloneElement(link.icon, { className: "mr-3 h-5 w-5" })}
        {link.label}
      </Link>
    </Button>
  ));

  return (
    <TooltipProvider delayDuration={0}>
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 max-w-screen-2xl items-center justify-between">
          <Logo className="ml-2" /> {/* Added ml-2 for a bit more left spacing */}
          
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2 ml-auto mr-3">
            {commonNavLinks()}
          </nav>

          <div className="flex items-center space-x-2 md:space-x-3">
            {currentUser && (
              <Tooltip>
                <TooltipTrigger asChild>
                   <Button
                    variant="ghost"
                    size="icon"
                    asChild
                    className={cn(
                      "transition-colors relative rounded-full w-9 h-9", // Standardized icon button size
                      pathname === messagesLinkData.href ? "text-primary bg-accent" : "text-foreground/70 hover:text-primary hover:bg-accent"
                    )}
                  >
                    <Link href={messagesLinkData.href} aria-label={messagesLinkData.label}>
                     {messagesLinkData.icon}
                    {messagesLinkData.notificationCount > 0 && (
                      <Badge variant="destructive" className="absolute top-0 right-0 h-4 w-4 min-w-[1rem] p-0 flex items-center justify-center text-xs transform translate-x-1/4 -translate-y-1/4">
                        {messagesLinkData.notificationCount}
                      </Badge>
                    )}
                    </Link>
                  </Button>
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
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
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
             {/* Mobile Menu Trigger */}
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
                  <nav className="flex flex-col space-y-2">
                    {commonNavLinks(true)}
                    <hr className="my-3"/>
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
        </div>
      </header>
    </TooltipProvider>
  );
}
