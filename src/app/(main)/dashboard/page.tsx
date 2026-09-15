"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { countPendingRequests } from "@/lib/supabase/matches";
import { countConnections } from "@/lib/supabase/connections";
import { countShortlist } from "@/lib/supabase/shortlist";
import { Heart, Users, Bookmark, MessageCircle, MapPin, Calendar, Mail, Shield, BadgeCheck, Crown, ArrowRight, Languages, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

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

  // Stats - loaded from Supabase
  const [receivedInterests, setReceivedInterests] = useState(0);
  const [activeConnections, setActiveConnections] = useState(0);
  const [shortlisted, setShortlisted] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [profileCompletion, setProfileCompletion] = useState(0);

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
            
            // Set profile completion to 80% for now
            setProfileCompletion(80);
          } catch (error) {
            console.error("Error fetching dashboard stats:", error);
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        router.push("/login");
      } else if (session?.user) {
        setCurrentUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [router, toast]);

  if (loading || !currentUser) {
    return null;
  }

  const displayName = currentUser?.user_metadata?.display_name || 
                      currentUser?.user_metadata?.full_name || 
                      currentUser?.email?.split("@")[0] || "there";
  const firstName = displayName.split(" ")[0];

  return (
    <div className="space-y-6">
      {/* Greeting and Actions */}
      <div>
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

      {/* Activity Summary - 2 column grid on mobile */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="cursor-pointer transition-shadow hover:shadow-md" asChild>
          <Link href="/interests">
            <CardContent className="flex flex-col items-center justify-center p-4 text-center">
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-pink-50">
                <Heart className="h-6 w-6 text-pink-600" />
              </div>
              <p className="text-2xl font-semibold">{receivedInterests}</p>
              <p className="text-xs text-gray-600">Received interests</p>
            </CardContent>
          </Link>
        </Card>

        <Card className="cursor-pointer transition-shadow hover:shadow-md" asChild>
          <Link href="/connections">
            <CardContent className="flex flex-col items-center justify-center p-4 text-center">
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <p className="text-2xl font-semibold">{activeConnections}</p>
              <p className="text-xs text-gray-600">Active connections</p>
            </CardContent>
          </Link>
        </Card>

        <Card className="cursor-pointer transition-shadow hover:shadow-md" asChild>
          <Link href="/discover">
            <CardContent className="flex flex-col items-center justify-center p-4 text-center">
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-purple-50">
                <Bookmark className="h-6 w-6 text-purple-600" />
              </div>
              <p className="text-2xl font-semibold">{shortlisted}</p>
              <p className="text-xs text-gray-600">Shortlisted</p>
            </CardContent>
          </Link>
        </Card>

        <Card className="cursor-pointer transition-shadow hover:shadow-md" asChild>
          <Link href="/messages">
            <CardContent className="flex flex-col items-center justify-center p-4 text-center">
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-green-50">
                <MessageCircle className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-2xl font-semibold">{unreadMessages}</p>
              <p className="text-xs text-gray-600">Unread messages</p>
            </CardContent>
          </Link>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Main Column */}
        <div className="space-y-6 lg:col-span-8">
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
  );
}
