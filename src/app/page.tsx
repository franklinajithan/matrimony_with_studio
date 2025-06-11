
"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  HeartHandshake, Search, MessageSquareText, ShieldCheck, Loader2, Star, Lock, Globe, UserSquare, Settings2, Languages, Smartphone, BarChart3, Users, Zap
} from 'lucide-react';
import { Logo } from '@/components/shared/Logo';
import { Footer } from '@/components/navigation/Footer';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';

const features = [
  { icon: <Star className="h-8 w-8 text-primary" />, title: "Horoscope Matching", description: "Seamlessly match horoscopes for cosmic compatibility.", href:"/dashboard/horoscope" },
  { icon: <Zap className="h-8 w-8 text-primary" />, title: "Smart Matching", description: "AI-powered suggestions tailored to your unique profile.", href:"/suggestions" },
  { icon: <Lock className="h-8 w-8 text-primary" />, title: "Privacy Guaranteed", description: "Your data is safe with robust privacy controls.", href:"/privacy" }, // Assuming a privacy page
  { icon: <Globe className="h-8 w-8 text-primary" />, title: "Global Reach", description: "Connect with profiles from around the world.", href:"/discover" },
  { icon: <UserSquare className="h-8 w-8 text-primary" />, title: "In-Depth Profiles", description: "Comprehensive profiles to help you know more.", href:"/dashboard/edit-profile" },
  { icon: <MessageSquareText className="h-8 w-8 text-primary" />, title: "Secure Messaging", description: "Chat safely with matches through encrypted conversations.", href:"/messages" },
  { icon: <ShieldCheck className="h-8 w-8 text-primary" />, title: "Verified Profiles", description: "Connect with genuine users with verified badges.", href:"/discover" },
  { icon: <Settings2 className="h-8 w-8 text-primary" />, title: "Custom Preferences", description: "Fine-tune your search for the perfect match.", href:"/dashboard/preferences" },
  { icon: <Languages className="h-8 w-8 text-primary" />, title: "Language Preferences", description: "Communicate in languages you are comfortable with.", href:"/dashboard/preferences" },
  { icon: <Smartphone className="h-8 w-8 text-primary" />, title: "Mobile App Support", description: "Access MatchCraft on the go (future feature).", href:"#" },
  // "Profile Template" seems like an internal/dev term, "Real Time Chat" is covered by Secure Messaging.
  // Adding a couple more relevant examples:
  { icon: <BarChart3 className="h-8 w-8 text-primary" />, title: "Activity Insights", description: "Understand your interactions and profile views (future feature).", href:"#" },
  { icon: <Users className="h-8 w-8 text-primary" />, title: "Community Events", description: "Participate in virtual or local community events (future feature).", href:"#" },
];


export default function LandingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.replace('/dashboard');
        setLoading(false); 
      } else {
        setLoading(false);
      }
    });
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

        <section className="py-16 sm:py-24 bg-card/50">
          <div className="container mx-auto px-4">
            <h2 className="font-headline text-4xl font-semibold text-center mb-16 text-gray-800">Explore Our Features</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <Card key={index} className="flex flex-col shadow-lg hover:shadow-2xl transition-shadow duration-300 ease-in-out bg-background">
                  <CardHeader className="items-center text-center">
                    <div className="p-3 rounded-full bg-primary/10 mb-3">
                      {feature.icon}
                    </div>
                    <CardTitle className="font-headline text-2xl text-gray-700">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-grow text-center">
                    <p className="text-foreground/70">{feature.description}</p>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="w-full border-primary/50 text-primary hover:bg-primary/10" asChild>
                       <Link href={feature.href || "#"}>Explore</Link>
                    </Button>
                  </CardFooter>
                </Card>
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
