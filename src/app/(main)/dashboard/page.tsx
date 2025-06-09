
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { UserCircle, Settings, Star, Search, MessageCircle, CreditCard, Sparkles } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div className="text-center md:text-left">
        <h1 className="font-headline text-4xl lg:text-5xl font-bold text-primary">Your MatchCraft Hub</h1>
        <p className="mt-2 text-lg text-muted-foreground">Everything you need to navigate your journey to a perfect match.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline text-2xl">
              <UserCircle className="h-7 w-7 text-primary" />
              My Profile
            </CardTitle>
            <CardDescription>Keep your story fresh and accurate. Update your details and photos.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
              <Link href="/dashboard/edit-profile">Edit Profile</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline text-2xl">
              <Settings className="h-7 w-7 text-primary" />
              Match Preferences
            </CardTitle>
            <CardDescription>Refine who you're looking for. Adjust age, location, and more.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
              <Link href="/dashboard/preferences">Update Preferences</Link>
            </Button>
          </CardContent>
        </Card>
        
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline text-2xl">
              <Star className="h-7 w-7 text-primary" />
              AI Suggestions
            </CardTitle>
            <CardDescription>Discover handpicked matches powered by our intelligent AI.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
              <Link href="/suggestions">View AI Matches</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline text-2xl">
              <Sparkles className="h-7 w-7 text-primary" />
              Horoscope Insights
            </CardTitle>
            <CardDescription>Explore astrological compatibility and manage your horoscope details.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
              <Link href="/dashboard/horoscope">Horoscope Tools</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline text-2xl">
              <Search className="h-7 w-7 text-primary" />
              Discover Matches
            </CardTitle>
            <CardDescription>Browse profiles and find interesting people based on your criteria.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
              <Link href="/discover">Start Discovering</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline text-2xl">
              <MessageCircle className="h-7 w-7 text-primary" />
              Messages
            </CardTitle>
            <CardDescription>Connect with your matches. Read and reply to your conversations.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
              <Link href="/messages">Open Messages</Link>
            </Button>
          </CardContent>
        </Card>
        
         <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline text-2xl">
               <CreditCard className="h-7 w-7 text-primary"/>
              Subscription
            </CardTitle>
            <CardDescription>View your current plan or explore options to upgrade your experience.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
              <Link href="/pricing">View Plans</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
