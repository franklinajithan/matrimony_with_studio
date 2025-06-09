
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Sparkles, Edit3, UploadCloud, Users, Wand2 } from "lucide-react";
import { ExtractHoroscopeDetailsForm } from "./components/ExtractHoroscopeDetailsForm";
import { HoroscopeCompatibilityForm } from "./components/HoroscopeCompatibilityForm"; // Import the new component
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";


export default function HoroscopePage() {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="font-headline text-4xl font-semibold text-gray-800 flex items-center justify-center gap-3">
          <Sparkles className="h-10 w-10 text-primary" />
          Horoscope Insights & Tools
        </h1>
        <p className="mt-2 text-lg text-muted-foreground max-w-2xl mx-auto">
          Manage your astrological information, get AI-powered analysis, and explore compatibility features.
        </p>
      </div>

      <Accordion type="multiple" defaultValue={['ai-analysis']} className="w-full max-w-4xl mx-auto space-y-6">
        <AccordionItem value="ai-analysis">
            <Card className="shadow-lg hover:shadow-xl transition-shadow">
                <AccordionTrigger className="p-0 hover:no-underline">
                    <CardHeader className="w-full text-left flex-row items-center justify-between">
                        <div>
                        <CardTitle className="flex items-center gap-2 font-headline text-2xl">
                            <Wand2 className="h-6 w-6 text-primary" />
                            AI Horoscope Analysis
                        </CardTitle>
                        <CardDescription>Get detailed insights from your birth data or PDF/Image.</CardDescription>
                        </div>
                    </CardHeader>
                </AccordionTrigger>
                <AccordionContent>
                    <CardContent className="pt-4">
                        <ExtractHoroscopeDetailsForm />
                    </CardContent>
                </AccordionContent>
            </Card>
        </AccordionItem>
        
        <AccordionItem value="match-compatibility">
            <Card className="shadow-lg hover:shadow-xl transition-shadow">
                <AccordionTrigger className="p-0 hover:no-underline">
                     <CardHeader className="w-full text-left flex-row items-center justify-between">
                        <div>
                        <CardTitle className="flex items-center gap-2 font-headline text-2xl">
                        <Users className="h-6 w-6 text-primary" />
                        AI Horoscope Compatibility
                        </CardTitle>
                        <CardDescription>Discover how your stars align with potential matches.</CardDescription>
                        </div>
                    </CardHeader>
                </AccordionTrigger>
                <AccordionContent>
                    <CardContent className="pt-4">
                        <HoroscopeCompatibilityForm />
                    </CardContent>
                </AccordionContent>
            </Card>
        </AccordionItem>

        <AccordionItem value="manual-details">
             <Card className="shadow-lg hover:shadow-xl transition-shadow">
                <AccordionTrigger className="p-0 hover:no-underline">
                    <CardHeader className="w-full text-left flex-row items-center justify-between">
                        <div>
                        <CardTitle className="flex items-center gap-2 font-headline text-2xl">
                            <Edit3 className="h-6 w-6 text-primary" />
                            Your Horoscope Details
                        </CardTitle>
                        <CardDescription>View or update your Rasi, Nakshatra, and other astrological details.</CardDescription>
                        </div>
                    </CardHeader>
                </AccordionTrigger>
                <AccordionContent>
                    <CardContent className="pt-4 space-y-3">
                        <p className="text-sm text-foreground/80">
                        Your current horoscope information helps in finding cosmically aligned matches. Ensure it's accurate for the best suggestions. This information is managed in your main profile.
                        </p>
                        <Button asChild className="w-full">
                        <Link href="/dashboard/edit-profile#horoscopeInfo">View/Edit Horoscope in Profile</Link>
                        </Button>
                    </CardContent>
                </AccordionContent>
            </Card>
        </AccordionItem>

        <AccordionItem value="horoscope-document">
             <Card className="shadow-lg hover:shadow-xl transition-shadow">
                 <AccordionTrigger className="p-0 hover:no-underline">
                    <CardHeader className="w-full text-left flex-row items-center justify-between">
                        <div>
                        <CardTitle className="flex items-center gap-2 font-headline text-2xl">
                            <UploadCloud className="h-6 w-6 text-primary" />
                            Horoscope Document
                        </CardTitle>
                        <CardDescription>Upload or manage your detailed horoscope PDF/Image for matching.</CardDescription>
                        </div>
                    </CardHeader>
                </AccordionTrigger>
                <AccordionContent>
                    <CardContent className="pt-4 space-y-3">
                        <p className="text-sm text-foreground/80">
                        A detailed horoscope document can be used for AI analysis or shared with matches. This is managed in your main profile.
                        </p>
                        <Button asChild className="w-full">
                        <Link href="/dashboard/edit-profile#horoscopeFile-input">Upload/Change Document in Profile</Link>
                        </Button>
                    </CardContent>
                </AccordionContent>
            </Card>
        </AccordionItem>
        
      </Accordion>
    </div>
  );
}
