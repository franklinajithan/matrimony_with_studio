
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Heart, Send } from "lucide-react";

// Re-using the same mock data as the landing page for now
const successStoriesData = [
  {
    imageSrc: "https://placehold.co/600x400.png",
    imageAlt: "Priya & Rohan",
    dataAiHint: "happy couple wedding",
    names: "Priya & Rohan",
    story: "\"CupidKnots connected us across cities! We found instant chemistry and are now happily married. Thank you for making our dream come true!\"",
    href: "/success-stories/priya-rohan" // Placeholder, individual story pages not created yet
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
  },
  {
    imageSrc: "https://placehold.co/600x400.png",
    imageAlt: "Deepa & Karthik",
    dataAiHint: "couple engagement",
    names: "Deepa & Karthik",
    story: "\"The horoscope matching feature was surprisingly insightful! We felt a deeper connection knowing our stars aligned. So grateful for CupidKnots!\"",
    href: "/success-stories/deepa-karthik"
  }
];

export default function SuccessStoriesPage() {
  return (
    <div className="space-y-12 py-8">
      <section className="text-center py-12 bg-gradient-to-br from-rose-50 to-peach-100 rounded-xl shadow-lg">
        <div className="flex justify-center mb-4">
            <Heart className="h-16 w-16 text-primary animate-pulse" />
        </div>
        <h1 className="font-headline text-5xl font-bold text-primary mb-6">
          Inspiring Love Stories from CupidMatch
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Read about couples who found their perfect match through our platform. Your story could be next!
        </p>
        <div className="mt-10">
            <Button size="lg" asChild className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg px-8 py-3 text-base font-semibold rounded-md">
                <Link href="/success-stories/submit">
                    <Send className="mr-2 h-5 w-5" /> Share Your Success Story
                </Link>
            </Button>
        </div>
      </section>

      <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {successStoriesData.map((story) => (
          <Card key={story.names} className="flex flex-col shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out overflow-hidden rounded-lg bg-card">
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
              <CardTitle className="font-headline text-2xl text-card-foreground text-center">{story.names}</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow px-6 pb-5">
              <p className="text-muted-foreground text-sm italic text-center leading-relaxed">"{story.story}"</p>
            </CardContent>
            {/* Individual story pages are not yet implemented, so link is placeholder */}
            {/* <CardFooter className="p-5 border-t">
              <Button variant="link" asChild className="w-full text-primary hover:text-primary/80">
                <Link href={story.href}>Read Their Full Story</Link>
              </Button>
            </CardFooter> */}
          </Card>
        ))}
      </section>
       <p className="text-center text-sm text-muted-foreground mt-8">
        More stories coming soon!
      </p>
    </div>
  );
}

