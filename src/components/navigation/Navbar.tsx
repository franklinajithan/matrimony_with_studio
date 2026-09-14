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
  Info,
  Menu,
  CreditCard,
  Heart,
  Phone,
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
import { onAuthStateChanged, signOut, User as FirebaseUser } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
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
  { href: "/about", label: "About Us", icon: <Info className="h-5 w-5" /> },
  { href: "/pricing", label: "Pricing", icon: <CreditCard className="h-5 w-5" /> },
  { href: "/contact", label: "Contact Us", icon: <Phone className="h-5 w-5" /> },
  { href: "/success-stories", label: "Success Stories", icon: <Heart className="h-5 w-5" /> },
];

const marketingPages = ["/", "/about", "/pricing", "/contact", "/success-stories", "/success-stories/submit"];

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

  const marketingLinkClass = (href: string) =>
    cn(
      "h-10 px-3 text-[#725E6D] hover:bg-[#F8EAF1] hover:text-[#4B164C] focus-visible:ring-2 focus-visible:ring-[#4B164C]",
      pathname === href && "bg-[#F8EAF1] text-[#4B164C]"
    );

  const signUpButtonClass =
    "rounded-full bg-[#4B164C] px-5 text-white hover:bg-[#742158] focus-visible:ring-2 focus-visible:ring-[#4B164C] focus-visible:ring-offset-2";

  return (
    <TooltipProvider delayDuration={0}>
      <header className="sticky top-0 z-50 w-full border-b border-[#EADFD6]/80 bg-[#FFFDF9]/90 backdrop-blur supports-[backdrop-filter]:bg-[#FFFDF9]/80">
        <div className="container mx-auto flex h-16 items-center gap-3 px-4">
          <div className="flex shrink-0 items-center">
            <Logo />
          </div>

          {isMarketingPage ? (
            <nav className="hidden flex-1 items-center justify-center gap-0.5 md:flex" aria-label="Primary">
              {landingPageNavLinks.map((link) => (
                <Tooltip key={link.label}>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" asChild className={marketingLinkClass(link.href)}>
                      <Link href={link.href}>{link.label}</Link>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>{link.label}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </nav>
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
                          "h-12 w-12 rounded-full",
                          pathname === link.href
                            ? "bg-[#F8EAF1] text-[#4B164C]"
                            : "text-[#725E6D] hover:bg-[#F8EAF1] hover:text-[#4B164C]"
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
            <Loader2 className="ml-auto h-6 w-6 animate-spin text-[#4B164C]" aria-label="Loading account" />
          ) : currentUser ? (
            !isMarketingPage && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative ml-auto h-10 w-10 rounded-full p-0 focus-visible:ring-2 focus-visible:ring-[#4B164C]"
                  >
                    <Avatar className="h-9 w-9 border-2 border-[#4B164C]">
                      <AvatarImage
                        src={currentUser.photoURL || undefined}
                        alt={currentUser.displayName || "User"}
                      />
                      <AvatarFallback>
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
                  <DropdownMenuItem onClick={handleLogout} className="flex cursor-pointer items-center">
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )
          ) : (
            <div className="ml-auto hidden items-center gap-2 md:flex">
              <Button
                variant="ghost"
                asChild
                className="text-[#725E6D] hover:bg-[#F8EAF1] hover:text-[#4B164C] focus-visible:ring-2 focus-visible:ring-[#4B164C]"
              >
                <Link href="/login">Log In</Link>
              </Button>
              <Button asChild className={signUpButtonClass}>
                <Link href="/signup">Sign Up</Link>
              </Button>
            </div>
          )}

          {isMarketingPage ? (
            <div className="ml-auto flex items-center gap-2 md:hidden">
              {!currentUser && !isLoadingAuth && (
                <Button asChild size="sm" className={cn("h-9", signUpButtonClass)}>
                  <Link href="/signup">Sign Up</Link>
                </Button>
              )}
              <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Open menu"
                    className="text-[#4B164C] hover:bg-[#F8EAF1] focus-visible:ring-2 focus-visible:ring-[#4B164C]"
                  >
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[280px] bg-[#FFFDF9] p-4">
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
                          "w-full justify-start px-4 py-3 text-base text-[#725E6D] hover:bg-[#F8EAF1] hover:text-[#4B164C]",
                          pathname === link.href && "bg-[#F8EAF1] text-[#4B164C]"
                        )}
                        onClick={() => setIsSheetOpen(false)}
                      >
                        <Link href={link.href}>
                          {React.cloneElement(link.icon, { className: "mr-3 h-5 w-5" })}
                          {link.label}
                        </Link>
                      </Button>
                    ))}
                    <hr className="my-3 border-[#EADFD6]" />
                    {!currentUser && !isLoadingAuth && (
                      <>
                        <Button
                          variant="outline"
                          asChild
                          className="w-full justify-start border-[#EADFD6] py-3 text-base text-[#4B164C] focus-visible:ring-2 focus-visible:ring-[#4B164C]"
                          onClick={() => setIsSheetOpen(false)}
                        >
                          <Link href="/login">Log In</Link>
                        </Button>
                        <Button
                          asChild
                          className={cn("w-full justify-start py-3 text-base", signUpButtonClass)}
                          onClick={() => setIsSheetOpen(false)}
                        >
                          <Link href="/signup">Sign Up</Link>
                        </Button>
                      </>
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
                <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                  <div className="mb-6">
                    <Logo />
                  </div>
                  <nav className="flex flex-col space-y-4">
                    <SearchAutocomplete onSearch={() => setIsMobileMenuOpen(false)} />
                    {mainAppNavLinks.map((link) => (
                      <Button
                        key={link.label}
                        variant="ghost"
                        asChild
                        className={cn(
                          "w-full justify-start px-4 py-3 text-base",
                          pathname === link.href
                            ? "bg-[#F8EAF1] text-[#4B164C]"
                            : "text-[#725E6D] hover:bg-[#F8EAF1] hover:text-[#4B164C]"
                        )}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <Link href={link.href}>
                          {React.cloneElement(link.icon, { className: "mr-3 h-5 w-5" })}
                          {link.label}
                        </Link>
                      </Button>
                    ))}
                    <hr className="my-3" />
                    {!currentUser && !isLoadingAuth && (
                      <>
                        <Button
                          variant="outline"
                          asChild
                          className="w-full justify-start py-3 text-base"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <Link href="/login">Log In</Link>
                        </Button>
                        <Button
                          asChild
                          className={cn("w-full justify-start py-3 text-base", signUpButtonClass)}
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <Link href="/signup">Sign Up</Link>
                        </Button>
                      </>
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
