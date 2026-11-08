"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { activityPage } from "@/lib/analytics/pages";
import { Button } from "@/components/ui/button";

const consentKey = "cm_analytics";
const visitKey = "cm_analytics_visit";

function trafficSource() {
  if (!document.referrer) return "Direct";
  const host = new URL(document.referrer).hostname.toLowerCase();
  if (host === location.hostname) return "Internal";
  if (/^(www\.)?google\.[a-z.]+$/.test(host)) return "Google";
  if (/^(www\.)?bing\.com$/.test(host)) return "Bing";
  if (/(^|\.)(duckduckgo\.com|yahoo\.com|ecosia\.org)$/.test(host)) return "Other search";
  if (/(^|\.)(facebook\.com|instagram\.com|tiktok\.com|linkedin\.com|reddit\.com|t\.co|x\.com)$/.test(host)) return "Social";
  return "Referral";
}

type Visit = { id: string; last: number; started: number; source: string };

function currentVisit(): Visit {
  const stored = sessionStorage.getItem(visitKey);
  if (stored) {
    const visit: Visit = JSON.parse(stored);
    if (Date.now() - visit.last < 30 * 60_000 && Date.now() - visit.started < 4 * 60 * 60_000) return visit;
  }
  return { id: crypto.randomUUID(), last: Date.now(), started: Date.now(), source: trafficSource() };
}

export function VisitorAnalytics() {
  const path = usePathname();
  const [consent, setConsent] = useState<"yes" | "no" | "unset">();
  const [settings, setSettings] = useState(false);
  useEffect(() => {
    const stored = document.cookie.split("; ").find(value => value.startsWith(consentKey + "="));
    setConsent(stored === consentKey + "=yes" ? "yes" : stored === consentKey + "=no" ? "no" : "unset");
  }, []);
  useEffect(() => {
    const page = activityPage(path);
    if (consent !== "yes" || !page) return;
    let visit: ReturnType<typeof currentVisit>;
    try { visit = currentVisit(); } catch { return; }
    let view = crypto.randomUUID();
    let seconds = 0;
    let visibleSince = document.hidden ? null : performance.now();
    function send() {
      if (!document.cookie.split("; ").includes(consentKey + "=yes")) return;
      const now = performance.now();
      if (visibleSince !== null) {
        seconds += Math.min(now - visibleSince, 20_000) / 1000;
        visibleSince = now;
      }
      if (!document.hidden || seconds > 0) {
        visit.last = Date.now();
        try { sessionStorage.setItem(visitKey, JSON.stringify(visit)); } catch { return; }
      }
      void fetch("/api/visitor-activity", {
        method: "POST", keepalive: true,
        body: JSON.stringify({ visit: visit.id, view, page, source: visit.source, seconds: Math.min(14400, Math.floor(seconds)) }),
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
  }, [consent, path]);

  function choose(value: "yes" | "no") {
    document.cookie = `${consentKey}=${value}; Path=/; Max-Age=15552000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
    if (value === "no") {
      try { sessionStorage.removeItem(visitKey); } catch { /* Storage may be disabled. */ }
    }
    setConsent(value);
    setSettings(false);
  }

  if (path.startsWith("/admin") || !consent) return null;
  if (consent !== "unset" && !settings) {
    return <button type="button" onClick={() => setSettings(true)}
      className="fixed bottom-24 right-3 z-30 rounded-md border bg-card px-2 py-1 text-xs text-foreground shadow-sm md:bottom-3">Analytics settings</button>;
  }
  return <section aria-label="Optional visitor analytics" className="fixed inset-x-3 bottom-24 z-50 mx-auto max-w-xl space-y-3 rounded-xl border bg-card p-4 text-card-foreground shadow-lg md:bottom-4">
    <h2 className="font-semibold">Optional visitor analytics</h2>
    <p className="text-sm">Help us improve CupidMatch by sharing the pages you visit, approximate country, browser and estimated time on each page. Reports are kept for 30 days. Change your choice in Analytics settings.</p>
    <div className="flex flex-wrap items-center gap-2">
      <Button type="button" variant="outline" onClick={() => choose("no")}>Decline analytics</Button>
      <Button type="button" variant="outline" onClick={() => choose("yes")}>Allow analytics</Button>
      <Link className="px-2 text-sm underline" href="/analytics-privacy">Analytics privacy</Link>
    </div>
  </section>;
}
