
"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Search, MessageSquareText, ShieldCheck, Users, Zap, Telescope, Brain, FileText, UserCheckIcon, Palette, ListFilter, SmartphoneNfc, Globe, Languages, Maximize } from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { Footer } from "@/components/navigation/Footer";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { Loader2 } from "lucide-react";

const navLinks = [
  { href: "#home", label: "Home" },
  { href: "/about", label: "About Us" },
  { href: "/features", label: "Features" },
  { href: "/contact", label: "Contact" },
];

const featuresData = [
  {
    icon: <Telescope className="h-8 w-8" />,
    title: "Horoscope Matching",
    description: "Explore cosmic compatibility with potential partners.",
    borderColor: "border-red-500",
    href: "/dashboard/horoscope",
  },
  { icon: <Brain className="h-8 w-8" />, title: "Smart Matching", description: "AI suggestions based on your profile and preferences.", borderColor: "border-blue-500", href: "/suggestions" },
  { icon: <ShieldCheck className="h-8 w-8" />, title: "Privacy Guaranteed", description: "Control your information with robust privacy settings.", borderColor: "border-green-500", href: "/privacy" },
  { icon: <Globe className="h-8 w-8" />, title: "Global Reach", description: "Connect with diverse Indian & Sri Lankan profiles.", borderColor: "border-yellow-500", href: "/discover" },
  {
    icon: <FileText className="h-8 w-8" />,
    title: "In-Depth Profiles",
    description: "Comprehensive details to know matches better.",
    borderColor: "border-purple-500",
    href: "/dashboard/edit-profile",
  },
  { icon: <MessageSquareText className="h-8 w-8" />, title: "Secure Messaging", description: "Chat safely via our encrypted system.", borderColor: "border-orange-500", href: "/messages" },
  { icon: <UserCheckIcon className="h-8 w-8" />, title: "Verified Profiles", description: "Connect with genuine and authentic users.", borderColor: "border-cyan-500", href: "/discover" },
  { icon: <Palette className="h-8 w-8" />, title: "Profile Template", description: "Easy-to-use templates to showcase yourself.", borderColor: "border-lime-500", href: "/dashboard/edit-profile" },
  { icon: <ListFilter className="h-8 w-8" />, title: "Custom Preferences", description: "Refine criteria to find your ideal match.", borderColor: "border-pink-500", href: "/dashboard/preferences" },
  { icon: <Maximize className="h-8 w-8" />, title: "Real Time Chat", description: "Engage in instant conversations with matches.", borderColor: "border-teal-500", href: "/messages" },
  {
    icon: <Languages className="h-8 w-8" />,
    title: "Language Preferences",
    description: "Set language options, including Tamil & Sinhala.",
    borderColor: "border-amber-500",
    href: "/dashboard/preferences",
  },
  { icon: <SmartphoneNfc className="h-8 w-8" />, title: "Mobile App Support", description: "Seamless experience on all your devices.", borderColor: "border-rose-500", href: "#" },
];

export default function LandingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.replace("/dashboard");
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
          <Logo textColor="text-purple-600" iconSize={24} textSize="text-2xl" />
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
        <section id="home" className="relative bg-gradient-to-br from-purple-500 to-red-400 text-white overflow-hidden ">
          <div className="container mx-auto relative px-4 mt-4">
            <div className="flex flex-col md:flex-row items-center">
              <div className="flex flex-col items-center justify-center text-center mb-16 md:mb-2  animate-fade-in-up">
                <h1 className="font-headline text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight tracking-tight drop-shadow-lg whitespace-nowrap">
                  Welcome to{" "}
                  <span className="inline-flex items-center">
                    <span className="ml-2">CUPID</span>
                    <Heart className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 mx-2 fill-red-500 drop-shadow-lg animate-bounce" />
                    <span className="mr-2">KNOTS</span>
                  </span>
                </h1>
                <p className="mt-8 text-lg sm:text-xl max-w-xl mx-auto opacity-90 leading-relaxed">
                  Discover your soulmate with our intelligent matchmaking platform powered by advanced AI and personal preferences.
                </p>
                <div className="mt-12">
                  <Button size="lg" asChild className="bg-white hover:bg-pink-100 text-purple-600 shadow-2xl px-10 py-4 text-lg font-bold rounded-full transition-all duration-300">
                    <Link href="/signup">✨ Get Started Today</Link>
                  </Button>
                </div>
              </div>

              <div className="md:w-1/2 flex justify-center md:justify-end">
                <div className="relative">
                  <Image
                    src="https://firebasestorage.googleapis.com/v0/b/matrimony-09-06-2025.firebasestorage.app/o/image%2FChatGPT_Image_Jun_12__2025__11_55_51_AM-removebg-preview.png?alt=media&token=90a533a7-8a7c-4c71-bd8a-1215b26f304e"
                    alt="Indian woman in traditional attire with a welcoming gesture"
                    width={450}
                    height={570}
                    className="rounded-3xl transition-transform transform hover:scale-105 duration-500"
                    data-ai-hint="indian woman traditional"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="py-16 sm:py-24 bg-slate-50">
          <div className="container mx-auto px-4">
            <h2 className="font-headline text-4xl font-bold text-center mb-16 text-blue-700">Why Choose Us</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8">
              {featuresData.map((feature) => (
                <Link href={feature.href || "#"} key={feature.title} className="block group">
                  <Card className={`flex flex-col shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out bg-white border-t-4 ${feature.borderColor} rounded-b-lg rounded-t-sm h-full`}>
                    <CardHeader className="items-center text-center pt-6 pb-3">
                      <div className={`p-3 rounded-full bg-slate-100 mb-3 text- ${feature.borderColor.replace("border-", "text-")}`}>
                        {React.cloneElement(feature.icon, { className: `${feature.icon.props.className || ''} h-8 w-8` })}
                      </div>
                      <CardTitle className="font-headline text-xl text-slate-700 group-hover:text-primary transition-colors">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow text-center px-6 pb-6">
                      <p className="text-slate-500 text-sm">{feature.description}</p>
                    </CardContent>
                  </Card>
                </Link>
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
