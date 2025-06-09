
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Sparkles, Edit3, UploadCloud, Users, Wand2 } from "lucide-react";
import { ExtractHoroscopeDetailsForm } from "./components/ExtractHoroscopeDetailsForm";
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
                <AccordionTrigger className="p-0">
                    <CardHeader className="w-full text-left flex-row items-center justify-between hover:no-underline">
                        <div>
                        <CardTitle className="flex items-center gap-2 font-headline text-2xl">
                            <Wand2 className="h-6 w-6 text-primary" />
                            AI Horoscope Analysis
                        </CardTitle>
                        <CardDescription>Get detailed insights from your birth data or PDF.</CardDescription>
                        </div>
                         {/* ChevronDown will be added by AccordionTrigger automatically */}
                    </CardHeader>
                </AccordionTrigger>
                <AccordionContent>
                    <CardContent className="pt-4">
                        <ExtractHoroscopeDetailsForm />
                    </CardContent>
                </AccordionContent>
            </Card>
        </AccordionItem>
        
        <AccordionItem value="manual-details">
             <Card className="shadow-lg hover:shadow-xl transition-shadow">
                <AccordionTrigger className="p-0">
                    <CardHeader className="w-full text-left flex-row items-center justify-between hover:no-underline">
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
                        Your current horoscope information helps in finding cosmically aligned matches. Ensure it's accurate for the best suggestions.
                        </p>
                        {/* Placeholder for displaying current horoscope info */}
                        <div className="p-4 bg-muted/50 rounded-md text-sm">
                            <p><strong>Rasi:</strong> Leo (Example)</p>
                            <p><strong>Nakshatra:</strong> Magha (Example)</p>
                            <p><strong>Other Info:</strong> Some details here... (Example)</p>
                        </div>
                        <Button asChild className="w-full">
                        <Link href="/dashboard/edit-profile">Edit Horoscope in Profile</Link>
                        </Button>
                    </CardContent>
                </AccordionContent>
            </Card>
        </AccordionItem>

        <AccordionItem value="horoscope-document">
             <Card className="shadow-lg hover:shadow-xl transition-shadow">
                 <AccordionTrigger className="p-0">
                    <CardHeader className="w-full text-left flex-row items-center justify-between hover:no-underline">
                        <div>
                        <CardTitle className="flex items-center gap-2 font-headline text-2xl">
                            <UploadCloud className="h-6 w-6 text-primary" />
                            Horoscope Document
                        </CardTitle>
                        <CardDescription>Upload or manage your detailed horoscope PDF for matching.</CardDescription>
                        </div>
                    </CardHeader>
                </AccordionTrigger>
                <AccordionContent>
                    <CardContent className="pt-4 space-y-3">
                        <p className="text-sm text-foreground/80">
                        A detailed horoscope document can be shared with matches or used for deeper compatibility analysis by our AI tools.
                        </p>
                        {/* Placeholder for PDF upload status/link */}
                        <div className="p-4 bg-muted/50 rounded-md text-sm">
                            <p><strong>Current PDF:</strong> <Link href="#" className="text-primary hover:underline">my_horoscope.pdf</Link> (Example)</p>
                        </div>
                        <Button asChild className="w-full">
                        <Link href="/dashboard/edit-profile#horoscope-pdf">Upload/Change PDF in Profile</Link>
                        </Button>
                    </CardContent>
                </AccordionContent>
            </Card>
        </AccordionItem>
        
        <AccordionItem value="match-compatibility">
            <Card className="shadow-lg hover:shadow-xl transition-shadow">
                <AccordionTrigger className="p-0">
                     <CardHeader className="w-full text-left flex-row items-center justify-between hover:no-underline">
                        <div>
                        <CardTitle className="flex items-center gap-2 font-headline text-2xl">
                        <Users className="h-6 w-6 text-primary" />
                        AI Horoscope Compatibility (Coming Soon)
                        </CardTitle>
                        <CardDescription>Discover how your stars align with potential matches.</CardDescription>
                        </div>
                    </CardHeader>
                </AccordionTrigger>
                <AccordionContent>
                    <CardContent className="pt-4">
                        <p className="text-sm text-foreground/80">
                        Soon, you'll be able to check detailed horoscope compatibility with other profiles. This feature will use advanced astrological calculations and AI insights to guide you.
                        You'll be able to compare your AI-analyzed horoscope with another user's or manually input details for comparison.
                        </p>
                        <div className="mt-4 p-6 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg text-center">
                            <Sparkles className="h-12 w-12 text-primary mx-auto mb-3"/>
                            <p className="font-semibold text-primary">Stay Tuned for Exciting Updates!</p>
                        </div>
                    </CardContent>
                </AccordionContent>
            </Card>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
