
"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  HeartHandshake, Search, MessageSquareText, ShieldCheck, Loader2, Star, Lock, Globe, UserSquare, Settings2, Languages, Smartphone, BarChart3, Users, Zap, Telescope, Brain, FileText, UserCheckIcon, LayoutList, ListFilter, SmartphoneNfc, Palette
} from 'lucide-react';
import { Logo } from '@/components/shared/Logo';
import { Footer } from '@/components/navigation/Footer';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';

const features = [
  { icon: <Telescope className="h-8 w-8 text-primary" />, title: "Horoscope Matching", description: "Discover cosmic compatibility by matching horoscopes with potential partners from India and Sri Lanka.", href:"/dashboard/horoscope" },
  { icon: <Brain className="h-8 w-8 text-primary" />, title: "Smart Matching", description: "Our AI provides intelligent suggestions based on your profile and preferences, tailored for you.", href:"/suggestions" },
  { icon: <ShieldCheck className="h-8 w-8 text-primary" />, title: "Privacy Guaranteed", description: "Control your information with robust privacy settings and secure data handling.", href:"/privacy" }, // Assuming a privacy page exists or will be created
  { icon: <Globe className="h-8 w-8 text-primary" />, title: "Global & Local Reach", description: "Connect with a diverse community, with a special focus on Indian and Sri Lankan profiles.", href:"/discover" },
  { icon: <FileText className="h-8 w-8 text-primary" />, title: "In-Depth Profiles", description: "Get to know potential matches better through comprehensive profile details and preferences.", href:"/dashboard/edit-profile" },
  { icon: <MessageSquareText className="h-8 w-8 text-primary" />, title: "Secure Messaging", description: "Chat safely and privately with your matches through our encrypted system for real-time connections.", href:"/messages" },
  { icon: <UserCheckIcon className="h-8 w-8 text-primary" />, title: "Verified Profiles", description: "Look for verified badges to connect with genuine and authentic users with confidence.", href:"/discover" },
  { icon: <Palette className="h-8 w-8 text-primary" />, title: "Profile Template", description: "Our structured profile templates make it easy to showcase yourself and find information.", href:"/dashboard/edit-profile" },
  { icon: <ListFilter className="h-8 w-8 text-primary" />, title: "Custom Preferences", description: "Refine your search criteria including community and lifestyle to find exactly who you're looking for.", href:"/dashboard/preferences" },
  { icon: <Languages className="h-8 w-8 text-primary" />, title: "Language Options", description: "Set your language preferences, including Tamil and Sinhala, for a comfortable experience.", href:"/dashboard/preferences" },
  { icon: <SmartphoneNfc className="h-8 w-8 text-primary" />, title: "Mobile Friendly", description: "Enjoy a seamless experience on your desktop or mobile browser, anytime, anywhere.", href:"#" },
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
            Find Your <span className="text-primary">Perfect Match</span> with CupidMatch
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg sm:text-xl text-foreground/80">
            Join a community dedicated to helping you find genuine connections and lasting relationships, with a focus on Indian and Sri Lankan singles. Our intelligent platform makes finding love simpler and more meaningful.
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
            <h2 className="font-headline text-4xl font-semibold text-center mb-16 text-gray-800">Explore CupidMatch Features</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <Link key={index} href={feature.href || "#"} passHref>
                  <Card className="flex flex-col shadow-lg hover:shadow-2xl transition-shadow duration-300 ease-in-out bg-background h-full cursor-pointer group">
                    <CardHeader className="items-center text-center">
                      <div className="p-3 rounded-full bg-primary/10 mb-3 transition-transform group-hover:scale-110">
                        {feature.icon}
                      </div>
                      <CardTitle className="font-headline text-2xl text-gray-700 group-hover:text-primary transition-colors">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow text-center">
                      <p className="text-foreground/70 text-sm">{feature.description}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
        
        <section className="py-16 sm:py-24">
          <div className="container mx-auto px-4 text-center">
             <h2 className="font-headline text-4xl font-semibold mb-8 text-gray-800">Ready to Find The One?</h2>
             <p className="text-lg text-foreground/80 mb-8 max-w-xl mx-auto">
               Your journey to a happy and fulfilling partnership starts here. Create your profile today and let CupidMatch guide you to your soulmate.
             </p>
             <Button size="lg" asChild className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-xl px-10 py-6 text-lg">
               <Link href="/signup">Join CupidMatch Now</Link>
             </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
