"use client";

import { useEffect, useState } from "react";
import { HeartHandshake, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/supabase/auth";
import { getProfile, updateUserProfile } from "@/lib/supabase/profiles";
import { COUNTRY_OPTIONS, LANGUAGE_OPTIONS } from "@/lib/onboarding/schema";

const ANY = "__empty__";
const GENDERS = ["Woman", "Man", "Non-binary"];
const MARITAL = ["Never married", "Divorced", "Widowed", "Separated"];
const CHILDREN = ["Wants children", "Does not want children", "Open to discussing"];
const RELOCATION = ["Open to relocating", "Would relocate for the right person", "Prefer to stay where I am"];
const FAMILY = ["Close family involvement", "Some family involvement", "Prefer independent decisions"];
const TIMELINE = ["Ready when it feels right", "Within 1–2 years", "Still exploring"];

type Details = { gender: string; maritalStatus: string; country: string; languages: string[]; wantsChildren: string; relocation: string; familyInvolvement: string; marriageTimeline: string };
const EMPTY: Details = { gender: "", maritalStatus: "", country: "", languages: [], wantsChildren: "", relocation: "", familyInvolvement: "", marriageTimeline: "" };
const record = (v: unknown): Record<string, any> => v && typeof v === "object" && !Array.isArray(v) ? v as Record<string, any> : {};

export function MatchDetailsEditor() {
  const { toast } = useToast();
  const [details, setDetails] = useState<Details>(EMPTY);
  const [extra, setExtra] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const user = auth.currentUser; if (!user) return;
    void getProfile(user.uid).then((profile) => {
      if (!profile) return;
      const saved = record(record(profile.extra).matchDetails);
      const relationship = record(profile.relationshipIntentions); const settlement = record(profile.settlement); const family = record(profile.culturalFamily); const draft = record(profile.onboardingDraft);
      setExtra(profile.extra || {});
      setDetails({
        gender: String(saved.gender || record(profile.extra).gender || draft.gender || ""),
        maritalStatus: String(saved.maritalStatus || relationship.maritalStatus || draft.maritalStatus || ""),
        country: String(saved.country || profile.country || ""),
        languages: Array.isArray(saved.languages) ? saved.languages : (profile.languages || (profile.language ? [profile.language] : [])),
        wantsChildren: String(saved.wantsChildren || relationship.wantsChildren || relationship.children || ""),
        relocation: String(saved.relocation || settlement.relocation || settlement.relocationOpenness || ""),
        familyInvolvement: String(saved.familyInvolvement || family.familyInvolvement || ""),
        marriageTimeline: String(saved.marriageTimeline || relationship.marriageTimeline || relationship.timeline || ""),
      });
    });
  }, []);

  const patch = (next: Partial<Details>) => setDetails((v) => ({ ...v, ...next }));
  async function save() {
    const user = auth.currentUser; if (!user) return;
    setSaving(true);
    try {
      await updateUserProfile(user.uid, { extra: { ...extra, matchDetails: details } });
      setExtra((v) => ({ ...v, matchDetails: details }));
      toast({ title: "Match details saved", description: "These details can now improve your preference match score for other members." });
    } catch (error) { toast({ title: "Could not save match details", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" }); }
    finally { setSaving(false); }
  }

  return <Card className="border-violet-100">
    <CardHeader><div className="flex gap-3"><div className="rounded-full bg-violet-50 p-2"><HeartHandshake className="h-5 w-5 text-violet-700" /></div><div><CardTitle className="text-lg">Match details</CardTitle><CardDescription>Complete the same relationship details used in Partner Preferences. More complete information makes preference matching more useful and transparent.</CardDescription></div></div></CardHeader>
    <CardContent className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2"><Choice label="Gender" value={details.gender} values={GENDERS} onChange={(v) => patch({ gender: v })}/><Choice label="Marital status" value={details.maritalStatus} values={MARITAL} onChange={(v) => patch({ maritalStatus: v })}/><Choice label="Country" value={details.country} values={[...COUNTRY_OPTIONS]} onChange={(v) => patch({ country: v })}/><div><Label>Languages</Label><Input className="mt-2" value={details.languages.join(", ")} onChange={(e) => patch({ languages: e.target.value.split(",").map(v => v.trim()).filter(Boolean) })} placeholder={`e.g. ${LANGUAGE_OPTIONS.slice(0,3).map(v => v.label).join(", ")}`} /></div><Choice label="Children plans" value={details.wantsChildren} values={CHILDREN} onChange={(v) => patch({ wantsChildren: v })}/><Choice label="Relocation" value={details.relocation} values={RELOCATION} onChange={(v) => patch({ relocation: v })}/><Choice label="Family involvement" value={details.familyInvolvement} values={FAMILY} onChange={(v) => patch({ familyInvolvement: v })}/><Choice label="Marriage timeline" value={details.marriageTimeline} values={TIMELINE} onChange={(v) => patch({ marriageTimeline: v })}/></div>
      <div className="rounded-xl bg-violet-50 p-3 text-sm text-violet-900">Religion, profession, education, height, smoking and drinking are already taken from your <strong>About</strong> details. Complete both sections for the best preference-match calculation.</div>
      <div className="flex justify-end"><Button type="button" onClick={() => void save()} disabled={saving}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}Save match details</Button></div>
    </CardContent>
  </Card>;
}

function Choice({ label, value, values, onChange }: { label: string; value: string; values: string[]; onChange: (value: string) => void }) {
  return <div><Label>{label}</Label><Select value={value || ANY} onValueChange={(v) => onChange(v === ANY ? "" : v)}><SelectTrigger className="mt-2"><SelectValue placeholder="Select"/></SelectTrigger><SelectContent><SelectItem value={ANY}>Not specified</SelectItem>{values.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select></div>;
}