
"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Heart, Search, MessageSquareText, ShieldCheck, Users, Zap, Telescope, Brain, FileText, UserCheckIcon, Palette, ListFilter, SmartphoneNfc, Globe, Languages, Maximize
} from 'lucide-react';
import { Logo } from '@/components/shared/Logo';
import { Footer } from '@/components/navigation/Footer';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { Loader2 } from 'lucide-react';

const navLinks = [
  { href: "#home", label: "Home" },
  { href: "#about", label: "About Us" },
  { href: "#features", label: "Features" },
  { href: "#contact", label: "Contact" },
];

const featuresData = [
  { icon: <Telescope className="h-10 w-10 text-red-500" />, title: "Horoscope Matching", description: "Explore cosmic compatibility with potential partners.", borderColor: "border-red-500", href:"/dashboard/horoscope" },
  { icon: <Brain className="h-10 w-10 text-blue-500" />, title: "Smart Matching", description: "AI suggestions based on your profile and preferences.", borderColor: "border-blue-500", href:"/suggestions" },
  { icon: <ShieldCheck className="h-10 w-10 text-green-500" />, title: "Privacy Guaranteed", description: "Control your information with robust privacy settings.", borderColor: "border-green-500", href:"/privacy" },
  { icon: <Globe className="h-10 w-10 text-yellow-500" />, title: "Global Reach", description: "Connect with diverse Indian & Sri Lankan profiles.", borderColor: "border-yellow-500", href:"/discover" },
  { icon: <FileText className="h-10 w-10 text-purple-500" />, title: "In-Depth Profiles", description: "Comprehensive details to know matches better.", borderColor: "border-purple-500", href:"/dashboard/edit-profile" },
  { icon: <MessageSquareText className="h-10 w-10 text-orange-500" />, title: "Secure Messaging", description: "Chat safely via our encrypted system.", borderColor: "border-orange-500", href:"/messages" },
  { icon: <UserCheckIcon className="h-10 w-10 text-cyan-500" />, title: "Verified Profiles", description: "Connect with genuine and authentic users.", borderColor: "border-cyan-500", href:"/discover" },
  { icon: <Palette className="h-10 w-10 text-lime-500" />, title: "Profile Template", description: "Easy-to-use templates to showcase yourself.", borderColor: "border-lime-500", href:"/dashboard/edit-profile" },
  { icon: <ListFilter className="h-10 w-10 text-pink-500" />, title: "Custom Preferences", description: "Refine criteria to find your ideal match.", borderColor: "border-pink-500", href:"/dashboard/preferences" },
  { icon: <Maximize className="h-10 w-10 text-teal-500" />, title: "Real Time Chat", description: "Engage in instant conversations with matches.", borderColor: "border-teal-500", href:"/messages"},
  { icon: <Languages className="h-10 w-10 text-amber-500" />, title: "Language Preferences", description: "Set language options, including Tamil & Sinhala.", borderColor: "border-amber-500", href:"/dashboard/preferences"},
  { icon: <SmartphoneNfc className="h-10 w-10 text-rose-500" />, title: "Mobile App Support", description: "Seamless experience on all your devices.", borderColor: "border-rose-500", href:"#"},
];


export default function LandingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.replace('/dashboard');
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
        <p className="mt-4 text-slate-500">Loading Cupid Knots...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-800">
      <header className="py-4 px-4 sm:px-6 lg:px-8 shadow-sm bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto flex justify-between items-center">
          <Logo textColor="text-purple-600" iconSize={24} textSize="text-2xl"/>
          <nav className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => (
              <Link key={link.label} href={link.href} className="text-sm font-medium text-slate-600 hover:text-purple-600 transition-colors">
                {link.label}
              </Link>
            ))}
          </nav>
          <Button asChild className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 text-sm shadow-md">
            <Link href="/login">Sign In</Link>
          </Button>
        </div>
      </header>

      <main className="flex-grow">
        <section id="home" className="relative hero-gradient text-white py-20 md:py-32 overflow-hidden">
          <div className="container mx-auto px-4 z-10 relative">
            <div className="flex flex-col md:flex-row items-center">
              <div className="md:w-3/5 text-center md:text-left mb-10 md:mb-0">
                <h1 className="font-headline text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight">
                  Welcome to <span className="inline-flex items-center">CUPID<Heart className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 mx-1 fill-white"/>KNOTS</span>
                </h1>
                <p className="mt-6 text-lg sm:text-xl max-w-xl mx-auto md:mx-0">
                  Find your perfect match with our advanced matchmaking platform.
                </p>
                <div className="mt-10">
                  <Button size="lg" asChild className="bg-white hover:bg-slate-100 text-purple-600 shadow-xl px-8 py-3 text-base font-semibold rounded-lg">
                    <Link href="/signup">Get Started</Link>
                  </Button>
                </div>
              </div>
              <div className="md:w-2/5 flex justify-center md:justify-end">
                <Image 
                  src="https://placehold.co/400x500.png?text=Namaste" 
                  alt="Indian Welcome" 
                  width={350} 
                  height={450} 
                  className="rounded-lg shadow-2xl object-cover"
                  data-ai-hint="indian woman traditional" 
                  priority
                />
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="py-16 sm:py-24 bg-slate-50">
          <div className="container mx-auto px-4">
            <h2 className="font-headline text-4xl font-bold text-center mb-16 text-blue-700">Why Choose Us</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8">
              {featuresData.map((feature) => (
                <Card key={feature.title} className={`flex flex-col shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out bg-white border-t-4 ${feature.borderColor} rounded-b-lg rounded-t-sm`}>
                  <CardHeader className="items-center text-center pt-6 pb-3">
                    <div className="p-3 rounded-full bg-slate-100 mb-3">
                      {React.cloneElement(feature.icon, { className: `${feature.icon.props.className} h-8 w-8`})}
                    </div>
                    <CardTitle className="font-headline text-xl text-slate-700">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-grow text-center px-6 pb-6">
                    <p className="text-slate-500 text-sm">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
        
        <section className="py-16 sm:py-24 hero-gradient">
          <div className="container mx-auto px-4 text-center">
             <h2 className="font-headline text-4xl font-semibold mb-8 text-white">Ready to Find The One?</h2>
             <p className="text-lg text-white/90 mb-8 max-w-xl mx-auto">
               Your journey to a happy and fulfilling partnership starts here. Create your profile today and let Cupid Knots guide you to your soulmate.
             </p>
             <Button size="lg" asChild className="bg-white hover:bg-slate-100 text-purple-600 shadow-xl px-10 py-3 text-base font-semibold rounded-lg">
               <Link href="/signup">Join Cupid Knots Now</Link>
             </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
