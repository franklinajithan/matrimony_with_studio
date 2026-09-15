"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { listPendingRequests, listSentRequests, acceptInterest, declineInterest, withdrawInterest } from "@/lib/supabase/matches";
import { createConnection } from "@/lib/supabase/connections";
import { getProfile } from "@/lib/supabase/profiles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Check, X, Heart, Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

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

        const [received, sent] = await Promise.all([
          listPendingRequests(currentUser.uid),
          listSentRequests(currentUser.uid),
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
        setSentInterests(sentWithProfiles);
      } catch (error) {
        console.error("Error fetching interests:", error);
        toast({
          title: "Error",
          description: "Failed to load interests.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchInterests();
  }, [currentUser, toast]);

  const handleAccept = async (interestId: string, senderId: string) => {
    if (!currentUser) return;

    setProcessingAction(prev => ({ ...prev, [interestId]: true }));

    try {
      await acceptInterest(interestId);
      await createConnection(currentUser.uid, senderId, interestId);

      setReceivedInterests(prev => prev.filter(i => i.id !== interestId));

      toast({
        title: "Interest accepted",
        description: "You are now connected!",
      });
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
      setReceivedInterests(prev => prev.filter(i => i.id !== interestId));

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
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="received" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="received">
              Received {receivedInterests.length > 0 && `(${receivedInterests.length})`}
            </TabsTrigger>
            <TabsTrigger value="sent">
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
                  <CardContent className="flex items-center justify-between p-6">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={interest.profile?.photoURL || ""} />
                        <AvatarFallback className="bg-violet-100 text-violet-700">
                          {interest.profile?.displayName.charAt(0).toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {interest.profile?.displayName || "User"}
                          {interest.profile?.ageYears && `, ${interest.profile.ageYears}`}
                        </h3>
                        {interest.profile?.profession && (
                          <p className="text-sm text-gray-600">{interest.profile.profession}</p>
                        )}
                        {interest.profile?.location && (
                          <p className="text-sm text-gray-500">{interest.profile.location}</p>
                        )}
                        <p className="mt-1 text-xs text-gray-400">
                          Received {formatDistanceToNow(interest.createdAt, { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                      >
                        <Link href={`/profile/${interest.senderUid}`}>
                          View Profile
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
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
                        onClick={() => handleAccept(interest.id, interest.senderUid)}
                        disabled={processingAction[interest.id]}
                      >
                        {processingAction[interest.id] ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                      </Button>
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
                  <CardContent className="flex items-center justify-between p-6">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={interest.profile?.photoURL || ""} />
                        <AvatarFallback className="bg-violet-100 text-violet-700">
                          {interest.profile?.displayName.charAt(0).toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {interest.profile?.displayName || "User"}
                          {interest.profile?.ageYears && `, ${interest.profile.ageYears}`}
                        </h3>
                        {interest.profile?.profession && (
                          <p className="text-sm text-gray-600">{interest.profile.profession}</p>
                        )}
                        <div className="mt-1 flex items-center gap-2">
                          <Badge variant={interest.status === "pending" ? "secondary" : "outline"}>
                            {interest.status}
                          </Badge>
                          <p className="text-xs text-gray-400">
                            {formatDistanceToNow(interest.createdAt, { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
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
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
    </div>
  );
}
