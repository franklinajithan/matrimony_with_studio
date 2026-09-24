"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { listPendingRequests, listSentRequests, acceptInterest, declineInterest, withdrawInterest } from "@/lib/supabase/matches";
import { createConnection } from "@/lib/supabase/connections";
import { createChatDocument } from "@/lib/supabase/chats";
import { getProfile } from "@/lib/supabase/profiles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useDashboardChrome } from "@/components/dashboard/chrome-context";
import { Loader2, Check, X, Heart, Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { getCompositeId } from "@/lib/utils";
import { PageFrame, PageHero } from "@/components/dashboard/PageHero";

interface InterestWithProfile {
  id: string;
  senderUid: string;
  receiverUid: string;
  status: string;
  createdAt: Date;
  profile?: {
    displayName: string;
    photoURL?: string;
    ageYears?: number;
    profession?: string;
    location?: string;
  };
}

export default function InterestsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { setInterestsCount, refreshBadges } = useDashboardChrome();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [receivedInterests, setReceivedInterests] = useState<InterestWithProfile[]>([]);
  const [sentInterests, setSentInterests] = useState<InterestWithProfile[]>([]);
  const [processingAction, setProcessingAction] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setCurrentUser(user);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        router.push("/login");
      } else if (session?.user) {
        setCurrentUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  useEffect(() => {
    if (!currentUser) return;

    const fetchInterests = async () => {
      try {
        setLoading(true);

        const userId = currentUser.id;
        const [received, sent] = await Promise.all([
          listPendingRequests(userId),
          listSentRequests(userId),
        ]);

        // Fetch sender profiles for received interests
        const receivedWithProfiles = await Promise.all(
          received.map(async (interest) => {
            try {
              const profile = await getProfile(interest.senderUid);
              return {
                ...interest,
                id: interest.id || "",
                senderUid: interest.senderUid,
                receiverUid: interest.receiverUid,
                status: interest.status,
                createdAt: interest.createdAt && typeof interest.createdAt.toDate === 'function' 
                  ? interest.createdAt.toDate() 
                  : interest.createdAt instanceof Date 
                  ? interest.createdAt 
                  : new Date(),
                profile: profile ? {
                  displayName: profile.displayName || "User",
                  photoURL: profile.photoURL,
                  ageYears: profile.ageYears,
                  profession: profile.profession,
                  location: profile.location,
                } : undefined,
              };
            } catch (error) {
              console.error("Error fetching profile:", error);
              return {
                ...interest,
                id: interest.id || "",
                senderUid: interest.senderUid,
                receiverUid: interest.receiverUid,
                status: interest.status,
                createdAt: interest.createdAt && typeof interest.createdAt.toDate === 'function' 
                  ? interest.createdAt.toDate() 
                  : interest.createdAt instanceof Date 
                  ? interest.createdAt 
                  : new Date(),
              };
            }
          })
        );

        // Fetch receiver profiles for sent interests
        const sentWithProfiles = await Promise.all(
          sent.map(async (interest) => {
            try {
              const profile = await getProfile(interest.receiverUid);
              return {
                ...interest,
                id: interest.id || "",
                senderUid: interest.senderUid,
                receiverUid: interest.receiverUid,
                status: interest.status,
                createdAt: interest.createdAt && typeof interest.createdAt.toDate === 'function' 
                  ? interest.createdAt.toDate() 
                  : interest.createdAt instanceof Date 
                  ? interest.createdAt 
                  : new Date(),
                profile: profile ? {
                  displayName: profile.displayName || "User",
                  photoURL: profile.photoURL,
                  ageYears: profile.ageYears,
                  profession: profile.profession,
                  location: profile.location,
                } : undefined,
              };
            } catch (error) {
              console.error("Error fetching profile:", error);
              return {
                ...interest,
                id: interest.id || "",
                senderUid: interest.senderUid,
                receiverUid: interest.receiverUid,
                status: interest.status,
                createdAt: interest.createdAt && typeof interest.createdAt.toDate === 'function' 
                  ? interest.createdAt.toDate() 
                  : interest.createdAt instanceof Date 
                  ? interest.createdAt 
                  : new Date(),
              };
            }
          })
        );

        setReceivedInterests(receivedWithProfiles);
        setInterestsCount(receivedWithProfiles.length);
        setSentInterests(sentWithProfiles);
      } catch (error) {
        console.error("Error fetching interests:", error);
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to load interests.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchInterests();
  }, [currentUser, toast, setInterestsCount]);

  const handleAccept = async (interestId: string, senderId: string) => {
    if (!currentUser) return;

    setProcessingAction(prev => ({ ...prev, [interestId]: true }));

    try {
      await acceptInterest(interestId);
      try {
        await createConnection(currentUser.id, senderId, interestId);
      } catch (connectionError) {
        console.warn("Interest accepted, but connection row was not created:", connectionError);
      }
      try {
        await createChatDocument(currentUser.id, senderId);
      } catch (chatError) {
        console.warn("Interest accepted, but chat was not created:", chatError);
      }

      setReceivedInterests((prev) => {
        const next = prev.filter((i) => i.id !== interestId);
        setInterestsCount(next.length);
        return next;
      });
      refreshBadges();

      toast({
        title: "Interest accepted",
        description: "You’re connected — you can message each other now.",
      });
      router.push(`/messages/${getCompositeId(currentUser.id, senderId)}`);
    } catch (error) {
      console.error("Error accepting interest:", error);
      toast({
        title: "Error",
        description: "Failed to accept interest.",
        variant: "destructive",
      });
    } finally {
      setProcessingAction(prev => ({ ...prev, [interestId]: false }));
    }
  };

  const handleDecline = async (interestId: string) => {
    setProcessingAction(prev => ({ ...prev, [interestId]: true }));

    try {
      await declineInterest(interestId);
      setReceivedInterests((prev) => {
        const next = prev.filter((i) => i.id !== interestId);
        setInterestsCount(next.length);
        return next;
      });
      refreshBadges();

      toast({
        title: "Interest declined",
        description: "This interest has been declined.",
      });
    } catch (error) {
      console.error("Error declining interest:", error);
      toast({
        title: "Error",
        description: "Failed to decline interest.",
        variant: "destructive",
      });
    } finally {
      setProcessingAction(prev => ({ ...prev, [interestId]: false }));
    }
  };

  const handleWithdraw = async (interestId: string) => {
    setProcessingAction(prev => ({ ...prev, [interestId]: true }));

    try {
      await withdrawInterest(interestId);
      setSentInterests(prev => prev.map(i =>
        i.id === interestId ? { ...i, status: "withdrawn" } : i
      ));

      toast({
        title: "Interest withdrawn",
        description: "Your interest has been withdrawn.",
      });
    } catch (error) {
      console.error("Error withdrawing interest:", error);
      toast({
        title: "Error",
        description: "Failed to withdraw interest.",
        variant: "destructive",
      });
    } finally {
      setProcessingAction(prev => ({ ...prev, [interestId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <PageFrame>
      <PageHero
        eyebrow="Interest inbox"
        title="Interests"
        description="Review who has reached out, and track requests you’ve sent."
      />
      <Tabs defaultValue="received" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 rounded-xl">
            <TabsTrigger value="received" className="rounded-lg">
              Received {receivedInterests.length > 0 && `(${receivedInterests.length})`}
            </TabsTrigger>
            <TabsTrigger value="sent" className="rounded-lg">
              Sent {sentInterests.length > 0 && `(${sentInterests.length})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="received" className="space-y-4">
            {receivedInterests.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Heart className="mx-auto h-12 w-12 text-gray-300" />
                  <p className="mt-4 text-gray-600">
                    No pending interests
                  </p>
                  <p className="mt-2 text-sm text-gray-500">
                    When someone sends you an interest, it will appear here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              receivedInterests.map((interest) => (
                <Card key={interest.id}>
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <Avatar className="h-14 w-14 sm:h-16 sm:w-16 shrink-0">
                          <AvatarImage src={interest.profile?.photoURL || ""} />
                          <AvatarFallback className="bg-violet-100 text-violet-700">
                            {interest.profile?.displayName.charAt(0).toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {interest.profile?.displayName || "User"}
                            {interest.profile?.ageYears && `, ${interest.profile.ageYears}`}
                          </h3>
                          {interest.profile?.profession && (
                            <p className="text-sm text-gray-600 truncate">{interest.profile.profession}</p>
                          )}
                          {interest.profile?.location && (
                            <p className="text-sm text-gray-500 truncate">{interest.profile.location}</p>
                          )}
                          <p className="mt-1 text-xs text-gray-400">
                            Received {formatDistanceToNow(interest.createdAt, { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 sm:shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 sm:flex-none"
                          asChild
                        >
                          <Link href={`/profile/${interest.senderUid}`}>
                            View Profile
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          data-testid={`interest-${interest.senderUid}-decline`}
                          onClick={() => handleDecline(interest.id)}
                          disabled={processingAction[interest.id]}
                        >
                          {processingAction[interest.id] ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <X className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          data-testid={`interest-${interest.senderUid}-accept`}
                          onClick={() => handleAccept(interest.id, interest.senderUid)}
                          disabled={processingAction[interest.id]}
                          className="bg-violet-600 hover:bg-violet-700"
                        >
                          {processingAction[interest.id] ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="sent" className="space-y-4">
            {sentInterests.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Send className="mx-auto h-12 w-12 text-gray-300" />
                  <p className="mt-4 text-gray-600">
                    No sent interests
                  </p>
                  <p className="mt-2 text-sm text-gray-500">
                    Send interests to people you'd like to connect with.
                  </p>
                  <Button className="mt-4" asChild>
                    <Link href="/discover">Browse Profiles</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              sentInterests.map((interest) => (
                <Card key={interest.id}>
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <Avatar className="h-14 w-14 sm:h-16 sm:w-16 shrink-0">
                          <AvatarImage src={interest.profile?.photoURL || ""} />
                          <AvatarFallback className="bg-violet-100 text-violet-700">
                            {interest.profile?.displayName.charAt(0).toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {interest.profile?.displayName || "User"}
                            {interest.profile?.ageYears && `, ${interest.profile.ageYears}`}
                          </h3>
                          {interest.profile?.profession && (
                            <p className="text-sm text-gray-600 truncate">{interest.profile.profession}</p>
                          )}
                          <div className="mt-1 flex items-center gap-2 flex-wrap">
                            <Badge variant={interest.status === "pending" ? "secondary" : "outline"} className="shrink-0">
                              {interest.status}
                            </Badge>
                            <p className="text-xs text-gray-400 truncate">
                              {formatDistanceToNow(interest.createdAt, { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 sm:shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 sm:flex-none"
                          asChild
                        >
                          <Link href={`/profile/${interest.receiverUid}`}>
                            View Profile
                          </Link>
                        </Button>
                        {interest.status === "pending" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex-1 sm:flex-none"
                            data-testid={`interest-${interest.receiverUid}-withdraw`}
                            onClick={() => handleWithdraw(interest.id)}
                            disabled={processingAction[interest.id]}
                          >
                            {processingAction[interest.id] ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : null}
                            Withdraw
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
    </PageFrame>
  );
}
