"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Bookmark, Briefcase, Heart, Loader2, MapPin, RotateCcw, Search, SlidersHorizontal, Sparkles, X } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { getProfile, listProfiles } from "@/lib/supabase/profiles";
import type { Profile } from "@/lib/supabase/types";
import { getShortlistedIds, addToShortlist, removeFromShortlist } from "@/lib/supabase/shortlist";
import { sendInterest, listSentInterestReceiverIds } from "@/lib/supabase/matches";
import { filtersFromPreferences, partnerPreferencesFromProfile, preferenceScore, profileMatchesFilters, type DiscoveryFilters, type PartnerPreferences } from "@/lib/matching/preferences";
import { PageFrame, PageHero } from "@/components/dashboard/PageHero";
import { ShareProfileButton } from "@/components/discovery/ShareProfileButton";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { DIASPORA_COUNTRY_NAMES } from "@/data/diaspora-countries";

type Person = Profile & { isShortlisted?: boolean };
const empty: DiscoveryFilters = { query: "", countries: [], languages: [], religions: [], professions: [], smoking: [], drinking: [] };
const options = { countries: DIASPORA_COUNTRY_NAMES, languages: ["Tamil", "English", "Sinhala"], religions: ["Hinduism", "Christianity", "Islam", "Buddhism", "Sikhism", "Jainism", "Other"] };
const first = (values: string[]) => values[0] || "all";
const list = (value: string) => value === "all" ? [] : [value];
const hasPreferences = (p: PartnerPreferences) => Boolean(p.ageMin || p.ageMax || p.countries.length || p.languages.length || p.religions.length || p.professions.length || p.smoking.length || p.drinking.length || (p.gender && p.gender !== "No preference") || p.maritalStatuses?.length || p.education?.length || p.heightMin || p.heightMax || p.relocation || p.wantsChildren || p.familyInvolvement || p.marriageTimeline);
const PREFERENCES_ROUTE = "/dashboard/preferences";

export function PreferenceDiscovery() {
  const router = useRouter();
  const params = useSearchParams();
  const { toast } = useToast();
  const [people, setPeople] = useState<Person[]>([]);
  const [preferences, setPreferences] = useState<PartnerPreferences | null>(null);
  const [filters, setFilters] = useState<DiscoveryFilters>(empty);
  const [loading, setLoading] = useState(true);
  const [sheet, setSheet] = useState(false);
  const [sent, setSent] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      const next = params.toString() ? `/discover?${params.toString()}` : "/discover";
      router.replace(`/login?next=${encodeURIComponent(next)}`);
      return;
    }
    try {
      const self = await getProfile(user.id);
      if (!self) throw new Error("Complete your profile before finding matches.");
      const saved = partnerPreferencesFromProfile(self);
      const defaults = filtersFromPreferences(saved);
      setPreferences(saved);
      setFilters({ ...defaults, query: params.get("q") || "", ageMin: params.get("ageMin") ? Number(params.get("ageMin")) : defaults.ageMin, ageMax: params.get("ageMax") ? Number(params.get("ageMax")) : defaults.ageMax, countries: params.get("country") ? [params.get("country")!] : defaults.countries, languages: params.get("language") ? [params.get("language")!] : defaults.languages, religions: params.get("religion") ? [params.get("religion")!] : defaults.religions });
      const [profiles, sentIds] = await Promise.all([listProfiles({ limit: 100, excludeId: user.id }), listSentInterestReceiverIds(user.id)]);
      const shortlisted = await getShortlistedIds(user.id, profiles.map((p) => p.id));
      setPeople(profiles.map((p) => ({ ...p, isShortlisted: shortlisted.has(p.id) })));
      setSent(new Set(sentIds));
    } catch (e) {
      toast({ title: "Matches unavailable", description: e instanceof Error ? e.message : "Please try again.", variant: "destructive" });
    } finally { setLoading(false); }
  }, [params, router, toast]);

  useEffect(() => { void load(); }, [load]);
  const hasSaved = Boolean(preferences && hasPreferences(preferences));
  const results = useMemo(() => people.filter((p) => profileMatchesFilters(p, filters)).sort((a, b) => preferences ? preferenceScore(b, preferences).percentage - preferenceScore(a, preferences).percentage : 0), [people, filters, preferences]);
  const reset = () => preferences && setFilters(filtersFromPreferences(preferences));
  const clear = () => setFilters(empty);
  const activeCount = [filters.ageMin, filters.ageMax, filters.countries.length, filters.languages.length, filters.religions.length, filters.professions.length, filters.smoking.length, filters.drinking.length].filter(Boolean).length;

  useEffect(() => {
    if (loading) return;
    const next = new URLSearchParams();
    if (filters.query) next.set("q", filters.query); if (filters.ageMin) next.set("ageMin", String(filters.ageMin)); if (filters.ageMax) next.set("ageMax", String(filters.ageMax)); if (filters.countries[0]) next.set("country", filters.countries[0]); if (filters.languages[0]) next.set("language", filters.languages[0]); if (filters.religions[0]) next.set("religion", filters.religions[0]);
    window.history.replaceState({}, "", next.size ? `/discover?${next}` : "/discover");
  }, [filters, loading]);

  const toggleShortlist = async (person: Person) => {
    const { data: { user } } = await supabase.auth.getUser(); if (!user) return;
    setBusy((v) => ({ ...v, [`s-${person.id}`]: true }));
    try { if (person.isShortlisted) await removeFromShortlist(user.id, person.id); else await addToShortlist(user.id, person.id); setPeople((all) => all.map((p) => p.id === person.id ? { ...p, isShortlisted: !p.isShortlisted } : p)); }
    finally { setBusy((v) => ({ ...v, [`s-${person.id}`]: false })); }
  };
  const interest = async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser(); if (!user || sent.has(id)) return;
    setBusy((v) => ({ ...v, [`i-${id}`]: true }));
    try { await sendInterest({ senderUid: user.id, receiverUid: id }); setSent((v) => new Set(v).add(id)); toast({ title: "Interest sent" }); }
    catch (e) { toast({ title: "Could not send interest", description: e instanceof Error ? e.message : "Try again.", variant: "destructive" }); }
    finally { setBusy((v) => ({ ...v, [`i-${id}`]: false })); }
  };

  const FilterPanel = () => <div className="space-y-5 pb-8">
    <div className="rounded-2xl bg-violet-50 p-4 text-sm text-violet-950"><p className="font-semibold">Your Partner Preferences are the starting point</p><p className="mt-1 text-violet-700">Changes here are temporary. Reset returns to your saved preferences.</p></div>
    <div><Label>Age range</Label><div className="mt-2 grid grid-cols-2 gap-2"><Input type="number" min={18} placeholder="Min" value={filters.ageMin || ""} onChange={(e) => setFilters((f) => ({ ...f, ageMin: e.target.value ? Number(e.target.value) : undefined }))}/><Input type="number" min={18} placeholder="Max" value={filters.ageMax || ""} onChange={(e) => setFilters((f) => ({ ...f, ageMax: e.target.value ? Number(e.target.value) : undefined }))}/></div></div>
    <Choice label="Country" value={first(filters.countries)} values={options.countries} onChange={(v) => setFilters((f) => ({ ...f, countries: list(v) }))}/><Choice label="Language" value={first(filters.languages)} values={options.languages} onChange={(v) => setFilters((f) => ({ ...f, languages: list(v) }))}/><Choice label="Religion" value={first(filters.religions)} values={options.religions} onChange={(v) => setFilters((f) => ({ ...f, religions: list(v) }))}/>
    <div><Label>Profession</Label><Input className="mt-2" placeholder="e.g. Engineer" value={filters.professions[0] || ""} onChange={(e) => setFilters((f) => ({ ...f, professions: e.target.value ? [e.target.value] : [] }))}/></div>
    <Choice label="Smoking" value={first(filters.smoking)} values={["Never", "Occasionally", "Socially"]} onChange={(v) => setFilters((f) => ({ ...f, smoking: list(v) }))}/><Choice label="Drinking" value={first(filters.drinking)} values={["Never", "Occasionally", "Socially"]} onChange={(v) => setFilters((f) => ({ ...f, drinking: list(v) }))}/>
    <div className="grid grid-cols-2 gap-2"><Button variant="outline" onClick={clear}><X className="mr-2 h-4 w-4"/>Clear</Button><Button onClick={() => { reset(); setSheet(false); }}><RotateCcw className="mr-2 h-4 w-4"/>Reset</Button></div>
  </div>;

  if (loading) return <PageFrame><Skeleton className="h-40 rounded-[30px]"/><Skeleton className="h-24"/><div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">{[1,2,3,4,5,6,7,8].map((n) => <Skeleton key={n} className="aspect-[3/5] rounded-2xl"/>)}</div></PageFrame>;

  return <PageFrame>
    <PageHero eyebrow="Recommended for you" title="Find Matches" description="Compare real member details with your Partner Preferences and see why each person may suit what you're looking for."/>
    <Card className="overflow-hidden border-violet-100"><CardContent className="p-4 sm:p-5"><div className="flex flex-col gap-3 lg:flex-row lg:items-center"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/><Input className="pl-10" placeholder="Search name, profession or location" value={filters.query} onChange={(e) => setFilters((f) => ({ ...f, query: e.target.value }))}/></div><div className="flex gap-2"><Sheet open={sheet} onOpenChange={setSheet}><SheetTrigger asChild><Button variant="outline" className="flex-1 lg:flex-none"><SlidersHorizontal className="mr-2 h-4 w-4"/>Filters {activeCount ? `(${activeCount})` : ""}</Button></SheetTrigger><SheetContent className="w-[92vw] overflow-y-auto sm:max-w-md"><SheetHeader><SheetTitle>Match filters</SheetTitle></SheetHeader><div className="mt-5"><FilterPanel/></div></SheetContent></Sheet>{hasSaved && <Button variant="ghost" onClick={reset}><RotateCcw className="mr-2 h-4 w-4"/>My preferences</Button>}</div></div>
      <div className={`mt-4 flex items-center gap-2 rounded-xl px-3 py-2 text-sm ${hasSaved ? "bg-[#fbf8ff] text-violet-800" : "bg-amber-50 text-amber-800"}`}><Sparkles className="h-4 w-4 shrink-0"/><span>{hasSaved ? <><strong>Preference match %</strong> compares each member with your saved Partner Preferences.</> : <><strong>Match % is waiting for your preferences.</strong> Set Partner Preferences to activate personalised scores.</>}</span>{!hasSaved && <Button size="sm" variant="outline" className="ml-auto" onClick={() => router.push(PREFERENCES_ROUTE)}>Set preferences</Button>}</div>
    </CardContent></Card>
    <div className="flex items-center justify-between"><p className="text-sm text-muted-foreground"><strong className="text-foreground">{results.length}</strong> potential matches</p></div>
    {!results.length ? <Card><CardContent className="py-14 text-center"><Heart className="mx-auto h-10 w-10 text-violet-300"/><h2 className="mt-3 text-lg font-semibold">No close matches yet</h2><p className="mt-1 text-sm text-muted-foreground">Broaden a filter if you want to see more people.</p><Button className="mt-4" variant="outline" onClick={clear}>Show all members</Button></CardContent></Card> :
    <div className="grid auto-rows-fr grid-cols-2 gap-3 md:grid-cols-3 lg:gap-5 xl:grid-cols-4">{results.map((person) => {
      const score = preferences ? preferenceScore(person, preferences) : null;
      return <Card key={person.id} className="group flex h-full min-h-0 flex-col overflow-hidden">
        <div className="relative aspect-[3/4] shrink-0 bg-violet-50">{person.photoURL ? <img src={person.photoURL} alt={person.displayName} className="h-full w-full object-cover"/> : <div className="flex h-full items-center justify-center text-4xl font-semibold text-violet-500">{person.displayName?.[0] || "?"}</div>}
          <div className={`absolute left-2 top-2 max-w-[calc(100%-3.5rem)] rounded-full border border-white/70 bg-white/95 px-2.5 py-1 text-[11px] font-bold shadow-sm ${hasSaved && score?.total ? "text-violet-700" : "text-amber-700"}`}>{hasSaved ? (score && score.total > 0 ? `${score.percentage}% match` : "More details needed") : "Set preferences for match %"}</div>
          <Button size="icon" variant="secondary" className="absolute right-2 top-2 h-9 w-9 rounded-full bg-white/90" onClick={() => void toggleShortlist(person)}>{busy[`s-${person.id}`] ? <Loader2 className="h-4 w-4 animate-spin"/> : <Bookmark className={`h-4 w-4 ${person.isShortlisted ? "fill-violet-600 text-violet-600" : ""}`}/>}</Button>
        </div>
        <CardContent className="flex flex-1 flex-col p-3 sm:p-4"><h2 className="truncate font-semibold">{person.displayName}{person.ageYears ? `, ${person.ageYears}` : ""}</h2><div className="mt-1 min-h-[2.75rem] space-y-1 text-xs text-muted-foreground sm:text-sm">{person.profession ? <p className="flex items-center gap-1"><Briefcase className="h-3.5 w-3.5 shrink-0"/><span className="truncate">{person.profession}</span></p> : <div className="h-[1.25rem]"/>}{(person.location || person.country) ? <p className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 shrink-0"/><span className="truncate">{person.location || person.country}</span></p> : <div className="h-[1.25rem]"/>}</div>
          <div className="mt-3 min-h-[5.75rem]">{hasSaved && score && score.total > 0 ? <div className="rounded-xl bg-violet-50 p-2.5"><div className="flex items-center justify-between gap-2"><p className="text-xs font-semibold text-violet-900">{score.percentage}% preference match</p><span className="shrink-0 text-[10px] text-violet-600">{score.matched}/{score.total}</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-violet-100"><div className="h-full rounded-full bg-violet-600" style={{ width: `${score.percentage}%` }}/></div>{score.reasons.length > 0 && <div className="mt-2 flex flex-wrap gap-1">{score.reasons.slice(0,2).map((r) => <Badge key={r} variant="secondary" className="text-[10px]">✓ {r}</Badge>)}</div>}</div> : hasSaved ? <div className="rounded-xl bg-amber-50 p-2.5 text-[11px] text-amber-800">More profile details are needed for a reliable score.</div> : <button type="button" onClick={() => router.push(PREFERENCES_ROUTE)} className="w-full rounded-xl bg-violet-50 p-2.5 text-left text-[11px] font-medium text-violet-800 hover:bg-violet-100">Set Partner Preferences to see your match percentage.</button>}</div>
        </CardContent>
        <CardFooter className="mt-auto grid shrink-0 grid-cols-3 gap-1.5 border-t p-2 sm:gap-2 sm:p-3"><Button size="sm" variant="outline" onClick={() => router.push(`/profile/${person.id}`)}>View</Button><ShareProfileButton profileId={person.id} displayName={person.displayName || "Member"}/><Button size="sm" disabled={sent.has(person.id) || busy[`i-${person.id}`]} onClick={() => void interest(person.id)}>{busy[`i-${person.id}`] ? <Loader2 className="h-4 w-4 animate-spin"/> : sent.has(person.id) ? "Sent" : "Interest"}</Button></CardFooter>
      </Card>;
    })}</div>}
  </PageFrame>;
}

function Choice({ label, value, values, onChange }: { label: string; value: string; values: string[]; onChange: (value: string) => void }) {
  return <div><Label>{label}</Label><Select value={value} onValueChange={onChange}><SelectTrigger className="mt-2"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="all">Any</SelectItem>{values.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select></div>;
}