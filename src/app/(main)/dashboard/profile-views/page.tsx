"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Eye, Users } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageFrame, PageHero } from "@/components/dashboard/PageHero";

// Mock data for now
const mockViewers = [
  { id: "viewer1", name: "Priya Sharma", avatarUrl: "https://placehold.co/80x80.png?text=PS", dataAiHint: "person female", viewedAt: "2 hours ago", profileLink: "/profile/viewer1" },
  { id: "viewer2", name: "Raj Patel", avatarUrl: "https://placehold.co/80x80.png?text=RP", dataAiHint: "person male", viewedAt: "Yesterday", profileLink: "/profile/viewer2" },
  { id: "viewer3", name: "Anjali Singh", avatarUrl: "https://placehold.co/80x80.png?text=AS", dataAiHint: "person female", viewedAt: "3 days ago", profileLink: "/profile/viewer3" },
  { id: "viewer4", name: "Vikram Reddy", avatarUrl: "https://placehold.co/80x80.png?text=VR", dataAiHint: "person male", viewedAt: "Last week", profileLink: "/profile/viewer4" },
];

export default function ProfileViewsPage() {
  const viewers = mockViewers;

  return (
    <PageFrame>
      <PageHero
        eyebrow="Profile activity"
        title={
          <span className="inline-flex items-center gap-2">
            <Eye className="h-7 w-7 text-primary" aria-hidden />
            Who viewed your profile
          </span>
        }
        description="See who’s been checking you out. Keep your profile engaging to attract more visitors."
      />

      <Card className="rounded-2xl border-[#eadde7] shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" /> Recent viewers
          </CardTitle>
          <CardDescription>
            {viewers.length > 0
              ? "Here are the latest profiles that viewed yours."
              : "No one has viewed your profile recently."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {viewers.length > 0 ? (
            <ul className="space-y-3">
              {viewers.map((viewer) => (
                <li
                  key={viewer.id}
                  className="flex items-center justify-between rounded-xl bg-[#fff8fb] p-3 transition-colors hover:bg-[#f8eef7]"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 border border-[#eadce5]">
                      <AvatarImage src={viewer.avatarUrl} alt={viewer.name} data-ai-hint={viewer.dataAiHint} />
                      <AvatarFallback>{viewer.name.substring(0, 1).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <Link href={viewer.profileLink} className="font-semibold text-[#351532] hover:text-primary">
                        {viewer.name}
                      </Link>
                      <p className="text-xs text-[#9b668f]">Viewed: {viewer.viewedAt}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="rounded-xl border-[#dcc9d8]" asChild>
                    <Link href={viewer.profileLink}>View</Link>
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-8 text-center text-sm text-[#745d70]">No recent profile views yet.</p>
          )}
        </CardContent>
      </Card>
    </PageFrame>
  );
}
