"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  MessageCircle,
  LogOut,
  LayoutDashboard,
  Settings,
  UserCircle as UserCircleIcon,
  Loader2,
  Menu,
  Search,
  Shield,
  Heart,
  DollarSign,
  HelpCircle,
  Globe,
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
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import React, { useEffect, useState } from "react";
import { onAuthStateChanged, signOut, auth, type AuthUser as FirebaseUser } from "@/lib/supabase/auth";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { SearchAutocomplete } from "@/components/search/SearchAutocomplete";

const mainAppNavLinks = [
  { href: "/dashboard", label: "Home", icon: <LayoutDashboard className="h-5 w-5" /> },
  { href: "/messages", label: "Messages", icon: <MessageCircle className="h-5 w-5" /> },
  { href: "/dashboard/edit-profile", label: "Profile", icon: <UserCircleIcon className="h-5 w-5" /> },
  { href: "/dashboard/preferences", label: "Settings", icon: <Settings className="h-5 w-5" /> },
];

const landingPageNavLinks = [
  { href: "/discover", label: "Discover", icon: <Search className="h-5 w-5" /> },
  { href: "/about", label: "How it works", icon: <HelpCircle className="h-5 w-5" /> },
  { href: "/safety", label: "Safety", icon: <Shield className="h-5 w-5" /> },
  { href: "/success-stories", label: "Success Stories", icon: <Heart className="h-5 w-5" /> },
  { href: "/pricing", label: "Pricing", icon: <DollarSign className="h-5 w-5" /> },
];

const marketingPages = ["/", "/about", "/discover", "/safety", "/pricing", "/contact", "/success-stories", "/success-stories/submit"];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isMarketingPage = marketingPages.includes(pathname);

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

  const [language, setLanguage] = useState<'en' | 'si' | 'ta'>('en');

  const marketingLinkClass = (href: string) =>
    cn(
      "h-10 px-4 font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors rounded-md",
      pathname === href && "text-foreground bg-accent"
    );

  const signUpButtonClass =
    "rounded-full bg-primary px-6 font-semibold text-primary-foreground hover:bg-primary/90 shadow-sm transition-all";

  return (
    <TooltipProvider delayDuration={0}>
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="container mx-auto flex h-16 items-center gap-3 px-4 lg:px-6">
          <div className="flex shrink-0 items-center">
            <Logo />
          </div>

          {isMarketingPage ? (
            <>
              <nav className="hidden flex-1 items-center justify-center gap-1 md:flex" aria-label="Primary">
                {landingPageNavLinks.map((link) => (
                  <Button 
                    key={link.label}
                    variant="ghost" 
                    asChild 
                    className={marketingLinkClass(link.href)}
                  >
                    <Link href={link.href}>{link.label}</Link>
                  </Button>
                ))}
              </nav>

              {/* Language Selector - Placeholder until i18n is implemented */}
              <div className="hidden items-center gap-2 md:flex">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-9 gap-2 rounded-md border border-border/40"
                      aria-label="Select language"
                    >
                      <Globe className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        {language === 'en' && 'English'}
                        {language === 'si' && 'සිංහල'}
                        {language === 'ta' && 'தமிழ்'}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setLanguage('en')}>
                      English
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setLanguage('si')}>
                      සිංහල (Sinhala)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setLanguage('ta')}>
                      தமிழ் (Tamil)
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </>
          ) : (
            <>
              <div className="hidden flex-1 items-center justify-center space-x-1 md:flex">
                {mainAppNavLinks.map((link) => (
                  <Tooltip key={link.label}>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        asChild
                        className={cn(
                          "h-11 w-11 rounded-full",
                          pathname === link.href
                            ? "bg-accent text-accent-foreground"
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        )}
                      >
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
              <SearchAutocomplete className="w-full max-w-sm" onSearch={() => setIsMobileMenuOpen(false)} />
            </>
          )}

          {isLoadingAuth ? (
            <Loader2 className="ml-auto h-5 w-5 animate-spin text-primary" aria-label="Loading account" />
          ) : currentUser ? (
            !isMarketingPage && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative ml-auto h-10 w-10 rounded-full p-0"
                  >
                    <Avatar className="h-9 w-9 border-2 border-primary">
                      <AvatarImage
                        src={currentUser.photoURL || undefined}
                        alt={currentUser.displayName || "User"}
                      />
                      <AvatarFallback className="bg-accent text-accent-foreground font-semibold">
                        {currentUser.displayName
                          ? currentUser.displayName.substring(0, 1).toUpperCase()
                          : "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {currentUser.displayName || "User"}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">{currentUser.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="flex cursor-pointer items-center">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/edit-profile" className="flex cursor-pointer items-center">
                      <UserCircleIcon className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/preferences" className="flex cursor-pointer items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      Preferences
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="flex cursor-pointer items-center text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )
          ) : (
            <div className="ml-auto hidden items-center gap-3 md:flex">
              <Button
                variant="ghost"
                asChild
                className="font-medium"
              >
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild className={signUpButtonClass}>
                <Link href="/signup">Create profile</Link>
              </Button>
            </div>
          )}

          {isMarketingPage ? (
            <div className="ml-auto flex items-center gap-2 md:hidden">
              {!currentUser && !isLoadingAuth && (
                <Button asChild size="sm" className={cn("h-9", signUpButtonClass)}>
                  <Link href="/signup">Create profile</Link>
                </Button>
              )}
              <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Open menu"
                  >
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[280px] bg-background p-4">
                  <div className="mb-6">
                    <Logo />
                  </div>
                  <nav className="space-y-1" aria-label="Mobile">
                    {landingPageNavLinks.map((link) => (
                      <Button
                        key={link.label}
                        variant="ghost"
                        asChild
                        className={cn(
                          "w-full justify-start px-4 py-3 text-base font-medium",
                          pathname === link.href && "bg-accent text-accent-foreground"
                        )}
                        onClick={() => setIsSheetOpen(false)}
                      >
                        <Link href={link.href}>
                          {React.cloneElement(link.icon, { className: "mr-3 h-5 w-5" })}
                          {link.label}
                        </Link>
                      </Button>
                    ))}
                    
                    {/* Mobile Language Selector */}
                    <div className="my-4 space-y-1 rounded-lg border border-border p-3">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Language
                      </p>
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-full justify-start text-sm",
                          language === 'en' && "bg-accent"
                        )}
                        onClick={() => setLanguage('en')}
                      >
                        English
                      </Button>
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-full justify-start text-sm",
                          language === 'si' && "bg-accent"
                        )}
                        onClick={() => setLanguage('si')}
                      >
                        සිංහල (Sinhala)
                      </Button>
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-full justify-start text-sm",
                          language === 'ta' && "bg-accent"
                        )}
                        onClick={() => setLanguage('ta')}
                      >
                        தமிழ் (Tamil)
                      </Button>
                    </div>

                    {!currentUser && !isLoadingAuth && (
                      <div className="space-y-2 pt-2">
                        <Button
                          variant="outline"
                          asChild
                          className="w-full"
                          onClick={() => setIsSheetOpen(false)}
                        >
                          <Link href="/login">Log in</Link>
                        </Button>
                        <Button
                          asChild
                          className={cn("w-full", signUpButtonClass)}
                          onClick={() => setIsSheetOpen(false)}
                        >
                          <Link href="/signup">Create profile</Link>
                        </Button>
                      </div>
                    )}
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
          ) : (
            <div className="md:hidden">
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Open menu">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] sm:w-[400px] bg-background">
                  <div className="mb-6">
                    <Logo />
                  </div>
                  <nav className="flex flex-col space-y-3">
                    <SearchAutocomplete onSearch={() => setIsMobileMenuOpen(false)} />
                    {mainAppNavLinks.map((link) => (
                      <Button
                        key={link.label}
                        variant="ghost"
                        asChild
                        className={cn(
                          "w-full justify-start px-4 py-3 text-base font-medium",
                          pathname === link.href && "bg-accent text-accent-foreground"
                        )}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <Link href={link.href}>
                          {React.cloneElement(link.icon, { className: "mr-3 h-5 w-5" })}
                          {link.label}
                        </Link>
                      </Button>
                    ))}
                    {!currentUser && !isLoadingAuth && (
                      <div className="space-y-2 pt-4">
                        <Button
                          variant="outline"
                          asChild
                          className="w-full"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <Link href="/login">Log in</Link>
                        </Button>
                        <Button
                          asChild
                          className={cn("w-full", signUpButtonClass)}
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <Link href="/signup">Create profile</Link>
                        </Button>
                      </div>
                    )}
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
          )}
        </div>
      </header>
    </TooltipProvider>
  );
}
