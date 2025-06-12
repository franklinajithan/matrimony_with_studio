
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Eye, Users } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// Mock data for now
const mockViewers = [
  { id: "viewer1", name: "Priya Sharma", avatarUrl: "https://placehold.co/80x80.png?text=PS", dataAiHint: "person female", viewedAt: "2 hours ago", profileLink: "/profile/viewer1" },
  { id: "viewer2", name: "Raj Patel", avatarUrl: "https://placehold.co/80x80.png?text=RP", dataAiHint: "person male", viewedAt: "Yesterday", profileLink: "/profile/viewer2" },
  { id: "viewer3", name: "Anjali Singh", avatarUrl: "https://placehold.co/80x80.png?text=AS", dataAiHint: "person female", viewedAt: "3 days ago", profileLink: "/profile/viewer3" },
  { id: "viewer4", name: "Vikram Reddy", avatarUrl: "https://placehold.co/80x80.png?text=VR", dataAiHint: "person male", viewedAt: "Last week", profileLink: "/profile/viewer4" },
];

export default function ProfileViewsPage() {
  // In a real app, you'd fetch this data based on the current user
  const viewers = mockViewers; 

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="font-headline text-4xl font-semibold text-gray-800 flex items-center justify-center gap-3">
          <Eye className="h-10 w-10 text-primary" />
          Who Viewed Your Profile
        </h1>
        <p className="mt-2 text-lg text-muted-foreground max-w-2xl mx-auto">
          See who's been checking you out! Keep your profile engaging to attract more visitors.
        </p>
      </div>

      <Card className="shadow-lg max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" /> Recent Viewers
          </CardTitle>
          <CardDescription>
            {viewers.length > 0 ? `Here are the latest profiles that viewed yours.` : "No one has viewed your profile recently."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {viewers.length > 0 ? (
            <ul className="space-y-3">
              {viewers.map((viewer) => (
                <li key={viewer.id} className="flex items-center justify-between p-3 bg-muted/20 hover:bg-muted/40 rounded-md transition-colors">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 border">
                      <AvatarImage src={viewer.avatarUrl} alt={viewer.name} data-ai-hint={viewer.dataAiHint} />
                      <AvatarFallback>{viewer.name.substring(0, 1).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <Link href={viewer.profileLink} className="font-semibold text-foreground hover:text-primary">
                        {viewer.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">Viewed: {viewer.viewedAt}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={viewer.profileLink}>
                      <Eye className="mr-1.5 h-3.5 w-3.5" /> View Profile
                    </Link>
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-10">
              <Users className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground font-medium">No profile views yet.</p>
              <p className="text-sm text-muted-foreground mt-1">
                Profiles that are more complete and active tend to get more views.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
       <p className="text-xs text-center text-muted-foreground mt-6">
        Note: In many platforms, knowing exactly who viewed you can be a premium feature.
      </p>
    </div>
  );
}

