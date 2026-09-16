import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SuggestionForm } from "./components/SuggestionForm";
import { Star } from "lucide-react";
import { PageFrame, PageHero } from "@/components/dashboard/PageHero";

export default function SuggestionsPage() {
  return (
    <PageFrame>
      <PageHero
        eyebrow="AI matching"
        title={
          <span className="inline-flex items-center gap-2">
            <Star className="h-7 w-7 text-primary" aria-hidden />
            Intelligent match suggestions
          </span>
        }
        description="Let our AI help you find compatible matches based on your profile and preferences."
      />

      <Card className="rounded-2xl border-[#eadde7] shadow-sm">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Get your suggestions</CardTitle>
          <CardDescription>
            Fill in your details and some information about potential matches you&apos;re considering.
            Our AI will analyze the data and provide compatibility scores and reasoning.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SuggestionForm />
        </CardContent>
      </Card>
    </PageFrame>
  );
}
