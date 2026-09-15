"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { listConnections, removeConnection } from "@/lib/supabase/connections";
import { getProfile } from "@/lib/supabase/profiles";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Users, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ConnectionWithProfile {
  id: string;
  otherUserId: string;
  connectedAt: Date;
  profile?: {
    displayName: string;
    photoURL?: string;
    ageYears?: number;
    profession?: string;
    location?: string;
  };
}

export default function ConnectionsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [connections, setConnections] = useState<ConnectionWithProfile[]>([]);
  const [removingConnection, setRemovingConnection] = useState<string | null>(null);

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

    const fetchConnections = async () => {
      try {
        setLoading(true);

        const connectionsList = await listConnections(currentUser.id);

        const connectionsWithProfiles = await Promise.all(
          connectionsList.map(async (connection) => {
            const otherUserId = connection.memberAId === currentUser.id
              ? connection.memberBId
              : connection.memberAId;

            try {
              const profile = await getProfile(otherUserId);
              const connectedAt =
                connection.connectedAt && typeof connection.connectedAt.toDate === "function"
                  ? connection.connectedAt.toDate()
                  : new Date();
              return {
                id: connection.id,
                otherUserId,
                connectedAt,
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
              const connectedAt =
                connection.connectedAt && typeof connection.connectedAt.toDate === "function"
                  ? connection.connectedAt.toDate()
                  : new Date();
              return {
                id: connection.id,
                otherUserId,
                connectedAt,
              };
            }
          })
        );

        setConnections(connectionsWithProfiles);
      } catch (error) {
        console.error("Error fetching connections:", error);
        toast({
          title: "Error",
          description:
            error instanceof Error ? error.message : "Failed to load connections.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchConnections();
  }, [currentUser, toast]);

  const handleRemoveConnection = async (connectionId: string, otherUserId: string) => {
    if (!currentUser) return;

    setRemovingConnection(connectionId);

    try {
      await removeConnection(currentUser.id, otherUserId);
      setConnections(prev => prev.filter(c => c.id !== connectionId));

      toast({
        title: "Connection removed",
        description: "This connection has been removed.",
      });
    } catch (error) {
      console.error("Error removing connection:", error);
      toast({
        title: "Error",
        description: "Failed to remove connection.",
        variant: "destructive",
      });
    } finally {
      setRemovingConnection(null);
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto max-w-4xl px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Connections
          </h1>
          <p className="mt-2 text-gray-600">
            {connections.length} {connections.length === 1 ? "connection" : "connections"}
          </p>
        </div>

        {connections.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-4 text-gray-600">
                No connections yet
              </p>
              <p className="mt-2 text-sm text-gray-500">
                When you accept an interest, you'll see them here.
              </p>
              <Button className="mt-4" asChild>
                <Link href="/interests">View Interests</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {connections.map((connection) => (
              <Card key={connection.id}>
                <CardContent className="flex items-center justify-between p-6">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={connection.profile?.photoURL || ""} />
                      <AvatarFallback className="bg-violet-100 text-violet-700">
                        {connection.profile?.displayName.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {connection.profile?.displayName || "User"}
                        {connection.profile?.ageYears && `, ${connection.profile.ageYears}`}
                      </h3>
                      {connection.profile?.profession && (
                        <p className="text-sm text-gray-600">{connection.profile.profession}</p>
                      )}
                      {connection.profile?.location && (
                        <p className="text-sm text-gray-500">{connection.profile.location}</p>
                      )}
                      <p className="mt-1 text-xs text-gray-400">
                        Connected {formatDistanceToNow(connection.connectedAt, { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <Link href={`/profile/${connection.otherUserId}`}>
                        View Profile
                      </Link>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={removingConnection === connection.id}
                        >
                          {removingConnection === connection.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4 text-red-600" />
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove Connection</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to remove this connection? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleRemoveConnection(connection.id, connection.otherUserId)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Remove
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
