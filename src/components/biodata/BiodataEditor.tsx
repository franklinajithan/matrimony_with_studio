"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
  Link2,
  Loader2,
  Plus,
  Redo2,
  RefreshCw,
  Save,
  Sparkles,
  Undo2,
} from "lucide-react";
import { auth, onAuthStateChanged, type AuthUser } from "@/lib/supabase/auth";
import { getProfile } from "@/lib/supabase/profiles";
import {
  getDocument,
  updateDocument,
  duplicateDocument,
  createShareLink,
  BiodataVersionConflictError,
} from "@/lib/supabase/biodata";
import type {
  BiodataContent,
  BiodataDesign,
  BiodataDocument,
  BiodataField,
  BiodataLanguage,
  BiodataSection,
  BiodataVisibility,
} from "@/lib/biodata/types";
import { TEMPLATES, getTemplate } from "@/lib/biodata/templates";
import {
  defaultDesignForTemplate,
  switchTemplateDesign,
} from "@/lib/biodata/defaults";
import { importProfileToContent } from "@/lib/biodata/import-profile";
import { DocumentRenderer } from "@/components/biodata/DocumentRenderer";
import { PrivacyReview } from "@/components/biodata/PrivacyReview";
import {
  exportDocumentPdf,
  exportDocumentImage,
  printDocument,
} from "@/components/biodata/export";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type SaveStatus = "Idle" | "Saving" | "Saved" | "Could not save";

type EditorSnapshot = {
  title: string;
  content: BiodataContent;
  design: BiodataDesign;
  visibility: BiodataVisibility;
  sectionOrder: string[];
  language: BiodataLanguage;
  templateId: string;
};

type ProfileDiff = {
  key: string;
  label: string;
  current: string;
  incoming: string;
  apply: (content: BiodataContent) => BiodataContent;
};

function cloneSnapshot(s: EditorSnapshot): EditorSnapshot {
  return structuredClone(s);
}

function snapshotsEqual(a: EditorSnapshot, b: EditorSnapshot): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function firstNameFromDoc(content: BiodataContent, title: string): string {
  for (const section of content.sections) {
    const nameField = section.fields.find(
      (f) => f.id === "name" || f.id.toLowerCase().includes("name")
    );
    if (nameField?.value?.trim()) {
      return nameField.value.trim().split(/\s+/)[0];
    }
  }
  const fromTitle = title.trim().split(/\s+/)[0];
  return fromTitle || "Biodata";
}

function sanitizeFilenamePart(s: string): string {
  return s.replace(/[^\w\-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || "Biodata";
}

function uid(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function orderedSections(content: BiodataContent, order: string[]): BiodataSection[] {
  const map = new Map(content.sections.map((s) => [s.id, s]));
  const ordered: BiodataSection[] = [];
  for (const id of order) {
    const s = map.get(id);
    if (s) {
      ordered.push(s);
      map.delete(id);
    }
  }
  for (const s of map.values()) ordered.push(s);
  return ordered;
}

function buildProfileDiffs(
  current: BiodataContent,
  incoming: BiodataContent
): ProfileDiff[] {
  const diffs: ProfileDiff[] = [];
  const currentIntro = current.introduction.trim();
  const nextIntro = incoming.introduction.trim();
  if (nextIntro && nextIntro !== currentIntro) {
    diffs.push({
      key: "introduction",
      label: "Introduction",
      current: currentIntro || "(empty)",
      incoming: nextIntro,
      apply: (c) => ({ ...c, introduction: nextIntro }),
    });
  }

  if (incoming.photoUrl && incoming.photoUrl !== current.photoUrl) {
    const url = incoming.photoUrl;
    diffs.push({
      key: "photo",
      label: "Photo",
      current: current.photoUrl || "(none)",
      incoming: url,
      apply: (c) => ({ ...c, photoUrl: url }),
    });
  }

  for (const section of incoming.sections) {
    for (const field of section.fields) {
      const existing = current.sections
        .flatMap((s) => s.fields.map((f) => ({ sectionId: s.id, field: f })))
        .find((x) => x.field.id === field.id);
      const currentVal = existing?.field.value?.trim() ?? "";
      const incomingVal = field.value.trim();
      if (!incomingVal || incomingVal === currentVal) continue;
      diffs.push({
        key: `${section.id}:${field.id}`,
        label: field.label || field.id,
        current: currentVal || "(empty)",
        incoming: incomingVal,
        apply: (c) => {
          const sections = c.sections.map((s) => {
            if (s.id !== section.id && !s.fields.some((f) => f.id === field.id)) {
              return s;
            }
            const hasField = s.fields.some((f) => f.id === field.id);
            if (hasField) {
              return {
                ...s,
                fields: s.fields.map((f) =>
                  f.id === field.id ? { ...f, value: incomingVal, label: field.label || f.label } : f
                ),
              };
            }
            if (s.id === section.id) {
              return { ...s, fields: [...s.fields, { ...field, value: incomingVal }] };
            }
            return s;
          });
          const hasSection = sections.some((s) => s.id === section.id);
          if (!hasSection) {
            sections.push({
              ...section,
              fields: [{ ...field, value: incomingVal }],
            });
          }
          return { ...c, sections };
        },
      });
    }
  }
  return diffs;
}

export function BiodataEditor({ documentId }: { documentId: string }) {
  const router = useRouter();
  const [user, setUser] = React.useState<AuthUser | null>(auth.currentUser);
  const [loading, setLoading] = React.useState(true);
  const [notFound, setNotFound] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState<BiodataContent>({ introduction: "", sections: [] });
  const [design, setDesign] = React.useState<BiodataDesign>(defaultDesignForTemplate("violet-connection"));
  const [visibility, setVisibility] = React.useState<BiodataVisibility>({
    includePhoto: false,
    includeDob: false,
    includePhone: false,
    includeEmail: false,
    includeExactAddress: false,
    includeFamilyContacts: false,
    includeReligious: false,
    includeHoroscope: false,
  });
  const [sectionOrder, setSectionOrder] = React.useState<string[]>([]);
  const [language, setLanguage] = React.useState<BiodataLanguage>("en");
  const [templateId, setTemplateId] = React.useState("violet-connection");
  const [documentVersion, setDocumentVersion] = React.useState(1);

  const [saveStatus, setSaveStatus] = React.useState<SaveStatus>("Idle");
  const [dirty, setDirty] = React.useState(false);
  const [mobileTab, setMobileTab] = React.useState("content");
  const [previewZoom, setPreviewZoom] = React.useState(0.45);

  const [renameOpen, setRenameOpen] = React.useState(false);
  const [renameValue, setRenameValue] = React.useState("");
  const [privacyOpen, setPrivacyOpen] = React.useState(false);
  const [pendingExport, setPendingExport] = React.useState<"pdf" | "png" | "jpeg" | "print" | null>(null);
  const [refreshOpen, setRefreshOpen] = React.useState(false);
  const [profileDiffs, setProfileDiffs] = React.useState<ProfileDiff[]>([]);
  const [selectedDiffs, setSelectedDiffs] = React.useState<Set<string>>(new Set());
  const [aiOpen, setAiOpen] = React.useState(false);
  const [aiBusy, setAiBusy] = React.useState(false);
  const [aiProposed, setAiProposed] = React.useState<string | null>(null);
  const [aiUnavailable, setAiUnavailable] = React.useState(false);

  const [shareOpen, setShareOpen] = React.useState(false);
  const [shareWatermark, setShareWatermark] = React.useState("");
  const [shareExpiry, setShareExpiry] = React.useState<"1" | "7" | "30" | "never">("7");
  const [shareBusy, setShareBusy] = React.useState(false);
  const [shareUrl, setShareUrl] = React.useState<string | null>(null);

  const exportRef = React.useRef<HTMLDivElement>(null);
  const skipHistory = React.useRef(false);
  const historyPast = React.useRef<EditorSnapshot[]>([]);
  const historyFuture = React.useRef<EditorSnapshot[]>([]);
  const lastSaved = React.useRef<EditorSnapshot | null>(null);
  const hydrated = React.useRef(false);

  const snapshot = React.useCallback((): EditorSnapshot => {
    return {
      title,
      content,
      design,
      visibility,
      sectionOrder,
      language,
      templateId,
    };
  }, [title, content, design, visibility, sectionOrder, language, templateId]);

  React.useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) router.replace(`/login?next=${encodeURIComponent(`/biodata/${documentId}/edit`)}`);
    });
    return unsub;
  }, [router, documentId]);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError(null);
      setNotFound(false);
      try {
        const doc = await getDocument(documentId);
        if (cancelled) return;
        if (!doc) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        applyDoc(doc, true);
        hydrated.current = true;
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : "Failed to load document");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [documentId]);

  function applyDoc(doc: BiodataDocument, resetHistory: boolean) {
    setTitle(doc.title);
    setContent(doc.content);
    setDesign(doc.design);
    setVisibility(doc.visibility);
    setSectionOrder(doc.sectionOrder.length ? doc.sectionOrder : doc.content.sections.map((s) => s.id));
    setLanguage(doc.language);
    setTemplateId(doc.templateId);
    setDocumentVersion(doc.documentVersion);
    const snap: EditorSnapshot = {
      title: doc.title,
      content: doc.content,
      design: doc.design,
      visibility: doc.visibility,
      sectionOrder: doc.sectionOrder.length ? doc.sectionOrder : doc.content.sections.map((s) => s.id),
      language: doc.language,
      templateId: doc.templateId,
    };
    lastSaved.current = cloneSnapshot(snap);
    if (resetHistory) {
      historyPast.current = [];
      historyFuture.current = [];
    }
    setDirty(false);
    setSaveStatus("Idle");
  }

  const pushHistory = React.useCallback(() => {
    if (skipHistory.current || !hydrated.current) return;
    const snap = cloneSnapshot(snapshot());
    const last = historyPast.current[historyPast.current.length - 1];
    if (last && snapshotsEqual(last, snap)) return;
    historyPast.current = [...historyPast.current.slice(-49), snap];
    historyFuture.current = [];
  }, [snapshot]);

  React.useEffect(() => {
    if (!hydrated.current) return;
    const current = snapshot();
    const saved = lastSaved.current;
    setDirty(!saved || !snapshotsEqual(current, saved));
  }, [snapshot]);

  React.useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const saveNow = React.useCallback(async () => {
    if (!user || !hydrated.current) return;
    const snap = snapshot();
    if (lastSaved.current && snapshotsEqual(snap, lastSaved.current)) {
      setSaveStatus("Saved");
      return;
    }
    setSaveStatus("Saving");
    try {
      const updated = await updateDocument(documentId, {
        title: snap.title,
        templateId: snap.templateId,
        templateVersion: snap.design.templateVersion,
        language: snap.language,
        content: snap.content,
        design: snap.design,
        visibility: snap.visibility,
        sectionOrder: snap.sectionOrder,
        documentVersion,
      });
      setDocumentVersion(updated.documentVersion);
      lastSaved.current = cloneSnapshot(snap);
      setDirty(false);
      setSaveStatus("Saved");
    } catch (e) {
      setSaveStatus("Could not save");
      if (e instanceof BiodataVersionConflictError) {
        toast({
          title: "Version conflict",
          description: "This document was updated elsewhere. Reload and try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Save failed",
          description: e instanceof Error ? e.message : "Could not save",
          variant: "destructive",
        });
      }
    }
  }, [user, snapshot, documentId, documentVersion]);

  React.useEffect(() => {
    if (!dirty || !hydrated.current) return;
    setSaveStatus("Idle");
    const t = window.setTimeout(() => {
      void saveNow();
    }, 800);
    return () => window.clearTimeout(t);
  }, [dirty, title, content, design, visibility, sectionOrder, language, templateId, saveNow]);

  function withHistory<T>(updater: () => T): T {
    pushHistory();
    skipHistory.current = true;
    const result = updater();
    queueMicrotask(() => {
      skipHistory.current = false;
    });
    return result;
  }

  function undo() {
    const past = historyPast.current;
    if (past.length === 0) return;
    const prev = past[past.length - 1];
    historyPast.current = past.slice(0, -1);
    historyFuture.current = [cloneSnapshot(snapshot()), ...historyFuture.current].slice(0, 50);
    skipHistory.current = true;
    setTitle(prev.title);
    setContent(prev.content);
    setDesign(prev.design);
    setVisibility(prev.visibility);
    setSectionOrder(prev.sectionOrder);
    setLanguage(prev.language);
    setTemplateId(prev.templateId);
    queueMicrotask(() => {
      skipHistory.current = false;
    });
  }

  function redo() {
    const future = historyFuture.current;
    if (future.length === 0) return;
    const next = future[0];
    historyFuture.current = future.slice(1);
    historyPast.current = [...historyPast.current, cloneSnapshot(snapshot())].slice(-50);
    skipHistory.current = true;
    setTitle(next.title);
    setContent(next.content);
    setDesign(next.design);
    setVisibility(next.visibility);
    setSectionOrder(next.sectionOrder);
    setLanguage(next.language);
    setTemplateId(next.templateId);
    queueMicrotask(() => {
      skipHistory.current = false;
    });
  }

  function updateSection(sectionId: string, patch: Partial<BiodataSection>) {
    withHistory(() => {
      setContent((c) => ({
        ...c,
        sections: c.sections.map((s) => (s.id === sectionId ? { ...s, ...patch } : s)),
      }));
    });
  }

  function updateField(sectionId: string, fieldId: string, patch: Partial<BiodataField>) {
    withHistory(() => {
      setContent((c) => ({
        ...c,
        sections: c.sections.map((s) =>
          s.id !== sectionId
            ? s
            : {
                ...s,
                fields: s.fields.map((f) => (f.id === fieldId ? { ...f, ...patch } : f)),
              }
        ),
      }));
    });
  }

  function moveSection(sectionId: string, dir: -1 | 1) {
    withHistory(() => {
      setSectionOrder((order) => {
        const idx = order.indexOf(sectionId);
        if (idx < 0) return order;
        const next = [...order];
        const j = idx + dir;
        if (j < 0 || j >= next.length) return order;
        [next[idx], next[j]] = [next[j], next[idx]];
        return next;
      });
    });
  }

  function addCustomSection() {
    withHistory(() => {
      const id = uid("custom");
      const section: BiodataSection = {
        id,
        title: "Custom section",
        visible: true,
        custom: true,
        fields: [
          {
            id: uid("field"),
            label: "Field",
            value: "",
            visible: true,
          },
        ],
      };
      setContent((c) => ({ ...c, sections: [...c.sections, section] }));
      setSectionOrder((o) => [...o, id]);
    });
  }

  function addCustomField(sectionId: string) {
    withHistory(() => {
      setContent((c) => ({
        ...c,
        sections: c.sections.map((s) =>
          s.id !== sectionId
            ? s
            : {
                ...s,
                fields: [
                  ...s.fields,
                  { id: uid("field"), label: "Custom field", value: "", visible: true },
                ],
              }
        ),
      }));
    });
  }

  function changeTemplate(nextId: string) {
    withHistory(() => {
      setTemplateId(nextId);
      setDesign((d) => {
        try {
          return switchTemplateDesign(d, nextId);
        } catch {
          return { ...defaultDesignForTemplate(nextId), pageSize: d.pageSize, showBranding: d.showBranding };
        }
      });
    });
  }

  function resetDesign() {
    withHistory(() => {
      setDesign(defaultDesignForTemplate(templateId));
    });
  }

  async function handleDuplicate() {
    try {
      const copy = await duplicateDocument(documentId);
      toast({ title: "Duplicated", description: "Opening your copy…" });
      router.push(`/biodata/${copy.id}/edit`);
    } catch (e) {
      toast({
        title: "Duplicate failed",
        description: e instanceof Error ? e.message : "Could not duplicate",
        variant: "destructive",
      });
    }
  }

  async function handleRename() {
    const next = renameValue.trim();
    if (!next) return;
    withHistory(() => setTitle(next));
    setRenameOpen(false);
  }

  async function handleRefreshFromProfile() {
    if (!user) return;
    try {
      const profile = await getProfile(user.uid);
      if (!profile) {
        toast({ title: "No profile", description: "Complete your profile first.", variant: "destructive" });
        return;
      }
      const imported = importProfileToContent(profile, language);
      const diffs = buildProfileDiffs(content, imported.content);
      if (diffs.length === 0) {
        toast({ title: "Up to date", description: "No profile field changes to apply." });
        return;
      }
      setProfileDiffs(diffs);
      setSelectedDiffs(new Set(diffs.map((d) => d.key)));
      setRefreshOpen(true);
    } catch (e) {
      toast({
        title: "Refresh failed",
        description: e instanceof Error ? e.message : "Could not load profile",
        variant: "destructive",
      });
    }
  }

  function applySelectedDiffs() {
    withHistory(() => {
      setContent((c) => {
        let next = c;
        for (const diff of profileDiffs) {
          if (selectedDiffs.has(diff.key)) next = diff.apply(next);
        }
        const orderIds = next.sections.map((s) => s.id);
        setSectionOrder((prev) => {
          const merged = [...prev.filter((id) => orderIds.includes(id))];
          for (const id of orderIds) {
            if (!merged.includes(id)) merged.push(id);
          }
          return merged;
        });
        return next;
      });
    });
    setRefreshOpen(false);
    toast({ title: "Updated", description: "Selected profile fields applied." });
  }

  async function runAiAssist(action: string) {
    setAiBusy(true);
    setAiUnavailable(false);
    setAiProposed(null);
    try {
      const res = await fetch("/api/biodata/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, text: content.introduction }),
      });
      if (res.status === 503) {
        setAiUnavailable(true);
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Assist failed");
      setAiProposed(data.proposedText);
    } catch (e) {
      toast({
        title: "AI assist failed",
        description: e instanceof Error ? e.message : "Try again later",
        variant: "destructive",
      });
    } finally {
      setAiBusy(false);
    }
  }

  function exportFilename(ext: string) {
    const first = sanitizeFilenamePart(firstNameFromDoc(content, title));
    const tpl = sanitizeFilenamePart(getTemplate(templateId)?.name ?? templateId);
    return `${first}-Biodata-${tpl}.${ext}`;
  }

  function startExport(kind: "pdf" | "png" | "jpeg" | "print") {
    setPendingExport(kind);
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
    if (!user) {
      toast({ title: "Sign in required", variant: "destructive" });
      return;
    }
    setShareBusy(true);
    try {
      const snap = snapshot();
      const link = await createShareLink({
        documentId,
        ownerId: user.uid,
        snapshot: {
          content: snap.content,
          design: snap.design,
          visibility: snap.visibility,
          sectionOrder: snap.sectionOrder,
          templateId: snap.templateId,
          title: snap.title,
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
    withHistory(() => setVisibility(vis));
    const kind = pendingExport;
    setPendingExport(null);
    await new Promise((r) => setTimeout(r, 50));
    const el = exportRef.current;
    if (!el || !kind) return;
    try {
      if (kind === "pdf") await exportDocumentPdf(el, exportFilename("pdf"), design.pageSize);
      else if (kind === "png") await exportDocumentImage(el, "png", exportFilename("png"));
      else if (kind === "jpeg") await exportDocumentImage(el, "jpeg", exportFilename("jpg"));
      else printDocument(el);
      toast({ title: kind === "print" ? "Print dialog opened" : "Exported" });
    } catch (e) {
      toast({
        title: "Export failed",
        description: e instanceof Error ? e.message : "Could not export",
        variant: "destructive",
      });
    }
  }

  React.useEffect(() => {
    const updateZoom = () => {
      if (typeof window === "undefined") return;
      const w = window.innerWidth;
      if (w < 1024) {
        const pageW = design.pageSize === "letter" ? 816 : 794;
        setPreviewZoom(Math.min(0.92, Math.max(0.28, (w - 32) / pageW)));
      } else {
        setPreviewZoom(0.55);
      }
    };
    updateZoom();
    window.addEventListener("resize", updateZoom);
    return () => window.removeEventListener("resize", updateZoom);
  }, [design.pageSize]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-[#FBF8F4]">
        <Loader2 className="h-8 w-8 animate-spin text-[#7027E8]" />
      </div>
    );
  }

  if (notFound || loadError) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-xl font-semibold text-[#1a1a1a]">
          {notFound ? "Biodata not found" : "Could not load biodata"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {loadError || "This document may have been deleted or you may not have access."}
        </p>
        <Button className="mt-6 bg-[#7027E8] hover:bg-[#5a1ec0]" onClick={() => router.push("/biodata")}>
          Back to Studio
        </Button>
      </div>
    );
  }

  const sections = orderedSections(content, sectionOrder);
  const template = getTemplate(templateId);

  const contentPanel = (
    <div className="space-y-4 p-3">
      <div className="space-y-2">
        <Label>Document title</Label>
        <Input
          value={title}
          onChange={(e) => withHistory(() => setTitle(e.target.value))}
          className="bg-white"
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Label>Introduction</Label>
          <Button type="button" size="sm" variant="outline" onClick={() => setAiOpen(true)}>
            <Sparkles className="mr-1 h-3.5 w-3.5" />
            AI assist
          </Button>
        </div>
        <Textarea
          value={content.introduction}
          onChange={(e) =>
            withHistory(() => setContent((c) => ({ ...c, introduction: e.target.value })))
          }
          rows={5}
          className="bg-white"
        />
      </div>

      {sections.map((section, idx) => (
        <div
          key={section.id}
          className="rounded-lg border border-[#7027E8]/15 bg-white/80 p-3 space-y-3"
        >
          <div className="flex items-start gap-2">
            <div className="flex-1 space-y-2">
              <Input
                value={section.title}
                onChange={(e) => updateSection(section.id, { title: e.target.value })}
                aria-label="Section title"
              />
              <div className="flex items-center gap-2">
                <Switch
                  checked={section.visible}
                  onCheckedChange={(v) => updateSection(section.id, { visible: v })}
                  id={`sec-vis-${section.id}`}
                />
                <Label htmlFor={`sec-vis-${section.id}`} className="text-xs">
                  Show section
                </Label>
                {section.custom ? <Badge variant="outline">Custom</Badge> : null}
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <Button
                type="button"
                size="icon"
                variant="ghost"
                aria-label="Move section up"
                disabled={idx === 0}
                onClick={() => moveSection(section.id, -1)}
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                aria-label="Move section down"
                disabled={idx === sections.length - 1}
                onClick={() => moveSection(section.id, 1)}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {section.fields.map((field) => (
            <div key={field.id} className="grid gap-2 rounded-md border border-[#7027E8]/10 p-2">
              <div className="flex items-center gap-2">
                <Input
                  value={field.label}
                  onChange={(e) => updateField(section.id, field.id, { label: e.target.value })}
                  className="h-8"
                  aria-label="Field label"
                />
                <Switch
                  checked={field.visible}
                  onCheckedChange={(v) => updateField(section.id, field.id, { visible: v })}
                  aria-label="Show field"
                />
              </div>
              <Textarea
                value={field.value}
                onChange={(e) => updateField(section.id, field.id, { value: e.target.value })}
                rows={2}
                className="min-h-[60px]"
                aria-label={field.label || "Field value"}
              />
            </div>
          ))}
          <Button type="button" size="sm" variant="outline" onClick={() => addCustomField(section.id)}>
            <Plus className="mr-1 h-3.5 w-3.5" />
            Add field
          </Button>
        </div>
      ))}

      <Button type="button" variant="outline" className="w-full" onClick={addCustomSection}>
        <Plus className="mr-1 h-4 w-4" />
        Add custom section
      </Button>
    </div>
  );

  const designPanel = (
    <div className="space-y-5 p-3">
      <div className="space-y-2">
        <Label>Template</Label>
        <Select value={templateId} onValueChange={changeTemplate}>
          <SelectTrigger className="bg-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TEMPLATES.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Accent colour</Label>
        <div className="flex items-center gap-2">
          <Input
            type="color"
            className="h-10 w-14 p-1"
            value={design.accentColor || design.palette.accent || "#7027E8"}
            onChange={(e) =>
              withHistory(() =>
                setDesign((d) => ({
                  ...d,
                  accentColor: e.target.value,
                  palette: { ...d.palette, accent: e.target.value },
                }))
              )
            }
          />
          <Input
            value={design.accentColor || design.palette.accent || "#7027E8"}
            onChange={(e) =>
              withHistory(() =>
                setDesign((d) => ({
                  ...d,
                  accentColor: e.target.value,
                  palette: { ...d.palette, accent: e.target.value },
                }))
              )
            }
          />
        </div>
      </div>

      {(
        [
          ["fontSize", "Font size", 0.8, 1.4, 0.05],
          ["spacing", "Spacing", 0.8, 1.4, 0.05],
          ["borderIntensity", "Border intensity", 0, 1, 0.05],
          ["artworkIntensity", "Artwork intensity", 0, 1, 0.05],
        ] as const
      ).map(([key, label, min, max, step]) => (
        <div key={key} className="space-y-2">
          <div className="flex justify-between text-sm">
            <Label>{label}</Label>
            <span className="text-muted-foreground">{Number(design[key]).toFixed(2)}</span>
          </div>
          <Slider
            min={min}
            max={max}
            step={step}
            value={[Number(design[key])]}
            onValueChange={([v]) => withHistory(() => setDesign((d) => ({ ...d, [key]: v })))}
          />
        </div>
      ))}

      <div className="flex items-center justify-between gap-2">
        <Label htmlFor="rel-art">Religious art</Label>
        <Switch
          id="rel-art"
          checked={design.showReligiousArt}
          disabled={!template?.supportsReligiousArt}
          onCheckedChange={(v) => withHistory(() => setDesign((d) => ({ ...d, showReligiousArt: v })))}
        />
      </div>

      <div className="space-y-2">
        <Label>Photo position</Label>
        <Select
          value={design.photoPosition}
          onValueChange={(v: BiodataDesign["photoPosition"]) =>
            withHistory(() => setDesign((d) => ({ ...d, photoPosition: v })))
          }
        >
          <SelectTrigger className="bg-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="left">Left</SelectItem>
            <SelectItem value="right">Right</SelectItem>
            <SelectItem value="top">Top</SelectItem>
            <SelectItem value="none">None</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Photo shape</Label>
        <Select
          value={design.photoShape}
          onValueChange={(v: BiodataDesign["photoShape"]) =>
            withHistory(() => setDesign((d) => ({ ...d, photoShape: v })))
          }
        >
          <SelectTrigger className="bg-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="circle">Circle</SelectItem>
            <SelectItem value="rounded">Rounded</SelectItem>
            <SelectItem value="square">Square</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Page size</Label>
        <Select
          value={design.pageSize}
          onValueChange={(v: BiodataDesign["pageSize"]) =>
            withHistory(() => setDesign((d) => ({ ...d, pageSize: v })))
          }
        >
          <SelectTrigger className="bg-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="a4">A4</SelectItem>
            <SelectItem value="letter">Letter</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="branding">Show branding</Label>
        <Switch
          id="branding"
          checked={design.showBranding}
          onCheckedChange={(v) => withHistory(() => setDesign((d) => ({ ...d, showBranding: v })))}
        />
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="bilingual">Bilingual labels</Label>
        <Switch
          id="bilingual"
          checked={design.bilingualLabels}
          onCheckedChange={(v) => withHistory(() => setDesign((d) => ({ ...d, bilingualLabels: v })))}
        />
      </div>

      <div className="space-y-2">
        <Label>Language</Label>
        <Select
          value={language}
          onValueChange={(v: BiodataLanguage) => withHistory(() => setLanguage(v))}
        >
          <SelectTrigger className="bg-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="ta">Tamil</SelectItem>
            <SelectItem value="si">Sinhala</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button type="button" variant="outline" className="w-full" onClick={resetDesign}>
        Reset design
      </Button>
    </div>
  );

  const rendererProps = {
    content,
    design,
    visibility,
    sectionOrder,
    templateId,
  };

  const preview = (
    <div className="flex justify-center overflow-x-hidden p-2">
      <div
        className="origin-top"
        style={{ transform: `scale(${previewZoom})`, width: design.pageSize === "letter" ? 816 : 794 }}
      >
        <DocumentRenderer {...rendererProps} />
      </div>
    </div>
  );

  const actionBar = (
    <div
      className={cn(
        "sticky z-30 flex flex-wrap items-center gap-2 border-t border-[#7027E8]/15 bg-[#FBF8F4]/95 px-3 py-2 backdrop-blur",
        "bottom-20 lg:bottom-0"
      )}
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
    >
      <Badge
        variant="outline"
        className={cn(
          "border-[#7027E8]/30",
          saveStatus === "Could not save" && "border-[#FF6F72] text-[#FF6F72]",
          saveStatus === "Saved" && "text-[#7027E8]"
        )}
      >
        {saveStatus === "Saving" ? (
          <span className="inline-flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" /> Saving
          </span>
        ) : (
          saveStatus
        )}
      </Badge>
      <Button type="button" size="sm" variant="ghost" onClick={undo} aria-label="Undo">
        <Undo2 className="h-4 w-4" />
      </Button>
      <Button type="button" size="sm" variant="ghost" onClick={redo} aria-label="Redo">
        <Redo2 className="h-4 w-4" />
      </Button>
      <Button type="button" size="sm" variant="outline" onClick={() => void saveNow()}>
        <Save className="mr-1 h-3.5 w-3.5" />
        Save
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => {
          setRenameValue(title);
          setRenameOpen(true);
        }}
      >
        Rename
      </Button>
      <Button type="button" size="sm" variant="outline" onClick={() => void handleDuplicate()}>
        <Copy className="mr-1 h-3.5 w-3.5" />
        Duplicate
      </Button>
      <Button type="button" size="sm" variant="outline" onClick={() => void handleRefreshFromProfile()}>
        <RefreshCw className="mr-1 h-3.5 w-3.5" />
        Refresh profile
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" size="sm" className="bg-[#7027E8] text-white hover:bg-[#5a1ec0]">
            <Download className="mr-1 h-3.5 w-3.5" />
            Export
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => startExport("pdf")}>PDF</DropdownMenuItem>
          <DropdownMenuItem onClick={() => startExport("png")}>PNG</DropdownMenuItem>
          <DropdownMenuItem onClick={() => startExport("jpeg")}>JPEG</DropdownMenuItem>
          <DropdownMenuItem onClick={() => startExport("print")}>Print</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Button type="button" size="sm" variant="outline" onClick={openShareDialog}>
        <Link2 className="mr-1 h-3.5 w-3.5" />
        Share link
      </Button>
      <Button type="button" size="sm" variant="ghost" onClick={() => router.push(`/biodata/${documentId}/preview`)}>
        Preview page
      </Button>
    </div>
  );

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#FBF8F4] text-[#1a1a1a]">
      {/* Off-screen full-size renderer for export/print (always mounted, not display:none) */}
      <div
        aria-hidden
        className="pointer-events-none fixed left-[-10000px] top-0 z-[-1]"
      >
        <div ref={exportRef}>
          <DocumentRenderer {...rendererProps} />
        </div>
      </div>

      <div className="border-b border-[#7027E8]/10 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-[#7027E8]">Biodata Studio</p>
            <h1 className="text-lg font-semibold">{title || "Untitled biodata"}</h1>
          </div>
          <Button variant="ghost" size="sm" onClick={() => router.push("/biodata")}>
            Studio home
          </Button>
        </div>
      </div>

      {/* Desktop */}
      <div className="hidden lg:grid lg:grid-cols-[280px_minmax(0,1fr)_280px] lg:gap-0">
        <ScrollArea className="h-[calc(100vh-9rem)] border-r border-[#7027E8]/10">
          <h2 className="sticky top-0 z-10 bg-[#FBF8F4] px-3 py-2 text-sm font-medium text-[#7027E8]">
            Content
          </h2>
          {contentPanel}
        </ScrollArea>
        <ScrollArea className="h-[calc(100vh-9rem)] bg-[#F3EEE8]/60">{preview}</ScrollArea>
        <ScrollArea className="h-[calc(100vh-9rem)] border-l border-[#7027E8]/10">
          <h2 className="sticky top-0 z-10 bg-[#FBF8F4] px-3 py-2 text-sm font-medium text-[#7027E8]">
            Design
          </h2>
          {designPanel}
        </ScrollArea>
      </div>
      <div className="hidden lg:block">{actionBar}</div>

      {/* Mobile */}
      <div className="lg:hidden">
        <Tabs value={mobileTab} onValueChange={setMobileTab} className="w-full">
          <TabsList className="mx-3 mt-2 grid w-[calc(100%-1.5rem)] grid-cols-3 bg-white">
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="design">Design</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>
          <TabsContent value="content" className="mt-0 max-h-[calc(100vh-12rem)] overflow-y-auto">
            {contentPanel}
          </TabsContent>
          <TabsContent value="design" className="mt-0 max-h-[calc(100vh-12rem)] overflow-y-auto">
            {designPanel}
          </TabsContent>
          <TabsContent value="preview" className="mt-0 max-h-[calc(100vh-12rem)] overflow-x-hidden overflow-y-auto">
            {preview}
          </TabsContent>
        </Tabs>
        {actionBar}
      </div>

      <PrivacyReview
        open={privacyOpen}
        onOpenChange={setPrivacyOpen}
        visibility={visibility}
        onVisibilityChange={setVisibility}
        onContinueExport={(vis) => void finishExport(vis)}
        onUsePrivateVersion={(vis) => void finishExport(vis)}
        onCancel={() => setPendingExport(null)}
      />

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent className="bg-[#FBF8F4]">
          <DialogHeader>
            <DialogTitle>Rename biodata</DialogTitle>
            <DialogDescription>Choose a clear title for your draft.</DialogDescription>
          </DialogHeader>
          <Input value={renameValue} onChange={(e) => setRenameValue(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-[#7027E8] hover:bg-[#5a1ec0]" onClick={() => void handleRename()}>
              Save name
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
              <Label htmlFor="share-watermark">Recipient watermark (optional)</Label>
              <Input
                id="share-watermark"
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
                <Label htmlFor="share-url">Link URL</Label>
                <div className="flex gap-2">
                  <Input id="share-url" readOnly value={shareUrl} className="font-mono text-xs" />
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

      <Dialog open={refreshOpen} onOpenChange={setRefreshOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto bg-[#FBF8F4] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Refresh from profile</DialogTitle>
            <DialogDescription>
              Select which changed fields to update in this biodata.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {profileDiffs.map((diff) => (
              <label
                key={diff.key}
                className="flex cursor-pointer gap-3 rounded-md border border-[#7027E8]/15 bg-white p-3"
              >
                <Checkbox
                  checked={selectedDiffs.has(diff.key)}
                  onCheckedChange={(v) => {
                    setSelectedDiffs((prev) => {
                      const next = new Set(prev);
                      if (v === true) next.add(diff.key);
                      else next.delete(diff.key);
                      return next;
                    });
                  }}
                />
                <div className="min-w-0 text-sm">
                  <p className="font-medium">{diff.label}</p>
                  <p className="truncate text-muted-foreground">Current: {diff.current}</p>
                  <p className="truncate text-[#7027E8]">New: {diff.incoming}</p>
                </div>
              </label>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRefreshOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-[#7027E8] hover:bg-[#5a1ec0]" onClick={applySelectedDiffs}>
              Apply selected
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={aiOpen} onOpenChange={setAiOpen}>
        <DialogContent className="bg-[#FBF8F4] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>AI assist — introduction</DialogTitle>
            <DialogDescription>
              Rewrites your text only — never invents new facts.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["improve", "Improve"],
                ["grammar", "Grammar"],
                ["shorter", "Shorter"],
                ["tone-warm", "Tone: warm"],
                ["tone-concise", "Tone: concise"],
                ["tone-formal", "Tone: formal"],
              ] as const
            ).map(([action, label]) => (
              <Button
                key={action}
                type="button"
                size="sm"
                variant="outline"
                disabled={aiBusy || !content.introduction.trim()}
                onClick={() => void runAiAssist(action)}
              >
                {label}
              </Button>
            ))}
          </div>
          {aiBusy ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Working…
            </div>
          ) : null}
          {aiUnavailable ? (
            <p className="text-sm text-[#FF6F72]">AI unavailable</p>
          ) : null}
          {aiProposed ? (
            <div className="space-y-2">
              <Label>Proposed text</Label>
              <Textarea value={aiProposed} readOnly rows={6} className="bg-white" />
              <Button
                className="bg-[#7027E8] hover:bg-[#5a1ec0]"
                onClick={() => {
                  withHistory(() => setContent((c) => ({ ...c, introduction: aiProposed })));
                  setAiOpen(false);
                  setAiProposed(null);
                }}
              >
                Apply
              </Button>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
