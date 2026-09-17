"use client";

import * as React from "react";
import {
  Check,
  Copy,
  Facebook,
  Link2,
  Loader2,
  MessageCircle,
  Share2,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type ActiveLink = {
  id: string;
  expiresAt: string;
};

type CreatedShare = {
  linkId: string;
  url: string;
  expiresAt: string;
};

function absoluteShareUrl(pathOrUrl: string): string {
  if (pathOrUrl.startsWith("http")) return pathOrUrl;
  if (typeof window === "undefined") return pathOrUrl;
  return `${window.location.origin}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
}

export function ShareProfileButton({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [created, setCreated] = React.useState<CreatedShare | null>(null);
  const [active, setActive] = React.useState<ActiveLink[]>([]);
  const [copied, setCopied] = React.useState(false);

  const loadActive = React.useCallback(async () => {
    try {
      const res = await fetch("/api/profile-share", { method: "GET" });
      const data = (await res.json()) as { links?: { id: string; expiresAt: string }[]; error?: string };
      if (!res.ok) throw new Error(data.error || "Could not load links");
      setActive(
        (data.links || []).map((l) => ({
          id: l.id,
          expiresAt: l.expiresAt,
        }))
      );
    } catch {
      setActive([]);
    }
  }, []);

  const openDialog = async () => {
    setOpen(true);
    setCreated(null);
    setCopied(false);
    await loadActive();
  };

  const createLink = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/profile-share", { method: "POST" });
      const data = (await res.json()) as {
        linkId?: string;
        url?: string;
        path?: string;
        expiresAt?: string;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error || "Could not create share link");
      const url = absoluteShareUrl(data.url || data.path || "");
      const share: CreatedShare = {
        linkId: data.linkId!,
        url,
        expiresAt: data.expiresAt!,
      };
      setCreated(share);
      await loadActive();

      if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
        try {
          await navigator.share({
            title: "My CupidMatch profile",
            text: "View my profile on CupidMatch (link expires in 24 hours).",
            url,
          });
        } catch (err) {
          // User cancelled share sheet — keep dialog open with copy options.
          if (err instanceof DOMException && err.name === "AbortError") {
            /* ignore */
          }
        }
      }
    } catch (error) {
      toast({
        title: "Could not create share link",
        description: error instanceof Error ? error.message : "Try again.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const copyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({ title: "Link copied", description: "Anyone with the link can view it for 24 hours." });
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "Copy failed",
        description: "Select and copy the link manually.",
        variant: "destructive",
      });
    }
  };

  const revoke = async (linkId: string) => {
    setBusy(true);
    try {
      const res = await fetch("/api/profile-share", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ linkId }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Could not revoke");
      if (created?.linkId === linkId) setCreated(null);
      await loadActive();
      toast({ title: "Link revoked", description: "That share link no longer works." });
    } catch (error) {
      toast({
        title: "Could not revoke",
        description: error instanceof Error ? error.message : "Try again.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const shareUrl = created?.url;
  const encoded = shareUrl ? encodeURIComponent(shareUrl) : "";
  const shareText = shareUrl
    ? encodeURIComponent("View my CupidMatch profile (link expires in 24 hours): ")
    : "";

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size={compact ? "sm" : "default"}
        className={cn("rounded-xl border-[#dcc9d8]", className)}
        onClick={() => void openDialog()}
      >
        <Share2 className={cn("h-4 w-4", compact ? "mr-1" : "mr-2")} />
        Share
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share your profile</DialogTitle>
            <DialogDescription>
              Creates a temporary link that expires in exactly 24 hours. Only limited public details
              are shown. You can revoke a link anytime.
            </DialogDescription>
          </DialogHeader>

          {!shareUrl ? (
            <div className="space-y-4">
              <Button className="w-full rounded-xl" disabled={busy} onClick={() => void createLink()}>
                {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Link2 className="mr-2 h-4 w-4" />}
                Create 24-hour link
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl border border-[#eadce5] bg-[#fffaf6] p-3">
                <p className="break-all text-xs text-[#4a3a48]">{shareUrl}</p>
                <p className="mt-2 text-[11px] text-[#9b668f]">
                  Expires{" "}
                  {new Date(created.expiresAt).toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => void copyLink(shareUrl)}
                >
                  {copied ? <Check className="mr-1.5 h-4 w-4" /> : <Copy className="mr-1.5 h-4 w-4" />}
                  Copy link
                </Button>
                <Button
                  variant="outline"
                  className="rounded-xl"
                  asChild
                >
                  <a
                    href={`https://wa.me/?text=${shareText}${encoded}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle className="mr-1.5 h-4 w-4" />
                    WhatsApp
                  </a>
                </Button>
                <Button variant="outline" className="rounded-xl" asChild>
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encoded}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Facebook className="mr-1.5 h-4 w-4" />
                    Facebook
                  </a>
                </Button>
                <Button
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => {
                    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
                      void navigator.share({
                        title: "My CupidMatch profile",
                        text: "View my profile on CupidMatch (link expires in 24 hours).",
                        url: shareUrl,
                      });
                      return;
                    }
                    void copyLink(shareUrl);
                    toast({
                      title: "Link ready",
                      description: "Paste it into Messenger or any other app.",
                    });
                  }}
                >
                  <MessageCircle className="mr-1.5 h-4 w-4" />
                  Messenger
                </Button>
              </div>

              {typeof navigator !== "undefined" && typeof navigator.share === "function" ? (
                <Button
                  className="w-full rounded-xl"
                  variant="secondary"
                  onClick={() =>
                    void navigator.share({
                      title: "My CupidMatch profile",
                      text: "View my profile on CupidMatch (link expires in 24 hours).",
                      url: shareUrl,
                    })
                  }
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  More apps…
                </Button>
              ) : null}

              <Button
                variant="ghost"
                className="w-full rounded-xl text-destructive"
                disabled={busy}
                onClick={() => void revoke(created.linkId)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Revoke this link
              </Button>
            </div>
          )}

          {active.length > 0 ? (
            <div className="space-y-2 border-t pt-4">
              <p className="text-xs font-medium text-muted-foreground">Active links</p>
              <ul className="space-y-2">
                {active.map((link) => (
                  <li
                    key={link.id}
                    className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-xs"
                  >
                    <span className="text-muted-foreground">
                      Expires{" "}
                      {new Date(link.expiresAt).toLocaleString(undefined, {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 text-destructive"
                      disabled={busy}
                      onClick={() => void revoke(link.id)}
                    >
                      Revoke
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setOpen(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
