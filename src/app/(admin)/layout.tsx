
"use client";

import { Logo } from '@/components/shared/Logo';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import { Loader2 } from 'lucide-react';

// Minimal toast for redirection messages
const toast = (options: {title: string, description?: string, variant?: string}) => {
    console.log(`Toast (${options.variant || 'default'}): ${options.title} - ${options.description || ''}`);
    // Activate alert for critical messages
    if (typeof window !== 'undefined' && (options.variant === 'destructive' || options.title === 'Authentication Required' || options.title === "Access Denied" || options.title === "Error")) {
      alert(`${options.title}${options.description ? ': ' + options.description : ''}`);
    }
};

// Add a button component if not globally available for the fallback case
const Button = ({ onClick, children, className }: { onClick: () => void; children: React.ReactNode; className?: string }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-md bg-slate-700 text-white hover:bg-slate-600 ${className}`}
  >
    {children}
  </button>
);


export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);

  useEffect(() => {
    console.log("AdminLayout: useEffect triggered");
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("AdminLayout: onAuthStateChanged callback. User:", user ? user.uid : 'null');
      setCurrentUser(user);
      if (user) {
        try {
          console.log("AdminLayout: Current user UID:", user.uid);
          const userDocRef = doc(db, "users", user.uid);
          const userDocSnap = await getDoc(userDocRef);

          console.log("AdminLayout: userDocSnap.exists():", userDocSnap.exists());
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            console.log("AdminLayout: User data from Firestore:", userData);
            console.log("AdminLayout: userData.isAdmin value:", userData?.isAdmin);
            console.log("AdminLayout: typeof userData.isAdmin:", typeof userData?.isAdmin);

            if (userData?.isAdmin === true) {
              console.log("AdminLayout: User IS admin.");
              setIsAdmin(true);
            } else {
              console.log("AdminLayout: User IS NOT admin or isAdmin field missing/false.");
              setIsAdmin(false);
              toast({
                title: "Access Denied",
                description: "You do not have permission to access the admin panel.",
                variant: "destructive",
              });
              router.replace('/');
            }
          } else {
            console.log("AdminLayout: User document does not exist in Firestore.");
            setIsAdmin(false);
            toast({
              title: "Access Denied",
              description: "User profile not found. Cannot verify admin status.",
              variant: "destructive",
            });
            router.replace('/');
          }
        } catch (error) {
          console.error("AdminLayout: Error checking admin status:", error);
          setIsAdmin(false);
           toast({
              title: "Error",
              description: "Could not verify admin status. Redirecting.",
              variant: "destructive",
            });
          router.replace('/');
        }
      } else {
        console.log("AdminLayout: No user logged in.");
        // No user logged in
        setIsAdmin(false);
        toast({
          title: "Authentication Required",
          description: "Please log in to access this area.",
          variant: "default",
        });
        router.replace('/login');
      }
      setIsLoading(false);
      console.log("AdminLayout: setIsLoading(false)");
    });

    return () => {
      console.log("AdminLayout: Unsubscribing from onAuthStateChanged.");
      unsubscribe();
    };
  }, [router]);

  if (isLoading) {
    console.log("AdminLayout: Rendering loading state.");
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100">
        <Loader2 className="h-12 w-12 animate-spin text-slate-700" />
        <p className="mt-4 text-slate-600">Verifying access...</p>
      </div>
    );
  }

  if (!isAdmin) {
    console.log("AdminLayout: Rendering non-admin state (redirecting or showing access denied).");
    // This content will be shown briefly if a non-admin attempts access
    // before the router.replace('/') or router.replace('/login') takes full effect.
    // The alert from the toast function should appear first.
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 p-4">
        <div className="bg-white p-8 rounded-lg shadow-xl text-center">
            <h2 className="text-2xl font-bold text-destructive mb-4">Access Denied</h2>
            <p className="text-slate-600 mb-6">
            You are not authorized to view this page. You are being redirected.
            </p>
            <Button onClick={() => router.push(currentUser ? '/' : '/login')} className="mt-4">
            {currentUser ? 'Go to Homepage' : 'Go to Login'}
            </Button>
        </div>
      </div>
    );
  }

  console.log("AdminLayout: Rendering admin content.");
  // If user is admin and not loading, render the admin layout
  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      <header className="bg-slate-800 text-white shadow-md">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Logo textSize="text-2xl" textColor="text-white" iconSize={24}/>
            <span className="text-xl font-semibold">Admin Panel</span>
          </div>
          <nav>
            <Link href="/" className="text-sm hover:text-slate-300">
              Back to Main Site
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-grow container mx-auto px-4 py-8">
        {children}
      </main>
      <footer className="bg-slate-800 text-white py-4 text-center text-xs">
        CupidMatch Admin &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
