
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { UserCircle, Settings, Star, Search, MessageCircle, CreditCard } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div className="text-center md:text-left">
        <h1 className="font-headline text-4xl font-semibold text-gray-800">Welcome to Your Dashboard</h1>
        <p className="mt-2 text-lg text-muted-foreground">Manage your profile, preferences, and connections.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline text-2xl">
              <UserCircle className="h-6 w-6 text-primary" />
              My Profile
            </CardTitle>
            <CardDescription>View and edit your personal information.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/dashboard/edit-profile">Edit Profile</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline text-2xl">
              <Settings className="h-6 w-6 text-primary" />
              Match Preferences
            </CardTitle>
            <CardDescription>Set your criteria for potential matches.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/dashboard/preferences">Update Preferences</Link>
            </Button>
          </CardContent>
        </Card>
        
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline text-2xl">
              <Star className="h-6 w-6 text-primary" />
              AI Suggestions
            </CardTitle>
            <CardDescription>Discover AI-powered match suggestions.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/suggestions">View Suggestions</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline text-2xl">
              <Search className="h-6 w-6 text-primary" />
              Discover Matches
            </CardTitle>
            <CardDescription>Explore profiles based on your criteria.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/discover">Start Discovering</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline text-2xl">
              <MessageCircle className="h-6 w-6 text-primary" />
              Messages
            </CardTitle>
            <CardDescription>View and reply to your messages.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/messages">Open Messages</Link>
            </Button>
          </CardContent>
        </Card>
        
         <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline text-2xl">
               <CreditCard className="h-6 w-6 text-primary"/>
              Subscription
            </CardTitle>
            <CardDescription>Manage your subscription plan.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/pricing">View Plans</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
