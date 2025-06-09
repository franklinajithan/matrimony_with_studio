
"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { HeartHandshake, Search, MessageSquareText, ShieldCheck, Loader2 } from 'lucide-react';
import { Logo } from '@/components/shared/Logo';
import { Footer } from '@/components/navigation/Footer';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';

export default function LandingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is signed in, redirect to dashboard.
        router.replace('/dashboard');
        // Set loading to false here as well, in case the redirect is slow
        // or the component doesn't unmount immediately.
        setLoading(false); 
      } else {
        // User is signed out, show the landing page.
        setLoading(false);
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-gradient-to-br from-background to-rose-50">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background to-rose-50">
      <header className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto flex justify-between items-center">
          <Logo />
          <div className="space-x-2">
            <Button variant="ghost" asChild>
              <Link href="/login">Log In</Link>
            </Button>
            <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg">
              <Link href="/signup">Sign Up Free</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        <section className="container mx-auto px-4 py-16 sm:py-24 text-center">
          <h1 className="font-headline text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-gray-800">
            Find Your <span className="text-primary">Perfect Match</span> with MatchCraft
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg sm:text-xl text-foreground/80">
            Join a community dedicated to helping you find genuine connections and lasting relationships. Our intelligent platform makes finding love simpler and more meaningful.
          </p>
          <div className="mt-10 flex justify-center space-x-4">
            <Button size="lg" asChild className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl px-8 py-6 text-lg">
              <Link href="/signup">Get Started</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="px-8 py-6 text-lg border-primary text-primary hover:bg-primary/10 shadow-lg">
              <Link href="/discover">Explore Profiles</Link>
            </Button>
          </div>
        </section>

        <section className="py-16 sm:py-24 bg-card">
          <div className="container mx-auto px-4">
            <h2 className="font-headline text-4xl font-semibold text-center mb-12 text-gray-800">Why Choose MatchCraft?</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { icon: <HeartHandshake className="h-12 w-12 text-primary" />, title: "Intelligent Suggestions", description: "AI-powered matches tailored to your preferences and activity." },
                { icon: <Search className="h-12 w-12 text-primary" />, title: "Advanced Search", description: "Filter by location, profession, community, and more to find your ideal partner." },
                { icon: <MessageSquareText className="h-12 w-12 text-primary" />, title: "Secure Messaging", description: "Communicate safely with matches through our encrypted chat system." },
                { icon: <ShieldCheck className="h-12 w-12 text-primary" />, title: "Verified Profiles", description: "Connect with genuine users thanks to our profile verification process." },
              ].map((feature, index) => (
                <div key={index} className="p-6 bg-background rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300">
                  <div className="flex justify-center mb-4">{feature.icon}</div>
                  <h3 className="font-headline text-2xl font-semibold mb-2 text-center text-gray-700">{feature.title}</h3>
                  <p className="text-foreground/70 text-center">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        
        <section className="py-16 sm:py-24">
          <div className="container mx-auto px-4 text-center">
             <h2 className="font-headline text-4xl font-semibold mb-8 text-gray-800">Ready to Find The One?</h2>
             <p className="text-lg text-foreground/80 mb-8 max-w-xl mx-auto">
               Your journey to a happy and fulfilling partnership starts here. Create your profile today and let MatchCraft guide you to your soulmate.
             </p>
             <Button size="lg" asChild className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-xl px-10 py-6 text-lg">
               <Link href="/signup">Join MatchCraft Now</Link>
             </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
