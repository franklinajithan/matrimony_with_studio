
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "$0",
    frequency: "/ month",
    description: "Get started and explore basic features.",
    features: [
      "Create Profile",
      "Basic Search Filters",
      "Send Limited Likes",
      "Receive Messages",
    ],
    cta: "Sign Up for Free",
    href: "/signup",
    isPopular: false,
  },
  {
    name: "Premium",
    price: "$9.99",
    frequency: "/ month",
    description: "Unlock advanced features for serious matchmaking.",
    features: [
      "All Free features",
      "Unlimited Likes",
      "Advanced Search Filters",
      "Send & Receive Unlimited Messages",
      "See Who Liked You",
      "Profile Boosts",
      "Verified Badge Priority",
    ],
    cta: "Choose Premium",
    href: "/checkout?plan=premium", // Placeholder
    isPopular: true,
  },
  {
    name: "Elite",
    price: "$19.99",
    frequency: "/ month",
    description: "For those who want the best experience and support.",
    features: [
      "All Premium features",
      "Dedicated Support Agent",
      "Horoscope Matching Assistance",
      "Early Access to New Features",
      "Higher Profile Visibility",
    ],
    cta: "Go Elite",
    href: "/checkout?plan=elite", // Placeholder
    isPopular: false,
  },
];

export default function PricingPage() {
  return (
    <div className="space-y-12">
      <div className="text-center">
        <h1 className="font-headline text-4xl sm:text-5xl font-semibold text-gray-800">
          Find the Perfect Plan for You
        </h1>
        <p className="mt-4 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
          Choose a plan that suits your needs and enhance your journey to find your perfect match on MatchCraft.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            className={`flex flex-col shadow-lg hover:shadow-2xl transition-shadow duration-300 ${
              plan.isPopular ? "border-2 border-primary ring-2 ring-primary/50" : ""
            }`}
          >
            {plan.isPopular && (
              <div className="py-1 px-4 bg-primary text-primary-foreground text-sm font-semibold text-center rounded-t-lg -mt-px">
                Most Popular
              </div>
            )}
            <CardHeader className="text-center pt-8">
              <CardTitle className={`font-headline text-3xl ${plan.isPopular ? 'text-primary' : ''}`}>{plan.name}</CardTitle>
              <div className="flex items-baseline justify-center mt-2">
                <span className="text-4xl font-extrabold tracking-tight text-gray-900">{plan.price}</span>
                <span className="ml-1 text-xl font-semibold text-muted-foreground">{plan.frequency}</span>
              </div>
              <CardDescription className="mt-3">{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <ul role="list" className="space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start">
                    <Check className="flex-shrink-0 h-5 w-5 text-green-500 mr-2 mt-0.5" />
                    <span className="text-sm text-foreground/80">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="mt-6 p-6">
              <Button
                asChild
                className={`w-full text-lg py-3 ${
                  plan.isPopular
                    ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                    : "bg-accent hover:bg-accent/90 text-accent-foreground"
                }`}
              >
                <a href={plan.href}>{plan.cta}</a>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
       <p className="text-center text-sm text-muted-foreground mt-8">
        Payments processed securely by Stripe/Razorpay (Integration required).
      </p>
    </div>
  );
}
