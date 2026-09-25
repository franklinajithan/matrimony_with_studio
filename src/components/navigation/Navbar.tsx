"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  MessageCircle,
  LogOut,
  LayoutDashboard,
  Settings,
  UserCircle as UserCircleIcon,
  Menu,
  Globe,
  ChevronDown,
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
import { useI18n } from "@/components/i18n/I18nProvider";
import { getMessages } from "@/components/i18n/messages";



const marketingPages = ["/", "/about", "/discover", "/safety", "/pricing", "/contact", "/success-stories", "/success-stories/submit"];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const { language, setLanguage } = useI18n();
  const t = getMessages(language).nav;
  const mainAppNavLinks = [
    { href: "/dashboard", label: t.home, icon: <LayoutDashboard className="h-5 w-5" /> },
    { href: "/messages", label: "Messages", icon: <MessageCircle className="h-5 w-5" /> },
    { href: "/dashboard/edit-profile", label: "Profile", icon: <UserCircleIcon className="h-5 w-5" /> },
    { href: "/dashboard/preferences", label: "Settings", icon: <Settings className="h-5 w-5" /> },
  ];
  const landingPageNavLinks = [
    { href: "/", label: t.home }, { href: "/about", label: t.about }, { href: "/success-stories", label: t.stories },
    { href: "/pricing", label: t.pricing }, { href: "/safety", label: t.safety }, { href: "/contact", label: t.help },
  ];
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isMarketingPage = marketingPages.includes(pathname);

  useEffect(() => {
    let settled = false;
    const finish = (user: FirebaseUser | null) => {
      if (settled) return;
      settled = true;
      setCurrentUser(user);
      setIsLoadingAuth(false);
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      finish(user);
    });

    // Never leave the header stuck on a spinner if session hydrate hangs.
    const timeout = window.setTimeout(() => {
      finish(auth.currentUser);
    }, 2500);

    return () => {
      unsubscribe();
      window.clearTimeout(timeout);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
      window.location.assign("/logout");
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Logout Failed",
        description: "Could not log you out. Please try again.",
        variant: "destructive",
      });
      window.location.assign("/logout");
    }
  };


  const marketingLinkClass = (href: string) =>
    cn(
      "relative h-11 rounded-none bg-transparent px-3.5 text-[15px] font-medium text-[#5C4A66] shadow-none hover:bg-transparent hover:text-[#2A1845]",
      pathname === href && "text-[#2A1845] after:absolute after:inset-x-1 after:-bottom-0.5 after:h-[3px] after:rounded-full after:bg-[#7C3AED]"
    );

  const signUpButtonClass =
    "rounded-full bg-[#7C3AED] px-6 font-semibold text-white hover:bg-[#6D28D9] shadow-sm transition-all";

  const authActions = (
    <div className="ml-auto hidden items-center gap-3 lg:flex">
      {currentUser ? (
        <>
          <Button variant="ghost" asChild className="font-medium">
            <Link href="/dashboard">Dashboard</Link>
          </Button>
          <Button asChild className={signUpButtonClass}>
            <Link href="/dashboard/edit-profile">My profile</Link>
          </Button>
        </>
      ) : (
        <>
          <Button variant="outline" asChild className="h-10 rounded-full border-[#C4B0E8] bg-white px-5 font-semibold text-[#6D28D9] hover:bg-white hover:text-[#6D28D9]">
            <Link href="/login">Log In</Link>
          </Button>
          <Button asChild className={signUpButtonClass}>
            <Link href="/signup">Sign Up</Link>
          </Button>
        </>
      )}
    </div>
  );

  return (
    <TooltipProvider delayDuration={0}>
      <header className="sticky top-0 z-50 w-full border-b border-[#F0E8F4] bg-[#FBF8F4]/95 backdrop-blur supports-[backdrop-filter]:bg-[#FBF8F4]/90">
        <div className="mx-auto flex h-[4.25rem] w-full max-w-[1500px] items-center gap-2 px-3 sm:gap-3 sm:px-4 lg:h-24 lg:px-10 xl:px-14">
          <div className="flex shrink-0 flex-col justify-center">
            <Logo size="sm" className="w-[7.8rem] sm:w-[10rem] lg:w-[12.5rem]" />
            {isMarketingPage ? (
              <p className="hidden -mt-0.5 pl-[2.55rem] text-[10px] font-medium tracking-[0.01em] text-[#9B7AA8] sm:block">
                Real People. Meaningful Connections.
              </p>
            ) : null}
          </div>

          {isMarketingPage ? (
            <>
              <nav className="hidden flex-1 items-center justify-center gap-2 lg:flex" aria-label="Primary">
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
              <div className="hidden items-center gap-2 lg:flex">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-10 gap-1.5 rounded-full border border-[#E4D4F5] bg-white px-3.5 text-[#5C4A66] hover:bg-white"
                      aria-label="Select language"
                    >
                      <Globe className="h-4 w-4 text-[#7C3AED]" />
                      <span className="text-sm font-medium">
                        {language === 'en' && 'English'}
                        {language === 'si' && 'සිංහල'}
                        {language === 'ta' && 'தமிழ்'}
                        {language === 'fr' && 'Français'}
                        {language === 'nl' && 'Nederlands'}
                        {language === 'de' && 'Deutsch'}
                      </span>
                      <ChevronDown className="h-3.5 w-3.5 opacity-70" />
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
                    <DropdownMenuItem onClick={() => setLanguage('fr')}>
                      Français (French)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setLanguage('nl')}>
                      Nederlands (Dutch)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setLanguage('de')}>
                      Deutsch (German)
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
            <div className="ml-auto hidden items-center gap-3 lg:flex">
              <Button variant="outline" asChild className="h-10 rounded-full border-[#C4B0E8] bg-white px-5 font-semibold text-[#6D28D9] hover:bg-white hover:text-[#6D28D9]">
                <Link href="/login">Log In</Link>
              </Button>
              <Button asChild className={signUpButtonClass}>
                <Link href="/signup">Sign Up</Link>
              </Button>
            </div>
          ) : isMarketingPage ? (
            authActions
          ) : currentUser ? (
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
          ) : (
            authActions
          )}

          {isMarketingPage ? (
            <div className="ml-auto flex min-w-0 items-center gap-1 lg:hidden">
              {!currentUser && !isLoadingAuth && (
                <>
                  <Button asChild size="sm" variant="ghost" className="h-8 px-2 text-xs sm:h-9 sm:px-3 sm:text-sm">
                    <Link href="/login">Log in</Link>
                  </Button>
                  <Button asChild size="sm" className={cn("h-8 px-3 text-xs sm:h-9 sm:px-4 sm:text-sm", signUpButtonClass)}>
                    <Link href="/signup">Join</Link>
                  </Button>
                </>
              )}
              <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 shrink-0"
                    aria-label="Open menu"
                  >
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[280px] bg-background p-4">
                  <div className="mb-6">
                    <Logo size="md" />
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
                        <Link href={link.href}>{link.label}</Link>
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
                      <Button
                        variant="ghost"
                        className={cn("w-full justify-start text-sm", language === 'fr' && "bg-accent")}
                        onClick={() => setLanguage('fr')}
                      >
                        Français (French)
                      </Button>
                      <Button
                        variant="ghost"
                        className={cn("w-full justify-start text-sm", language === 'nl' && "bg-accent")}
                        onClick={() => setLanguage('nl')}
                      >
                        Nederlands (Dutch)
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
                    <Logo size="md" />
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
