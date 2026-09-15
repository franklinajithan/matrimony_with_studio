"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useLoginWelcomeToast } from "@/hooks/use-login-welcome-toast";
import { Loader2, Check, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  COUNTRY_OPTIONS,
  EMPTY_ONBOARDING_DRAFT,
  LANGUAGE_OPTIONS,
  ONBOARDING_STEPS,
  validateOnboardingStep,
  type OnboardingDraft,
} from "@/lib/onboarding/schema";
import { auth, onAuthStateChanged } from "@/lib/supabase/auth";
import { mediaPathForUser, resolveMediaUrl, uploadMediaFile } from "@/lib/supabase/storage";
import { ProfilePhotoEditor } from "@/components/profile/ProfilePhotoEditor";

type SaveState = "idle" | "saving" | "saved" | "error";

const LOOKING_FOR = [
  { id: "marriage", label: "Marriage" },
  { id: "long-term", label: "Long-term partnership" },
  { id: "either", label: "Open to either" },
];

const TIMELINES = [
  { id: "ready", label: "Ready when the right person is" },
  { id: "1-2-years", label: "Within 1–2 years" },
  { id: "exploring", label: "Exploring with care" },
];

const EDUCATION = ["High school", "Diploma", "Bachelor's", "Master's", "Doctorate", "Other"];
const HABITS = ["Never", "Occasionally", "Socially", "Prefer not to say"];
const RELOCATION = [
  { id: "open", label: "Open to relocating" },
  { id: "partner", label: "Willing if my partner needs to stay" },
  { id: "stay", label: "I need to stay where I am" },
  { id: "unsure", label: "Not sure yet" },
];
const PHOTO_PRIVACY = [
  { id: "members", label: "Visible to members after I publish" },
  { id: "connections", label: "Visible to accepted connections only" },
  { id: "hidden", label: "Keep photos hidden for now" },
];

export function OnboardingWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  useLoginWelcomeToast();
  const [draft, setDraft] = useState<OnboardingDraft>(EMPTY_ONBOARDING_DRAFT);
  const [step, setStep] = useState(0);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [stepErrors, setStepErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [draftReady, setDraftReady] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const draftRef = useRef(draft);
  const stepRef = useRef(step);
  const draftReadyRef = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialStepParam = useRef(searchParams.get("step"));

  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);
  useEffect(() => {
    stepRef.current = step;
  }, [step]);
  useEffect(() => {
    draftReadyRef.current = draftReady;
  }, [draftReady]);

  const persist = useCallback(async (nextDraft: OnboardingDraft, nextStep: number, options?: { silent?: boolean }) => {
    if (!draftReadyRef.current) {
      return { ok: false as const, error: "Still loading your saved profile." };
    }
    if (!options?.silent) {
      setSaveState("saving");
      setSaveError(null);
    }
    try {
      const response = await fetch("/api/onboarding/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ draft: nextDraft, step: nextStep }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || "Could not save.");
      }
      if (!options?.silent && payload.draft && typeof payload.draft === "object") {
        const synced = { ...EMPTY_ONBOARDING_DRAFT, ...payload.draft };
        setDraft(synced);
        draftRef.current = synced;
      }
      if (!options?.silent) setSaveState("saved");
      return { ok: true as const };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not save.";
      if (!options?.silent) {
        setSaveState("error");
        setSaveError(message);
      }
      return { ok: false as const, error: message };
    }
  }, []);

  const scheduleSave = useCallback(
    (nextDraft: OnboardingDraft, nextStep: number) => {
      if (!draftReadyRef.current) return;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        void persist(nextDraft, nextStep);
      }, 800);
    },
    [persist]
  );

  const updateDraft = useCallback(
    (patch: Partial<OnboardingDraft>) => {
      setDraft((current) => {
        const next = { ...current, ...patch };
        scheduleSave(next, stepRef.current);
        return next;
      });
    },
    [scheduleSave]
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserId(user?.uid ?? null);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const response = await fetch("/api/onboarding/draft", { credentials: "same-origin" });
        if (response.status === 401) {
          router.replace("/login?next=/onboarding");
          return;
        }
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(payload.error || "Could not load your saved onboarding data.");
        }
        if (!active) return;
        if (payload.draft && typeof payload.draft === "object") {
          const loaded = { ...EMPTY_ONBOARDING_DRAFT, ...payload.draft };
          if (!loaded.displayName && payload.displayName) {
            loaded.displayName = String(payload.displayName);
          }
          setDraft(loaded);
          draftRef.current = loaded;
        }
        const requested = Number(initialStepParam.current);
        if (Number.isInteger(requested) && requested >= 0 && requested <= 7) {
          setStep(requested);
          stepRef.current = requested;
        } else if (typeof payload.step === "number") {
          const nextStep = Math.min(7, Math.max(0, payload.step === 8 ? 7 : payload.step));
          setStep(nextStep);
          stepRef.current = nextStep;
        }
        setIsPublished(Boolean(payload.isPublished));
        setDraftReady(true);
        draftReadyRef.current = true;
      } catch (error) {
        if (active) {
          setDraftReady(false);
          draftReadyRef.current = false;
          setSaveState("error");
          setSaveError(error instanceof Error ? error.message : "Could not load your draft.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
        saveTimer.current = null;
        if (draftReadyRef.current) {
          void persist(draftRef.current, stepRef.current, { silent: true });
        }
      }
    };
  }, [router, persist]);

  const progressValue = ((step + 1) / ONBOARDING_STEPS.length) * 100;
  const current = ONBOARDING_STEPS[step];

  async function goNext() {
    const errors = validateOnboardingStep(step, draft);
    setStepErrors(errors);
    if (errors.length > 0) return;
    const nextStep = Math.min(7, step + 1);
    setStep(nextStep);
    await persist(draft, nextStep);
  }

  async function goBack() {
    const nextStep = Math.max(0, step - 1);
    setStepErrors([]);
    setStep(nextStep);
    await persist(draft, nextStep);
  }

  async function handlePhoto(file: File | undefined, kind: "primary" | "additional") {
    if (!file) return;
    if (!userId) {
      toast({
        title: "Still signing in",
        description: "Wait a moment for your session to load, then try the photo again.",
        variant: "destructive",
      });
      return;
    }
    if (!draftReady) {
      toast({
        title: "Profile still loading",
        description: "Your saved draft has not loaded yet. Refresh and try again.",
        variant: "destructive",
      });
      return;
    }
    setUploading(true);
    try {
      const path = mediaPathForUser(userId, file.name, kind === "primary" ? "profile" : "gallery");
      const uploaded = await uploadMediaFile(file, path);
      if (kind === "primary") {
        updateDraft({ photoURL: uploaded.path, photoStoragePath: uploaded.path });
      } else {
        updateDraft({
          additionalPhotoUrls: [
            ...(draft.additionalPhotoUrls || []),
            {
              id: uploaded.path,
              url: uploaded.path,
              hint: "profile photo",
              storagePath: uploaded.path,
            },
          ],
        });
      }
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Could not upload that photo.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  }

  async function handlePublish() {
    const errors = validateOnboardingStep(7, draft);
    setStepErrors(errors);
    if (errors.length > 0) return;
    setPublishing(true);
    const saved = await persist(draft, 7);
    if (!saved.ok) {
      setPublishing(false);
      toast({
        title: "Publish failed",
        description: saved.error,
        variant: "destructive",
      });
      return;
    }
    try {
      const response = await fetch("/api/onboarding/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draft }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || "Could not publish.");
      }
      setIsPublished(true);
      toast({ title: "Profile published", description: "Members can now find you in discovery." });
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not publish.";
      setStepErrors([message]);
      toast({ title: "Publish failed", description: message, variant: "destructive" });
    } finally {
      setPublishing(false);
    }
  }

  async function handleExit() {
    await persist(draft, step);
    router.push("/dashboard");
  }

  const saveLabel = useMemo(() => {
    if (saveState === "saving") return "Saving…";
    if (saveState === "saved") return "Saved";
    if (saveState === "error") return "Save failed";
    return "Draft";
  }, [saveState]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!draftReady) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4">
        <Alert variant="destructive" className="max-w-lg">
          <AlertTitle>Could not load your saved profile</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>{saveError || "Your onboarding draft could not be loaded from the database."}</p>
            <p className="text-sm">
              If this keeps happening, run <code className="rounded bg-muted px-1">supabase/fixups/bootstrap-onboarding.sql</code> in the Supabase SQL Editor, then sign out and back in.
            </p>
            <Button className="mt-2" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <Logo size="md" />
          <div className="flex items-center gap-2 text-sm">
            <span
              className={cn(
                "inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 font-medium",
                saveState === "error" ? "bg-destructive/10 text-destructive" : "bg-secondary text-secondary-foreground"
              )}
              aria-live="polite"
            >
              {saveState === "saving" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {saveState === "saved" && <Check className="h-3.5 w-3.5" />}
              {saveState === "error" && <AlertCircle className="h-3.5 w-3.5" />}
              {saveLabel}
            </span>
            <Button variant="ghost" className="min-h-11" onClick={() => window.location.assign("/logout")}>
              Log out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:py-10">
        <p className="text-sm font-medium text-primary">Step {step + 1} of {ONBOARDING_STEPS.length}</p>
        <h1 className="mt-1 font-headline text-3xl text-foreground sm:text-4xl">{current.title}</h1>
        <p className="mt-2 text-muted-foreground">{current.description}</p>
        <Progress value={progressValue} className="mt-4 h-2" />

        {isPublished && (
          <Alert className="mt-6">
            <AlertTitle>Your profile is already published</AlertTitle>
            <AlertDescription>
              You can keep editing this draft. Changes are not shown in discovery until you publish again.{" "}
              <Link href="/dashboard/edit-profile" className="font-medium text-primary underline">
                Open profile editor
              </Link>
            </AlertDescription>
          </Alert>
        )}

        {saveState === "error" && saveError && (
          <Alert variant="destructive" className="mt-6">
            <AlertTitle>We could not save your draft</AlertTitle>
            <AlertDescription>{saveError}</AlertDescription>
          </Alert>
        )}

        {stepErrors.length > 0 && (
          <Alert variant="destructive" className="mt-6">
            <AlertTitle>Please check this step</AlertTitle>
            <AlertDescription>
              <ul className="list-disc pl-4">
                {stepErrors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <section className="mt-8 space-y-6 rounded-2xl border bg-card p-4 shadow-sm sm:p-8">
          {step === 0 && (
            <div className="space-y-5">
              <Field label="Display name" htmlFor="displayName">
                <Input id="displayName" value={draft.displayName || ""} onChange={(e) => updateDraft({ displayName: e.target.value })} className="min-h-11" />
              </Field>
              <Field label="Date of birth (kept private)" htmlFor="dob">
                <Input id="dob" type="date" value={draft.dob || ""} onChange={(e) => updateDraft({ dob: e.target.value })} className="min-h-11" />
                <p className="text-sm text-muted-foreground">We only show a derived age after you publish. Your date of birth is never shown on discovery.</p>
              </Field>
              <Field label="Profession (optional)" htmlFor="profession">
                <Input id="profession" value={draft.profession || ""} onChange={(e) => updateDraft({ profession: e.target.value })} className="min-h-11" />
              </Field>
              <label className="flex items-start gap-3 rounded-lg border p-4">
                <Checkbox
                  checked={Boolean(draft.confirmedAdult)}
                  onCheckedChange={(checked) => updateDraft({ confirmedAdult: checked === true })}
                />
                <span className="text-sm leading-6">I confirm I am 18 or older and eligible to use CupidMatch.</span>
              </label>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <Field label="Country" htmlFor="country">
                <select
                  id="country"
                  className="flex min-h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={draft.country || ""}
                  onChange={(e) => updateDraft({ country: e.target.value, currentCountry: e.target.value || draft.currentCountry })}
                >
                  <option value="">Select country</option>
                  {COUNTRY_OPTIONS.map((country) => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
              </Field>
              <Field label="City or region (not a street address)" htmlFor="region">
                <Input id="region" value={draft.region || ""} onChange={(e) => updateDraft({ region: e.target.value })} className="min-h-11" placeholder="e.g. Colombo, Toronto, Chennai" />
              </Field>
              <fieldset>
                <legend className="mb-3 text-sm font-medium">Languages</legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  {LANGUAGE_OPTIONS.map((language) => {
                    const selected = draft.languages?.includes(language.label);
                    return (
                      <label key={language.id} className="flex min-h-11 items-center gap-3 rounded-lg border px-3">
                        <Checkbox
                          checked={Boolean(selected)}
                          onCheckedChange={(checked) => {
                            const currentLangs = draft.languages || [];
                            updateDraft({
                              languages: checked
                                ? [...currentLangs, language.label]
                                : currentLangs.filter((item) => item !== language.label),
                            });
                          }}
                        />
                        {language.label}
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <ChoiceGroup
                legend="What are you looking for?"
                value={draft.lookingFor || ""}
                options={LOOKING_FOR}
                onChange={(lookingFor) => updateDraft({ lookingFor })}
              />
              <ChoiceGroup
                legend="Timeline"
                value={draft.relationshipTimeline || ""}
                options={TIMELINES}
                onChange={(relationshipTimeline) => updateDraft({ relationshipTimeline })}
              />
              <Field label="How you hope to build a partnership (optional)" htmlFor="partnershipStyle">
                <Textarea id="partnershipStyle" rows={4} value={draft.partnershipStyle || ""} onChange={(e) => updateDraft({ partnershipStyle: e.target.value })} />
              </Field>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <Field label="Introduction" htmlFor="bio">
                <Textarea id="bio" rows={5} value={draft.bio || ""} onChange={(e) => updateDraft({ bio: e.target.value })} placeholder="What matters to you in a relationship and in daily life?" />
              </Field>
              <Field label="Education" htmlFor="educationLevel">
                <select
                  id="educationLevel"
                  className="flex min-h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={draft.educationLevel || ""}
                  onChange={(e) => updateDraft({ educationLevel: e.target.value })}
                >
                  <option value="">Select</option>
                  {EDUCATION.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Smoking" htmlFor="smokingHabits">
                  <select id="smokingHabits" className="flex min-h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={draft.smokingHabits || ""} onChange={(e) => updateDraft({ smokingHabits: e.target.value })}>
                    <option value="">Select</option>
                    {HABITS.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </Field>
                <Field label="Drinking" htmlFor="drinkingHabits">
                  <select id="drinkingHabits" className="flex min-h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={draft.drinkingHabits || ""} onChange={(e) => updateDraft({ drinkingHabits: e.target.value })}>
                    <option value="">Select</option>
                    {HABITS.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </Field>
              </div>
              <Field label="Hobbies and interests" htmlFor="hobbies">
                <Input id="hobbies" value={draft.hobbies || ""} onChange={(e) => updateDraft({ hobbies: e.target.value })} className="min-h-11" />
              </Field>
              <Field label="How important is faith in daily life? (optional)" htmlFor="faithImportance">
                <Input id="faithImportance" value={draft.faithImportance || ""} onChange={(e) => updateDraft({ faithImportance: e.target.value })} className="min-h-11" />
              </Field>
              <Field label="How involved is family in major decisions? (optional)" htmlFor="familyImportance">
                <Input id="familyImportance" value={draft.familyImportance || ""} onChange={(e) => updateDraft({ familyImportance: e.target.value })} className="min-h-11" />
              </Field>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">
              <p className="text-sm text-muted-foreground">This step is optional. Skip it if you would rather discuss culture later.</p>
              <Field label="Religion or worldview (optional)" htmlFor="religion">
                <Input id="religion" value={draft.religion || ""} onChange={(e) => updateDraft({ religion: e.target.value, skippedCultural: false })} className="min-h-11" />
              </Field>
              <Field label="Cultural background (optional)" htmlFor="culturalBackground">
                <Input id="culturalBackground" value={draft.culturalBackground || ""} onChange={(e) => updateDraft({ culturalBackground: e.target.value })} className="min-h-11" />
              </Field>
              <Field label="Family involvement preference (optional)" htmlFor="familyInvolvement">
                <Input id="familyInvolvement" value={draft.familyInvolvement || ""} onChange={(e) => updateDraft({ familyInvolvement: e.target.value })} className="min-h-11" />
              </Field>
              <Field label="Festivals and traditions that matter (optional)" htmlFor="festivalImportance">
                <Textarea id="festivalImportance" rows={3} value={draft.festivalImportance || ""} onChange={(e) => updateDraft({ festivalImportance: e.target.value })} />
              </Field>
              <Button type="button" variant="outline" className="min-h-11" onClick={() => { updateDraft({ skippedCultural: true }); void goNext(); }}>
                Skip cultural preferences
              </Button>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6">
              <ChoiceGroup
                legend="Relocation"
                value={draft.relocationOpenness || ""}
                options={RELOCATION}
                onChange={(relocationOpenness) => updateDraft({ relocationOpenness })}
              />
              <Field label="Preferred future countries (optional)" htmlFor="preferredSettlement">
                <Input
                  id="preferredSettlement"
                  className="min-h-11"
                  value={(draft.preferredSettlement || []).join(", ")}
                  onChange={(e) => updateDraft({ preferredSettlement: e.target.value.split(",").map((item) => item.trim()).filter(Boolean) })}
                  placeholder="Sri Lanka, Canada, UK"
                />
              </Field>
              <Field label="Long-distance comfort (optional)" htmlFor="longDistanceOk">
                <Input id="longDistanceOk" className="min-h-11" value={draft.longDistanceOk || ""} onChange={(e) => updateDraft({ longDistanceOk: e.target.value })} />
              </Field>
              <Field label="Family responsibilities to consider (optional)" htmlFor="familyResponsibilities">
                <Textarea id="familyResponsibilities" rows={3} value={draft.familyResponsibilities || ""} onChange={(e) => updateDraft({ familyResponsibilities: e.target.value })} />
              </Field>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-5">
              <Field label="Profile photo (optional until you are ready)" htmlFor="photo">
                <ProfilePhotoEditor
                  currentUrl={draft.photoURL ? resolveMediaUrl(draft.photoURL) : null}
                  displayName={draft.displayName}
                  disabled={uploading}
                  onCropped={(file) => void handlePhoto(file, "primary")}
                />
              </Field>
              <Field label="Additional photos (optional)" htmlFor="gallery">
                <Input id="gallery" type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading} onChange={(e) => void handlePhoto(e.target.files?.[0], "additional")} className="min-h-11" />
              </Field>
              <ChoiceGroup
                legend="Photo privacy"
                value={draft.photoPrivacy || "members"}
                options={PHOTO_PRIVACY}
                onChange={(photoPrivacy) => updateDraft({ photoPrivacy: photoPrivacy as OnboardingDraft["photoPrivacy"] })}
              />
              {uploading && <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Uploading…</p>}
            </div>
          )}

          {step === 7 && (
            <div className="space-y-5">
              <ReviewRow label="Name" value={draft.displayName} />
              <ReviewRow label="Location" value={[draft.region, draft.country].filter(Boolean).join(", ")} />
              <ReviewRow label="Languages" value={(draft.languages || []).join(", ")} />
              <ReviewRow label="Looking for" value={LOOKING_FOR.find((item) => item.id === draft.lookingFor)?.label || draft.lookingFor} />
              <ReviewRow label="Introduction" value={draft.bio} />
              <p className="text-sm text-muted-foreground">Date of birth stays private. We will only show a derived age after you publish.</p>
              <label className="flex items-start gap-3 rounded-lg border p-4">
                <Checkbox
                  checked={Boolean(draft.reviewConfirmed)}
                  onCheckedChange={(checked) => updateDraft({ reviewConfirmed: checked === true })}
                />
                <span className="text-sm leading-6">
                  I confirm these details are accurate and I want to publish my profile for other members to see. My profile will not be published until I confirm.
                </span>
              </label>
            </div>
          )}
        </section>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button variant="ghost" className="min-h-11" onClick={() => void handleExit()}>
            Save and exit
          </Button>
          <div className="flex gap-3">
            <Button variant="outline" className="min-h-11 flex-1 sm:flex-none" onClick={() => void goBack()} disabled={step === 0 || publishing}>
              <ChevronLeft className="mr-1 h-4 w-4" /> Back
            </Button>
            {step < 7 ? (
              <Button className="min-h-11 flex-1 sm:flex-none" onClick={() => void goNext()}>
                Continue <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button className="min-h-11 flex-1 sm:flex-none" onClick={() => void handlePublish()} disabled={publishing}>
                {publishing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Publish profile
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

function ChoiceGroup({
  legend,
  value,
  options,
  onChange,
}: {
  legend: string;
  value: string;
  options: { id: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-3 text-sm font-medium">{legend}</legend>
      <RadioGroup value={value} onValueChange={onChange} className="gap-3">
        {options.map((option) => (
          <label key={option.id} className="flex min-h-11 items-center gap-3 rounded-lg border px-3">
            <RadioGroupItem value={option.id} id={option.id} />
            <span>{option.label}</span>
          </label>
        ))}
      </RadioGroup>
    </fieldset>
  );
}

function ReviewRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="border-b py-3 last:border-0">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-foreground">{value || "Not added yet"}</p>
    </div>
  );
}
