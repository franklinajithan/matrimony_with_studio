export const growthMilestones = ["signup_started", "account_created", "profile_published", "request_sent"] as const;
export type GrowthMilestone = (typeof growthMilestones)[number];

export const analyticsVisitKey = "cm_analytics_visit";

export function hasAnalyticsConsent() {
  return typeof document !== "undefined" && document.cookie.split("; ").includes("cm_analytics=yes");
}

export function recordGrowthMilestone(milestone: GrowthMilestone) {
  if (!hasAnalyticsConsent()) return;
  try {
    const stored = sessionStorage.getItem(analyticsVisitKey);
    if (!stored) return;
    const visit = JSON.parse(stored) as { id: string; last: number; started: number };
    const now = Date.now();
    if (now - visit.last >= 30 * 60_000 || now - visit.started >= 4 * 60 * 60_000) return;
    void fetch("/api/visitor-activity", {
      method: "POST", keepalive: true, body: JSON.stringify({ visit: visit.id, milestone }),
    }).catch(() => {});
  } catch { /* Analytics should never interrupt a member action. */ }
}
