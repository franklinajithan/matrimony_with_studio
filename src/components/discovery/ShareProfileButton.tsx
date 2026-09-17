"use client";

import { useState } from "react";
import { Loader2, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export function ShareProfileButton({ profileId, displayName }: { profileId: string; displayName: string }) {
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  const share = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const response = await fetch("/api/profile-share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId }),
      });
      const payload = await response.json() as { url?: string; path?: string; error?: string };
      if (!response.ok) throw new Error(payload.error || "Could not create share link.");
      const url = payload.url?.startsWith("http") ? payload.url : `${window.location.origin}${payload.path || payload.url || ""}`;
      const title = `${displayName} on CupidMatch`;
      const text = `View ${displayName}'s CupidMatch profile. This private link is valid for 2 days.`;

      if (navigator.share) {
        await navigator.share({ title, text, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast({ title: "Private link copied", description: "The link is valid for 2 days." });
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      toast({ title: "Could not share profile", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button size="sm" variant="outline" onClick={() => void share()} disabled={busy} aria-label={`Share ${displayName}'s profile`}>
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4 sm:mr-1.5" />}
      <span className="hidden sm:inline">Share</span>
    </Button>
  );
}