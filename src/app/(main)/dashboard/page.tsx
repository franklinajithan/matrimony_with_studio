
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { UserCircle, Settings, Star, Search, MessageCircle, CreditCard, Sparkles, Users, UserPlus, CalendarCheck, Bell, Briefcase, MapPin } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const mockUser = {
  name: "Aisha K.", // Replace with actual user name
  avatarUrl: "https://placehold.co/100x100.png",
  dataAiHint: "woman smiling"
};

const mockFriendRequests = [
  { id: 'fr1', name: 'Ravi Kumar', age: 29, profession: 'Engineer', mutualFriends: 3, avatarUrl: 'https://placehold.co/80x80.png', dataAiHint: 'man professional' },
  { id: 'fr2', name: 'Sunita Sharma', age: 27, profession: 'Designer', mutualFriends: 1, avatarUrl: 'https://placehold.co/80x80.png', dataAiHint: 'woman glasses' },
];

const mockQuickSuggestions = [
  { id: 's1', name: 'Vikram Singh', age: 31, profession: 'Architect', location: 'Mumbai', avatarUrl: 'https://placehold.co/100x100.png', dataAiHint: 'man outdoor' },
  { id: 's2', name: 'Neha Reddy', age: 28, profession: 'Marketing', location: 'Bangalore', avatarUrl: 'https://placehold.co/100x100.png', dataAiHint: 'woman creative' },
  { id: 's3', name: 'Arjun Mehta', age: 33, profession: 'Doctor', location: 'Delhi', avatarUrl: 'https://placehold.co/100x100.png', dataAiHint: 'man indian' },
  { id: 's4', name: 'Priya Desai', age: 29, profession: 'Writer', location: 'Pune', avatarUrl: 'https://placehold.co/100x100.png', dataAiHint: 'woman reading' },
  { id: 's5', name: 'Sameer Khan', age: 30, profession: 'Consultant', location: 'Hyderabad', avatarUrl: 'https://placehold.co/100x100.png', dataAiHint: 'man suit' },
];

const mockTodaysHoroscope = {
  sign: "Leo", // Replace with user's sign
  summary: "A day full of potential surprises awaits you, Leo! Embrace new opportunities in your career. Romance is in the air, so be open to connection. Financial decisions should be made with care.",
  luckyColor: "Gold",
  luckyNumber: 7,
};

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Welcome and Overview Section */}
      <Card className="shadow-xl bg-gradient-to-r from-primary/10 via-background to-secondary/10 border-primary/20">
        <CardHeader className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-primary">
              <AvatarImage src={mockUser.avatarUrl} alt={mockUser.name} data-ai-hint={mockUser.dataAiHint} />
              <AvatarFallback>{mockUser.name.substring(0,1)}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="font-headline text-3xl text-primary">Welcome back, {mockUser.name}!</CardTitle>
              <CardDescription className="text-muted-foreground mt-1">Ready to find your perfect match today?</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
              <Bell className="h-5 w-5" />
              <span className="sr-only">Notifications</span>
            </Button>
            {/* Quick Stats - Mock */}
            <div className="text-right">
                <p className="text-xs text-muted-foreground">Profile Views Today</p>
                <p className="font-semibold text-lg text-primary">12</p>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Area - Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Suggestions Section */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-headline text-2xl text-primary">
                <Star className="h-6 w-6" /> AI Quick Suggestions
              </CardTitle>
              <CardDescription>Our AI has found some profiles you might like.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockQuickSuggestions.map(profile => (
                <div key={profile.id} className="flex items-center justify-between p-3 bg-muted/30 hover:bg-muted/50 rounded-lg transition-colors">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={profile.avatarUrl} alt={profile.name} data-ai-hint={profile.dataAiHint} />
                      <AvatarFallback>{profile.name.substring(0,1)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <Link href={`/profile/${profile.id}`} className="font-semibold text-foreground hover:text-primary hover:underline">{profile.name}, {profile.age}</Link>
                      <p className="text-xs text-muted-foreground flex items-center"><Briefcase className="mr-1 h-3 w-3"/>{profile.profession} <MapPin className="ml-2 mr-1 h-3 w-3"/>{profile.location}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/profile/${profile.id}`}>View Profile</Link>
                  </Button>
                </div>
              ))}
              <Button variant="link" className="w-full text-primary mt-2" asChild>
                <Link href="/suggestions">See All AI Matches</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Core Actions Grid */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-headline text-2xl">
                  <UserCircle className="h-7 w-7 text-primary" /> My Profile
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
                  <Settings className="h-7 w-7 text-primary" /> Match Preferences
                </CardTitle>
                <CardDescription>Refine who you're looking for. Adjust age, location, and more.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Link href="/dashboard/preferences">Update Preferences</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Sidebar Area - Right Column */}
        <div className="lg:col-span-1 space-y-6">
          {/* Today's Horoscope Section */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-headline text-xl text-secondary">
                <Sparkles className="h-5 w-5" /> Today's Horoscope ({mockTodaysHoroscope.sign})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">{mockTodaysHoroscope.summary}</p>
              <div className="text-xs space-y-0.5">
                <p><span className="font-semibold">Lucky Color:</span> {mockTodaysHoroscope.luckyColor}</p>
                <p><span className="font-semibold">Lucky Number:</span> {mockTodaysHoroscope.luckyNumber}</p>
              </div>
               <Button variant="link" size="sm" className="p-0 h-auto mt-2 text-secondary" asChild>
                <Link href="/dashboard/horoscope">More Horoscope Tools</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Friend Requests Section */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-headline text-xl text-primary">
                <UserPlus className="h-5 w-5" /> Match Requests
                <Badge variant="destructive" className="ml-auto">{mockFriendRequests.length}</Badge>
              </CardTitle>
              <CardDescription>People who want to connect with you.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockFriendRequests.length > 0 ? mockFriendRequests.map(req => (
                <div key={req.id} className="flex items-center justify-between p-2.5 bg-muted/20 hover:bg-muted/40 rounded-md transition-colors">
                  <div className="flex items-center gap-2.5">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={req.avatarUrl} alt={req.name} data-ai-hint={req.dataAiHint} />
                      <AvatarFallback>{req.name.substring(0,1)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm text-foreground">{req.name}, {req.age}</p>
                      <p className="text-xs text-muted-foreground">{req.profession}</p>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <Button variant="outline" size="sm" className="h-7 px-2 border-green-500 text-green-600 hover:bg-green-500/10">Accept</Button>
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">Decline</Button>
                  </div>
                </div>
              )) : <p className="text-sm text-muted-foreground text-center py-4">No new match requests.</p>}
            </CardContent>
          </Card>

          {/* Other Navigation Links */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
                 <CardTitle className="flex items-center gap-2 font-headline text-xl text-primary">
                    <CalendarCheck className="h-5 w-5" /> Quick Links
                </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
                 <Button variant="outline" className="w-full justify-start" asChild>
                    <Link href="/discover"><Search className="mr-2 h-4 w-4" />Discover</Link>
                </Button>
                <Button variant="outline" className="w-full justify-start relative" asChild>
                  <Link href="/messages">
                    <MessageCircle className="mr-2 h-4 w-4" />Messages
                    <Badge variant="destructive" className="absolute -top-1 -right-1 px-1.5 text-xs">3</Badge> 
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/dashboard/horoscope"><Sparkles className="mr-2 h-4 w-4" />Horoscope</Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/pricing"><CreditCard className="mr-2 h-4 w-4" />Subscription</Link>
                </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
