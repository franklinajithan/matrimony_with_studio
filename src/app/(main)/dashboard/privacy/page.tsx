"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { auth, onAuthStateChanged } from "@/lib/supabase/auth";
import { getProfile, updateUserProfile } from "@/lib/supabase/profiles";
import { draftFromProfile } from "@/lib/onboarding/persist";
import { formatPhotoPrivacy } from "@/lib/onboarding/readiness";
import { useToast } from "@/hooks/use-toast";

const PHOTO_OPTIONS = [
  { id: "members", label: "Visible to members after I publish" },
  { id: "connections", label: "Visible to accepted connections only" },
  { id: "hidden", label: "Keep photos hidden for now" },
] as const;

export default function PrivacyPage() {
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [isPublished, setIsPublished] = useState(false);
  const [photoPrivacy, setPhotoPrivacy] = useState<"members" | "connections" | "hidden">("members");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => setUserId(user?.uid ?? null));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId) return;
    let active = true;
    getProfile(userId)
      .then((profile) => {
        if (!active || !profile) return;
        const draft = draftFromProfile(profile);
        setIsPublished(Boolean(profile.isPublished));
        setPhotoPrivacy(draft.photoPrivacy || "members");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [userId]);

  const save = async () => {
    if (!userId) return;
    setSaving(true);
    try {
      const profile = await getProfile(userId);
      const draft = profile ? draftFromProfile(profile) : undefined;
      await updateUserProfile(userId, {
        photoPrivacy,
        onboardingDraft: draft ? { ...draft, photoPrivacy } : { photoPrivacy },
      });
      toast({ title: "Privacy updated", description: formatPhotoPrivacy(photoPrivacy) });
    } catch (error) {
      toast({
        title: "Could not save",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground" role="status">
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
        Loading privacy settings
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-lg">Profile visibility</CardTitle>
          <CardDescription>
            This reflects whether your profile is in the member discovery list. There is no paused state yet.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            {isPublished
              ? "Published — eligible members can find you in discovery, subject to block and privacy rules."
              : "Draft — only you can see this profile until you publish it."}
          </p>
          {!isPublished ? (
            <Button asChild className="min-h-11">
              <Link href="/onboarding?step=7">Review and publish</Link>
            </Button>
          ) : null}
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-lg">Photo visibility</CardTitle>
          <CardDescription>Choose who can see your photos after you publish.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup
            value={photoPrivacy}
            onValueChange={(value) => setPhotoPrivacy(value as typeof photoPrivacy)}
          >
            {PHOTO_OPTIONS.map((option) => (
              <div key={option.id} className="flex items-center space-x-3 rounded-lg border border-border p-3">
                <RadioGroupItem value={option.id} id={`privacy-${option.id}`} />
                <Label htmlFor={`privacy-${option.id}`} className="font-normal">
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
          <Button onClick={() => void save()} disabled={saving} className="min-h-11">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save photo privacy
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-lg">Safety</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Block and report tools on member profiles control who can contact you. Identity verification is shown only when a member is actually verified.
          </p>
          <Button asChild variant="outline" className="min-h-11">
            <Link href="/safety">Read safety guidance</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
