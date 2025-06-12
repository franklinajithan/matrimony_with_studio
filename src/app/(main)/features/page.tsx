
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Telescope, Brain, ShieldCheck, Globe, FileText, MessageSquareText, UserCheckIcon, Palette, ListFilter, SmartphoneNfc, Languages, Maximize, Heart } from "lucide-react";
import React from "react";
import Image from "next/image";


const featuresData = [
  {
    icon: <Telescope className="h-8 w-8" />,
    title: "Horoscope Matching",
    description: "Explore cosmic compatibility with Rasi/Nakshatra matching and AI-generated compatibility scores.",
    borderColor: "border-red-500",
  },
  { icon: <Brain className="h-8 w-8" />, title: "AI Smart Matching", description: "Intelligent suggestions based on profile data, preferences, and user activity.", borderColor: "border-blue-500" },
  { icon: <ShieldCheck className="h-8 w-8" />, title: "Privacy & Security", description: "Control your information with robust privacy settings like photo/phone hiding until matched.", borderColor: "border-green-500" },
  { icon: <Globe className="h-8 w-8" />, title: "Global & Community Reach", description: "Connect with diverse Indian & Sri Lankan profiles, with advanced filters for community, location etc.", borderColor: "border-yellow-500" },
  {
    icon: <FileText className="h-8 w-8" />,
    title: "Comprehensive Profiles",
    description: "Detailed profiles with multiple photos, AI-enhanced bio, preferences, and horoscope PDF uploads.",
    borderColor: "border-purple-500",
  },
  { icon: <MessageSquareText className="h-8 w-8" />, title: "Secure Real-time Chat", description: "Chat safely via our encrypted system with typing indicators and photo sharing.", borderColor: "border-orange-500" },
  { icon: <UserCheckIcon className="h-8 w-8" />, title: "Verified Profiles", description: "Connect with genuine users through admin approval with ID proof for a verified badge.", borderColor: "border-cyan-500" },
  { icon: <Palette className="h-8 w-8" />, title: "Easy Profile Setup", description: "Step-by-Step Profile Setup after sign-in with AI assistance for bio and interests.", borderColor: "border-lime-500" },
  { icon: <ListFilter className="h-8 w-8" />, title: "Custom Match Preferences", description: "Refine criteria to find your ideal match, e.g. only show verified / premium users.", borderColor: "border-pink-500" },
  { icon: <SmartphoneNfc className="h-8 w-8" />, title: "Subscription & Notifications", description: "Premium plans with Razorpay/Stripe, push notifications for matches, messages, and profile views.", borderColor: "border-rose-500" },
  { icon: <Languages className="h-8 w-8" />, title: "Cultural Preferences", description: "Specify religion, caste, language (Tamil, Sinhala, etc.), height, age and more.", borderColor: "border-amber-500" },
  { icon: <Maximize className="h-8 w-8" />, title: "Event Invites & Moderation", description: "Invite to marriage expos, profile flagging, and user moderation system.", borderColor: "border-teal-500" },
];


export default function FeaturesPage() {
  return (
    <div className="space-y-12 py-8">
      <section className="text-center py-12 bg-gradient-to-br from-rose-50 to-peach-100 rounded-xl shadow-lg">
        <h1 className="font-headline text-5xl font-bold text-primary mb-6">
          Features of MatchCraft
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Discover the tools and functionalities designed to help you find your perfect match seamlessly and securely.
        </p>
      </section>

      <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10">
        {featuresData.map((feature) => (
          <Card key={feature.title} className={`flex flex-col shadow-md hover:shadow-lg transition-shadow duration-300 ease-in-out bg-card border-t-4 ${feature.borderColor} rounded-b-lg rounded-t-sm h-full`}>
            <CardHeader className="items-center text-center pt-6 pb-3">
              <div className={`p-3 rounded-full bg-muted mb-3 text-${feature.borderColor.replace("border-", "text-")}`}>
                {React.cloneElement(feature.icon, { className: `${feature.icon.props.className || ''} h-10 w-10` })}
              </div>
              <CardTitle className="font-headline text-2xl text-card-foreground">{feature.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow text-center px-6 pb-6">
              <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="text-center py-10 mt-8">
        <Heart className="w-16 h-16 text-primary mx-auto mb-4" />
        <p className="text-lg text-muted-foreground">
          We are continuously innovating to bring you the best matchmaking experience.
        </p>
      </section>
    </div>
  );
}
