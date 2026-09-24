"use client";

import { Footer } from "@/components/navigation/Footer";
import { Navbar } from "@/components/navigation/Navbar";
import { usePathname } from "next/navigation";
import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { LANGUAGES, useI18n, type LanguageCode } from "@/components/i18n/I18nProvider";

const AUTHENTICATED_ROUTES = [
  "/dashboard",
  "/biodata",
  "/discover",
  "/interests",
  "/connections",
  "/messages",
  "/profile",
  "/settings",
];

export function MainChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { language, setLanguage } = useI18n();
  
  // Check if current route is an authenticated member route
  const isAuthenticatedRoute = AUTHENTICATED_ROUTES.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isAuthenticatedRoute) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="fixed bottom-4 right-4 z-[70] lg:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button size="icon" className="h-12 w-12 rounded-full shadow-lg" aria-label="Select language"><Globe className="h-5 w-5" /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end">{(Object.entries(LANGUAGES) as [LanguageCode,string][]).map(([code,name])=><DropdownMenuItem key={code} onClick={()=>setLanguage(code)} className={language===code?"font-semibold text-primary":""}>{name}</DropdownMenuItem>)}</DropdownMenuContent>
        </DropdownMenu>
      </div>
      <Navbar />
      <main className="container mx-auto flex-grow">{children}</main>
      <Footer />
    </div>
  );
}
