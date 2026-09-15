"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { countPendingRequests } from "@/lib/supabase/matches";
import { countConnections } from "@/lib/supabase/connections";
import { countShortlist } from "@/lib/supabase/shortlist";
import { Loader2, Heart, Users, Bookmark, MessageCircle, Search, Globe, Languages, MapPin, Calendar, Mail, Shield, BadgeCheck, Crown, ArrowRight, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

export default function DashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Stats - loaded from Supabase
  const [receivedInterests, setReceivedInterests] = useState(0);
  const [activeConnections, setActiveConnections] = useState(0);
  const [shortlisted, setShortlisted] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [loadingStats, setLoadingStats] = useState(true);

  // Authentication check
  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.push("/login");
          return;
        }

        setCurrentUser(user);
        
        // Fetch dashboard stats
        if (user) {
          try {
            const [interests, connections, shortlistCount] = await Promise.all([
              countPendingRequests(user.uid),
              countConnections(user.uid),
              countShortlist(user.uid),
            ]);
            
            setReceivedInterests(interests);
            setActiveConnections(connections);
            setShortlisted(shortlistCount);
            
            // Set profile completion to 80% for now (can be calculated from profile data)
            setProfileCompletion(80);
          } catch (error) {
            console.error("Error fetching dashboard stats:", error);
          } finally {
            setLoadingStats(false);
          }
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        router.push("/login");
      } else if (session?.user) {
        setCurrentUser(session.user);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    );
  }

  const displayName = currentUser?.user_metadata?.display_name || 
                      currentUser?.user_metadata?.full_name || 
                      currentUser?.email?.split("@")[0] || "there";
  const firstName = displayName.split(" ")[0];
  const photoURL = currentUser?.user_metadata?.photo_url || currentUser?.user_metadata?.avatar_url;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 lg:block">
        <DashboardSidebar
          interestsCount={receivedInterests}
          connectionsCount={activeConnections}
          messagesCount={unreadMessages}
          shortlistCount={shortlisted}
        />
      </aside>

      {/* Mobile Menu */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetTrigger asChild className="lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            className="fixed left-4 top-4 z-50 rounded-full bg-white shadow-md lg:hidden"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <DashboardSidebar
            interestsCount={receivedInterests}
            connectionsCount={activeConnections}
            messagesCount={unreadMessages}
            shortlistCount={shortlisted}
          />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b bg-white px-6">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold">Overview</h1>
          </div>
          <div className="flex items-center gap-4">
            {/* Search */}
            <Button variant="ghost" size="icon" className="rounded-full">
              <Search className="h-5 w-5 text-gray-600" />
            </Button>

            {/* Language Selector */}
            <Button variant="ghost" size="sm" className="gap-2">
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">English</span>
            </Button>

            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative rounded-full">
              <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {(receivedInterests + unreadMessages) > 0 && (
                <span className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
                  {receivedInterests + unreadMessages}
                </span>
              )}
            </Button>

            {/* User Avatar */}
            <Avatar className="h-8 w-8 cursor-pointer border-2 border-violet-100">
              <AvatarImage src={photoURL || ""} />
              <AvatarFallback className="bg-violet-100 text-violet-700 text-xs">
                {firstName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1600px] p-4 sm:p-6">
            {/* Greeting and Actions */}
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">
                {getGreeting()}, {firstName}
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Your profile, introductions and conversations in one place.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Button variant="outline" asChild>
                  <Link href="/profile">View my profile</Link>
                </Button>
                <Button asChild>
                  <Link href="/dashboard/edit-profile">Edit profile</Link>
                </Button>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-12">
              {/* Main Column */}
              <div className="space-y-6 lg:col-span-8">
                {/* Activity Summary */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
                  <Card className="cursor-pointer transition-shadow hover:shadow-md">
                    <CardContent className="flex flex-col items-center justify-center p-4 text-center sm:flex-row sm:gap-4 sm:text-left">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-pink-50">
                        <Heart className="h-6 w-6 text-pink-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-semibold">{receivedInterests}</p>
                        <p className="text-xs text-gray-600">Received interests</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="cursor-pointer transition-shadow hover:shadow-md">
                    <CardContent className="flex flex-col items-center justify-center p-4 text-center sm:flex-row sm:gap-4 sm:text-left">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
                        <Users className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-semibold">{activeConnections}</p>
                        <p className="text-xs text-gray-600">Active connections</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="cursor-pointer transition-shadow hover:shadow-md">
                    <CardContent className="flex flex-col items-center justify-center p-4 text-center sm:flex-row sm:gap-4 sm:text-left">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-50">
                        <Bookmark className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-semibold">{shortlisted}</p>
                        <p className="text-xs text-gray-600">Shortlisted</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="cursor-pointer transition-shadow hover:shadow-md">
                    <CardContent className="flex flex-col items-center justify-center p-4 text-center sm:flex-row sm:gap-4 sm:text-left">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-50">
                        <MessageCircle className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-semibold">{unreadMessages}</p>
                        <p className="text-xs text-gray-600">Unread messages</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Profile Completion */}
                {profileCompletion < 100 && (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base sm:text-lg">Make your profile more personal</CardTitle>
                          <CardDescription className="mt-1 text-xs sm:text-sm">
                            {profileCompletion}% complete
                          </CardDescription>
                        </div>
                        <Badge variant="secondary" className="bg-yellow-50 text-yellow-700">
                          Draft
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Progress value={profileCompletion} className="h-2" />
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-900">Optional improvements</p>
                        <div className="space-y-2">
                          <Button
                            variant="ghost"
                            className="h-auto w-full justify-between py-2 text-left"
                            asChild
                          >
                            <Link href="/dashboard/edit-profile">
                              <span className="text-sm">Add another photo</span>
                              <ArrowRight className="h-4 w-4 flex-shrink-0" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            className="h-auto w-full justify-between py-2 text-left"
                            asChild
                          >
                            <Link href="/preferences">
                              <span className="text-sm">Share your future settlement plans</span>
                              <ArrowRight className="h-4 w-4 flex-shrink-0" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                      <Button className="w-full" asChild>
                        <Link href="/dashboard/edit-profile">Continue editing</Link>
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Recommended Introductions */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base sm:text-lg">Explore profiles</CardTitle>
                        <CardDescription className="mt-1 text-xs sm:text-sm">
                          Find compatible matches
                        </CardDescription>
                      </div>
                      <Button variant="link" className="text-xs sm:text-sm" asChild>
                        <Link href="/discover">
                          View all <ArrowRight className="ml-1 h-3 w-3 sm:h-4 sm:w-4" />
                        </Link>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="py-12 text-center">
                      <p className="text-sm text-gray-600">
                        Start discovering profiles that match your preferences
                      </p>
                      <Button className="mt-4" asChild>
                        <Link href="/discover">Browse profiles</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column */}
              <div className="space-y-6 lg:col-span-4">
                {/* Partner Preferences */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Partner preferences</CardTitle>
                      <Button variant="link" size="sm" className="h-auto p-0 text-xs" asChild>
                        <Link href="/preferences">
                          Edit preferences <ArrowRight className="ml-1 h-3 w-3" />
                        </Link>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    <div className="flex items-start gap-3">
                      <Calendar className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">Age range</p>
                        <p className="text-sm text-gray-600">27 – 34</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">Location</p>
                        <p className="text-sm text-gray-600">UK • Canada • Australia</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Languages className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">Languages</p>
                        <p className="text-sm text-gray-600">Tamil • English</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Globe className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">Relocation</p>
                        <p className="text-sm text-gray-600">Open to discuss</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Privacy & Verification */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Privacy & verification</CardTitle>
                      <Button variant="link" size="sm" className="h-auto p-0 text-xs" asChild>
                        <Link href="/privacy">Review settings</Link>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    <div className="flex items-start gap-3">
                      <Shield className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">Profile visibility</p>
                        <p className="text-sm text-gray-600">Eligible members</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Mail className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">Email</p>
                        <p className="text-sm text-green-600">Confirmed</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <BadgeCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-orange-500" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">Identity check</p>
                        <p className="text-sm text-orange-500">Not completed</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Your Next Steps */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Your next steps</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button
                      variant="ghost"
                      className="h-auto w-full justify-between py-2 text-left"
                      asChild
                    >
                      <Link href="/preferences">
                        <span className="text-sm">Complete future plans</span>
                        <ArrowRight className="h-4 w-4 flex-shrink-0" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      className="h-auto w-full justify-between py-2 text-left"
                      asChild
                    >
                      <Link href="/interests">
                        <span className="text-sm">Review received interests</span>
                        <ArrowRight className="h-4 w-4 flex-shrink-0" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      className="h-auto w-full justify-between py-2 text-left"
                      asChild
                    >
                      <Link href="/discover">
                        <span className="text-sm">Start a conversation</span>
                        <ArrowRight className="h-4 w-4 flex-shrink-0" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>

                {/* Membership */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Membership</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3">
                      <Crown className="h-5 w-5 flex-shrink-0 text-amber-500" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900">Free plan</p>
                        <p className="text-sm text-gray-600">Access core features and start connecting</p>
                      </div>
                    </div>
                    <Button className="mt-4 w-full" variant="outline" asChild>
                      <Link href="/pricing">View plans</Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
