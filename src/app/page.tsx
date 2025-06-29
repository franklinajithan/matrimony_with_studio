
"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"; // Added CardFooter
import { Heart, Search, MessageSquareText, ShieldCheck, Users, Zap, Telescope, Brain, FileText, UserCheckIcon, Palette, ListFilter, SmartphoneNfc, Globe, Languages, Maximize, CreditCard, Send } from "lucide-react";
import { Navbar } from "@/components/navigation/Navbar"; 
import { Footer } from "@/components/navigation/Footer";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { Loader2 } from "lucide-react";

const featuresData = [
  {
    icon: <Telescope className="h-8 w-8" />,
    title: "Horoscope Matching",
    description: "Explore cosmic compatibility with potential partners.",
    borderColor: "border-red-500",
    href: "/dashboard/horoscope",
  },
  { icon: <Brain className="h-8 w-8" />, title: "Smart Matching", description: "AI suggestions based on your profile and preferences.", borderColor: "border-blue-500", href: "/suggestions" },
  { icon: <ShieldCheck className="h-8 w-8" />, title: "Privacy Guaranteed", description: "Control your information with robust privacy settings.", borderColor: "border-green-500", href: "/privacy" }, // Assuming /privacy route exists or will be created
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
  { icon: <SmartphoneNfc className="h-8 w-8" />, title: "Subscription Plans", description: "Premium plans with Razorpay/Stripe, push notifications for matches, messages, and profile views.", borderColor: "border-rose-500", href: "/pricing" },
  {
    icon: <Languages className="h-8 w-8" />,
    title: "Language Preferences",
    description: "Set language options, including Tamil & Sinhala.",
    borderColor: "border-amber-500",
    href: "/dashboard/preferences",
  },
  { icon: <Maximize className="h-8 w-8" />, title: "Real Time Chat", description: "Engage in instant conversations with matches.", borderColor: "border-teal-500", href: "/messages" },
];

const successStoriesData = [
  {
    imageSrc: "https://placehold.co/600x400.png",
    imageAlt: "Priya & Rohan",
    dataAiHint: "happy couple wedding",
    names: "Priya & Rohan",
    story: "\"CupidKnots connected us across cities! We found instant chemistry and are now happily married. Thank you for making our dream come true!\"",
    href: "/success-stories/priya-rohan"
  },
  {
    imageSrc: "https://placehold.co/600x400.png",
    imageAlt: "Aisha & Sameer",
    dataAiHint: "couple smiling park",
    names: "Aisha & Sameer",
    story: "\"We never thought online matrimony would work for us, but CupidKnots proved us wrong. The AI suggestions were surprisingly accurate!\"",
    href: "/success-stories/aisha-sameer"
  },
  {
    imageSrc: "https://placehold.co/600x400.png",
    imageAlt: "Lakshmi & Arjun",
    dataAiHint: "traditional couple portrait",
    names: "Lakshmi & Arjun",
    story: "\"Finding someone with similar cultural values was important. CupidKnots helped us connect with someone perfect for our family and for us.\"",
    href: "/success-stories/lakshmi-arjun"
  }
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
        <p className="mt-4 text-slate-500">Loading CupidMatch...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-800">
      <Navbar /> 

      <main className="flex-grow">
        <section id="home" className="relative bg-gradient-to-br from-purple-500 to-red-400 text-white overflow-hidden">
          <div className="container mx-auto relative px-4">
            <div className="flex flex-col md:flex-row items-center">
              <div className="flex flex-col items-center md:items-start justify-center text-center md:text-left mb-12 md:mb-0 md:w-5/12 animate-fade-in-up">
                <h1 className="font-headline text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight tracking-tight drop-shadow-lg">
                  Welcome to{" "}
                  <span className="inline-flex items-center">
                    <span className="ml-2">CUPID</span>
                    <Heart className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 mx-2 fill-red-500 drop-shadow-lg" />
                    <span className="mr-2">KNOTS</span>
                  </span>
                </h1>
                <p className="mt-8 text-lg sm:text-xl max-w-xl md:max-w-none opacity-90 leading-relaxed">
                  Discover your soulmate with our intelligent matchmaking platform powered by advanced AI and personal preferences.
                </p>
                <div className="mt-12">
                  <Button size="lg" asChild className="bg-white hover:bg-pink-100 text-purple-600 shadow-2xl px-10 py-4 text-lg font-bold rounded-full transition-all duration-300">
                    <Link href="/signup">✨ Get Started Today</Link>
                  </Button>
                </div>
              </div>

              <div className="md:w-7/12 flex justify-center md:justify-end">
                <div className="relative">
                  <Image
                    src="https://firebasestorage.googleapis.com/v0/b/matrimony-09-06-2025.firebasestorage.app/o/image%2Ferasebg-transformed.png?alt=media&token=643c5055-790b-4fbe-baa8-7815fe4498d9"
                    alt="Indian woman in traditional attire with a welcoming gesture"
                    width={550}
                    height={697}
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
                      <div className={`p-3 rounded-full bg-slate-100 mb-3 text-${feature.borderColor.replace("border-", "text-")}`}>
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

        <section id="success-stories" className="py-16 sm:py-24 bg-rose-50">
          <div className="container mx-auto px-4">
            <h2 className="font-headline text-4xl font-bold text-center mb-16 text-pink-700">Hear From Our Happy Couples</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {successStoriesData.map((story) => (
                <Card key={story.names} className="flex flex-col shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out overflow-hidden rounded-lg bg-white">
                  <div className="relative w-full h-56">
                    <Image
                      src={story.imageSrc}
                      alt={story.imageAlt}
                      fill
                      className="object-cover"
                      data-ai-hint={story.dataAiHint}
                    />
                  </div>
                  <CardHeader className="pt-5 pb-2">
                    <CardTitle className="font-headline text-2xl text-slate-700 text-center">{story.names}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-grow px-6 pb-5">
                    <p className="text-slate-600 text-sm italic text-center leading-relaxed">"{story.story}"</p>
                  </CardContent>
                  <CardFooter className="p-5 border-t">
                    <Button variant="link" asChild className="w-full text-pink-600 hover:text-pink-700">
                      <Link href={story.href}>Read Their Full Story</Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
            <div className="text-center mt-10">
                <Button size="lg" asChild variant="outline" className="border-pink-500 text-pink-600 hover:bg-pink-500/10 hover:text-pink-700 shadow-md px-8 py-3 text-base font-semibold rounded-md">
                    <Link href="/success-stories/submit">
                       <Send className="mr-2 h-5 w-5" /> Share Your Story
                    </Link>
                </Button>
            </div>
            <div className="text-center mt-8">
                <Button size="lg" asChild className="bg-pink-600 hover:bg-pink-700 text-white shadow-lg px-8 py-3 text-base font-semibold rounded-md">
                    <Link href="/success-stories">View More Success Stories</Link>
                </Button>
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-24 hero-gradient">
          <div className="container mx-auto px-4 text-center">
            <h2 className="font-headline text-4xl font-semibold mb-8 text-white">Ready to Find The One?</h2>
            <p className="text-lg text-white/90 mb-8 max-w-xl mx-auto">
              Your journey to a happy and fulfilling partnership starts here. Create your profile today and let CupidMatch guide you to your soulmate.
            </p>
            <Button size="lg" asChild className="bg-white hover:bg-slate-100 text-purple-600 shadow-xl px-10 py-3 text-base font-semibold rounded-lg">
              <Link href="/signup">Join CupidMatch Now</Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
