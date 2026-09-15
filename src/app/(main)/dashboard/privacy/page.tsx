"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { auth, onAuthStateChanged } from "@/lib/supabase/auth";
import { getProfile, setProfilePublished, updateUserProfile } from "@/lib/supabase/profiles";
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
  const [visibilitySaving, setVisibilitySaving] = useState(false);

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

  const toggleVisibility = async (checked: boolean) => {
    if (!userId) return;
    const previous = isPublished;
    setIsPublished(checked);
    setVisibilitySaving(true);
    try {
      await setProfilePublished(userId, checked);
      toast({
        title: checked ? "Profile visible" : "Profile hidden",
        description: checked
          ? "Members can find you in Discover."
          : "You are hidden from Discover.",
      });
    } catch (error) {
      setIsPublished(previous);
      toast({
        title: "Could not update visibility",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setVisibilitySaving(false);
    }
  };

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
        <CardContent className="space-y-4 text-sm">
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-muted/40 px-3 py-3">
            <Checkbox
              id="privacy-profile-visible"
              checked={isPublished}
              disabled={visibilitySaving}
              onCheckedChange={(value) => void toggleVisibility(value === true)}
            />
            <Label htmlFor="privacy-profile-visible" className="flex cursor-pointer items-center gap-2 font-medium">
              {isPublished ? (
                <Eye className="h-4 w-4 text-primary" aria-hidden />
              ) : (
                <EyeOff className="h-4 w-4 text-muted-foreground" aria-hidden />
              )}
              {isPublished ? "Visible in Discover" : "Invisible — hidden from Discover"}
            </Label>
            {visibilitySaving ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : null}
          </div>
          <p className="text-muted-foreground">
            {isPublished
              ? "Eligible members can find you in discovery, subject to block and privacy rules."
              : "Only you can see this profile until you make it visible."}
          </p>
          {!isPublished ? (
            <Button asChild variant="outline" className="min-h-11">
              <Link href="/onboarding?step=7">Review profile details</Link>
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
