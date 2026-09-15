"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Search } from "lucide-react";
import { auth, onAuthStateChanged, type AuthUser } from "@/lib/supabase/auth";
import { getProfile } from "@/lib/supabase/profiles";
import {
  listFavouriteTemplates,
  setFavouriteTemplate,
  createDocument,
} from "@/lib/supabase/biodata";
import type {
  BiodataContent,
  BiodataLanguage,
  BiodataTemplateDef,
  BiodataVisibility,
  TemplateCategory,
} from "@/lib/biodata/types";
import { TEMPLATES, getTemplate } from "@/lib/biodata/templates";
import {
  createEmptyDocumentInput,
  defaultDesignForTemplate,
} from "@/lib/biodata/defaults";
import { importProfileToContent } from "@/lib/biodata/import-profile";
import {
  SAMPLE_CONTENT,
  SAMPLE_SECTION_ORDER,
  SAMPLE_VISIBILITY,
  SAMPLE_PREVIEW_NOTICE,
} from "@/lib/biodata/sample-data";
import { TemplateCard } from "@/components/biodata/TemplateCard";
import { DocumentRenderer } from "@/components/biodata/DocumentRenderer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const GALLERY_KEY = "cupidmatch:biodata-gallery";
const RECENT_KEY = "cupidmatch:biodata-recent-templates";

type FilterChip = "all" | TemplateCategory;

type GalleryPrefs = {
  filter: FilterChip;
  search: string;
  stylePref: "classic" | "modern" | "minimal" | "seasonal" | "photo" | "any";
  language: BiodataLanguage;
};

const FILTERS: { id: FilterChip; label: string }[] = [
  { id: "all", label: "All" },
  { id: "religious-cultural", label: "Religious / cultural" },
  { id: "seasonal", label: "Seasonal" },
  { id: "modern", label: "Modern" },
  { id: "minimal", label: "Minimal" },
  { id: "photo", label: "Photo" },
];

function loadPrefs(): GalleryPrefs {
  const fallback: GalleryPrefs = {
    filter: "all",
    search: "",
    stylePref: "any",
    language: "en",
  };
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(GALLERY_KEY);
    if (!raw) return fallback;
    return { ...fallback, ...JSON.parse(raw) };
  } catch {
    return fallback;
  }
}

function savePrefs(prefs: GalleryPrefs) {
  localStorage.setItem(GALLERY_KEY, JSON.stringify(prefs));
}

function pushRecent(templateId: string) {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    const prev: string[] = raw ? JSON.parse(raw) : [];
    const next = [templateId, ...prev.filter((id) => id !== templateId)].slice(0, 8);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

function scoreTemplate(
  t: BiodataTemplateDef,
  stylePref: GalleryPrefs["stylePref"],
  language: BiodataLanguage,
  contentLength: number
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  if (stylePref === "classic" && (t.categories.includes("religious-cultural") || t.id.includes("classic") || t.id.includes("heritage"))) {
    score += 3;
    reasons.push("Matches a classic / formal style preference");
  }
  if (stylePref === "modern" && t.categories.includes("modern")) {
    score += 3;
    reasons.push("Matches your modern style preference");
  }
  if (stylePref === "minimal" && t.categories.includes("minimal")) {
    score += 3;
    reasons.push("Matches your minimal style preference");
  }
  if (stylePref === "seasonal" && t.categories.includes("seasonal")) {
    score += 3;
    reasons.push("Matches your seasonal style preference");
  }
  if (stylePref === "photo" && t.categories.includes("photo")) {
    score += 3;
    reasons.push("Suited to photo-forward layouts");
  }

  if (contentLength > 1200 && (t.layout === "classic-two-col" || t.layout === "editorial")) {
    score += 2;
    reasons.push("Handles longer biodata content well");
  } else if (contentLength < 400 && t.categories.includes("minimal")) {
    score += 2;
    reasons.push("Clean fit for shorter content");
  }

  if (language !== "en" && t.defaultDesign?.bilingualLabels) {
    score += 1;
    reasons.push("Supports bilingual label layouts");
  }

  // Never score based on religion / religious motif inference
  return { score, reasons };
}

export function TemplateGallery() {
  const router = useRouter();
  const [user, setUser] = React.useState<AuthUser | null>(auth.currentUser);
  const [prefs, setPrefs] = React.useState<GalleryPrefs>(() => loadPrefs());
  const [favourites, setFavourites] = React.useState<string[]>([]);
  const [myContent, setMyContent] = React.useState<BiodataContent | null>(null);
  const [myVisibility, setMyVisibility] = React.useState<BiodataVisibility>(SAMPLE_VISIBILITY);
  const [myOrder, setMyOrder] = React.useState<string[]>(SAMPLE_SECTION_ORDER);
  const [loading, setLoading] = React.useState(true);
  const [creating, setCreating] = React.useState(false);

  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [previewTemplate, setPreviewTemplate] = React.useState<BiodataTemplateDef | null>(null);
  const [previewMode, setPreviewMode] = React.useState<"mine" | "sample">("sample");

  const [compareIds, setCompareIds] = React.useState<string[]>([]);
  const [compareOpen, setCompareOpen] = React.useState(false);

  React.useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) router.replace(`/login?next=${encodeURIComponent("/biodata/templates")}`);
    });
    return unsub;
  }, [router]);

  React.useEffect(() => {
    savePrefs(prefs);
  }, [prefs]);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const [favs, profile] = await Promise.all([
          listFavouriteTemplates(user.uid),
          getProfile(user.uid),
        ]);
        if (cancelled) return;
        setFavourites(favs);
        if (profile) {
          const imported = importProfileToContent(profile, prefs.language);
          setMyContent(imported.content);
          setMyVisibility(imported.visibility);
          setMyOrder(imported.sectionOrder);
        }
      } catch (e) {
        toast({
          title: "Could not load gallery",
          description: e instanceof Error ? e.message : "Try again",
          variant: "destructive",
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, prefs.language]);

  const cardContent = myContent ?? SAMPLE_CONTENT;
  const cardVisibility = myContent ? myVisibility : SAMPLE_VISIBILITY;
  const cardOrder = myContent ? myOrder : SAMPLE_SECTION_ORDER;
  const contentLength =
    cardContent.introduction.length +
    cardContent.sections.reduce(
      (n, s) => n + s.fields.reduce((m, f) => m + f.value.length, 0),
      0
    );

  const recommendations = React.useMemo(() => {
    return TEMPLATES.map((t) => {
      const { score, reasons } = scoreTemplate(t, prefs.stylePref, prefs.language, contentLength);
      return { template: t, score, reasons };
    })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }, [prefs.stylePref, prefs.language, contentLength]);

  const filtered = TEMPLATES.filter((t) => {
    if (prefs.filter !== "all" && !t.categories.includes(prefs.filter)) return false;
    const q = prefs.search.trim().toLowerCase();
    if (q && !t.name.toLowerCase().includes(q) && !t.description.toLowerCase().includes(q)) {
      return false;
    }
    return true;
  });

  async function toggleFavourite(templateId: string) {
    if (!user) return;
    const next = !favourites.includes(templateId);
    try {
      await setFavouriteTemplate(user.uid, templateId, next);
      setFavourites((prev) =>
        next ? [templateId, ...prev.filter((id) => id !== templateId)] : prev.filter((id) => id !== templateId)
      );
    } catch (e) {
      toast({
        title: "Could not update favourite",
        description: e instanceof Error ? e.message : "Try again",
        variant: "destructive",
      });
    }
  }

  function toggleCompare(templateId: string) {
    setCompareIds((prev) => {
      if (prev.includes(templateId)) return prev.filter((id) => id !== templateId);
      if (prev.length >= 3) {
        toast({ title: "Compare up to 3 templates" });
        return prev;
      }
      return [...prev, templateId];
    });
  }

  async function startWithTemplate(templateId: string) {
    if (!user) return;
    setCreating(true);
    try {
      const profile = await getProfile(user.uid);
      const imported = profile
        ? importProfileToContent(profile, prefs.language)
        : {
            content: { introduction: "", sections: [] as BiodataContent["sections"] },
            visibility: undefined,
            sectionOrder: [] as string[],
          };
      const input = createEmptyDocumentInput({
        ownerId: user.uid,
        title: profile?.displayName
          ? `${profile.displayName.split(/\s+/)[0]}'s biodata`
          : "My biodata",
        templateId,
        language: prefs.language,
        content: imported.content,
        visibility: imported.visibility,
        sectionOrder: imported.sectionOrder,
      });
      input.design = defaultDesignForTemplate(templateId);
      const doc = await createDocument(input);
      pushRecent(templateId);
      router.push(`/biodata/${doc.id}/edit`);
    } catch (e) {
      toast({
        title: "Could not create biodata",
        description: e instanceof Error ? e.message : "Try again",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  }

  function openPreview(template: BiodataTemplateDef, mode: "mine" | "sample") {
    setPreviewTemplate(template);
    setPreviewMode(mode);
    setPreviewOpen(true);
  }

  const previewContent =
    previewMode === "mine" && myContent ? myContent : SAMPLE_CONTENT;
  const previewVis =
    previewMode === "mine" && myContent ? myVisibility : SAMPLE_VISIBILITY;
  const previewOrder =
    previewMode === "mine" && myContent ? myOrder : SAMPLE_SECTION_ORDER;

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#7027E8]" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-[#7027E8]">
              Biodata Studio
            </p>
            <h1 className="text-3xl font-semibold text-[#1a1a1a]">Templates</h1>
          </div>
          <Button variant="outline" asChild>
            <Link href="/biodata">Back to Studio</Link>
          </Button>
        </div>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Browse all 20 looks. Favourites sync to your account. Suggestions use only the style,
          language, and content length you set — never inferred religion.
        </p>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="bg-white pl-9"
            placeholder="Search by name…"
            value={prefs.search}
            onChange={(e) => setPrefs((p) => ({ ...p, search: e.target.value }))}
          />
        </div>
        <Select
          value={prefs.stylePref}
          onValueChange={(v: GalleryPrefs["stylePref"]) =>
            setPrefs((p) => ({ ...p, stylePref: v }))
          }
        >
          <SelectTrigger className="w-full bg-white sm:w-48">
            <SelectValue placeholder="Style preference" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any style</SelectItem>
            <SelectItem value="classic">Classic / formal</SelectItem>
            <SelectItem value="modern">Modern</SelectItem>
            <SelectItem value="minimal">Minimal</SelectItem>
            <SelectItem value="seasonal">Seasonal</SelectItem>
            <SelectItem value="photo">Photo-forward</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={prefs.language}
          onValueChange={(v: BiodataLanguage) => setPrefs((p) => ({ ...p, language: v }))}
        >
          <SelectTrigger className="w-full bg-white sm:w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="ta">Tamil</SelectItem>
            <SelectItem value="si">Sinhala</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setPrefs((p) => ({ ...p, filter: f.id }))}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              prefs.filter === f.id
                ? "border-[#7027E8] bg-[#7027E8] text-white"
                : "border-[#7027E8]/25 bg-white text-[#1a1a1a] hover:bg-[#7027E8]/5"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {recommendations.length > 0 && prefs.stylePref !== "any" ? (
        <section className="space-y-2 rounded-lg border border-[#7027E8]/15 bg-white/70 p-4">
          <h2 className="text-sm font-semibold text-[#7027E8]">Suggested for you</h2>
          <ul className="space-y-2 text-sm">
            {recommendations.map(({ template, reasons }) => (
              <li key={template.id}>
                <button
                  type="button"
                  className="font-medium text-[#1a1a1a] underline-offset-2 hover:underline"
                  onClick={() => openPreview(template, myContent ? "mine" : "sample")}
                >
                  {template.name}
                </button>
                <span className="text-muted-foreground"> — {reasons.join("; ")}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">{filtered.length} templates</Badge>
        {compareIds.length > 0 ? (
          <>
            <Badge className="bg-[#FF6F72] hover:bg-[#FF6F72]">
              Compare {compareIds.length}/3
            </Badge>
            <Button
              size="sm"
              variant="outline"
              disabled={compareIds.length < 2}
              onClick={() => setCompareOpen(true)}
            >
              Open compare
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setCompareIds([])}>
              Clear
            </Button>
          </>
        ) : (
          <p className="text-xs text-muted-foreground">Select up to 3 cards to compare</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((template) => (
          <div key={template.id} className="relative">
            <TemplateCard
              template={template}
              content={cardContent}
              visibility={cardVisibility}
              sectionOrder={cardOrder}
              isFavourite={favourites.includes(template.id)}
              selected={compareIds.includes(template.id)}
              onSelect={() => void startWithTemplate(template.id)}
              onToggleFavourite={() => void toggleFavourite(template.id)}
            />
            <div className="mt-2 flex flex-wrap gap-2 px-1">
              <Button
                size="sm"
                variant="outline"
                disabled={!myContent || creating}
                onClick={() => openPreview(template, "mine")}
              >
                Preview with my details
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => openPreview(template, "sample")}
              >
                Sample data
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => toggleCompare(template.id)}
              >
                {compareIds.includes(template.id) ? "Remove" : "Compare"}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {creating ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
          <Loader2 className="h-8 w-8 animate-spin text-[#7027E8]" />
        </div>
      ) : null}

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-h-[95vh] max-w-3xl overflow-hidden bg-[#FBF8F4]">
          <DialogHeader>
            <DialogTitle>{previewTemplate?.name}</DialogTitle>
            <DialogDescription>
              {previewMode === "sample" ? SAMPLE_PREVIEW_NOTICE : "Preview with your profile details"}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[70vh]">
            <div className="flex justify-center p-2">
              <div className="origin-top scale-[0.55]">
                {previewTemplate ? (
                  <DocumentRenderer
                    content={previewContent}
                    design={defaultDesignForTemplate(previewTemplate.id)}
                    visibility={previewVis}
                    sectionOrder={previewOrder}
                    templateId={previewTemplate.id}
                  />
                ) : null}
              </div>
            </div>
          </ScrollArea>
          <Button
            className="bg-[#7027E8] hover:bg-[#5a1ec0]"
            disabled={!previewTemplate || creating}
            onClick={() => previewTemplate && void startWithTemplate(previewTemplate.id)}
          >
            Use this template
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={compareOpen} onOpenChange={setCompareOpen}>
        <DialogContent className="max-h-[95vh] max-w-6xl overflow-hidden bg-[#FBF8F4]">
          <DialogHeader>
            <DialogTitle>Compare templates</DialogTitle>
            <DialogDescription>Side-by-side with sample data</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 overflow-x-auto md:grid-cols-3">
            {compareIds.map((id) => {
              const t = getTemplate(id);
              if (!t) return null;
              return (
                <div key={id} className="min-w-[220px]">
                  <p className="mb-2 text-center text-sm font-medium">{t.name}</p>
                  <div className="origin-top scale-[0.28]">
                    <DocumentRenderer
                      content={SAMPLE_CONTENT}
                      design={defaultDesignForTemplate(t.id)}
                      visibility={SAMPLE_VISIBILITY}
                      sectionOrder={SAMPLE_SECTION_ORDER}
                      templateId={t.id}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
