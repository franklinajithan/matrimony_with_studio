
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Sparkles, Edit3, UploadCloud, Users } from "lucide-react";

export default function HoroscopePage() {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="font-headline text-4xl font-semibold text-gray-800 flex items-center justify-center gap-3">
          <Sparkles className="h-10 w-10 text-primary" />
          Horoscope Insights & Tools
        </h1>
        <p className="mt-2 text-lg text-muted-foreground max-w-2xl mx-auto">
          Manage your astrological information and explore compatibility features (coming soon!).
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 max-w-4xl mx-auto">
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline text-2xl">
              <Edit3 className="h-6 w-6 text-primary" />
              Your Horoscope Details
            </CardTitle>
            <CardDescription>View or update your Rasi, Nakshatra, and other astrological details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
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
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline text-2xl">
              <UploadCloud className="h-6 w-6 text-primary" />
              Horoscope Document
            </CardTitle>
            <CardDescription>Upload or manage your detailed horoscope PDF for matching.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
             <p className="text-sm text-foreground/80">
              A detailed horoscope document can be shared with matches or used for deeper compatibility analysis by our future AI tools.
            </p>
            {/* Placeholder for PDF upload status/link */}
             <div className="p-4 bg-muted/50 rounded-md text-sm">
                <p><strong>Current PDF:</strong> <Link href="#" className="text-primary hover:underline">my_horoscope.pdf</Link> (Example)</p>
            </div>
            <Button asChild className="w-full">
              <Link href="/dashboard/edit-profile#horoscope-pdf">Upload/Change PDF</Link>
            </Button>
          </CardContent>
        </Card>
        
        <Card className="shadow-lg hover:shadow-xl transition-shadow lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline text-2xl">
              <Users className="h-6 w-6 text-primary" />
              Match Compatibility (Coming Soon)
            </CardTitle>
            <CardDescription>Discover how your stars align with potential matches.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground/80">
              Soon, you'll be able to check detailed horoscope compatibility with other profiles. This feature will use advanced astrological calculations and AI insights to guide you.
            </p>
             <div className="mt-4 p-6 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg text-center">
                <Sparkles className="h-12 w-12 text-primary mx-auto mb-3"/>
                <p className="font-semibold text-primary">Stay Tuned for Exciting Updates!</p>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
