"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useLoginWelcomeToast } from "@/hooks/use-login-welcome-toast";
import { Loader2, Check, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
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
import { PageFrame, PageHero } from "@/components/dashboard/PageHero";
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
import { planBenefitLabels, type CataloguePlan } from "@/lib/subscriptions/catalogue-data";
import { formatMarketMoney, isCountryCode, type CountryCode } from "@/lib/subscriptions/country-markets";
import { CountryMarketSelector } from "@/components/subscriptions/CountryMarketSelector";
import { useI18n } from "@/components/i18n/I18nProvider";
import { getMessages } from "@/components/i18n/messages";

type SaveState = "idle" | "saving" | "saved" | "error";

const LOOKING_FOR = [
  { id: "marriage", label: "Seeking a spouse for marriage" },
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
const ALIAS_NAMES = {
  male: ["Arun", "Kavin", "Nilan", "Dilan", "Ravi", "Ajan"],
  female: ["Nila", "Maya", "Anu", "Kavi", "Thara", "Isha"],
} as const;

function makeAlias(gender: "male" | "female") {
  const names = ALIAS_NAMES[gender];
  return names[Math.floor(Math.random() * names.length)];
}

const PHOTO_PRIVACY = [
  { id: "members", label: "Visible to members after I publish" },
  { id: "connections", label: "Visible to accepted connections only" },
  { id: "hidden", label: "Keep photos hidden for now" },
];

export function OnboardingWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { language } = useI18n();
  const t = getMessages(language).onboarding;
  const choiceLabels = getOnboardingChoiceLabels(language);
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
  const [pricingCountry, setPricingCountry] = useState<CountryCode>("GB");
  const [marketOverride, setMarketOverride] = useState(false);
  useEffect(() => { const requested = new URLSearchParams(window.location.search).get("country"); if (requested && isCountryCode(requested)) setPricingCountry(requested); }, []);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [catalogue, setCatalogue] = useState<CataloguePlan[]>([]);
  const [plansError, setPlansError] = useState("");
  const [plansLoading, setPlansLoading] = useState(true);
  const [billingTerm, setBillingTerm] = useState<"monthly" | "three_months" | "six_months">("monthly");
  const [navigating, setNavigating] = useState(false);
  const navigationLock = useRef(false);
  const saveTail = useRef<Promise<unknown>>(Promise.resolve());
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
  }, [step, pricingCountry]);
  useEffect(() => {
    draftReadyRef.current = draftReady;
  }, [draftReady]);

  const persist = useCallback((nextDraft: OnboardingDraft, nextStep: number, options?: { silent?: boolean }) => {
    if (saveTimer.current) { clearTimeout(saveTimer.current); saveTimer.current = null; }
    const save = async () => {
      if (!draftReadyRef.current) return { ok: false as const, error: "Still loading your saved profile." };
      if (!options?.silent) { setSaveState("saving"); setSaveError(null); }
      try {
        const response = await fetch("/api/onboarding/save", {
          method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin",
          body: JSON.stringify({ draft: nextDraft, step: nextStep }),
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok || payload.ok !== true) throw new Error(payload.error || "Could not confirm your saved profile.");
        const isCurrent = draftRef.current === nextDraft;
        if (!options?.silent && isCurrent && payload.draft && typeof payload.draft === "object") {
          const synced = { ...EMPTY_ONBOARDING_DRAFT, ...payload.draft };
          draftRef.current = synced; setDraft(synced);
        }
        if (!options?.silent) setSaveState(isCurrent ? "saved" : "idle");
        return { ok: true as const };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Could not save.";
        if (!options?.silent) { setSaveState("error"); setSaveError(message); }
        return { ok: false as const, error: message };
      }
    };
    // Older autosaves must finish before a newer snapshot reaches the server.
    const result = saveTail.current.then(save, save);
    saveTail.current = result;
    return result;
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
      const next = { ...draftRef.current, ...patch };
      draftRef.current = next;
      setDraft(next);
      scheduleSave(next, stepRef.current);
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
        const rawStep = initialStepParam.current;
        const requested = rawStep !== null && /^\d+$/.test(rawStep) ? Number(rawStep) : NaN;
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

  useEffect(() => {
    if (step !== 7) return;
    const controller = new AbortController();
    setPlansLoading(true);
    setPlansError("");
    fetch(`/api/plans?country=${pricingCountry}`, { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || !Array.isArray(data.plans)) throw Error("Live membership prices are unavailable. Please try again.");
        if (!controller.signal.aborted) {
          const active = (data.plans as CataloguePlan[]).filter((plan) => plan.active);
          setCatalogue(active);
          setMarketOverride(Boolean(data.isOverride));
          if (!active.some((plan) => plan.code === selectedPlan)) setSelectedPlan(null);
        }
      })
      .catch((error) => { if (!controller.signal.aborted) setPlansError(error instanceof Error ? error.message : "Could not load plans."); })
      .finally(() => { if (!controller.signal.aborted) setPlansLoading(false); });
    return () => controller.abort();
  }, [step]);

  const progressValue = ((step + 1) / ONBOARDING_STEPS.length) * 100;
  const current = ONBOARDING_STEPS[step];

  async function moveStep(direction: 1 | -1 | "review") {
    if (navigationLock.current || uploading) return;
    const snapshot = draftRef.current;
    const errors = direction === 1 ? validateOnboardingStep(stepRef.current, snapshot) : [];
    setStepErrors(errors);
    if (errors.length) return;
    navigationLock.current = true; setNavigating(true);
    const nextStep = direction === "review" ? 7 : Math.max(0, Math.min(7, stepRef.current + direction));
    try {
      const saved = await persist(snapshot, nextStep);
      if (!saved.ok) { setStepErrors([saved.error]); return; }
      stepRef.current = nextStep; setStep(nextStep);
    } finally { navigationLock.current = false; setNavigating(false); }
  }
  async function goNext() { await moveStep(1); }
  async function goBack() { await moveStep(-1); }

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
    if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
      toast({ title: "Unsupported photo", description: "Choose a JPG, PNG or WebP image smaller than 5 MB.", variant: "destructive" });
      return;
    }
    if (kind === "additional" && (draftRef.current.additionalPhotoUrls || []).length >= 5) {
      toast({ title: "Gallery full", description: "You can add up to five additional photos." });
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
            ...(draftRef.current.additionalPhotoUrls || []),
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

  async function handleAdditionalPhotos(files: FileList | null) {
    if (!files?.length) return;
    const chosen = Array.from(files).slice(0, Math.max(0, 5 - (draftRef.current.additionalPhotoUrls || []).length));
    for (const file of chosen) await handlePhoto(file, "additional");
  }

  async function handlePublish() {
    if (navigationLock.current || uploading) return;
    if (!selectedPlan || plansLoading || plansError) { setStepErrors(["Choose a membership plan after current prices load."]); return; }
    const selected = catalogue.find((plan) => plan.code === selectedPlan && plan.active);
    if (!selected) { setStepErrors(["The selected plan is unavailable."]); return; }
    const snapshot = draftRef.current;
    const errors = validateOnboardingStep(7, snapshot);
    setStepErrors(errors);
    if (errors.length) return;
    navigationLock.current = true; setPublishing(true);
    try {
      const saved = await persist(snapshot, 7);
      if (!saved.ok) throw new Error(saved.error);
      if (selectedPlan !== "free") {
        if (selected.pricesPence[billingTerm] === null) throw Error("This billing period is not offered for the selected plan.");
        // Save draft first; merchant payment has not been initiated and profile stays unpublished.
        router.push(`/checkout?plan=${encodeURIComponent(selectedPlan)}&term=${encodeURIComponent(billingTerm)}&country=${encodeURIComponent(pricingCountry)}`);
        return;
      }
      const response = await fetch("/api/onboarding/publish", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ draft: snapshot, membershipChoice: selectedPlan }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload.ok !== true || payload.isPublished !== true) throw new Error(payload.error || "Could not confirm publication.");
      setIsPublished(true);
      toast({ title: "Profile published", description: "Members can now find you in discovery." });
      router.push("/dashboard"); router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not publish.";
      setStepErrors([message]); toast({ title: "Publish failed", description: message, variant: "destructive" });
    } finally { navigationLock.current = false; setPublishing(false); }
  }

  async function handleExit() {
    if (navigationLock.current || uploading) return;
    navigationLock.current = true; setNavigating(true);
    try {
      const saved = await persist(draftRef.current, stepRef.current);
      if (!saved.ok) { setStepErrors([saved.error]); return; }
      router.push("/dashboard");
    } finally { navigationLock.current = false; setNavigating(false); }
  }

  const saveLabel = useMemo(() => {
    if (saveState === "saving") return t.saving;
    if (saveState === "saved") return t.saved;
    if (saveState === "error") return t.failed;
    return t.draft;
  }, [saveState, t]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!draftReady) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4">
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
    <PageFrame>
      <PageHero
        eyebrow={`${t.step} ${step + 1} ${t.of} ${ONBOARDING_STEPS.length}`}
        title={current.title}
        description={current.description}
        actions={
          <span
            className={cn(
              "inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-sm font-medium",
              saveState === "error"
                ? "bg-destructive/10 text-destructive"
                : "bg-white/80 text-gold-foreground border border-border"
            )}
            aria-live="polite"
          >
            {saveState === "saving" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {saveState === "saved" && <Check className="h-3.5 w-3.5" />}
            {saveState === "error" && <AlertCircle className="h-3.5 w-3.5" />}
            {saveLabel}
          </span>
        }
      >
        <Progress value={progressValue} className="mt-4 h-2.5 bg-accent" />
      </PageHero>

      {isPublished && (
        <Alert>
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
        <Alert variant="destructive">
          <AlertTitle>We could not save your draft</AlertTitle>
          <AlertDescription>{saveError}</AlertDescription>
        </Alert>
      )}

      {stepErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertTitle>{t.review}</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-4">
              {stepErrors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {step > 0 && step < 7 && (
        <div className="space-y-3 rounded-xl border bg-accent p-4">
          <p className="text-sm">{t.optionalDetails}</p>
          <Button type="button" variant="outline" disabled={navigating || publishing || uploading} onClick={() => void moveStep("review")}>
            {t.skipOptional}
          </Button>
        </div>
      )}
      <fieldset disabled={navigating || publishing} className="min-w-0 space-y-6 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-8">
          {step === 0 && (
            <div className="space-y-5">
              <ChoiceGroup
                legend="I am"
                value={draft.gender || ""}
                options={[{ id: "male", label: "Male" }, { id: "female", label: "Female" }]}
                onChange={(value) => {
                  const gender = value as "male" | "female";
                  updateDraft({
                    gender,
                    aliasName: draft.hideName ? makeAlias(gender) : draft.aliasName,
                  });
                }}
              />
              <Field label={t.displayName} htmlFor="displayName">
                <Input id="displayName" value={draft.displayName || ""} onChange={(e) => updateDraft({ displayName: e.target.value })} className="min-h-11" />
              </Field>
              <label className="flex items-start gap-3 rounded-lg border p-4">
                <Checkbox
                  checked={Boolean(draft.hideName)}
                  onCheckedChange={(checked) => {
                    const hideName = checked === true;
                    updateDraft({
                      hideName,
                      aliasName: hideName && draft.gender ? (draft.aliasName || makeAlias(draft.gender)) : draft.aliasName,
                    });
                  }}
                />
                <span className="text-sm leading-6">
                  <strong>Hide my real name</strong><br />
                  <span className="text-muted-foreground">
                    {draft.hideName && draft.aliasName ? `People will see “${draft.aliasName}” with a CupidMatch alias label.` : "CupidMatch will assign a gender-matched alias."}
                  </span>
                </span>
              </label>
              <Field label={t.dob} htmlFor="dob">
                <Input id="dob" type="date" value={draft.dob || ""} onChange={(e) => updateDraft({ dob: e.target.value })} className="min-h-11" />
                <p className="text-sm text-muted-foreground">{t.dobHelp}</p>
              </Field>
              <Field label="Height (required)" htmlFor="height">
                <div className="relative">
                  <Input id="height" type="number" inputMode="numeric" min="90" max="250" step="1" required aria-required="true" value={draft.height || ""} onChange={(e) => updateDraft({ height: e.target.value })} placeholder="e.g. 165" className="min-h-11 pr-14" />
                  <span className="pointer-events-none absolute right-4 top-3 text-sm text-muted-foreground">cm</span>
                </div>
                <p className="text-sm text-muted-foreground">Enter your height in centimetres (90–250 cm). This is required for matrimonial profiles.</p>
              </Field>
              <Field label={t.profession} htmlFor="profession">
                <Input id="profession" value={draft.profession || ""} onChange={(e) => updateDraft({ profession: e.target.value })} className="min-h-11" />
              </Field>

            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <Field label={t.country} htmlFor="country">
                <select
                  id="country"
                  className="flex min-h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={draft.country || ""}
                  onChange={(e) => updateDraft({ country: e.target.value, currentCountry: e.target.value || draft.currentCountry })}
                >
                  <option value="">{t.selectCountry}</option>
                  {COUNTRY_OPTIONS.map((country) => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
              </Field>
              <Field label={t.region} htmlFor="region">
                <Input id="region" value={draft.region || ""} onChange={(e) => updateDraft({ region: e.target.value })} className="min-h-11" placeholder="e.g. Colombo, Toronto, Chennai" />
              </Field>
              <fieldset>
                <legend className="mb-3 text-sm font-medium">{t.languages}</legend>
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
              <Field label={t.maritalStatus} htmlFor="maritalStatus">
                <select id="maritalStatus" value={draft.maritalStatus || ""} onChange={(event) => updateDraft({ maritalStatus: event.target.value })} className="min-h-11 w-full rounded-md border border-input bg-background px-3">
                  <option value="">{t.notAdded}</option>
                  {[["Never married", t.neverMarried], ["Divorced", t.divorced], ["Widowed", t.widowed], ["Separated", t.separated]].map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </Field>
              <ChoiceGroup
                legend={t.looking}
                value={draft.lookingFor || ""}
                options={LOOKING_FOR.map((o) => ({ ...o, label: choiceLabels[o.id] || o.label }))}
                onChange={(lookingFor) => updateDraft({ lookingFor })}
              />
              <ChoiceGroup
                legend={t.timeline}
                value={draft.relationshipTimeline || ""}
                options={TIMELINES.map((o) => ({ ...o, label: choiceLabels[o.id] || o.label }))}
                onChange={(relationshipTimeline) => updateDraft({ relationshipTimeline })}
              />
              <Field label={t.spouseQualities} htmlFor="partnershipStyle">
                <Textarea id="partnershipStyle" rows={4} value={draft.partnershipStyle || ""} onChange={(e) => updateDraft({ partnershipStyle: e.target.value })} />
              </Field>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <Field label={t.introduction} htmlFor="bio">
                <Textarea id="bio" rows={5} value={draft.bio || ""} onChange={(e) => updateDraft({ bio: e.target.value })} placeholder={t.introductionHelp} />
              </Field>
              <Field label={t.education} htmlFor="educationLevel">
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
                <Field label={t.smoking} htmlFor="smokingHabits">
                  <select id="smokingHabits" className="flex min-h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={draft.smokingHabits || ""} onChange={(e) => updateDraft({ smokingHabits: e.target.value })}>
                    <option value="">Select</option>
                    {HABITS.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </Field>
                <Field label={t.drinking} htmlFor="drinkingHabits">
                  <select id="drinkingHabits" className="flex min-h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={draft.drinkingHabits || ""} onChange={(e) => updateDraft({ drinkingHabits: e.target.value })}>
                    <option value="">Select</option>
                    {HABITS.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </Field>
              </div>
              <Field label={t.hobbies} htmlFor="hobbies">
                <Input id="hobbies" value={draft.hobbies || ""} onChange={(e) => updateDraft({ hobbies: e.target.value })} className="min-h-11" />
              </Field>
              <Field label="How important is faith in daily life? (optional)" htmlFor="faithImportance">
                <Input id="faithImportance" value={draft.faithImportance || ""} onChange={(e) => updateDraft({ faithImportance: e.target.value })} className="min-h-11" />
              </Field>
              <Field label={t.familyMarriageRole} htmlFor="familyImportance">
                <Input id="familyImportance" value={draft.familyImportance || ""} onChange={(e) => updateDraft({ familyImportance: e.target.value })} className="min-h-11" />
              </Field>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">
              <p className="text-sm text-muted-foreground">{t.cultureHelp}</p>
              <Field label={t.religion} htmlFor="religion">
                <Input id="religion" value={draft.religion || ""} onChange={(e) => updateDraft({ religion: e.target.value, skippedCultural: false })} className="min-h-11" />
              </Field>
              <Field label={t.culture} htmlFor="culturalBackground">
                <Input id="culturalBackground" value={draft.culturalBackground || ""} onChange={(e) => updateDraft({ culturalBackground: e.target.value })} className="min-h-11" />
              </Field>
              <Field label={t.familyInvolvement} htmlFor="familyInvolvement">
                <Input id="familyInvolvement" value={draft.familyInvolvement || ""} onChange={(e) => updateDraft({ familyInvolvement: e.target.value })} className="min-h-11" />
              </Field>
              <Field label={t.traditions} htmlFor="festivalImportance">
                <Textarea id="festivalImportance" rows={3} value={draft.festivalImportance || ""} onChange={(e) => updateDraft({ festivalImportance: e.target.value })} />
              </Field>
              <Button type="button" variant="outline" className="min-h-11" onClick={() => { updateDraft({ skippedCultural: true }); void goNext(); }}>
                {t.skipCulture}
              </Button>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6">
              <ChoiceGroup
                legend={t.relocation}
                value={draft.relocationOpenness || ""}
                options={RELOCATION.map((o) => ({ ...o, label: choiceLabels[o.id] || o.label }))}
                onChange={(relocationOpenness) => updateDraft({ relocationOpenness })}
              />
              <Field label={t.futureCountries} htmlFor="preferredSettlement">
                <Input
                  id="preferredSettlement"
                  className="min-h-11"
                  value={(draft.preferredSettlement || []).join(", ")}
                  onChange={(e) => updateDraft({ preferredSettlement: e.target.value.split(",").map((item) => item.trim()).filter(Boolean) })}
                  placeholder="Sri Lanka, Canada, UK"
                />
              </Field>
              <Field label={t.longDistance} htmlFor="longDistanceOk">
                <Input id="longDistanceOk" className="min-h-11" value={draft.longDistanceOk || ""} onChange={(e) => updateDraft({ longDistanceOk: e.target.value })} />
              </Field>
              <Field label={t.familyResponsibilities} htmlFor="familyResponsibilities">
                <Textarea id="familyResponsibilities" rows={3} value={draft.familyResponsibilities || ""} onChange={(e) => updateDraft({ familyResponsibilities: e.target.value })} />
              </Field>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-5">
              <Field label={t.profilePhoto} htmlFor="photo">
                <ProfilePhotoEditor
                  currentUrl={draft.photoURL ? resolveMediaUrl(draft.photoURL) : null}
                  displayName={draft.displayName}
                  disabled={uploading}
                  onCropped={(file) => void handlePhoto(file, "primary")}
                />
              </Field>
              <Field label={t.additionalPhotos} htmlFor="gallery">
                <Input id="gallery" type="file" multiple accept="image/jpeg,image/png,image/webp" disabled={uploading || (draft.additionalPhotoUrls || []).length >= 5} onChange={(e) => { void handleAdditionalPhotos(e.target.files); e.target.value = ""; }} className="min-h-11" />
                <p className="text-sm text-muted-foreground">Add up to five photos, JPG/PNG/WebP, 5 MB each. Photos are optional.</p>
                {(draft.additionalPhotoUrls || []).length > 0 && <div className="grid grid-cols-2 gap-3 sm:grid-cols-3" aria-label="Additional photo gallery">
                  {(draft.additionalPhotoUrls || []).map((photo) => <div key={photo.id} className="space-y-2 rounded-lg border p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={resolveMediaUrl(photo.url)} alt="Additional profile photo" className="aspect-square w-full rounded-md object-cover" />
                    <Button type="button" variant="outline" size="sm" className="w-full" disabled={uploading} onClick={() => updateDraft({ additionalPhotoUrls: (draftRef.current.additionalPhotoUrls || []).filter((item) => item.id !== photo.id) })}>Remove</Button>
                  </div>)}
                </div>}
              </Field>
              <label className="flex items-start gap-3 rounded-lg border p-4">
                <Checkbox
                  checked={Boolean(draft.profilePhotoGrayscale)}
                  onCheckedChange={(checked) => updateDraft({ profilePhotoGrayscale: checked === true })}
                />
                <span className="text-sm leading-6"><strong>Show my profile photo in black & white</strong><br /><span className="text-muted-foreground">Your original colour photo is kept unchanged.</span></span>
              </label>
              <ChoiceGroup
                legend={t.photoPrivacy}
                value={draft.photoPrivacy || "members"}
                options={PHOTO_PRIVACY.map((o) => ({ ...o, label: choiceLabels[o.id] || o.label }))}
                onChange={(photoPrivacy) => updateDraft({ photoPrivacy: photoPrivacy as OnboardingDraft["photoPrivacy"] })}
              />
              {uploading && <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> {t.uploading}</p>}
            </div>
          )}

          {step === 7 && (
            <div className="space-y-5">
              <ReviewRow label={t.name} value={draft.displayName} emptyLabel={t.notAdded} />
              <ReviewRow label="Height" value={draft.height ? `${draft.height} cm` : ""} emptyLabel="Required" />
              <ReviewRow label={t.location} value={[draft.region, draft.country].filter(Boolean).join(", ")} emptyLabel={t.notAdded} />
              <ReviewRow label={t.languages} value={(draft.languages || []).join(", ")} emptyLabel={t.notAdded} />
              <ReviewRow label={t.looking} value={draft.lookingFor === "marriage" ? choiceLabels.marriage : ""} emptyLabel={t.notAdded} />
              <ReviewRow label={t.introduction} value={draft.bio} emptyLabel={t.notAdded} />
              <p className="text-sm text-muted-foreground">{t.reviewDob}</p>
              <section className="overflow-hidden rounded-2xl border border-primary/20 bg-background shadow-sm" aria-label="Choose your membership">
                <div className="space-y-3 bg-gradient-to-br from-[#2D1538] via-[#482153] to-[#683974] p-5 text-white sm:p-7">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#E9CF93]">Your CupidMatch journey</p>
                  <h3 className="text-2xl font-bold leading-tight sm:text-3xl">Choose the right plan for your marriage journey</h3>
                  <p className="text-sm leading-6 text-white/85">Three clear choices. Compare benefits and choose what works for you before your profile goes live.</p>
                  <div className="flex flex-wrap gap-2 text-xs text-[#F4E9D4]">
                    <span className="rounded-full border border-white/30 px-3 py-1">✓ Free plan available</span>
                    <span className="rounded-full border border-white/30 px-3 py-1">✓ Secure payment for upgrades</span>
                  </div>
                </div>
                <div className="space-y-5 p-3 sm:p-6">
                  <CountryMarketSelector country={pricingCountry} onChange={setPricingCountry}/>
                  <p className="text-xs text-muted-foreground">{marketOverride?"Approved local prices are displayed for the selected market.":"This country has no local price override; UK GBP prices apply."}</p>
                  {plansLoading ? <p role="status" className="p-4">Loading current membership prices…</p> : plansError ? <p role="alert" className="p-4 text-destructive">{plansError}</p> : catalogue.length !== 3 ? <p role="alert" className="p-4">The complete three-plan catalogue is unavailable. Please contact support before selecting a plan.</p> : (
                    <RadioGroup value={selectedPlan || ""} onValueChange={(value) => { setSelectedPlan(value); setBillingTerm("monthly"); setStepErrors([]); }} className="grid gap-3 md:grid-cols-3" aria-label="Membership plans">
                      {catalogue.map((plan) => {
                        const chosen = selectedPlan === plan.code;
                        return <label key={plan.code} className={cn("relative flex cursor-pointer flex-col rounded-2xl border-2 bg-card p-4 transition-colors sm:p-5", chosen ? "border-primary bg-accent/30 shadow-md" : "border-border hover:border-primary/60")}>
                          {plan.code === "premium" && <span className="mb-3 self-start rounded-full bg-[#482153] px-3 py-1 text-xs font-semibold text-[#F9EAC8]">Most complete</span>}
                          <span className="mb-3 flex items-center justify-between gap-2"><strong className="text-xl">{plan.name}</strong><RadioGroupItem value={plan.code} id={`plan-${plan.code}`} /></span>
                          <span className="mb-1 text-3xl font-bold text-primary">{formatMarketMoney(plan.pricesPence.monthly,plan.currency)}</span>
                          <span className="mb-4 text-xs text-muted-foreground">{plan.code === "free" ? "No card required" : "per month · billed when purchased"}</span>
                          <span className="mb-3 h-px bg-border" />
                          <span className="space-y-3 text-sm leading-5">{planBenefitLabels(plan.entitlements,5).map((value) => <span key={value} className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span>{value}</span></span>)}</span>
                          <span className={cn("mt-5 rounded-lg px-3 py-2 text-center text-sm font-semibold",chosen ? "bg-primary text-primary-foreground" : "bg-accent text-foreground")}>{chosen ? "Selected" : "Select plan"}</span>
                        </label>;
                      })}
                    </RadioGroup>
                  )}
                  {selectedPlan && selectedPlan !== "free" && catalogue.some((plan) => plan.code === selectedPlan) && (
                    <div className="space-y-3 rounded-xl border bg-accent/30 p-4">
                      <label htmlFor="billing-term" className="block text-sm font-semibold">Choose your membership duration</label>
                      <select id="billing-term" className="min-h-11 w-full rounded-lg border bg-background px-3" value={billingTerm} onChange={(event) => setBillingTerm(event.target.value as "monthly" | "three_months" | "six_months")}>
                        <option value="monthly">1 month</option>
                        {catalogue.find((plan) => plan.code === selectedPlan)?.pricesPence.three_months !== null && <option value="three_months">3 months</option>}
                        {catalogue.find((plan) => plan.code === selectedPlan)?.pricesPence.six_months !== null && <option value="six_months">6 months</option>}
                      </select>
                      <div className="flex items-center justify-between border-t pt-3"><span className="font-medium">Total</span><strong className="text-xl text-primary">{formatMarketMoney(catalogue.find((plan) => plan.code === selectedPlan)!.pricesPence[billingTerm],catalogue.find((plan) => plan.code === selectedPlan)!.currency)}</strong></div>
                      <p className="text-xs text-muted-foreground">Your saved profile remains a draft until a supported checkout is completed and payment verified. No card information is collected on CupidMatch.</p>
                    </div>
                  )}
                  <div className="space-y-2 border-t pt-4">
                    <p className="text-sm font-semibold">Compare membership benefits</p>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[430px] text-left text-xs sm:text-sm"><thead><tr className="border-b"><th scope="col" className="py-2">Feature</th>{catalogue.map((plan) => <th key={plan.code} scope="col" className="px-2 py-2 text-center">{plan.name}</th>)}</tr></thead><tbody>{[
                        ["Basic matching","basicMatching"],
                        ["Advanced search","advancedFilters"],
                        ["Full compatibility","fullCompatibility"],
                        ["See who likes you","seeWhoLikesYou"],
                        ["See profile visitors","seeProfileVisitors"],
                        ["Priority support","prioritySupport"],
                      ].map(([label,key])=><tr key={key} className="border-b last:border-0"><th scope="row" className="py-2 font-normal">{label}</th>{catalogue.map((plan)=><td key={plan.code} className="px-2 py-2 text-center">{plan.entitlements[key] === true ? "✓" : "—"}</td>)}</tr>)}</tbody></table>
                    </div>
                    <Link href="/launch-pricing" target="_blank" rel="noopener noreferrer" className="inline-block text-sm font-semibold text-primary underline">See full plan details</Link>
                  </div>
                </div>
              </section>
              <label className="flex items-start gap-3 rounded-lg border p-4">
                <Checkbox
                  checked={Boolean(draft.reviewConfirmed)}
                  onCheckedChange={(checked) => updateDraft({ reviewConfirmed: checked === true })}
                />
                <span className="text-sm leading-6">
                  {t.publishConfirm}
                </span>
              </label>
            </div>
          )}
      </fieldset>

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="ghost" className="min-h-11" onClick={() => void handleExit()} disabled={navigating || publishing || uploading}>
          {t.saveExit}
        </Button>
        <div className="flex gap-3">
          <Button variant="outline" className="min-h-11 flex-1 sm:flex-none" onClick={() => void goBack()} disabled={step === 0 || publishing || navigating || uploading}>
            <ChevronLeft className="mr-1 h-4 w-4" /> {t.back}
          </Button>
          {step < 7 ? (
            <Button className="min-h-11 flex-1 sm:flex-none" onClick={() => void goNext()} disabled={navigating || publishing || uploading}>
              {t.continue} <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button className="min-h-11 flex-1 sm:flex-none" onClick={() => void handlePublish()} disabled={publishing || navigating || uploading || plansLoading || Boolean(plansError) || catalogue.length !== 3}>
              {publishing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {selectedPlan && selectedPlan !== "free" ? "Continue to secure checkout" : t.publish}
            </Button>
          )}
        </div>
      </div>
    </PageFrame>
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

function ReviewRow({ label, value, emptyLabel = "Not added yet" }: { label: string; value?: string; emptyLabel?: string }) {
  return (
    <div className="border-b py-3 last:border-0">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-foreground">{value || emptyLabel}</p>
    </div>
  );
}

function getOnboardingChoiceLabels(language: string): Record<string,string> {
 const labels: Record<string,Record<string,string>> = {
  en:{marriage:"Seeking a spouse for marriage",ready:"Ready for marriage when I meet the right person","1-2-years":"Within 1–2 years",exploring:"Planning for marriage, timing undecided",open:"Open to relocating",partner:"Willing if my partner needs to stay",stay:"I need to stay where I am",unsure:"Not sure yet",members:"Visible to members after I publish",connections:"Visible to accepted connections only",hidden:"Keep photos hidden for now"},
  ta:{marriage:"திருமணம்",ready:"சரியான நபர் கிடைத்தால் தயார்","1-2-years":"1–2 ஆண்டுகளுக்குள்",exploring:"கவனமாக ஆராய்கிறேன்",open:"இடமாற்றத்திற்கு தயாராக உள்ளேன்",partner:"துணை தங்க வேண்டுமெனில் தயாராக உள்ளேன்",stay:"நான் இருக்கும் இடத்திலேயே இருக்க வேண்டும்",unsure:"இன்னும் உறுதி இல்லை",members:"வெளியிட்ட பின் உறுப்பினர்களுக்கு தெரியும்",connections:"ஏற்றுக்கொண்ட தொடர்புகளுக்கு மட்டும்",hidden:"இப்போது புகைப்படங்களை மறைத்து வைக்கவும்"},
  si:{marriage:"විවාහය",ready:"නිවැරදි පුද්ගලයා හමු වූ විට සූදානම්","1-2-years":"වසර 1–2 ඇතුළත",exploring:"සැලකිල්ලෙන් සොයමින්",open:"ස්ථානය මාරු කිරීමට විවෘතයි",partner:"සහකරුට රැඳී සිටීමට අවශ්‍ය නම් සලකා බලමි",stay:"මට මෙහිම සිටිය යුතුයි",unsure:"තවම තීරණය කර නැහැ",members:"ප්‍රකාශයට පත් කළ පසු සාමාජිකයින්ට පෙනේ",connections:"පිළිගත් සම්බන්ධතා සඳහා පමණයි",hidden:"දැනට ඡායාරූප සඟවා තබන්න"},
  fr:{marriage:"Mariage",ready:"Prêt lorsque la bonne personne se présente","1-2-years":"Dans 1 à 2 ans",exploring:"J'explore avec attention",open:"Ouvert à déménager",partner:"Disposé si mon partenaire doit rester",stay:"Je dois rester où je suis",unsure:"Pas encore sûr",members:"Visible par les membres après publication",connections:"Visible uniquement par les connexions acceptées",hidden:"Masquer mes photos pour le moment"},
  nl:{marriage:"Huwelijk",ready:"Klaar wanneer de juiste persoon er is","1-2-years":"Binnen 1–2 jaar",exploring:"Rustig aan het verkennen",open:"Sta open voor verhuizen",partner:"Bereid als mijn partner moet blijven",stay:"Ik moet blijven waar ik ben",unsure:"Nog niet zeker",members:"Zichtbaar voor leden na publicatie",connections:"Alleen zichtbaar voor geaccepteerde connecties",hidden:"Foto's voorlopig verborgen houden"}
 }; return labels[language] || labels.en;
}
