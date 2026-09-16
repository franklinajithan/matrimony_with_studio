"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Copy,
  Eye,
  FilePlus2,
  Loader2,
  Pencil,
  Trash2,
  LayoutTemplate,
} from "lucide-react";
import { auth, onAuthStateChanged, type AuthUser } from "@/lib/supabase/auth";
import { getProfile } from "@/lib/supabase/profiles";
import {
  listDocuments,
  createDocument,
  duplicateDocument,
  deleteDocument,
  listFavouriteTemplates,
} from "@/lib/supabase/biodata";
import type { BiodataDocument } from "@/lib/biodata/types";
import {
  createEmptyDocumentInput,
  defaultDesignForTemplate,
} from "@/lib/biodata/defaults";
import { importProfileToContent } from "@/lib/biodata/import-profile";
import { getTemplate, TEMPLATES } from "@/lib/biodata/templates";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { PageFrame, PageHero } from "@/components/dashboard/PageHero";

const RECENT_KEY = "cupidmatch:biodata-recent-templates";
const DEFAULT_TEMPLATE = "violet-connection";

function readRecentTemplates(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String).slice(0, 8) : [];
  } catch {
    return [];
  }
}

function pushRecentTemplate(templateId: string) {
  const next = [templateId, ...readRecentTemplates().filter((id) => id !== templateId)].slice(0, 8);
  localStorage.setItem(RECENT_KEY, JSON.stringify(next));
}

export function StudioHome() {
  const router = useRouter();
  const [user, setUser] = React.useState<AuthUser | null>(auth.currentUser);
  const [loading, setLoading] = React.useState(true);
  const [docs, setDocs] = React.useState<BiodataDocument[]>([]);
  const [favourites, setFavourites] = React.useState<string[]>([]);
  const [recent, setRecent] = React.useState<string[]>([]);
  const [creating, setCreating] = React.useState(false);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [templatePromptOpen, setTemplatePromptOpen] = React.useState(false);

  React.useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) router.replace(`/login?next=${encodeURIComponent("/biodata")}`);
    });
    return unsub;
  }, [router]);

  const reload = React.useCallback(async (uid: string) => {
    const [list, favs] = await Promise.all([
      listDocuments(uid),
      listFavouriteTemplates(uid),
    ]);
    setDocs(list);
    setFavourites(favs);
    setRecent(readRecentTemplates());
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        await reload(user.uid);
      } catch (e) {
        toast({
          title: "Could not load Studio",
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
  }, [user, reload]);

  async function createWithTemplate(templateId: string) {
    if (!user) return;
    setCreating(true);
    setTemplatePromptOpen(false);
    try {
      const profile = await getProfile(user.uid);
      const lang = "en" as const;
      const imported = profile
        ? importProfileToContent(profile, lang)
        : {
            content: { introduction: "", sections: [] },
            visibility: undefined,
            sectionOrder: [] as string[],
          };

      const input = createEmptyDocumentInput({
        ownerId: user.uid,
        title: profile?.displayName
          ? `${profile.displayName.split(/\s+/)[0]}'s biodata`
          : "My biodata",
        templateId,
        language: lang,
        content: imported.content,
        visibility: imported.visibility,
        sectionOrder: imported.sectionOrder,
      });

      // Ensure design matches chosen template
      input.design = defaultDesignForTemplate(templateId);
      input.templateId = templateId;

      const doc = await createDocument(input);
      pushRecentTemplate(templateId);
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

  async function handleDuplicate(id: string) {
    try {
      const copy = await duplicateDocument(id);
      toast({ title: "Duplicated" });
      router.push(`/biodata/${copy.id}/edit`);
    } catch (e) {
      toast({
        title: "Duplicate failed",
        description: e instanceof Error ? e.message : "Try again",
        variant: "destructive",
      });
    }
  }

  async function confirmDelete() {
    if (!deleteId || !user) return;
    try {
      await deleteDocument(deleteId);
      setDeleteId(null);
      await reload(user.uid);
      toast({ title: "Deleted" });
    } catch (e) {
      toast({
        title: "Delete failed",
        description: e instanceof Error ? e.message : "Try again",
        variant: "destructive",
      });
    }
  }

  const lastDraft = docs[0];
  const favTemplates = favourites
    .map((id) => getTemplate(id))
    .filter(Boolean);
  const recentTemplates = recent
    .map((id) => getTemplate(id))
    .filter(Boolean);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#7027E8]" />
      </div>
    );
  }

  return (
    <PageFrame>
      <PageHero
        eyebrow="CupidMatch"
        title="Biodata Studio"
        description="Create polished matrimonial biodata from your profile. Drafts stay private until you export — you control what sensitive details appear."
      >
        <div className="mt-4 flex flex-wrap gap-3">
            <Button
              size="lg"
              className="min-h-12 rounded-xl px-5 shadow-sm"
              disabled={creating}
              onClick={() => void createWithTemplate(DEFAULT_TEMPLATE)}
            >
              {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FilePlus2 className="mr-2 h-4 w-4" />}
              Create biodata
            </Button>
            <Button
              variant="outline"
              className="rounded-xl border-[#dcc9d8] bg-white/80"
              disabled={creating}
              onClick={() => setTemplatePromptOpen(true)}
            >
              <LayoutTemplate className="mr-2 h-4 w-4" />
              Choose template
            </Button>
            {lastDraft ? (
              <Button variant="outline" className="rounded-xl border-[#dcc9d8] bg-white/80" asChild>
                <Link href={`/biodata/${lastDraft.id}/edit`}>Continue last draft</Link>
              </Button>
            ) : null}
            <Button variant="ghost" className="rounded-xl" asChild>
              <Link href="/biodata/templates">Browse templates</Link>
            </Button>
        </div>
      </PageHero>

      <Card className="w-full rounded-2xl border-[#eadde7] bg-white/80 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-[#351532]">Privacy</CardTitle>
          <CardDescription className="text-[#745d70]">
            Studio drafts are private to your account. Before PDF, image, or print export you will
            review which contacts, photo, and sensitive fields to include.
          </CardDescription>
        </CardHeader>
      </Card>

      {favTemplates.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-[#7027E8]">Favourite templates</h2>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {favTemplates.map((t) =>
              t ? (
                <Button
                  key={t.id}
                  variant="outline"
                  size="sm"
                  className="shrink-0 border-[#7027E8]/25"
                  disabled={creating}
                  onClick={() => void createWithTemplate(t.id)}
                >
                  {t.name}
                </Button>
              ) : null
            )}
          </div>
        </section>
      ) : null}

      {recentTemplates.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-[#7027E8]">Recently used</h2>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {recentTemplates.map((t) =>
              t ? (
                <Badge
                  key={t.id}
                  variant="outline"
                  className="cursor-pointer border-[#FF6F72]/40 text-[#1a1a1a]"
                  onClick={() => void createWithTemplate(t.id)}
                >
                  {t.name}
                </Badge>
              ) : null
            )}
          </div>
        </section>
      ) : null}

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Your biodata</h2>
          <Badge variant="outline">{docs.length}</Badge>
        </div>

        {docs.length === 0 ? (
          <Card className="border-dashed border-[#7027E8]/25 bg-[#FBF8F4]">
            <CardContent className="flex flex-col items-start gap-3 py-10">
              <p className="text-sm text-muted-foreground">
                No biodata yet. New members can create a draft from their profile in one tap —
                start with Violet Connection or pick another look from the gallery.
              </p>
              <Button
                className="bg-[#7027E8] hover:bg-[#5a1ec0]"
                disabled={creating}
                onClick={() => void createWithTemplate(DEFAULT_TEMPLATE)}
              >
                Create your first biodata
              </Button>
            </CardContent>
          </Card>
        ) : (
          <ul className="space-y-3">
            {docs.map((doc) => {
              const tpl = getTemplate(doc.templateId);
              return (
                <li
                  key={doc.id}
                  className="flex w-full flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#eadde7] bg-white px-4 py-3 shadow-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{doc.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {tpl?.name ?? doc.templateId}
                      {doc.updatedAt
                        ? ` · updated ${formatDistanceToNow(new Date(doc.updatedAt), { addSuffix: true })}`
                        : null}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" className="bg-[#7027E8] hover:bg-[#5a1ec0]" asChild>
                      <Link href={`/biodata/${doc.id}/edit`}>
                        <Pencil className="mr-1 h-3.5 w-3.5" />
                        Edit
                      </Link>
                    </Button>
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/biodata/${doc.id}/preview`}>
                        <Eye className="mr-1 h-3.5 w-3.5" />
                        Preview
                      </Link>
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="ghost">
                          More
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => void handleDuplicate(doc.id)}>
                          <Copy className="mr-2 h-4 w-4" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-[#FF6F72]"
                          onClick={() => setDeleteId(doc.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <Dialog open={templatePromptOpen} onOpenChange={setTemplatePromptOpen}>
        <DialogContent className="bg-[#FBF8F4]">
          <DialogHeader>
            <DialogTitle>Choose a starting template</DialogTitle>
            <DialogDescription>
              You can change the template later without losing your content.
            </DialogDescription>
          </DialogHeader>
          <div className="grid max-h-72 gap-2 overflow-y-auto">
            {TEMPLATES.slice(0, 8).map((t) => (
              <Button
                key={t.id}
                variant="outline"
                className="justify-start"
                disabled={creating}
                onClick={() => void createWithTemplate(t.id)}
              >
                {t.name}
              </Button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="ghost" asChild>
              <Link href="/biodata/templates">See all templates</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleteId)} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent className="bg-[#FBF8F4]">
          <DialogHeader>
            <DialogTitle>Delete biodata?</DialogTitle>
            <DialogDescription>This cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button
              className="bg-[#FF6F72] text-white hover:bg-[#e85f62]"
              onClick={() => void confirmDelete()}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageFrame>
  );
}
