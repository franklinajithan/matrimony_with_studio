"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { referringDomain, searchEngine } from "@/lib/analytics/referrers";
import { activityPage } from "@/lib/analytics/pages";
import { analyticsVisitKey as visitKey, hasAnalyticsConsent } from "@/lib/analytics/growth-events";
import { Button } from "@/components/ui/button";

const consentKey = "cm_analytics";
let attributedDocument = false;

function trafficSource(domain: string | undefined) {
  if (!document.referrer) return "Direct";
  if (!domain) return "Internal";
  const engine = searchEngine(domain);
  if (engine) return engine === "Google" || engine === "Bing" ? engine : "Other search";
  if (/(^|\.)(facebook\.com|instagram\.com|tiktok\.com|linkedin\.com|reddit\.com|t\.co|x\.com)$/.test(domain)) return "Social";
  return "Referral";
}

type Visit = { id: string; last: number; started: number; source: string; referrer?: string; referrerSaved?: boolean; campaign?: { channel: string; name: string } };

function campaignTag() {
  const params = new URLSearchParams(location.search);
  const source = params.get("utm_source")?.toLowerCase();
  const name = params.get("utm_campaign")?.toLowerCase();
  if (!source || !name || !/^[a-z0-9][a-z0-9_-]{0,47}$/.test(name)) return undefined;
  const channel = ["google", "instagram", "facebook", "whatsapp", "bing", "tiktok", "linkedin", "newsletter"]
    .includes(source) ? source : "other";
  return { channel, name };
}

function currentVisit(): Visit {
  const stored = sessionStorage.getItem(visitKey);
  if (stored) {
    const visit: Visit = JSON.parse(stored);
    if (Date.now() - visit.last < 30 * 60_000 && Date.now() - visit.started < 4 * 60 * 60_000) {
      attributedDocument = true;
      return visit;
    }
  }
  const referrer = attributedDocument ? undefined : referringDomain(document.referrer, location.hostname);
  const source = attributedDocument ? "Direct" : trafficSource(referrer);
  const campaign = attributedDocument ? undefined : campaignTag();
  attributedDocument = true;
  return { id: crypto.randomUUID(), last: Date.now(), started: Date.now(), source, referrer, campaign };
}

export function VisitorAnalytics() {
  const path = usePathname();
  useEffect(() => {
    const page = activityPage(path);
    if (!page || !hasAnalyticsConsent()) return;
    let visit: ReturnType<typeof currentVisit>;
    try { visit = currentVisit(); } catch { return; }
    let view = crypto.randomUUID();
    let seconds = 0;
    let visibleSince = document.hidden ? null : performance.now();
    function send() {
      if (!hasAnalyticsConsent()) return;
      const now = performance.now();
      if (visibleSince !== null) {
        seconds += Math.min(now - visibleSince, 20_000) / 1000;
        visibleSince = now;
      }
      if (!document.hidden || seconds > 0) {
        visit.last = Date.now();
        try { sessionStorage.setItem(visitKey, JSON.stringify(visit)); } catch { return; }
      }
      const sentVisit = visit;
      const referrer = sentVisit.referrerSaved ? undefined : sentVisit.referrer;
      void fetch("/api/visitor-activity", {
        method: "POST", keepalive: true,
        body: JSON.stringify({ visit: visit.id, view, page, source: visit.source, referrer, campaign: visit.campaign, seconds: Math.min(14400, Math.floor(seconds)) }),
      }).then(response => {
        if (!response.ok || !referrer || !hasAnalyticsConsent()) return;
        sentVisit.referrerSaved = true;
        const stored = JSON.parse(sessionStorage.getItem(visitKey) ?? "null") as Visit | null;
        if (stored?.id === sentVisit.id) sessionStorage.setItem(visitKey, JSON.stringify({ ...stored, referrerSaved: true }));
      }).catch(() => {});
    }
    function visibility() {
      if (document.hidden) {
        send();
        visibleSince = null;
      } else {
        if (Date.now() - visit.last >= 30 * 60_000 || Date.now() - visit.started >= 4 * 60 * 60_000) {
          try { visit = currentVisit(); } catch { return; }
          view = crypto.randomUUID();
          seconds = 0;
        }
        visibleSince = performance.now();
        send();
      }
    }
    if (!document.hidden) send();
    const timer = window.setInterval(() => { if (visibleSince !== null) send(); }, 15_000);
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("pagehide", send);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("pagehide", send);
      if (visibleSince !== null) send();
    };
  }, [path]);
  return null;
}

export function AnalyticsSettings() {
  const [enabled, setEnabled] = useState<boolean>();
  useEffect(() => setEnabled(hasAnalyticsConsent()), []);

  function choose(value: "yes" | "no") {
    document.cookie = `${consentKey}=${value}; Path=/; Max-Age=15552000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
    if (value === "no") {
      try { sessionStorage.removeItem(visitKey); } catch { /* Storage may be disabled. */ }
    }
    setEnabled(hasAnalyticsConsent());
  }

  if (enabled === undefined) return null;
  return <section aria-label="Analytics settings" className="space-y-3">
    <h2 className="font-semibold">Analytics settings</h2>
    <p role="status" className="text-sm">{enabled ? "Analytics are enabled." : "Analytics are off."}</p>
    <div className="flex flex-wrap items-center gap-2">
      <Button type="button" variant="outline" onClick={() => choose("no")}>Decline analytics</Button>
      <Button type="button" variant="outline" onClick={() => choose("yes")}>Allow analytics</Button>
    </div>
  </section>;
}
