"use client";

import { Footer } from "@/components/navigation/Footer";
import { Navbar } from "@/components/navigation/Navbar";
import { usePathname } from "next/navigation";

const AUTHENTICATED_ROUTES = [
  "/dashboard",
  "/discover",
  "/interests",
  "/connections",
  "/messages",
  "/profile",
  "/settings",
];

export function MainChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Check if current route is an authenticated member route
  const isAuthenticatedRoute = AUTHENTICATED_ROUTES.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isAuthenticatedRoute) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="container mx-auto flex-grow">{children}</main>
      <Footer />
    </div>
  );
}
