import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SuggestionForm } from "./components/SuggestionForm";
import { Star } from "lucide-react";

export default function SuggestionsPage() {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="font-headline text-4xl font-semibold text-gray-800 flex items-center justify-center gap-2">
          <Star className="h-10 w-10 text-primary" />
          Intelligent Match Suggestions
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Let our AI help you find compatible matches based on your profile and preferences.
        </p>
      </div>

      <Card className="shadow-lg max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Get Your Suggestions</CardTitle>
          <CardDescription>
            Fill in your details and some information about potential matches you're considering. 
            Our AI will analyze the data and provide compatibility scores and reasoning.
            For a full experience, this data would typically be pre-filled from your profile and system users.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SuggestionForm />
        </CardContent>
      </Card>
    </div>
  );
}
