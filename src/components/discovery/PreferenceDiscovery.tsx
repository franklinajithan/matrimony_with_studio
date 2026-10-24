"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Bookmark, Briefcase, Heart, Loader2, MapPin, RotateCcw, Search, SlidersHorizontal, Sparkles, X, LayoutGrid, List, BadgeCheck } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { WORLD_COUNTRY_NAMES } from "@/data/world-countries";
import { useI18n } from "@/components/i18n/I18nProvider";
import { getMessages } from "@/components/i18n/messages";

type Person = Profile & { isShortlisted?: boolean };
const empty: DiscoveryFilters = { query: "", countries: [], languages: [], religions: [], professions: [], smoking: [], drinking: [] };
const options = {
  countries: WORLD_COUNTRY_NAMES,
  languages: ["Tamil", "English", "Sinhala"],
  religions: ["Hinduism", "Christianity", "Islam", "Buddhism", "Sikhism", "Jainism", "Other"],
  genders: ["Woman", "Man", "Non-binary", "No preference"],
  maritalStatuses: ["Never married", "Divorced", "Widowed", "Separated", "No preference"],
  education: ["High school", "Diploma", "Bachelor's", "Master's", "Doctorate"],
  future: {
    children: ["Doesn't matter", "Wants children", "Does not want children", "Open to discussing"],
    relocation: ["Doesn't matter", "Open to relocating", "Would relocate for the right person", "Prefer someone settled where I am"],
    family: ["Doesn't matter", "Close family involvement", "Some family involvement", "Prefer independent decisions"],
    timeline: ["Doesn't matter", "Ready when it feels right", "Within 1–2 years", "Still exploring"],
  },
};
const first = (values: string[]) => values[0] || "all";
const list = (value: string) => value === "all" ? [] : [value];
const hasPreferences = (p: PartnerPreferences) => Boolean(p.ageMin || p.ageMax || p.countries.length || p.languages.length || p.religions.length || p.professions.length || p.smoking.length || p.drinking.length || (p.gender && p.gender !== "No preference") || p.maritalStatuses?.length || p.education?.length || p.heightMin || p.heightMax || p.relocation || p.wantsChildren || p.familyInvolvement || p.marriageTimeline);
const PREFERENCES_ROUTE = "/dashboard/preferences";

export function PreferenceDiscovery() {
  const router = useRouter();
  const params = useSearchParams();
  const { toast } = useToast();
  const { language } = useI18n();
  const t = getMessages(language).discover;
  const [people, setPeople] = useState<Person[]>([]);
  const [memberReferences, setMemberReferences] = useState<Record<string,string>>({});
  const [preferences, setPreferences] = useState<PartnerPreferences | null>(null);
  const [filters, setFilters] = useState<DiscoveryFilters>(empty);
  const [requiredGender, setRequiredGender] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [sheet, setSheet] = useState(false);
  const [displayMode, setDisplayMode] = useState<"grid" | "list">("grid");
  const [sortMode, setSortMode] = useState<"compatible" | "youngest" | "oldest" | "name">("compatible");
  const [visibleCount, setVisibleCount] = useState(20);
  const [savedSearchUrl, setSavedSearchUrl] = useState<string | null>(null);
  const [searchOwnerId, setSearchOwnerId] = useState<string | null>(null);
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
      setSearchOwnerId(user.id);
      const { data: savedSearch, error: savedError } = await supabase.from("member_saved_searches").select("path_and_query").eq("user_id", user.id).maybeSingle();
      if (!savedError) setSavedSearchUrl(savedSearch?.path_and_query || null);
      const self = await getProfile(user.id);
      if (!self) throw new Error("Complete your profile before finding matches.");
      const saved = partnerPreferencesFromProfile(self);
      // Gender is a matching eligibility filter rather than just a score.
      const extra = (self.extra || {}) as Record<string, any>;
      const details = (extra.matchDetails || {}) as Record<string, any>;
      const draft = (self.onboardingDraft || {}) as Record<string, any>;
      const ownGender = String(details.gender || extra.gender || draft.gender || "").toLowerCase();
      const chosen = String(saved.gender || "").trim();
      const mandatoryGender = chosen && !["no preference", "any", "all"].includes(chosen.toLowerCase())
        ? chosen
        : ["man", "male"].includes(ownGender) ? "Woman"
        : ["woman", "female"].includes(ownGender) ? "Man"
        : undefined;
      setRequiredGender(mandatoryGender);
      // Saved preferences rank candidates; they must not silently exclude every profile.
      const defaults = empty;
      setPreferences(saved);
      setFilters({ ...defaults, query: params.get("q") || "", ageMin: params.get("ageMin") ? Number(params.get("ageMin")) : defaults.ageMin, ageMax: params.get("ageMax") ? Number(params.get("ageMax")) : defaults.ageMax, countries: params.get("country") ? [params.get("country")!] : defaults.countries, languages: params.get("language") ? [params.get("language")!] : defaults.languages, religions: params.get("religion") ? [params.get("religion")!] : defaults.religions });
      const [profilePages, sentIds] = await Promise.all([Promise.all(Array.from({ length: 5 }, (_, i) => listProfiles({ limit: 100, offset: i * 100, excludeId: user.id }))), listSentInterestReceiverIds(user.id)]);
      const profiles = profilePages.flat();
      const shortlisted = await getShortlistedIds(user.id, profiles.map((p) => p.id));
      setPeople(profiles.map((p) => ({ ...p, isShortlisted: shortlisted.has(p.id) })));
      const { data: references, error: referencesError } = await supabase.rpc("discovery_member_references");
      if (!referencesError && references) setMemberReferences(Object.fromEntries(references.map((row: { member_id: string; reference: string }) => [row.member_id, row.reference])));
      setSent(new Set(sentIds));
    } catch (e) {
      toast({ title: "Matches unavailable", description: e instanceof Error ? e.message : "Please try again.", variant: "destructive" });
    } finally { setLoading(false); }
  }, [params, router, toast]);

  useEffect(() => { void load(); }, [load]);
  const hasSaved = Boolean(preferences && hasPreferences(preferences));
  const results = useMemo(() => people.filter((p) => profileMatchesFilters(p, { ...filters, gender: requiredGender || filters.gender })).sort((a, b) => {
    if (sortMode === "name") return (a.displayName || "").localeCompare(b.displayName || "");
    if (sortMode === "youngest") return (a.ageYears ?? 999) - (b.ageYears ?? 999);
    if (sortMode === "oldest") return (b.ageYears ?? -1) - (a.ageYears ?? -1);
    return preferences ? preferenceScore(b, preferences).percentage - preferenceScore(a, preferences).percentage : 0;
  }), [people, filters, preferences, requiredGender, sortMode]);
  useEffect(() => { setVisibleCount(20); }, [filters, requiredGender, sortMode]);
  const reset = () => setFilters({ ...empty, gender: requiredGender });
  const clear = () => setFilters({ ...empty, gender: requiredGender });
  const activeCount = [
    filters.ageMin, filters.ageMax, filters.countries.length, filters.languages.length,
    filters.religions.length, filters.professions.length, filters.smoking.length, filters.drinking.length,
    filters.gender && filters.gender !== "No preference" ? 1 : 0, filters.maritalStatuses?.length,
    filters.heightMin, filters.heightMax, filters.education?.length,
    filters.wantsChildren && filters.wantsChildren !== "Doesn't matter" ? 1 : 0,
    filters.relocation && filters.relocation !== "Doesn't matter" ? 1 : 0,
    filters.familyInvolvement && filters.familyInvolvement !== "Doesn't matter" ? 1 : 0,
    filters.marriageTimeline && filters.marriageTimeline !== "Doesn't matter" ? 1 : 0,
  ].filter(Boolean).length;

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
    <div className="rounded-2xl bg-accent p-4 text-sm text-primary-dark"><p className="font-semibold">Filter profiles independently of your saved preferences</p><p className="mt-1 text-primary">Changes here filter the results. Your saved preferences are used to rank matches; Reset shows all available profiles.</p></div>
    <div><Label>{t.age}</Label><div className="mt-2 grid grid-cols-2 gap-2"><Input type="number" min={18} placeholder={t.min} value={filters.ageMin || ""} onChange={(e) => setFilters((f) => ({ ...f, ageMin: e.target.value ? Number(e.target.value) : undefined }))}/><Input type="number" min={18} placeholder={t.max} value={filters.ageMax || ""} onChange={(e) => setFilters((f) => ({ ...f, ageMax: e.target.value ? Number(e.target.value) : undefined }))}/></div></div>
    <Choice label={t.country} value={first(filters.countries)} values={options.countries} onChange={(v) => setFilters((f) => ({ ...f, countries: list(v) }))}/><Choice label={t.language} value={first(filters.languages)} values={options.languages} onChange={(v) => setFilters((f) => ({ ...f, languages: list(v) }))}/><Choice label={t.religion} value={first(filters.religions)} values={options.religions} onChange={(v) => setFilters((f) => ({ ...f, religions: list(v) }))}/>
    <div><Label>{t.profession}</Label><Input className="mt-2" placeholder="e.g. Engineer" value={filters.professions[0] || ""} onChange={(e) => setFilters((f) => ({ ...f, professions: e.target.value ? [e.target.value] : [] }))}/></div>
    <Choice label={t.smoking} value={first(filters.smoking)} values={["Never", "Occasionally", "Socially"]} onChange={(v) => setFilters((f) => ({ ...f, smoking: list(v) }))}/><Choice label={t.drinking} value={first(filters.drinking)} values={["Never", "Occasionally", "Socially"]} onChange={(v) => setFilters((f) => ({ ...f, drinking: list(v) }))}/>
    <div className="border-t border-border pt-4"><p className="mb-3 text-sm font-semibold text-primary-dark">More partner preferences</p><div className="space-y-4">
      <Choice testId="discover-filter-gender" label="Gender" value={requiredGender || filters.gender || "all"} values={options.genders} onChange={(v) => setFilters((f) => ({ ...f, gender: v === "all" ? undefined : v }))}/>
      <Choice testId="discover-filter-marital-status" label="Marital status" value={first(filters.maritalStatuses || [])} values={options.maritalStatuses} onChange={(v) => setFilters((f) => ({ ...f, maritalStatuses: list(v) }))}/>
      <div><Label>Height (cm)</Label><div className="mt-2 grid grid-cols-2 gap-2"><Input data-testid="discover-filter-height-min" inputMode="numeric" placeholder="Min" value={filters.heightMin || ""} onChange={(e) => setFilters((f) => ({ ...f, heightMin: e.target.value }))}/><Input data-testid="discover-filter-height-max" inputMode="numeric" placeholder="Max" value={filters.heightMax || ""} onChange={(e) => setFilters((f) => ({ ...f, heightMax: e.target.value }))}/></div></div>
      <Choice testId="discover-filter-education" label="Education" value={first(filters.education || [])} values={options.education} onChange={(v) => setFilters((f) => ({ ...f, education: list(v) }))}/>
      <Choice testId="discover-filter-children" label="Children" value={filters.wantsChildren || "all"} values={options.future.children} onChange={(v) => setFilters((f) => ({ ...f, wantsChildren: v === "all" ? undefined : v }))}/>
      <Choice testId="discover-filter-relocation" label="Relocation" value={filters.relocation || "all"} values={options.future.relocation} onChange={(v) => setFilters((f) => ({ ...f, relocation: v === "all" ? undefined : v }))}/>
      <Choice testId="discover-filter-family" label="Family involvement" value={filters.familyInvolvement || "all"} values={options.future.family} onChange={(v) => setFilters((f) => ({ ...f, familyInvolvement: v === "all" ? undefined : v }))}/>
      <Choice testId="discover-filter-marriage-timeline" label="Marriage timeline" value={filters.marriageTimeline || "all"} values={options.future.timeline} onChange={(v) => setFilters((f) => ({ ...f, marriageTimeline: v === "all" ? undefined : v }))}/>
    </div></div>
    <div className="grid grid-cols-2 gap-2"><Button data-testid="discover-filter-clear" variant="outline" onClick={clear}><X className="mr-2 h-4 w-4"/>{t.clear}</Button><Button data-testid="discover-filter-reset" onClick={() => { reset(); setSheet(false); }}><RotateCcw className="mr-2 h-4 w-4"/>{t.reset}</Button></div>
  </div>;

  if (loading) return <PageFrame><Skeleton className="h-40 rounded-[30px]"/><Skeleton className="h-24"/><div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">{[1,2,3,4,5,6,7,8].map((n) => <Skeleton key={n} className="aspect-[3/5] rounded-2xl"/>)}</div></PageFrame>;

  return <PageFrame>
    <PageHero eyebrow={t.eyebrow} title={t.title} description={t.description}/>
    <Card className="overflow-hidden border-border"><CardContent className="p-4 sm:p-5"><div className="flex flex-col gap-3 lg:flex-row lg:items-center"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/><Input className="pl-10" placeholder={t.search} value={filters.query} onChange={(e) => setFilters((f) => ({ ...f, query: e.target.value }))}/></div><div className="flex gap-2"><Sheet open={sheet} onOpenChange={setSheet}><SheetTrigger asChild><Button data-testid="discover-filters-open" variant="outline" className="flex-1 lg:flex-none"><SlidersHorizontal className="mr-2 h-4 w-4"/>{t.filters} {activeCount ? `(${activeCount})` : ""}</Button></SheetTrigger><SheetContent className="w-[92vw] overflow-y-auto sm:max-w-md"><SheetHeader><SheetTitle>{t.matchFilters}</SheetTitle></SheetHeader><div className="mt-5"><FilterPanel/></div></SheetContent></Sheet>{hasSaved && <Button variant="ghost" onClick={reset}><RotateCcw className="mr-2 h-4 w-4"/>{t.showAll}</Button>}</div></div>
      <div className={`mt-4 flex items-center gap-2 rounded-xl px-3 py-2 text-sm ${hasSaved ? "bg-accent text-primary" : "bg-amber-50 text-amber-800"}`}><Sparkles className="h-4 w-4 shrink-0"/><span>{hasSaved ? <><strong>Preference match %</strong> compares each member with your saved Partner Preferences.</> : <><strong>Match % is waiting for your preferences.</strong> Set Partner Preferences to activate personalised scores.</>}</span>{!hasSaved && <Button size="sm" variant="outline" className="ml-auto" onClick={() => router.push(PREFERENCES_ROUTE)}>Set preferences</Button>}</div>
    </CardContent></Card>
    <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-muted-foreground"><strong className="text-foreground">{results.length}</strong> {t.potential}</p><label className="flex items-center gap-2 text-xs text-muted-foreground">Sort by <select aria-label="Sort matches" className="h-9 rounded-lg border border-input bg-background px-2 text-sm text-foreground" value={sortMode} onChange={(event) => setSortMode(event.target.value as typeof sortMode)}><option value="compatible">Best preference match</option><option value="youngest">Age: youngest</option><option value="oldest">Age: oldest</option><option value="name">Name A–Z</option></select></label><div className="flex gap-1 rounded-xl border border-border p-1" role="group" aria-label="Profile display"><Button size="sm" variant={displayMode === "grid" ? "secondary" : "ghost"} aria-pressed={displayMode === "grid"} onClick={() => setDisplayMode("grid")}><LayoutGrid className="mr-1 h-4 w-4" />Grid</Button><Button size="sm" variant={displayMode === "list" ? "secondary" : "ghost"} aria-pressed={displayMode === "list"} onClick={() => setDisplayMode("list")}><List className="mr-1 h-4 w-4" />List</Button></div></div>
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card px-3 py-3">
      <span className="text-xs font-semibold text-muted-foreground">Quick filters</span>
      <label className="flex items-center gap-1 text-xs text-muted-foreground">From <Input aria-label="Minimum age" type="number" min={18} max={100} inputMode="numeric" className="h-9 w-16 px-2" placeholder="18" value={filters.ageMin ?? ""} onChange={(e) => setFilters((f) => ({ ...f, ageMin: e.target.value ? Number(e.target.value) : undefined }))}/></label>
      <label className="flex items-center gap-1 text-xs text-muted-foreground">To <Input aria-label="Maximum age" type="number" min={18} max={100} inputMode="numeric" className="h-9 w-16 px-2" placeholder="60" value={filters.ageMax ?? ""} onChange={(e) => setFilters((f) => ({ ...f, ageMax: e.target.value ? Number(e.target.value) : undefined }))}/></label>
      {requiredGender && <span className="rounded-full bg-accent px-3 py-2 text-xs font-medium text-primary">Looking for {requiredGender.toLowerCase()} profiles</span>}
      <Button size="sm" variant="outline" onClick={() => { navigator.clipboard?.writeText(window.location.href).then(() => toast({ title: "Search link copied" })).catch(() => toast({ title: "Unable to copy link", variant: "destructive" })); }}>Copy search link</Button>
      <Button size="sm" variant="outline" disabled={!searchOwnerId} onClick={() => { if (!searchOwnerId) return; void (async () => { const url = window.location.pathname + window.location.search; const { error } = await supabase.from("member_saved_searches").upsert({ user_id: searchOwnerId, path_and_query: url, updated_at: new Date().toISOString() }, { onConflict: "user_id" }); if (error) { toast({ title: "Could not save search", description: error.message, variant: "destructive" }); return; } setSavedSearchUrl(url); toast({ title: "Search saved to your account" }); })(); }}>Save search</Button>
      {savedSearchUrl && <Button size="sm" variant="ghost" onClick={() => { window.location.assign(savedSearchUrl); }}>Open saved search</Button>}
    </div>
    {!results.length ? <Card><CardContent className="py-14 text-center"><Heart className="mx-auto h-10 w-10 text-gold-foreground"/><h2 className="mt-3 text-lg font-semibold">{t.none}</h2><p className="mt-1 text-sm text-muted-foreground">{t.broaden}</p><Button className="mt-4" variant="outline" onClick={clear}>{t.showAll}</Button></CardContent></Card> :
    <div className={displayMode === "list" ? "grid grid-cols-1 gap-3 lg:grid-cols-2" : "grid grid-cols-2 items-stretch gap-3 md:grid-cols-3 lg:gap-5 xl:grid-cols-4"}>
      {results.slice(0, visibleCount).map((person) => {
      const score = preferences ? preferenceScore(person, preferences) : null;
      const showScore = Boolean(hasSaved && score && score.total > 0);
      return (
        <Card key={person.id} data-testid={`discover-profile-${person.id}`} className={`flex h-full overflow-hidden rounded-2xl border-border shadow-sm ${displayMode === "list" ? "flex-col sm:flex-row" : "flex-col"}`}>
          {/* Fixed photo height so every card aligns */}
          <div className={displayMode === "list" ? "relative h-56 w-full shrink-0 overflow-hidden bg-accent sm:h-auto sm:w-44" : "relative h-44 w-full shrink-0 overflow-hidden bg-accent sm:h-52 md:h-56"}>
            {person.photoURL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={person.photoURL}
                alt={person.displayName}
                className={`h-full w-full object-cover ${person.profilePhotoGrayscale ? "grayscale" : ""}`}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-4xl font-semibold text-primary">
                {person.displayName?.[0] || "?"}
              </div>
            )}

            {showScore ? (
              <div className="absolute left-2 top-2 rounded-full border border-white/80 bg-white/95 px-2.5 py-1 text-[11px] font-bold text-primary shadow-sm">
                {score!.percentage}% {t.preferenceMatch}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => router.push(PREFERENCES_ROUTE)}
                className="absolute left-2 top-2 max-w-[calc(100%-3.25rem)] rounded-full border border-amber-200/80 bg-amber-50/95 px-2.5 py-1 text-left text-[10px] font-semibold leading-tight text-amber-800 shadow-sm hover:bg-amber-100 sm:text-[11px]"
              >
                {hasSaved ? t.needDetails : t.setPreferences}
              </button>
            )}

            <Button
              size="icon"
              variant="secondary"
              className="absolute right-2 top-2 h-8 w-8 rounded-full bg-white/90 sm:h-9 sm:w-9"
              onClick={() => void toggleShortlist(person)}
              aria-label={person.isShortlisted ? "Remove from shortlist" : "Shortlist"}
            >
              {busy[`s-${person.id}`] ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Bookmark className={`h-4 w-4 ${person.isShortlisted ? "fill-primary text-primary" : ""}`} />
              )}
            </Button>
          </div>

          <div className="flex min-w-0 flex-1 flex-col"><CardContent className="flex flex-1 flex-col gap-2 p-3 sm:p-4">
            <div className="min-w-0">
              <h2 className="truncate text-sm font-semibold leading-tight text-foreground sm:text-base">
                {person.displayName}
                {person.nameIsAlias ? <span className="ml-1 rounded-full bg-accent px-1.5 py-0.5 text-[9px] font-medium text-primary align-middle">CupidMatch alias</span> : null}
                {person.ageYears ? (
                  <span className="font-normal text-muted-foreground">, {person.ageYears}</span>
                ) : null}
              </h2>
              <p className="mt-1 text-[10px] font-semibold tracking-wide text-gold-foreground sm:text-xs">{memberReferences[person.id] || "CupidMatch member"}</p>
              {person.isVerified && <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-primary"><BadgeCheck className="h-3.5 w-3.5" />Verified profile</p>}
              {person.height && <p className="mt-1 text-xs text-muted-foreground">{person.height} tall</p>}
              {displayMode === "list" && person.bio && <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-muted-foreground">{person.bio}</p>}
              <p className="mt-1 flex min-w-0 items-center gap-1 text-xs text-muted-foreground sm:text-sm">
                <Briefcase className="h-3.5 w-3.5 shrink-0" aria-hidden />
                <span className="truncate">{person.profession || "—"}</span>
              </p>
              <p className="mt-0.5 flex min-w-0 items-center gap-1 text-xs text-muted-foreground sm:text-sm">
                <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
                <span className="truncate">{person.location || person.country || "—"}</span>
              </p>
            </div>

            {/* Fixed-height preference panel keeps footers aligned */}
            <div className="mt-auto h-[4.25rem] shrink-0">
              {showScore ? (
                <div className="flex h-full flex-col justify-center rounded-xl bg-accent px-2.5 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-xs font-semibold text-primary-dark">
                      {score!.percentage}% {t.preferenceMatch}
                    </p>
                    <span className="shrink-0 text-[10px] text-primary">
                      {score!.matched}/{score!.total}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-accent">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${score!.percentage}%` }}
                    />
                  </div>
                  {score!.reasons[0] ? (
                    <p className="mt-1 truncate text-[10px] text-primary">✓ {score!.reasons[0]}</p>
                  ) : null}
                </div>
              ) : hasSaved ? (
                <div className="flex h-full items-center rounded-xl bg-amber-50 px-2.5 py-2 text-[11px] leading-snug text-amber-800">
                  More profile details are needed for a reliable score.
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => router.push(PREFERENCES_ROUTE)}
                  className="flex h-full w-full items-center rounded-xl bg-accent px-2.5 py-2 text-left text-[11px] font-medium leading-snug text-primary hover:bg-accent"
                >
                  Set Partner Preferences to unlock your match %.
                </button>
              )}
            </div>
          </CardContent>

          <CardFooter className="mt-auto grid shrink-0 grid-cols-3 gap-1.5 border-t border-border p-2 sm:gap-2 sm:p-3">
            <Button
              size="sm"
              variant="outline"
              className="min-w-0 px-1.5"
              data-testid={`profile-${person.id}-view`}
              onClick={() => router.push(`/profile/${person.id}`)}
            >
              {t.view}
            </Button>
            <ShareProfileButton profileId={person.id} displayName={person.displayName || "Member"} />
            <Button
              size="sm"
              className="min-w-0 px-1.5"
              data-testid={`profile-${person.id}-interest`}
              disabled={sent.has(person.id) || busy[`i-${person.id}`]}
              onClick={() => void interest(person.id)}
            >
              {busy[`i-${person.id}`] ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : sent.has(person.id) ? (
                t.sent
              ) : (
                t.interest
              )}
            </Button>
          </CardFooter></div>
        </Card>
      );
    })}
    </div>}
    {results.length > visibleCount && <div className="flex justify-center py-5"><Button variant="outline" onClick={() => setVisibleCount((count) => count + 20)}>Show more matches ({Math.min(20, results.length - visibleCount)} more)</Button></div>}
  </PageFrame>;
}

function Choice({ label, value, values, onChange, testId }: { label: string; value: string; values: readonly string[]; onChange: (value: string) => void; testId?: string }) {
  const { language } = useI18n(); const t = getMessages(language).discover;
  return <div><Label>{label}</Label><Select value={value} onValueChange={onChange}><SelectTrigger data-testid={testId} className="mt-2"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="all">{t.any}</SelectItem>{values.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select></div>;
}