"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Copy, Download, Link2, Loader2, Printer } from "lucide-react";
import { auth, onAuthStateChanged, type AuthUser } from "@/lib/supabase/auth";
import { getDocument, updateDocument, createShareLink } from "@/lib/supabase/biodata";
import type { BiodataDocument, BiodataVisibility } from "@/lib/biodata/types";
import { getTemplate } from "@/lib/biodata/templates";
import { DocumentRenderer } from "@/components/biodata/DocumentRenderer";
import { PrivacyReview } from "@/components/biodata/PrivacyReview";
import {
  exportDocumentPdf,
  exportDocumentImage,
  printDocument,
} from "@/components/biodata/export";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";

function firstName(doc: BiodataDocument): string {
  for (const section of doc.content.sections) {
    const f = section.fields.find((x) => x.id === "name");
    if (f?.value?.trim()) return f.value.trim().split(/\s+/)[0];
  }
  return doc.title.trim().split(/\s+/)[0] || "Biodata";
}

function safe(s: string) {
  return s.replace(/[^\w\-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || "Biodata";
}

export default function BiodataPreviewPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [user, setUser] = React.useState<AuthUser | null>(auth.currentUser);
  const [doc, setDoc] = React.useState<BiodataDocument | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [privacyOpen, setPrivacyOpen] = React.useState(false);
  const [pending, setPending] = React.useState<"pdf" | "png" | "jpeg" | "print" | null>(null);
  const [visibility, setVisibility] = React.useState<BiodataVisibility | null>(null);
  const rootRef = React.useRef<HTMLDivElement>(null);

  const [shareOpen, setShareOpen] = React.useState(false);
  const [shareWatermark, setShareWatermark] = React.useState("");
  const [shareExpiry, setShareExpiry] = React.useState<"1" | "7" | "30" | "never">("7");
  const [shareBusy, setShareBusy] = React.useState(false);
  const [shareUrl, setShareUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) router.replace(`/login?next=${encodeURIComponent(`/biodata/${id}/preview`)}`);
    });
    return unsub;
  }, [router, id]);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!id) return;
      if (!user) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const d = await getDocument(id);
        if (cancelled) return;
        setDoc(d);
        if (d) setVisibility(d.visibility);
      } catch (e) {
        toast({
          title: "Load failed",
          description: e instanceof Error ? e.message : "Could not load",
          variant: "destructive",
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, user]);

  function startExport(kind: "pdf" | "png" | "jpeg" | "print") {
    setPending(kind);
    setPrivacyOpen(true);
  }

  function openShareDialog() {
    setShareWatermark("");
    setShareExpiry("7");
    setShareUrl(null);
    setShareBusy(false);
    setShareOpen(true);
  }

  function expiresAtFromChoice(choice: "1" | "7" | "30" | "never"): string | null {
    if (choice === "never") return null;
    const days = Number(choice);
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
  }

  async function handleCreateShareLink() {
    if (!user || !doc || !visibility) {
      toast({ title: "Sign in required", variant: "destructive" });
      return;
    }
    setShareBusy(true);
    try {
      const link = await createShareLink({
        documentId: doc.id,
        ownerId: user.uid,
        snapshot: {
          content: doc.content,
          design: doc.design,
          visibility,
          sectionOrder: doc.sectionOrder,
          templateId: doc.templateId,
          title: doc.title,
        },
        expiresAt: expiresAtFromChoice(shareExpiry),
        watermark: shareWatermark.trim() || null,
      });
      const url = `${window.location.origin}/share/biodata/${link.token}`;
      setShareUrl(url);
      toast({ title: "Share link created" });
    } catch (e) {
      toast({
        title: "Could not create link",
        description: e instanceof Error ? e.message : "Try again",
        variant: "destructive",
      });
    } finally {
      setShareBusy(false);
    }
  }

  async function copyShareUrl() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({ title: "Copied to clipboard" });
    } catch {
      toast({ title: "Copy failed", description: "Select and copy the URL manually.", variant: "destructive" });
    }
  }

  async function finishExport(vis: BiodataVisibility) {
    if (!doc || !rootRef.current || !pending) return;
    setVisibility(vis);
    const kind = pending;
    setPending(null);
    await new Promise((r) => setTimeout(r, 80));
    const tplName = getTemplate(doc.templateId)?.name ?? doc.templateId;
    const base = `${safe(firstName(doc))}-Biodata-${safe(tplName)}`;
    try {
      if (kind === "pdf") {
        await exportDocumentPdf(rootRef.current, `${base}.pdf`, doc.design.pageSize);
      } else if (kind === "png") {
        await exportDocumentImage(rootRef.current, "png", `${base}.png`);
      } else if (kind === "jpeg") {
        await exportDocumentImage(rootRef.current, "jpeg", `${base}.jpg`);
      } else {
        printDocument(rootRef.current);
      }
      try {
        await updateDocument(doc.id, {
          visibility: vis,
          lastExportedAt: new Date().toISOString(),
          documentVersion: doc.documentVersion,
        });
      } catch {
        /* non-blocking */
      }
      toast({ title: kind === "print" ? "Print dialog opened" : "Exported" });
    } catch (e) {
      toast({
        title: "Export failed",
        description: e instanceof Error ? e.message : "Try again",
        variant: "destructive",
      });
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#7027E8]" />
      </div>
    );
  }

  if (!doc || !visibility) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-xl font-semibold">Biodata not found</h1>
        <Button className="mt-4 bg-[#7027E8] hover:bg-[#5a1ec0]" asChild>
          <Link href="/biodata">Back to Studio</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4 px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-[#7027E8]">Preview</p>
          <h1 className="text-xl font-semibold">{doc.title}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href={`/biodata/${doc.id}/edit`}>Edit</Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="bg-[#7027E8] hover:bg-[#5a1ec0]">
                <Download className="mr-1 h-4 w-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => startExport("pdf")}>PDF</DropdownMenuItem>
              <DropdownMenuItem onClick={() => startExport("png")}>PNG</DropdownMenuItem>
              <DropdownMenuItem onClick={() => startExport("jpeg")}>JPEG</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" onClick={openShareDialog}>
            <Link2 className="mr-1 h-4 w-4" />
            Share link
          </Button>
          <Button variant="outline" onClick={() => startExport("print")}>
            <Printer className="mr-1 h-4 w-4" />
            Print
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-[#7027E8]/15 bg-[#F3EEE8]/50 p-4">
        <div ref={rootRef} className="mx-auto w-fit">
          <DocumentRenderer
            content={doc.content}
            design={doc.design}
            visibility={visibility}
            sectionOrder={doc.sectionOrder}
            templateId={doc.templateId}
          />
        </div>
      </div>

      <PrivacyReview
        open={privacyOpen}
        onOpenChange={setPrivacyOpen}
        visibility={visibility}
        onVisibilityChange={setVisibility}
        onContinueExport={(vis) => void finishExport(vis)}
        onUsePrivateVersion={(vis) => void finishExport(vis)}
        onCancel={() => setPending(null)}
      />

      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent className="bg-[#FBF8F4] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share link</DialogTitle>
            <DialogDescription>
              Create a link to a snapshot of this biodata. Downloaded copies cannot be revoked.
              Revoking only disables this link.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="preview-share-watermark">Recipient watermark (optional)</Label>
              <Input
                id="preview-share-watermark"
                placeholder="e.g. For Priya's family"
                value={shareWatermark}
                onChange={(e) => setShareWatermark(e.target.value)}
                disabled={Boolean(shareUrl)}
              />
            </div>
            <div className="space-y-2">
              <Label>Expires</Label>
              <Select
                value={shareExpiry}
                onValueChange={(v) => setShareExpiry(v as "1" | "7" | "30" | "never")}
                disabled={Boolean(shareUrl)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 day</SelectItem>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="never">Never</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {shareUrl ? (
              <div className="space-y-2">
                <Label htmlFor="preview-share-url">Link URL</Label>
                <div className="flex gap-2">
                  <Input id="preview-share-url" readOnly value={shareUrl} className="font-mono text-xs" />
                  <Button type="button" variant="outline" onClick={() => void copyShareUrl()}>
                    <Copy className="mr-1 h-3.5 w-3.5" />
                    Copy
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShareOpen(false)}>
              {shareUrl ? "Done" : "Cancel"}
            </Button>
            {!shareUrl ? (
              <Button
                className="bg-[#7027E8] hover:bg-[#5a1ec0]"
                disabled={shareBusy}
                onClick={() => void handleCreateShareLink()}
              >
                {shareBusy ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : null}
                Create
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => {
                  setShareUrl(null);
                  setShareWatermark("");
                  setShareExpiry("7");
                }}
              >
                Create another
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
